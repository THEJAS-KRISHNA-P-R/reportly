import { ValidatedMetricSet } from '@/types/metrics';

/**
 * High-fidelity narrative fallback for production-grade reliability.
 * Performs deterministic trend analysis and and and generates professional summaries.
 */
export async function generateFallbackNarrative(metrics: ValidatedMetricSet): Promise<string> {
  const v = metrics.validated;
  
  // 1. Executive Summary Paragraph
  const sessions = v.sessions?.value ?? 0;
  const sessionsDelta = v.sessions?.delta ?? 0;
  const growthTrend = sessionsDelta > 5 ? 'positive growth' : sessionsDelta < -5 ? 'a contraction' : 'stable performance';
  
  let p1 = `During this reporting period, the platform experienced ${growthTrend} with a total of ${sessions.toLocaleString()} sessions. `;
  
  if (Math.abs(sessionsDelta) > 5) {
    p1 += `This represents a ${Math.abs(sessionsDelta).toFixed(1)}% ${sessionsDelta > 0 ? 'increase' : 'decrease'} compared to the previous period. `;
  } else {
    p1 += `Engagement levels remained consistent with historical averages. `;
  }

  // 2. Performance Efficiency Paragraph
  const bounce = v.bounceRate?.value;
  const bounceDelta = v.bounceRate?.delta ?? 0;
  let p2 = '';

  if (bounce !== undefined && bounce !== null) {
    const bounceQual = bounce < 40 ? 'excellent' : bounce < 65 ? 'healthy' : 'high';
    p2 = `User engagement efficiency is characterized as ${bounceQual}, with a bounce rate of ${bounce.toFixed(1)}%. `;
    
    if (bounceDelta < -2) {
      p2 += `We observed a notable improvement in landing page relevance, driving a ${Math.abs(bounceDelta).toFixed(1)}% reduction in bounce rate. `;
    } else if (bounceDelta > 2) {
      p2 += `A slight increase in bounce rate (${bounceDelta.toFixed(1)}%) suggests a need to review recent traffic sources or and and and landing page content. `;
    }
  }

  // 3. User Acquisition Paragraph
  const users = v.users?.value ?? 0;
  const newUsers = v.newUsers?.value ?? 0;
  let p3 = '';

  if (users > 0) {
    const newUserRatio = users > 0 ? (newUsers / users) * 100 : 0;
    p3 = `Your audience reached ${users.toLocaleString()} total users this period. `;
    if (newUserRatio > 60) {
      p3 += `Growth was primarily driven by new acquisitions, with new users making up ${newUserRatio.toFixed(0)}% of the total audience. `;
    } else {
      p3 += `Retention remains a strong driver of traffic, with a balanced mix of new and and and returning visitors. `;
    }
  }

  // 4. Platform-Specific Context
  let p4 = '';
  if (metrics.platform === 'ga4') {
    p4 = "\n\nData sourced from Google Analytics 4. Trends are calculated using the 'Prior Period' comparison model.";
  } else if (metrics.platform === 'google_ads') {
    p4 = "\n\nData sourced from Google Ads. Performance reflects campaign-level efficiency and and and reach.";
  }

  const finalNarrative = [p1, p2, p3].filter(p => p.length > 0).join('\n\n') + p4;

  return finalNarrative;
}
