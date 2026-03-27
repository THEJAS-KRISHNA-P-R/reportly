'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, FileText, Search, Eye, Download, X, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLoader } from '@/components/ui/page-loader';
import { ReportProgressCard } from '@/components/reports/report-progress-card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Scaffold } from '@/components/layout/Scaffold';

type ReportListResponse =
  | any[]
  | {
      ok: boolean;
      data?: any[];
      error?: { code?: string; message?: string };
    };

function unwrapReports(payload: ReportListResponse): any[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && 'ok' in payload) {
    if (payload.ok && Array.isArray(payload.data)) return payload.data;
  }
  return [];
}


export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch('/api/reports');
        if (res.ok) {
          const data = await res.json();
          setReports(unwrapReports(data));
        }
      } catch {
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const handleExport = (report: any) => {
    try {
      const metrics = report.latest_metrics?.validated_metrics || {};
      const exportData = [
        ['Report Detail', 'Value'],
        ['Client', report.clients?.name],
        ['Period', report.month],
        ['Status', report.status],
        ['Created At', new Date(report.created_at).toLocaleString()],
        [''],
        ['Metric', 'Value', 'Delta (%)'],
        ...Object.entries(metrics).map(([key, val]: [string, any]) => [
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
      link.setAttribute('download', `report_export_${report.clients?.name}_${report.month}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Enterprise data export completed');
    } catch {
      toast.error('Export failed');
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ready':
      case 'approved':
      case 'sent': return 'default';
      case 'error': return 'destructive';
      case 'generating': return 'secondary';
      default: return 'outline';
    }
  };

  const filtered = reports.filter(r => 
    r.clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.month.includes(search)
  );

  const actions = (
    <div className="flex items-center gap-3">
      <div className="relative group min-w-[320px] hidden sm:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
        <input
          type="text"
          placeholder="Filter reports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-9 pr-4 rounded-md bg-surface-200 border border-transparent text-sm outline-none transition-all focus:border-border focus:bg-white w-full placeholder:text-slate-400 text-slate-900"
        />
      </div>
      <Button asChild variant="primary" className="h-9 px-4 font-bold shadow-sm">
        <Link href="/clients">
          <Plus size={16} className="mr-1.5" /> Generate Report
        </Link>
      </Button>
    </div>
  );

  return (
    <>
      <Scaffold
        title="Reports"
        description="View and manage your historical report records and delivery status."
        actions={actions}
      >
        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-1 items-center justify-center min-h-[400px]">
              <PageLoader />
            </div>
          ) : filtered.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl h-[400px] flex flex-col items-center justify-center text-center p-8 bg-surface-200/50">
              <div className="w-12 h-12 rounded-lg bg-surface-300 flex items-center justify-center mb-4 text-foreground-subtle border border-border">
                <FileText size={20} />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">No reports found</h3>
              <p className="text-sm text-foreground-muted max-w-sm mb-6">
                Reports will appear here once they have been generated for your clients.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(report => {
                const clientName = report.clients?.name || 'Unknown Client';
                
                return (
                  <div 
                    key={report.id} 
                    className="bg-white border border-border rounded-xl p-6 flex flex-col h-full hover:border-foreground-subtle transition-all duration-200 shadow-sm"
                  >
                    <Link 
                      href={`/reports/${report.id}`}
                      className="flex-1 cursor-pointer group"
                    >
                      <div className="mb-6 flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-200 text-sm font-medium text-foreground-muted border border-border transition-colors group-hover:bg-surface-300">
                          {clientName.charAt(0).toUpperCase()}
                        </div>
                        <Badge variant="outline" className="capitalize font-medium text-[10px] rounded-full px-2.5 py-0.5 border-border text-foreground-muted bg-surface-200">
                          {report.status}
                        </Badge>
                      </div>

                      <div className="space-y-1 mb-6">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">{report.month}</p>
                        <h3 className="text-base font-medium text-foreground leading-tight">
                          {clientName}
                        </h3>
                      </div>
                    </Link>
                    
                    <div className="grid grid-cols-2 gap-2 mt-auto pt-5 border-t border-border">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (report.pdf_url) {
                            setPreviewUrl(report.pdf_url);
                          } else {
                            toast.info('PDF is still being processed.');
                          }
                        }}
                        disabled={report.status === 'generating'}
                        className={cn(
                          "flex items-center justify-center gap-2 h-8 rounded-md text-xs font-medium transition-all",
                          report.pdf_url 
                            ? "bg-foreground text-background hover:opacity-90" 
                            : "bg-surface-300 text-foreground-subtle cursor-not-allowed"
                        )}
                      >
                        <Eye size={14} /> View
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport(report);
                        }}
                        className="flex items-center justify-center gap-2 h-8 rounded-md bg-surface-200 text-foreground-muted hover:text-foreground hover:bg-surface-300 border border-border text-xs font-medium transition-all"
                      >
                        <Download size={14} /> Export
                      </button>
                    </div>

                    {/* Progress Indicator */}
                    {(report.status === 'generating' || report.status === 'queued') && (
                      <div className="mt-4">
                        <ReportProgressCard
                          reportId={report.id}
                          initialStatus={report.status}
                          initialStep={report.current_step}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Scaffold>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewUrl(null)}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="bg-surface-100 border border-border shadow-2xl relative w-full h-full max-w-5xl flex flex-col rounded-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-200">
                 <div className="flex items-center gap-2.5">
                   <div className="p-1.5 bg-slate-900/5 text-slate-900 rounded-md">
                     <FileText size={16} />
                   </div>
                   <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Enterprise PDF Preview</span>
                 </div>
                 <button 
                   onClick={() => setPreviewUrl(null)}
                   className="p-1.5 rounded-md hover:bg-slate-300 text-slate-500 hover:text-slate-900 transition-all"
                 >
                   <X size={18} />
                 </button>
              </div>
              <div className="flex-1 bg-surface-100 flex">
                {previewUrl.startsWith('http') ? (
                  <iframe src={previewUrl} className="w-full h-full border-none" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-20 text-center">
                    <div>
                      <Check size={40} className="mx-auto text-green-500 mb-4" />
                      <p className="text-lg font-bold text-slate-900">PDF Ready for Download</p>
                      <p className="text-sm text-slate-500 mt-1.5 mb-6">This report is stored in the encrypted storage node.</p>
                      <a 
                        href={previewUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800 shadow-sm"
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
    </>
  );
}
