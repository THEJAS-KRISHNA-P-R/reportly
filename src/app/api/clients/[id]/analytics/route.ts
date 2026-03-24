import { NextResponse } from 'next/server';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';
import { getClientById } from '@/lib/db/repositories/clientRepo';
import { analyticsRegistry } from '@/lib/modules/analytics/registry';
import { saveMetricSnapshot } from '@/lib/db/repositories/metricsRepo';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const clientId = resolvedParams.id;
    
    // 1. Get authenticated agency
    const { agencyId } = await getAuthenticatedAgency(request);

    // 2. Verify client ownership
    const client = await getClientById(clientId, agencyId);
    if (!client) {
      return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 403 });
    }

    // Parse period from query params (default to last 30 days)
    const url = new URL(request.url);
    const daysRaw = url.searchParams.get('days') || '30';
    const days = parseInt(daysRaw, 10);
    
    const endDate = endOfDay(new Date());
    const startDate = startOfDay(subDays(endDate, days));

    // 3. Get GA4 adapter from registry
    const adapter = analyticsRegistry.getAdapter('ga4');

    // 4. Fetch data (Adapter handles refresh internally if needed)
    const fetchResult = await adapter.fetch(clientId, { 
      start: startDate, 
      end: endDate, 
      label: `${days}d period` 
    });

    // 8. Store raw response in metric_snapshots via metricsRepo
    await saveMetricSnapshot(
      clientId,
      'ga4',
      startDate,
      endDate,
      fetchResult.raw,
      fetchResult.metrics.metrics as any,
      [], // No warnings for now
      'fresh'
    );

    // 9. Return structured metrics for Recharts
    return NextResponse.json({
      ...fetchResult.metrics.metrics,
      breakdown: fetchResult.metrics.breakdown,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });

  } catch (err: any) {
    console.error('Analytics Fetch Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch analytics' },
      { status: err.status || 500 }
    );
  }
}
