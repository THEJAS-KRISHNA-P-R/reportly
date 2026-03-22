import { PipelineContext } from '../pipeline';
import { analyticsRegistry } from '@/lib/modules/analytics/registry';
import { createAuditLog } from '@/lib/db/repositories/auditRepo';
import { logger } from '@/lib/utils/logger';
import { refreshGA4Token } from '@/lib/modules/analytics/ga4/refresh';

export async function fetchDataStep(context: PipelineContext): Promise<void> {
  logger.info({ clientId: context.clientId, platform: 'ga4' }, 'Starting data fetch step');

  // Always refresh GA4 token before fetching
  try {
    const freshAccessToken = await refreshGA4Token(context.clientId);
    logger.info({ clientId: context.clientId }, 'GA4 token refreshed successfully for pipeline');
  } catch (refreshError: any) {
    logger.error({ err: refreshError.message, clientId: context.clientId }, 'GA4 token refresh failed in pipeline');
    throw refreshError;
  }

  const adapter = analyticsRegistry.getAdapter('ga4');
  
  try {
    const fetchResult = await adapter.fetch(context.clientId, context.period);
    context.fetchResult = fetchResult;

    if (context.reportId) {
       await createAuditLog(
           context.reportId,
           context.agencyId,
           'api_fetch',
           { 
             platform: fetchResult.platform,
             metricsCount: Object.keys(fetchResult.metrics.metrics).length,
             retrievedAt: fetchResult.retrievedAt 
           }
       );
    }
    logger.info({ clientId: context.clientId }, 'Data fetch successful');
  } catch (error: any) {
    logger.error({ err: error.message, clientId: context.clientId }, 'Data fetch step failed');
    throw error; // Re-throw because Fetch is critical
  }
}
