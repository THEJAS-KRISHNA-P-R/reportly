'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Building2, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageLoader } from '@/components/ui/page-loader';
import { motion } from 'framer-motion';
import { Scaffold } from '@/components/layout/Scaffold';

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
      <div className="flex flex-col flex-1 items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  const actions = (
    <div className="flex items-center gap-3">
      <div className="relative group min-w-[320px] hidden sm:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
        <input
          type="text"
          placeholder="Filter clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-9 pr-4 rounded-md bg-surface-200 border border-transparent text-sm outline-none transition-all focus:border-border focus:bg-white w-full placeholder:text-slate-400 text-slate-900"
        />
      </div>
      {atLimit && planId !== 'agency' ? (
        <Button variant="primary" asChild className="h-9 px-4 font-bold shadow-sm">
          <Link href="/billing">
            Scale Plan <ArrowRight size={14} className="ml-1.5" />
          </Link>
        </Button>
      ) : (
        <Button variant="primary" asChild className="h-9 px-4 font-bold shadow-sm">
          <Link href="/clients/new">
            <Plus size={16} className="mr-1.5" /> Register Client
          </Link>
        </Button>
      )}
    </div>
  );

      return (
    <Scaffold
      title="Clients"
      description="Manage your client portfolio and data connections."
      actions={actions}
    >
      <div className="space-y-6">
        {/* Usage Card */}
        {planId !== 'agency' && (
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-col gap-1.5 text-center md:text-left">
                <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                  <div className={cn("w-1.5 h-1.5 rounded-full shadow-sm", atLimit ? 'bg-danger animate-pulse' : 'bg-foreground')} />
                  <p className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">Plan Status</p>
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  {clientsUsed} of {clientsLimit} Clients
                </h3>
                <p className="text-sm text-foreground-muted max-w-sm">
                  {atLimit 
                    ? 'You have reached your client limit. Upgrade to add more.' 
                    : 'Manage your active clients and their reporting data.'}
                </p>
              </div>
              <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
                <div className="w-full md:w-80 h-1.5 rounded-full bg-surface-200 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (clientsUsed / clientsLimit) * 100)}%` }}
                    className={cn("h-full rounded-full transition-all duration-1000", atLimit ? 'bg-danger' : 'bg-foreground')} 
                  />
                </div>
                {atLimit && (
                  <Link href="/billing" className="text-xs font-medium text-foreground hover:underline transition-all">
                    Upgrade plan →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Clients Grid */}
        {clients.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl h-[400px] flex flex-col items-center justify-center text-center p-8 bg-surface-200/50">
            <div className="w-12 h-12 rounded-lg bg-surface-300 flex items-center justify-center mb-4 text-foreground-subtle border border-border">
              <Building2 size={24} />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No clients found</h3>
            <p className="text-sm text-foreground-muted max-w-sm mb-6">
              Add your first client to start generating reports and tracking performance.
            </p>
            <Button asChild variant="primary" className="h-9 px-6 font-medium shadow-sm">
              <Link href="/clients/new">
                <Plus size={16} className="mr-2" /> Add Client
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(client => {
              const connected = !!client.api_connections?.find((conn: any) => conn.status === 'connected');
              
              return (
                <Link 
                  key={client.id} 
                  href={`/clients/${client.id}`}
                  className="group block h-full"
                >
                  <div className="bg-white border border-border rounded-xl p-6 h-full transition-all hover:border-foreground-subtle hover:shadow-sm flex flex-col">
                    <div className="flex items-start justify-between mb-8">
                      <div className="w-10 h-10 rounded-lg bg-surface-200 border border-border flex items-center justify-center text-base font-medium text-foreground-muted group-hover:bg-foreground group-hover:text-background transition-colors">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div 
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border transition-all",
                          connected ? 'bg-success/5 text-success border-success/20' : 'bg-surface-200 text-foreground-muted border-border'
                        )}
                      >
                        <span className={cn("w-1 h-1 rounded-full", connected ? 'bg-success animate-pulse' : 'bg-foreground-subtle')} />
                        {connected ? 'Active' : 'Idle'}
                      </div>
                    </div>

                    <div className="flex flex-col flex-1">
                      <h3 className="text-base font-semibold tracking-tight text-foreground truncate mb-0.5">
                        {client.name}
                      </h3>
                      <p className="text-sm text-foreground-muted truncate mb-6">
                        {client.contact_email || 'No email provided'}
                      </p>
                      
                      <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle group-hover:text-foreground transition-all">View Details</span>
                        <ArrowRight size={14} className="text-foreground-subtle group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </Scaffold>
  );
}
