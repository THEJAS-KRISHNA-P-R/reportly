import { MetricCard }   from '@/components/ui/MetricCard';
import { Badge }         from '@/components/ui/Badge';
import { Button }        from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState }    from '@/components/ui/EmptyState';
import { FileText, Plus, RefreshCw, Users } from 'lucide-react';

export default async function DashboardPage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[32px] font-semibold text-[var(--text-primary)] tracking-[-0.02em]">
            {greeting} 👋
          </h1>
          <p className="text-[14px] text-[var(--text-muted)] mt-1">
            Here&apos;s what&apos;s happening with your agency today.
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} strokeWidth={2} />} id="generate-report-btn">
          Generate Report
        </Button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Active Clients"      value="—" source="Reportly" />
        <MetricCard label="Reports This Month"  value="—" source="Reportly" />
        <MetricCard label="Pending Approval"    value="—" source="Reportly" confidence="partial" />
        <MetricCard label="Avg Generation Time" value="—" source="Reportly" />
      </div>

      {/* Two column layout */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Recent reports */}
        <Card padding="none">
          <CardHeader className="px-6 pt-5 pb-4 border-b border-[var(--border)]">
            <CardTitle>Recent Reports</CardTitle>
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} id="refresh-reports-btn">
              Refresh
            </Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-surface)]">
                  {['Client', 'Period', 'Status', 'Generated', ''].map(h => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={<FileText size={20} strokeWidth={1.5} />}
                      title="No reports yet"
                      body="Add a client and connect their Google Analytics to generate your first report."
                      action={{ label: 'Add your first client', href: '/dashboard/clients/new' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Data sources */}
        <Card>
          <CardHeader>
            <CardTitle>Data Sources</CardTitle>
          </CardHeader>
          <EmptyState
            icon={<Users size={18} strokeWidth={1.5} />}
            title="No clients yet"
            body="Add clients to see their connection status here."
          />
        </Card>
      </div>
    </div>
  );
}
