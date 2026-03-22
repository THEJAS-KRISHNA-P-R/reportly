'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Users, FileText, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#111111] border-r border-[rgba(255,255,255,0.08)] flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-[rgba(255,255,255,0.08)] px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white">
            <span className="text-black text-sm font-bold">R</span>
          </div>
          <span className="text-lg">Reportly</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[rgba(255,255,255,0.10)] text-white border-l-2 border-l-[#C17B2F]'
                  : 'text-[rgba(255,255,255,0.55)] hover:text-[rgba(255,255,255,0.90)] hover:bg-[rgba(255,255,255,0.06)]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[rgba(255,255,255,0.08)] px-3 py-6 space-y-3">
        <div className="px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[rgba(255,255,255,0.30)] mb-2">
            Account
          </p>
          <p className="text-sm text-[rgba(255,255,255,0.85)] font-medium">
            {user?.name || 'User'}
          </p>
          <p className="text-xs text-[rgba(255,255,255,0.45)] mt-1">
            {user?.email || 'user@example.com'}
          </p>
        </div>
        <button 
          onClick={() => logout()}
          className="w-full flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-[rgba(255,255,255,0.40)] hover:text-error hover:bg-[rgba(139,31,42,0.1)] transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
