import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db/client';
import { generateNarrative } from '@/lib/modules/ai';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  try {
    // 1. Fetch report to get client_id
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('client_id, period_start, period_end')
      .eq('id', id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // 2. Fetch latest metric snapshot for this client
    const { data: snapshot, error: snapError } = await supabase
      .from('metric_snapshots')
      .select('validated_metrics, freshness_status')
      .eq('client_id', report.client_id)
      .order('data_retrieved_at', { ascending: false })
      .limit(1)
      .single();

    if (snapError || !snapshot) {
      return NextResponse.json({ error: 'No performance data found for this client' }, { status: 400 });
    }

    // 3. Prepare ValidatedMetricSet for AI
    // The AI module expects a specific structure. If the table storage differs, we map it here.
    const metricsForAi = {
      platform: 'ga4', // Default for MVP
      periodStart: new Date(report.period_start),
      periodEnd: new Date(report.period_end),
      retrievedAt: new Date(),
      validated: snapshot.validated_metrics,
      freshnessStatus: snapshot.freshness_status,
      confidence: { overall: 'high', perMetric: {} },
      warnings: [],
      passedValidation: true
    };

    // 4. Generate Narrative
    const result = await generateNarrative(metricsForAi as any);

    // 5. Update Report
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        ai_narrative_raw: result.rawAiOutput || result.content,
        final_narrative: result.content,
        narrative_source: result.source,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ 
      content: result.content,
      source: result.source 
    });

  } catch (error: any) {
    console.error('[API] AI Regeneration Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
