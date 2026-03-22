import { createSupabaseServiceClient } from './src/lib/db/client';
import { createJob } from './src/lib/db/repositories/jobRepo';
import { runReportGeneration } from './src/lib/services/reportService';

async function runDirect() {
  const db = createSupabaseServiceClient();
  const clientId = '70d0c4c9-d1db-4689-907b-df78e06dd5c7';
  const periodStart = new Date('2024-03-01T00:00:00.000Z');
  const periodEnd = new Date('2024-03-31T23:59:59.999Z');

  try {
    const { data: client } = await db
      .from('clients')
      .select('id, agency_id')
      .eq('id', clientId)
      .maybeSingle();

    if (!client) throw new Error('Client not found');

    const agencyId = client.agency_id;
    const label = periodStart.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Delete existing
    const { data: existing } = await db
      .from('reports')
      .select('id')
      .eq('client_id', clientId)
      .eq('period_start', periodStart.toISOString())
      .eq('period_end', periodEnd.toISOString())
      .maybeSingle();

    if (existing) {
      await db.from('audit_logs').delete().eq('report_id', existing.id);
      await db.from('job_queue').delete().eq('report_id', existing.id);
      await db.from('reports').delete().eq('id', existing.id);
    }

    // Insert fresh
    const { data: report, error } = await db
      .from('reports')
      .insert({
        client_id:        clientId,
        agency_id:        agencyId,
        period_start:     periodStart.toISOString(),
        period_end:       periodEnd.toISOString(),
        status:           'pending',
        prompt_version:   'v1.0',
        template_version: 'v1.0',
        logic_version:    'v1.0',
      })
      .select()
      .single();

    if (error || !report) throw new Error('Create report failed: ' + error?.message);

    const reportId = report.id;

    const job = await createJob({
      job_type: 'generate_report',
      agency_id: agencyId,
      client_id: clientId,
      report_id: reportId,
      payload: { test: true }
    });

    console.log('[DEBUG] Calling runReportGeneration!!!');
    await runReportGeneration(clientId, agencyId, { start: periodStart, end: periodEnd, label }, reportId, job.id);
    console.log('[DEBUG] Done runReportGeneration!!!');
  } catch (err) {
    console.error('[DEBUG] Exception in runDirect:', err);
  }
}

runDirect();
