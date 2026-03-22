'use client';

import { ReportGenerator } from '@/components/reports/report-generator';
import { RecentReports } from '@/components/dashboard/recent-reports';

export default function ReportsPage() {
  // TODO: Fetch from API
  const clients: any[] = [];
  const reports: any[] = [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Generate and manage your agency reports
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Report Generator */}
        <div className="lg:col-span-1">
          <ReportGenerator clients={clients} />
        </div>

        {/* Reports List */}
        <div className="lg:col-span-2">
          <RecentReports reports={reports} loading={false} />
        </div>
      </div>
    </div>
  );
}
