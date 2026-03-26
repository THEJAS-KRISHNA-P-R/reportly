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

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function RecentReports({ reports = [], loading = false }: RecentReportsProps) {
  const statusClasses: Record<string, string> = {
    draft: 'bg-zinc-800 text-zinc-400',
    pending_review: 'bg-amber-500/10 text-amber-500',
    approved: 'bg-green-500/10 text-green-500',
    sent: 'bg-blue-500/10 text-blue-400',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    pending_review: 'Reviewing',
    approved: 'Approved',
    sent: 'Sent',
  };

  if (loading) {
    return (
      <Card className="shadow-sm bg-zinc-900/60 border-white/5 overflow-hidden rounded-xl">
        <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48 mt-1.5" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-5 border-b border-white/5 last:border-0">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm bg-zinc-900/60 border-white/5 overflow-hidden rounded-xl">
      <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-[17px] font-bold tracking-tight text-foreground">Recent Activity</CardTitle>
          <CardDescription className="text-xs font-medium text-foreground-muted opacity-60">Track report progression across your portfolio</CardDescription>
        </div>
        <Button variant="ghost" asChild className="font-bold text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 h-9 px-3 transition-all border border-transparent">
          <Link href="/reports">View Archive</Link>
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {reports.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-foreground-muted text-sm font-medium italic">No recent activity found.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {reports.slice(0, 5).map((report, idx) => {
              const statusKey = typeof report.status === 'string' ? report.status : 'draft';
              const badgeClass = statusClasses[statusKey] ?? 'bg-surface-200 text-foreground-muted';
              const badgeLabel = statusLabels[statusKey] ?? 'Unknown';
              const clientName = report.client_name || 'Unknown';

              return (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className={cn(
                  "flex items-center justify-between p-5 transition-all group hover:bg-white/5",
                  idx !== reports.length - 1 && "border-b border-white/5"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-zinc-400 border border-white/5 group-hover:bg-white group-hover:text-black transition-all">
                    {clientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{report.client_name}</h4>
                    <div className="flex items-center gap-2.5 mt-1.5 overflow-hidden">
                      <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest opacity-60 flex-shrink-0">{report.period}</span>
                        <span className="w-1 h-3 border-l border-white/10 flex-shrink-0" />
                      <span className="text-[10px] font-medium text-foreground-muted uppercase tracking-widest opacity-40 truncate">System Payload Generated</span>
                    </div>
                  </div>
                </div>

                <span
                  className={cn(
                    "rounded-md px-3 py-1 text-[9px] font-bold uppercase tracking-widest transition-all",
                    badgeClass
                  )}
                >
                  {badgeLabel}
                </span>
              </Link>
            );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
