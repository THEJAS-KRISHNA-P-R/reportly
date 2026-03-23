'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Building2, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
          setClients(data);
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
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.contact_email?.toLowerCase().includes(search.toLowerCase())
  );

  const atLimit = clientsUsed >= clientsLimit;

  if (loading) {
    return <div className="p-8 text-sm" style={{ color: '#666666' }}>Loading clients...</div>;
  }

  return (
    <div className="flex flex-col gap-10 px-4 md:px-8 py-6 max-w-[1600px] mx-auto w-full">
      {/* Search & Actions Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Portfolio Management</h2>
          <p className="text-[14px] font-medium text-slate-500">Coordinate and synchronize data intelligence for your client base.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group min-w-[280px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by client name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 pl-11 pr-4 rounded-xl bg-white border border-slate-200 text-sm font-medium outline-none transition-all focus:border-indigo-500 focus:shadow-sm w-full placeholder:text-slate-400"
            />
          </div>
          {atLimit && planId !== 'agency' ? (
            <Link
              href="/billing"
              className="h-11 px-6 rounded-xl text-[13px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-2 transition-all hover:bg-indigo-100 active:scale-[0.98]"
            >
              Scale Plan <ArrowRight size={14} />
            </Link>
          ) : (
            <Link
              href="/clients/new"
              className="h-11 px-6 rounded-xl flex items-center gap-2 text-[13px] font-bold bg-slate-900 text-white transition-all hover:bg-slate-800 active:scale-[0.98] shadow-sm"
            >
              <Plus size={16} /> Register Client
            </Link>
          )}
        </div>
      </div>

      {/* Usage Infrastructure Card */}
      {planId !== 'agency' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-8 flex flex-col md:flex-row items-center justify-between gap-8 transition-all overflow-hidden relative shadow-sm">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
              <div className={`w-2 h-2 rounded-full ${atLimit ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Infrastructure Capacity</p>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              {clientsUsed} of {clientsLimit} Active Nodes
            </h3>
            <p className="text-[14px] font-medium text-slate-500 max-w-sm mt-1">
              {atLimit 
                ? 'Standard allocation complete. Expand infrastructure for additional synchronization.' 
                : 'Agency operating at optimal capacity. Synchronizing active portfolio data.'}
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
            <div className="w-full md:w-72 h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${atLimit ? 'bg-amber-500' : 'bg-indigo-600'}`} 
                style={{ width: `${Math.min(100, (clientsUsed / clientsLimit) * 100)}%` }} 
              />
            </div>
            {atLimit && (
              <Link href="/billing" className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                Upgrade for more storage units →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Database Grid */}
      {clients.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center p-20 text-center shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 text-slate-400 border border-slate-100">
            <Building2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No data nodes initialized</h3>
          <p className="text-[15px] font-medium text-slate-500 max-w-sm mb-8">
            Deploy your first client node to begin synchronizing intelligence and generating performance reports.
          </p>
          <Button asChild className="h-11 px-8 rounded-xl font-bold bg-slate-900 text-white">
            <Link href="/clients/new">
              <Plus size={16} className="mr-2" /> Deploy Node
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
                className="group relative bg-white rounded-2xl p-8 border border-slate-200 transition-all hover:border-indigo-200 hover:shadow-md shadow-sm"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg font-bold text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div 
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all ${
                      connected ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-600 animate-pulse' : 'bg-slate-300'}`} />
                    {connected ? 'Synched' : 'Idle'}
                  </div>
                </div>

                <div className="flex flex-col">
                  <h3 className="text-lg font-bold tracking-tight text-slate-900 truncate mb-1">
                    {client.name}
                  </h3>
                  <p className="text-[13px] font-medium text-slate-500 truncate">
                    {client.contact_email || 'System Default Email'}
                  </p>
                  
                  <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-indigo-600 transition-colors">Client Intelligence</span>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  );
}
