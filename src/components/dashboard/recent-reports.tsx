'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export interface Report {
  id: string;
  client_name: string;
  period: string;
  status?: 'draft' | 'pending_review' | 'approved' | 'sent' | string;
  created_at: string;
}

interface RecentReportsProps {
  reports?: Report[];
  loading?: boolean;
}

const statusClasses: Record<string, string> = {
  draft: 'bg-slate-50 text-slate-500 border-slate-200',
  pending_review: 'bg-amber-50 text-amber-700 border-amber-100',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  sent: 'bg-indigo-50 text-indigo-700 border-indigo-100',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Reviewing',
  approved: 'Approved',
  sent: 'Sent',
};

export function RecentReports({ reports = [], loading = false }: RecentReportsProps) {
  if (loading) {
    return (
      <div className="p-10 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-gray-50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-8 pb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-slate-900">Recent Activity</h3>
          <p className="text-[13px] font-medium text-slate-400 mt-0.5">Track report progression across your portfolio</p>
        </div>
        <Button variant="ghost" asChild className="font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg pr-1">
          <Link href="/reports">View Archive</Link>
        </Button>
      </div>

      {reports.length === 0 ? (
        <div className="p-10 text-center border-t border-slate-50">
          <p className="text-slate-400 text-sm font-medium">No recent report activity detected.</p>
        </div>
      ) : (
        <div className="px-5 pb-5">
          <div className="flex flex-col">
            {reports.slice(0, 5).map((report, idx) => {
              const statusKey = typeof report.status === 'string' ? report.status : 'draft';
              const badgeClass = statusClasses[statusKey] ?? 'bg-slate-50 text-slate-500 border-slate-200';
              const badgeLabel = statusLabels[statusKey] ?? 'Unknown';

              return (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className={`flex items-center justify-between p-4 rounded-xl transition-all group hover:bg-slate-50 ${idx !== reports.length - 1 ? 'border-b border-slate-50 hover:border-transparent' : ''}`}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="text-[14px] font-bold text-slate-900 truncate">{report.client_name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{report.period}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Report Payload</span>
                  </div>
                </div>

                <span
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider border ${badgeClass}`}
                >
                  {badgeLabel}
                </span>
              </Link>
            );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
