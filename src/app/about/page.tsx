import type { Metadata } from 'next';
import { MarketingNav } from '@/components/marketing/nav';
import { Footer }       from '@/components/marketing/footer';

export const metadata: Metadata = {
  title: 'About — Reportly',
  description: 'We built Reportly because agency reporting was broken.',
};

export default function AboutPage() {
  return (
    <>
      <MarketingNav />
      <main style={{ paddingTop: 80 }}>
        <section className="marketing-section" style={{ background: '#FFFFFF' }}>
          <div className="container" style={{ maxWidth: 720, margin: '0 auto' }}>
            <p className="text-xs font-semibold tracking-widest uppercase mb-6" style={{ color: '#777777' }}>
              About
            </p>
            <h1 className="text-5xl font-semibold tracking-tight mb-8" style={{ color: '#000000' }}>
              We built this because we were tired of bad reports.
            </h1>
            <div className="space-y-6 text-base leading-relaxed" style={{ color: '#444444' }}>
              <p>
                Reportly was born out of frustration. Every digital agency we spoke to had the same story:
                copy-pasting numbers from GA4 into a deck, writing the same commentary every month,
                sending a report that looked like everyone else&apos;s.
              </p>
              <p>
                Clients deserve better. And agencies deserve to spend their time on strategy,
                not on reformatting spreadsheets.
              </p>
              <p>
                We&apos;re a small team building tools for India&apos;s growing digital agency ecosystem.
                Reportly is our first product, and we&apos;re building it in public.
              </p>
              <p>
                Questions? Reach us at{' '}
                <a href="mailto:hello@reportly.ai" className="underline" style={{ color: '#000000' }}>
                  hello@reportly.ai
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
