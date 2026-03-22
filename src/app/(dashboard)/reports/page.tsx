'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, FileText, Search, Filter } from 'lucide-react';
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
    <div className="flex flex-col gap-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight" style={{ color: '#000000' }}>Reports</h2>
          <p className="text-sm mt-1" style={{ color: '#666666' }}>
            View and manage all your generated client reports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#999999' }} />
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 pr-4 rounded-lg border text-sm outline-none transition-colors focus:border-black"
              style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}
            />
          </div>
          <button
            className="h-10 px-3 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors hover:bg-gray-50"
            style={{ borderColor: '#E5E5E5', color: '#000000', background: '#FFFFFF' }}
          >
            <Filter size={16} /> <span className="hidden sm:inline">Filter</span>
          </button>
          <button
            className="h-10 px-4 rounded-lg flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-85"
            style={{ background: '#000000', color: '#FFFFFF' }}
            onClick={() => {
              // Usually would open a dialog to select client and month, keeping it simple
              toast.info('Select a client from the Clients page to create a report.');
            }}
          >
            <Plus size={16} /> New Report
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}>
        {loading ? (
          <div className="p-12 text-center text-sm" style={{ color: '#666666' }}>Loading reports...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center" style={{ background: '#FAFAFA' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: '#F2F2F2' }}>
              <FileText size={24} style={{ color: '#000000' }} />
            </div>
            <h3 className="text-lg font-semibold tracking-tight mb-2" style={{ color: '#000000' }}>No reports found</h3>
            <p className="text-sm max-w-sm mb-6" style={{ color: '#666666' }}>
              You haven&apos;t generated any reports yet. Go to a client&apos;s details page to start.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="border-b" style={{ borderColor: '#F2F2F2', background: '#FAFAFA' }}>
                <tr>
                  <th className="px-6 py-3 font-medium" style={{ color: '#333333' }}>Client</th>
                  <th className="px-6 py-3 font-medium" style={{ color: '#333333' }}>Month</th>
                  <th className="px-6 py-3 font-medium" style={{ color: '#333333' }}>Status</th>
                  <th className="px-6 py-3 font-medium" style={{ color: '#333333' }}>Created</th>
                  <th className="px-6 py-3 text-right font-medium" style={{ color: '#333333' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#F2F2F2' }}>
                {filtered.map(report => {
                  const statusColors = getStatusColor(report.status);
                  const clientName = report.clients?.name || 'Unknown Client';
                  
                  return (
                    <tr key={report.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs" style={{ background: '#F2F2F2', color: '#000000' }}>
                            {clientName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold" style={{ color: '#000000' }}>{clientName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4" style={{ color: '#666666' }}>{report.month}</td>
                      <td className="px-6 py-4">
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ background: statusColors.bg, color: statusColors.text }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColors.dot }} />
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4" style={{ color: '#666666' }}>
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/reports/${report.id}`}
                          className="font-medium hover:underline"
                          style={{ color: '#000000' }}
                        >
                          View Editor
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
