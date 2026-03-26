'use client';

import { motion } from 'framer-motion';
import { Clock, AlertTriangle, Eye } from 'lucide-react';
import { stagger, fadeUp } from '@/lib/animations';

const pains = [
  {
    icon: Clock,
    stat: '90+ hours',
    title: 'Wasted every year',
    body: 'The average digital agency spends over 90 hours per year manually compiling client reports. That\'s 2+ weeks of billable time going nowhere.',
  },
  {
    icon: AlertTriangle,
    stat: '1 mistake',
    title: 'To lose a client',
    body: 'A single typo, wrong metric, or missed deadline can undo months of relationship building. Manual processes guarantee eventual human error.',
  },
  {
    icon: Eye,
    stat: '0 visibility',
    title: 'After you hit send',
    body: 'Once that email goes out, you have no idea if it was opened, if the client understood it, or if they\'re impressed — until they churn.',
  },
];

export function Problem() {
  return (
    <section
      id="features"
      className="marketing-section py-16"
      style={{ background: '#FFFFFF' }}
    >
      <div className="mx-auto w-full max-w-5xl px-6 md:px-[100px]">
        {/* Header */}
        <div className="text-center mb-10" style={{ maxWidth: 640, margin: '0 auto 2.5rem' }}>
          <p
            className="text-[9px] font-black tracking-widest uppercase mb-3"
            style={{ color: '#AAAAAA' }}
          >
            The problem
          </p>
          <h2
            className="text-2xl md:text-3xl font-black tracking-tight mb-4"
            style={{ color: '#000000' }}
          >
            Manual reporting is killing your agency
          </h2>
          <p className="text-xs md:text-sm font-medium opacity-40 px-4" style={{ color: '#000000' }}>
            Every month, agencies repeat the same painful cycle.
            It doesn&apos;t have to be this way.
          </p>
        </div>

        {/* Cards */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid md:grid-cols-3 gap-4"
        >
          {pains.map((pain) => {
            const Icon = pain.icon;
            return (
              <motion.article
                key={pain.title}
                variants={fadeUp}
                className="rounded-xl p-5 md:p-6 flex flex-col gap-4 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group border border-black/5"
                style={{ 
                  background: '#FDFDFD',
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 duration-500"
                  style={{ background: '#000000' }}
                >
                  <Icon size={14} color="#FFFFFF" strokeWidth={2.5} />
                </div>
                <div>
                  <p
                    className="text-2xl md:text-3xl font-black tracking-tight mb-0.5"
                    style={{ color: '#000000' }}
                  >
                    {pain.stat}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-wider mb-2.5 opacity-40" style={{ color: '#000000' }}>
                    {pain.title}
                  </p>
                  <p className="text-xs leading-relaxed opacity-50 font-medium" style={{ color: '#000000' }}>
                    {pain.body}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
