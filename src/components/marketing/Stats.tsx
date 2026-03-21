'use client';
import { CountUp } from '@/components/ui/CountUp';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '@/lib/animations';

const stats = [
  { value: 40,   suffix: '+', label: 'Agencies onboarded' },
  { value: 9000, suffix: '+', label: 'Reports generated' },
  { value: 90,   suffix: 'h', label: 'Saved per agency/mo' },
  { value: 100,  suffix: '%', label: 'White-labeled' }
];

export function Stats() {
  return (
    <section className="bg-foreground py-16 sm:py-20 border-y border-foreground/90 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x divide-foreground/80"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          variants={staggerContainer}
        >
          {stats.map((stat, i) => (
            <motion.div 
              key={i} 
              variants={fadeUp}
              className="flex flex-col items-center justify-center text-center first:border-l-0 px-4"
            >
              <div className="text-[36px] sm:text-[44px] font-bold text-white mb-1 flex items-center justify-center">
                <CountUp to={stat.value} className="text-primary" />
                <span className="text-primary">{stat.suffix}</span>
              </div>
              <p className="text-[13px] sm:text-[14px] font-medium tracking-wide text-white/60">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
