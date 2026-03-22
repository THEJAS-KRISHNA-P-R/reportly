import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';

export async function GET(request: NextRequest) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const supabase = await createSupabaseServerClient();

    // Fetch existing or seed default
    const { data, error } = await supabase
      .from('agency_branding')
      .select('*')
      .eq('agency_id', agencyId)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json(data || {});
  } catch (err: any) {
    console.error('[Branding GET] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to get branding' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const supabase = await createSupabaseServerClient();

    const body = await request.json();
    
    const { data: updated, error } = await supabase
      .from('agency_branding')
      .upsert({
        agency_id:       agencyId,
        primary_color:   body.primary_color,
        secondary_color: body.secondary_color,
        accent_color:    body.accent_color,
        report_font:     body.report_font,
        report_layout:   body.report_layout,
        show_powered_by: body.show_powered_by,
        updated_at:      new Date().toISOString(),
      }, {
        onConflict: 'agency_id',
      })
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('[Branding PATCH] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update branding' }, { status: 500 });
  }
}
