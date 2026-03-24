import { PipelineContext } from '../pipeline';
import { validateMetrics } from '@/lib/validators/metricValidator';
import { createAuditLog } from '@/lib/db/repositories/auditRepo';
import { ReportlyError } from '@/types/errors';
import { updateReportProgress } from '@/lib/db/repositories/reportRepo';

export async function validateDataStep(context: PipelineContext): Promise<void> {
  if (context.reportId) {
    await updateReportProgress(context.reportId, context.agencyId, 'Verifying Metric Accuracy', 35);
  }
  if (!context.fetchResult) {
    throw new Error('fetchResult missing in pipeline context');
  }

  // Use prior metrics if available from fetch (PoP)
  const validationResult = validateMetrics(
    context.fetchResult.metrics, 
    context.fetchResult.priorMetrics || null
  );
  context.validationResult = validationResult;

  if (context.reportId) {
    await createAuditLog(
      context.reportId,
      context.agencyId,
      'validation',
      {
        passed: validationResult.passedValidation,
        retrievedAt: context.fetchResult.retrievedAt,
        warnings: validationResult.warnings,
        validated: validationResult.validated,
        breakdown: context.fetchResult.metrics?.breakdown,
        freshnessStatus: context.fetchResult.metrics?.freshness || 'fresh',
      },
      {
        correlationId: context.correlationId,
        pipelineStep: 'Validate Data',
        jobId: context.jobId,
      }
    );
  }

  // Critical Path Rule: Block if >50% metrics are unreliable
  if (!validationResult.passedValidation) {
    if (context.reportId) {
       await createAuditLog(
         context.reportId,
         context.agencyId,
         'validation_failure',
         { reason: 'Over 50% metrics failed validation' },
         {
           correlationId: context.correlationId,
           pipelineStep: 'Validate Data',
           jobId: context.jobId,
         }
       );
    }
    throw new ReportlyError(
      'VALIDATION_FAILED',
      'Data quality too low for report generation',
      'More than 50% of analytics metrics are missing or unreliable. Report blocked for accuracy.',
      422
    );
  }
}
