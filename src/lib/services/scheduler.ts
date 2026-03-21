import { getClientsScheduledForDay } from '@/lib/db/repositories/clientRepo';
import { reportQueue } from '@/lib/queue/queues';
import { logger } from '@/lib/utils/logger';

export async function scheduleDailyReports() {
  const today = new Date().getDate();
  const clients = await getClientsScheduledForDay(today);

  logger.info({ count: clients.length, day: today }, 'Scheduling daily reports');

  for (const client of clients) {
    // Determine report period (last month)
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Add randomized delay (0-6 hours) to prevent spike (MFR-015)
    const delayMs = Math.floor(Math.random() * 6 * 60 * 60 * 1000);

    await (reportQueue as any).add(
      'generate_report',
      {
        clientId: client.id,
        agencyId: client.agency_id,
        period: {
          start: periodStart,
          end: periodEnd,
          label: `${periodStart.toLocaleString('default', { month: 'long' })} ${periodStart.getFullYear()}`
        }
      },
      { delay: delayMs }
    );
  }
}
