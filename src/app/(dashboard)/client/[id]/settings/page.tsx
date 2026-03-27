'use client';

import { useParams } from 'next/navigation';
import { useClientStore } from '@/store/client-store';
import { Scaffold } from '@/components/layout/Scaffold';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { User, Users, BarChart3, Shield, Mail, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ClientSettingsPage() {
  const { id } = useParams();
  const { clients, activeClient, setActiveClient } = useClientStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && (!activeClient || activeClient.id !== id)) {
      const client = clients.find(c => c.id === id);
      if (client) {
        setActiveClient(client);
      }
    }
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [id, clients, activeClient, setActiveClient]);

  if (!activeClient && !loading) {
    return <Scaffold title="Settings" description="Client not found." />;
  }

  return (
    <Scaffold 
      title="Client Settings" 
      description={`Manage configuration and infrastructure for ${activeClient?.name || 'Client'}.`}
    >
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-surface-200 border border-border p-1 h-10 mb-8">
          <TabsTrigger value="profile" className="gap-2 px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2 px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-2 px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BarChart3 className="h-4 w-4" />
            Usage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-foreground mb-1">General Details</h3>
            <p className="text-sm text-foreground-muted mb-6">Update the public name and identifier for this client.</p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Client Name</label>
                <Input defaultValue={activeClient?.name} className="bg-surface-100 border-border focus:ring-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Project ID</label>
                <Input defaultValue={activeClient?.id} disabled className="bg-surface-200/50 border-border cursor-not-allowed opacity-60" />
              </div>
              <div className="pt-4 border-t border-border flex justify-end">
                <Button size="sm" className="bg-primary text-primary-foreground">Save Changes</Button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-foreground mb-1">API Authentication</h3>
            <p className="text-sm text-foreground-muted mb-4">Manage access keys for automated report generation.</p>
            <div className="flex items-center justify-between p-3 bg-surface-200/50 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-foreground-muted" />
                <code className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-border">rep_live_••••••••••••••••</code>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-primary font-semibold hover:bg-white px-2 h-7 transition-colors">Rotate Key</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="team" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-foreground">Team Members</h3>
                <p className="text-sm text-foreground-muted mt-1">Manage who has access to this client's reports.</p>
              </div>
              <Button size="sm" className="gap-2 bg-primary text-primary-foreground">
                <PlusCircle className="h-4 w-4" />
                Invite Member
              </Button>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Admin User', email: 'admin@reportly.com', role: 'Owner' },
                { name: 'Support Rep', email: 'support@reportly.com', role: 'Viewer' }
              ].map((member, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-surface-100 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-300 flex items-center justify-center text-xs font-medium text-foreground-muted">
                      {member.name[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{member.name}</span>
                      <span className="text-xs text-foreground-muted">{member.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-secondary text-secondary-foreground font-bold uppercase tracking-tight">
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
                <h3 className="text-base font-semibold text-foreground mb-4">Resource Consumption</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-foreground-muted">
                      <span>Monthly Reports</span>
                      <span>12 / 50</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[24%]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-foreground-muted">
                      <span>Cloud Storage</span>
                      <span>1.2 GB / 5 GB</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[24%]" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-surface-200/50 border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                   <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                    <Shield className="h-5 w-5" />
                   </div>
                   <h3 className="text-base font-semibold text-foreground">Plan Status</h3>
                </div>
                <p className="text-sm text-foreground-muted leading-relaxed mb-6">
                  You are currently on the <span className="text-foreground font-medium uppercase tracking-tight">Pro Plan</span>. Upgrade to Enterprise for unlimited storage and custom white-labeling.
                </p>
                <Button variant="outline" className="w-full border-border hover:bg-white font-semibold text-xs">View Invoicing</Button>
              </div>
           </div>
        </TabsContent>
      </Tabs>
    </Scaffold>
  );
}

// Helper icons
function PlusCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}
