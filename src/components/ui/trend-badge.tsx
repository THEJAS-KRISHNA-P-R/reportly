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
      isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
    }`}>
      {isPositive ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
      <span>{Math.abs(value)}%</span>
      {label && <span className="opacity-60 ml-0.5">{label}</span>}
    </div>
  );
}
