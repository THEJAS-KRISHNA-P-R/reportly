import { ValidatedMetricSet } from '@/types/metrics';

export async function generateFallbackNarrative(metrics: ValidatedMetricSet): Promise<string> {
  const sessions = metrics.validated.sessions?.value ?? 0;
  const priorSessions = metrics.validated.sessions?.prior ?? 0;
  
  let trend = 'remained stable';
  if (priorSessions > 0) {
    if (sessions > priorSessions * 1.05) trend = 'increased';
    else if (sessions < priorSessions * 0.95) trend = 'decreased';
  }

  let narrative = `Overall performance ${trend} this period. `;
  narrative += `We recorded ${sessions.toLocaleString()} total sessions. `;
  
  const bounce = metrics.validated.bounceRate?.value;
  if (bounce !== undefined && bounce !== null) {
    narrative += `The bounce rate was ${bounce.toFixed(1)}%. `;
  }

  const users = metrics.validated.users?.value;
  if (users !== undefined && users !== null) {
      narrative += `This was driven by ${users.toLocaleString()} total users interacting with the platform. `;
  }

  return narrative + 'This summary was generated directly from your analytics data for reliability.';
}
