'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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
    <div className="max-w-2xl mx-auto py-8 flex flex-col gap-6">
      <Link 
        href="/clients" 
        className="text-sm font-medium flex items-center gap-2 hover:underline transition-opacity"
        style={{ color: '#666666' }}
      >
        <ArrowLeft size={16} /> Back to clients
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#000000' }}>Add new client</h1>
        <p className="text-sm mt-1" style={{ color: '#666666' }}>
          Enter their details below to create a dedicated workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6 rounded-2xl border" style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}>
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium" style={{ color: '#000000' }}>
            Client Name *
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-3 rounded-md border text-sm outline-none transition-colors focus:border-black"
            style={{ borderColor: '#E5E5E5' }}
            placeholder="Acme Corp"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contactEmail" className="text-sm font-medium" style={{ color: '#000000' }}>
            Point of Contact Email
          </label>
          <input
            id="contactEmail"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full h-10 px-3 rounded-md border text-sm outline-none transition-colors focus:border-black"
            style={{ borderColor: '#E5E5E5' }}
            placeholder="john@acme.com"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reportEmails" className="text-sm font-medium" style={{ color: '#000000' }}>
            Report Recipients (comma separated)
          </label>
          <textarea
            id="reportEmails"
            value={reportEmails}
            onChange={(e) => setReportEmails(e.target.value)}
            className="w-full px-3 py-2 rounded-md border text-sm outline-none transition-colors focus:border-black min-h-[80px]"
            style={{ borderColor: '#E5E5E5' }}
            placeholder="ceo@acme.com, marketing@acme.com"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="timezone" className="text-sm font-medium" style={{ color: '#000000' }}>
            Timezone
          </label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full h-10 px-3 rounded-md border text-sm outline-none transition-colors focus:border-black appearance-none bg-white font-sans"
            style={{ borderColor: '#E5E5E5' }}
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
          </select>
        </div>

        {error && (
          <div className="p-3 rounded-md text-sm font-medium" style={{ background: '#FFF4F4', color: '#8B1A2A', border: '1px solid rgba(139,26,42,0.2)' }}>
            {error}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t" style={{ borderColor: '#F2F2F2' }}>
          {atLimit ? (
             <Link
               href="/billing"
               className="h-10 px-6 rounded-lg text-sm font-medium flex items-center justify-center transition-opacity hover:opacity-85"
               style={{ background: '#8B1A2A', color: '#FFFFFF' }}
             >
               Upgrade Plan to Add Clients
             </Link>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-6 rounded-lg text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{ background: '#000000', color: '#FFFFFF' }}
            >
              {loading ? 'Creating...' : 'Create Client'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
