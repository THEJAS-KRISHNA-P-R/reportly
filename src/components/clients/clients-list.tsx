'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, FileText } from 'lucide-react';

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
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-3xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.02)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="p-16 text-center bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
          <Users size={32} />
        </div>
        <div>
          <h3 className="text-2xl font-black tracking-tighter text-black">No clients yet</h3>
          <p className="mt-2 text-sm font-medium opacity-40 max-w-[280px]">
            Create your first client to start generating automated reports.
          </p>
        </div>
        <Button asChild className="rounded-xl font-black text-xs uppercase tracking-widest px-8 shadow-lg shadow-black/10">
          <Link href="/clients/new">Create Client</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {clients.map((client) => (
        <Link
          key={client.id}
          href={`/clients/${client.id}`}
          className="flex items-center justify-between p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
        >
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-[15px] font-bold tracking-tight text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{client.name}</h3>
            {client.website && (
              <p className="mt-0.5 text-[12px] font-medium text-slate-400 truncate tracking-wide">{client.website}</p>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[16px] font-bold tracking-tight text-slate-900 leading-none">{client.reports_count}</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Reports</p>
            </div>

            {client.last_report_date && (
              <div className="text-right hidden md:block pl-6 border-l border-slate-100">
                <p className="text-[14px] font-bold text-slate-900 leading-none">
                  {new Date(client.last_report_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1 text-nowrap">Last Active</p>
              </div>
            )}
            
            <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all border border-slate-100 group-hover:border-indigo-600">
              <span className="text-xs font-bold font-mono">→</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
