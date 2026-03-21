import { cn } from '@/lib/utils';
import React from 'react';

interface CardProps {
  children:   React.ReactNode;
  className?: string;
  hover?:     boolean;
  padding?:   'none' | 'sm' | 'md' | 'lg';
  onClick?:   () => void;
}

const paddings = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
};

export function Card({ children, className, hover, padding = 'md', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-lg)]',
        'shadow-[var(--shadow-card)] transition-shadow duration-[200ms] ease-[ease]',
        hover && 'hover:shadow-[var(--shadow-hover)] cursor-pointer',
        paddings[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-[17px] font-semibold text-[var(--text-primary)]', className)}>
      {children}
    </h3>
  );
}
