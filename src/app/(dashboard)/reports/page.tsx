'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, FileText, Search, Eye, Download, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Search & Actions Area */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Intelligence Archive</h2>
          <p className="text-sm text-slate-500">Historical performance records and delivery status.</p>
        </div>
        
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-80 sm:flex-none">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Filter by client or period"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 pl-11 pr-4 rounded-xl bg-white border border-slate-200 text-sm font-semibold outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 w-full placeholder:text-slate-400"
            />
          </div>
          <Link
            href="/clients"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition-all hover:bg-slate-800 shadow-md shadow-slate-200"
          >
            <Plus size={16} /> Generate Report
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-8">
        {loading ? (
          <div className="p-20 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
             <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400 animate-pulse">Synchronizing Intelligence...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center p-20 text-center shadow-sm">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 text-slate-300 border border-slate-100">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No records localized</h3>
            <p className="text-[14px] font-medium text-slate-500 max-w-sm mx-auto">
              Your intelligence archive is empty. Reports appear once generated from client nodes.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(report => {
              const clientName = report.clients?.name || 'Unknown Node';
              
              return (
                <div 
                  key={report.id} 
                  className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5"
                >
                  <Link 
                    href={`/reports/${report.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="mb-6 flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-lg font-bold text-slate-600 transition-all group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-200">
                        {clientName.charAt(0).toUpperCase()}
                      </div>
                      <Badge variant={getStatusVariant(report.status)} className="capitalize">
                        {report.status}
                      </Badge>
                    </div>

                    <div className="space-y-1 mb-6">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{report.month}</p>
                      <h3 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {clientName}
                      </h3>
                    </div>
                  </Link>
                  
                  <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-slate-50">
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         if (report.pdf_url) {
                           setPreviewUrl(report.pdf_url);
                         } else {
                           toast.info('PDF is being generated...');
                         }
                       }}
                       className="flex items-center justify-center gap-2 h-10 rounded-xl bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 text-[12px] font-bold transition-all"
                     >
                       <Eye size={14} /> Preview
                     </button>
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         handleExport(report);
                       }}
                       className="flex items-center justify-center gap-2 h-10 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 text-[12px] font-bold transition-all"
                     >
                       <Download size={14} /> Export
                     </button>
                  </div>

                </div>
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
                 <button 
                   onClick={() => setPreviewUrl(null)}
                   className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
                 >
                   <X size={20} />
                 </button>
              </div>
              <div className="flex-1 bg-slate-100">
                {previewUrl.startsWith('http') ? (
                  <iframe src={previewUrl} className="w-full h-full border-none" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-20 text-center">
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
    </div>
  );
}
