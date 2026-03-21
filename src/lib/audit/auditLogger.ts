import { createSupabaseServiceClient } from '@/lib/db/client';
import { logger } from '@/lib/utils/logger';

export type AuditAction =
  | 'report.generated'
  | 'report.approved'
  | 'report.sent'
  | 'flag.toggled'
  | 'agency.updated'
  | 'client.deleted'
  | 'connection.authorized'
  | 'settings.updated';

export async function logAudit(
  agencyId: string,
  actorId: string | null,
  action: AuditAction,
  resourceId: string | null,
  details: Record<string, unknown>
): Promise<void> {
  try {
    const db = createSupabaseServiceClient();
    const { error } = await db.from('audit_logs').insert({
      agency_id: agencyId,
      actor_id: actorId, // null for system actions
      action,
      resource_id: resourceId,
      details,
    });

    if (error) {
      // Never throw on audit log failures, just log to console
      logger.error({ error, action, agencyId }, 'Failed to write audit log to database');
    }
  } catch (err) {
    logger.error({ err, action, agencyId }, 'Exception while writing audit log');
  }
}
