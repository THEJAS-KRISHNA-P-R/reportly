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
      className="marketing-section"
      style={{ background: '#F8F8F8' }}
    >
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16" style={{ maxWidth: 640, margin: '0 auto 4rem' }}>
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: '#777777' }}
          >
            How it works
          </p>
          <h2
            className="text-4xl md:text-5xl font-semibold tracking-tight mb-5"
            style={{ color: '#000000' }}
          >
            From raw data to client-ready report in&nbsp;minutes
          </h2>
          <p className="text-lg" style={{ color: '#555555' }}>
            No engineers. No spreadsheets. No 3am scrambles before the monthly call.
          </p>
        </div>

        {/* Steps */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid md:grid-cols-3 gap-8"
        >
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                className="flex flex-col gap-6"
              >
                {/* Step number + connector line */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0"
                    style={{ background: '#000000', color: '#FFFFFF' }}
                  >
                    {step.number}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className="hidden md:block flex-1 h-px"
                      style={{ background: '#E5E5E5' }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} color="#000000" />
                    <h3 className="font-semibold text-base" style={{ color: '#000000' }}>
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#666666' }}>
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
