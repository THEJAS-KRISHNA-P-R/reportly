import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';

export async function GET(request: NextRequest) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const supabase = createSupabaseServiceClient(); // Use service role for metadata/counts

    // Fetch the full agency record with related counts and branding
    const { data: agency, error } = await supabase
      .from('agencies')
      .select(`
        id,
        name,
        logo_url,
        reports_generated_this_month,
        plan_report_limit,
        created_at,
        agency_billing(plan_id, billing_status),
        agency_branding(*)
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

    // Map database enums back to frontend IDs
    const branding = agency.agency_branding?.[0] || null;
    if (branding) {
      if (branding.report_layout === 'full') branding.report_layout = 'standard';
      else if (branding.report_layout === 'modern') branding.report_layout = 'compact';
      else if (branding.report_layout === 'brief') branding.report_layout = 'executive';
    }

    // Format output
    const result = {
      ...agency,
      branding,
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

    const updates: any = {};
    if (body.name) updates.name = body.name;
    if (body.logo_url !== undefined) updates.logo_url = body.logo_url;

    // 1. Update main agency record
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .update(updates)
      .eq('id', agencyId)
      .select()
      .single();

    if (agencyError) throw agencyError;

    // 2. If logo_url or colors provided, ALSO update/upsert agency_branding
    if (body.logo_url !== undefined || body.branding) {
       const branding = body.branding || {};
       await supabase
         .from('agency_branding')
         .upsert({
           agency_id: agencyId,
           logo_url: body.logo_url !== undefined ? body.logo_url : branding.logo_url,
           primary_color: branding.primary_color,
           secondary_color: branding.secondary_color,
           updated_at: new Date().toISOString()
         }, { onConflict: 'agency_id' });
    }

    return NextResponse.json(agency);
  } catch (err: any) {
    console.error('[Agencies Me PATCH] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    );
  }
}
