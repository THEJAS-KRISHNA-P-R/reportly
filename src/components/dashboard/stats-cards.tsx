'use client';

import { Users, FileText, Send, Clock } from 'lucide-react';

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

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
      icon: <Users size={18} />,
    },
    {
      label: 'Reports Generated',
      value: data.reports_generated,
      icon: <FileText size={18} />,
    },
    {
      label: 'Sent This Month',
      value: data.reports_sent_month,
      icon: <Send size={18} />,
    },
    {
      label: 'Pending Review',
      value: data.pending_reviews,
      icon: <Clock size={18} />,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card 
          key={item.label} 
          className="bg-white border border-border rounded-xl transition-all duration-200 shadow-sm hover:border-foreground-subtle group active:scale-[0.98]"
        >
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div 
                className="w-9 h-9 rounded-lg bg-surface-200 text-foreground-muted border border-border flex items-center justify-center transition-colors group-hover:bg-foreground group-hover:text-background shadow-sm"
              >
                {item.icon}
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">{item.label}</p>
                {loading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-foreground tracking-tight tabular-nums leading-none">
                    {item.value.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
