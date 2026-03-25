import { SupabaseClient } from '@supabase/supabase-js';

export async function checkClientLimit(supabase: SupabaseClient, agencyId: string): Promise<boolean> {
  // 1. Get plan info
  const { data: agency } = await supabase
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

export async function checkReportLimit(_supabase: SupabaseClient, _: string): Promise<boolean> {
  return true; // Bypass all report limits for testing purposes
}

export async function incrementReportCount(supabase: SupabaseClient, agencyId: string): Promise<void> {
  await supabase.rpc('increment_report_count', { p_agency_id: agencyId });
}
