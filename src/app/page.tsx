import { MarketingNav } from '@/components/marketing/Nav';
import { Hero }         from '@/components/marketing/Hero';
import { HowItWorks }  from '@/components/marketing/HowItWorks';
import { Features }    from '@/components/marketing/Features';
import { Stats }       from '@/components/marketing/Stats';
import { Pricing }     from '@/components/marketing/Pricing';
import { Footer }      from '@/components/marketing/Footer';
import { Button }      from '@/components/ui/Button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <MarketingNav />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Stats />
        <Pricing />

        {/* Founder section */}
        <section id="about" className="py-24 px-6 bg-[var(--bg-primary)]">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--accent)] mb-4 block">
                  The Founder
                </span>
                <h2 className="text-[28px] md:text-[32px] font-semibold text-[var(--text-primary)] tracking-[-0.02em] leading-[1.3] mb-6">
                  Built by someone who understands the problem
                </h2>
                <p className="text-[16px] text-[var(--text-secondary)] leading-[1.7] mb-6">
                  I built Reportly because I watched agencies in Kerala spend their best hours
                  on copy-paste reporting instead of strategy. The problem was obvious.
                  The solution just needed building.
                </p>
                <p className="text-[16px] text-[var(--text-secondary)] leading-[1.7] mb-8">
                  Every feature in Reportly exists because a real agency needed it.
                  The mandatory approval step, the confidence indicators, the audit trail —
                  these aren&apos;t features, they&apos;re answers to real questions from real people.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] border border-[var(--border)]" />
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--text-primary)]">Founder, Reportly</p>
                    <p className="text-[12px] text-[var(--text-muted)] flex items-center gap-1">
                      <span>🇮🇳</span> Based in Thrissur, Kerala
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-96 rounded-[var(--radius-xl)] bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center">
                <span className="text-[13px] text-[var(--text-muted)]">Founder photo</span>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6 bg-[var(--bg-surface)]">
          <div className="max-w-[600px] mx-auto text-center">
            <h2 className="text-[30px] md:text-[36px] font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-4">
              Your next report is 3 minutes away
            </h2>
            <p className="text-[16px] text-[var(--text-secondary)] mb-8">
              Connect your Google Analytics and we&apos;ll handle the rest.
            </p>
            <Link href="/register">
              <Button variant="primary" size="lg">
                Get started free
              </Button>
            </Link>
            <p className="text-[13px] text-[var(--text-muted)] mt-4">
              No credit card · Cancel anytime · Setup in 10 minutes
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
