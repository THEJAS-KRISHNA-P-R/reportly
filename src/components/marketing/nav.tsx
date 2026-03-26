'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { ShimmerButton } from '@/components/ui/shimmer-button';

const navLinks = [
  { label: 'Problem',      href: '/problem' },
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Features',     href: '/features' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'About',        href: '/about' },
];

export function MarketingNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === '/';
  const [visible,     setVisible]     = useState(true);
  const [isScrolled,  setIsScrolled]  = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const lastScrollY   = useRef(0);

  useEffect(() => {
    if (!isHomePage) {
      setIsScrolled(true);
      setVisible(true);
      return;
    }

    const handleScroll = () => {
      const currentY = window.scrollY;

      // Transparency: in hero zone (< 85vh)
      setIsScrolled(currentY > window.innerHeight * 0.85);

      // Show/hide logic
      if (Math.abs(currentY - lastScrollY.current) < 5) return;

      if (currentY > lastScrollY.current && currentY > 80) {
        setVisible(false);
        setMenuOpen(false);
      } else {
        setVisible(true);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const inHero = isHomePage && !isScrolled;

  return (
    <AnimatePresence>
      {visible && (
        <motion.header
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{    y: -80, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed top-4 inset-x-0 z-50 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <div
            className={`flex items-center justify-between px-6 rounded-2xl transition-all duration-300 ${
              inHero 
                ? 'bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl' 
                : 'bg-white/80 backdrop-blur-lg border border-white/20 shadow-lg'
            }`}
            style={{ height: 66 }}
          >
            {/* Logo */}
            <Link
              href="/"
              className="text-lg font-bold tracking-tighter"
              style={{ color: inHero ? '#FFFFFF' : '#000000' }}
            >
              Reportly
            </Link>

            <nav className="hidden md:flex items-center gap-8 h-full">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[13px] font-bold transition-all hover:opacity-100 flex items-center h-full ${pathname === link.href ? 'opacity-100' : 'opacity-60'}`}
                  style={{ color: inHero ? '#FFFFFF' : '#000000' }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA group */}
            <div className="hidden md:flex items-center gap-5 h-full">
              <Link
                href="/login"
                className="text-[13px] font-bold transition-all hover:opacity-100 opacity-60"
                style={{ color: inHero ? '#FFFFFF' : '#000000' }}
              >
                Sign in
              </Link>
              <ShimmerButton
                onClick={() => {
                  router.push('/register');
                }}
                className="h-10 px-5 text-[13px] font-bold shadow-[0_8px_24px_rgba(59,130,246,0.18)]"
                background="rgba(3,8,20,0.96)"
                shimmerColor="#93c5fd"
                shimmerDuration="2.2s"
                textColor="#ffffff"
              >
                Get started
              </ShimmerButton>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg transition-transform duration-200 hover:scale-105"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`block w-5 h-0.5 rounded-full transition-all ${
                    menuOpen && i === 0 ? 'rotate-45 translate-y-2' : ''
                  } ${
                    menuOpen && i === 1 ? 'opacity-0' : ''
                  } ${
                    menuOpen && i === 2 ? '-rotate-45 -translate-y-2' : ''
                  }`}
                  style={{ background: inHero ? '#FFFFFF' : '#000000' }}
                />
              ))}
            </button>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="md:hidden mt-2 rounded-2xl overflow-hidden shadow-2xl border"
                style={{
                  background: inHero ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.95)',
                  borderColor: inHero ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="p-6 flex flex-col gap-5">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="text-base font-medium transition-opacity"
                      style={{ color: inHero ? '#FFFFFF' : '#000000' }}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="h-px w-full" style={{ background: inHero ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />
                  <Link href="/login" className="text-base font-medium" style={{ color: inHero ? '#FFFFFF' : '#000000' }}>Sign in</Link>
                  <ShimmerButton
                    onClick={() => {
                      setMenuOpen(false);
                      router.push('/register');
                    }}
                    className="w-full text-base font-bold shadow-[0_8px_24px_rgba(59,130,246,0.18)]"
                    background="rgba(3,8,20,0.96)"
                    shimmerColor="#93c5fd"
                    shimmerDuration="2.2s"
                    textColor="#ffffff"
                  >
                    Get started free
                  </ShimmerButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>
      )}
    </AnimatePresence>
  );
}
