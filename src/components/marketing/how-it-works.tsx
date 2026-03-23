'use client';

import { motion } from 'framer-motion';
import { PlugZap, Sparkles, Send } from 'lucide-react';
import { stagger, fadeUp } from '@/lib/animations';

const steps = [
  {
    number: '01',
    icon: PlugZap,
    title: 'Connect Google Analytics',
    body: 'Authorise Reportly with your client\'s GA4 property in 60 seconds. We pull sessions, users, bounce rate, traffic sources, and top pages automatically.',
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'AI writes the narrative',
    body: 'Claude Haiku analyses your client\'s data and writes a professional narrative — highlights, trends, and recommendations. Every report is unique, never templated.',
  },
  {
    number: '03',
    icon: Send,
    title: 'Approve and send',
    body: 'Review the report in our editor, customise any section with your agency branding, then approve. A white-labelled PDF lands in your client\'s inbox automatically.',
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="marketing-section py-16"
      style={{ background: '#FDFDFD' }}
    >
      <div className="marketing-content-shell">
        {/* Header */}
        <div className="text-center mb-10" style={{ maxWidth: 640, margin: '0 auto 2.5rem' }}>
          <p
            className="text-[9px] font-black tracking-widest uppercase mb-3"
            style={{ color: '#AAAAAA' }}
          >
            How it works
          </p>
          <h2
            className="text-2xl md:text-3xl font-black tracking-tight mb-4"
            style={{ color: '#000000' }}
          >
            From data to report in minutes
          </h2>
          <p className="text-xs md:text-sm font-medium opacity-40 px-4" style={{ color: '#000000' }}>
            No engineers. No spreadsheets. No manual busywork.
          </p>
        </div>

        {/* Steps */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid md:grid-cols-3 gap-5"
        >
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center gap-3 relative">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 z-10 shadow-lg"
                    style={{ background: '#000000', color: '#FFFFFF' }}
                  >
                    {step.number}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className="hidden md:block absolute left-10 right-0 h-px top-1/2 -translate-y-1/2"
                      style={{ background: '#F0F0F0' }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Icon size={14} color="#000000" strokeWidth={2.5} />
                    <h3 className="font-bold text-sm tracking-tight" style={{ color: '#000000' }}>
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed opacity-50" style={{ color: '#000000' }}>
                    {step.body}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
