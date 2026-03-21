'use client';
import { motion, animate, useInView, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export function CountUp({ to, className, prefix = '', suffix = '' }: { to: number; className?: string; prefix?: string; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const unsub = rounded.on('change', (v) => setDisplayValue(v));
    return unsub;
  }, [rounded]);

  useEffect(() => {
    if (inView) {
      animate(count, to, { duration: 1.5, ease: 'easeOut' });
    }
  }, [inView, to, count]);

  return <span ref={ref} className={className}>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
}
