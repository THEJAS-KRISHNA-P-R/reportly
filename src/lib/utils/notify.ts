import { logger } from './logger';

export type NotificationSeverity = 'info' | 'warn' | 'error' | 'critical';

export async function notifyAdmin(
  message: string,
  severity: NotificationSeverity,
  context?: Record<string, unknown>
): Promise<void> {
  // In MVP, this routes to the logger. In production, this targets a Slack/Discord webhook.
  const payload = {
    ...context,
    timestamp: new Date().toISOString(),
    channel: 'admin-alerts',
  };

  if (severity === 'critical') {
    logger.fatal(payload, `[ADMIN CRITICAL] ${message}`);
    // await sendSlackWebhook(payload);
  } else if (severity === 'error') {
    logger.error(payload, `[ADMIN ERROR] ${message}`);
  } else if (severity === 'warn') {
    logger.warn(payload, `[ADMIN WARN] ${message}`);
  } else {
    logger.info(payload, `[ADMIN INFO] ${message}`);
  }
}
