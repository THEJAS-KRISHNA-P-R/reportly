import { PipelineContext } from '../pipeline';
import { createAuditLog } from '@/lib/db/repositories/auditRepo';
import { logger } from '@/lib/utils/logger';

/**
 * Final step in the pipeline to record the overall success.
 * This ensures the audit_logs table has a 'completed' footprint.
 */
export async function auditLogStep(context: PipelineContext): Promise<void> {
  if (!context.reportId) return;

  try {
    await createAuditLog(
      context.reportId,
      context.agencyId,
      'pipeline_completed',
      {
        timestamp: new Date().toISOString(),
        hasNarrative: !!context.narrativeResult,
        hasValidation: !!context.validationResult,
        confidence: context.validationResult?.confidence || 0,
        source: context.narrativeResult?.source || 'unknown'
      },
      {
        correlationId: context.correlationId,
        pipelineStep: 'Audit Log',
        jobId: context.jobId,
      }
    );
    
    logger.info({ reportId: context.reportId, correlationId: context.correlationId }, 'Pipeline Audit Log Finalized');
  } catch (error: any) {
    logger.error({ err: error.message, reportId: context.reportId, correlationId: context.correlationId }, 'Audit Log Step Failed');
  }
}
