'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

export function Topbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Usage states
  const [reportsUsed, setReportsUsed] = useState(0);
  const [reportsLimit, setReportsLimit] = useState(2);
  const [clientsUsed, setClientsUsed] = useState(0);
  const [clientsLimit, setClientsLimit] = useState(1);
  const [planId, setPlanId] = useState('free');
  
  const lastFetchRef = useRef<number>(0);

  useEffect(() => {
    async function fetchUsage() {
      // Cache: only fetch if data is more than 60 seconds old
      if (Date.now() - lastFetchRef.current < 60000) {
        return;
      }

      try {
        const res = await fetch('/api/agencies/me');
        if (res.ok) {
          const data = await res.json();
          setReportsUsed(data.reports_generated_this_month || 0);
          setReportsLimit(data.plan_report_limit || 2);
          setClientsUsed(data.clients_count || 0);
          
          if (data.agency_billing?.plan_id) {
            setPlanId(data.agency_billing.plan_id);
            if (data.agency_billing.plan_id === 'free') {
              setClientsLimit(1);
            } else if (data.agency_billing.plan_id === 'pro') {
              setClientsLimit(5);
            } else {
              setClientsLimit(9999); // agency
            }
          }
          lastFetchRef.current = Date.now();
        }
      } catch {
        // ignore
      }
    }
    fetchUsage();
  }, [pathname]);

  const reportsAtLimit = reportsUsed >= reportsLimit && planId !== 'agency' && planId !== 'pro'; 
  const clientsAtLimit = clientsUsed >= clientsLimit;

  return (
    <header className="h-[var(--topbar-height)] flex items-center justify-between px-4 bg-white/5 dark:bg-black/40 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40 transition-all">
      <div className="flex items-center gap-4">
        <div className="md:hidden p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 mr-2">
           <LayoutGrid size={18} />
        </div>
        <Breadcrumbs />
        {planId !== 'free' && (
          <span
            className="hidden sm:inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/10"
          >
            {planId}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Usage Pills */}
        <div className="hidden lg:flex items-center gap-3">
          {planId !== 'agency' && planId !== 'pro' && (
            <div
              className={`flex items-center gap-2 px-2.5 py-1 rounded-md transition-all ${
                reportsAtLimit ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-zinc-400'
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider">Reports</span>
              <span className="text-sm font-medium">{reportsUsed}/{reportsLimit}</span>
            </div>
          )}
          {planId !== 'agency' && (
            <div
              className={`flex items-center gap-2 px-2.5 py-1 rounded-md transition-all ${
                clientsAtLimit ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-zinc-400'
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider">Clients</span>
              <span className="text-sm font-medium">{clientsUsed}/{clientsLimit}</span>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-white/10 hidden md:block" />

        <button className="relative w-9 h-9 rounded-lg border border-white/5 bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-200">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-background" />
        </button>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-2 py-1.5 rounded-lg border border-transparent hover:bg-white/5 transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:flex flex-col items-start pr-1">
              <span className="text-sm font-medium text-foreground leading-none">{user?.name}</span>
            </div>
            <ChevronDown size={14} className={`text-foreground-muted group-hover:text-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-white/10 rounded-lg shadow-md p-1 z-50 animate-fade-in backdrop-blur-xl">
              <div className="px-3 py-2 border-b border-white/5 mb-1">
                <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
                <p className="text-[10px] font-medium text-foreground-muted truncate">{user?.email}</p>
              </div>
              <div className="space-y-0.5">
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-3 py-1.5 rounded-md text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                  onClick={() => setDropdownOpen(false)}
                >
                  Settings
                </Link>
                <Link
                  href="/billing"
                  className="flex items-center gap-3 px-3 py-1.5 rounded-md text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                  onClick={() => setDropdownOpen(false)}
                >
                  Billing
                </Link>
              </div>
              <div className="mt-1 pt-1 border-t border-white/5">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-3 w-full px-3 py-1.5 rounded-md text-sm font-semibold text-error/80 hover:text-error hover:bg-error/5 transition-all"
                >
                   Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
