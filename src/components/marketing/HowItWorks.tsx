'use client';
import { Link2, ShieldCheck, SendHorizonal } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';

const steps = [
  {
    num:  '01',
    icon: Link2,
    title: 'Connect once',
    body:  'Link your Google Analytics account in under 2 minutes. No developer required. We only request read access.'
  },
  {
    num:  '02',
    icon: ShieldCheck,
    title: 'We fetch and validate',
    body:  'Every metric is verified before the AI sees it. Wrong data, null values, impossible spikes — all caught before they become embarrassing.'
  },
  {
    num:  '03',
    icon: SendHorizonal,
    title: 'Review, approve, send',
    body:  'Edit the AI narrative, approve it, and Reportly delivers the branded PDF to your client. Nothing goes out without your sign-off.'
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-surface border-b border-border">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-8">
        
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          variants={staggerContainer}
          className="mb-16 sm:mb-24"
        >
          <motion.span variants={fadeUp} className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-4 block">
            The Process
          </motion.span>
          <motion.h2 variants={fadeUp} className="text-[32px] sm:text-[40px] font-bold text-foreground tracking-[-0.02em] mb-4">
            From data to delivered report in minutes
          </motion.h2>
          <motion.p variants={fadeUp} className="text-[17px] text-muted-foreground">
            The entire workflow is automated. Your only job is reviewing and approving.
          </motion.p>
        </motion.div>

        <motion.div 
          className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          variants={staggerContainer}
        >
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-[1px] border-t-2 border-dashed border-border z-0" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div key={i} variants={fadeUp} className="relative z-10 flex flex-col md:items-center text-left md:text-center">
                <div className="w-14 h-14 rounded-full bg-white border border-border shadow-sm flex items-center justify-center mb-6 mx-0 md:mx-auto">
                  <Icon size={24} className="text-foreground" strokeWidth={1.5} />
                </div>
                
                <div className="text-[11px] font-bold tracking-widest text-primary uppercase mb-3">
                  {step.num}
                </div>
                
                <h3 className="text-[20px] font-bold text-foreground mb-3">
                  {step.title}
                </h3>
                
                <p className="text-[15px] text-muted-foreground leading-relaxed max-w-[280px]">
                  {step.body}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
