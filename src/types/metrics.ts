export type Platform = 'ga4' | 'meta' | 'gsc' | 'google_ads';

export type ValidationStatus = 'valid' | 'unreliable' | 'preliminary';

export type FreshnessStatus = 'fresh' | 'preliminary' | 'stale';

export type ConfidenceLevel = 'high' | 'partial' | 'unverified';

export interface MetricValue {
  value: number | null;
  prior: number | null;
  delta: number | null; // percentage change
  status: ValidationStatus;
  warnings: string[];
}

export interface ValidationResult {
  metric: string;
  value: number | null;
  status: ValidationStatus;
  warnings: string[];
}

export interface RawMetricSet {
  platform: Platform;
  periodStart: Date;
  periodEnd: Date;
  retrievedAt: Date;
  metrics: Record<string, number | null>;
  breakdown?: Record<string, number>;
}

export interface ValidatedMetricSet {
  platform: Platform;
  periodStart: Date;
  periodEnd: Date;
  retrievedAt: Date;
  validated: Record<string, MetricValue>;
  freshnessStatus: FreshnessStatus;
  confidence: ConfidenceSummary;
  warnings: string[];
  passedValidation: boolean; // false if >50% metrics failed
}

/** GA4-specific metric keys for MVP */
export interface GA4Metrics {
  sessions: number | null;
  users: number | null;
  newUsers: number | null;
  bounceRate: number | null;
  avgSessionDuration: number | null;
  topPages: Array<{ page: string; sessions: number }> | null;
  trafficSources: Array<{ source: string; sessions: number; percentage: number }> | null;
}

export interface ConfidenceSummary {
  overall: ConfidenceLevel;
  perMetric: Record<string, ConfidenceLevel>;
}
