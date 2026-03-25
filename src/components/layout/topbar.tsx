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
    <header className="h-[var(--topbar-height)] flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 transition-all">
      <div className="flex items-center gap-4">
        <div className="md:hidden p-2 rounded-lg bg-slate-100 text-slate-600 mr-2">
           <LayoutGrid size={20} />
        </div>
        <Breadcrumbs />
        {planId !== 'free' && (
          <span
            className="hidden sm:inline-block text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
          >
            {planId}
          </span>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Usage Pills */}
        <div className="hidden lg:flex items-center gap-4">
          {planId !== 'agency' && planId !== 'pro' && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                reportsAtLimit ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider">Reports</span>
              <span className="text-sm font-bold">{reportsUsed}/{reportsLimit}</span>
            </div>
          )}
          {planId !== 'agency' && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                clientsAtLimit ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider">Clients</span>
              <span className="text-sm font-bold">{clientsUsed}/{clientsLimit}</span>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 hidden md:block" />

        <button className="relative w-10 h-10 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:flex flex-col items-start pr-1">
              <span className="text-[13px] font-bold text-slate-700 leading-none mb-0.5">{user?.name}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account</span>
            </div>
            <ChevronDown size={14} className={`text-slate-400 group-hover:text-slate-600 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-5 py-4 border-b border-slate-100 mb-1">
                <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs font-medium text-slate-400 truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="space-y-0.5">
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all"
                  onClick={() => setDropdownOpen(false)}
                >
                  Settings
                </Link>
                <Link
                  href="/billing"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all"
                  onClick={() => setDropdownOpen(false)}
                >
                  Billing
                </Link>
              </div>
              <div className="mt-1 pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-[13px] font-bold text-red-600 hover:bg-red-50 transition-all"
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
