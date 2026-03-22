import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';

export async function GET(request: NextRequest) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const supabase = createSupabaseServiceClient(); // Use service role for metadata/counts

    // Fetch the full agency record with related counts
    // Using a more standard query structure for Next.js 16/supabase-js
    // 1. Fetch the full agency record
    const { data: agency, error } = await supabase
      .from('agencies')
      .select(`
        id,
        name,
        reports_generated_this_month,
        plan_report_limit,
        created_at,
        agency_billing(plan_id, billing_status)
      `)
      .eq('id', agencyId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;

    // 2. Fetch accurate count of non-deleted clients
    const { count } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .is('deleted_at', null);

    const clientsCount = count || 0;

    // Format output
    const result = {
      ...agency,
      clients_count: clientsCount,
    };

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[Agencies Me GET] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    );
  }
}
