import { PipelineContext } from '../pipeline';
import { analyticsRegistry } from '@/lib/modules/analytics/registry';
import { createAuditLog } from '@/lib/db/repositories/auditRepo';

export async function fetchDataStep(context: PipelineContext): Promise<void> {
  const adapter = analyticsRegistry.getAdapter('ga4');
  
  const fetchResult = await adapter.fetch(context.clientId, context.period);
  context.fetchResult = fetchResult;

  if (context.reportId) {
     await createAuditLog(
         context.reportId,
         context.agencyId,
         'api_fetch',
         fetchResult.raw
     );
  }
}
