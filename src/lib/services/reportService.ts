import { Pipeline, PipelineContext } from '@/lib/pipeline/pipeline';
import { logger } from '@/lib/utils/logger';
import { fetchDataStep } from '@/lib/pipeline/steps/fetchDataStep';
import { validateDataStep } from '@/lib/pipeline/steps/validateDataStep';
import { generateNarrativeStep } from '@/lib/pipeline/steps/generateNarrativeStep';
import { generateChartsStep } from '@/lib/pipeline/steps/generateChartsStep';
import { generatePDFStep } from '@/lib/pipeline/steps/generatePDFStep';
import { snapshotDataStep } from '@/lib/pipeline/steps/snapshotDataStep';
import { emailReportStep } from '@/lib/pipeline/steps/emailReportStep';
import { auditLogStep } from '@/lib/pipeline/steps/auditLogStep';
import { ReportPeriod } from '@/types/adapters';
import { updateReportStatus } from '@/lib/db/repositories/reportRepo';
import {
  buildReportIdempotencyKey,
  buildReportJobIdentity,
  normalizeRunKey,
  updateJobStatus,
} from '@/lib/db/repositories/jobRepo';

/**
 * Orchestrates the full report generation pipeline:
 * Fetch -> Validate -> AI -> Charts -> PDF -> Audit
 */
export async function runReportGeneration(
  clientId: string,
  agencyId: string,
  period: ReportPeriod,
  reportId: string,
  jobId: string,
  options?: {
    mock?: boolean;
    attempt?: number;
    runKey?: string;
    idempotencyKey?: string;
    jobLeaseOwnerToken?: string;
    correlationId?: string;
  }
): Promise<void> {
  const attempt = Math.max(1, options?.attempt ?? 1);
  const runKey = normalizeRunKey(options?.runKey);
  const idempotencyKey =
    options?.idempotencyKey ??
    buildReportIdempotencyKey(
      buildReportJobIdentity({
        clientId,
        periodStartIso: period.start.toISOString(),
        periodEndIso: period.end.toISOString(),
        runKey,
      })
    );
  const leaseOwnerToken = options?.jobLeaseOwnerToken;
  const correlationId = options?.correlationId;

  logger.info({ reportId, jobId, clientId, attempt, runKey, idempotencyKey, correlationId }, 'Report generation pipeline starting');

  const context: PipelineContext = {
    clientId,
    agencyId,
    period,
    reportId,
    jobId,
    attempt,
    correlationId,
    runKey,
    idempotencyKey,
    mock: options?.mock,
  };

  const pipeline = new Pipeline();

  // 1. Define Pipeline Steps
  pipeline.addStep('Fetch Data', fetchDataStep, true, 90_000); // Critical
  pipeline.addStep('Validate Data', validateDataStep, true, 30_000); // Critical
  pipeline.addStep('Snapshot Metrics', snapshotDataStep, false, 45_000); // Persistence
  pipeline.addStep('Generate Narrative', generateNarrativeStep, false, 120_000); // Non-critical fallback
  pipeline.addStep('Generate Charts', generateChartsStep, false, 60_000); // Non-critical fallback
  pipeline.addStep('Generate PDF', generatePDFStep, false, 180_000); // Non-critical fallback
  pipeline.addStep('Email Notification', emailReportStep, false, 45_000); // Agency notification
  pipeline.addStep('Audit Log', auditLogStep, false, 20_000); // Final audit (never blocks)

  try {
    const generationStartedAt = new Date().toISOString();

    await updateReportStatus(reportId, 'generating' as any, {
      generation_started_at: generationStartedAt,
    });
    await updateJobStatus(jobId, 'processing', {
      started_at: generationStartedAt,
      attempts: attempt,
      last_error: null,
    }, leaseOwnerToken ? {
      leaseOwnerToken,
      expectedCurrentStatus: 'processing',
    } : undefined);

    await pipeline.run(context);

    await updateReportStatus(reportId, 'draft');
    await updateJobStatus(jobId, 'completed', {
      completed_at: new Date().toISOString(),
      attempts: attempt,
      last_error: null,
      bull_job_id: null,
    }, leaseOwnerToken ? {
      leaseOwnerToken,
      expectedCurrentStatus: 'processing',
    } : undefined);

    logger.info({ reportId, jobId, attempt, runKey, idempotencyKey, correlationId }, 'Report generation pipeline completed');
    
  } catch (error: any) {
    logger.error({ reportId, jobId, attempt, correlationId, err: error.message }, 'Report generation pipeline failed');

    try {
      await updateReportStatus(reportId, 'failed', { cancelled_reason: error.message });
      await updateJobStatus(jobId, 'failed', {
        attempts: attempt,
        last_error: error.stack ? error.stack : error.message,
        completed_at: new Date().toISOString(),
        bull_job_id: null,
      }, leaseOwnerToken ? {
        leaseOwnerToken,
        expectedCurrentStatus: 'processing',
      } : undefined);
    } catch (statusErr: any) {
      logger.error({ reportId, err: statusErr.message }, 'Failed to transition to failed status');
    }

    throw error;
  }
}
