'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Building2, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/page-loader';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Usage tracking
  const [clientsUsed, setClientsUsed] = useState(0);
  const [clientsLimit, setClientsLimit] = useState(1);
  const [planId, setPlanId] = useState('free');

  useEffect(() => {
    async function fetchData() {
      try {
        const [clientsRes, meRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/agencies/me')
        ]);
        
        if (clientsRes.ok) {
          const data = await clientsRes.json();
          setClients(data.data || []);
        }
        
        if (meRes.ok) {
          const me = await meRes.json();
          setClientsUsed(me.clients_count || 0);
          const plan = me.agency_billing?.plan_id || 'free';
          setPlanId(plan);
          if (plan === 'free') setClientsLimit(1);
          else if (plan === 'pro') setClientsLimit(5);
          else setClientsLimit(9999);
        }
      } catch {
        setClients([]); // Fallback on error
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = (Array.isArray(clients) ? clients : []).filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.contact_email?.toLowerCase().includes(search.toLowerCase())
  );

  const atLimit = clientsUsed >= clientsLimit;

  if (loading) {
    return (
      <div className="flex flex-col gap-10 px-4 md:px-8 py-6 max-w-[1600px] mx-auto w-full">
        <PageLoader rows={4} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 px-4 md:px-8 py-6 max-w-[1600px] mx-auto w-full">
      {/* Search & Actions Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Portfolio Management</h2>
          <p className="text-[14px] font-medium text-foreground-muted opacity-60">Coordinate and synchronize data intelligence for your client base.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group min-w-[280px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted opacity-60 group-focus-within:text-foreground transition-colors" />
            <input
              type="text"
              placeholder="Search by client name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 pl-11 pr-4 rounded-lg bg-zinc-900/60 border border-white/5 text-sm font-medium outline-none transition-all focus:border-white/20 focus:bg-zinc-900 w-full placeholder:text-zinc-500"
            />
          </div>
          {atLimit && planId !== 'agency' ? (
            <Link
              href="/billing"
              className="h-11 px-6 rounded-lg text-[13px] font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-2 transition-all hover:bg-primary/15 active:scale-[0.98]"
            >
              Scale Plan <ArrowRight size={14} />
            </Link>
          ) : (
            <Link
              href="/clients/new"
              className="h-11 px-6 rounded-lg flex items-center gap-2 text-[13px] font-bold bg-white text-black transition-all hover:bg-white/90 active:scale-[0.98] shadow-sm"
            >
              <Plus size={16} /> Register Client
            </Link>
          )}
        </div>
      </div>

      {/* Usage Infrastructure Card */}
      {planId !== 'agency' && (
        <Card className="border-white/5 bg-zinc-900/60 shadow-sm">
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col gap-1 text-center md:text-left">
              <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                <div className={cn("w-2 h-2 rounded-full", atLimit ? 'bg-error' : 'bg-success')} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted opacity-60">Infrastructure Capacity</p>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                {clientsUsed} of {clientsLimit} Active Nodes
              </h3>
              <p className="text-[14px] font-medium text-foreground-muted max-w-sm mt-1 opacity-80">
                {atLimit 
                  ? 'Standard allocation complete. Expand infrastructure for additional synchronization.' 
                  : 'Agency operating at optimal capacity. Synchronizing active portfolio data.'}
              </p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-4 w-full md:w-auto">
              <div className="w-full md:w-72 h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all duration-1000 ease-out", atLimit ? 'bg-error' : 'bg-primary')} 
                  style={{ width: `${Math.min(100, (clientsUsed / clientsLimit) * 100)}%` }} 
                />
              </div>
              {atLimit && (
                <Link href="/billing" className="text-[12px] font-bold text-primary hover:underline transition-all">
                  Upgrade for more storage units →
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database Grid */}
      {clients.length === 0 ? (
        <Card className="border-white/5 bg-zinc-900/40 shadow-none border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-lg bg-zinc-900 flex items-center justify-center mb-6 text-zinc-500 border border-white/5">
              <Building2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">No data nodes initialized</h3>
            <p className="text-[14px] font-medium text-foreground-muted max-w-sm mb-8 opacity-80">
              Deploy your first client node to begin synchronizing intelligence and generating performance reports.
            </p>
            <Button asChild className="h-11 px-8 rounded-lg font-bold bg-white text-black hover:bg-white/90 shadow-sm transition-all duration-200">
              <Link href="/clients/new">
                <Plus size={16} className="mr-2" /> Deploy Node
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(client => {
            const connected = !!client.api_connections?.find((conn: any) => conn.status === 'connected');
            
            return (
              <Link 
                key={client.id} 
                href={`/clients/${client.id}`}
                className="group relative"
              >
                <Card className="border-white/5 bg-zinc-900/60 shadow-sm rounded-lg p-0 transition-all hover:bg-zinc-800/60 hover:border-white/10 hover:shadow-2xl hover:shadow-white/5 h-full">
                  <CardContent className="p-8 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-8">
                      <div className="w-14 h-14 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-lg font-bold text-zinc-400 group-hover:bg-white group-hover:text-black group-hover:border-white transition-all duration-300">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div 
                        className={cn(
                          "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all",
                          connected ? 'bg-success/10 text-success border-success/20' : 'bg-surface-200 text-foreground-muted opacity-60 border-border'
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", connected ? 'bg-green-400 animate-pulse' : 'bg-zinc-600')} />
                        {connected ? 'Active Sync' : 'Idle'}
                      </div>
                    </div>

                    <div className="flex flex-col flex-1">
                      <h3 className="text-lg font-bold tracking-tight text-foreground truncate mb-1 group-hover:text-primary transition-colors">
                        {client.name}
                      </h3>
                      <p className="text-[13px] font-medium text-foreground-muted truncate opacity-60">
                        {client.contact_email || 'System Default Email'}
                      </p>
                      
                      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 opacity-60 group-hover:text-zinc-200 transition-all">Client Intelligence Node</span>
                        <ArrowRight size={14} className="text-zinc-500 opacity-60 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  );
}
