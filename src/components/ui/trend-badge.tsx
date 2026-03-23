'use client';

import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface TrendBadgeProps {
  value: number;
  label?: string;
}

export function TrendBadge({ value, label }: TrendBadgeProps) {
  const isPositive = value >= 0;
  
  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
      isPositive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
    }`}>
      {isPositive ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
      <span>{Math.abs(value)}%</span>
      {label && <span className="opacity-60 ml-0.5">{label}</span>}
    </div>
  );
}
