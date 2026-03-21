import { createSupabaseServiceClient } from '@/lib/db/client';
import type { MetricSnapshot } from '@/types/report';
import type { Platform } from '@/types/metrics';
import { handleDbError } from './_base';

export async function saveMetricSnapshot(
  clientId: string,
  platform: Platform,
  periodStart: Date,
  periodEnd: Date,
  rawApiResponse: Record<string, unknown>,
  validatedMetrics: Record<string, unknown> | null,
  validationWarnings: string[],
  freshnessStatus: 'fresh' | 'preliminary' | 'stale'
): Promise<MetricSnapshot> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('metric_snapshots')
    .insert({
      client_id: clientId,
      platform,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      raw_api_response: rawApiResponse,
      validated_metrics: validatedMetrics,
      validation_warnings: validationWarnings,
      freshness_status: freshnessStatus,
      data_retrieved_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) handleDbError(error, 'saveMetricSnapshot');
  return data as MetricSnapshot;
}

export async function getLatestSnapshot(
  clientId: string,
  platform: Platform
): Promise<MetricSnapshot | null> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('metric_snapshots')
    .select('*')
    .eq('client_id', clientId)
    .eq('platform', platform)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data as MetricSnapshot | null;
}

export async function getSnapshotsForPeriod(
  clientId: string,
  platform: Platform,
  periodStart: Date,
  periodEnd: Date
): Promise<MetricSnapshot[]> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('metric_snapshots')
    .select('*')
    .eq('client_id', clientId)
    .eq('platform', platform)
    .gte('period_start', periodStart.toISOString())
    .lte('period_end', periodEnd.toISOString())
    .order('created_at', { ascending: false });
  if (error) handleDbError(error, 'getSnapshotsForPeriod');
  return (data ?? []) as MetricSnapshot[];
}
