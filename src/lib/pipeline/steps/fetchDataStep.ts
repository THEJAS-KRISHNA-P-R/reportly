import { PipelineContext } from '../pipeline';
import { analyticsRegistry } from '@/lib/modules/analytics/registry';
import { createAuditLog } from '@/lib/db/repositories/auditRepo';
import { logger } from '@/lib/utils/logger';
import { refreshGA4Token } from '@/lib/modules/analytics/ga4/refresh';

export async function fetchDataStep(context: PipelineContext): Promise<void> {
  logger.info({ clientId: context.clientId, reportId: context.reportId, correlationId: context.correlationId, platform: 'ga4' }, 'Starting data fetch step');

  try {
    if (context.mock) {
      logger.info({ clientId: context.clientId, reportId: context.reportId, correlationId: context.correlationId }, 'Using MOCK data for fetch step');
      context.fetchResult = {
        platform: 'ga4',
        retrievedAt: new Date(),
        periodStart: context.period.start,
        periodEnd: context.period.end,
        raw: { mock: true },
        metrics: {
          platform: 'ga4',
          periodStart: context.period.start,
          periodEnd: context.period.end,
          retrievedAt: new Date(),
          metrics: {
            sessions: 1250,
            users: 950,
            newUsers: 400,
            bounceRate: 42.5,
            avgSessionDuration: 155,
          }
        },
        priorMetrics: {
          platform: 'ga4',
          periodStart: new Date(context.period.start.getTime() - 2592000000),
          periodEnd: new Date(context.period.end.getTime() - 2592000000),
          retrievedAt: new Date(),
          metrics: {
            sessions: 1000,
            users: 800,
            newUsers: 350,
            bounceRate: 45.0,
            avgSessionDuration: 140,
          }
        }
      };
      return;
    }

    const freshAccessToken = await refreshGA4Token(context.clientId);
    logger.info({ clientId: context.clientId, reportId: context.reportId, correlationId: context.correlationId }, 'GA4 token refreshed successfully for pipeline');

    const adapter = analyticsRegistry.getAdapter('ga4');
    const fetchResult = await adapter.fetch(
      context.clientId, 
      context.period,
      freshAccessToken
    );
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
           },
           {
             correlationId: context.correlationId,
             pipelineStep: 'Fetch Data',
             jobId: context.jobId,
           }
       );
    }
    logger.info({ clientId: context.clientId, reportId: context.reportId, correlationId: context.correlationId }, 'Data fetch successful');
  } catch (error: any) {
    logger.error(
      { err: error.message, stack: error.stack, clientId: context.clientId, reportId: context.reportId, correlationId: context.correlationId },
      'Data fetch step failed'
    );
    throw error; // Re-throw because Fetch is critical
  }
}
