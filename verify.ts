import { createSupabaseServiceClient } from './src/lib/db/client';
import fs from 'fs';

async function verify() {
  const db = createSupabaseServiceClient();

  const { data: reports } = await db
    .from('reports')
    .select('id, status, narrative_source, ai_narrative_raw')
    .order('created_at', { ascending: false })
    .limit(1);

  const { data: audit } = await db
    .from('audit_logs')
    .select('event_type, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: api } = await db
    .from('api_connections')
    .select('platform, status, last_error');

  const { data: jobs } = await db
    .from('job_queue')
    .select('id, status, last_error, payload')
    .order('created_at', { ascending: false })
    .limit(1);

  const result = {
    reports,
    audit,
    api,
    jobs
  };

  
  fs.writeFileSync('out.json', JSON.stringify(result, null, 2));
}

verify();
