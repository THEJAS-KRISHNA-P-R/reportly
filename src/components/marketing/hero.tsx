'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { BeamsDynamic } from '@/components/ui/beams-dynamic';
import { stagger, blurFadeWord } from '@/lib/animations';

const headline = 'Your clients deserve reports that look as good as the results.';
const words = headline.split(' ');

const stats = [
  { value: 'No credit card', label: 'required' },
  { value: 'Free tier',      label: 'included' },
  { value: '10-minute',      label: 'setup time' },
];

export function Hero() {
  return (
    <section
      className="relative flex flex-col items-center justify-center text-center overflow-hidden"
      style={{
        background: '#000000',
        minHeight: '100dvh',
        paddingTop: 100,
        paddingBottom: 80,
      }}
    >
      {/* Beams background */}
      <BeamsDynamic
        beamNumber={14}
        beamWidth={2}
        beamHeight={18}
        lightColor="#ffffff"
        speed={1.5}
        noiseIntensity={1.6}
        scale={0.16}
        rotation={20}
      />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, rgba(0,0,0,0.85) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 inset-x-0 pointer-events-none"
        style={{
          height: '30%',
          background: 'linear-gradient(to bottom, transparent, #000000)',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative container flex flex-col items-center gap-8 max-w-4xl">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-xs font-medium tracking-widest uppercase px-4 py-1.5 rounded-full"
          style={{
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          Automated Marketing Reports for Agencies
        </motion.div>

        {/* Headline — word by word blur fade */}
        <motion.h1
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-tight"
          style={{ color: '#FFFFFF' }}
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              variants={blurFadeWord}
              className="inline-block mr-[0.25em]"
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="text-lg md:text-xl max-w-2xl"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          Pull GA4 data, generate AI-written narratives, and send
          white-labeled PDF reports to your clients — automatically,
          every month.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.15 }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <Link
            href="/register"
            className="flex items-center gap-2 font-medium px-6 py-3 rounded-xl text-sm transition-opacity hover:opacity-85"
            style={{ background: '#FFFFFF', color: '#000000' }}
          >
            Start free — no credit card
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm px-6 py-3 rounded-xl transition-opacity hover:opacity-70"
            style={{
              border: '1px solid rgba(255,255,255,0.18)',
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            See how it works
          </Link>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.3 }}
          className="flex items-center gap-6 flex-wrap justify-center"
        >
          {stats.map((s, i) => (
            <span
              key={i}
              className="text-xs flex items-center gap-1.5"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              {i > 0 && (
                <span
                  className="w-1 h-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.20)' }}
                />
              )}
              <span style={{ color: 'rgba(255,255,255,0.65)' }}>
                {s.value}
              </span>{' '}
              {s.label}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ color: 'rgba(255,255,255,0.25)' }}
        aria-hidden="true"
      >
        <div
          className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5"
          style={{ borderColor: 'rgba(255,255,255,0.15)' }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1 h-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.35)' }}
          />
        </div>
        <span className="text-xs tracking-widest uppercase">scroll</span>
      </motion.div>
    </section>
  );
}
