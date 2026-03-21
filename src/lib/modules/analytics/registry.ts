import { DataSourceAdapter } from '@/types/adapters';
import { Platform } from '@/types/metrics';
import { GA4DataSourceAdapter } from './ga4';

class AnalyticsRegistry {
  private adapters: Map<Platform, DataSourceAdapter> = new Map();

  constructor() {
    this.register(new GA4DataSourceAdapter());
  }

  register(adapter: DataSourceAdapter) {
    this.adapters.set(adapter.platform, adapter);
  }

  getAdapter(platform: Platform): DataSourceAdapter {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      throw new Error(`Data source adapter for ${platform} not registered`);
    }
    return adapter;
  }
}

export const analyticsRegistry = new AnalyticsRegistry();
