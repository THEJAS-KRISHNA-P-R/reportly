'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export function ClientForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [ga4PropertyId, setGa4PropertyId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Client name is required');
      return;
    }

    setLoading(true);
    try {
      // TODO: Call API to create client
      // const response = await fetch('/api/clients', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name, website, ga4_property_id: ga4PropertyId }),
      // });
      // if (!response.ok) throw new Error('Failed to create client');
      // await response.json();

      router.push('/clients');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create client';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-slate-900 dark:text-slate-50">
            Client Name
          </label>
          <Input
            id="name"
            type="text"
            placeholder="e.g., Acme Inc."
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="website" className="block text-sm font-medium text-slate-900 dark:text-slate-50">
            Website (Optional)
          </label>
          <Input
            id="website"
            type="url"
            placeholder="https://example.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="ga4" className="block text-sm font-medium text-slate-900 dark:text-slate-50">
            GA4 Property ID (Optional)
          </label>
          <Input
            id="ga4"
            type="text"
            placeholder="123456789"
            value={ga4PropertyId}
            onChange={(e) => setGa4PropertyId(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-slate-600 dark:text-slate-400">
            You can add this later if you don't have it right now
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Client'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/clients')}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
