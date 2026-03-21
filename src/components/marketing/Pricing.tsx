'use client';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const plans = [
  {
    name:     'Starter',
    monthly:  1499,
    annual:   1199,
    clients:  'Up to 5 clients',
    featured: false,
    features: [
      'Google Analytics integration',
      'AI-written narratives',
      'Branded PDF reports',
      'Automated email delivery',
      'Full audit trail',
    ],
  },
  {
    name:     'Growth',
    monthly:  3499,
    annual:   2799,
    clients:  'Up to 15 clients',
    featured: true,
    features: [
      'Everything in Starter',
      'Priority report queue',
      'Custom brand color',
      'Logo on reports',
      'Priority support',
    ],
  },
  {
    name:     'Agency Pro',
    monthly:  6999,
    annual:   5599,
    clients:  'Up to 40 clients',
    featured: false,
    features: [
      'Everything in Growth',
      'White-label reports',
      'Multiple team members',
      'API access',
      'Dedicated support',
    ],
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 px-6 bg-[var(--bg-surface)]">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px flex-1 max-w-12 bg-[var(--accent)]/30" />
          <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--accent)]">Pricing</span>
          <div className="h-px flex-1 max-w-12 bg-[var(--accent)]/30" />
        </div>
        <h2 className="text-[30px] md:text-[36px] font-semibold text-[var(--text-primary)] text-center tracking-[-0.02em] mb-3">
          Simple, honest pricing
        </h2>
        <p className="text-[16px] text-[var(--text-secondary)] text-center mb-8">
          No hidden fees. No per-report charges. Cancel anytime.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={cn('text-[14px]', !annual ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]')}>
            Monthly
          </span>
          <button
            id="pricing-toggle"
            onClick={() => setAnnual(a => !a)}
            className={cn(
              'relative w-10 h-5 rounded-full transition-colors duration-[200ms] ease-[ease] focus:outline-none focus:shadow-[var(--shadow-focus)]',
              annual ? 'bg-[var(--accent)]' : 'bg-[var(--border-strong)]',
            )}
            aria-label="Toggle annual billing"
          >
            <div className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-[200ms] ease-[ease]',
              annual ? 'translate-x-5' : 'translate-x-0.5',
            )} />
          </button>
          <span className={cn('text-[14px]', annual ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]')}>
            Annual
            <span className="ml-1.5 text-[11px] font-medium text-[var(--success)] bg-[var(--success-bg)] px-1.5 py-0.5 rounded-full">
              Save 20%
            </span>
          </span>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={cn(
                'bg-[var(--bg-primary)] rounded-[var(--radius-xl)] border p-7 flex flex-col transition-shadow duration-[200ms] ease-[ease]',
                plan.featured
                  ? 'border-[var(--accent)] shadow-[var(--shadow-lg)] scale-[1.02]'
                  : 'border-[var(--border)] hover:shadow-[var(--shadow-hover)]',
              )}
            >
              {plan.featured && (
                <div className="inline-flex mb-4">
                  <span className="text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/30">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-[17px] font-semibold text-[var(--text-primary)] mb-1">{plan.name}</h3>
              <p className="text-[13px] text-[var(--text-muted)] mb-5">{plan.clients}</p>
              <div className="mb-6">
                <span className="text-[40px] font-semibold text-[var(--text-primary)] tracking-tight">
                  ₹{annual ? plan.annual.toLocaleString() : plan.monthly.toLocaleString()}
                </span>
                <span className="text-[14px] text-[var(--text-muted)]">/month</span>
                {annual && (
                  <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                    Billed ₹{(plan.annual * 12).toLocaleString()}/year
                  </p>
                )}
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-[14px] text-[var(--text-secondary)]">
                    <Check size={14} className="text-[var(--success)] mt-0.5 shrink-0" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block">
                <Button
                  variant={plan.featured ? 'primary' : 'secondary'}
                  className="w-full"
                >
                  Start free trial
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-[13px] text-[var(--text-muted)] mt-8">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}
