import { RawMetricSet } from '@/types/metrics';

export const mockGA4Response: RawMetricSet = {
  platform: 'ga4',
  periodStart: new Date('2024-01-01T00:00:00Z'),
  periodEnd: new Date('2024-01-31T23:59:59Z'),
  retrievedAt: new Date(),
  metrics: {
    sessions: 4500,
    users: 3200,
    newUsers: 2800,
    bounceRate: 0.45,
    avgSessionDuration: 125,
  },
};

export const mockPriorGA4Response: RawMetricSet = {
  platform: 'ga4',
  periodStart: new Date('2023-12-01T00:00:00Z'),
  periodEnd: new Date('2023-12-31T23:59:59Z'),
  retrievedAt: new Date(),
  metrics: {
    sessions: 4000,
    users: 3000,
    newUsers: 2500,
    bounceRate: 0.48,
    avgSessionDuration: 110,
  },
};
