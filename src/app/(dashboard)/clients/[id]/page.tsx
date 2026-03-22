'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings, Activity, FileText, Blocks, Trash2, ExternalLink, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function fetchClient() {
      try {
        const res = await fetch(`/api/clients/${resolvedParams.id}`);
        if (res.ok) {
          const data = await res.json();
          setClient(data);
        } else {
          router.push('/clients');
        }
      } catch (err) {
        toast.error('Failed to load client');
      } finally {
        setLoading(false);
      }
    }
    fetchClient();
  }, [resolvedParams.id, router]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this client? This cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/clients/${resolvedParams.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Client deleted');
        router.push('/clients');
      } else {
        toast.error('Failed to delete client');
      }
    } catch (err) {
      toast.error('Error deleting client');
    }
  };

  const handleConnectGA4 = () => {
    window.location.href = `/api/oauth/ga4?clientId=${resolvedParams.id}`;
  };

  const tabs = [
    { id: 'overview', icon: Activity, label: 'Overview' },
    { id: 'reports', icon: FileText, label: 'Reports' },
    { id: 'integrations', icon: Blocks, label: 'Integrations' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  if (loading) {
    return <div className="p-8 text-sm" style={{ color: '#666666' }}>Loading client details...</div>;
  }

  if (!client) return null;

  const ga4Conn = client.api_connections?.find((c: any) => c.platform === 'ga4');
  const isGa4Connected = ga4Conn?.status === 'connected';

  return (
    <div className="flex flex-col gap-6 py-8">
      {/* Header */}
      <div>
        <Link 
          href="/clients" 
          className="text-sm font-medium flex items-center gap-2 mb-4 hover:underline transition-opacity"
          style={{ color: '#666666' }}
        >
          <ArrowLeft size={16} /> Back to clients
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white" 
              style={{ background: '#000000' }}
            >
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#000000' }}>
                {client.name}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: '#666666' }}>
                {client.contact_email || 'No contact email'}
              </p>
            </div>
          </div>
          <button
            className="h-10 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-opacity hover:opacity-85"
            style={{ background: '#000000', color: '#FFFFFF' }}
            onClick={() => router.push(`/reports/new?client=${client.id}`)}
          >
            Create Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b flex gap-6 overflow-x-auto" style={{ borderColor: '#E5E5E5' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
              style={{
                color: isActive ? '#000000' : '#666666',
                borderBottomColor: isActive ? '#000000' : 'transparent',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="py-4">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2 rounded-2xl border p-6" style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}>
              <h3 className="font-semibold mb-4" style={{ color: '#000000' }}>Recent Activity</h3>
              <div className="flex flex-col items-center justify-center h-48 text-center" style={{ color: '#666666' }}>
                <Activity size={24} className="mb-2 opacity-50" />
                <p className="text-sm">
                  {isGa4Connected ? 'Connection active. Fetching recent data...' : 'Connect integrations to view activity'}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border p-6" style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}>
              <h3 className="font-semibold mb-4" style={{ color: '#000000' }}>Details</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p style={{ color: '#666666' }}>Added</p>
                  <p className="font-medium" style={{ color: '#000000' }}>{new Date(client.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p style={{ color: '#666666' }}>Timezone</p>
                  <p className="font-medium" style={{ color: '#000000' }}>{client.timezone || 'Asia/Kolkata'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}>
             {client.reports && client.reports.length > 0 ? (
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                   <thead className="border-b" style={{ borderColor: '#F2F2F2', background: '#FAFAFA' }}>
                     <tr>
                       <th className="px-6 py-3 font-medium">Month</th>
                       <th className="px-6 py-3 font-medium">Status</th>
                       <th className="px-6 py-3 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y" style={{ borderColor: '#F2F2F2' }}>
                     {client.reports.map((report: any) => (
                       <tr key={report.id} className="hover:bg-gray-50">
                         <td className="px-6 py-4">{report.month}</td>
                         <td className="px-6 py-4 capitalize">{report.status}</td>
                         <td className="px-6 py-4 text-right">
                           <Link 
                             href={`/reports/${report.id}`}
                             className="text-black font-medium hover:underline"
                           >
                             View Editor
                           </Link>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             ) : (
               <div className="p-12 flex flex-col items-center justify-center text-center bg-gray-50">
                 <FileText size={32} className="mb-4" style={{ color: '#999999' }} />
                 <h3 className="text-lg font-semibold tracking-tight mb-2" style={{ color: '#000000' }}>No reports yet</h3>
                 <p className="text-sm max-w-sm mb-6" style={{ color: '#666666' }}>
                   Create your first performance report for this client to share insights and analytics.
                 </p>
                 <button 
                   onClick={() => router.push(`/reports/new?client=${client.id}`)}
                   className="h-10 px-4 rounded-lg bg-black text-white text-sm font-medium hover:opacity-85"
                 >
                   Generate First Report
                 </button>
               </div>
             )}
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border p-6" style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 border">
                  <span className="font-bold text-xs" style={{ color: '#000000' }}>GA4</span>
                </div>
                <span 
                  className="px-2.5 py-1 rounded-full text-xs font-medium" 
                  style={{ 
                    background: isGa4Connected ? '#F0FAF4' : '#F2F2F2', 
                    color: isGa4Connected ? '#1A7A3A' : '#666666' 
                  }}
                >
                  {isGa4Connected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <h3 className="font-semibold" style={{ color: '#000000' }}>Google Analytics 4</h3>
              <p className="text-sm mt-1 mb-6" style={{ color: '#666666' }}>
                Import website traffic, conversions, and user behavior data.
              </p>
              <button 
                onClick={handleConnectGA4}
                className="w-full h-9 rounded-md border text-sm font-medium transition-colors hover:bg-gray-50" 
                style={{ borderColor: '#E5E5E5', color: '#000000' }}
              >
                {isGa4Connected ? 'Reconnect GA4' : 'Connect GA4'}
              </button>
              {isGa4Connected && (
                <p className="text-[10px] mt-2 text-center" style={{ color: '#999999' }}>
                   Property: {ga4Conn.account_id || 'Pending Discovery'}
                </p>
              )}
              {isGa4Connected && (
                <button 
                  onClick={async () => {
                    const tid = toast.loading('Syncing with GA4...');
                    try {
                      const res = await fetch(`/api/clients/${resolvedParams.id}/analytics/refresh`, { method: 'POST' });
                      if (res.ok) {
                        toast.success('Analytics synced successfully', { id: tid });
                        router.refresh();
                      } else {
                        toast.error('Sync failed', { id: tid });
                      }
                    } catch (err) {
                      toast.error('Network error', { id: tid });
                    }
                  }}
                  className="w-full h-9 mt-2 rounded-md border text-xs font-medium transition-colors hover:bg-gray-50 flex items-center justify-center gap-2"
                  style={{ borderColor: '#E5E5E5', color: '#666666' }}
                >
                  <RotateCcw size={12} /> Sync Analytics
                </button>
              )}
            </div>
            
            <div className="rounded-2xl border p-6" style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 border">
                  <span className="font-bold text-xs" style={{ color: '#000000' }}>Ads</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: '#F2F2F2', color: '#666666' }}>
                  Not Connected
                </span>
              </div>
              <h3 className="font-semibold" style={{ color: '#000000' }}>Google Ads</h3>
              <p className="text-sm mt-1 mb-6" style={{ color: '#666666' }}>
                Import ad spend, clicks, impressions, and conversions.
              </p>
              <button className="w-full h-9 rounded-md border text-sm font-medium transition-colors hover:bg-gray-50" style={{ borderColor: '#E5E5E5', color: '#000000' }}>
                Connect Ads
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-xl">
            <div className="rounded-2xl border p-6 mb-6" style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}>
              <h3 className="font-semibold mb-4" style={{ color: '#000000' }}>Danger Zone</h3>
              <p className="text-sm mb-4" style={{ color: '#666666' }}>
                Deleting this client will permanently remove all their reports, analytics settings, and data connections.
              </p>
              <button 
                onClick={handleDelete}
                className="h-10 px-4 rounded-lg flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-85"
                style={{ background: '#FFF4F4', color: '#8B1A2A', border: '1px solid rgba(139,26,42,0.2)' }}
              >
                <Trash2 size={16} /> Delete Client
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
