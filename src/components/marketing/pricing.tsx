'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    description: 'Perfect to start with one client.',
    cta: 'Get started free',
    href: '/register',
    highlight: false,
    features: [
      '1 client',
      '2 reports per month',
      'GA4 integration',
      'AI narrative',
      'White-label PDF',
      'Email delivery',
      '30-day audit log',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 2999, annual: 2399 },
    description: 'For growing agencies with multiple clients.',
    cta: 'Start 14-day trial',
    href: '/register?plan=pro',
    highlight: true,
    features: [
      '5 clients',
      'Unlimited reports',
      'GA4 + Meta Ads',
      'AI narrative + custom prompt',
      'Full white-label branding',
      'Priority email delivery',
      '1-year audit log',
      'Slack notifications',
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    price: { monthly: 7999, annual: 6399 },
    description: 'For large agencies and resellers.',
    cta: 'Contact sales',
    href: '/about#contact',
    highlight: false,
    features: [
      'Unlimited clients',
      'Unlimited reports',
      'All integrations',
      'Custom AI instructions per client',
      'Sub-agency white-labeling',
      'Dedicated support',
      'Custom contracts',
      'SSO / SAML',
    ],
  },
];

function formatPrice(amount: number) {
  if (amount === 0) return 'Free';
  return `\u20b9${(amount).toLocaleString('en-IN')}`;
}

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="marketing-section" style={{ background: '#F8F8F8' }}>
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12" style={{ maxWidth: 560, margin: '0 auto 3rem' }}>
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#777777' }}>
            Pricing
          </p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-5" style={{ color: '#000000' }}>
            Simple, transparent pricing
          </h2>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className="text-sm" style={{ color: annual ? '#AAAAAA' : '#000000' }}>Monthly</span>
            <button
              onClick={() => setAnnual((v) => !v)}
              className="relative w-11 h-6 rounded-full transition-colors"
              style={{ background: annual ? '#000000' : '#CCCCCC' }}
              aria-label="Toggle annual billing"
            >
              <span
                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                style={{ left: 4, transform: annual ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
            <span className="text-sm flex items-center gap-1.5" style={{ color: annual ? '#000000' : '#AAAAAA' }}>
              Annual
              <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ background: '#000000', color: '#FFFFFF' }}>
                20% off
              </span>
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const price = annual ? plan.price.annual : plan.price.monthly;
            return (
              <div
                key={plan.id}
                className="rounded-2xl p-8 flex flex-col gap-6"
                style={{
                  background:   plan.highlight ? '#000000' : '#FFFFFF',
                  border:       plan.highlight ? 'none' : '1px solid #E5E5E5',
                }}
              >
                <div>
                  <p
                    className="text-xs font-semibold tracking-widest uppercase mb-3"
                    style={{ color: plan.highlight ? 'rgba(255,255,255,0.45)' : '#777777' }}
                  >
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span
                      className="text-4xl font-bold tracking-tight"
                      style={{ color: plan.highlight ? '#FFFFFF' : '#000000' }}
                    >
                      {formatPrice(price)}
                    </span>
                    {price > 0 && (
                      <span
                        className="text-sm"
                        style={{ color: plan.highlight ? 'rgba(255,255,255,0.45)' : '#999999' }}
                      >
                        /mo
                      </span>
                    )}
                  </div>
                  <p
                    className="text-sm"
                    style={{ color: plan.highlight ? 'rgba(255,255,255,0.55)' : '#666666' }}
                  >
                    {plan.description}
                  </p>
                </div>

                <Link
                  href={plan.href}
                  className="block text-center text-sm font-medium py-2.5 rounded-xl transition-opacity hover:opacity-80"
                  style={{
                    background: plan.highlight ? '#FFFFFF' : '#000000',
                    color:      plan.highlight ? '#000000' : '#FFFFFF',
                  }}
                >
                  {plan.cta}
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <Check
                        size={14}
                        style={{ color: plan.highlight ? '#FFFFFF' : '#000000', flexShrink: 0 }}
                      />
                      <span style={{ color: plan.highlight ? 'rgba(255,255,255,0.70)' : '#444444' }}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
