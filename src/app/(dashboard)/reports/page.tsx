'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, FileText, Search, Filter, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch('/api/reports');
        if (res.ok) {
          const data = await res.json();
          setReports(data);
        }
      } catch (err) {
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
      case 'approved':
      case 'sent':
        return { bg: '#F0FAF4', text: '#1A7A3A', dot: '#1A7A3A' };
      case 'generating':
        return { bg: '#F2F2F2', text: '#666666', dot: '#999999' };
      case 'error':
        return { bg: '#FFF4F4', text: '#8B1A2A', dot: '#8B1A2A' };
      default: // draft
        return { bg: '#F8F8F8', text: '#333333', dot: '#CCCCCC' };
    }
  };

  const filtered = reports.filter(r => 
    r.clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.month.includes(search)
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      {/* Search & Actions Area */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Reports</h2>
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
              className="h-11 pl-11 pr-4 rounded-xl bg-white border border-slate-200 text-sm font-medium outline-none transition-all focus:border-indigo-500 focus:shadow-sm w-full placeholder:text-slate-400"
            />
          </div>
          <button
            className="h-11 w-11 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Filter size={18} />
          </button>
          <Link
            href="/clients"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
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
          <div className="rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center p-12 text-center shadow-sm">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 text-slate-400 border border-slate-100">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No records found</h3>
            <p className="text-[15px] font-medium text-slate-500 max-w-sm">
              Your intelligence archive is currently empty. Reports appear here once generated from a client node.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(report => {
              const statusColors = getStatusColor(report.status);
              const clientName = report.clients?.name || 'Unknown Node';
              
              return (
                <Link 
                  key={report.id} 
                  href={`/reports/${report.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-lg font-bold text-slate-600 transition-all group-hover:bg-indigo-50 group-hover:text-indigo-600">
                      {clientName.charAt(0).toUpperCase()}
                    </div>
                    <div 
                      className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
                      style={{ 
                        background: statusColors.bg.replace('#', 'rgba(0,0,0,0)').replace('F0FAF4', '#ECFDF5').replace('F2F2F2', '#F8FAFC').replace('FFF4F4', '#FFF1F2').replace('F8F8F8', '#F8FAFC'), 
                        color: statusColors.text,
                        borderColor: 'currentColor',
                        opacity: 0.8
                      }}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${report.status === 'generating' ? 'animate-pulse' : ''}`} style={{ background: 'currentColor' }} />
                      {report.status}
                    </div>
                  </div>

                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{report.month}</p>
                      <h3 className="text-xl font-bold tracking-tight text-slate-900 truncate mb-6 group-hover:text-indigo-600 transition-colors">
                        {clientName}
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Timestamp</span>
                          <span className="text-[12px] font-bold text-slate-600">{new Date(report.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Classification</span>
                           <span className="text-[12px] font-bold text-slate-600">Standard Analysis</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4 opacity-0 transition-all duration-300 group-hover:opacity-100">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600">Enter Editor</span>
                      <ArrowRight size={14} className="text-indigo-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
