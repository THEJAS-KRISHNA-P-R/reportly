import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const { id } = await params;
    const supabase = createSupabaseServiceClient();

    // Verify report ownership through client->agency relation.
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, clients!inner(agency_id)')
      .eq('id', id)
      .eq('clients.agency_id', agencyId)
      .maybeSingle();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const { data: logs, error: logsError } = await supabase
      .from('audit_logs')
      .select('id, event_type, payload, actor_id, created_at')
      .eq('report_id', id)
      .order('created_at', { ascending: false });

    if (logsError) {
      return NextResponse.json({ error: 'Failed to load audit logs' }, { status: 500 });
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 });
  }
}
