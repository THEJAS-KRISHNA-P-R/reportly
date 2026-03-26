'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, FileText, Search, Eye, Download, X, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLoader } from '@/components/ui/page-loader';
import { ReportProgressCard } from '@/components/reports/report-progress-card';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-4 py-6 animate-fade-in">
      {/* Search & Actions Area */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between px-1">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Intelligence Archive</h2>
          <p className="text-sm font-medium text-foreground-muted opacity-60">Historical performance records and delivery status.</p>
        </div>
        
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-80 sm:flex-none">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted opacity-60" />
            <input
              type="text"
              placeholder="Search clients or periods..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-11 pr-4 rounded-lg bg-zinc-900/60 border border-white/5 text-sm font-medium outline-none transition-all focus:border-white/20 focus:bg-zinc-900 w-full placeholder:text-zinc-500"
            />
          </div>
          <Link
            href="/clients"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-black transition-all hover:bg-white/90 shadow-sm"
          >
            <Plus size={16} /> Generate Report
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-8">
        {loading ? (
          <PageLoader rows={3} />
        ) : filtered.length === 0 ? (
          <Card className="shadow-sm border-dashed border-2 border-white/5 bg-zinc-900/40">
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-lg bg-zinc-900 flex items-center justify-center mb-6 text-zinc-500 border border-white/5">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">No records localized</h3>
              <p className="text-sm font-medium text-foreground-muted max-w-xs mx-auto opacity-60">
                Your intelligence archive is empty. Reports appear once generated from client nodes.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(report => {
              const clientName = report.clients?.name || 'Unknown Node';
              
              return (
                <Card 
                  key={report.id} 
                  className="group relative flex flex-col shadow-sm border-white/5 hover:border-white/10 bg-zinc-900/60 transition-all duration-300"
                >
                  <CardContent className="p-5 flex flex-col h-full">
                    <Link 
                      href={`/reports/${report.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="mb-8 flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-zinc-400 transition-all duration-300 group-hover:bg-white group-hover:text-black border border-white/5">
                          {clientName.charAt(0).toUpperCase()}
                        </div>
                        <Badge variant={getStatusVariant(report.status)} className="capitalize font-bold text-[9px] tracking-widest rounded-full px-3 py-0.5 border-transparent">
                          {report.status}
                        </Badge>
                      </div>

                      <div className="space-y-1 mb-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">{report.month}</p>
                        <h3 className="text-lg font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                          {clientName}
                        </h3>
                      </div>
                    </Link>
                    
                    <div className="grid grid-cols-2 gap-3 mt-auto pt-6 border-t border-white/5">
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           if (report.pdf_url) {
                             setPreviewUrl(report.pdf_url);
                           } else {
                             toast.info('PDF is still being processed. Please wait.');
                           }
                         }}
                         disabled={report.status === 'generating'}
                         className={cn(
                           "flex items-center justify-center gap-2 h-10 rounded-lg text-[11px] font-bold transition-all border",
                           report.pdf_url 
                            ? "bg-zinc-900 text-white hover:bg-white/10 border-white/10" 
                            : "bg-zinc-900/50 text-zinc-500 cursor-not-allowed border-transparent"
                         )}
                       >
                         <Eye size={14} /> View Node
                       </button>
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           handleExport(report);
                         }}
                         className="flex items-center justify-center gap-2 h-10 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5 text-[11px] font-bold transition-all"
                       >
                         <Download size={14} /> Export Data
                       </button>
                    </div>

                     {/* Live Progress Indicator for generating/queued reports */}
                     {(report.status === 'generating' || report.status === 'queued') && (
                       <div className="mt-4">
                         <ReportProgressCard
                           reportId={report.id}
                           initialStatus={report.status}
                           initialStep={report.current_step}
                         />
                       </div>
                     )}

                     {/* Failure Visibility */}
                     {report.status === 'failed' && report.error_reason && (
                       <div className="mt-4 rounded-lg bg-error/5 p-3 border border-error/10 flex items-start gap-2">
                         <AlertTriangle size={14} className="text-error mt-0.5 shrink-0" />
                         <div className="text-[11px] text-error">
                           <p className="font-bold">Generation Failed</p>
                           <p className="mt-0.5 opacity-90 break-words line-clamp-2" title={report.error_reason}>
                             {report.error_reason}
                           </p>
                         </div>
                       </div>
                     )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewUrl(null)}
              className="absolute inset-0 bg-primary/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full h-full max-w-5xl bg-zinc-900/90 backdrop-blur-3xl rounded-lg overflow-hidden shadow-2xl flex flex-col border border-white/10"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
                 <div className="flex items-center gap-2.5">
                   <div className="p-1.5 bg-primary/5 text-primary rounded-md">
                     <FileText size={16} />
                   </div>
                   <span className="text-xs font-semibold text-foreground uppercase tracking-widest">Enterprise PDF Preview</span>
                 </div>
                 <button 
                   onClick={() => setPreviewUrl(null)}
                   className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                 >
                   <X size={18} />
                 </button>
              </div>
              <div className="flex-1 bg-zinc-950/50 flex">
                {previewUrl.startsWith('http') ? (
                  <iframe src={previewUrl} className="w-full h-full border-none" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-20 text-center">
                    <div>
                      <Check size={40} className="mx-auto text-success mb-4" />
                      <p className="text-lg font-semibold text-foreground">PDF Ready for Download</p>
                      <p className="text-sm text-foreground-muted mt-1.5 mb-6">This report is stored in the encrypted storage node.</p>
                      <a 
                        href={previewUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 shadow-sm"
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
    </div>
  );
}
