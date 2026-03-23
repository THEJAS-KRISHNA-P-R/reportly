import { RawMetricSet } from '@/types/metrics';

export function transformGA4Response(
  responseData: any,
  periodStart: Date,
  periodEnd: Date
): RawMetricSet {
  // GA4 runReport returns multiple rows if dimensions are present.
  // For aggregate metrics (sessions, users), we sum up or take the first row if appropriate.
  // Actually, GA4 returns 'totals' if requested, but if we have dimensions, we usually 
  // want to aggregate manually or check the structure.
  
  // Minimal implementation for aggregate metrics:
  // CURRENT PERIOD (index 0)
  const currentMetrics: Record<string, number> = {
    sessions: 0, users: 0, newUsers: 0, bounceRate: 0, avgSessionDuration: 0
  };
  let currentRows = 0;

  // PRIOR PERIOD (index 1)
  const priorMetrics: Record<string, number> = {
    sessions: 0, users: 0, newUsers: 0, bounceRate: 0, avgSessionDuration: 0
  };
  let priorRows = 0;

  const rows = responseData.rows || [];
  const metricHeaders = responseData.metricHeaders || [];

  for (const row of rows) {
    const isPrior = row.dimensionValues[0].value === 'date_range_1'; // date_range_0 is current
    const target = isPrior ? priorMetrics : currentMetrics;
    if (isPrior) priorRows++; else currentRows++;

    row.metricValues.forEach((mv: any, index: number) => {
      const name = metricHeaders[index].name;
      const val = parseFloat(mv.value);
      
      if (name === 'sessions') target.sessions += val;
      if (name === 'activeUsers') target.users += val;
      if (name === 'newUsers') target.newUsers += val;
      if (name === 'bounceRate') target.bounceRate += val;
      if (name === 'averageSessionDuration') target.avgSessionDuration += val;
    });
  }

  const finalMetrics: Record<string, number | null> = { ...currentMetrics };
  if (currentRows > 0) {
    finalMetrics.bounceRate = currentMetrics.bounceRate / currentRows;
    finalMetrics.avgSessionDuration = currentMetrics.avgSessionDuration / currentRows;
  }

  // Dimension breakdown (Top Sources - Current Period Only for local MVP)
  const breakdown: Record<string, number> = {};
  for (const row of rows) {
    if (row.dimensionValues[0].value === 'date_range_0') {
      const source = row.dimensionValues[1].value;
      const sessions = parseInt(row.metricValues[0].value, 10);
      breakdown[source] = (breakdown[source] || 0) + sessions;
    }
  }

  return {
    platform: 'ga4',
    periodStart,
    periodEnd,
    retrievedAt: new Date(),
    metrics: finalMetrics,
    breakdown
  };
}
