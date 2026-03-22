'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ClientPageProps {
  params: {
    id: string;
  };
}

export default function ClientPage({ params }: ClientPageProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('Acme Inc.');
  const [website, setWebsite] = useState('https://acme.com');
  const [ga4Id, setGa4Id] = useState('123456789');

  // TODO: Fetch client details from API using params.id

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Call API to update client
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    setSaving(true);
    try {
      // TODO: Call API to delete client
      router.push('/clients');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{name}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Client management and settings</p>
        </div>

        {!editing && (
          <Button variant="outline" onClick={() => setEditing(true)}>
            Edit Details
          </Button>
        )}
      </div>

      {/* Details Card */}
      <Card className="p-6">
        <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">Client Information</h2>

        {editing ? (
          <form className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-900 dark:text-slate-50">
                Name
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="website" className="block text-sm font-medium text-slate-900 dark:text-slate-50">
                Website
              </label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="ga4" className="block text-sm font-medium text-slate-900 dark:text-slate-50">
                GA4 Property ID
              </label>
              <Input
                id="ga4"
                type="text"
                value={ga4Id}
                onChange={(e) => setGa4Id(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-slate-600 dark:text-slate-400">Name</dt>
              <dd className="mt-1 text-slate-900 dark:text-white">{name}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-slate-600 dark:text-slate-400">Website</dt>
              <dd className="mt-1 text-slate-900 dark:text-white">{website}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-slate-600 dark:text-slate-400">GA4 Property ID</dt>
              <dd className="mt-1 text-slate-900 dark:text-white">{ga4Id}</dd>
            </div>
          </dl>
        )}
      </Card>

      {/* Reports for this client */}
      <Card>
        <div className="border-b border-slate-200 p-6 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Reports</h2>
        </div>

        <div className="p-6 text-center">
          <p className="text-slate-600 dark:text-slate-400">No reports generated yet</p>
          <Button asChild className="mt-4">
            <a href="/reports">Generate Report</a>
          </Button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-900/10">
        <h3 className="mb-4 text-lg font-semibold text-red-900 dark:text-red-200">Danger Zone</h3>
        <p className="mb-4 text-sm text-red-800 dark:text-red-300">
          This action cannot be undone. All associated reports will be archived.
        </p>
        <Button variant="destructive" onClick={handleDelete} disabled={saving}>
          {saving ? 'Deleting...' : 'Delete Client'}
        </Button>
      </Card>

      {/* Back Button */}
      <Button variant="outline" onClick={() => router.back()}>
        Back to Clients
      </Button>
    </div>
  );
}
