import { NextResponse } from 'next/server';
import { createReport } from '@/lib/db/repositories/reportRepo';
import { createJob } from '@/lib/db/repositories/jobRepo';
import { runReportGeneration } from '@/lib/services/reportService';
import { logger } from '@/lib/utils/logger';
import { createSupabaseServiceClient } from '@/lib/db/client';

/**
 * POST /api/reports/test
 * Triggers a real report generation for a client.
 * Use this to verify the pipeline, AI models, and PDF generation.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, periodStart: start, periodEnd: end } = body;

    if (!clientId || !start || !end) {
      return NextResponse.json({ error: 'Missing clientId, periodStart, or periodEnd' }, { status: 400 });
    }

    const db = createSupabaseServiceClient();

    // Get agency_id from the client
    const { data: client, error: clientError } = await db
      .from('clients')
      .select('id, agency_id')
      .eq('id', clientId)
      .maybeSingle();

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const agencyId = client.agency_id;
    const periodStart = new Date(start);
    const periodEnd = new Date(end);
    const label = periodStart.toLocaleString('default', { month: 'long', year: 'numeric' });

    // 1. Create a placeholder report using upsert exactly as requested
    const { data: upsertData, error: upsertError } = await db.from('reports').upsert({
      client_id:        clientId,
      agency_id:        agencyId,
      period_start:     periodStart.toISOString(),
      period_end:       periodEnd.toISOString(),
      status:           'pending',
      prompt_version:   'v1.0',
      template_version: 'v1.0',
      logic_version:    'v1.0',
    }, {
      onConflict: 'client_id,period_start,period_end',
      ignoreDuplicates: false,
    }).select('id').single();

    if (upsertError || !upsertData) {
      throw new Error(`Failed to map report via upsert: ${upsertError?.message}`);
    }

    const reportId = upsertData.id;
    logger.info({ reportId }, 'Test report created/upserted');

    // 2. Create a job
    const job = await createJob({
      job_type: 'generate_report',
      agency_id: agencyId,
      client_id: clientId,
      report_id: reportId,
      payload: { test: true }
    });
    logger.info({ jobId: job.id }, 'Test job created');

    // 3. Run generation (Async trigger, return job ID)
    // For test route, we trigger it immediately and optionally return the result
    runReportGeneration(clientId, agencyId, { start: periodStart, end: periodEnd, label }, reportId, job.id);

    return NextResponse.json({
      success: true,
      reportId: reportId,
      jobId: job.id,
      message: 'Test report generation job started successfully'
    });

  } catch (error: any) {
    logger.error({ err: error.message }, 'Report test trigger failed');
    return NextResponse.json(
      { error: error.message || 'Failed to trigger test' },
      { status: 500 }
    );
  }
}
