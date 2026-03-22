'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DLQJob {
  id: string;
  type: string;
  error: string;
  failed_at: string;
  retry_count: number;
}

export default function AdminPage() {
  const [dlqJobs, setDlqJobs] = useState<DLQJob[]>([]);
  const [retrying, setRetrying] = useState<string | null>(null);

  // TODO: Fetch DLQ jobs from API on mount

  const handleRetryJob = async (jobId: string) => {
    setRetrying(jobId);
    try {
      // TODO: Call API to retry job
      console.log('Retrying job:', jobId);
    } finally {
      setRetrying(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Panel</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          System monitoring and administration
        </p>
      </div>

      {/* System Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Active Users</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">0</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Failed Jobs</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{dlqJobs.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Reports Sent</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">0</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Email Failures</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">0</p>
        </Card>
      </div>

      {/* DLQ Panel */}
      <Card>
        <div className="border-b border-slate-200 p-6 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Dead Letter Queue (DLQ)</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Failed background jobs waiting for retry
          </p>
        </div>

        {dlqJobs.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-slate-600 dark:text-slate-400">No failed jobs</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {dlqJobs.map((job) => (
              <div key={job.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-200">
                        {job.type}
                      </span>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(job.failed_at).toLocaleString()}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{job.error}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Retries: {job.retry_count}/3
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRetryJob(job.id)}
                    disabled={retrying === job.id}
                  >
                    {retrying === job.id ? 'Retrying...' : 'Retry'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Feature Flags */}
      <Card>
        <div className="border-b border-slate-200 p-6 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Feature Flags</h2>
        </div>

        <div className="divide-y divide-slate-200 p-6 dark:divide-slate-700">
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-slate-900 dark:text-white">AI Narrative Generation</span>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-slate-900 dark:text-white">PDF Export</span>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-slate-900 dark:text-white">Email Delivery</span>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
        </div>
      </Card>
    </div>
  );
}
