import { getClientsScheduledForDay } from '@/lib/db/repositories/clientRepo';
import { createJob } from '@/lib/db/repositories/jobRepo';
import { createReport } from '@/lib/db/repositories/reportRepo';
import { logger } from '@/lib/utils/logger';

export async function scheduleDailyReports() {
  const today = new Date().getDate();
  const clients = await getClientsScheduledForDay(today);

  logger.info({ count: clients.length, day: today }, 'Scheduling daily reports');

  for (const client of clients) {
    try {
      // Determine report period (last month)
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // 1. Create the report record first
      const report = await createReport(
        client.id, 
        client.agency_id, 
        periodStart, 
        periodEnd
      );

      // 2. Queue the generation job
      await createJob({
        job_type: 'generate_report',
        agency_id: client.agency_id,
        client_id: client.id,
        report_id: report.id,
        payload: {
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
        },
        // We could add scheduled_for here if we wanted the delay delayMs
      });

      logger.info({ clientId: client.id, reportId: report.id }, 'Weekly/Daily report scheduled');
    } catch (error: any) {
      logger.error({ clientId: client.id, err: error.message }, 'Failed to schedule report for client');
    }
  }
}
