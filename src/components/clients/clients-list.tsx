'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Client {
  id: string;
  name: string;
  website?: string;
  reports_count: number;
  last_report_date?: string;
}

interface ClientsListProps {
  clients?: Client[];
  loading?: boolean;
}

export function ClientsList({ clients = [], loading = false }: ClientsListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <Card className="p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No clients yet</h3>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Create your first client to start generating reports.
        </p>
        <Button asChild className="mt-6">
          <Link href="/clients/new">Create Client</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {clients.map((client) => (
          <Link
            key={client.id}
            href={`/clients/${client.id}`}
            className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
          >
            <div className="flex-1">
              <h3 className="font-medium text-slate-900 dark:text-white">{client.name}</h3>
              {client.website && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{client.website}</p>
              )}
            </div>

            <div className="ml-4 text-right">
              <p className="font-semibold text-slate-900 dark:text-white">{client.reports_count}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">reports</p>
            </div>

            {client.last_report_date && (
              <div className="ml-4 text-right">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {new Date(client.last_report_date).toLocaleDateString()}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">last report</p>
              </div>
            )}
          </Link>
        ))}
      </div>
    </Card>
  );
}
