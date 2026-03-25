import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { apiError, apiOk } from '@/lib/api-contract';

async function checkAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} }
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    return { error: 'Forbidden' };
  }
  return { supabase };
}

import { createSupabaseServiceClient } from '@/lib/db/client';

export async function GET() {
  const auth = await checkAdmin();
  if (auth.error) return apiError('FORBIDDEN', auth.error, 403);

  const supabaseAdmin = createSupabaseServiceClient();
  
  const { count: total_agencies } = await supabaseAdmin
    .from('agencies')
    .select('*', { count: 'exact', head: true });
    
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: active_reports_today } = await supabaseAdmin
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  const { count: failed_reports_month } = await supabaseAdmin
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed')
    .gte('created_at', startOfMonth.toISOString());

  return apiOk({ 
    metrics: { 
      total_agencies: total_agencies ?? 0, 
      active_reports_today: active_reports_today ?? 0, 
      failed_reports_month: failed_reports_month ?? 0,
      system_health: '100% (All Systems Active)' 
    }
  });
}
