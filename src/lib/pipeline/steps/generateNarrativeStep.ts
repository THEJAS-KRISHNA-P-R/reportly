import { PipelineContext } from '../pipeline';
import { generateNarrative } from '@/lib/modules/ai';
import { createAuditLog } from '@/lib/db/repositories/auditRepo';
import { updateReportNarrative, updateReportProgress } from '@/lib/db/repositories/reportRepo';
import { sanitizeNarrative } from '@/lib/security/sanitizer';

export async function generateNarrativeStep(context: PipelineContext): Promise<void> {
  if (context.reportId) {
    await updateReportProgress(context.reportId, context.agencyId, 'Synthesizing AI Insights...', 75);
  }
  if (!context.validationResult) {
    throw new Error('validationResult missing in pipeline context');
  }

  const result = await generateNarrative(context.validationResult);
  context.narrativeResult = result;

  if (context.reportId) {
    // Audit choice
    if (result.source === 'claude' || result.source === 'gemini') {
      await createAuditLog(context.reportId, context.agencyId, 'ai_response', { 
        source: result.source, 
        output: result.content 
      }, {
        correlationId: context.correlationId,
        pipelineStep: 'Generate Narrative',
        jobId: context.jobId,
      });
    } else {
      await createAuditLog(context.reportId, context.agencyId, 'fallback_activated', { 
        reason: 'AI failed or rejected' 
      }, {
        correlationId: context.correlationId,
        pipelineStep: 'Generate Narrative',
        jobId: context.jobId,
      });
    }

    // Update report with the generated narrative
    await updateReportNarrative(
      context.reportId,
      context.agencyId,
      sanitizeNarrative(result.content),
      result.source,
      result.rawAiOutput || '',
      result.source === 'rule_based' ? result.content : null,
      {
        ...context.validationResult.confidence,
        score: result.confidenceScore // Persist the calculated fidelity score
      }
    );
  }
}
