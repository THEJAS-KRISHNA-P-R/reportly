'use client';

import { useState, useEffect } from 'react';
import { StatsCards, DashboardStats } from '@/components/dashboard/stats-cards';
import { RecentReports } from '@/components/dashboard/recent-reports';
import { ClientsList } from '@/components/clients/clients-list';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | undefined>(undefined);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [topClients, setTopClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        // 1. Fetch Agency Stats
        const agencyRes = await fetch('/api/agencies/me');
        if (agencyRes.ok) {
          const agencyData = await agencyRes.json();
          
          // 2. Fetch Reports for additional status counts
          const reportsRes = await fetch('/api/reports');
          const reportsData = reportsRes.ok ? await reportsRes.json() : [];
          setRecentReports(reportsData.slice(0, 5).map((r: any) => ({
             id: r.id,
             client_name: r.clients?.name || 'Unknown',
             period: r.month,
             status: r.status,
             created_at: r.created_at
          })));

          // Calculate counts from reports
          const sentThisMonth = reportsData.filter((r: any) => r.status === 'sent').length;
          const pendingReview = reportsData.filter((r: any) => r.status === 'ready' || r.status === 'draft').length;

          setStats({
            total_clients: agencyData.clients_count || 0,
            reports_generated: agencyData.reports_generated_this_month || 0,
            reports_sent_month: sentThisMonth,
            pending_reviews: pendingReview
          });
        }

        // 3. Fetch Clients
        const clientsRes = await fetch('/api/clients');
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setTopClients(clientsData.slice(0, 5).map((c: any) => ({
            id: c.id,
            name: c.name,
            reports_count: 0, // Placeholder
            last_report_date: undefined
          })));
        }
      } catch (err) {
        console.error('Dashboard Fetch Error:', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Welcome back! Here's what's happening with your clients.
        </p>
      </div>

      {/* Quick Stats */}
      <StatsCards stats={stats} loading={loading} />

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Reports */}
        <div className="lg:col-span-2">
          <RecentReports reports={recentReports} loading={loading} />
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
        <ClientsList clients={topClients} loading={loading} />
      </div>
    </div>
  );
}
