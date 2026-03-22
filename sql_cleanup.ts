import { createSupabaseServiceClient } from './src/lib/db/client';

async function run() {
  const db = createSupabaseServiceClient();

  console.log('Deleting audit logs...');
  await db.from('audit_logs').delete().in('report_id', (
      await db.from('reports').select('id').in('status', ['failed', 'pending', 'generating'])
  ).data?.map(r => r.id) || []);

  console.log('Deleting job_queue...');
  await db.from('job_queue').delete().in('status', ['failed', 'queued', 'processing']);

  console.log('Deleting reports...');
  await db.from('reports').delete().in('status', ['failed', 'pending', 'generating']);

  console.log('Deleting metric_snapshots...');
  await db.from('metric_snapshots').delete().eq('client_id', '70d0c4c9-d1db-4689-907b-df78e06dd5c7');
}
run();
