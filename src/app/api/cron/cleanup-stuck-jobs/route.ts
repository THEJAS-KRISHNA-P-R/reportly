import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { logger } from '@/lib/utils/logger';

export async function GET() {
  try {
    const supabase = createSupabaseServiceClient();
    
    // Any report stuck in 'generating' for more than 30 minutes is considered dead
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: stuckReports, error: fetchError } = await supabase
      .from('reports')
      .select('id, client_id')
      .in('status', ['generating', 'queued'])
      .lt('updated_at', thirtyMinsAgo);

    if (fetchError) {
      throw fetchError;
    }

    if (!stuckReports || stuckReports.length === 0) {
      return NextResponse.json({ success: true, message: 'No stuck jobs found' });
    }

    const { error: updateError } = await supabase
      .from('reports')
      .update({ 
        status: 'failed', 
        error_reason: 'Job timed out or worker crashed silently during generation' 
      })
      .in('id', stuckReports.map(r => r.id));

    if (updateError) {
      throw updateError;
    }

    logger.warn({ count: stuckReports.length, reportIds: stuckReports.map(r => r.id) }, 'Cron sweep automatically failed stuck reports');

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${stuckReports.length} stuck reports`,
      reportIds: stuckReports.map(r => r.id)
    });
  } catch (error: any) {
    logger.error({ err: error.message }, 'Failed to run stuck jobs cleanup cron');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
