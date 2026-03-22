'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('[v0] Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md p-6">
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Something went wrong!</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          An error occurred while rendering this page.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-4 overflow-auto rounded-md bg-slate-100 p-3 text-xs text-slate-900 dark:bg-slate-800 dark:text-slate-50">
            {error.message}
          </pre>
        )}

        <div className="mt-6 flex gap-3">
          <Button onClick={reset} variant="primary" className="flex-1">
            Try again
          </Button>
          <Button
            onClick={() => (window.location.href = '/dashboard')}
            variant="outline"
            className="flex-1"
          >
            Go Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
