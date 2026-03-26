'use client';

import { useState, useEffect } from 'react';
import { User, Shield, Key } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
        <div className="h-8 w-48 bg-zinc-900/60 rounded-lg" />
        <div className="h-4 w-64 bg-zinc-900/40 rounded-lg" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-10 px-4 md:px-8 py-6 max-w-5xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Account Settings</h1>
        <p className="text-sm font-medium text-foreground-muted">
          Manage your agency configuration, security parameters, and workspace preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Nav list */}
        <div className="md:col-span-1 space-y-1">
          <button className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold bg-zinc-900 text-white flex items-center gap-2 shadow-sm border border-white/5">
            <User size={16} /> Profile
          </button>
          <button className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2">
            <Shield size={16} /> Security
          </button>
          <button className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2">
            <Key size={16} /> API Keys
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-3 space-y-8">
          
          <Card className="shadow-sm border-white/5 bg-zinc-900/60">
            <CardContent className="p-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground-muted mb-8 pb-4 border-b border-white/5">Agency Profile</h3>
              <div className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Agency Name</label>
                  <Input 
                    placeholder="Enter your agency name..."
                    className="h-10 text-sm font-medium bg-zinc-900 border-white/5 focus:bg-zinc-800 focus:border-white/10 transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Workspace Identifier</label>
                  <div className="relative group">
                    <Input 
                      readOnly 
                      className="h-10 text-[13px] font-mono bg-zinc-900/40 text-zinc-500 cursor-not-allowed border-white/5"
                      defaultValue={agency?.id || ''} 
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <Button 
                    onClick={handleSave}
                    disabled={saving}
                    className="h-10 px-8 rounded-lg bg-primary text-sm font-semibold shadow-sm text-primary-foreground transition-all hover:opacity-90"
                  >
                    {saving ? 'Saving Changes...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-red-500/10 bg-red-500/5">
            <CardContent className="p-8">
              <h3 className="text-sm font-bold text-red-500 mb-4 flex items-center gap-2">Danger Zone</h3>
              <p className="text-sm font-medium text-foreground-muted mb-6 max-w-xl leading-relaxed">
                Permanently decommission your agency and all associated client data. This action is irreversible and requires administrative clearance.
              </p>
              <Button variant="ghost" className="h-10 px-8 rounded-lg border border-red-500/20 text-red-500 bg-transparent hover:bg-red-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-all">
                Delete Agency
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
