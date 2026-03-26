'use client';

import { CountUp } from '@/components/ui/count-up';

const statsData = [
  { end: 90, suffix: '+', label: 'Hours saved', sublabel: 'per agency per year' },
  { end: 3, suffix: ' min', label: 'To generate', sublabel: 'a full report' },
  { end: 100, suffix: '%', label: 'Human reviewed', sublabel: 'before delivery' },
];

export function Stats() {
  return (
    <section
      className="marketing-section py-12"
      style={{ background: '#000000' }}
    >
      <div className="mx-auto w-full max-w-5xl px-6 md:px-[100px]">
        <p
          className="text-center text-[8px] font-black tracking-widest uppercase mb-8"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          By the numbers
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 md:divide-x"
          style={{ '--divide-color': 'rgba(255,255,255,0.05)' } as React.CSSProperties}
        >
          {statsData.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center px-4 py-1.5 gap-1"
            >
              <p
                className="text-2xl md:text-3xl font-black tracking-tight"
                style={{ color: '#FFFFFF' }}
              >
                <CountUp end={s.end} suffix={s.suffix} duration={1800} />
              </p>
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {s.label}
              </p>
              <p className="text-[9px] font-medium opacity-20" style={{ color: '#FFFFFF' }}>
                {s.sublabel}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
