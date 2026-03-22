import { createSupabaseServiceClient } from './src/lib/db/client';
import fs from 'fs';

async function verify() {
  const db = createSupabaseServiceClient();

  const { data: api } = await db
    .from('api_connections')
    .select('id, platform, account_id, status, last_error')
    .eq('client_id', '70d0c4c9-d1db-4689-907b-df78e06dd5c7');

  fs.writeFileSync('out_conn.json', JSON.stringify(api, null, 2));
}

verify();
