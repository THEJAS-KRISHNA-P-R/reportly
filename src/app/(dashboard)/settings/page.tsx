'use client';

import { useState, useEffect } from 'react';
import { User, Shield, Key, AlertTriangle } from 'lucide-react';
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
        <div className="h-8 w-48 bg-black/5 rounded-lg" />
        <div className="h-4 w-64 bg-black/[0.03] rounded-lg" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 py-10 w-full animate-fade-in centered-view">
      <div className="flex flex-col gap-0.5 px-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account Settings</h1>
        <p className="text-[13px] font-medium text-slate-500">
          Manage your agency configuration, security parameters, and workspace preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Nav list */}
        <div className="md:col-span-1 space-y-1">
          <button className="w-full text-left px-4 py-2 rounded-xl text-[13px] font-bold bg-primary/5 text-primary flex items-center gap-2 border border-primary/10 shadow-sm shadow-primary/5">
            <User size={15} /> Profile
          </button>
          <button className="w-full text-left px-4 py-2 rounded-xl text-[13px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
            <Shield size={15} /> Security
          </button>
          <button className="w-full text-left px-4 py-2 rounded-xl text-[13px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
            <Key size={15} /> API Keys
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-3 space-y-6">
          
          <Card className="glass-card border-slate-50">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 pb-3 border-b border-slate-50">Agency Profile</h3>
              <div className="space-y-5 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Agency Name</label>
                  <Input 
                    placeholder="Enter your agency name..."
                    className="h-10 text-sm font-medium bg-surface-200 border-border focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 text-slate-900 transition-all rounded-xl"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Workspace Identifier</label>
                  <div className="relative group">
                    <Input 
                      readOnly 
                      className="h-10 text-[12px] font-mono bg-slate-50 text-slate-400 cursor-not-allowed border-border rounded-xl"
                      defaultValue={agency?.id || ''} 
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <Button 
                    onClick={handleSave}
                    disabled={saving}
                    variant="primary"
                    className="h-10 px-8 font-bold shadow-md shadow-primary/10"
                  >
                    {saving ? 'Saving Changes...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-danger/10 bg-danger/[0.02] shadow-sm">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-sm font-bold text-danger mb-3 flex items-center gap-2">
                <AlertTriangle size={16} /> Danger Zone
              </h3>
              <p className="text-[13px] font-medium text-slate-500 mb-6 max-w-xl leading-relaxed">
                Permanently decommission your agency and all associated client data. This action is irreversible and requires administrative clearance.
              </p>
              <Button variant="ghost" className="h-9 px-6 rounded-lg border border-danger/20 text-danger bg-white hover:bg-danger hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm">
                Delete Agency
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
