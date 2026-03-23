import { NextResponse } from 'next/server';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';
import { getReportById, resetReport } from '@/lib/db/repositories/reportRepo';
import { createJob } from '@/lib/db/repositories/jobRepo';
import { logger } from '@/lib/utils/logger';
import { getPayloadCorrelationId, resolveCorrelationId, withCorrelationHeader } from '@/lib/observability/correlation';

/**
 * Triggers regeneration of an existing report.
 * Resets the report row and adds a new job to the queue.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestCorrelationId = resolveCorrelationId(request);

  try {
    const { id: reportId } = await params;
    const { agencyId } = await getAuthenticatedAgency(request);

    // 1. Verify ownership
    const report = await getReportById(reportId, agencyId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found or unauthorized' }, { status: 404 });
    }

    // 2. Reset report record
    await resetReport(reportId);
    logger.info({ reportId }, 'Report record reset for regeneration');

    // 3. Queue new generation job
    const runKey = `manual-regenerate-${Date.now()}`;
    const job = await createJob({
      job_type: 'generate_report',
      agency_id: agencyId,
      client_id: report.client_id,
      report_id: reportId,
      run_key: runKey,
      payload: {
        regenerate: true,
        triggered_by: 'manual',
        runKey,
        correlationId: requestCorrelationId,
        periodStart: new Date(report.period_start).toISOString(),
        periodEnd: new Date(report.period_end).toISOString(),
      }
    });

    const correlationId = getPayloadCorrelationId(job.payload) ?? requestCorrelationId;

    logger.info({ reportId, jobId: job.id, correlationId }, 'Regeneration job queued');

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Regeneration process started',
      correlationId,
    }, { headers: withCorrelationHeader(correlationId) });

  } catch (error: any) {
    logger.error({ err: error.message, reportId: (await params).id, correlationId: requestCorrelationId }, 'Regeneration trigger failed');
    return NextResponse.json(
      { error: error.message || 'Failed to trigger regeneration' },
      { status: 500, headers: withCorrelationHeader(requestCorrelationId) }
    );
  }
}
