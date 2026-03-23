'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Settings, Activity, FileText, Blocks, Trash2, 
  ExternalLink, RotateCcw, ChevronRight, Mail, Calendar, MapPin, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [properties, setProperties] = useState<any[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

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
      }
    } catch (err) {
      toast.error('Error deleting client');
    }
  };

  const handleConnectGA4 = () => {
    window.location.href = `/api/oauth/ga4?clientId=${resolvedParams.id}`;
  };

  const handleDiscoverProperties = async () => {
    setIsDiscovering(true);
    const tid = toast.loading('Discovering GA4 Properties...');
    try {
      const res = await fetch(`/api/clients/${resolvedParams.id}/analytics/properties`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
        setIsSelecting(true);
        toast.success(`Found ${data.properties?.length || 0} properties`, { id: tid });
      }
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleSelectProperty = async (propertyId: string) => {
    const tid = toast.loading('Updating connection...');
    try {
      const res = await fetch(`/api/clients/${resolvedParams.id}/analytics/connection`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });
      if (res.ok) {
        toast.success('Property updated', { id: tid });
        setIsSelecting(false);
        const cRes = await fetch(`/api/clients/${resolvedParams.id}`);
        if (cRes.ok) setClient(await cRes.json());
      }
    } finally {
      toast.dismiss(tid);
    }
  };

  const tabs = [
    { id: 'overview', icon: Activity, label: 'Overview' },
    { id: 'reports', icon: FileText, label: 'Reports' },
    { id: 'integrations', icon: Blocks, label: 'Integrations' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  if (loading) return <div className="flex items-center justify-center min-h-screen font-black text-gray-200 uppercase tracking-widest animate-pulse">Loading Client...</div>;
  if (!client) return null;

  const ga4Conn = client.api_connections?.find((c: any) => c.platform === 'ga4');
  const isGa4Connected = ga4Conn?.status === 'connected';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as any } }
  };

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="w-full max-w-[1400px] mx-auto px-[clamp(1rem,5vw,3rem)] py-8 md:py-12"
    >
      {/* ── HEADER ────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="mb-12">
        <Link 
          href="/clients" 
          className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-600 transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Return to CRM Portfolio
        </Link>
        
        <div className="bg-white rounded-2xl p-8 md:p-10 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl md:text-3xl font-bold shadow-md">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 leading-none mb-3">{client.name}</h1>
              <div className="flex flex-wrap items-center gap-5 text-[13px] font-medium text-slate-500">
                <span className="flex items-center gap-2"><Mail size={14} className="text-slate-300" /> {client.contact_email || 'No Email Record'}</span>
                <span className="flex items-center gap-2"><MapPin size={14} className="text-slate-300" /> {client.timezone || 'UTC+0:00'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/reports/new?client=${client.id}`)}
              className="px-8 h-12 rounded-xl bg-slate-900 text-white text-[13px] font-bold uppercase tracking-wider shadow-sm hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              Prepare Analysis
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── TABS ──────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex gap-1 md:gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-6 py-3 rounded-xl text-[13px] font-bold uppercase tracking-wider transition-all ${
                isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                <tab.icon size={16} /> {tab.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white shadow-sm rounded-xl border border-slate-200" 
                />
              )}
            </button>
          );
        })}
      </motion.div>

      {/* ── CONTENT ───────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="min-h-[400px]"
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-12 min-h-[350px] flex flex-col justify-center items-center text-center group shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 border border-indigo-100 flex items-center justify-center mb-6">
                  <Activity size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Operational performance</h3>
                <p className="text-[15px] font-medium text-slate-500 max-w-sm">
                  {isGa4Connected ? 'Connection established. Analytical insights will populate as system nodes synchronize.' : 'Link GA4 integration to synchronize real-time performance indicators.'}
                </p>
              </div>
              
              <div className="bg-white rounded-2xl border border-slate-200 p-10 space-y-10 shadow-sm">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Metadata Registry</h3>
                <div className="space-y-8">
                  <div>
                    <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400 mb-2">Registration Cycle</p>
                    <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                       <Calendar size={18} className="text-slate-300" />
                       {new Date(client.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400 mb-2">Engagement Status</p>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 italic">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       <span className="text-[11px] font-bold uppercase tracking-widest">Active Partner</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               {client.reports && client.reports.length > 0 ? (
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="bg-slate-50 border-b border-slate-100">
                         <th className="px-10 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400">Reporting Period</th>
                         <th className="px-10 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                         <th className="px-10 py-5 text-right text-[11px] font-bold uppercase tracking-widest text-slate-400">Archive Link</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                       {client.reports.map((report: any) => (
                         <tr key={report.id} className="group hover:bg-slate-50/50 transition-colors">
                           <td className="px-10 py-6 text-[15px] font-bold text-slate-900">{report.month} Analysis</td>
                           <td className="px-10 py-6">
                             <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                               report.status === 'sent' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                             }`}>
                               {report.status}
                             </div>
                           </td>
                           <td className="px-10 py-6 text-right">
                             <Link 
                               href={`/reports/${report.id}`}
                               className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors"
                             >
                               Modify <ChevronRight size={14} />
                             </Link>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               ) : (
                 <div className="p-20 flex flex-col items-center justify-center text-center">
                   <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 text-slate-400">
                     <FileText size={32} />
                   </div>
                   <h3 className="text-lg font-bold text-slate-900 mb-2">No active reports</h3>
                   <p className="text-[15px] font-medium text-slate-500 max-w-sm mb-10">Historical records for this property will appear here once generated.</p>
                   <button 
                     onClick={() => router.push(`/reports/new?client=${client.id}`)}
                     className="px-10 h-12 rounded-xl bg-slate-900 text-white text-[13px] font-bold uppercase tracking-wider shadow-sm hover:bg-slate-800 transition-all"
                   >
                     Initialize First Run
                   </button>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col h-full shadow-sm">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 font-bold text-sm text-slate-600">GA4</div>
                  <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                    isGa4Connected ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}>
                    {isGa4Connected ? 'Active' : 'Unlinked'}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Google Analytics 4</h3>
                <p className="text-[14px] font-medium text-slate-500 mb-10 flex-1">Marketing intelligence, conversion flow, and traffic analysis.</p>
                
                <div className="space-y-4">
                  <button 
                    onClick={handleConnectGA4}
                    className="w-full h-11 rounded-lg border border-slate-200 bg-white text-[12px] font-bold uppercase tracking-wider text-slate-600 transition-all hover:bg-slate-50 shadow-sm"
                  >
                    {isGa4Connected ? 'Refresh Connection' : 'Link External Account'}
                  </button>

                  {isGa4Connected && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                       <div className="flex justify-between items-center px-1">
                          <span className="text-[11px] font-bold uppercase text-slate-400">Stream Node</span>
                          {!isSelecting && (
                            <button onClick={handleDiscoverProperties} className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest hover:underline">Swap</button>
                          )}
                       </div>
                       
                       {!isSelecting ? (
                         <div className="px-3 py-2.5 rounded-lg bg-white border border-slate-200">
                           <p className="text-[12px] font-bold text-slate-900 truncate flex items-center gap-2">
                             <Activity size={14} className="text-emerald-500" />
                             {ga4Conn.account_id ? ga4Conn.account_id.split('/').pop() : 'Default Feed'}
                           </p>
                         </div>
                       ) : (
                         <div className="space-y-3">
                            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                              {properties.map(p => (
                                <button
                                  key={p.name}
                                  onClick={() => handleSelectProperty(p.name)}
                                  className={`w-full text-left px-4 py-3 rounded-lg text-[12px] font-bold transition-all border ${
                                    ga4Conn.account_id === p.name 
                                      ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                                      : 'bg-white text-slate-600 hover:border-slate-300 border-slate-200 shadow-sm'
                                  }`}
                                >
                                  {p.displayName}
                                </button>
                              ))}
                            </div>
                            <button onClick={() => setIsSelecting(false)} className="w-full text-[11px] font-bold uppercase text-slate-400 hover:text-slate-600 py-1">Cancel Selection</button>
                         </div>
                       )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* ADS Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col h-full opacity-60 grayscale shadow-sm cursor-not-allowed">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 font-bold text-sm text-slate-400">ADS</div>
                  <div className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-50 text-slate-400 border border-slate-200">Pending</div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Google Ads</h3>
                <p className="text-[14px] font-medium text-slate-500 mb-10 flex-1">Acquisition benchmarks, ROI analysis, and paid performance.</p>
                <button disabled className="w-full h-11 rounded-lg bg-slate-100 text-[12px] font-bold uppercase text-slate-400">Coming Soon</button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl">
              <div className="bg-white rounded-2xl border border-rose-100 p-10 shadow-sm">
                <h3 className="text-xl font-bold text-rose-600 mb-4 italic">Security & Termination</h3>
                <p className="text-[15px] font-medium text-slate-500 mb-10">
                  De-provisioning this property project is a permanent operation. All unique data benchmarks, performance snapshots, and tactical narratives will be purged from the registry.
                </p>
                <button 
                  onClick={handleDelete}
                  className="px-8 h-12 rounded-xl bg-rose-50 text-rose-600 text-[13px] font-bold uppercase tracking-wider border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                >
                  Terminate Property Relationship
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
