'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

/* 
  Breadcrumb mapping for known paths
*/
const getPageTitle = (pathname: string) => {
  if (pathname === '/dashboard') return 'Overview';
  if (pathname === '/clients') return 'Clients';
  if (pathname === '/reports') return 'Reports';
  if (pathname === '/analytics') return 'Analytics';
  if (pathname === '/customize') return 'Customize';
  if (pathname === '/settings') return 'Settings';
  if (pathname === '/billing') return 'Billing';
  if (pathname.startsWith('/clients/new')) return 'Add Client';
  if (pathname.startsWith('/clients/')) return 'Client Details';
  if (pathname.startsWith('/reports/')) return 'Report Editor';
  return '';
};

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
  
  const title = getPageTitle(pathname);

  useEffect(() => {
    async function fetchUsage() {
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
        }
      } catch (err) {
        // ignore
      }
    }
    fetchUsage();
  }, [pathname]);

  const reportsAtLimit = reportsUsed >= reportsLimit && planId !== 'agency' && planId !== 'pro'; 
  const clientsAtLimit = clientsUsed >= clientsLimit;

  return (
    <header className="dashboard-topbar flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold tracking-tight" style={{ color: '#000000' }}>
          {title}
        </h1>
        {planId !== 'free' && (
          <span
            className="hidden sm:inline-block text-xs font-semibold tracking-widest uppercase px-2 py-0.5 rounded-md"
            style={{ background: '#000000', color: '#FFFFFF' }}
          >
            {planId}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Usage Pills */}
        <div className="hidden md:flex items-center gap-2 mr-2">
          {planId !== 'agency' && planId !== 'pro' && (
            <div
              className="text-xs font-medium px-2.5 py-1 rounded-full border"
              style={{
                background: reportsAtLimit ? '#FFF4F4' : '#F8F8F8',
                borderColor: reportsAtLimit ? 'rgba(139,26,42,0.2)' : '#E5E5E5',
                color: reportsAtLimit ? '#8B1A2A' : '#666666',
              }}
            >
              Reports: {reportsUsed}/{reportsLimit}
            </div>
          )}
          {planId !== 'agency' && (
            <div
              className="text-xs font-medium px-2.5 py-1 rounded-full border"
              style={{
                background: clientsAtLimit ? '#FFF4F4' : '#F8F8F8',
                borderColor: clientsAtLimit ? 'rgba(139,26,42,0.2)' : '#E5E5E5',
                color: clientsAtLimit ? '#8B1A2A' : '#666666',
              }}
            >
              Clients: {clientsUsed}/{clientsLimit}
            </div>
          )}
        </div>

        <button className="relative p-2 rounded-full transition-colors hover:bg-gray-100" aria-label="Notifications">
          <Bell size={18} style={{ color: '#333333' }} />
          {/* Unread badge placeholder */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#8B1A2A' }} />
        </button>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full transition-colors hover:bg-gray-100"
            style={{ border: '1px solid #E5E5E5' }}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: '#000000', color: '#FFFFFF' }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <ChevronDown size={14} style={{ color: '#666666' }} />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg border overflow-hidden z-50 origin-top-right transform transition-all"
              style={{ background: '#FFFFFF', borderColor: '#E5E5E5' }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: '#F2F2F2' }}>
                <p className="text-sm font-medium truncate" style={{ color: '#000000' }}>{user?.name}</p>
                <p className="text-xs truncate" style={{ color: '#666666' }}>{user?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/settings"
                  className="block px-4 py-2 text-sm transition-colors hover:bg-gray-50"
                  style={{ color: '#333333' }}
                  onClick={() => setDropdownOpen(false)}
                >
                  Settings
                </Link>
                <Link
                  href="/billing"
                  className="block px-4 py-2 text-sm transition-colors hover:bg-gray-50"
                  style={{ color: '#333333' }}
                  onClick={() => setDropdownOpen(false)}
                >
                  Billing
                </Link>
              </div>
              <div className="py-1 border-t" style={{ borderColor: '#F2F2F2' }}>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm transition-colors hover:bg-red-50"
                  style={{ color: '#8B1A2A' }}
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
