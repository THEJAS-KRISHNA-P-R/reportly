'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ScaffoldProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export function Scaffold({ 
  children, 
  className,
  title,
  description,
  actions
}: ScaffoldProps) {
  return (
    <div className={cn("flex flex-col flex-1", className)}>
      <AnimatePresence mode="wait">
        {(title || description || actions) && (
          <motion.div 
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-b border-border bg-white sticky top-0 z-30"
          >
            <div className="max-w-screen-2xl mx-auto px-6 py-6 md:px-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  {title && (
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                      {title}
                    </h1>
                  )}
                  {description && (
                    <p className="text-sm text-foreground-muted max-w-2xl leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
                {actions && (
                  <div className="flex items-center gap-2.5 shrink-0">
                    {actions}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="max-w-screen-2xl mx-auto w-full px-6 py-8 md:px-8 flex-1"
      >
        {children}
      </motion.div>
    </div>
  );
}
