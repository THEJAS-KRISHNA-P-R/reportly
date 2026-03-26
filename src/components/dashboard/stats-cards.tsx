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
          className={cn(
            "group transition-all duration-300 hover:border-white/10 bg-zinc-900/60 border-white/5 shadow-sm rounded-xl"
          )}
        >
          <CardContent className="p-6">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center bg-zinc-900 text-zinc-400 border border-white/5 group-hover:bg-white group-hover:text-black group-hover:border-white transition-colors duration-300"
                >
                  {item.icon}
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted/60">{item.label}</p>
                {loading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight text-foreground">
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
