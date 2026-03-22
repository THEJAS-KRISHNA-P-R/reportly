import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const { id } = await params;
    const supabase = createSupabaseServiceClient();

    const { data: client, error } = await supabase
      .from('clients')
      .select('*, api_connections(*)')
      .eq('id', id)
      .eq('agency_id', agencyId)
      .maybeSingle();

    if (error || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (err: any) {
    console.error('[Client Detail GET] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const { id } = await params;
    const supabase = createSupabaseServiceClient();

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('agency_id', agencyId);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Client Detail DELETE] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
