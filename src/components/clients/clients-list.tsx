'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

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

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ClientsList({ clients = [], loading = false }: ClientsListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="shadow-sm border-white/5 bg-zinc-900/60">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <div className="flex items-center gap-8">
                <div className="hidden sm:block space-y-1.5">
                  <Skeleton className="h-4 w-8 ml-auto" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <Card className="shadow-sm border-dashed border-2 border-white/5 bg-zinc-900/40">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 border border-white/5">
            <Users size={24} />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">No clients yet</h3>
            <p className="mt-1 text-sm text-foreground-muted max-w-[240px]">
              Create your first client to start generating automated reports.
            </p>
          </div>
          <Button asChild className="rounded-md font-semibold text-xs uppercase tracking-widest px-6 shadow-sm">
            <Link href="/clients/new">Create Client</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {clients.map((client) => (
        <Link
          key={client.id}
          href={`/clients/${client.id}`}
          className="group block"
        >
          <Card className="shadow-sm hover:border-white/20 hover:bg-zinc-900/80 transition-all border-white/5 bg-zinc-900/60">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-6">
                <h3 className="text-[15px] font-bold text-foreground truncate group-hover:text-primary transition-colors">{client.name}</h3>
                {client.website && (
                  <p className="mt-1 text-xs font-medium text-foreground-muted truncate tracking-tight opacity-60">{client.website}</p>
                )}
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold tracking-tight text-foreground leading-none">{client.reports_count}</p>
                  <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest mt-1.5 opacity-60">Reports</p>
                </div>

                {client.last_report_date && (
                  <div className="text-right hidden md:block pl-8 border-l border-white/5">
                    <p className="text-sm font-bold text-foreground leading-none">
                      {new Date(client.last_report_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest mt-1.5 opacity-60 text-nowrap">Last Pulse</p>
                  </div>
                )}
                
                <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:bg-white group-hover:text-black transition-all border border-white/5 group-hover:border-transparent">
                  <ArrowRight size={16} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
