'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, X } from 'lucide-react';
import { toast } from 'sonner';

export default function NewClientPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [reportEmails, setReportEmails] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [atLimit, setAtLimit] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function checkLimits() {
      try {
        const res = await fetch('/api/agencies/me');
        if (res.ok) {
          const me = await res.json();
          const used = me.clients_count || 0;
          const plan = me.agency_billing?.plan_id || 'free';
          const limit = plan === 'free' ? 1 : plan === 'pro' ? 5 : 9999;
          
          if (used >= limit) {
            setAtLimit(true);
            setError('Client limit reached. Please upgrade your plan.');
          }
        }
      } catch (err) {
        console.error('Limit check failed');
      } finally {
        setInitializing(false);
      }
    }
    checkLimits();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contact_email: contactEmail,
          report_emails: reportEmails.split(',').map(e => e.trim()).filter(Boolean),
          timezone,
          schedule_day: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create client');
      }

      router.push(`/clients/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return <div className="p-8 text-sm" style={{ color: '#666666' }}>Verifying account status...</div>;
  }

  return (
    <div className="flex flex-col gap-8 px-4 md:px-8 py-6 max-w-3xl mx-auto w-full">
      <div className="flex flex-col gap-6">
        <Link 
          href="/clients" 
          className="text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={3} /> Back to clients
        </Link>
  
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add new client</h1>
          <p className="text-[14px] font-medium text-slate-500">
            Provision a new dedicated workspace node for your client.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8 p-8 rounded-3xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md">
        <div className="space-y-2">
          <label htmlFor="name" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Client Name *
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-slate-200 text-[15px] font-medium transition-all focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none"
            placeholder="e.g. Acme Research Labs"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label htmlFor="contactEmail" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Point of Contact Email
            </label>
            <input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 text-[15px] font-medium transition-all focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none"
              placeholder="john@acme.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="timezone" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Operational Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 text-[15px] font-medium transition-all focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none appearance-none bg-white cursor-pointer"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="reportEmails" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Automated Report Recipients
          </label>
          <p className="text-[12px] text-slate-400 mb-2">Comma separated list of emails for automated delivery.</p>
          <textarea
            id="reportEmails"
            value={reportEmails}
            onChange={(e) => setReportEmails(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[15px] font-medium transition-all focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none min-h-[100px] resize-none"
            placeholder="strategy@acme.com, marketing@acme.com"
          />
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[13px] font-bold flex items-center gap-2">
            <X size={14} /> {error}
          </div>
        )}

        <div className="flex justify-end pt-6 border-t border-slate-100">
          {atLimit ? (
             <Link
               href="/billing"
               className="h-12 px-8 rounded-xl bg-rose-600 text-white text-[13px] font-bold uppercase tracking-widest transition-all hover:bg-rose-700 active:scale-[0.98] shadow-lg shadow-rose-200 flex items-center"
             >
               Upgrade Scope to Add Clients
             </Link>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="h-12 px-8 rounded-xl bg-slate-900 text-white text-[13px] font-bold uppercase tracking-widest transition-all hover:bg-slate-800 active:scale-[0.98] shadow-lg shadow-slate-200 disabled:opacity-50"
            >
              {loading ? 'Provisioning...' : 'Provision Client'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
