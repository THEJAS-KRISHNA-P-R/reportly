'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild>
          <Link href="/register">Create account</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 dark:text-slate-50 dark:hover:bg-slate-800"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-50">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="max-w-[150px] truncate">{user.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 rounded-md bg-white shadow-lg dark:bg-slate-900 dark:ring-1 dark:ring-slate-700">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{user.name}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">{user.email}</p>
          </div>

          <nav className="space-y-1 px-2 py-2">
            <Link
              href="/settings"
              className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setIsOpen(false)}
            >
              Settings
            </Link>
          </nav>

          <div className="border-t border-slate-200 px-2 py-2 dark:border-slate-700">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={handleLogout}
              disabled={loading}
            >
              {loading ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
