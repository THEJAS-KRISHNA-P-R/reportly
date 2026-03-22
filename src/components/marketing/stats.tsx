'use client';

import { CountUp } from '@/components/ui/count-up';

const statsData = [
  { end: 90,   suffix: '+',  label: 'Hours saved',        sublabel: 'per agency per year' },
  { end: 3,    suffix: ' min', label: 'To generate',       sublabel: 'a full report' },
  { end: 100,  suffix: '%',  label: 'Human reviewed',      sublabel: 'before delivery' },
  { end: 12,   suffix: '+',  label: 'Cities',             sublabel: 'agencies using Reportly' },
];

export function Stats() {
  return (
    <section
      className="marketing-section"
      style={{ background: '#000000' }}
    >
      <div className="container">
        <p
          className="text-center text-xs font-semibold tracking-widest uppercase mb-16"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          By the numbers
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x"
          style={{ '--divide-color': 'rgba(255,255,255,0.08)' } as React.CSSProperties}
        >
          {statsData.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center px-6 py-4 gap-2"
            >
              <p
                className="text-5xl md:text-6xl font-bold tracking-tight"
                style={{ color: '#FFFFFF' }}
              >
                <CountUp end={s.end} suffix={s.suffix} duration={1800} />
              </p>
              <p className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {s.label}
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {s.sublabel}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
