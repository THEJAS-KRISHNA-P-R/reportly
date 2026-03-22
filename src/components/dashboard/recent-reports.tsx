'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface Report {
  id: string;
  client_name: string;
  period: string;
  status: 'draft' | 'pending_review' | 'approved' | 'sent';
  created_at: string;
}

interface RecentReportsProps {
  reports?: Report[];
  loading?: boolean;
}

const statusColors = {
  draft: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  pending_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
};

const statusLabels = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  sent: 'Sent',
};

export function RecentReports({ reports = [], loading = false }: RecentReportsProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Reports</h3>
          <Button variant="outline" asChild>
            <Link href="/reports">View All</Link>
          </Button>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-slate-600 dark:text-slate-400">No reports yet</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {reports.slice(0, 5).map((report) => (
            <Link
              key={report.id}
              href={`/reports/${report.id}`}
              className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
            >
              <div className="flex-1">
                <h4 className="font-medium text-slate-900 dark:text-white">{report.client_name}</h4>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{report.period}</p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  statusColors[report.status]
                }`}
              >
                {statusLabels[report.status]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
