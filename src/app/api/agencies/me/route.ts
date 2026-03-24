import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';

export async function GET(request: NextRequest) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const supabase = createSupabaseServiceClient(); // Use service role for metadata/counts

    // Fetch the full agency record with related counts
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

    // Fetch accurate count of non-deleted clients
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

export async function PATCH(request: NextRequest) {
  try {
    const { agencyId, role } = await getAuthenticatedAgency(request);
    
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const supabase = createSupabaseServiceClient();
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('agencies')
      .update({ name: body.name })
      .eq('id', agencyId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[Agencies Me PATCH] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    );
  }
}
