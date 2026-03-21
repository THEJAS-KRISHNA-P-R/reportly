import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label:       string;
  value:       string | number;
  delta?:      number;
  deltaLabel?: string;
  source?:     string;
  confidence?: 'high' | 'partial' | 'unverified';
  loading?:    boolean;
  className?:  string;
}

export function MetricCard({
  label, value, delta, deltaLabel = 'vs last month',
  source, confidence, loading, className,
}: MetricCardProps) {
  const deltaPositive = delta !== undefined && delta > 0;
  const deltaNeutral  = delta === 0 || delta === undefined;

  return (
    <div className={cn(
      'bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5',
      'transition-shadow duration-[200ms] ease-[ease] hover:shadow-[var(--shadow-hover)]',
      className,
    )}>
      {loading ? (
        <div className="h-16 rounded animate-pulse bg-[var(--bg-surface)]" />
      ) : (
        <>
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)] mb-2">
            {label}
          </p>
          <p className="text-[28px] font-semibold text-[var(--text-primary)] leading-none mb-2">
            {value}
          </p>
          {delta !== undefined && (
            <div className={cn(
              'flex items-center gap-1 text-[13px] font-medium mb-2',
              deltaPositive ? 'text-[var(--success)]' :
              deltaNeutral  ? 'text-[var(--text-muted)]' :
                              'text-[var(--error)]',
            )}>
              {deltaPositive ? (
                <TrendingUp size={13} strokeWidth={2} />
              ) : deltaNeutral ? (
                <Minus size={13} strokeWidth={2} />
              ) : (
                <TrendingDown size={13} strokeWidth={2} />
              )}
              {deltaPositive ? '+' : ''}{delta}% {deltaLabel}
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            {source && (
              <span className="text-[11px] text-[var(--text-muted)]">via {source}</span>
            )}
            {confidence && (
              <span className={cn(
                'text-[11px] font-medium uppercase tracking-wide',
                confidence === 'high'       ? 'text-[var(--success)]' :
                confidence === 'partial'    ? 'text-[var(--warning)]' :
                                              'text-[var(--error)]',
              )}>
                {confidence === 'high' ? '● High' : confidence === 'partial' ? '● Partial' : '● Unverified'}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
