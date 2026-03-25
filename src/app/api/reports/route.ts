import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';
import { getClientById } from '@/lib/db/repositories/clientRepo';
import { isConnected } from '@/lib/db/repositories/connectionRepo';
import { createReport, getReportsByAgency } from '@/lib/db/repositories/reportRepo';
import { createJob } from '@/lib/db/repositories/jobRepo';
import { checkReportLimit, incrementReportCount } from '@/lib/utils/limits';
import { getPayloadCorrelationId, resolveCorrelationId, withCorrelationHeader } from '@/lib/observability/correlation';
import { logger } from '@/lib/utils/logger';
import { apiError, apiOk, fromUnknownError, parseJsonBody } from '@/lib/api-contract';
import { redis } from '@/lib/redis';

const generateReportSchema = z.object({
  clientId: z.string().uuid(),
  periodStart: z.string().transform((val) => new Date(val)),
  periodEnd: z.string().transform((val) => new Date(val)),
  mock: z.boolean().optional().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const { searchParams } = new URL(request.url);
    
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    const reports = await getReportsByAgency(agencyId, limit, offset);
    
    return apiOk({
      reports,
      pagination: {
        page,
        limit,
        count: reports.length, // SOTA note: For true pagination, we'd need a separate count query or and and and use Supabase count: 'exact'
      }
    });
  } catch (err: any) {
    logger.error({ err }, 'Reports GET failed');
    return fromUnknownError(err, 'Failed to list reports');
  }
}

export async function POST(request: NextRequest) {
  const requestCorrelationId = resolveCorrelationId(request);

  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    
    const { clientId, periodStart, periodEnd, mock } = await parseJsonBody(request, generateReportSchema);

    // 1. Rate Limiting Check (60s cooldown per client per agency)
    const rateLimitKey = `rate-limit:report:${agencyId}:${clientId}`;
    const acquired = await redis.setnx(rateLimitKey, '1');
    if (!acquired) {
      return apiError('TOO_MANY_REQUESTS', 'Please wait 60 seconds before generating another report for this property', 429);
    }
    // Set 60 second expiry
    await redis.expire(rateLimitKey, 60);

    // 2. Strict Idempotency Check - REMOVED per user request to allow multiple reports per month
    // We still have the 60s rate limit per client above to prevent accidental triple-clicks.

    const supabase = createSupabaseServiceClient();

    // 3. Check usage limits
    const allowed = await checkReportLimit(supabase, agencyId);
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

    // 6. Database Check & Create (Idempotency and reuse logic)
    const { data: existing } = await supabase
      .from('reports')
      .select('id, status')
      .eq('client_id', clientId)
      .eq('period_start', periodStart.toISOString())
      .eq('period_end', periodEnd.toISOString());

    // Filter for active reports (not failed/cancelled)
    const activeReport = existing?.find(r => !['failed', 'cancelled'].includes(r.status));

    let reportId: string;
    
    if (activeReport) {
      // RULE: Only one active report per client/month. Block if active exists.
      return apiError('CONFLICT', `A valid report for this period is already in ${activeReport.status} state.`, 409);
    } else {
      // If no active report exists (but maybe failed ones do), we can create a new one.
      const report = await createReport(clientId, agencyId, periodStart, periodEnd);
      reportId = report.id;
    }

    // 7. Insert into job_queue
    const job = await createJob({
      job_type: 'generate_report',
      agency_id: agencyId,
      client_id: clientId,
      report_id: reportId,
      payload: {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        correlationId: requestCorrelationId,
        mock,
      },
    });

    // --- BULLMQ INTEGRATION ---
    const { reportQueue } = await import('@/lib/queue/client');
    await reportQueue.add('generate-report', {
      jobId: job.id,
      clientId: clientId,
      agencyId: agencyId,
      reportId: reportId,
      payload: job.payload,
    }, {
      // Use reportId to ensure every trigger gets a unique job in BullMQ
      jobId: `report-${reportId}`,
    });

    const correlationId = getPayloadCorrelationId(job.payload) ?? requestCorrelationId;

    logger.info(
      { reportId: reportId, jobId: job.id, clientId, agencyId, correlationId },
      'Reports POST: generation job queued to BullMQ'
    );

    // 8. Increment report count
    await incrementReportCount(supabase, agencyId);

    // 9. Return immediately
    return apiOk(
      {
        success: true,
        reportId: reportId,
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
