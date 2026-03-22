import { Pipeline, PipelineContext } from '@/lib/pipeline/pipeline';
import { logger } from '@/lib/utils/logger';
import { fetchDataStep } from '@/lib/pipeline/steps/fetchDataStep';
import { validateDataStep } from '@/lib/pipeline/steps/validateDataStep';
import { generateNarrativeStep } from '@/lib/pipeline/steps/generateNarrativeStep';
import { generateChartsStep } from '@/lib/pipeline/steps/generateChartsStep';
import { generatePDFStep } from '@/lib/pipeline/steps/generatePDFStep';
import { auditLogStep } from '@/lib/pipeline/steps/auditLogStep';
import { ReportPeriod } from '@/types/adapters';
import { updateReportStatus } from '@/lib/db/repositories/reportRepo';
import { updateJobStatus } from '@/lib/db/repositories/jobRepo';

/**
 * Orchestrates the full report generation pipeline:
 * Fetch -> Validate -> AI -> Charts -> PDF -> Audit
 */
export async function runReportGeneration(
  clientId: string,
  agencyId: string,
  period: ReportPeriod,
  reportId: string,
  jobId: string
): Promise<void> {
  console.error('[DEBUG] Pipeline starting for:', reportId);
  const context: PipelineContext = {
    clientId,
    agencyId,
    period,
    reportId,
  };

  const pipeline = new Pipeline();

  // 1. Define Pipeline Steps
  pipeline.addStep('Fetch Data', fetchDataStep, true);        // Critical
  pipeline.addStep('Validate Data', validateDataStep, true);  // Critical
  pipeline.addStep('Generate Narrative', generateNarrativeStep, false); // Non-critical fallback
  pipeline.addStep('Generate Charts', generateChartsStep, false); // Non-critical fallback
  pipeline.addStep('Generate PDF', generatePDFStep, false); // Non-critical fallback
  pipeline.addStep('Audit Log', auditLogStep, false); // Final audit (never blocks)

  try {
    console.error('[DEBUG] About to run: Status Update (generating)');
    try {
      await updateReportStatus(reportId, 'generating' as any); // pending -> generating
      await updateJobStatus(jobId, 'processing', { 
          started_at: new Date().toISOString(),
          attempts: 1 
      });
      console.error('[DEBUG] Completed: Status Update (generating)');
    } catch (statusErr: any) {
      console.error('[DEBUG] FAILED: Status Update (generating)', statusErr);
      logger.error({ reportId, err: statusErr.message }, 'Failed to transition to generating');
      throw statusErr;
    }

    console.error('[DEBUG] About to run: pipeline.run');
    try {
      await pipeline.run(context);
      console.error('[DEBUG] Completed: pipeline.run');
    } catch (e: any) {
      console.error('[DEBUG] FAILED: pipeline.run', e);
      throw e;
    }
    
    console.error('[DEBUG] About to run: Status Update (draft)');
    try {
      await updateReportStatus(reportId, 'draft', { generation_started_at: new Date().toISOString() });
      await updateJobStatus(jobId, 'completed', { completed_at: new Date().toISOString() });
      console.error('[DEBUG] Completed: Status Update (draft)');
    } catch (statusErr: any) {
      console.error('[DEBUG] FAILED: Status Update (draft)', statusErr);
      logger.error({ reportId, err: statusErr.message }, 'Failed to transition to draft');
    }
    
  } catch (error: any) {
    logger.error({ reportId, err: error.message }, 'Report Generation Pipeline Failed');
    
    console.error('[DEBUG] About to run: Status Update (failed)');
    try {
      await updateReportStatus(reportId, 'failed', { cancelled_reason: error.message });
      await updateJobStatus(jobId, 'failed', { 
        last_error: error.message, 
        completed_at: new Date().toISOString() 
      });
      console.error('[DEBUG] Completed: Status Update (failed)');
    } catch (statusErr: any) {
      console.error('[DEBUG] FAILED: Status Update (failed)', statusErr);
      logger.error({ reportId, err: statusErr.message }, 'Failed to transition to failed status');
    }

    throw error;
  }
}
