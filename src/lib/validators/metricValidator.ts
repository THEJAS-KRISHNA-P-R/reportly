import { RawMetricSet, ValidatedMetricSet, MetricValue, FreshnessStatus } from '@/types/metrics';
import { VALIDATION, DATA_FRESHNESS } from '@/lib/constants';

export function validateMetrics(current: RawMetricSet, prior: RawMetricSet | null): ValidatedMetricSet {
  const cutoff = new Date(Date.now() - DATA_FRESHNESS.STALE_THRESHOLD_HOURS * 60 * 60 * 1000);
  let freshnessStatus: FreshnessStatus = 'fresh';
  
  if (current.periodEnd < cutoff) {
    freshnessStatus = 'stale';
  } else {
    const ageHrs = (Date.now() - current.retrievedAt.getTime()) / (1000 * 60 * 60);
    // 48 hours for GA4, 72 for Meta
    const freshnessLimit = current.platform === 'ga4' 
      ? DATA_FRESHNESS.GA4_MAX_AGE_HOURS 
      : DATA_FRESHNESS.META_MAX_AGE_HOURS;
      
    if (ageHrs > freshnessLimit) {
      freshnessStatus = 'preliminary';
    }
  }

  const validated: Record<string, MetricValue> = {};
  const allKeys = Object.keys(current.metrics);
  if (allKeys.length === 0) {
    return {
      platform: current.platform,
      periodStart: current.periodStart,
      periodEnd: current.periodEnd,
      retrievedAt: current.retrievedAt,
      validated: {},
      freshnessStatus,
      confidence: { overall: 'unverified', score: 0, perMetric: {} },
      warnings: ['No metrics provided in RawMetricSet'],
      passedValidation: false
    };
  }

  let failedCount = 0;
  const globalWarnings: string[] = [];
  
  if (freshnessStatus === 'stale') {
    globalWarnings.push(`Data is considered stale (retrieved > ${DATA_FRESHNESS.STALE_THRESHOLD_HOURS} hours ago)`);
  }

  for (const key of allKeys) {
    const cv = current.metrics[key];
    const pv = prior?.metrics[key] ?? null;
    
    let status: MetricValue['status'] = 'valid';
    const warnings: string[] = [];

    // 1. Null check
    if (cv === null) {
      status = 'unreliable';
      warnings.push(`Metric ${key} is null`);
      failedCount++;
      validated[key] = { value: null, prior: pv, delta: null, status, warnings };
      continue;
    }

    // 2. Zero Anomaly Check
    if (cv === 0 && pv !== null && pv > VALIDATION.ZERO_ANOMALY_MIN_PRIOR) {
      status = 'unreliable';
      warnings.push(`Zero anomaly detected: current 0, but prior was ${pv}`);
    }

    let delta: number | null = null;
    if (pv !== null && pv !== 0 && typeof cv === 'number' && typeof pv === 'number') {
      delta = ((cv - pv) / Math.abs(pv)) * 100;

      // 3. Spike Detection
      if (Math.abs(delta) > VALIDATION.SPIKE_THRESHOLD_PERCENT) {
        if (status === 'valid') status = 'preliminary';
        warnings.push(`Spike detected: ${delta.toFixed(1)}% change exceeds ${VALIDATION.SPIKE_THRESHOLD_PERCENT}% threshold`);
      }
    }

    if (status === 'unreliable') failedCount++;
    validated[key] = { value: typeof cv === 'number' ? cv : null, prior: typeof pv === 'number' ? pv : null, delta, status, warnings };
  }

  // 4 & 5. Coverage and Final Status
  const passed = (allKeys.length - failedCount) / allKeys.length >= VALIDATION.MIN_METRICS_REQUIRED_RATIO;

  // Calculate Confidence Summary
  const perMetric: Record<string, 'high' | 'partial' | 'unverified'> = {};
  let overall: 'high' | 'partial' | 'unverified' = 'high';

  for (const [key, mv] of Object.entries(validated)) {
    if (mv.status === 'unreliable') {
      perMetric[key] = 'unverified';
      overall = 'partial'; // Downgrade overall if any unreliable
    } else if (mv.status === 'preliminary') {
      perMetric[key] = 'partial';
      if (overall === 'high') overall = 'partial';
    } else {
      perMetric[key] = 'high';
    }
  }

  // If >50% failed, overall is unverified
  if (!passed) overall = 'unverified';

  return {
    platform: current.platform,
    periodStart: current.periodStart,
    periodEnd: current.periodEnd,
    retrievedAt: current.retrievedAt,
    validated,
    freshnessStatus,
    confidence: { 
      overall, 
      score: Math.round(((allKeys.length - failedCount) / allKeys.length) * 100), 
      perMetric 
    },
    warnings: globalWarnings,
    passedValidation: passed
  };
}
