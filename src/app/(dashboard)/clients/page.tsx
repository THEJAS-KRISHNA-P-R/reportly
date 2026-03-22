'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Building2, Search, ArrowRight } from 'lucide-react';

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
    <div className="flex flex-col gap-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight" style={{ color: '#000000' }}>Clients</h2>
          <p className="text-sm mt-1" style={{ color: '#666666' }}>
            Manage your agency&apos;s clients and data connections.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#999999' }} />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 pr-4 rounded-lg border text-sm outline-none transition-colors focus:border-black"
              style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}
            />
          </div>
          {atLimit && planId !== 'agency' ? (
            <Link
              href="/billing"
              className="h-10 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-opacity hover:opacity-85"
              style={{ background: '#8B1A2A', color: '#FFFFFF' }}
            >
              Upgrade Plan <ArrowRight size={16} />
            </Link>
          ) : (
            <Link
              href="/clients/new"
              className="h-10 px-4 rounded-lg flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-85"
              style={{ background: '#000000', color: '#FFFFFF' }}
            >
              <Plus size={16} /> Add Client
            </Link>
          )}
        </div>
      </div>

      {/* Limit Banner */}
      {planId !== 'agency' && (
        <div 
          className="rounded-xl p-4 flex items-center justify-between border"
          style={{ 
            background: atLimit ? '#FFF4F4' : '#F8F8F8', 
            borderColor: atLimit ? 'rgba(139,26,42,0.2)' : '#E5E5E5' 
          }}
        >
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold" style={{ color: atLimit ? '#8B1A2A' : '#000000' }}>
              Client Capacity: {clientsUsed} of {clientsLimit}
            </p>
            <p className="text-xs" style={{ color: atLimit ? '#8B1A2A' : '#666666', opacity: atLimit ? 0.8 : 1 }}>
              {atLimit ? 'You have reached your client limit. Upgrade to add more.' : 'You can add more clients by upgrading your plan.'}
            </p>
          </div>
          <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: atLimit ? 'rgba(139,26,42,0.1)' : '#E5E5E5' }}>
            <div 
              className="h-full rounded-full transition-all duration-500" 
              style={{ 
                width: `${Math.min(100, (clientsUsed / clientsLimit) * 100)}%`,
                background: atLimit ? '#8B1A2A' : '#000000'
              }} 
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {clients.length === 0 ? (
        <div 
          className="rounded-2xl border border-dashed flex flex-col items-center justify-center p-12 text-center"
          style={{ borderColor: '#CCCCCC', background: '#FAFAFA' }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: '#F2F2F2' }}>
            <Building2 size={24} style={{ color: '#000000' }} />
          </div>
          <h3 className="text-lg font-semibold tracking-tight mb-2" style={{ color: '#000000' }}>No clients yet</h3>
          <p className="text-sm max-w-sm mb-6" style={{ color: '#666666' }}>
            Add your first client to connect their Google Analytics data and start generating reports.
          </p>
          {!atLimit ? (
            <Link
              href="/clients/new"
              className="h-10 px-4 rounded-lg flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-85"
              style={{ background: '#000000', color: '#FFFFFF' }}
            >
              <Plus size={16} /> Add Client
            </Link>
          ) : (
            <Link
              href="/billing"
              className="h-10 px-4 rounded-lg flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-85"
              style={{ background: '#000000', color: '#FFFFFF' }}
            >
              Upgrade Plan to Add Clients
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(client => {
            const connected = !!client.api_connections?.find((conn: any) => conn.status === 'connected');
            
            return (
              <Link 
                key={client.id} 
                href={`/clients/${client.id}`}
                className="group rounded-2xl p-6 border transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: '#F2F2F2', color: '#000000' }}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div 
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ 
                      background: connected ? '#F0FAF4' : '#F2F2F2',
                      color: connected ? '#1A7A3A' : '#666666'
                    }}
                  >
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ background: connected ? '#1A7A3A' : '#999999' }} 
                    />
                    {connected ? 'GA4 Connected' : 'Setup Required'}
                  </div>
                </div>
                <h3 className="font-semibold text-lg tracking-tight truncate" style={{ color: '#000000' }}>
                  {client.name}
                </h3>
                <p className="text-sm truncate mt-1" style={{ color: '#666666' }}>
                  {client.contact_email || 'No contact email'}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  );
}
