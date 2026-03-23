import type { Platform } from './metrics';
import type { RawMetricSet } from './metrics';

export interface ReportPeriod {
  start: Date;
  end: Date;
  label: string; // e.g., "March 2025"
}

export interface FetchResult {
  raw: Record<string, unknown>; // Full raw API response — stored in audit log
  metrics: RawMetricSet; // Transformed, not yet validated
  priorMetrics?: RawMetricSet; // For PoP comparison
  retrievedAt: Date;
  platform: Platform;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Every data integration (GA4, Meta, GSC, Google Ads) must implement this interface.
 * The report pipeline never knows which platform it talks to.
 */
export interface DataSourceAdapter {
  platform: Platform;
  connect(clientId: string, authCode: string, agencyId: string): Promise<void>;
  refresh(clientId: string): Promise<boolean>; // returns false if refresh fails
  fetch(clientId: string, period: ReportPeriod, accessToken?: string): Promise<FetchResult>;
  isConnected(clientId: string): Promise<boolean>;
  disconnect(clientId: string): Promise<void>;
}
