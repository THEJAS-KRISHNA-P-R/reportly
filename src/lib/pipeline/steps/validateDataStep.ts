import { PipelineContext } from '../pipeline';
import { validateMetrics } from '@/lib/validators/metricValidator';
import { createAuditLog } from '@/lib/db/repositories/auditRepo';
import { ReportlyError } from '@/types/errors';

export async function validateDataStep(context: PipelineContext): Promise<void> {
  if (!context.fetchResult) {
    throw new Error('fetchResult missing in pipeline context');
  }

  // Find prior metrics if available (future: fetch prior period from DB)
  // For now, pass null for prior to calculate basic status
  const validationResult = validateMetrics(context.fetchResult.metrics, null);
  context.validationResult = validationResult;

  if (context.reportId) {
    await createAuditLog(
      context.reportId,
      context.agencyId,
      'validation',
      {
        passed: validationResult.passedValidation,
        warnings: validationResult.warnings,
        validated: validationResult.validated
      }
    );
  }

  // Critical Path Rule: Block if >50% metrics are unreliable
  if (!validationResult.passedValidation) {
    if (context.reportId) {
       await createAuditLog(context.reportId, context.agencyId, 'validation_failure', { reason: 'Over 50% metrics failed validation' });
    }
    throw new ReportlyError(
      'VALIDATION_FAILED',
      'Data quality too low for report generation',
      'More than 50% of analytics metrics are missing or unreliable. Report blocked for accuracy.',
      422
    );
  }
}
