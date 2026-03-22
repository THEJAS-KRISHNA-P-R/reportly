'use client';

import { useState, useEffect } from 'react';
import { User, Activity, Shield, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [agency, setAgency] = useState<any>(null);

  useEffect(() => {
    async function fetchAgency() {
      try {
        const res = await fetch('/api/agencies/me');
        if (res.ok) setAgency(await res.json());
      } catch (err) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    fetchAgency();
  }, []);

  if (loading) return <div className="p-8 text-sm text-gray-500">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#000000' }}>Account Settings</h1>
        <p className="text-sm mt-1" style={{ color: '#666666' }}>
          Manage your agency profile, users, and security preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Nav list */}
        <div className="md:col-span-1 border-r pr-6 space-y-1" style={{ borderColor: '#E5E5E5' }}>
          <button className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-black flex items-center gap-2">
            <User size={16} /> Profile
          </button>
          <button className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-600 flex items-center gap-2">
            <Shield size={16} /> Security
          </button>
          <button className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-600 flex items-center gap-2">
            <Key size={16} /> API Keys
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-3 space-y-8">
          
          <div className="rounded-xl border p-6" style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}>
            <h3 className="font-semibold mb-6" style={{ color: '#000000' }}>Agency Profile</h3>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Agency Name</label>
                <input 
                  type="text" 
                  className="w-full h-10 px-3 border rounded-md text-sm border-gray-200"
                  defaultValue={agency?.name || ''} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Workspace ID</label>
                <input 
                  type="text" 
                  readOnly 
                  className="w-full h-10 px-3 border rounded-md text-sm bg-gray-50 border-gray-200 text-gray-500"
                  defaultValue={agency?.id || ''} 
                />
              </div>
              <button className="h-10 px-6 rounded-lg bg-black text-white text-sm font-medium transition-opacity hover:opacity-85 mt-2">
                Save Changes
              </button>
            </div>
          </div>

          <div className="rounded-xl border p-6" style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}>
            <h3 className="font-semibold mb-6 flex items-center gap-2 text-red-600">Danger Zone</h3>
            <p className="text-sm text-gray-600 mb-4">Permanently delete your agency and all associated clients, reports, and data. This action cannot be undone.</p>
            <button className="h-10 px-6 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-sm font-medium transition-colors">
              Delete Agency
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
