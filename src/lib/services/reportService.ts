import { Pipeline, PipelineContext } from '@/lib/pipeline/pipeline';
import { fetchDataStep } from '@/lib/pipeline/steps/fetchDataStep';
import { validateDataStep } from '@/lib/pipeline/steps/validateDataStep';
import { generateNarrativeStep } from '@/lib/pipeline/steps/generateNarrativeStep';
import { generatePDFStep } from '@/lib/pipeline/steps/generatePDFStep';
import { createReportStep } from '@/lib/pipeline/steps/createReportStep';
import { ReportPeriod } from '@/types/adapters';
import { reportExistsForPeriod, updateReportStatus } from '@/lib/db/repositories/reportRepo';
import { ReportlyError } from '@/types/errors';

export async function runReportGeneration(
  clientId: string,
  agencyId: string,
  period: ReportPeriod
): Promise<string> {
  // 1. Idempotency check
  const exists = await reportExistsForPeriod(clientId, period.start, period.end);
  if (exists) {
    throw new ReportlyError('DUPLICATE_REPORT', 'Report already exists', 'A report for this period is already being processed.', 409);
  }

  const context: PipelineContext = {
    clientId,
    agencyId,
    period,
  };

  const pipeline = new Pipeline();

  // Define steps
  pipeline.addStep('Create Report', createReportStep);    // Step 1: Initialize DB record
  pipeline.addStep('Fetch Data', fetchDataStep);        // Step 2: External API (Critical)
  pipeline.addStep('Validate Data', validateDataStep);  // Step 3: Check quality (Critical threshold)
  pipeline.addStep('Generate Narrative', generateNarrativeStep, false); // Step 4: AI (Non-critical fallback)
  pipeline.addStep('Generate PDF', generatePDFStep, false); // Step 5: PDF (Non-critical fallback)

  try {
    await pipeline.run(context);
    
    if (context.reportId) {
      await updateReportStatus(context.reportId, 'draft', { generation_started_at: new Date().toISOString() });
      return context.reportId;
    }
    throw new Error('Pipeline finished but no reportId generated');
  } catch (error: any) {
    if (context.reportId) {
      await updateReportStatus(context.reportId, 'failed', { cancelled_reason: error.message });
    }
    throw error;
  }
}
