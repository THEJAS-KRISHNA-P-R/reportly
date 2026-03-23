import { PipelineContext } from '../pipeline';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { logger } from '@/lib/utils/logger';

export async function snapshotDataStep(context: PipelineContext): Promise<void> {
  if (!context.fetchResult || !context.clientId) {
    throw new Error('Required context missing for snapshotDataStep');
  }

  try {
    const supabase = createSupabaseServiceClient();
    
    const { error } = await supabase
      .from('metric_snapshots')
      .insert({
        client_id: context.clientId,
        platform: context.fetchResult.platform,
        period_start: context.period.start.toISOString().split('T')[0],
        period_end: context.period.end.toISOString().split('T')[0],
        raw_api_response: context.fetchResult.raw,
        validated_metrics: context.validationResult?.validated || null,
        validation_warnings: context.validationResult?.warnings || [],
        freshness_status: context.validationResult?.freshnessStatus || 'fresh',
        data_retrieved_at: context.fetchResult.retrievedAt.toISOString()
      });

    if (error) {
      throw error;
    }

    logger.info({ reportId: context.reportId }, 'Metric snapshot saved successfully');
  } catch (err: any) {
    logger.error({ err: err.message, reportId: context.reportId }, 'Failed to save metric snapshot');
    // Non-critical path, but logged
  }
}
