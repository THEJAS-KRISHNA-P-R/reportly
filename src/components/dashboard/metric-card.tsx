'use client';

import { ReactNode } from 'react';
import { TrendBadge } from '@/components/ui/trend-badge';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: number;
  icon?: ReactNode;
  loading?: boolean;
}

export function MetricCard({ label, value, trend, icon, loading }: MetricCardProps) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group">
      <div className="flex flex-col gap-8">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-700 border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all">
            {icon}
          </div>
          {trend !== undefined && <TrendBadge value={trend} />}
        </div>
        
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">{label}</p>
          <p className="text-4xl font-bold tracking-tight text-slate-900 leading-none">
            {loading ? '...' : value}
          </p>
        </div>
      </div>
    </div>
  );
}

interface MetricGridProps {
  children: ReactNode;
}

export function MetricGrid({ children }: MetricGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {children}
    </div>
  );
}
