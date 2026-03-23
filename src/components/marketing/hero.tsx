'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BeamsDynamic } from '@/components/ui/beams-dynamic';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { stagger, blurFadeWord } from '@/lib/animations';

const headline = 'Client reports that are clear, fast, and client-ready.';
const words = headline.split(' ');

const stats = [
  { value: 'No credit card', label: 'required' },
  { value: 'Free tier',      label: 'included' },
  { value: '10-minute',      label: 'setup time' },
];

export function Hero() {
  const router = useRouter();

  return (
    <section
      className="relative flex min-h-[100dvh] flex-col items-center justify-start overflow-hidden text-center pt-28 pb-12 md:min-h-[100svh] md:justify-center md:pt-24 md:pb-14"
      style={{
        background: '#000000',
      }}
    >
      {/* Beams background */}
      <div className="absolute inset-0 z-0">
        <BeamsDynamic
          beamWidth={2}
          beamHeight={16}
          beamNumber={13}
          lightColor="#ffffff"
          speed={1.9}
          scale={0.26}
          rotation={25}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.78))]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container flex w-full max-w-4xl flex-col items-center gap-4 px-5 md:px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-[8px] font-black tracking-[0.3em] uppercase px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          Automated Marketing Reports for Agencies
        </motion.div>

        {/* Headline — word by word blur fade */}
        <motion.h1
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-balance md:text-5xl lg:text-[3.6rem]"
          style={{ color: '#FFFFFF' }}
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              variants={blurFadeWord}
              className="inline-block mr-[0.2em]"
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="max-w-2xl px-2 text-base font-medium leading-relaxed opacity-75 md:px-0"
          style={{ color: '#FFFFFF' }}
        >
          Pull GA4 data, generate AI-written narratives, and send
          white-labeled PDF reports to your clients — automatically,
          every month.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.15 }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-4"
        >
          <ShimmerButton
            onClick={() => {
              router.push('/register');
            }}
            className="px-8 py-4 text-base font-bold shadow-[0_10px_30px_rgba(59,130,246,0.22)]"
            background="rgba(3,8,20,0.96)"
            shimmerColor="#93c5fd"
            shimmerDuration="2.2s"
            textColor="#ffffff"
          >
            Start free
            <ArrowRight size={18} strokeWidth={3} />
          </ShimmerButton>
          <Link
            href="/how-it-works"
            className="text-base font-bold px-8 py-4 rounded-full transition-all hover:bg-white/10 active:scale-[0.97]"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#FFFFFF',
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

    </section>
  );
}
