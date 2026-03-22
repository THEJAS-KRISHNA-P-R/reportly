import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentReports } from '@/components/dashboard/recent-reports';
import { ClientsList } from '@/components/clients/clients-list';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  // TODO: Fetch from API
  const stats = undefined;
  const recentReports: any[] = [];
  const topClients: any[] = [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Welcome back! Here's what's happening with your clients.
        </p>
      </div>

      {/* Quick Stats */}
      <StatsCards stats={stats} loading={false} />

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Reports */}
        <div className="lg:col-span-2">
          <RecentReports reports={recentReports} loading={false} />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900/50">
            <h3 className="font-semibold text-slate-900 dark:text-white">Quick Actions</h3>
            <div className="mt-4 space-y-3">
              <Button asChild className="w-full" variant="primary">
                <a href="/clients/new">Add New Client</a>
              </Button>
              <Button asChild className="w-full" variant="secondary">
                <a href="/reports">Generate Report</a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Clients */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Clients</h2>
          <Button asChild variant="outline">
            <a href="/clients">View All</a>
          </Button>
        </div>
        <ClientsList clients={topClients} loading={false} />
      </div>
    </div>
  );
}
