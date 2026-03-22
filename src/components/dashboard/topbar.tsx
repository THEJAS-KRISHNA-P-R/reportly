'use client';

import { UserMenu } from '@/components/ui/user-menu';
import { AuthProvider } from '@/lib/auth-context';

export function Topbar() {
  return (
    <header className="fixed right-0 top-0 z-40 h-16 w-full border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950" style={{ paddingLeft: '16rem' }}>
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex-1" />
        <UserMenu />
      </div>
    </header>
  );
}
