import React, { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

export interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  textColor?: string;
  className?: string;
  children?: React.ReactNode;
}

const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = '#ffffff',
      shimmerSize = '0.05em',
      shimmerDuration = '3s',
      borderRadius = '100px',
      background = 'rgba(0, 0, 0, 1)',
      textColor = '#ffffff',
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        style={
          {
            '--spread': '90deg',
            '--shimmer-color': shimmerColor,
            '--radius': borderRadius,
            '--speed': shimmerDuration,
            '--cut': shimmerSize,
            '--bg': background,
            '--text': textColor,
          } as CSSProperties
        }
        className={cn(
          'group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-6 py-3 [color:var(--text)] [border-radius:var(--radius)]',
          'transform-gpu transition-transform duration-300 ease-in-out hover:scale-[1.02] active:translate-y-px',
          className,
        )}
        ref={ref}
        {...props}
      >
        {/* rotating border shimmer */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden [border-radius:var(--radius)]">
          <div
            className={cn(
              'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square w-[max(300%,_200px)] animate-spin',
              '[background:conic-gradient(from_0deg,transparent_0deg,transparent_290deg,var(--shimmer-color)_330deg,transparent_360deg)]',
              '[filter:drop-shadow(0_0_10px_var(--shimmer-color))]'
            )}
            style={{ animationDuration: 'calc(var(--speed) * 2)' }}
          />
        </div>

        {/* button fill */}
        <div className="pointer-events-none absolute inset-[2px] z-10 [background:var(--bg)] [border-radius:calc(var(--radius)-2px)]" />

        {/* traveling sheen */}
        <div className="pointer-events-none absolute inset-[2px] z-20 overflow-hidden [border-radius:calc(var(--radius)-2px)]">
          <div className="absolute -inset-y-full left-[-35%] w-[35%] skew-x-[-20deg] animate-shimmer-slide [background:linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)]" />
        </div>

        <span className="relative z-30 inline-flex items-center gap-3">{children}</span>

        {/* Highlight */}
        <div
          className={cn(
            'pointer-events-none inset-[2px] absolute z-20 size-auto [border-radius:calc(var(--radius)-2px)]',
            'px-4 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#ffffff1f]',
            'transform-gpu transition-all duration-300 ease-in-out',
            'group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]',
            'group-active:shadow-[inset_0_-10px_10px_#ffffff3f]',
          )}
        />
      </button>
    );
  },
);

ShimmerButton.displayName = 'ShimmerButton';

export { ShimmerButton };
