'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Send,
  RefreshCw,
  FileClock,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Users,
  Timer,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ReportEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'narrative' | 'metrics'>('narrative');
  const [report, setReport] = useState<any>(null);
  const [narrativeHtml, setNarrativeHtml] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Write a clear, metric-backed narrative for this period...' }),
      CharacterCount.configure({ limit: 10000 }),
    ],
    content: '',
    onUpdate: ({ editor: e }) => {
      setNarrativeHtml(e.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-slate max-w-none min-h-[320px] rounded-xl border border-slate-200 bg-white p-4 sm:p-5 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchReport() {
      try {
        setLoading(true);
        const res = await fetch(`/api/reports/${id}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to load report');
        if (!isMounted) return;

        setReport(data);
        const initialNarrative = data.ai_narrative_edited || data.final_narrative || data.ai_narrative_raw || '';
        setNarrativeHtml(initialNarrative);
        editor?.commands.setContent(initialNarrative || '<p></p>');
      } catch (err: any) {
        toast.error(err.message || 'Failed to load report');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchReport();

    return () => {
      isMounted = false;
    };
  }, [id, editor]);

  async function saveDraft() {
    if (!report) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_narrative: narrativeHtml }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      toast.success('Draft saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  }

  async function regenerateNarrative() {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/reports/${id}/regenerate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI regenerate failed');
      const content = data.content || '';
      editor?.commands.setContent(content || '<p></p>');
      setNarrativeHtml(content);
      toast.success('Narrative regenerated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to regenerate narrative');
    } finally {
      setRegenerating(false);
    }
  }

  async function approveAndSend() {
    setApproving(true);
    try {
      // Save latest draft before approval.
      await saveDraft();

      const res = await fetch(`/api/reports/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');

      setReport((prev: any) => ({ ...prev, status: 'sent' }));
      toast.success('Report approved and delivery triggered');
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve report');
    } finally {
      setApproving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[340px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <p className="text-sm font-medium text-slate-500">Loading report workspace...</p>
      </div>
    );
  }

  if (!report) return null;

  const metrics = report.latest_metrics?.validated_metrics || {};
  const freshness = report.latest_metrics?.freshness_status || 'unknown';
  const lastRetrievedAt = report.latest_metrics?.data_retrieved_at
    ? new Date(report.latest_metrics.data_retrieved_at).toLocaleString()
    : 'Unavailable';

  const metricRows = [
    { key: 'sessions', label: 'Sessions', icon: BarChart3 },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'newUsers', label: 'New Users', icon: Users },
    { key: 'avgSessionDuration', label: 'Avg Session Duration', icon: Timer, suffix: 's' },
    { key: 'bounceRate', label: 'Bounce Rate', icon: Timer, suffix: '%' },
  ];

  const reportStatus = String(report.status || 'draft').toLowerCase();

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/reports" className="inline-flex items-center gap-1.5 font-medium hover:text-slate-900">
                <ArrowLeft size={15} />
                Reports
              </Link>
              <span>/</span>
              <span className="truncate">{report.clients?.name || 'Client'}</span>
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {report.month || report.period_start || 'Report Editor'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
              reportStatus === 'sent'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : reportStatus === 'failed'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}>
              <CheckCircle2 size={13} />
              {report.status}
            </span>
            <Link
              href={`/reports/${id}/audit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FileClock size={14} />
              Audit
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={() => setActiveTab('summary')}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === 'summary' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('narrative')}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === 'narrative' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Narrative
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === 'metrics' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Metrics
          </button>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              onClick={regenerateNarrative}
              disabled={regenerating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
            >
              <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
              Regenerate
            </button>
            <button
              onClick={saveDraft}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <Save size={14} />
              Save
            </button>
            <button
              onClick={approveAndSend}
              disabled={approving || reportStatus === 'sent'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={14} />
              {reportStatus === 'sent' ? 'Already Sent' : 'Approve & Send'}
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'summary' && (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-900">Report Readiness</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>Client: <span className="font-medium text-slate-900">{report.clients?.name || 'Unknown'}</span></p>
              <p>Period: <span className="font-medium text-slate-900">{report.month || `${report.period_start} to ${report.period_end}`}</span></p>
              <p>Narrative Source: <span className="font-medium text-slate-900">{report.narrative_source || 'Unknown'}</span></p>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-900">Data Freshness</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>
                Freshness status:{' '}
                <span className={`font-semibold ${
                  freshness === 'fresh' ? 'text-emerald-700' : freshness === 'preliminary' ? 'text-amber-700' : 'text-rose-700'
                }`}>
                  {freshness}
                </span>
              </p>
              <p>Last synced: <span className="font-medium text-slate-900">{lastRetrievedAt}</span></p>
              {freshness !== 'fresh' && (
                <p className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
                  <AlertTriangle size={13} />
                  Data may be incomplete, review before sending.
                </p>
              )}
            </div>
          </article>
        </section>
      )}

      {activeTab === 'narrative' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">AI Narrative</h2>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Sparkles size={13} />
              Editable before approval
            </span>
          </div>
          <EditorContent editor={editor} />
        </section>
      )}

      {activeTab === 'metrics' && (
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metricRows.map((item) => {
              const metric = metrics[item.key];
              const value = typeof metric === 'object' ? metric?.value : metric;
              const delta = typeof metric === 'object' ? metric?.delta : null;
              const status = typeof metric === 'object' ? metric?.status : 'valid';
              const Icon = item.icon;
              return (
                <article key={item.key} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                    <Icon size={14} className="text-slate-500" />
                  </div>
                  <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                    {value ?? 'N/A'}{item.suffix || ''}
                  </p>
                  {delta !== null && delta !== undefined && (
                    <p className={`mt-1 text-xs font-semibold ${Number(delta) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {Number(delta) >= 0 ? '+' : ''}{Number(delta).toFixed(1)}% vs prior period
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">Status: {status || 'unknown'}</p>
                </article>
              );
            })}
          </div>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-slate-900">Traffic Sources</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Source</th>
                    <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {(metrics.trafficSources || []).map((row: any) => (
                    <tr key={row.source} className="border-b border-slate-100 last:border-0">
                      <td className="px-2 py-2 text-sm text-slate-700">{row.source}</td>
                      <td className="px-2 py-2 text-sm font-semibold text-slate-900">{row.sessions}</td>
                    </tr>
                  ))}
                  {(!metrics.trafficSources || metrics.trafficSources.length === 0) && (
                    <tr>
                      <td colSpan={2} className="px-2 py-3 text-sm text-slate-500">No traffic source breakdown available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
