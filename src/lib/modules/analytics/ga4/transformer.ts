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
  const metrics: Record<string, number | null> = {
    sessions: 0,
    users: 0,
    newUsers: 0,
    bounceRate: null,
    avgSessionDuration: null
  };

  const rows = responseData.rows || [];
  const metricHeaders = responseData.metricHeaders || [];

  // If there are rows, calculate totals (though runReport totals field exists, 
  // manual summation helps for breakdown visibility)
  let totalSessions = 0;
  let totalUsers = 0;
  let totalNewUsers = 0;
  let totalBounceRate = 0;
  let totalAvgDuration = 0;
  let rowCount = 0;

  for (const row of rows) {
    rowCount++;
    row.metricValues.forEach((mv: any, index: number) => {
      const name = metricHeaders[index].name;
      const val = parseFloat(mv.value);
      
      if (name === 'sessions') totalSessions += val;
      if (name === 'activeUsers') totalUsers += val;
      if (name === 'newUsers') totalNewUsers += val;
      if (name === 'bounceRate') totalBounceRate += val;
      if (name === 'averageSessionDuration') totalAvgDuration += val;
    });
  }

  metrics.sessions = totalSessions;
  metrics.users = totalUsers;
  metrics.newUsers = totalNewUsers;
  // Averages/Rates aren't additive, so we take the average across rows (crude but functional for MVP)
  // Ideally, use GA4's built-in totals if the API supports it in this request type.
  if (rowCount > 0) {
    metrics.bounceRate = totalBounceRate / rowCount;
    metrics.avgSessionDuration = totalAvgDuration / rowCount;
  }

  // Dimension breakdown (Top Sources)
  const breakdown: Record<string, number> = {};
  for (const row of rows) {
    const source = row.dimensionValues[0].value;
    const sessionCount = parseInt(row.metricValues[0].value, 10);
    breakdown[source] = (breakdown[source] || 0) + sessionCount;
  }

  return {
    platform: 'ga4',
    periodStart,
    periodEnd,
    retrievedAt: new Date(),
    metrics,
    breakdown
  };
}
