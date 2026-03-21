import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent';

interface BadgeProps {
  variant?:   BadgeVariant;
  dot?:       boolean;
  children:   React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, { pill: string; dot: string }> = {
  default: {
    pill: 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)]',
    dot:  'bg-[var(--text-muted)]',
  },
  success: {
    pill: 'bg-[var(--success-bg)] text-[var(--success)] border-[var(--success)]/20',
    dot:  'bg-[var(--success)]',
  },
  warning: {
    pill: 'bg-[var(--accent-light)] text-[var(--accent-dark)] border-[var(--accent)]/20',
    dot:  'bg-[var(--accent)]',
  },
  error: {
    pill: 'bg-[var(--error-bg)] text-[var(--error)] border-[var(--error)]/20',
    dot:  'bg-[var(--error)]',
  },
  info: {
    pill: 'bg-[var(--info-bg)] text-[var(--info)] border-[var(--info)]/20',
    dot:  'bg-[var(--info)]',
  },
  accent: {
    pill: 'bg-[var(--accent-light)] text-[var(--accent-dark)] border-[var(--accent)]/30',
    dot:  'bg-[var(--accent)]',
  },
};

export function Badge({ variant = 'default', dot = true, children, className }: BadgeProps) {
  const v = variants[variant];
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5',
      'text-[11px] font-medium uppercase tracking-[0.06em]',
      'rounded-full border',
      v.pill,
      className,
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', v.dot)} />}
      {children}
    </span>
  );
}
