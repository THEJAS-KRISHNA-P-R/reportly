import { createSupabaseServiceClient } from '@/lib/db/client';
import { Pipeline, PipelineContext } from '../pipeline/pipeline';
import { logger } from '@/lib/utils/logger';
import { fetchDataStep } from '../pipeline/steps/fetchDataStep';
import { validateDataStep } from '../pipeline/steps/validateDataStep';
import { generateNarrativeStep } from '../pipeline/steps/generateNarrativeStep';
import { generateChartsStep } from '../pipeline/steps/generateChartsStep';
import { generatePDFStep } from '../pipeline/steps/generatePDFStep';
import { snapshotDataStep } from '../pipeline/steps/snapshotDataStep';
import { emailReportStep } from '@/lib/pipeline/steps/emailReportStep';
import { auditLogStep } from '@/lib/pipeline/steps/auditLogStep';
import { ReportPeriod } from '@/types/adapters';
import { updateReportStatus, resetReport } from '../db/repositories/reportRepo';
import {
  buildReportIdempotencyKey,
  buildReportJobIdentity,
  normalizeRunKey,
  updateJobStatus,
} from '../db/repositories/jobRepo';

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
    maxAttempts?: number;
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
  const maxAttempts = options?.maxAttempts ?? 3;
  const isLastAttempt = attempt >= maxAttempts;

  logger.info({ reportId, jobId, clientId, attempt, runKey, idempotencyKey, correlationId, isLastAttempt }, 'Report generation pipeline starting');

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
  pipeline.addStep('Snapshot Metrics', snapshotDataStep, true, 45_000); // Critical Persistence
  pipeline.addStep('Generate Narrative', generateNarrativeStep, true, 120_000); // Critical AI
  pipeline.addStep('Generate Charts', generateChartsStep, false, 60_000); // Non-critical fallback
  pipeline.addStep('Generate PDF', generatePDFStep, false, 180_000); // Non-critical fallback
  pipeline.addStep('Email Notification', emailReportStep, false, 45_000); // Agency notification
  pipeline.addStep('Audit Log', auditLogStep, false, 20_000); // Final audit (never blocks)

  try {
    const generationStartedAt = new Date().toISOString();

    await updateReportStatus(reportId, agencyId, 'generating' as any, {
      generation_started_at: generationStartedAt,
    });
    
    // Initial Progress
    await createSupabaseServiceClient()
      .from('reports')
      .update({ 
        current_step: { name: 'Initializing Pipeline', percentage: 5, status: 'in_progress' } 
      })
      .eq('id', reportId);

    await updateJobStatus(jobId, 'processing', {
      started_at: generationStartedAt,
      attempts: attempt,
      last_error: null,
    }, leaseOwnerToken ? {
      leaseOwnerToken,
      expectedCurrentStatus: 'processing',
    } : undefined);

    // Helper to update progress during pipeline
    const setProgress = async (name: string, percentage: number) => {
      await createSupabaseServiceClient()
        .from('reports')
        .update({ current_step: { name, percentage, status: 'in_progress' } })
        .eq('id', reportId);
    };

    // 9. Execute steps with manual progress tracking (inter-step)
    // Note: We could wrap each step but a simple manual toggle is safer for now.
    await setProgress('Fetching Analytics...', 15);
    // ... pipeline.run handles the actual loop, but we can't easily hook into its internal loop without changing Pipeline class.
    // For now we'll just run the pipeline.
    await pipeline.run(context);

    await updateReportStatus(reportId, agencyId, 'draft', {
      current_step: { name: 'Completed', percentage: 100, status: 'success' }
    } as any);
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
      if (isLastAttempt) {
        await updateReportStatus(reportId, agencyId, 'failed', { cancelled_reason: error.message });
      } else {
        // Transitional retry state in reports table
        await createSupabaseServiceClient()
          .from('reports')
          .update({ 
            current_step: { 
              name: `Retrying (Attempt ${attempt}/${maxAttempts})...`, 
              percentage: 0, 
              status: 'in_progress',
              last_error: error.message.slice(0, 500)
            } 
          })
          .eq('id', reportId);
        
        // Clean up partial data before retry to ensure idempotency
        await resetReport(reportId, agencyId);
      }
    } catch (statusErr: any) {
      logger.error({ reportId, err: statusErr.message }, 'Failed to update report status during failure');
    }

    throw error;
  }
}
