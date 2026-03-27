'use client';

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

// Base pulse unit
export function Bone({ className, style }: { className?: string, style?: any }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-black/[0.05]", className)} style={style} />
  );
}

// Metric card skeleton
export function MetricCardSkeleton() {
  return (
    <Card className="glass-card p-0">
      <div className="p-5">
        <div className="flex justify-between mb-3">
          <Bone className="h-3 w-20" />
          <Bone className="h-6 w-6 rounded-lg" />
        </div>
        <Bone className="h-8 w-24 mb-1.5" />
        <Bone className="h-2.5 w-16" />
      </div>
    </Card>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number, cols?: number }) {
  return (
    <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white overflow-hidden shadow-sm">
      <div className="border-b border-[rgba(0,0,0,0.06)] px-4 py-3 flex gap-8">
        {Array.from({ length: cols }).map((_, i) => (
          <Bone key={i} className="h-2.5 w-16" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-8 px-4 py-3 border-b border-[rgba(0,0,0,0.04)] last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <Bone key={j} className="h-3" style={{ width: `${60 + Math.random() * 80}px` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// Page skeleton
export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Bone className="h-6 w-40" />
        <Bone className="h-9 w-24 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)}
      </div>
      <TableSkeleton rows={8} cols={5} />
    </div>
  );
}

export function PageLoader({ rows: _rows = 4 }: { rows?: number }) {
  return <PageSkeleton />;
}

export function Spinner({ size = 'sm', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' };
  return (
    <svg
      className={cn(`animate-spin text-foreground-muted opacity-70`, sizes[size], className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
