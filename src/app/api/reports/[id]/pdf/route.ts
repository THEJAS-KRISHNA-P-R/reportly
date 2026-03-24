import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db/client';
import { generatePDFStep } from '@/lib/pipeline/steps/generatePDFStep';
import { PipelineContext } from '@/lib/pipeline/pipeline';

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
  const supabase = await createSupabaseServerClient();

  try {
    // 1. Fetch report to verify permissions and get metadata
    // Note: We use the service role repo for the actual step, but verify access here
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('client_id, agency_id, status, snapshot_id, final_narrative, confidence_summary')
      .eq('id', id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // 2. Fetch the snapshot too (required for PDF templates)
    const { data: snapshot, error: snapError } = await supabase
      .from('metric_snapshots')
      .select('validated_metrics, freshness_status')
      .eq('id', report.snapshot_id)
      .single();

    if (snapError || !snapshot) {
       return NextResponse.json({ error: 'No validated metrics found for this report. Please run/regenerate report first.' }, { status: 400 });
    }

    // 3. Construct manual PipelineContext
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
         validated: snapshot.validated_metrics,
         freshnessStatus: snapshot.freshness_status,
         confidence: report.confidence_summary || { overall: 'high', perMetric: {} },
         warnings: [],
         passedValidation: true
      },
      narrativeResult: {
        content: report.final_narrative || '',
        rawAiOutput: '',
        source: 'gemini'
      }
    };

    // 4. Run the PDF Step directly (it handles upload and DB update)
    await generatePDFStep(context);

    // 5. Refetch to get updated URL
    const { data: updatedReport } = await supabase
      .from('reports')
      .select('pdf_url')
      .eq('id', id)
      .single();

    return NextResponse.json({ 
      success: true, 
      pdf_url: updatedReport?.pdf_url 
    });

  } catch (error: any) {
    console.error('[API] Manual PDF Generation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
