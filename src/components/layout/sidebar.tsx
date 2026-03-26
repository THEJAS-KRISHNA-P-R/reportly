'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3, 
  Palette, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <aside className="w-16 h-screen bg-zinc-950/80 backdrop-blur-md border-r border-white/5" />;

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-background border border-border shadow-sm text-foreground-muted hover:text-foreground"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 bg-foreground/10 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isCollapsed ? 64 : 240,
          x: isMobileMenuOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 768 ? -240 : 0)
        }}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="h-screen flex flex-col justify-between fixed md:sticky top-0 left-0 bg-zinc-950/80 backdrop-blur-md border-r border-white/5 z-45 overflow-hidden group/sidebar"
      >
        <div className="flex flex-col flex-1 p-2">
          {/* Brand/Logo */}
          <div className="flex items-center h-12 px-2 mb-6 mt-1">
            <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 shrink-0 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm">
                {user?.agency_name?.[0]?.toUpperCase() || 'R'}
              </div>
              {!isCollapsed && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-semibold text-foreground tracking-tight truncate"
                >
                  {user?.agency_name || 'Reportly'}
                </motion.span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  title={isCollapsed ? item.label : ''}
                  className={`flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                    isActive 
                      ? 'bg-white text-black shadow-sm' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Action Area/User */}
        <div className="p-2 border-t border-white/5 mt-auto">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-2 py-2 w-full rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={18} className="shrink-0" />
            {!isCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
