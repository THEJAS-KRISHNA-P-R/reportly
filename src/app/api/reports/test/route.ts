import { NextRequest, NextResponse } from 'next/server';
import { runReportGeneration } from '@/lib/services/reportService';
import { createSupabaseServerClient } from '@/lib/db/client';

/**
 * Dev-only route to test the full report pipeline.
 * GET /api/reports/test?clientId=xxx
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = request.nextUrl.searchParams.get('clientId');
  if (!clientId) {
    return NextResponse.json({ error: 'Missing clientId' }, { status: 400 });
  }

  // Use last month as period
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  try {
    const agencyId = (user.user_metadata as any).agency_id;
    if (!agencyId) throw new Error('User has no agency_id in metadata');

    const reportId = await runReportGeneration(clientId, agencyId, {
      start: periodStart,
      end: periodEnd,
      label: 'Test Report Period'
    });

    return NextResponse.json({
      success: true,
      reportId,
      message: 'Pipeline completed. Report is now in draft status.'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    }, { status: error.statusCode || 500 });
  }
}
