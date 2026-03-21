import { Button }     from '@/components/ui/button';
import { Badge }      from '@/components/ui/badge';
import { Card }       from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Users, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Replace the empty array with real data fetching once repos are wired up
const clients: Array<{ id: string; name: string; connected: boolean }> = [];

export default async function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-[-0.01em]">Clients</h1>
          <p className="text-[14px] text-[var(--text-muted)] mt-0.5">
            Manage your agency clients and their GA4 connections.
          </p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button size="default" className="gap-2" id="add-client-btn">
            <Plus size={16} strokeWidth={2} /> Add Client
          </Button>
        </Link>
      </div>

      <Card className="p-0 overflow-hidden border-border bg-surface">
        {clients.length === 0 ? (
          <EmptyState
            icon={<Users size={20} strokeWidth={1.5} />}
            title="Add your first client"
            body="Connect their Google Analytics and Reportly will handle reporting automatically."
            action={{ label: 'Add Client', href: '/dashboard/clients/new' }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-surface)]">
                  {['Client', 'GA4 Status', 'Last Report', 'Next Report', 'Reports', ''].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)] first:pl-6"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr
                    key={client.id}
                    className="border-b border-[var(--border)] hover:bg-[var(--bg-muted)] transition-colors duration-[120ms] ease-[ease]"
                  >
                    <td className="px-4 py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] border border-[var(--accent)]/20 flex items-center justify-center text-[12px] font-semibold text-[var(--accent-dark)]">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[14px] font-medium text-[var(--text-primary)]">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge className={client.connected ? 'bg-green-100 text-green-800 hover:bg-green-100 shadow-none border-transparent' : 'bg-red-100 text-red-800 hover:bg-red-100 shadow-none border-transparent'}>
                        {client.connected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-[13px] text-[var(--text-secondary)]">—</td>
                    <td className="px-4 py-4 text-[13px] text-[var(--text-secondary)]">—</td>
                    <td className="px-4 py-4 text-[13px] text-[var(--text-muted)]">0 reports</td>
                    <td className="px-4 py-4 pr-6 text-right">
                      <Link href={`/dashboard/clients/${client.id}`}>
                        <Button variant="ghost" size="sm" className="gap-2">
                          Manage <ExternalLink size={13} />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
