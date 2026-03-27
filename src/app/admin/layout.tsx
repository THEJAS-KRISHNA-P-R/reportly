'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  List,
  AlertTriangle,
  Flag,
  LogOut,
  Menu,
  X,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/admin' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: List, label: 'Queue', href: '/admin/jobs' },
  { icon: AlertTriangle, label: 'DLQ', href: '/admin/dlq' },
  { icon: Flag, label: 'Flags', href: '/admin/flags' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayoutContent>{children}</AdminLayoutContent>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navClass = (isActive: boolean, collapsed: boolean) =>
    `flex items-center ${collapsed ? 'justify-center' : ''} gap-3 rounded-xl ${collapsed ? 'px-2' : 'px-4'} py-3 text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-slate-900 text-white'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className={`sticky top-0 h-screen overflow-y-auto hidden shrink-0 border-r border-slate-200 bg-white transition-all duration-300 md:flex md:flex-col ${sidebarCollapsed ? 'w-20' : 'w-72'}`}>
          <div className={`border-b border-slate-200 ${sidebarCollapsed ? 'px-3 py-5' : 'px-6 py-5'}`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''} gap-3`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                <ShieldCheck size={18} strokeWidth={2.5} />
              </div>
              <div className={sidebarCollapsed ? 'hidden' : ''}>
                <p className="text-base font-bold tracking-tight">Admin Control</p>
                <p className="text-xs font-medium text-slate-500">Reportly Operations</p>
              </div>
            </div>
          </div>

          <nav className={`flex-1 space-y-1 ${sidebarCollapsed ? 'px-2 py-4' : 'px-4 py-4'}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={navClass(isActive, sidebarCollapsed)} title={item.label}>
                  <Icon size={16} />
                  {!sidebarCollapsed && item.label}
                </Link>
              );
            })}
          </nav>

          <div className={`border-t border-slate-200 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            <button
              onClick={logout}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 ${sidebarCollapsed ? 'px-2 py-3' : 'px-4 py-3'} text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100`}
              title="Sign out"
            >
              <LogOut size={15} />
              {!sidebarCollapsed && 'Sign out'}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMenuOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
                  aria-label="Open admin menu"
                >
                  <Menu size={18} />
                </button>
                <button
                  onClick={() => setSidebarCollapsed((v) => !v)}
                  className="hidden h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:inline-flex"
                  aria-label="Toggle admin sidebar"
                  title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  <Menu size={18} />
                </button>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Admin Routes</p>
                  <p className="text-base font-bold tracking-tight">
                    {navItems.find((n) => n.href === pathname)?.label ?? 'Overview'}
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Control plane healthy
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mx-auto w-full max-w-7xl"
            >
              {children}
            </motion.div>
          </main>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeMenu}
                className="fixed inset-0 z-40 bg-black/30 md:hidden"
                aria-label="Close admin menu overlay"
              />

              <motion.aside
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: 'spring', stiffness: 360, damping: 34 }}
                className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white md:hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-slate-900" />
                    <p className="text-sm font-bold">Admin Control</p>
                  </div>
                  <button
                    onClick={closeMenu}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200"
                    aria-label="Close admin menu"
                  >
                    <X size={16} />
                  </button>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-3">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className={navClass(isActive, false)}
                      >
                        <Icon size={16} />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="border-t border-slate-200 p-3">
                  <button
                    onClick={logout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
