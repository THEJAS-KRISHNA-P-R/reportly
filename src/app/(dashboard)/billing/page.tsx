'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Check, ShieldCheck, Zap, Crown, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';
import Script from 'next/script';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [agency, setAgency] = useState<any>(null);

  useEffect(() => {
    async function fetchAgency() {
      try {
        const res = await fetch('/api/agencies/me');
        if (res.ok) {
          const data = await res.json();
          setAgency(data);
        }
      } catch {
        toast.error('Failed to load billing info');
      } finally {
        setLoading(false);
      }
    }
    fetchAgency();
  }, []);

  const handleUpgrade = async (planId: string, price: number) => {
    // ... logic remains same ...
    setProcessing(true);
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId, amount: price })
      });
      
      const order = await res.json();
      if (!order.id) throw new Error('Order creation failed');

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Reportly',
        description: `Upgrade to ${planId.toUpperCase()} Plan`,
        order_id: order.id,
        handler: async function (response: any) {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: planId
            })
          });
          
          if (verifyRes.ok) {
            toast.success(`Successfully upgraded to ${planId.toUpperCase()}`);
            window.location.reload();
          } else {
            toast.error('Payment verification failed');
          }
        },
        theme: { color: '#4F46E5' }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch {
      toast.error('Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const currentPlan = agency?.plan || 'free';

  const plans = [
    {
      id: 'free',
      name: 'Free Starter',
      price: 0,
      limits: '2 Reports / month',
      features: ['1 Client Space', 'Core GA4 + Meta sync', 'Standard Support'],
      icon: Zap
    },
    {
      id: 'pro',
      name: 'Professional',
      price: 2999,
      limits: '25 Reports / month',
      features: ['5 Client Spaces', 'TipTap AI Editor', 'Priority Support', 'Remove Powered By'],
      icon: Crown
    },
    {
      id: 'agency',
      name: 'Agency Scale',
      price: 7999,
      limits: '150 Reports / month',
      features: ['Unlimited Clients', 'Full White-labeling', 'API Access', 'Account Manager'],
      icon: ShieldCheck
    }
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
           <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400 animate-pulse">Synchronizing Billing Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Infrastructure & Scale</h1>
        <p className="text-sm text-slate-500">Manage your agency's operational capacity and billing records.</p>
      </div>

      {/* Usage Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Current Protocol</p>
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 border-b-2 border-indigo-500 pb-1">{currentPlan.toUpperCase()} Edition</h3>
           </div>
           <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
             <ShieldCheck size={12} className="mr-1" /> Active Node
           </Badge>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Intelligence Usage</p>
          <div className="flex items-baseline gap-2 mb-4">
             <span className="text-3xl font-bold text-slate-900">{agency?.reports_generated_this_month || 0}</span>
             <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">/ {agency?.plan_report_limit || 2} Unit Limit</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${Math.min(((agency?.reports_generated_this_month || 0) / (agency?.plan_report_limit || 2)) * 100, 100)}%` }}
               transition={{ duration: 1, ease: 'easeOut' }}
               className="h-full bg-slate-900 rounded-full" 
             />
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 text-white flex flex-col justify-between">
           <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Funding Source</p>
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-slate-800 rounded-lg">
                    <CreditCard size={16} className="text-slate-400" />
                 </div>
                 <span className="text-[13px] font-bold tracking-tight text-slate-400 italic">Vault Encrypted</span>
              </div>
           </div>
           <button className="text-[12px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors mt-4 text-left">
             Update Payment Details →
           </button>
        </div>
      </div>

      {/* Scaling Tiers */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-slate-900">Scaling Tiers</h2>
          <div className="h-px flex-1 bg-slate-100" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const PlanIcon = plan.icon;
            
            return (
              <div 
                key={plan.id}
                className={`relative p-8 rounded-2xl border transition-all duration-300 flex flex-col ${
                  isCurrent 
                    ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600 shadow-lg' 
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {plan.id === 'pro' && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-indigo-600 hover:bg-indigo-600">Bestseller</Badge>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6">
                   <div className={`p-2 rounded-xl ${isCurrent ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                      <PlanIcon size={20} />
                   </div>
                   <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                </div>

                <div className="mb-6">
                   <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-slate-900">₹{plan.price.toLocaleString()}</span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">/mo</span>
                   </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="text-[13px] font-bold text-slate-900">{plan.limits}</span>
                  </li>
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-3">
                      <Check size={16} className="text-slate-300 shrink-0 mt-0.5" />
                      <span className="text-[13px] font-medium text-slate-600">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={isCurrent || processing}
                  onClick={() => handleUpgrade(plan.id, plan.price)}
                  className={`w-full h-11 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all ${
                    isCurrent 
                      ? 'bg-emerald-50 text-emerald-700 cursor-not-allowed border border-emerald-100' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isCurrent ? 'Current Protocol' : 'Deploy Node'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Logs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Transaction Records</h3>
        </div>
        <div className="p-16 text-center">
           <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100">
                 <BarChart2 size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Vault status: Empty</p>
                <p className="text-[12px] font-medium text-slate-500 mt-1">No transaction records have been localized in your current node.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
