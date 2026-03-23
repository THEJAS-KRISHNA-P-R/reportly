import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const { id } = await params;
    const supabase = createSupabaseServiceClient();

    const { data: report, error } = await supabase
      .from('reports')
      .select('*, clients!inner(*)')
      .eq('id', id)
      .eq('clients.agency_id', agencyId)
      .maybeSingle();

    if (error || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Fetch latest metrics for this client
    const { data: metrics } = await supabase
      .from('metric_snapshots')
      .select('validated_metrics, freshness_status, data_retrieved_at')
      .eq('client_id', report.client_id)
      .order('data_retrieved_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      ...report,
      latest_metrics: metrics
    });
  } catch (err: any) {
    console.error('[Report Detail GET] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const { id } = await params;
    const supabase = createSupabaseServiceClient();

    // Verify ownership first
    const { data: existing } = await supabase
      .from('reports')
      .select('clients!inner(agency_id)')
      .eq('id', id)
      .eq('clients.agency_id', agencyId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    // Clean up input
    const updateData: any = {};
    if (body.ai_narrative !== undefined) {
      updateData.ai_narrative_edited = body.ai_narrative;
      updateData.final_narrative = body.ai_narrative;
    }
    if (body.status !== undefined) updateData.status = body.status;

    const { error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Report Detail PATCH] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
