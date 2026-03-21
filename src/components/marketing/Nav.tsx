'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const links = [
  { href: '#features',     label: 'Features'    },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing',      label: 'Pricing'      },
  { href: '#about',        label: 'About'        },
];

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

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 h-[64px]',
      'flex items-center justify-between px-6 md:px-10',
      'transition-all duration-[200ms] ease-[ease]',
      scrolled
        ? 'bg-white/95 backdrop-blur-md border-b border-[var(--border)] shadow-[var(--shadow-xs)]'
        : 'bg-transparent',
    )}>
      <Link href="/" id="nav-logo">
        <LogoMark />
      </Link>

      <nav className="hidden md:flex items-center gap-8">
        {links.map(l => (
          <a
            key={l.href}
            href={l.href}
            className="text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-[120ms] ease-[ease]"
          >
            {l.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <Link href="/login">
          <Button variant="ghost" size="sm" id="nav-login">Log in</Button>
        </Link>
        <Link href="/register">
          <Button variant="primary" size="sm" id="nav-cta">Start free</Button>
        </Link>
      </div>
    </header>
  );
}
