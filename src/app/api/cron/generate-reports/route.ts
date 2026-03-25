import { createSupabaseServiceClient } from '@/lib/db/client';
import { reportQueue } from '@/lib/queue/client';
import { apiError, apiOk, fromUnknownError } from '@/lib/api-contract';
import { logger } from '@/lib/utils/logger';
import { randomUUID } from 'crypto';

export const maxDuration = 300; // 5 minutes max execution time

export async function POST(request: Request) {
  try {
    // Verify Cron secret
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401);
    }

    const supabase = createSupabaseServiceClient();
    const today = new Date().getDate();
    const currentMonth = new Date().toISOString().substring(0, 7); // 'YYYY-MM'

    // Query clients scheduled for today
    const { data: clients, error: clientErr } = await supabase
      .from('clients')
      .select('id, agency_id, name')
      .eq('schedule_day', today)
      .eq('is_active', true);

    if (clientErr) throw clientErr;
    if (!clients || clients.length === 0) {
      return apiOk({ success: true, message: 'No reports scheduled for today' });
    }

    let reportsTriggered = 0;
    const errors: string[] = [];

    // Sequential processing to avoid overwhelming the system
    for (const client of clients) {
      try {
        // 1. Create the report record
        const { data: report, error: repErr } = await supabase
          .from('reports')
          .insert({
            agency_id: client.agency_id,
            client_id: client.id,
            month: currentMonth,
            status: 'queued',
          })
          .select('id')
          .single();
          
        if (repErr || !report) {
          errors.push(`Client ${client.id}: ${repErr?.message || 'Insert failed'}`);
          continue;
        }

        // 2. Create the job record
        const jobId = randomUUID();
        const periodStart = new Date();
        periodStart.setDate(1); // First of current month
        const periodEnd = new Date();

        const { error: jobErr } = await supabase
          .from('job_queue')
          .insert({
            id: jobId,
            agency_id: client.agency_id,
            job_type: 'generate_report',
            status: 'queued',
            payload: {
              clientId: client.id,
              agencyId: client.agency_id,
              reportId: report.id,
              periodStart: periodStart.toISOString(),
              periodEnd: periodEnd.toISOString(),
              label: currentMonth,
            },
          });

        if (jobErr) {
          errors.push(`Client ${client.id}: Job insert failed: ${jobErr.message}`);
          continue;
        }

        // 3. Enqueue into BullMQ (the FIX — this was missing before)
        await reportQueue.add('generate-report', {
          jobId,
          clientId: client.id,
          agencyId: client.agency_id,
          reportId: report.id,
          payload: {
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
            label: currentMonth,
          },
        }, {
          jobId: `report-${client.id}-${currentMonth}`,
        });

        reportsTriggered++;
      } catch (err: any) {
        errors.push(`Client ${client.id}: ${err.message}`);
      }
    }

    logger.info({ 
      triggered: reportsTriggered, 
      total: clients.length,
      errors: errors.length,
      day: today,
    }, 'Cron: Report generation batch complete');

    return apiOk({ 
      success: true, 
      message: `Triggered ${reportsTriggered}/${clients.length} report generations for day ${today}`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    logger.error({ err: err.message }, 'CRON Error');
    return fromUnknownError(err, 'Failed to generate reports');
  }
}
