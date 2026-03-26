'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { label: 'Product', href: '#features' },
  { label: 'How it Works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
];

export function FloatingNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Desktop Floating Navbar */}
      <motion.nav
        className="hidden fixed top-8 left-1/2 -translate-x-1/2 z-50 md:flex items-center gap-8 px-8 py-4 rounded-full border"
        style={{
          borderColor: isScrolled ? 'var(--border)' : 'rgba(165, 165, 165, 0.3)',
          backgroundColor: isScrolled
            ? 'rgba(255, 255, 255, 0.95)'
            : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(8px)',
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center">
            <span className="text-white text-sm font-bold">R</span>
          </div>
          <span>Reportly</span>
        </Link>

        {/* Nav Items */}
        <div className="flex items-center gap-8">
          {navItems.map((item) => (
            <motion.a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              {item.label}
            </motion.a>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3 ml-4 border-l border-black/10 pl-4">
          {user ? (
            <Button
              asChild
              className="text-sm bg-black hover:bg-black/90 text-white rounded-full px-6"
            >
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="text-sm"
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button
                asChild
                className="text-sm bg-accent hover:bg-accent-hover text-white rounded-full px-6"
              >
                <Link href="/register">Start free</Link>
              </Button>
            </>
          )}
        </div>
      </motion.nav>

      {/* Mobile Navbar */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-40 md:hidden"
        style={{
          backgroundColor: isScrolled
            ? 'rgba(255, 255, 255, 0.95)'
            : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(8px)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="px-4 py-4 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center">
              <span className="text-white text-sm font-bold">R</span>
            </div>
            <span>Reportly</span>
          </Link>

          {/* Menu Button */}
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-bg-surface rounded-lg transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute top-16 left-0 right-0 bg-white border-b border-black/10"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div className="px-4 py-4 space-y-2">
                {navItems.map((item, idx) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-3 rounded-lg hover:bg-bg-surface transition-colors text-sm font-medium"
                    onClick={() => setIsOpen(false)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    {item.label}
                  </motion.a>
                ))}
                <div className="pt-4 border-t border-black/10 mt-4 space-y-2">
                  {user ? (
                    <Button
                      asChild
                      className="w-full justify-center bg-black hover:bg-black/90 text-white"
                    >
                      <Link href="/dashboard">Dashboard</Link>
                    </Button>
                  ) : (
                    <>
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full justify-center"
                      >
                        <Link href="/login">Log in</Link>
                      </Button>
                      <Button
                        asChild
                        className="w-full bg-accent hover:bg-accent-hover text-white"
                      >
                        <Link href="/register">Start free</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Mobile menu spacer */}
      <div className="h-16 md:hidden" />
    </>
  );
}
