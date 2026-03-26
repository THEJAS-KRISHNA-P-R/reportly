'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { ShimmerButton } from '@/components/ui/shimmer-button';

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
  const router = useRouter();

  return (
    <section id="pricing" className="marketing-section py-16" style={{ background: '#FFFFFF' }}>
      <div className="mx-auto w-full max-w-5xl px-6 md:px-[100px]">
        {/* Header */}
        <div className="text-center mb-10" style={{ maxWidth: 640, margin: '0 auto 2.5rem' }}>
          <p className="text-xs font-bold tracking-[0.25em] uppercase mb-3" style={{ color: '#94A3B8' }}>
            Investment
          </p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4" style={{ color: '#000000' }}>
            Simple, transparent pricing
          </h2>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-5 mt-8 w-full">
            <span className="text-sm font-semibold tracking-tight" style={{ color: '#0F172A' }}>Monthly Billing</span>
            <button
              onClick={() => setAnnual((v) => !v)}
              className="relative w-12 h-7 rounded-full transition-all duration-300 hover:scale-105 shadow-lg shadow-black/5"
              style={{ background: annual ? '#000000' : '#EAEAEA' }}
              aria-label="Toggle annual billing"
            >
              <span
                className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-md"
                style={{ left: 4, transform: annual ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
            <span className="text-sm font-semibold tracking-tight flex items-center gap-3" style={{ color: annual ? '#0F172A' : '#94A3B8' }}>
              Annual Billing
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm" style={{ background: '#0F172A', color: '#FFFFFF' }}>
                -20%
              </span>
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid lg:grid-cols-3 gap-4 items-start max-w-5xl mx-auto">
          {plans.map((plan) => {
            const price = annual ? plan.price.annual : plan.price.monthly;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-5 md:p-6 flex flex-col gap-5 transition-all duration-500 hover:-translate-y-1 ${
                  plan.highlight ? 'shadow-[0_20px_40px_rgba(0,0,0,0.1)] z-10 border border-slate-800' : 'shadow-none border border-black/5'
                }`}
                style={{
                  background:   plan.highlight ? '#000000' : '#FDFDFD',
                }}
              >
                <div className="flex flex-col gap-2.5">
                  <p
                    className="text-xs font-bold tracking-[0.16em] uppercase opacity-60 shrink-0"
                    style={{ color: plan.highlight ? 'rgba(255,255,255,0.4)' : '#000000' }}
                  >
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-3xl md:text-[2.3rem] font-black tracking-tight"
                      style={{ color: plan.highlight ? '#FFFFFF' : '#000000' }}
                    >
                      {formatPrice(price)}
                    </span>
                    {price > 0 && (
                      <span
                        className="text-xs font-semibold opacity-50 uppercase tracking-wider"
                        style={{ color: plan.highlight ? '#FFFFFF' : '#000000' }}
                      >
                        /mo
                      </span>
                    )}
                  </div>
                  <p
                    className="text-sm font-medium leading-relaxed"
                    style={{ color: plan.highlight ? 'rgba(255,255,255,0.5)' : '#666666' }}
                  >
                    {plan.description}
                  </p>
                </div>

                {plan.highlight ? (
                  <ShimmerButton
                    onClick={() => router.push(plan.href)}
                    className="w-full text-center text-sm font-bold py-3.5 shadow-xl"
                    background="rgba(3,8,20,0.96)"
                    shimmerColor="#93c5fd"
                    shimmerDuration="2.2s"
                    textColor="#ffffff"
                  >
                    {plan.cta}
                  </ShimmerButton>
                ) : (
                  <Link
                    href={plan.href}
                    className="block text-center text-sm font-bold py-3.5 rounded-full transition-all hover:scale-[1.01] active:scale-[0.98] shadow-xl"
                    style={{
                      background: '#000000',
                      color: '#FFFFFF',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }}
                  >
                    {plan.cta}
                  </Link>
                )}

                <ul className="space-y-4 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm font-semibold">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.highlight ? 'bg-white/10' : 'bg-black/5'}`}>
                        <Check
                          size={12}
                          strokeWidth={3}
                          style={{ color: plan.highlight ? '#FFFFFF' : '#000000' }}
                        />
                      </div>
                      <span style={{ color: plan.highlight ? 'rgba(255,255,255,0.8)' : '#000000' }}>
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
