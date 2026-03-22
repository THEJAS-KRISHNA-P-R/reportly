import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';
import { checkClientLimit } from '@/lib/utils/limits';

export async function GET(request: NextRequest) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const supabase = createSupabaseServiceClient(); // RLS bypass for listing if needed

    const { data: clients, error } = await supabase
      .from('clients')
      .select('*, api_connections(status, platform)')
      .eq('agency_id', agencyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(clients);
  } catch (err: any) {
    console.error('[Clients GET] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to list clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const supabase = createSupabaseServiceClient(); // Use service role for INSERT bypass

    // Validate limit
    const canCreate = await checkClientLimit(supabase, agencyId);
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Client limit reached. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    const { data: client, error: insertError } = await supabase
      .from('clients')
      .insert({
        agency_id:     agencyId,
        name:          body.name,
        contact_email: body.contact_email,
        report_emails: body.report_emails || [],
        schedule_day:  body.schedule_day || 1,
        timezone:      body.timezone || 'Asia/Kolkata',
        is_active:     true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Clients POST] Insert error:', insertError);
      throw insertError;
    }
    
    return NextResponse.json(client);
  } catch (err: any) {
    console.error('[Clients POST] Final catch Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create client' }, { status: 500 });
  }
}
