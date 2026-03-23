'use client';

import { useState, useEffect } from 'react';
import { Flag, ShieldCheck, Loader2, Cpu } from 'lucide-react';

export default function AdminFlagsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/flags').then(res => res.json()).then(setData);
  }, []);

  if (!data) return (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <p className="text-sm font-medium text-slate-500">Loading feature flags...</p>
    </div>
  );

  const flags = data.flags || {};

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1">
          <Flag size={14} className="text-amber-700" />
          <span className="text-xs font-semibold text-amber-700">Runtime Controls</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Feature Flags</h1>
        <p className="mt-2 text-sm text-slate-600">Current effective flag values for report generation and delivery controls.</p>
      </header>

      {Object.keys(flags).length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          No flags returned by the admin API.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Object.entries(flags).map(([key, val]) => (
            <div key={key} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Flag</p>
                  <p className="mt-1 break-all text-sm font-semibold text-slate-900">{key}</p>
                </div>
                <div className={`rounded-lg border p-2 ${val ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>
                  {val ? <ShieldCheck size={15} /> : <Cpu size={15} />}
                </div>
              </div>

              <div className="mt-4 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide">
                {val ? (
                  <span className="text-emerald-700">Enabled</span>
                ) : (
                  <span className="text-slate-600">Disabled</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
