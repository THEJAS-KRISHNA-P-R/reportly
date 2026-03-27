'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  BarChart3 as BarChart,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { useClientStore } from '@/store/client-store';
import { GLOBAL_NAV_ITEMS, CLIENT_NAV_ITEMS } from '@/config/nav-items';

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { activeClient, setActiveClient } = useClientStore();
  
  const navItems = activeClient
    ? CLIENT_NAV_ITEMS.map(item => ({
        ...item,
        href: item.href === '/client' 
          ? `/client/${activeClient.id}` 
          : `/client/${activeClient.id}/${item.href.split('/').pop()}`
      }))
    : GLOBAL_NAV_ITEMS;

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && window.innerWidth < 1200) setIsCollapsed(true);
  }, []);

  useEffect(() => {
    if (pathname === "/overview") {
      setActiveClient(null);
    }
  }, [pathname, setActiveClient]);

  if (!mounted) return <aside className="w-14 h-screen bg-white border-r border-border" />;

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed top-2 left-2 z-[60]">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md bg-white border border-border shadow-sm text-slate-500 hover:text-slate-900"
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-[50]"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
        animate={{ 
          width: isCollapsed ? 56 : 240,
          x: isMobileMenuOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 768 ? -240 : 0)
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={cn(
          "flex flex-col border-r border-border bg-white transition-all duration-200 ease-in-out z-40 shrink-0 shadow-sm",
          isCollapsed ? "w-14" : "w-60",
          "fixed md:sticky top-0 h-screen",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full bg-white">
        {/* Navigation Section */}
        <div className="flex-1 flex flex-col p-2 pt-4 space-y-1 overflow-y-auto no-scrollbar relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            const content = (
              <Link
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 h-9 rounded-md transition-all duration-200 group relative",
                  isCollapsed ? "justify-center px-0" : "px-2.5",
                  isActive 
                    ? "bg-surface-200 text-foreground" 
                    : "text-foreground-muted hover:text-foreground hover:bg-surface-200/50"
                )}
              >
                <Icon 
                  size={16} 
                  className={cn(
                    "shrink-0 transition-colors duration-200",
                    isActive ? "text-foreground" : "text-foreground-muted group-hover:text-foreground"
                  )} 
                />
                {!isCollapsed && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm font-medium truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active-pill"
                    className="absolute left-0 w-1 h-4 bg-primary rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    {content}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-900 text-white border-none font-medium text-xs py-1.5 px-3">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{content}</div>;
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-border space-y-1">
          <Tooltip key="help">
            <TooltipTrigger asChild>
              <button 
                className={cn(
                  "flex items-center gap-3 h-9 w-full rounded-md text-foreground-muted hover:text-foreground hover:bg-surface-200 transition-all",
                  isCollapsed ? "justify-center px-0" : "px-2.5"
                )}
              >
                <HelpCircle size={16} className="shrink-0" />
                {!isCollapsed && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium"
                  >
                    Support
                  </motion.span>
                )}
              </button>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">Support</TooltipContent>}
          </Tooltip>

          <Tooltip key="logout">
            <TooltipTrigger asChild>
              <button 
                onClick={() => logout()}
                className={cn(
                  "flex items-center gap-3 h-9 w-full rounded-md text-foreground-muted hover:text-red-600 hover:bg-red-50 transition-all",
                  isCollapsed ? "justify-center px-0" : "px-2.5"
                )}
              >
                <LogOut size={16} className="shrink-0" />
                {!isCollapsed && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium"
                  >
                    Sign Out
                  </motion.span>
                )}
              </button>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
          </Tooltip>

          <button 
            className={cn(
              "flex items-center gap-3 h-9 w-full rounded-md text-foreground-subtle transition-all cursor-default",
              isCollapsed ? "justify-center px-0" : "px-2.5"
            )}
          >
            <div className="w-4 h-4 rounded-full bg-surface-200 animate-pulse hidden" />
            {!isCollapsed && <span className="text-[10px] font-medium uppercase tracking-widest opacity-40">System Active</span>}
          </button>
        </div>
      </div>
      </motion.aside>
    </TooltipProvider>
  );
}
