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
    // A. Transition report and job to 'generating' / 'processing'
    await updateReportStatus(reportId, 'generating' as any); // 'generating' is our internal progress state
    await updateJobStatus(jobId, 'processing', { 
        started_at: new Date().toISOString(),
        attempts: 1 
    });

    // B. Run the actual pipeline
    await pipeline.run(context);
    
    // C. Success: Finalize report to 'draft'
    await updateReportStatus(reportId, 'draft', { generation_started_at: new Date().toISOString() });
    await updateJobStatus(jobId, 'completed', { completed_at: new Date().toISOString() });
    
  } catch (error: any) {
    // D. Failure: Update report and job to 'failed'
    logger.error({ reportId, err: error.message }, 'Report Generation Pipeline Failed');
    
    await updateReportStatus(reportId, 'failed', { cancelled_reason: error.message });
    await updateJobStatus(jobId, 'failed', { 
      last_error: error.message, 
      completed_at: new Date().toISOString() 
    });

    // Write failure to audit log specifically as 'validation_failure' if relevant, or 'ai_failure'
    // This is handled within steps for specific failures, but here is the final catch-all.
    throw error;
  }
}
