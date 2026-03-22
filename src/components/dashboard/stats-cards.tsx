'use client';

import { Card } from '@/components/ui/card';

export interface DashboardStats {
  total_clients: number;
  reports_generated: number;
  reports_sent_month: number;
  pending_reviews: number;
}

interface StatsCardsProps {
  stats?: DashboardStats;
  loading?: boolean;
}

export function StatsCards({ stats, loading = false }: StatsCardsProps) {
  const defaultStats: DashboardStats = {
    total_clients: 0,
    reports_generated: 0,
    reports_sent_month: 0,
    pending_reviews: 0,
  };

  const data = stats || defaultStats;

  const items = [
    {
      label: 'Total Clients',
      value: data.total_clients,
      icon: '👥',
    },
    {
      label: 'Reports Generated',
      value: data.reports_generated,
      icon: '📄',
    },
    {
      label: 'Sent This Month',
      value: data.reports_sent_month,
      icon: '📧',
    },
    {
      label: 'Pending Review',
      value: data.pending_reviews,
      icon: '⏳',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className={`p-6 ${loading ? 'animate-pulse' : ''}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {loading ? (
                  <span className="h-8 w-12 rounded bg-slate-200 dark:bg-slate-700" />
                ) : (
                  item.value
                )}
              </p>
            </div>
            <span className="text-2xl">{item.icon}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
