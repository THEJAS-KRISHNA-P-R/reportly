'use client';
import { motion } from 'framer-motion';

export function LogoMarquee() {
  const logos = ['WESTSIDE', 'FINEX', 'AURA', 'LUMINA', 'NEXUS', 'SYNTAX', 'SPHERE', 'OMNI', 'WESTSIDE', 'FINEX', 'AURA', 'LUMINA', 'NEXUS', 'SYNTAX', 'SPHERE', 'OMNI'];
  
  return (
    <div className="w-full relative overflow-hidden flex items-center h-20 bg-muted/30 border-y border-border">
      <div className="absolute left-0 w-32 h-full bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 w-32 h-full bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <motion.div 
        className="flex whitespace-nowrap gap-16 item-center px-8"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
      >
        {logos.map((logo, i) => (
          <div key={i} className="text-[20px] font-bold text-muted-foreground tracking-widest uppercase opacity-40">
            {logo}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
