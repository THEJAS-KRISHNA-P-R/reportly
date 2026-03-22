import { createSupabaseServiceClient } from './src/lib/db/client';
import { createReport } from './src/lib/db/repositories/reportRepo';
import { createJob } from './src/lib/db/repositories/jobRepo';
import { runReportGeneration } from './src/lib/services/reportService';

async function runDirect() {
  const db = createSupabaseServiceClient();
  const clientId = '70d0c4c9-d1db-4689-907b-df78e06dd5c7';
  const periodStart = new Date('2024-02-01');
  const periodEnd = new Date('2024-02-29');

  const { data: client } = await db
    .from('clients')
    .select('id, agency_id')
    .eq('id', clientId)
    .single();

  const agencyId = client.agency_id;
  const label = periodStart.toLocaleString('default', { month: 'long', year: 'numeric' });

  const { data: upsertData, error } = await db.from('reports').upsert({
    client_id:        clientId,
    agency_id:        agencyId,
    period_start:     periodStart.toISOString(),
    period_end:       periodEnd.toISOString(),
    status:           'pending',
    prompt_version:   'v1.0',
    template_version: 'v1.0',
    logic_version:    'v1.0',
  }, {
    onConflict: 'client_id,period_start,period_end',
    ignoreDuplicates: false,
  }).select('id').single();

  if (error) throw error;
  const reportId = upsertData.id;

  const job = await createJob({
    job_type: 'generate_report',
    agency_id: agencyId,
    client_id: clientId,
    report_id: reportId,
    payload: { test: true }
  });

  await runReportGeneration(clientId, agencyId, { start: periodStart, end: periodEnd, label }, reportId, job.id);
  console.log('Generation completed synchronously');
}

runDirect();
