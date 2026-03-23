import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingNav } from '@/components/marketing/nav';
import { Features } from '@/components/marketing/features';
import { Footer } from '@/components/marketing/footer';

export const metadata: Metadata = {
  title: 'Features — Reportly',
  description: 'Explore Reportly features: validation, AI narrative generation, white-labeling, and audit logs.',
};

export default function FeaturesPage() {
  return (
    <>
      <MarketingNav />
      <main style={{ paddingTop: 112 }}>
        <Features />

        <section className="marketing-section pb-16" style={{ background: '#FFFFFF' }}>
          <div className="marketing-content-shell">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Capability map</h2>
                <p className="mt-1 text-sm text-slate-600">How core features map to common agency reporting requirements.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3 font-semibold">Requirement</th>
                      <th className="px-5 py-3 font-semibold">Reportly capability</th>
                      <th className="px-5 py-3 font-semibold">Control owner</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-slate-700">
                    {[
                      ['Metric consistency checks', 'Validation and freshness checks', 'System + analyst'],
                      ['Narrative generation', 'AI-assisted draft narrative', 'Analyst reviewer'],
                      ['Client-facing branding', 'White-label templates and outputs', 'Agency admin'],
                      ['Traceability', 'Audit events across workflow', 'Agency operations'],
                    ].map((row) => (
                      <tr key={row[0]} className="border-b border-slate-100 last:border-0">
                        <td className="px-5 py-3">{row[0]}</td>
                        <td className="px-5 py-3">{row[1]}</td>
                        <td className="px-5 py-3">{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Legal and accuracy reminder</p>
              <p className="mt-1">
                Feature descriptions reflect product intent and available controls, not guarantees of specific business outcomes.
                Final compliance with client contracts and local regulations remains with the account owner.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/pricing" className="inline-flex items-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Compare plans
              </Link>
              <Link href="/about" className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Learn about Reportly
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
