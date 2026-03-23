'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, User, AlertTriangle, CheckCircle2, FileClock } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportAuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadAudit() {
      try {
        setLoading(true);
        const res = await fetch(`/api/reports/${id}/audit`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load audit logs');
        if (!isMounted) return;
        setLogs(data.logs || []);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load audit trail');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAudit();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href={`/reports/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
              <ArrowLeft size={15} />
              Back to editor
            </Link>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Audit Trail</h1>
            <p className="mt-1 text-sm text-slate-600">Immutable events for this report generation and delivery lifecycle.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
            <FileClock size={14} />
            {logs.length} events
          </span>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading audit events...</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No audit events found for this report.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Time</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Event</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Details</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Actor</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const payloadSummary = summarizePayload(log.payload);
                  const isFailure = String(log.event_type).includes('fail') || String(log.event_type).includes('rejected');
                  return (
                    <tr key={log.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 align-top text-sm text-slate-600">
                        <div className="inline-flex items-center gap-1.5">
                          <Clock size={13} />
                          {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          isFailure
                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }`}>
                          {isFailure ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                          {log.event_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-slate-700">{payloadSummary}</td>
                      <td className="px-4 py-3 align-top text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <User size={13} />
                          {log.actor_id || 'system'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function summarizePayload(payload: unknown): string {
  if (!payload) return '-';
  if (typeof payload === 'string') return payload;
  if (typeof payload !== 'object') return String(payload);

  const obj = payload as Record<string, unknown>;
  const keys = Object.keys(obj).slice(0, 3);
  if (keys.length === 0) return '-';

  return keys
    .map((k) => `${k}: ${toShortValue(obj[k])}`)
    .join(' | ');
}

function toShortValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return value.length > 60 ? `${value.slice(0, 57)}...` : value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `array(${value.length})`;
  return 'object';
}
