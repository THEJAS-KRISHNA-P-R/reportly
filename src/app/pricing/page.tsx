import type { Metadata } from 'next';
import { MarketingNav } from '@/components/marketing/nav';
import { Pricing }      from '@/components/marketing/pricing';
import { Footer }       from '@/components/marketing/footer';

export const metadata: Metadata = {
  title: 'Pricing — Reportly',
  description:
    'Simple, transparent pricing for digital agencies. Start free with 1 client and 2 reports per month.',
};

export default function PricingPage() {
  return (
    <>
      <MarketingNav />
      <main style={{ paddingTop: 112 }}>
        <Pricing />

        {/* FAQ */}
        <section className="marketing-section" style={{ background: '#FFFFFF' }}>
          <div className="marketing-content-shell" style={{ maxWidth: 760, margin: '0 auto' }}>
            <h2 className="text-2xl font-semibold tracking-tight mb-8" style={{ color: '#000000' }}>
              Frequently asked questions
            </h2>
            {[
              {
                q: 'Can I change plans at any time?',
                a: 'Yes. Upgrades are immediate. Downgrades take effect at the end of your billing cycle.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major Indian credit/debit cards, net banking, and UPI via Razorpay.',
              },
              {
                q: 'Is my client\'s data safe?',
                a: 'Reportly applies encrypted transport, access scoping, and account-level isolation controls. Final security posture also depends on your connected providers and internal access policies.',
              },
              {
                q: 'Can I white-label completely?',
                a: 'Yes. Your agency name and logo appear on every report. The "Powered by Reportly" badge can be hidden on Pro and Agency plans.',
              },
            ].map((faq) => (
              <details key={faq.q} className="py-5" style={{ borderBottom: '1px solid #E5E5E5' }}>
                <summary
                  className="text-base font-medium cursor-pointer list-none flex justify-between items-center"
                  style={{ color: '#000000' }}
                >
                  {faq.q}
                  <span style={{ color: '#777777' }}>+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: '#666666' }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
