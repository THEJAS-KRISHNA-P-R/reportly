'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Bell, 
  ChevronDown, 
  Search, 
  Settings, 
  LogOut,
  Command
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClientSwitcher } from '@/components/layout/client-switcher';

export function TopNavbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const isClientContext = pathname.startsWith('/client/');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <header className="h-12 bg-white/80 border-b border-border w-full" />;

  return (
    <header className="h-12 flex items-center bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50 w-full shrink-0">
      <div className="flex items-center justify-between w-full h-full px-4 md:px-6">
        {/* Left: Context Selector */}
        <div className="flex items-center gap-4">
          {isClientContext ? (
            <ClientSwitcher />
          ) : (
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-surface-200 transition-colors group cursor-default">
              <div className="w-5 h-5 rounded bg-foreground flex items-center justify-center text-[10px] font-bold text-background uppercase">
                {user?.agency_name?.[0] || 'W'}
              </div>
              <span className="text-sm font-medium text-foreground truncate max-w-[120px] md:max-w-[200px]">
                {user?.agency_name || 'Workspace'}
              </span>
              <div className="px-1.5 py-0.5 rounded border border-border text-[10px] font-bold text-foreground-muted uppercase tracking-tight">
                Free
              </div>
            </div>
          )}
        </div>

        {/* Right: Global Actions & Identity */}
        <div className="flex items-center gap-3">
          {/* Search Trigger */}
          <div className="hidden md:flex items-center relative group">
            <Search size={14} className="absolute left-3 text-foreground-subtle group-focus-within:text-foreground transition-colors" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="h-8 w-64 bg-surface-200 border-none rounded-md pl-9 pr-10 text-sm font-medium focus:bg-surface-300 transition-all outline-none"
            />
            <div className="absolute right-2 px-1.5 py-0.5 rounded border border-border bg-white text-[10px] font-medium text-foreground-subtle tracking-tighter uppercase pointer-events-none">
              ⌘K
            </div>
          </div>

          <div className="h-4 w-px bg-border mx-1" />

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-200 transition-all outline-none group active:scale-95">
                <div className="w-7 h-7 rounded-full bg-surface-300 flex items-center justify-center text-[10px] font-medium text-foreground-muted shadow-sm overflow-hidden border border-border">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <ChevronDown size={14} className="text-foreground-subtle group-hover:text-foreground transition-colors mr-1" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-1 p-1.5 bg-white border border-border rounded-lg shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50 mb-1">
                <div className="w-9 h-9 rounded-full bg-surface-200 flex items-center justify-center text-sm font-medium text-foreground-muted">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-foreground leading-none">Admin</span>
                  <span className="text-xs text-foreground-muted truncate mt-1">{user?.email}</span>
                </div>
              </div>
              <DropdownMenuItem className="gap-2 focus:bg-surface-200 focus:text-foreground transition-colors cursor-pointer rounded-md px-3 py-2 text-sm font-medium">
                <Settings size={14} /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => logout()}
                className="gap-2 text-danger focus:bg-danger/5 transition-colors cursor-pointer rounded-md px-3 py-2 text-sm font-medium"
              >
                <LogOut size={14} /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
