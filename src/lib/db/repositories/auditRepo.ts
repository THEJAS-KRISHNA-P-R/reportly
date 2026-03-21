import { createSupabaseServiceClient } from '@/lib/db/client';
import type { AuditLog, AuditEventType } from '@/types/report';
import { logger } from '@/lib/utils/logger';

/**
 * Audit log repository.
 * CRITICAL RULE: This repo must NEVER throw. Audit log failures must
 * not block report generation. Log the error to stderr and continue.
 */

export async function createAuditLog(
  reportId: string,
  agencyId: string,
  eventType: AuditEventType,
  payload: Record<string, unknown>,
  options?: { actorId?: string; ipAddress?: string; userAgent?: string }
): Promise<void> {
  try {
    const db = createSupabaseServiceClient();
    const { error } = await db.from('audit_logs').insert({
      report_id: reportId,
      agency_id: agencyId,
      event_type: eventType,
      actor_id: options?.actorId ?? null,
      payload,
      ip_address: options?.ipAddress ?? null,
      user_agent: options?.userAgent?.slice(0, 200) ?? null,
    });
    // Even if there's an error, we do NOT throw — only log
    if (error) {
      logger.error({ err: error, reportId, eventType }, 'Failed to write audit log');
    }
  } catch (err) {
    // Swallow all errors from audit log writes — never block the pipeline
    logger.error({ err, reportId, eventType }, 'Unexpected error writing audit log');
  }
}

export async function getAuditLogsByReport(
  reportId: string,
  agencyId: string
): Promise<AuditLog[]> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('audit_logs')
    .select('*')
    .eq('report_id', reportId)
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: true });
  if (error) {
    logger.error({ err: error, reportId }, 'Failed to read audit logs');
    return [];
  }
  return (data ?? []) as AuditLog[];
}
