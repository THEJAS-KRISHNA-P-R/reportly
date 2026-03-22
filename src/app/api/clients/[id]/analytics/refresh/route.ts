import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';
import { getConnection } from '@/lib/db/repositories/connectionRepo';
import { format, subDays } from 'date-fns';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params;
    
    // 1. Get authenticated agency
    const { agencyId } = await getAuthenticatedAgency(request);
    const supabase = createSupabaseServiceClient();

    // 2. Validate client belongs to user
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .select('agency_id, ga4_property_id')
      .eq('id', clientId)
      .eq('agency_id', agencyId)
      .maybeSingle();

    if (clientErr || !client) return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 404 });

    // 3. Ensure Property ID is set
    if (!client.ga4_property_id) {
       return NextResponse.json({ error: 'Client is missing GA4 Property ID. Please configure it in Settings.' }, { status: 400 });
    }

    // 4. Get OAuth tokens via repository (handles decryption)
    const connection = await getConnection(clientId, 'ga4');

    if (!connection || !connection.access_token) {
      return NextResponse.json({ error: 'GA4 OAuth connection missing. Please connect account.' }, { status: 400 });
    }

    const accessToken = connection.access_token;

    // 5. Call Google Analytics Data API
    const today = new Date();
    const startDate = format(subDays(today, 30), 'yyyy-MM-dd');
    const endDate = format(today, 'yyyy-MM-dd');

    const gaRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${client.ga4_property_id}:runReport`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' }
        ],
        keepEmptyRows: true,
      })
    });

    if (!gaRes.ok) {
       const errBody = await gaRes.text();
       console.error('[GA4 API Error] Status:', gaRes.status, 'Body:', errBody);
       return NextResponse.json({ error: 'Failed to fetch data from real GA4 API' }, { status: 502 });
    }

    const gaData = await gaRes.json();
    
    // 6. Parse GA Data into database schema inserts
    const inserts: any[] = [];
    if (gaData.rows) {
      for (const row of gaData.rows) {
        // Date format from GA4 is YYYYMMDD
        const rawDate = row.dimensionValues[0].value;
        const year = rawDate.substring(0,4);
        const month = rawDate.substring(4,6);
        const day = rawDate.substring(6,8);
        const formattedDate = `${year}-${month}-${day}`;

        inserts.push({
          client_id: clientId,
          date: formattedDate,
          visitors: parseInt(row.metricValues[0].value, 10) || 0,
          sessions: parseInt(row.metricValues[1].value, 10) || 0,
          bounce_rate: parseFloat(row.metricValues[2].value) || 0,
          avg_session_duration: parseFloat(row.metricValues[3].value) || 0,
        });
      }
    }

    if (inserts.length > 0) {
      // 7. Clear old data and insert fresh
      await supabase
        .from('client_metrics')
        .delete()
        .eq('client_id', clientId)
        .gte('date', startDate);

      const { error: insertErr } = await supabase
        .from('client_metrics')
        .insert(inserts);

      if (insertErr) {
        console.error('[Metrics Insertion Error]:', insertErr);
        throw insertErr;
      }
    }

    return NextResponse.json({ success: true, message: 'Analytics refreshed from actual GA4 source' });
  } catch (err: any) {
    console.error('[Analytics Refresh POST] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
