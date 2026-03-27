'use client';

import { useState, useEffect } from 'react';
import { StatsCards, DashboardStats } from '@/components/dashboard/stats-cards';
import { RecentReports } from '@/components/dashboard/recent-reports';
import { ClientsList } from '@/components/clients/clients-list';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';
import { Scaffold } from '@/components/layout/Scaffold';

type Envelope<T> =
  | T
  | {
      ok: boolean;
      data?: T;
      error?: { code?: string; message?: string };
    };

function unwrapData<T>(payload: Envelope<T>, fallback: T): T {
  if (payload && typeof payload === 'object' && 'ok' in (payload as Record<string, unknown>)) {
    const envelope = payload as { ok: boolean; data?: T };
    return envelope.ok ? (envelope.data ?? fallback) : fallback;
  }
  return (payload as T) ?? fallback;
}

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
        let reports: any[] = [];
        const agencyRes = await fetch('/api/agencies/me');
        if (agencyRes.ok) {
          const agencyData = await agencyRes.json();
          
          // 2. Fetch Reports for additional status counts
          const reportsRes = await fetch('/api/reports');
          const reportsPayload = reportsRes.ok ? await reportsRes.json() : { ok: false, data: { reports: [] } };
          const reportsEnvelope = unwrapData<{ reports: any[]; pagination?: any }>(reportsPayload, { reports: [] });
          reports = reportsEnvelope.reports || [];

          setRecentReports(reports.slice(0, 5).map((r: any) => ({
             id: r.id,
             client_name: r.clients?.name || 'Unknown',
             period: r.month,
             status: r.status,
             created_at: r.created_at
          })));

          // Calculate counts from reports
          const sentThisMonth = reports.filter((r: any) => r.status === 'sent').length;
          const pendingReview = reports.filter((r: any) => r.status === 'ready' || r.status === 'draft').length;

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
          const clientsPayload = await clientsRes.json();
          const clientsData = unwrapData<any[]>(clientsPayload, []);
          setTopClients(clientsData.slice(0, 5).map((c: any) => {
            const clientReports = reports.filter((r: any) => r.client_id === c.id || r.clients?.id === c.id);
            // sort reports to find newest
            const sortedReports = [...clientReports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            return {
              id: c.id,
              name: c.name,
              reports_count: clientReports.length,
              last_report_date: sortedReports.length > 0 ? sortedReports[0].created_at : undefined
            };
          }));
        }
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <Scaffold
      title="Overview"
      description={`Welcome back. You have ${stats?.pending_reviews || 0} reports awaiting review today.`}
    >
      <div className="space-y-8">
        {/* Quick Stats Grid */}
        <StatsCards stats={stats} loading={loading} />

        {/* Primary Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          {/* Recent Reports Area */}
          <div className="lg:col-span-2">
            <RecentReports reports={recentReports} loading={loading} />
          </div>

          {/* Actions & Insights */}
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-border rounded-xl p-6 relative overflow-hidden group shadow-sm transition-all hover:border-foreground-subtle">
              <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-all duration-700 text-foreground">
                <FileText size={100} strokeWidth={1.5} />
              </div>
              <div className="relative z-10">
                <h3 className="text-base font-semibold tracking-tight text-foreground">Quick Actions</h3>
                <p className="text-sm text-foreground-muted mt-1 mb-6 leading-relaxed">Standardized shortcuts for agency management.</p>
                <div className="space-y-2">
                  <Button asChild variant="primary" className="w-full h-9 font-medium shadow-sm transition-transform active:scale-[0.98]">
                    <a href="/clients/new">Register Client</a>
                  </Button>
                  <Button variant="outline" asChild className="w-full h-9 font-medium border-border hover:bg-surface-200 transition-all active:scale-[0.98]">
                    <a href="/reports">Generate Report</a>
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="bg-surface-200/50 p-5 hidden lg:block rounded-xl border border-border">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <h4 className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Optimization Tip</h4>
              </div>
              <p className="text-sm leading-relaxed text-foreground-muted">
                Reports with <span className="font-medium text-foreground">AI Narrative Insights</span> correlate with <span className="text-foreground font-medium">40% higher</span> client retention.
              </p>
            </div>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Active Portfolio</h2>
            <Button asChild variant="ghost" className="font-medium text-xs text-foreground-muted hover:text-foreground h-8 px-2 transition-colors">
              <a href="/clients">Manage All</a>
            </Button>
          </div>
          <ClientsList clients={topClients} loading={loading} />
        </div>
      </div>
    </Scaffold>
  );
}
