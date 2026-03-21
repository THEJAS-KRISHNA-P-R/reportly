import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Sparkles } from 'lucide-react';

const AVATAR_COLORS = ['#FAF0E4', '#F0F8F3', '#F0F4F8', '#FFF5F5'];

export function Hero() {
  return (
    <section
      id="hero"
      className="
        relative min-h-screen flex flex-col items-center justify-center
        pt-[64px] px-6 text-center overflow-hidden bg-[var(--bg-primary)]
      "
    >
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #0A0A0A 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 max-w-[720px] mx-auto flex flex-col items-center">
        {/* Announcement pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--accent)]/25 bg-[var(--accent-light)] mb-8">
          <Sparkles size={11} className="text-[var(--accent)]" />
          <span className="text-[12px] font-medium text-[var(--accent-dark)]">
            Trusted by agencies in 12+ cities
          </span>
        </div>

        {/* Headline */}
        <h1 className="
          text-[36px] md:text-[48px] lg:text-[56px]
          font-semibold leading-[1.1] tracking-[-0.03em]
          text-[var(--text-primary)] mb-6
        ">
          Your clients deserve reports{' '}
          <span className="text-[var(--accent)]">that explain themselves.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-[16px] md:text-[17px] text-[var(--text-secondary)] leading-[1.7] max-w-[540px] mb-10">
          Reportly pulls your Google Analytics data, writes the narrative,
          and delivers a branded PDF to your clients — automatically, every month.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link href="/register">
            <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} />} id="hero-cta-primary">
              Start free — no card needed
            </Button>
          </Link>
          <a
            href="#how-it-works"
            id="hero-cta-secondary"
            className="text-[15px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-[120ms] ease-[ease] flex items-center gap-1.5"
          >
            See how it works
            <span className="text-[var(--text-muted)]">↓</span>
          </a>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-3 text-[13px] text-[var(--text-muted)]">
          <div className="flex -space-x-2">
            {AVATAR_COLORS.map((bg, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-semibold"
                style={{ backgroundColor: bg, color: 'var(--accent-dark)' }}
              >
                {['A', 'M', 'K', 'R'][i]}
              </div>
            ))}
          </div>
          <span>Join 40+ agencies saving 10+ hours a month</span>
        </div>
      </div>

      {/* Dashboard mockup */}
      <div className="relative z-10 mt-16 w-full max-w-[900px] mx-auto px-6">
        <div
          className="
            w-full rounded-[var(--radius-xl)] border border-[var(--border)]
            bg-[var(--bg-surface)] overflow-hidden
            transition-transform duration-[300ms] ease-[ease]
            hover:rotate-0
          "
          style={{ transform: 'rotate(-0.5deg)', boxShadow: 'var(--shadow-hero)' }}
        >
          {/* Fake browser chrome */}
          <div className="h-9 bg-[var(--bg-surface)] border-b border-[var(--border)] flex items-center px-4 gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--error)]/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--warning)]/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--success)]/50" />
            <div className="mx-auto w-48 h-4 rounded bg-[var(--border)]" />
          </div>
          {/* Dashboard wireframe */}
          <div className="h-[400px] md:h-[460px] bg-[var(--bg-primary)] p-5 flex gap-5">
            {/* Sidebar stub */}
            <div className="w-36 shrink-0 bg-[var(--bg-surface)] rounded-[var(--radius-md)] p-3 space-y-1.5">
              {[0,1,2,3].map(i => (
                <div
                  key={i}
                  className="h-7 rounded-md flex items-center gap-2 px-2"
                  style={{ backgroundColor: i === 0 ? 'var(--accent-light)' : 'transparent' }}
                >
                  <div
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: i === 0 ? 'var(--accent)' : 'var(--border)' }}
                  />
                  <div
                    className="h-2 rounded flex-1"
                    style={{ backgroundColor: i === 0 ? 'var(--accent-light)' : 'var(--border)' }}
                  />
                </div>
              ))}
            </div>
            {/* Content stub */}
            <div className="flex-1 space-y-4 overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[0,1,2,3].map(i => (
                  <div key={i} className="h-20 rounded-[var(--radius-md)] border border-[var(--border)] p-3 space-y-1.5">
                    <div className="h-2 w-14 bg-[var(--border)] rounded" />
                    <div className="h-6 w-12 bg-[var(--bg-surface)] rounded" />
                    <div className="h-2 w-10 bg-[var(--success-bg)] rounded" />
                  </div>
                ))}
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] overflow-hidden">
                <div className="h-9 bg-[var(--bg-surface)] border-b border-[var(--border)] flex items-center px-4 gap-4">
                  {['CLIENT','PERIOD','STATUS',''].map((h, i) => (
                    <div key={i} className="h-2 rounded" style={{ width: [80,60,50,30][i], backgroundColor: 'var(--border)' }} />
                  ))}
                </div>
                {[0,1,2,3,4].map(i => (
                  <div key={i} className="flex items-center gap-4 px-4 h-10 border-b border-[var(--border)] last:border-0">
                    <div className="h-2 w-24 bg-[var(--border)] rounded" />
                    <div className="h-2 w-16 bg-[var(--border)] rounded" />
                    <div className="h-5 w-14 bg-[var(--accent-light)] rounded-full" />
                    <div className="ml-auto h-2 w-12 bg-[var(--border)] rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
