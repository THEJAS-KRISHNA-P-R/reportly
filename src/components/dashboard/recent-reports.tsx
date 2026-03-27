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
    draft: 'bg-surface-300 text-foreground-muted border border-border',
    pending_review: 'bg-warning/10 text-warning border border-warning/25',
    approved: 'bg-success/10 text-success border border-success/25',
    sent: 'bg-info/10 text-info border border-info/25',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    pending_review: 'Reviewing',
    approved: 'Approved',
    sent: 'Sent',
  };

  if (loading) {
    return (
      <Card className="glass-card overflow-hidden">
        <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48 mt-1.5" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-5 border-b border-border last:border-0">
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
    <Card className="bg-white border border-border shadow-sm overflow-hidden rounded-xl">
      <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between space-y-0 border-b border-border">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold tracking-tight text-foreground">Recent Activity</CardTitle>
          <CardDescription className="text-xs text-foreground-muted">Track report progression across your portfolio.</CardDescription>
        </div>
        <Button variant="ghost" asChild className="font-medium text-[10px] uppercase tracking-wider text-foreground-muted hover:text-foreground h-8 px-2 transition-colors">
          <Link href="/reports">View Archive</Link>
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {reports.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-foreground-muted text-sm italic">No recent activity found.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {reports.slice(0, 5).map((report, idx) => {
              const statusKey = typeof report.status === 'string' ? report.status : 'draft';
              const badgeClass = statusClasses[statusKey] ?? 'bg-surface-200 text-foreground-muted border-border';
              const badgeLabel = statusLabels[statusKey] ?? 'Unknown';
              const clientName = report.client_name || 'Unknown';

              return (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className={cn(
                  "flex items-center justify-between p-4 px-6 transition-all group hover:bg-surface-100/50",
                  idx !== reports.length - 1 && "border-b border-border"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-200 text-sm font-medium text-foreground-muted border border-border group-hover:bg-foreground group-hover:text-background group-hover:border-foreground transition-colors shadow-sm">
                    {clientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <h4 className="text-sm font-semibold text-foreground group-hover:text-foreground transition-colors">{report.client_name}</h4>
                    <div className="flex items-center gap-2 mt-0.5 overflow-hidden">
                      <span className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider flex-shrink-0">{report.period}</span>
                      <span className="w-1 h-3 border-l border-border flex-shrink-0" />
                      <span className="text-[10px] font-medium text-foreground-subtle uppercase tracking-wider truncate transition-colors">Digital Delivery</span>
                    </div>
                  </div>
                </div>

                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-wider border transition-all",
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
