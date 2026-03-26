'use client';

import { useState, useEffect } from 'react';
import { StatsCards, DashboardStats } from '@/components/dashboard/stats-cards';
import { RecentReports } from '@/components/dashboard/recent-reports';
import { ClientsList } from '@/components/clients/clients-list';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';

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
    <div className="flex flex-col gap-8 px-4 py-6 max-w-[1400px] mx-auto w-full animate-fade-in">
      <header className="flex flex-col gap-1.5 px-1">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Review your insights
        </h2>
        <p className="text-sm font-medium text-foreground-muted max-w-2xl leading-relaxed">
          Welcome back. There are <span className="text-foreground font-semibold underline decoration-accent/30 underline-offset-4">{stats?.pending_reviews || 0} reports</span> awaiting your final validation and delivery today.
        </p>
      </header>

      {/* Quick Stats Grid */}
      <StatsCards stats={stats} loading={loading} />

      {/* Primary Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Recent Reports Area */}
        <div className="lg:col-span-2">
          <RecentReports reports={recentReports} loading={loading} />
        </div>

        {/* Global Action Node */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl bg-zinc-900/60 p-6 shadow-sm text-primary-foreground relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-105 transition-transform duration-500">
              <FileText size={120} strokeWidth={1} />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-semibold tracking-tight">Rapid Actions</h3>
              <p className="text-xs font-medium text-primary-foreground/70 mt-1 mb-5">Workflow shortcuts for agency owners.</p>
              <div className="space-y-2">
                <Button asChild variant="outline" className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 border-transparent font-semibold shadow-sm">
                  <a href="/clients/new">Register New Client</a>
                </Button>
                <Button asChild variant="outline" className="w-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/15 border-primary-foreground/10 font-semibold transition-all">
                  <a href="/reports">Generate New Report</a>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="p-5 rounded-xl bg-zinc-900/40 border border-white/5 shadow-sm hidden lg:block">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Optimization Tip</h4>
            </div>
            <p className="text-sm font-medium leading-relaxed text-foreground-muted">
              Reports with <span className="font-semibold text-foreground">AI Narrative Insights</span> correlate with 40% higher client retention. Review insights before deployment.
            </p>
          </div>
        </div>
      </div>

      {/* Client Portfolio Summary */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Active Portfolio</h2>
          <Button asChild variant="ghost" className="font-semibold text-xs uppercase tracking-widest text-foreground-muted hover:text-foreground pr-1">
            <a href="/clients">Manage All Clients</a>
          </Button>
        </div>
        <ClientsList clients={topClients} loading={loading} />
      </div>
    </div>
  );
}
