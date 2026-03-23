'use client';

import { Card } from '@/components/ui/card';
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
      icon: <Users size={20} />,
      color: '#000000',
    },
    {
      label: 'Reports Generated',
      value: data.reports_generated,
      icon: <FileText size={20} />,
      color: '#000000',
    },
    {
      label: 'Sent This Month',
      value: data.reports_sent_month,
      icon: <Send size={20} />,
      color: '#1A7A3A',
    },
    {
      label: 'Pending Review',
      value: data.pending_reviews,
      icon: <Clock size={20} />,
      color: '#7A5A0A',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div 
          key={item.label} 
          className={`p-6 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-slate-300 ${loading ? 'animate-pulse' : ''}`}
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 text-slate-600 border border-slate-100"
              >
                {item.icon}
              </div>
              {!loading && Math.random() > 0.5 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100/50">
                  +12.5%
                </span>
              )}
            </div>
            
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{item.label}</p>
              <p className="text-3xl font-bold tracking-tight text-slate-900">
                {loading ? '—' : item.value.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
