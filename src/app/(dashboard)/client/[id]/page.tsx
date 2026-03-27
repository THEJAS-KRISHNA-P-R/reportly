'use client';

import { useParams } from 'next/navigation';
import { useClientStore } from '@/store/client-store';
import { Scaffold } from '@/components/layout/Scaffold';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentReports } from '@/components/dashboard/recent-reports';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function ClientDashboardPage() {
  const { id } = useParams();
  const { clients, activeClient, setActiveClient } = useClientStore();
  const [loading, setLoading] = useState(true);

  // Sync active client if navigating directly
  useEffect(() => {
    if (id && (!activeClient || activeClient.id !== id)) {
      const client = clients.find(c => c.id === id);
      if (client) {
        setActiveClient(client);
      }
    }
    
    // Simulate loading client data
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [id, clients, activeClient, setActiveClient]);

  if (!activeClient && !loading) {
    return (
      <Scaffold title="Client Not Found" description="The requested client could not be located.">
        <div className="flex items-center justify-center h-64">
          <p className="text-foreground-muted">Please select a valid client from the overview.</p>
        </div>
      </Scaffold>
    );
  }

  return (
    <Scaffold 
      title={`${activeClient?.name || 'Client'} Overview`}
      description={`Viewing metrics and recent activity for ${activeClient?.name}.`}
    >
      <div className="space-y-8">
        {/* Reuse the StatsCards with mock data for now */}
        <StatsCards 
          loading={loading}
          stats={{
            total_clients: 1, // Focus on this client
            reports_generated: 12,
            reports_sent_month: 8,
            pending_reviews: 2
          }}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <RecentReports 
            loading={loading}
            reports={[
              { id: '1', client_name: activeClient?.name || 'Client', period: 'September 2023', status: 'sent', created_at: new Date().toISOString() },
              { id: '2', client_name: activeClient?.name || 'Client', period: 'August 2023', status: 'ready', created_at: new Date(Date.now() - 86400000 * 30).toISOString() },
            ]}
          />
          
          <div className="bg-surface-100 border border-border rounded-xl p-6">
            <h3 className="text-base font-semibold text-foreground mb-4">Client Insights</h3>
            <div className="space-y-4">
              <div className="p-4 bg-surface-200/50 rounded-lg border border-border">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Growth</p>
                <p className="text-sm text-foreground-muted leading-relaxed">
                  This client has seen a <span className="text-foreground font-medium">15% increase</span> in report engagement over the last 90 days.
                </p>
              </div>
              <div className="p-4 bg-surface-200/50 rounded-lg border border-border">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Status</p>
                <p className="text-sm text-foreground-muted leading-relaxed">
                  Plan: <span className="text-foreground font-medium uppercase">{activeClient?.plan || 'Free'}</span>. 
                  Next automated report scheduled for <span className="text-foreground font-medium">Oct 1st</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Scaffold>
  );
}
