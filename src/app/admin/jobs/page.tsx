'use client';

import { useState, useEffect } from 'react';
import { Clock, Activity, CheckCircle2, AlertCircle, Loader2, BarChart3 } from 'lucide-react';

export default function AdminJobsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/jobs').then(res => res.json()).then(setData);
  }, []);

  if (!data) return (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <p className="text-sm font-medium text-slate-500">Loading queue telemetry...</p>
    </div>
  );

  const cards = [
    { label: 'Active', value: data.active ?? 0, icon: Activity, tone: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    { label: 'Queued', value: data.waiting ?? 0, icon: Clock, tone: 'text-sky-700 bg-sky-50 border-sky-200' },
    { label: 'Completed', value: data.completed ?? 0, icon: CheckCircle2, tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { label: 'Failed', value: data.failed ?? 0, icon: AlertCircle, tone: 'text-rose-700 bg-rose-50 border-rose-200' },
  ];

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
          <BarChart3 size={14} className="text-slate-600" />
          <span className="text-xs font-semibold text-slate-600">Queue Health</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Worker Queue</h1>
        <p className="mt-2 text-sm text-slate-600">Observe async processing throughput and identify failure spikes early.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                <div className={`rounded-lg border p-2 ${card.tone}`}>
                  <Icon size={14} />
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Queue Notes</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>Jobs should move from queued to processing within expected worker polling intervals.</li>
          <li>Escalate when failed count increases faster than completed count.</li>
          <li>Inspect dead-letter queue for retries that exceeded the backoff policy.</li>
        </ul>
      </section>
    </div>
  );
}
