import { NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { generatePDFStep } from '@/lib/pipeline/steps/generatePDFStep';
import { PipelineContext } from '@/lib/pipeline/pipeline';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';
import { getReportById } from '@/lib/db/repositories/reportRepo';
import { apiError, apiOk } from '@/lib/api-contract';
import { logger } from '@/lib/utils/logger';

/**
 * Manually trigger PDF generation for a report.
 * This is useful if the background pipeline failed at the final step
 * OR if the user edited the narrative and wants a fresh PDF immediately.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    // 1. Verify Authentication & Agency Identity
    const { agencyId } = await getAuthenticatedAgency(req);

    // 2. Fetch report via Service Role Repository (bypassing RLS with agency validation)
    const report = await getReportById(id, agencyId);

    if (!report) {
      return apiError('NOT_FOUND', 'Report not found or unauthorized', 404);
    }

    const supabase = createSupabaseServiceClient();

    // 3. Resolve Snapshot. Prioritize linked snapshot_id, fallback to latest for client if missing.
    let snapshotResult: any = null;
    
    if (report.snapshot_id) {
       const { data: linkedSnap, error: snapError } = await supabase
        .from('metric_snapshots')
        .select('validated_metrics, freshness_status')
        .eq('id', report.snapshot_id)
        .single();
       if (!snapError) snapshotResult = linkedSnap;
    }

    if (!snapshotResult) {
       const { data: fallbackSnap } = await supabase
        .from('metric_snapshots')
        .select('validated_metrics, freshness_status')
        .eq('client_id', report.client_id)
        .order('data_retrieved_at', { ascending: false })
        .limit(1)
        .maybeSingle();
       snapshotResult = fallbackSnap;
    }

    if (!snapshotResult) {
       return apiError('BAD_REQUEST', 'No validated metrics snapshots found for this client. Please run/sync report data first.', 400);
    }

    // 4. Construct manual PipelineContext
    const context: PipelineContext = {
      clientId: report.client_id,
      agencyId: report.agency_id,
      reportId: id,
      period: { label: '', start: new Date(), end: new Date() }, // Not used by PDF step directly if report is loaded
      validationResult: {
         platform: 'ga4',
         periodStart: new Date(),
         periodEnd: new Date(),
         retrievedAt: new Date(),
         validated: snapshotResult.validated_metrics,
         freshnessStatus: snapshotResult.freshness_status,
         confidence: report.confidence_summary || { overall: 'high', score: 100, perMetric: {} },
         warnings: [],
         passedValidation: true
      },
      narrativeResult: {
        content: report.final_narrative || '',
        rawAiOutput: '',
        source: 'gemini',
        confidenceScore: 100 // Pre-approved PDF override
      }
    };

    // 5. Run the PDF Step directly (it handles upload and DB update)
    logger.info({ reportId: id, agencyId }, 'Manually triggering PDF generation via API');
    await generatePDFStep(context);

    // 6. Refetch updated report via Service Role
    const updatedReport = await getReportById(id, agencyId);

    return apiOk({ 
      success: true, 
      pdf_url: updatedReport?.pdf_url 
    });

  } catch (error: any) {
    logger.error({ err: error.message, reportId: id }, 'Manual PDF Generation Error');
    return apiError('INTERNAL_ERROR', error.message, 500);
  }
}
