'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, BarChart3, Palette, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview',  href: '/dashboard' },
  { icon: Users,           label: 'Clients',   href: '/clients' },
  { icon: FileText,        label: 'Reports',   href: '/reports' },
  { icon: BarChart3,       label: 'Analytics', href: '/analytics' },
  { icon: Palette,         label: 'Customize', href: '/customize' },
  { icon: Settings,        label: 'Settings',  href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-[var(--sidebar-width)] h-screen flex flex-col justify-between hidden md:flex bg-slate-50 border-r border-slate-200 sticky top-0">
      {/* Top Section */}
      <div className="flex flex-col flex-1 p-6 overflow-y-auto">
        {/* Brand */}
        <div className="flex items-center h-14 px-2 mb-10 overflow-hidden">
          <Link href="/dashboard" className="flex items-center gap-3 group transition-transform hover:scale-[1.01]">
            <div className="w-9 h-9 shrink-0 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
              {user?.agency_name?.[0]?.toUpperCase() || 'R'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-900 truncate tracking-tight">
                {user?.agency_name || 'Reportly'}
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Agency Node
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all ${
                  isActive 
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200 ring-1 ring-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-6 border-t border-slate-200 bg-slate-100/30">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-[14px] font-semibold transition-all text-slate-500 hover:text-red-600 hover:bg-red-50/50"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
