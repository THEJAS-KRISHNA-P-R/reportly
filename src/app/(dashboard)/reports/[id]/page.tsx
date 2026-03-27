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
  Timer,
  Eye,
  Download,
  X,
  FileText,
  Check,
  BarChart3,
  Users,
  AlertTriangle,
  Maximize2
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
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
  const [reportStatus, setReportStatus] = useState<string>(report?.status || 'pending');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
    let pollInterval: NodeJS.Timeout;

    async function fetchReport(isSilent = false) {
      try {
        if (!isSilent && !report) setLoading(true); // ONLY set loading true if we don't have local data yet
        const res = await fetch(`/api/reports/${id}`, { cache: 'no-store' });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to load report');
        if (!isMounted) return;

        const reportData = data.data;
        const status = reportData.status.toLowerCase();
        
        setReport(reportData);
        setReportStatus(status);

        // Populate narrative if not already being edited
        if (!isSilent || !editor?.getHTML() || editor?.getHTML() === '<p></p>') {
          const initialNarrative = reportData.ai_narrative_edited || reportData.final_narrative || reportData.ai_narrative_raw || '';
          setNarrativeHtml(initialNarrative);
          editor?.commands.setContent(initialNarrative || '<p></p>');
        }
      } catch {
        if (!isSilent) toast.error('Failed to load report');
      } finally {
        if (isMounted && !isSilent) setLoading(false);
      }
    }

    fetchReport();

    // Polling logic for in-progress reports
    if (reportStatus === 'generating' || reportStatus === 'pending') {
      pollInterval = setInterval(() => {
        fetchReport(true);
      }, 5000);
    }

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, reportStatus]); // Excluded 'editor' to prevent excessive teardowns

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
      if (!res.ok) throw new Error(data.error?.message || 'Save failed');
      toast.success('Draft saved');
    } catch {
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  }

  async function regenerateNarrative() {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/reports/${id}/regenerate`, { 
        method: 'POST',
        cache: 'no-store'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'AI regenerate failed');
      const content = data.data.content || '';
      editor?.commands.setContent(content || '<p></p>');
      setNarrativeHtml(content);
      toast.success('Narrative regenerated');
    } catch {
      toast.error('Failed to regenerate narrative');
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
      if (!res.ok) throw new Error(data.error?.message || 'Approval failed');

      setReport((prev: any) => ({ ...prev, status: 'sent' }));
      setReportStatus('sent');
      toast.success('Report approved and delivery triggered');
    } catch {
      toast.error('Failed to approve report');
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

  const regeneratePDF = async () => {
    try {
      toast.promise(
        fetch(`/api/reports/${id}/pdf`, { method: 'POST' })
          .then(async res => {
            if (!res.ok) throw new Error('PDF Generation failed');
            const data = await res.json();
            // Force a slight delay to ensure storage distribution
            await new Promise(resolve => setTimeout(resolve, 1500));
            setReport((prev: any) => ({ ...prev, pdf_url: data.pdf_url }));
            return data;
          }),
        {
          loading: 'Generating High-Density PDF...',
          success: 'Report PDF is now accessible',
          error: (err) => err.message
        }
      );
    } catch {
      // console.error(err);
    }
  };

  const metrics = report.latest_metrics?.validated_metrics || {};
  const breakdown = report.latest_metrics?.breakdown || {};
  const trafficSources = breakdown.trafficSources || [];
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


  const handleExport = () => {

    try {
      const metricsData = report.latest_metrics?.validated_metrics || {};
      const exportData = [
        ['Report Detail', 'Value'],
        ['Client', report.clients?.name],
        ['Period', report.month || report.period_start],
        ['Status', report.status],
        ['Created At', new Date(report.created_at).toLocaleString()],
        [''],
        ['Metric', 'Value', 'Delta (%)'],
        ...Object.entries(metricsData).map(([key, val]: [string, any]) => [
          key,
          typeof val === 'object' ? val.value : val,
          typeof val === 'object' ? val.delta : 'N/A'
        ])
      ];

      const csvContent = exportData.map(e => e.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `report_export_${report.clients?.name}_${report.month || id}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Enterprise data export completed');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/reports" className="inline-flex items-center gap-1.5 font-medium hover:text-primary transition-colors">
                <ArrowLeft size={15} />
                Reports
              </Link>
              <span className="text-slate-300">/</span>
              <span className="truncate font-medium text-slate-400">{report.clients?.name || 'Client'}</span>
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {report.month || report.period_start || 'Report Editor'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-tight shadow-sm ${
              reportStatus === 'sent' || reportStatus === 'approved'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : reportStatus === 'failed'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : reportStatus === 'generating'
                ? 'border-primary/20 bg-primary/5 text-primary'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}>
              {reportStatus === 'generating' ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <CheckCircle2 size={12} />
              )}
              {reportStatus.charAt(0).toUpperCase() + reportStatus.slice(1)}
            </span>
            <Link
              href={`/reports/${id}/audit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all hover:border-slate-300 active:scale-[0.98]"
            >
              <FileClock size={14} />
              Audit Log
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <div className="flex gap-1 p-1 bg-surface-200 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('summary')}
              className={`rounded-lg px-4 py-1.5 text-[11px] font-bold transition-all relative ${
                activeTab === 'summary' 
                  ? 'bg-white text-primary shadow-sm ring-1 ring-black/[0.05]' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Summary
              {activeTab === 'summary' && <motion.div layoutId="tab-accent" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />}
            </button>
            <button
              onClick={() => setActiveTab('narrative')}
              className={`rounded-lg px-4 py-1.5 text-[11px] font-bold transition-all relative ${
                activeTab === 'narrative' 
                  ? 'bg-white text-primary shadow-sm ring-1 ring-black/[0.05]' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Narrative
              {activeTab === 'narrative' && <motion.div layoutId="tab-accent" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />}
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`rounded-lg px-4 py-1.5 text-[11px] font-bold transition-all relative ${
                activeTab === 'metrics' 
                  ? 'bg-white text-primary shadow-sm ring-1 ring-black/[0.05]' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Metrics
              {activeTab === 'metrics' && <motion.div layoutId="tab-accent" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />}
            </button>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
            
            <button
              onClick={() => report.pdf_url ? setPreviewUrl(report.pdf_url) : regeneratePDF()}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-all active:scale-[0.98] ${
                report.pdf_url 
                  ? 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300' 
                  : 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 shadow-sm'
              }`}
            >
              <Eye size={14} />
              {report.pdf_url ? 'Preview PDF' : 'Generate PDF'}
            </button>
            
            <button
               onClick={handleExport}
               className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]"
             >
               <BarChart3 size={14} />
               Export CSV
             </button>

             {report.pdf_url && (
               <a
                 href={report.pdf_url}
                 download={`Report_${report.clients?.name || 'Client'}.pdf`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-all active:scale-[0.98]"
               >
                 <Download size={14} />
                 Download PDF
               </a>
             )}

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            <button
              onClick={regenerateNarrative}
              disabled={regenerating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10 disabled:opacity-60 transition-all active:scale-[0.98]"
            >
              <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
              Regenerate
            </button>
            <button
              onClick={saveDraft}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-all active:scale-[0.98]"
            >
              <Save size={14} />
              Save
            </button>
            <button
              onClick={approveAndSend}
              disabled={approving || reportStatus === 'sent'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-primary/20 transition-all active:scale-[0.96]"
            >
              <Send size={14} />
              {reportStatus === 'sent' ? 'Sent' : 'Approve & Send'}
            </button>
          </div>
        </div>
      </header>

      {/* Preview Modal (Same as in list page) */}
      <AnimatePresence>
        {previewUrl && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewUrl(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full h-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white shadow-sm">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                     <FileText size={18} />
                   </div>
                   <span className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Enterprise PDF Preview</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <a 
                     href={previewUrl} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-4 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all"
                   >
                     <Maximize2 size={14} />
                     Full Screen
                   </a>
                   <button 
                     onClick={() => setPreviewUrl(null)}
                     className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
                   >
                     <X size={20} />
                   </button>
                 </div>
              </div>
              <div className="flex-1 bg-slate-100">
                {previewUrl.startsWith('http') ? (
                  <iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-20 text-center bg-white">
                    <div>
                      <Check size={48} className="mx-auto text-emerald-500 mb-4" />
                      <p className="text-lg font-bold text-slate-900">PDF Ready for Download</p>
                      <p className="text-sm text-slate-500 mt-2 mb-6">This report is stored in the encrypted storage node.</p>
                      <a 
                        href={previewUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                      >
                         Open PDF Node →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Progress Overlay for Generating State */}
      <AnimatePresence>
        {(reportStatus === 'generating' || reportStatus === 'pending') && (
          <div className="mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-8 text-center backdrop-blur-sm"
            >
              <div className="mx-auto max-w-md">
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-indigo-200 opacity-20" />
                    <div className="relative rounded-2xl bg-white p-4 shadow-sm border border-indigo-100">
                      <RefreshCw className="animate-spin text-indigo-600" size={32} />
                    </div>
                  </div>
                </div>
                
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  {report.current_step?.name || 'Preparing Report Generation...'}
                </h2>
                <p className="text-sm text-slate-500 mb-8">
                  We're fetching data and synthesizing insights. This usually takes 30-60 seconds.
                </p>
                
                {/* Progress Bar */}
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 mb-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${report.current_step?.percentage || 10}%` }}
                    className="h-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                    transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span>Initialization</span>
                  <span>{report.current_step?.percentage || 10}% Complete</span>
                  <span>Ready</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                   {trafficSources.map((row: any) => (
                    <tr key={row.source} className="border-b border-slate-100 last:border-0">
                      <td className="px-2 py-2 text-sm text-slate-700">{row.source}</td>
                      <td className="px-2 py-2 text-sm font-semibold text-slate-900">{row.sessions}</td>
                    </tr>
                  ))}
                  {(!trafficSources || trafficSources.length === 0) && (
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
