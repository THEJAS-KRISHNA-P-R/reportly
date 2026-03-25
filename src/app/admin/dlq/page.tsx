'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Inbox, RefreshCw, Activity, ShieldCheck, Database, Server } from 'lucide-react';

export default function AdminDLQPage() {
  const [data, setData] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [flags, setFlags] = useState<any[]>([]);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [togglingFlag, setTogglingFlag] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [dlqRes, healthRes, flagsRes] = await Promise.all([
        fetch('/api/admin/dlq').then(res => res.json()),
        fetch('/api/admin/health').then(res => res.json()),
        fetch('/api/admin/flags').then(res => res.json())
      ]);
      setData(dlqRes);
      setHealth(healthRes);
      setFlags(flagsRes.data?.flags || []);
    } catch {
      console.error('Failed to fetch admin data');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (entryId: string) => {
    setRetryingId(entryId);
    try {
      const res = await fetch('/api/admin/dlq/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      alert('Failed to retry job');
    } finally {
      setRetryingId(null);
    }
  };

  const handleToggleFlag = async (flagName: string, currentEnabled: boolean) => {
    setTogglingFlag(flagName);
    try {
      const res = await fetch('/api/admin/flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagName, enabled: !currentEnabled }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      alert('Failed to toggle flag');
    } finally {
      setTogglingFlag(null);
    }
  };

  if (!data || !health) return (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <RefreshCw size={24} className="animate-spin text-slate-400" />
      <p className="ml-3 text-sm font-medium text-slate-500">Initializing Control Plane...</p>
    </div>
  );

  const jobs = data.dlq_jobs ?? [];
  const systemStatus = health.data?.status || 'UNKNOWN';

  return (
    <div className="space-y-6">
      {/* Platform Health Header */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-2 ${systemStatus === 'HEALTHY' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <Activity size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">System Status</p>
              <p className="text-sm font-bold text-slate-900">{systemStatus}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <Database size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Redis/Queue</p>
              <p className="text-sm font-bold text-slate-900">{health.data?.queue?.active ?? 0} Active / {health.data?.queue?.waiting ?? 0} Waiting</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <Server size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Latency</p>
              <p className="text-sm font-bold text-slate-900">{health.data?.latency_ms ?? 0}ms</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-50 p-2 text-slate-600">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Admin Role</p>
              <p className="text-sm font-bold text-slate-900">Verified</p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Configuration Flags */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Platform Configuration</h2>
            <p className="text-sm text-slate-500">Enable or and and and disable platform-wide features in real-time.</p>
          </div>
          <div className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-500 uppercase">
            Live Controls
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {flags.map((flag: any) => (
            <div key={flag.id} className="group relative rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{flag.flag_name.replace(/_/g, ' ').toUpperCase()}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{flag.description || 'No description provided.'}</p>
                </div>
                <button
                  onClick={() => handleToggleFlag(flag.flag_name, flag.enabled)}
                  disabled={togglingFlag === flag.flag_name}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                    flag.enabled ? 'bg-indigo-600' : 'bg-slate-200'
                  } ${togglingFlag === flag.flag_name ? 'opacity-50 cursor-wait' : ''}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      flag.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
          {flags.length === 0 && (
            <div className="col-span-full py-4 text-center">
              <p className="text-xs text-slate-400">No active flags found in registry.</p>
            </div>
          )}
        </div>
      </section>

      <header className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1">
          <AlertCircle size={14} className="text-rose-700" />
          <span className="text-xs font-semibold text-rose-700">Dead Letter Queue</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Failure Investigation</h1>
        <p className="mt-2 text-sm text-slate-600">Critical: Review errors below and and and retry jobs once the root cause (e.g., API limits, network) is resolved.</p>
      </header>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
            <Inbox size={22} />
          </div>
          <p className="text-sm font-semibold text-slate-700">No jobs in dead-letter queue</p>
          <p className="mt-1 text-sm text-slate-500">Your platform is performing within healthy SOTA parameters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">ID / Job</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Failure Reason</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Context</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job: any) => (
                  <tr key={job.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50 last:border-0">
                    <td className="px-4 py-3 align-top">
                      <p className="font-mono text-[10px] text-slate-400">{job.id}</p>
                      <p className="text-xs font-bold text-slate-700">REPORT_GEN</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="rounded-lg bg-rose-50/50 p-2">
                         <p className="text-xs font-medium text-rose-900 line-clamp-2">{job.error_message || 'Unknown failure'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-600">
                      Client: {job.client_id ? String(job.client_id).slice(0, 8) : 'N/A'}<br/>
                      Agency: {job.agency_id ? String(job.agency_id).slice(0, 8) : 'System'}
                    </td>
                    <td className="px-4 py-3 align-top text-[10px] text-slate-500">
                      {job.created_at ? new Date(job.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <button 
                        onClick={() => handleRetry(job.id)}
                        disabled={retryingId === job.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {retryingId === job.id ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        Retry
                      </button>
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
