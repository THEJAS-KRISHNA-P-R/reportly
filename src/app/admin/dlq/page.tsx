'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Inbox } from 'lucide-react';

export default function AdminDLQPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/dlq').then(res => res.json()).then(setData);
  }, []);

  if (!data) return (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <p className="text-sm font-medium text-slate-500">Loading dead-letter queue...</p>
    </div>
  );

  const jobs = data.dlq_jobs ?? [];

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1">
          <AlertCircle size={14} className="text-rose-700" />
          <span className="text-xs font-semibold text-rose-700">DLQ Monitor</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Dead Letter Queue</h1>
        <p className="mt-2 text-sm text-slate-600">Failed jobs that exhausted retries and require investigation.</p>
      </header>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
            <Inbox size={22} />
          </div>
          <p className="text-sm font-semibold text-slate-700">No jobs in dead-letter queue</p>
          <p className="mt-1 text-sm text-slate-500">All failed jobs have been handled or retried successfully.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Job</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Error</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Client</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job: any) => (
                  <tr key={job.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 align-top">
                      <p className="font-mono text-xs text-slate-700">{String(job.id).slice(0, 12)}...</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="max-w-xl text-sm text-slate-800">{job.error_message || job.error || 'Unknown failure'}</p>
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-slate-600">{job.client_id ? String(job.client_id).slice(0, 8) : 'N/A'}</td>
                    <td className="px-4 py-3 align-top text-sm text-slate-600">
                      {job.created_at ? new Date(job.created_at).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
