import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingNav } from '@/components/marketing/nav';
import { Problem } from '@/components/marketing/problem';
import { Footer } from '@/components/marketing/footer';

export const metadata: Metadata = {
  title: 'Problem — Reportly',
  description: 'See why manual agency reporting causes costly delays and client churn.',
};

export default function ProblemPage() {
  return (
    <>
      <MarketingNav />
      <main className="bg-white pt-[112px] pb-24">
        <Problem />

        <section className="marketing-section pb-16" style={{ background: '#FFFFFF' }}>
          <div className="mx-auto w-full max-w-5xl px-6 md:px-[100px]">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: 'Operational drag',
                  body: 'Manual extraction, formatting, and QA creates recurring workload that compounds with each new client account.',
                },
                {
                  title: 'Delivery risk',
                  body: 'Human-heavy workflows increase the odds of wrong periods, wrong metrics, or missed send windows.',
                },
                {
                  title: 'Trust erosion',
                  body: 'Inconsistent narratives and unexplained metric shifts can undermine client confidence over time.',
                },
              ].map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="text-lg font-black tracking-tight" style={{ color: '#000000' }}>{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed font-medium" style={{ color: '#444444' }}>{item.body}</p>
                </article>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Accuracy note</p>
              <p className="mt-1">
                Time-loss and error-impact examples on this page are directional and can vary by team size, review policy,
                and reporting cadence.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/how-it-works" className="inline-flex items-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                See how Reportly works
              </Link>
              <Link href="/pricing" className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                View pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
