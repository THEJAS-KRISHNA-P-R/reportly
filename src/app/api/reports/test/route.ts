import { z } from 'zod';
import { createReport } from '@/lib/db/repositories/reportRepo';
import { createJob } from '@/lib/db/repositories/jobRepo';
import { runReportGeneration } from '@/lib/services/reportService';
import { logger } from '@/lib/utils/logger';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { getPayloadCorrelationId, resolveCorrelationId, withCorrelationHeader } from '@/lib/observability/correlation';
import { apiError, apiOk, fromUnknownError, parseJsonBody } from '@/lib/api-contract';

const reportsTestSchema = z.object({
  clientId: z.string().min(1),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  mock: z.boolean().optional(),
}).strict();

/**
 * POST /api/reports/test
 * Triggers a real report generation for a client.
 * Use this to verify the pipeline, AI models, and PDF generation.
 */
export async function POST(request: Request) {
  const requestCorrelationId = resolveCorrelationId(request);

  try {
    const body = await parseJsonBody(request, reportsTestSchema);
    const { clientId, periodStart: start, periodEnd: end } = body;

    if (!clientId || !start || !end) {
      return apiError('VALIDATION_ERROR', 'Missing clientId, periodStart, or periodEnd', 400);
    }

    const db = createSupabaseServiceClient();

    // 1. Get agency_id from the client
    const { data: client, error: clientError } = await db
      .from('clients')
      .select('id, agency_id')
      .eq('id', clientId)
      .maybeSingle();

    if (!client) {
      return apiError('NOT_FOUND', 'Client not found', 404);
    }

    const agencyId = client.agency_id;
    const dateStart = start.split('T')[0];
    const dateEnd = end.split('T')[0];
    const label = new Date(start).toLocaleString('default', { month: 'long', year: 'numeric' });

    // 2. Clear clean: Delete any existing report for this exact period. 
    // Since FKs are CASCADE in DB, this wipes audit_logs, job_queue, etc.
    logger.info({ clientId, dateStart, dateEnd }, 'Cleaning existing test reports to ensure fresh cycle');
    const { error: deleteError } = await db
      .from('reports')
      .delete()
      .eq('client_id', clientId)
      .eq('period_start', dateStart)
      .eq('period_end', dateEnd);

    if (deleteError) {
      logger.error({ err: deleteError.message }, 'Failed to clear existing reports');
      return apiError('DB_ERROR', `[cleanup] ${deleteError.message}`, 500);
    }

    // 3. Create fresh record
    const { data: report, error: createError } = await db
      .from('reports')
      .insert({
        client_id:        clientId,
        agency_id:        agencyId,
        period_start:     dateStart,
        period_end:       dateEnd,
        status:           'pending',
        prompt_version:   'v1.0',
        template_version: 'v1.0',
        logic_version:    'v1.0',
      })
      .select()
      .single();

    if (createError || !report) {
      logger.error({ err: createError?.message }, 'Failed to create fresh report record');
      return apiError('DB_ERROR', '[createReport] ' + (createError?.message || 'Failed to create report'), 500);
    }

    const reportId = report.id;
    logger.info({ reportId }, 'Fresh test report record established');

    // 4. Create an orchestration job
    const job = await createJob({
      job_type: 'generate_report',
      agency_id: agencyId,
      client_id: clientId,
      report_id: reportId,
      payload: {
        test: true,
        periodStart: new Date(start).toISOString(),
        periodEnd: new Date(end).toISOString(),
        correlationId: requestCorrelationId,
      }
    });

    const correlationId = getPayloadCorrelationId(job.payload) ?? requestCorrelationId;

    logger.info({ jobId: job.id, reportId, correlationId }, 'Generation job queued');

    const periodStart = new Date(start);
    const periodEnd = new Date(end);

    // 5. Run generation pipeline (Async trigger)
    const mock = body.mock === true;
    runReportGeneration(clientId, agencyId, { start: periodStart, end: periodEnd, label }, reportId, job.id, {
      mock,
      correlationId,
    });

    return apiOk(
      {
        success: true,
        reportId: reportId,
        jobId: job.id,
        mock: mock,
        message: `Test sequence initiated successfully${mock ? ' (MOCK MODE)' : ''}`,
        correlationId,
      },
      200,
      { headers: withCorrelationHeader(correlationId) }
    );

  } catch (error: any) {
    logger.error({ err: error.message, correlationId: requestCorrelationId }, 'Report test trigger critical failure');
    const response = fromUnknownError(error, 'Critical fault in test trigger');
    response.headers.set('x-correlation-id', requestCorrelationId);
    return response;
  }
}
