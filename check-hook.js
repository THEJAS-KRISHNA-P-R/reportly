const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:reportlyisverysafe@db.qaobenwaagtuxxhpbiuk.supabase.co:5432/postgres' });
client.connect()
  .then(() => client.query("SELECT prosrc FROM pg_proc WHERE proname = 'custom_access_token_hook'"))
  .then(res => { console.log("HOOK_SOURCE:\n", res.rows[0]?.prosrc); return client.end() })
  .catch(err => { console.error(err); client.end() });
