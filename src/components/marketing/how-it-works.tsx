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
      <div className="mx-auto w-full max-w-5xl px-6 md:px-[100px]">
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
                className="relative flex flex-col p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-xl transition-transform duration-300 group-hover:scale-110"
                    style={{ background: '#000000', color: '#FFFFFF' }}
                  >
                    {step.number}
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 transition-colors duration-300 group-hover:bg-slate-100">
                    <Icon size={24} className="text-slate-700" strokeWidth={2} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-3 mt-6">
                  <h3 className="font-black text-lg md:text-xl tracking-tight text-slate-900">
                    {step.title}
                  </h3>
                  <p className="text-sm md:text-base leading-relaxed font-medium text-slate-600">
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
