'use client';

import { useState, useEffect } from 'react';
import { Activity, Users, FileText, Cpu, Globe, Server } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin').then(res => res.json()).then(setData);
  }, []);

  if (!data) return (
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
      value: data.metrics?.system_health ?? 'Unknown',
      icon: Activity,
      tone: 'text-sky-700 bg-sky-50 border-sky-200',
    },
  ];

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
          <Cpu size={14} className="text-slate-600" />
          <span className="text-xs font-semibold text-slate-600">Admin Overview</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Platform State</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          Monitor report generation throughput, tenant activity, and core service availability in one place.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
            <StatusRow label="Ingress Gateway" status="Connected" detail="P95 latency: 12ms" />
            <StatusRow label="Supabase" status="Connected" detail="TLS 1.3 active" />
            <StatusRow label="Redis Queue" status="Connected" detail="No backlog alert" />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-900">Service Notes</h2>
          </div>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>All admin actions are scoped and audited.</li>
            <li>Dead-letter queue requires manual intervention for unresolved items.</li>
            <li>Use feature flags to disable risky subsystems before deploy rollback.</li>
          </ul>
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
