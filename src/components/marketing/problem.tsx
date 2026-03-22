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
      className="marketing-section"
      style={{ background: '#FFFFFF' }}
    >
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16" style={{ maxWidth: 640, margin: '0 auto 4rem' }}>
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: '#777777' }}
          >
            The problem
          </p>
          <h2
            className="text-4xl md:text-5xl font-semibold tracking-tight mb-5"
            style={{ color: '#000000' }}
          >
            Manual reporting is silently killing your agency
          </h2>
          <p className="text-lg" style={{ color: '#555555' }}>
            Every month, agencies across India repeat the same painful cycle.
            It doesn&apos;t have to be this way.
          </p>
        </div>

        {/* Cards */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid md:grid-cols-3 gap-6"
        >
          {pains.map((pain) => {
            const Icon = pain.icon;
            return (
              <motion.article
                key={pain.title}
                variants={fadeUp}
                className="rounded-2xl p-8 flex flex-col gap-5"
                style={{ border: '1px solid #E5E5E5', background: '#FAFAFA' }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: '#000000' }}
                >
                  <Icon size={18} color="#FFFFFF" />
                </div>
                <div>
                  <p
                    className="text-3xl font-bold tracking-tight mb-1"
                    style={{ color: '#000000' }}
                  >
                    {pain.stat}
                  </p>
                  <p className="text-base font-semibold mb-3" style={{ color: '#000000' }}>
                    {pain.title}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: '#666666' }}>
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
