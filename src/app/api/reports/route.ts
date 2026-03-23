import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';
import { getClientById } from '@/lib/db/repositories/clientRepo';
import { isConnected } from '@/lib/db/repositories/connectionRepo';
import { createReport } from '@/lib/db/repositories/reportRepo';
import { createJob } from '@/lib/db/repositories/jobRepo';
import { checkReportLimit, incrementReportCount } from '@/lib/utils/limits';
import { getPayloadCorrelationId, resolveCorrelationId, withCorrelationHeader } from '@/lib/observability/correlation';
import { logger } from '@/lib/utils/logger';
import { apiError, apiOk, fromUnknownError, parseJsonBody } from '@/lib/api-contract';

const generateReportSchema = z.object({
  clientId: z.string().uuid(),
  periodStart: z.string().transform((val) => new Date(val)),
  periodEnd: z.string().transform((val) => new Date(val)),
});

export async function GET(request: NextRequest) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const supabase = createSupabaseServiceClient();

    const { data: reports, error } = await supabase
      .from('reports')
      .select('*, clients!inner(name, agency_id)')
      .eq('clients.agency_id', agencyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return apiOk(reports);
  } catch (err: any) {
    logger.error({ err }, 'Reports GET failed');
    return fromUnknownError(err, 'Failed to list reports');
  }
}

export async function POST(request: NextRequest) {
  const requestCorrelationId = resolveCorrelationId(request);

  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    
    const { clientId, periodStart, periodEnd } = await parseJsonBody(request, generateReportSchema);

    // 3. Check usage limits
    const allowed = await checkReportLimit(null, agencyId);
    if (!allowed) {
      return apiError('LIMIT_REACHED', 'Monthly report limit reached. Please upgrade your plan.', 403);
    }

    // 4. Check client ownership
    const client = await getClientById(clientId, agencyId);
    if (!client) {
      return apiError('FORBIDDEN', 'Client not found or unauthorized', 403);
    }

    // 5. Check GA4 connection status
    const ga4Connected = await isConnected(clientId, 'ga4');
    if (!ga4Connected) {
      return apiError('GA4_NOT_CONNECTED', 'GA4 is not connected for this client', 400);
    }

    // 6. Create report record (Status is 'pending' initially)
    const report = await createReport(clientId, agencyId, periodStart, periodEnd);

    // 7. Insert into job_queue
    const job = await createJob({
      job_type: 'generate_report',
      agency_id: agencyId,
      client_id: clientId,
      report_id: report.id,
      payload: {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        correlationId: requestCorrelationId,
      },
    });

    const correlationId = getPayloadCorrelationId(job.payload) ?? requestCorrelationId;

    logger.info(
      { reportId: report.id, jobId: job.id, clientId, agencyId, correlationId },
      'Reports POST: generation job queued'
    );

    // 8. Increment report count
    await incrementReportCount(null, agencyId);

    // 9. Return immediately
    return apiOk(
      {
        success: true,
        reportId: report.id,
        jobId: job.id,
        status: 'queued',
        correlationId,
      },
      200,
      { headers: withCorrelationHeader(correlationId) }
    );

  } catch (err: any) {
    logger.error({ err, correlationId: requestCorrelationId }, 'Reports POST failed');
    return fromUnknownError(err, 'Failed to trigger report generation', {
      headers: withCorrelationHeader(requestCorrelationId),
    });
  }
}
