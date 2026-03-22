'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { label: 'Features',     href: '/#features' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'About',        href: '/about' },
];

export function MarketingNav() {
  const [visible,     setVisible]     = useState(true);
  const [isScrolled,  setIsScrolled]  = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const lastScrollY   = useRef(0);

  useEffect(() => {
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
  }, []);

  const inHero = !isScrolled;

  return (
    <AnimatePresence>
      {visible && (
        <motion.header
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{    y: -80, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed top-0 inset-x-0 z-50"
          style={{
            background: inHero
              ? 'transparent'
              : 'rgba(255,255,255,0.92)',
            borderBottom: inHero ? 'none' : '1px solid #E5E5E5',
            backdropFilter: inHero ? 'none' : 'blur(12px)',
          }}
        >
          <div
            className="container flex items-center justify-between"
            style={{ height: 64 }}
          >
            {/* Logo */}
            <Link
              href="/"
              className="text-base font-semibold tracking-tight"
              style={{ color: inHero ? '#FFFFFF' : '#000000' }}
            >
              Reportly
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm transition-opacity hover:opacity-70"
                  style={{ color: inHero ? 'rgba(255,255,255,0.75)' : '#333333' }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA group */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm transition-opacity hover:opacity-70"
                style={{ color: inHero ? 'rgba(255,255,255,0.75)' : '#333333' }}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium rounded-lg px-4 py-2 transition-opacity hover:opacity-80"
                style={{
                  background: inHero ? '#FFFFFF' : '#000000',
                  color:      inHero ? '#000000' : '#FFFFFF',
                }}
              >
                Get started free
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex flex-col gap-1.5 p-2"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="block w-5 h-px transition-all"
                  style={{ background: inHero ? '#FFFFFF' : '#000000' }}
                />
              ))}
            </button>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t overflow-hidden"
                style={{
                  background: '#FFFFFF',
                  borderColor: '#E5E5E5',
                }}
              >
                <div className="container py-4 flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="text-sm text-black hover:opacity-70 transition-opacity"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <hr style={{ borderColor: '#E5E5E5' }} />
                  <Link href="/login" className="text-sm text-black hover:opacity-70">Sign in</Link>
                  <Link
                    href="/register"
                    className="text-sm font-medium bg-black text-white rounded-lg px-4 py-2.5 text-center hover:opacity-80 transition-opacity"
                  >
                    Get started free
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>
      )}
    </AnimatePresence>
  );
}
