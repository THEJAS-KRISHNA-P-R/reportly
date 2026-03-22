'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function SettingsPage() {
  const [agencyName, setAgencyName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // TODO: Call API to update agency settings
      // const response = await fetch('/api/settings/agency', {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ agency_name: agencyName }),
      // });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Manage your agency settings and preferences.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Account Settings */}
        <Card className="p-6">
          <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">Account Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-50">Email</label>
              <Input
                type="email"
                value="user@example.com"
                disabled
                className="mt-2"
              />
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Contact support to change your email
              </p>
            </div>
          </div>
        </Card>

        {/* Agency Settings */}
        <Card className="p-6">
          <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">Agency Details</h3>
          <form onSubmit={handleSaveAgency} className="space-y-4">
            <div>
              <label htmlFor="agency-name" className="block text-sm font-medium text-slate-900 dark:text-slate-50">
                Agency Name
              </label>
              <Input
                id="agency-name"
                type="text"
                placeholder="Your Agency"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="mt-2"
                disabled={saving}
              />
            </div>

            {saved && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-200">
                Settings saved successfully
              </div>
            )}

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-900/10">
          <h3 className="mb-4 text-lg font-semibold text-red-900 dark:text-red-200">Danger Zone</h3>
          <p className="mb-4 text-sm text-red-800 dark:text-red-300">
            Irreversible actions. Proceed with caution.
          </p>
          <Button variant="destructive">Delete Agency</Button>
        </Card>
      </div>
    </div>
  );
}
