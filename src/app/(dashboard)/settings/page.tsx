'use client';

import { useState, useEffect } from 'react';
import { User, Shield, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agency, setAgency] = useState<any>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    async function fetchAgency() {
      try {
        const res = await fetch('/api/agencies/me');
        if (res.ok) {
          const data = await res.json();
          setAgency(data);
          setName(data.name || '');
        }
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    fetchAgency();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Agency name cannot be empty');
    setSaving(true);
    try {
      const res = await fetch('/api/agencies/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });
      if (res.ok) {
        toast.success('Profile updated successfully');
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update profile');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="px-4 md:px-8 py-6">
      <div className="animate-pulse flex flex-col gap-4">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="h-4 w-64 bg-slate-100 rounded-lg" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-10 px-4 md:px-8 py-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account Settings</h1>
        <p className="text-[14px] font-medium text-slate-500">
          Manage your agency configuration, security parameters, and workspace preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Nav list */}
        <div className="md:col-span-1 space-y-1">
          <button className="w-full text-left px-4 py-2.5 rounded-xl text-[14px] font-bold bg-slate-900 text-white flex items-center gap-2 shadow-sm">
            <User size={16} /> Profile
          </button>
          <button className="w-full text-left px-4 py-2.5 rounded-xl text-[14px] font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-2">
            <Shield size={16} /> Security
          </button>
          <button className="w-full text-left px-4 py-2.5 rounded-xl text-[14px] font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-2">
            <Key size={16} /> API Keys
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-3 space-y-12">
          
          <div className="rounded-3xl border border-slate-200 p-8 bg-white shadow-sm transition-all hover:shadow-md">
            <h3 className="text-[15px] font-bold text-slate-900 mb-8 pb-4 border-b border-slate-50">Agency Profile</h3>
            <div className="space-y-6 max-w-md">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Agency Name</label>
                <input 
                  type="text" 
                  className="w-full h-11 px-4 border border-slate-200 rounded-xl text-[15px] font-medium focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your agency name..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Workspace Identifier</label>
                <input 
                  type="text" 
                  readOnly 
                  className="w-full h-11 px-4 border border-slate-100 rounded-xl text-[14px] font-mono bg-slate-50 text-slate-400 cursor-not-allowed"
                  defaultValue={agency?.id || ''} 
                />
              </div>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="h-11 px-8 rounded-xl bg-slate-900 text-white text-[13px] font-bold uppercase tracking-widest transition-all hover:bg-slate-800 active:scale-[0.98] shadow-lg shadow-slate-200 mt-2 disabled:opacity-50"
              >
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-rose-100 p-8 bg-rose-50/30">
            <h3 className="text-[15px] font-bold text-rose-600 mb-6 flex items-center gap-2">Danger Zone</h3>
            <p className="text-[14px] font-medium text-slate-500 mb-6 max-w-xl">
              Permanently decommission your agency and all associated client data. This action is irreversible and requires administrative clearance.
            </p>
            <button className="h-11 px-8 rounded-xl border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 text-[13px] font-bold uppercase tracking-widest transition-all">
              Delete Agency
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
