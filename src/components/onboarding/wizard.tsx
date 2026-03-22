'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Step = 'agency' | 'client' | 'ga4';

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('agency');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [agencyName, setAgencyName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientWebsite, setClientWebsite] = useState('');
  const [ga4PropertyId, setGa4PropertyId] = useState('');

  const handleAgencyNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName.trim()) {
      setError('Agency name is required');
      return;
    }

    setError('');
    // TODO: Call API to save agency name
    setStep('client');
  };

  const handleClientNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientWebsite.trim()) {
      setError('Client name and website are required');
      return;
    }

    setError('');
    // TODO: Call API to save client
    setStep('ga4');
  };

  const handleGA4Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ga4PropertyId.trim()) {
      setError('GA4 property ID is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: Call API to save GA4 connection and complete onboarding
      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  const handleBack = () => {
    if (step === 'agency') {
      router.push('/login');
    } else if (step === 'client') {
      setStep('agency');
    } else {
      setStep('client');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Progress Indicator */}
      <div className="flex gap-2">
        {(['agency', 'client', 'ga4'] as const).map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              s === step
                ? 'bg-slate-900 dark:bg-white'
                : ['agency', 'client', 'ga4'].indexOf(s) < ['agency', 'client', 'ga4'].indexOf(step)
                  ? 'bg-slate-400 dark:bg-slate-600'
                  : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Agency Name */}
      {step === 'agency' && (
        <form onSubmit={handleAgencyNext} className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Your Agency Name</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Give your agency an identity. You can change this anytime.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="agency-name" className="block text-sm font-medium text-slate-900 dark:text-slate-50">
              Agency Name
            </label>
            <Input
              id="agency-name"
              type="text"
              placeholder="Acme Digital Agency"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className="w-full"
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" type="button" onClick={handleSkip}>
              Skip
            </Button>
            <Button type="submit" className="flex-1">
              Next
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: Add Client */}
      {step === 'client' && (
        <form onSubmit={handleClientNext} className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add Your First Client</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Create a client to track analytics for. You can add more clients later.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="client-name" className="block text-sm font-medium text-slate-900 dark:text-slate-50">
              Client Name
            </label>
            <Input
              id="client-name"
              type="text"
              placeholder="Acme Corporation"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="client-website" className="block text-sm font-medium text-slate-900 dark:text-slate-50">
              Website URL
            </label>
            <Input
              id="client-website"
              type="url"
              placeholder="https://acme.com"
              value={clientWebsite}
              onChange={(e) => setClientWebsite(e.target.value)}
              className="w-full"
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" type="button" onClick={handleBack}>
              Back
            </Button>
            <Button type="submit" className="flex-1">
              Next
            </Button>
          </div>
        </form>
      )}

      {/* Step 3: GA4 Connection */}
      {step === 'ga4' && (
        <form onSubmit={handleGA4Submit} className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Connect Google Analytics</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Enter your Google Analytics 4 property ID to start tracking data.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="ga4-id" className="block text-sm font-medium text-slate-900 dark:text-slate-50">
              GA4 Property ID
            </label>
            <Input
              id="ga4-id"
              type="text"
              placeholder="123456789"
              value={ga4PropertyId}
              onChange={(e) => setGa4PropertyId(e.target.value)}
              className="w-full"
              required
            />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Find this in Google Analytics: Admin → Property Settings → Property ID
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" type="button" onClick={handleBack} disabled={loading}>
              Back
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Completing setup...' : 'Complete Setup'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
