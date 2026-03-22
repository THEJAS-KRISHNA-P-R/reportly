'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

function NewReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('client');
  
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<any>(null);
  
  // Default to current month minus 1 (reporting usually happens for the previous full month)
  const defaultDate = new Date();
  defaultDate.setMonth(defaultDate.getMonth() - 1);
  const [month, setMonth] = useState(defaultDate.toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    if (!clientId) {
      router.push('/clients');
      return;
    }

    async function fetchClient() {
      const res = await fetch(`/api/clients/${clientId}`);
      if (res.ok) {
        setClient(await res.json());
      } else {
        toast.error('Client not found');
        router.push('/clients');
      }
    }
    fetchClient();
  }, [clientId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;

    setLoading(true);
    try {
      // Calculate start and end of the selected month
      const [year, m] = month.split('-').map(Number);
      const periodStart = new Date(year, m - 1, 1);
      const periodEnd = new Date(year, m, 0, 23, 59, 59);

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          periodStart,
          periodEnd
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Report generation started');
        router.push(`/reports/${data.reportId}`);
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to start report generation');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!client) {
    return <div className="p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Link 
        href={`/clients/${clientId}`}
        className="text-sm font-medium flex items-center gap-2 mb-6 hover:underline"
        style={{ color: '#666666' }}
      >
        <ArrowLeft size={16} /> Back to {client.name}
      </Link>

      <div className="bg-white border rounded-2xl p-8 shadow-sm" style={{ borderColor: '#E5E5E5' }}>
        <h1 className="text-2xl font-bold mb-2">Generate New Report</h1>
        <p className="text-sm text-gray-500 mb-8">
          Pick a reporting period for <strong>{client.name}</strong>. Reportly will fetch GA4 data and generate an AI-driven narrative.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Month</label>
            <input 
              type="month"
              required
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full h-11 px-4 border rounded-xl outline-none focus:border-black transition-colors"
              style={{ borderColor: '#E5E5E5' }}
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-8">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-blue-500" /> What happens next?
            </h3>
            <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
              <li>Data is fetched directly from Google Analytics 4.</li>
              <li>Metrics are validated for accuracy and completeness.</li>
              <li>Claude Haiku generates a professional performance narrative.</li>
              <li>A draft report is created for your review and edits.</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-black text-white font-medium rounded-xl flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Generate Report'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function NewReportPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <NewReportForm />
    </Suspense>
  );
}
