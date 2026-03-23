import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingNav } from '@/components/marketing/nav';
import { HowItWorks } from '@/components/marketing/how-it-works';
import { Footer } from '@/components/marketing/footer';

export const metadata: Metadata = {
  title: 'How It Works — Reportly',
  description: 'Connect GA4, generate AI narratives, and send branded reports in minutes.',
};

export default function HowItWorksPage() {
  return (
    <>
      <MarketingNav />
      <main style={{ paddingTop: 112 }}>
        <HowItWorks />

        <section className="marketing-section pb-16" style={{ background: '#FDFDFD' }}>
          <div className="marketing-content-shell">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Execution flow by phase</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {[
                  ['Ingest', 'Connect data sources and fetch period-scoped metrics.'],
                  ['Validate', 'Run consistency checks and anomaly guards before drafting.'],
                  ['Compose', 'Generate a first-pass narrative from validated metrics.'],
                  ['Review', 'Analyst edits, approves, and controls final delivery.'],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</p>
                    <p className="mt-1 text-sm text-slate-700">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Dependency and compliance note</p>
              <p className="mt-1">
                Delivery speed and output quality depend on source account permissions, API availability,
                and analyst review settings. Teams remain responsible for final factual verification before sending.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/features" className="inline-flex items-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Explore feature details
              </Link>
              <Link href="/problem" className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Back to core problems
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
