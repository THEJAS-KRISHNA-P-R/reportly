import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function clean() {
  console.log('Cleaning jobs...');
  let res = await supabase.from('job_queue').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (res.error) console.error(res.error);

  console.log('Cleaning reports...');
  res = await supabase.from('reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (res.error) console.error(res.error);
  
  console.log('Done.');
}

clean().catch(console.error);
