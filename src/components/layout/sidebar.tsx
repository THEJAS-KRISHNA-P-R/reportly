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
    <aside className="dashboard-sidebar flex flex-col justify-between hidden md:flex">
      {/* Top Section */}
      <div className="flex flex-col flex-1 p-4 overflow-y-auto">
        {/* Brand */}
        <div className="flex items-center h-12 px-3 mb-6">
          <Link href="/dashboard" className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-white text-black flex items-center justify-center text-sm font-bold">
              {user?.agency_name?.[0]?.toUpperCase() || 'R'}
            </span>
            <span className="truncate max-w-[150px]">
              {user?.agency_name || 'Reportly'}
            </span>
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: isActive ? '#1A1A1A' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
