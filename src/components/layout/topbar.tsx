'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { cn } from '@/lib/utils';

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
    <header className="h-[var(--topbar-height)] flex items-center bg-white border-b border-border sticky top-0 z-50">
      <div className="centered-view flex items-center justify-between w-full h-full px-4">
        {/* Left: Navigation & Context */}
        <div className="flex items-center gap-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Reports Generated</span>
            <div className="flex items-baseline gap-2">
              <span className={cn("text-sm font-bold", reportsAtLimit ? "text-red-600" : "text-slate-900")}>
                {reportsUsed}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">/ {reportsLimit} Reports</span>
            </div>
          </div>
          
          <div className="h-8 w-px bg-slate-100" />

          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Active Portfolio</span>
            <div className="flex items-baseline gap-2">
              <span className={cn("text-sm font-bold", clientsAtLimit ? "text-red-600" : "text-slate-900")}>
                {clientsUsed}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Active Nodes</span>
            </div>
          </div>
        </div>

        {/* Right: Actions & Identity */}
        <div className="flex items-center gap-3">
          <button className="relative w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
            <Bell size={18} />
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-white" />
          </button>

          <div className="h-6 w-px bg-slate-100 mx-1" />

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-transparent group-hover:ring-slate-100 transition-all">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-[13px] font-bold text-slate-900">{user?.name}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Agency Master</span>
              </div>
              <ChevronDown size={14} className={`text-slate-400 group-hover:text-slate-900 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-border rounded-xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-slate-50 mb-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-[10px] font-medium text-slate-500 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <div className="space-y-0.5">
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Settings
                    </Link>
                    <Link
                      href="/billing"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Billing
                    </Link>
                  </div>
                  <div className="mt-1 pt-1 border-t border-slate-50">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
                    >
                       Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
