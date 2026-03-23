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
        const agencyRes = await fetch('/api/agencies/me');
        if (agencyRes.ok) {
          const agencyData = await agencyRes.json();
          
          // 2. Fetch Reports for additional status counts
          const reportsRes = await fetch('/api/reports');
           const reportsPayload = reportsRes.ok ? await reportsRes.json() : [];
           const reportsData = unwrapData<any[]>(reportsPayload, []);
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
          const clientsPayload = await clientsRes.json();
          const clientsData = unwrapData<any[]>(clientsPayload, []);
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
    <div className="flex flex-col gap-10 px-4 md:px-8 py-6 max-w-[1600px] mx-auto w-full">
      <header className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 animate-fade-in">
          Review your insights
        </h2>
        <p className="text-[15px] font-medium text-slate-500 max-w-2xl leading-relaxed">
          Welcome back. There are <span className="text-slate-900 font-bold underline decoration-indigo-500/30 underline-offset-4">{stats?.pending_reviews || 0} reports</span> awaiting your final validation and delivery today.
        </p>
      </header>

      {/* Quick Stats Grid */}
      <StatsCards stats={stats} loading={loading} />

      {/* Primary Analytics Grid */}
      <div className="grid gap-8 lg:grid-cols-3 items-start">
        {/* Recent Reports Area */}
        <div className="lg:col-span-2">
          <RecentReports reports={recentReports} loading={loading} />
        </div>

        {/* Global Action Node */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl bg-slate-900 p-8 shadow-xl text-white relative overflow-hidden group border border-slate-800">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-105 transition-transform duration-500">
              <FileText size={140} strokeWidth={1} />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold tracking-tight">Rapid Actions</h3>
              <p className="text-[13px] font-medium text-slate-400 mt-1 mb-6">Workflow shortcuts for agency owners.</p>
              <div className="space-y-3">
                <Button asChild className="w-full h-11 bg-white text-slate-900 hover:bg-slate-50 rounded-xl font-bold transition-all shadow-sm active:scale-[0.98]">
                  <a href="/clients/new">Register New Client</a>
                </Button>
                <Button asChild className="w-full h-11 bg-white/5 text-white hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all active:scale-[0.98]">
                  <a href="/reports">Generate New Report</a>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hidden lg:block">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Optimization Tip</h4>
            </div>
            <p className="text-[14px] font-medium leading-relaxed text-slate-600">
              Reports with <span className="font-bold text-slate-900">AI Narrative Insights</span> correlate with 40% higher client retention. Review insights before deployment.
            </p>
          </div>
        </div>
      </div>

      {/* Client Portfolio Summary */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Active Portfolio</h2>
          <Button asChild variant="ghost" className="font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-100/50 rounded-lg pr-1">
            <a href="/clients">Manage All Clients</a>
          </Button>
        </div>
        <ClientsList clients={topClients} loading={loading} />
      </div>
    </div>
  );
}
