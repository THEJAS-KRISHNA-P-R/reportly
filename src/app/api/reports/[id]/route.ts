import { z } from 'zod';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';
import { apiError, apiOk, fromUnknownError, parseJsonBody } from '@/lib/api-contract';
import { logger } from '@/lib/utils/logger';

const reportPatchSchema = z.object({
  ai_narrative: z.string().max(10_000).optional(),
  status: z.string().optional(),
}).strict();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const { id } = await params;
    const supabase = createSupabaseServiceClient();

    const { data: report, error } = await supabase
      .from('reports')
      .select(`
        *,
        clients!inner(*),
        metric_snapshots:snapshot_id (
          validated_metrics,
          breakdown,
          freshness_status,
          data_retrieved_at
        )
      `)
      .eq('id', id)
      .eq('clients.agency_id', agencyId)
      .maybeSingle();

    if (error || !report) {
      return apiError('NOT_FOUND', 'Report not found', 404);
    }

    // Use linked snapshot if it came through the JOIN, else fallback to latest for client
    let metrics = report.metric_snapshots;
    
    if (!metrics) {
      const { data: latestFallback } = await supabase
        .from('metric_snapshots')
        .select('validated_metrics, breakdown, freshness_status, data_retrieved_at')
        .eq('client_id', report.client_id)
        .order('data_retrieved_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      metrics = latestFallback;
    }

    return apiOk({
      ...report,
      latest_metrics: metrics
    });
  } catch (err: any) {
    logger.error({ err }, 'Report detail GET failed');
    return fromUnknownError(err, 'Failed to fetch report');
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
      return apiError('FORBIDDEN', 'Unauthorized', 403);
    }

    const body = await parseJsonBody(request, reportPatchSchema);
    
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
    
    return apiOk({ success: true });
  } catch (err: any) {
    logger.error({ err }, 'Report detail PATCH failed');
    return fromUnknownError(err, 'Failed to update report');
  }
}
