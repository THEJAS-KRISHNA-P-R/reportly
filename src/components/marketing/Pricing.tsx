'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '@/lib/animations';

const plans = [
  {
    name: 'Starter',
    desc: 'For freelancers and tiny agencies just getting started.',
    priceMonthly: 0,
    priceAnnual: 0,
    features: [
      'Up to 3 active clients',
      'Google Analytics 4 integration',
      'Basic AI narrative generation',
      'Standard PDF template'
    ],
    cta: 'Start for free',
    popular: false
  },
  {
    name: 'Growth',
    desc: 'For agencies ready to automate their reporting entirely.',
    priceMonthly: 79,
    priceAnnual: 65,
    features: [
      'Up to 15 active clients',
      'Everything in Starter',
      'Advanced narrative editing',
      'White-labeled PDF (your logo)',
      'Automated email delivery'
    ],
    cta: 'Start 14-day trial',
    popular: true
  },
  {
    name: 'Scale',
    desc: 'For high-volume teams managing dozens of accounts.',
    priceMonthly: 199,
    priceAnnual: 165,
    features: [
      'Unlimited clients',
      'Everything in Growth',
      'Custom fonts and brand styling',
      'Client approval portal',
      'API access & priority support'
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 sm:py-32 bg-surface">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        
        <div className="text-center max-w-[600px] mx-auto mb-16">
          <h2 className="text-[32px] sm:text-[40px] font-bold tracking-[-0.02em] text-foreground mb-4">
            Simple, transparent pricing.
          </h2>
          <p className="text-[17px] text-muted-foreground mb-10">
            Start for free. Upgrade when you're saving more billable hours than the platform costs.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Label htmlFor="pricing-toggle" className={`text-sm ${!isAnnual ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
              Pay monthly
            </Label>
            <Switch
              id="pricing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <Label htmlFor="pricing-toggle" className={`flex items-center gap-2 text-sm ${isAnnual ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
              Pay annually
              <span className="inline-block px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold uppercase tracking-wider">
                Save 20%
              </span>
            </Label>
          </div>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-[1000px] mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          variants={staggerContainer}
        >
          {plans.map((plan) => (
            <motion.div 
              key={plan.name}
              variants={fadeUp}
              className={`relative flex flex-col p-8 rounded-2xl border ${
                plan.popular 
                  ? 'bg-background border-primary shadow-[0_8px_32px_rgba(193,123,47,0.12)] z-10 scale-100 md:scale-105' 
                  : 'bg-background border-border shadow-sm'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
                  Most Popular
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-[20px] font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed h-[42px]">{plan.desc}</p>
              </div>

              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-[40px] font-bold tracking-tight text-foreground">
                  ${isAnnual ? plan.priceAnnual : plan.priceMonthly}
                </span>
                {plan.priceMonthly > 0 && (
                  <span className="text-[14px] text-muted-foreground">/mo</span>
                )}
              </div>

              <Button 
                variant={plan.popular ? "default" : "outline"}
                size="lg"
                className="w-full mb-8 font-semibold"
              >
                {plan.cta}
              </Button>

              <div className="flex-1">
                <p className="text-[12px] font-bold uppercase tracking-widest text-foreground mb-4">
                  What's included
                </p>
                <ul className="space-y-4">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-[14px] text-muted-foreground">
                      <Check size={16} className="text-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
