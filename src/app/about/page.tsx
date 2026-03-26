import type { Metadata } from 'next';
import Link from 'next/link';
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
      <main className="bg-white pt-[112px] pb-24">
        <section className="marketing-section">
          <div className="mx-auto w-full max-w-5xl px-6 md:px-[100px]">
            <p className="text-xs font-semibold tracking-widest uppercase mb-6" style={{ color: '#777777' }}>
              About
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-8" style={{ color: '#000000' }}>
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

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: 'Why this exists',
                  body: 'To remove repetitive reporting labor and improve consistency in client communication.',
                },
                {
                  title: 'What we optimize',
                  body: 'Speed to draft, metric traceability, and analyst control before any report is delivered.',
                },
                {
                  title: 'How we operate',
                  body: 'Practical product decisions, transparent trade-offs, and accountable human review loops.',
                },
              ].map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h2 className="text-base font-bold tracking-tight text-slate-900">{item.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/features" className="inline-flex items-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Explore features
              </Link>
              <Link href="/pricing" className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                See pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
