'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, FileText, Settings,
  LogOut, BarChart2,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',          icon: LayoutDashboard, label: 'Overview'  },
  { href: '/dashboard/clients',  icon: Users,           label: 'Clients'   },
  { href: '/dashboard/reports',  icon: FileText,        label: 'Reports'   },
  { href: '/dashboard/settings', icon: Settings,        label: 'Settings'  },
];

interface SidebarProps {
  agencyName: string;
  plan:       string;
  email:      string;
}

function LogoMark() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--accent)] flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-sm" />
      </div>
      <span className="text-[16px] font-semibold text-[var(--text-primary)] tracking-tight">
        Reportly
      </span>
    </div>
  );
}

export function Sidebar({ agencyName, plan, email }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="
      fixed left-0 top-0 h-screen w-[240px]
      bg-[var(--bg-surface)] border-r border-[var(--border)]
      flex-col z-30
      hidden md:flex
    ">
      {/* Logo */}
      <div className="h-[64px] flex items-center px-6 border-b border-[var(--border)] shrink-0">
        <LogoMark />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">
          Workspace
        </p>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 h-9 rounded-[var(--radius-md)] text-[14px] font-medium',
                'transition-colors duration-[120ms] ease-[ease]',
                active
                  ? 'bg-[var(--accent-light)] text-[var(--accent-dark)] border-l-2 border-[var(--accent)] -ml-px pl-[11px]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]',
              )}
            >
              <Icon size={16} strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}

        {/* Analytics — coming soon */}
        <div className="flex items-center gap-3 px-3 h-9 rounded-[var(--radius-md)] text-[14px] font-medium text-[var(--text-muted)] opacity-50 cursor-not-allowed">
          <BarChart2 size={16} strokeWidth={1.5} />
          Analytics
          <span className="ml-auto text-[10px] font-medium uppercase tracking-wider bg-[var(--border)] text-[var(--text-muted)] px-1.5 py-0.5 rounded-sm">
            Soon
          </span>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[var(--border)] space-y-3 shrink-0">
        <div className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-muted)]">
          <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{agencyName}</p>
          <p className="text-[11px] text-[var(--text-muted)] truncate">{email}</p>
          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/20">
            {plan}
          </span>
        </div>
        <Link
          href="/api/auth/logout"
          className="flex items-center gap-2 px-3 h-9 w-full rounded-[var(--radius-md)] text-[13px] text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] transition-colors duration-[120ms] ease-[ease]"
        >
          <LogOut size={14} strokeWidth={1.5} />
          Sign out
        </Link>
      </div>
    </aside>
  );
}
