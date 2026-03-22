'use client';

import { ShieldCheck, LayoutDashboard, List, AlertTriangle, Flag, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/admin' },
  { icon: List,            label: 'Queue',    href: '/admin/jobs' },
  { icon: AlertTriangle,   label: 'DLQ',      href: '/admin/dlq' },
  { icon: Flag,            label: 'Flags',    href: '/admin/flags' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="dashboard-layout">
      {/* Admin Sidebar */}
      <aside className="dashboard-sidebar flex flex-col justify-between hidden md:flex">
        <div className="flex flex-col flex-1 p-4 overflow-y-auto">
          {/* Brand */}
          <div className="flex items-center h-12 px-3 mb-6">
            <div className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
              <ShieldCheck size={22} className="text-white" />
              <span className="truncate max-w-[150px]">Superadmin HQ</span>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex flex-col gap-1.5 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
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

        {/* Bottom Section - Exit Admin */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <LogOut size={18} />
            Exit Admin
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main bg-gray-50">
        <header className="h-14 border-b bg-white flex items-center px-8 text-sm text-gray-400 font-medium">
          System Administration Terminal
        </header>
        <main className="dashboard-content p-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
