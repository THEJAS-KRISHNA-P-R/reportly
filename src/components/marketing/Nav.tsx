'use client';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { AreaChart } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useEffect, useState } from 'react';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
      scrolled ? 'bg-white/80 backdrop-blur-md border-border shadow-sm py-3' : 'bg-transparent border-transparent py-5'
    }`}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 flex items-center justify-between">
        
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center transition-transform group-hover:scale-105">
            <AreaChart size={20} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">Reportly<span className="text-primary">.</span></span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
          <NavigationMenu>
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                <Link href="#features" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Features
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="#how-it-works" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    How it works
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="#pricing" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Pricing
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground hidden sm:block transition-colors">
            Log in
          </Link>
          <Link href="/register" className={buttonVariants({ size: "sm", className: "font-semibold shadow-sm" })}>
            Start free
          </Link>
        </div>

      </div>
    </header>
  );
}
