import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const maxDuration = 300; // 5 minutes max execution time

export async function POST(request: Request) {
  try {
    // Basic verification of Cron secret in headers. 
    // Usually handled in proxy.ts, but good to have double confirmation for crons.
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    // Get current day of month
    const today = new Date().getDate();

    // Query clients scheduled for today
    const { data: clients, error: clientErr } = await supabase
      .from('clients')
      .select('id, agency_id, name')
      .eq('schedule_day', today);

    if (clientErr) throw clientErr;
    if (!clients || clients.length === 0) {
      return NextResponse.json({ success: true, message: 'No reports scheduled for today' });
    }

    let reportsTriggered = 0;
    const currentMonth = new Date().toISOString().substring(0, 7); // 'YYYY-MM'

    // For each client, trigger report generation
    for (const client of clients) {
      // Create empty draft report
      const { data: report, error: repErr } = await supabase
        .from('reports')
        .insert({
          agency_id: client.agency_id,
          client_id: client.id,
          month: currentMonth,
          status: 'draft',
        })
        .select()
        .single();
        
      if (!repErr && report) {
        // Enqueue generation (simulated here by moving status to generating)
        await supabase
          .from('reports')
          .update({ status: 'generating' })
          .eq('id', report.id);
        
        reportsTriggered++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Triggered ${reportsTriggered} report generations for day ${today}` 
    });
  } catch (err: any) {
    console.error('CRON Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
