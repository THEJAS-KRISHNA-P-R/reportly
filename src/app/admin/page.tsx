'use client';

import { useState, useEffect } from 'react';
import { Activity, Users, FileText, Globe, Server, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin').then(res => res.json()),
      fetch('/api/admin/health').then(res => res.json())
    ]).then(([adminRes, healthRes]) => {
      setData(adminRes.ok ? adminRes.data : null);
      setHealth(healthRes.ok ? healthRes.data : null);
    });
  }, []);

  if (!data || !health) return (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <p className="text-sm font-medium text-slate-500">Loading admin telemetry...</p>
    </div>
  );

  const metrics = [
    {
      label: 'Active Agencies',
      value: data.metrics?.total_agencies ?? 0,
      icon: Users,
      tone: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    },
    {
      label: 'Reports Today',
      value: data.metrics?.active_reports_today ?? 0,
      icon: FileText,
      tone: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      label: 'System Health',
      value: health.status === 'HEALTHY' ? '100% (Healthy)' : 'Degraded',
      icon: Activity,
      tone: health.status === 'HEALTHY' 
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
        : 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      label: 'Failed Reports (Month)',
      value: data.metrics?.failed_reports_month ?? 0,
      icon: AlertTriangle,
      tone: 'text-red-700 bg-red-50 border-red-200',
    },
  ];

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${health.status === 'HEALTHY' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
          {health.status === 'HEALTHY' ? <CheckCircle2 size={14} className="text-emerald-600" /> : <AlertTriangle size={14} className="text-amber-600" />}
          <span className={`text-xs font-semibold ${health.status === 'HEALTHY' ? 'text-emerald-600' : 'text-amber-600'}`}>Control plane {(health.status || 'unknown').toLowerCase()}</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Platform State</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          Monitor report generation throughput, tenant activity, and core service availability in one place.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
                <div className={`rounded-lg border p-2 ${metric.tone}`}>
                  <Icon size={15} />
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{metric.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Server size={16} className="text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-900">Infrastructure Services</h2>
          </div>
          <div className="mt-4 space-y-3">
            <StatusRow label="API Gateway" status="Connected" detail={`Latency: ${health.latency_ms}ms`} />
            <StatusRow label="Supabase Postgres" status={health.infrastructure?.postgres === 'UP' ? 'Connected' : 'Error'} detail={health.infrastructure?.postgres === 'UP' ? 'TLS 1.3 active' : 'Connection failed'} />
            <StatusRow label="Redis Queue (BullMQ)" status={health.infrastructure?.redis === 'UP' ? 'Connected' : 'Error'} detail={health.queue ? `${health.queue.waiting} waiting, ${health.queue.active} active` : 'No data'} />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-900">Queue Metrics</h2>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Completed Jobs</span>
              <span className="font-semibold text-slate-900">{health.queue?.completed ?? 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Failed Jobs (DLQ)</span>
              <span className="font-semibold text-rose-600">{health.queue?.failed ?? 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Delayed</span>
              <span className="font-semibold text-slate-900">{health.queue?.delayed ?? 0}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusRow({ label, status, detail }: { label: string; status: string; detail: string }) {
  return (
    <div className="flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
      </div>
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {status}
      </span>
    </div>
  );
}
