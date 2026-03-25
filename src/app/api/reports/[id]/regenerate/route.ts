import { NextRequest } from 'next/server';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';
import { getReportById, resetReport } from '@/lib/db/repositories/reportRepo';
import { createJob } from '@/lib/db/repositories/jobRepo';
import { apiError, apiOk } from '@/lib/api-contract';
import { logger } from '@/lib/utils/logger';

/**
 * Manually trigger a report regeneration.
 * This resets the report status to 'pending' and queues a new generation job.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 1. Verify Authentication & Agency Identity
    const { agencyId } = await getAuthenticatedAgency(req);

    // 2. Fetch report via Service Role (bypassing RLS with agency validation)
    const report = await getReportById(id, agencyId);

    if (!report) {
      return apiError('NOT_FOUND', 'Report not found or unauthorized', 404);
    }

    // 3. Reset report record (clears narratives and sets status to pending)
    await resetReport(id, agencyId);

    // 4. Queue new generation job
    const job = await createJob({
      job_type: 'generate_report',
      agency_id: agencyId,
      client_id: report.client_id,
      report_id: id,
      payload: {
        periodStart: report.period_start,
        periodEnd: report.period_end,
        mock: false, // Always real on manual regen
      },
    });

    // 5. Add to BullMQ
    const { reportQueue } = await import('@/lib/queue/client');
    await reportQueue.add('generate-report', {
      jobId: job.id,
      clientId: report.client_id,
      agencyId: agencyId,
      reportId: id,
      payload: job.payload,
    }, {
      // Periodic identifier for idempotency in the queue
      jobId: `regen-${id}-${Date.now()}`,
    });

    logger.info({ reportId: id, agencyId, jobId: job.id }, 'Manual regeneration triggered');

    return apiOk({ 
      success: true, 
      jobId: job.id 
    });

  } catch (error: any) {
    logger.error({ err: error.message, reportId: id }, 'Manual Regeneration Error');
    return apiError('INTERNAL_ERROR', error.message, 500);
  }
}
