'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Client {
  id: string;
  name: string;
}

interface ReportGeneratorProps {
  clients?: Client[];
  onGenerate?: (clientId: string, startDate: string, endDate: string) => Promise<void>;
}

export function ReportGenerator({ clients = [], onGenerate }: ReportGeneratorProps) {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate default dates (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const defaultStartDate = thirtyDaysAgo.toISOString().split('T')[0];
  const defaultEndDate = today.toISOString().split('T')[0];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedClient) {
      setError('Please select a client');
      return;
    }

    if (!startDate || !endDate) {
      setError('Please select date range');
      return;
    }

    setLoading(true);
    try {
      if (onGenerate) {
        await onGenerate(selectedClient, startDate, endDate);
      }
      // Reset form
      setSelectedClient('');
      setStartDate('');
      setEndDate('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate report';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!clients || clients.length === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className="font-semibold text-slate-900 dark:text-white">No clients available</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Create a client first to generate reports.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Generate Report</h2>
      <form onSubmit={handleGenerate} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="client" className="block text-sm font-medium text-slate-900 dark:text-slate-50">
            Select Client
          </label>
          <select
            id="client"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            disabled={loading}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            required
          >
            <option value="">Choose a client...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="start-date" className="block text-sm font-medium text-slate-900 dark:text-slate-50">
              Start Date
            </label>
            <Input
              id="start-date"
              type="date"
              value={startDate || defaultStartDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="end-date" className="block text-sm font-medium text-slate-900 dark:text-slate-50">
              End Date
            </label>
            <Input
              id="end-date"
              type="date"
              value={endDate || defaultEndDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Generating...' : 'Generate Report'}
        </Button>
      </form>
    </Card>
  );
}
