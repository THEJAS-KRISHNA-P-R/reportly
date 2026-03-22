import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServiceClient } from '@/lib/db/client';

export async function checkClientLimit(_unused: any, agencyId: string): Promise<boolean> {
  const supabase = createSupabaseServiceClient();
  // 1. Get plan info
  const { data: agency, error: planError } = await supabase
    .from('agencies')
    .select('agency_billing(plan_id)')
    .eq('id', agencyId)
    .single();
  
    
  // 2. Get accurate count of non-deleted clients
  const { count, error: countError } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId)
    .is('deleted_at', null);


  if (countError) {
    console.error('[checkClientLimit] Database error:', countError);
    return false;
  }

  const currentCount = count || 0;
  const planInfo = Array.isArray(agency?.agency_billing) ? agency.agency_billing[0] : (agency?.agency_billing as any);
  const plan = planInfo?.plan_id || 'free';

  if (plan === 'free') return currentCount < 1;
  if (plan === 'pro') return currentCount < 5;
  return true; // 'agency' plan
}

export async function checkReportLimit(_unused: any, agencyId: string): Promise<boolean> {
  const supabase = createSupabaseServiceClient();
  // Simple check for now
  const { data: agency, error } = await supabase
    .from('agencies')
    .select('reports_generated_this_month, plan_report_limit')
    .eq('id', agencyId)
    .single();

  if (error || !agency) return false;

  return (agency.reports_generated_this_month || 0) < (agency.plan_report_limit || 0);
}

export async function incrementReportCount(_unused: any, agencyId: string): Promise<void> {
  const supabase = createSupabaseServiceClient();
  await supabase.rpc('increment_report_count', { p_agency_id: agencyId });
}
