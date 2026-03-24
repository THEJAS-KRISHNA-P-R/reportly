import { PipelineContext } from '../pipeline';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { logger } from '@/lib/utils/logger';
import { createAuditLog } from '@/lib/db/repositories/auditRepo';
import { updateReportProgress } from '@/lib/db/repositories/reportRepo';

export async function snapshotDataStep(context: PipelineContext): Promise<void> {
  if (context.reportId) {
    await updateReportProgress(context.reportId, context.agencyId, 'Hardening Data Snapshot', 55);
  }
  if (!context.fetchResult || !context.clientId) {
    throw new Error('Required context missing for snapshotDataStep');
  }

  try {
    const supabase = createSupabaseServiceClient();
    
    const { data: snapshot, error } = await supabase
      .from('metric_snapshots')
      .insert({
        client_id: context.clientId,
        platform: context.fetchResult.platform,
        period_start: context.period.start.toISOString().split('T')[0],
        period_end: context.period.end.toISOString().split('T')[0],
        raw_api_response: context.fetchResult.raw,
        validated_metrics: context.validationResult?.validated || null,
        breakdown: context.validationResult?.breakdown || null,
        validation_warnings: context.validationResult?.warnings || [],
        freshness_status: context.validationResult?.freshnessStatus || 'fresh',
        data_retrieved_at: context.validationResult?.retrievedAt.toISOString() || context.fetchResult.retrievedAt.toISOString()
      })
      .select('id')
      .single();

    if (error || !snapshot) {
      throw error || new Error('Failed to retrieve snapshot ID after insert');
    }

     if (context.reportId) {
        await supabase
          .from('reports')
          .update({ snapshot_id: snapshot.id })
          .eq('id', context.reportId)
          .eq('agency_id', context.agencyId);
       
       logger.info({ reportId: context.reportId, snapshotId: snapshot.id }, 'Metric snapshot linked to report successfully');
    } else {
       logger.info({ snapshotId: snapshot.id }, 'Metric snapshot created (orphaned/test)');
    }

    // Explicit Audit
    if (context.reportId) {
      await createAuditLog(context.reportId, context.agencyId, 'snapshot_created', {
        snapshotId: snapshot.id,
        platform: context.fetchResult.platform,
        freshness: context.validationResult?.freshnessStatus || 'fresh'
      }, {
        correlationId: context.correlationId,
        pipelineStep: 'Snapshot Metrics',
        jobId: context.jobId
      });
    }

  } catch (err: any) {
    logger.error({ err: err.message, reportId: context.reportId }, 'Failed to save metric snapshot');
    
    if (context.reportId) {
      await createAuditLog(context.reportId, context.agencyId, 'snapshot_failed', {
        reason: err.message
      }, {
        correlationId: context.correlationId,
        pipelineStep: 'Snapshot Metrics',
        jobId: context.jobId
      });
    }
  }
}
