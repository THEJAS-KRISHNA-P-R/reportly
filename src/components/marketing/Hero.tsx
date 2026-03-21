'use client';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { AnimatedText } from '@/components/ui/AnimatedText';
import { BackgroundPattern } from '@/components/ui/BackgroundPattern';
import { AnnouncementBadge } from './AnnouncementBadge';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';

const AVATAR_COLORS = ['#FAF0E4', '#F0F8F3', '#F0F4F8', '#FFF5F5'];

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 pt-32 pb-24 border-b border-border overflow-hidden">
      <BackgroundPattern />
      
      <div className="w-full max-w-[720px] mx-auto text-center flex flex-col items-center z-10 relative">
        <AnnouncementBadge text="✦ Trusted by agencies in 12+ cities" />

        <AnimatedText 
          text="Your clients deserve reports that explain themselves." 
          className="text-[44px] sm:text-[56px] font-bold text-foreground leading-[1.05] tracking-[-0.03em] mb-6 justify-center"
        />

        <motion.p 
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-[17px] sm:text-[19px] text-muted-foreground max-w-[540px] leading-relaxed mb-10"
        >
          Reportly pulls your Google Analytics data, writes the narrative, and delivers a branded <strong className="font-semibold text-foreground">PDF to your clients</strong> — automatically, every month.
        </motion.p>

        <motion.div 
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16"
        >
          <Link href="/register" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto h-12 px-8 text-[15px] font-medium transition-transform hover:scale-[1.02] active:scale-95" })}>
              Start free — no card needed
              <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
          <Link href="#how-it-works" className={buttonVariants({ variant: "ghost", size: "lg", className: "w-full sm:w-auto h-12 px-8 text-[15px] font-medium" })}>
            See how it works
          </Link>
        </motion.div>

        {/* Social Proof Avatars */}
        <motion.div 
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="flex -space-x-3">
            {AVATAR_COLORS.map((bg, i) => (
              <div 
                key={i} 
                className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-foreground/40 shadow-sm"
                style={{ backgroundColor: bg }}
              >
                {['A', 'M', 'K', 'R'][i]}
              </div>
            ))}
          </div>
          <p className="text-[13px] text-muted-foreground font-medium">
            Join 40+ agencies saving 10+ hours a month
          </p>
        </motion.div>
      </div>

      {/* Dashboard Mockup wireframe */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-[1000px] mt-24 mx-auto relative rounded-xl border border-border/60 bg-white/50 backdrop-blur-sm p-2 shadow-hero hidden md:block" // Hidden on small mobile to keep hero tight
      >
        <div className="w-full aspect-[16/9] rounded-lg bg-secondary border border-border overflow-hidden flex flex-col shadow-sm">
          {/* Mockup Topbar */}
          <div className="h-12 border-b border-border bg-white flex items-center px-4 gap-4">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-border-strong" />
              <div className="w-2.5 h-2.5 rounded-full bg-border-strong" />
              <div className="w-2.5 h-2.5 rounded-full bg-border-strong" />
            </div>
            <div className="h-4 w-32 bg-muted rounded-sm ml-4" />
          </div>
          {/* Mockup Body */}
          <div className="flex-1 flex p-6 gap-6">
            <div className="w-48 hidden lg:block space-y-3 pt-2">
              <div className="h-3 w-24 bg-border/60 rounded-sm mb-6" />
              <div className="h-8 w-full bg-primary/10 rounded-md" />
              <div className="h-8 w-3/4 bg-border/40 rounded-md" />
              <div className="h-8 w-5/6 bg-border/40 rounded-md" />
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex justify-between items-center mb-2">
                <div className="h-6 w-40 bg-border/80 rounded-sm" />
                <div className="h-8 w-24 bg-primary text-white rounded-md flex items-center justify-center text-[10px] font-medium">Download</div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-white border border-border rounded-lg p-4 flex flex-col justify-between">
                    <div className="h-3 w-16 bg-muted-foreground/20 rounded-sm" />
                    <div className="h-6 w-24 bg-foreground/80 rounded-sm" />
                  </div>
                ))}
              </div>
              <div className="flex-1 bg-white border border-border rounded-lg p-6">
                <div className="h-4 w-1/3 bg-border/80 rounded-sm mb-6" />
                <div className="space-y-3">
                  <div className="h-3 w-full bg-border/40 rounded-sm" />
                  <div className="h-3 w-5/6 bg-border/40 rounded-sm" />
                  <div className="h-3 w-4/6 bg-border/40 rounded-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
