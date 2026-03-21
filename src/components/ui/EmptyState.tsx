import { cn } from '@/lib/utils';
import { Button } from './Button';
import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  icon:       React.ReactNode;
  title:      string;
  body:       string;
  action?:    { label: string; onClick?: () => void; href?: string };
  className?: string;
}

export function EmptyState({ icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-8 text-center', className)}>
      <div className="w-12 h-12 rounded-[var(--radius-xl)] bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] mb-4">
        {icon}
      </div>
      <h3 className="text-[17px] font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-[14px] text-[var(--text-secondary)] max-w-sm leading-relaxed mb-6">{body}</p>
      {action && (
        action.href ? (
          <Link href={action.href}>
            <Button variant="primary">{action.label}</Button>
          </Link>
        ) : (
          <Button variant="primary" onClick={action.onClick}>{action.label}</Button>
        )
      )}
    </div>
  );
}
