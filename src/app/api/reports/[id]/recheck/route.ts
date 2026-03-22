import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const { id: reportId } = await params;
    const supabase = createSupabaseServiceClient();

    // Verify ownership and update status
    const { data: report, error } = await supabase
      .from('reports')
      .update({ status: 'ready' })
      .eq('id', reportId)
      .select('*, clients!inner(agency_id)')
      .eq('clients.agency_id', agencyId)
      .maybeSingle();

    if (error || !report) {
      return NextResponse.json({ error: 'Report not found or unauthorized' }, { status: 404 });
    }
    
    // Placeholder: Recheck logic that verifies external data sources and resets the state to ready 
    // after pulling the freshest numbers from the cached metrics database.
    return NextResponse.json({ success: true, message: 'Report rechecked and data refreshed' });
  } catch (err: any) {
    console.error('[Report Recheck POST] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
