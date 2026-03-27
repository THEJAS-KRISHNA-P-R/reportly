'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronDown, Plus, Filter, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Scaffold } from '@/components/layout/Scaffold';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Client {
  id: string;
  name: string;
  last_activity?: string;
}

export default function OverviewPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      try {
        setLoading(true);
        const res = await fetch('/api/clients');
        if (res.ok) {
          const data = await res.json();
          // Unwrap if needed (using the same logic as previous dashboard)
          const clientsList = data.ok ? (data.data || []) : (data || []);
          setClients(clientsList.map((c: any) => ({
            id: c.id,
            name: c.name,
            last_activity: c.updated_at || c.created_at
          })));
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  const filteredClients = clients
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === 'asc') return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });

  return (
    <Scaffold
      title="Clients"
      description="Manage and access your clients across the workspace"
    >
      <div className="flex flex-col space-y-6">
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle h-4 w-4" />
            <Input 
              placeholder="Search for a client..." 
              className="pl-9 h-9 bg-surface-100 border-border focus:ring-1 focus:ring-primary rounded-md text-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 gap-2 border-border text-foreground-muted hover:text-foreground hover:bg-surface-200"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Sort: {sortOrder === 'asc' ? 'Name A-Z' : 'Name Z-A'}</span>
            </Button>
            <Button 
              size="sm" 
              className="h-9 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              asChild
            >
              <Link href="/clients/new">
                <Plus className="h-4 w-4" />
                <span className="text-xs font-semibold">New Client</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Client Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-surface-200 animate-pulse border border-border" />
            ))}
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Link 
                key={client.id} 
                href={`/client/${client.id}`}
                className="group block"
              >
                <div className="bg-surface-100 border border-border rounded-xl p-6 h-full transition-all duration-200 hover:border-foreground-subtle hover:bg-surface-200 shadow-sm group-hover:shadow-md relative overflow-hidden">
                  <div className="flex flex-col justify-between h-full relative z-10">
                    <div>
                      <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors">
                        {client.name}
                      </h3>
                      <p className="text-xs text-foreground-muted mt-1 font-medium bg-surface-300 w-fit px-2 py-0.5 rounded uppercase tracking-wider">
                        Active
                      </p>
                    </div>
                    <div className="mt-8 pt-4 border-t border-border/50 flex items-center justify-between">
                      <div className="text-[11px] text-foreground-subtle">
                        <span className="font-medium mr-1 uppercase opacity-60">Last Activity:</span>
                        {client.last_activity ? new Date(client.last_activity).toLocaleDateString() : 'Never'}
                      </div>
                      <div className="w-6 h-6 rounded-lg bg-surface-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronDown className="-rotate-90 w-3.5 h-3.5 text-foreground-muted" />
                      </div>
                    </div>
                  </div>
                  {/* Subtle accent line */}
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-surface-200/50 rounded-2xl border border-dashed border-border">
            <p className="text-sm text-foreground-muted font-medium">No clients found matching your search.</p>
            <Button variant="link" onClick={() => setSearchQuery('')} className="mt-2 text-primary h-auto p-0 text-sm font-semibold">
              Clear search
            </Button>
          </div>
        )}
      </div>
    </Scaffold>
  );
}
