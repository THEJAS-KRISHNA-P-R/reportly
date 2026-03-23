'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Check, ShieldCheck, Download } from 'lucide-react';
import { toast } from 'sonner';
import Script from 'next/script';

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [agency, setAgency] = useState<any>(null);

  useEffect(() => {
    async function fetchAgency() {
      try {
        const res = await fetch('/api/agencies/me');
        if (res.ok) setAgency(await res.json());
      } catch (err) {
        toast.error('Failed to load billing info');
      } finally {
        setLoading(false);
      }
    }
    fetchAgency();
  }, []);

  const handleUpgrade = async (planId: string, price: number) => {
    setProcessing(true);
    try {
      // Create order
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId, amount: price })
      });
      
      const order = await res.json();
      if (!order.id) throw new Error('Order creation failed');

      // Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Reportly',
        description: `Upgrade to ${planId.toUpperCase()} Plan`,
        order_id: order.id,
        handler: async function (response: any) {
          // Verify
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
        theme: {
          color: '#000000'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
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
    },
    {
      id: 'pro',
      name: 'Professional',
      price: 2999,
      limits: '25 Reports / month',
      features: ['5 Client Spaces', 'TipTap AI Editor', 'Priority Support', 'Remove Powered By'],
    },
    {
      id: 'agency',
      name: 'Agency Scale',
      price: 7999,
      limits: '150 Reports / month',
      features: ['Unlimited Clients', 'Full White-labeling', 'API Access', 'Dedicated Account Manager'],
    }
  ];

  if (loading) return <div className="p-8 text-sm text-gray-500">Loading billing...</div>;

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 lg:px-10">
      {/* Load Razorpay SDK */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="mb-14">
        <h2 className="text-4xl font-bold tracking-tight text-slate-900">Infrastructure & Scale</h2>
        <p className="text-[15px] font-medium text-slate-500 mt-2 max-w-2xl">
          Manage your agency's operational capacity, billing intelligence, and scaling trajectory.
        </p>
      </div>

      {/* Current Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm group">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 px-1">Current Protocol</p>
          <div className="flex flex-col gap-6">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">{currentPlan} EDITION</h3>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] font-bold tracking-wider bg-emerald-50 text-emerald-600 self-start border border-emerald-100">
              <ShieldCheck size={14} /> ACTIVE NODE
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 px-1">Intelligence Usage</p>
          <div className="flex flex-col gap-6">
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-bold tracking-tight text-slate-900">{agency?.reports_generated_this_month || 0}</h3>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">/ {agency?.plan_report_limit || 2} REPORTS</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-slate-900 rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min(((agency?.reports_generated_this_month || 0) / (agency?.plan_report_limit || 2)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-3xl shadow-lg flex flex-col justify-between group overflow-hidden relative border border-slate-800">
           <div className="relative z-10">
             <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-6 px-1">Funding Source</p>
             <div className="flex items-center gap-4 text-white">
               <CreditCard size={20} className="text-slate-500" />
               <span className="text-[13px] font-bold uppercase tracking-wider text-slate-400 italic">No Card Encrypted</span>
             </div>
           </div>
           <button className="text-[12px] font-bold uppercase tracking-wider text-white hover:text-indigo-400 transition-colors mt-8 relative z-10 text-left">
             Authorize Payment Method →
           </button>
        </div>
      </div>

      {/* Pricing grid */}
      <div className="flex items-center justify-between mb-10 px-4">
        <h2 className="text-2xl font-black tracking-tighter text-black">Scaling Tiers</h2>
        <div className="h-[2px] flex-1 mx-8 bg-gray-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
        {plans.map(plan => {
          const isCurrent = currentPlan === plan.id;
          const isPro = plan.id === 'pro';
          
          return (
            <div 
              key={plan.id}
              className={`relative rounded-[3rem] p-12 flex flex-col transition-all duration-500 hover:-translate-y-2 group ${
                isCurrent 
                  ? 'bg-gray-50 ring-4 ring-black shadow-2xl' 
                  : isPro 
                    ? 'bg-black text-white shadow-[0_40px_100px_rgba(0,0,0,0.1)]' 
                    : 'bg-white shadow-[0_20px_60px_rgba(0,0,0,0.03)]'
              }`}
            >
              {isPro && !isCurrent && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider shadow-lg">Most Popular</div>
              )}
              
              <h3 className={`text-2xl font-bold tracking-tight mb-4 ${isCurrent ? 'text-slate-900' : isPro ? 'text-white' : 'text-slate-900'}`}>
                {plan.name}
              </h3>
              
              <div className="flex items-baseline gap-2 mb-10">
                <span className="text-4xl font-black tracking-tighter">₹{plan.price.toLocaleString()}</span>
                <span className={`text-xs font-black uppercase tracking-widest opacity-40`}>/ month</span>
              </div>
              
              <div className="space-y-4 mb-12 flex-1">
                <div className={`flex items-start gap-3 text-xs font-black uppercase tracking-widest ${isPro && !isCurrent ? 'text-white' : 'text-black'}`}>
                  <Check size={16} strokeWidth={4} className="shrink-0 text-green-500" />
                  {plan.limits}
                </div>
                {plan.features.map(f => (
                  <div key={f} className={`flex items-start gap-3 text-xs font-bold ${isPro && !isCurrent ? 'text-white/60' : 'text-gray-400'}`}>
                    <Check size={16} strokeWidth={2} className="shrink-0 opacity-40" />
                    {f}
                  </div>
                ))}
              </div>

              <button
                disabled={isCurrent || processing}
                onClick={() => handleUpgrade(plan.id, plan.price)}
                className={`w-full h-12 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all active:scale-[0.98] ${
                  isCurrent 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : isPro
                      ? 'bg-white text-slate-900 shadow-sm hover:bg-slate-50'
                      : 'bg-slate-900 text-white shadow-sm hover:bg-slate-800'
                }`}
              >
                {isCurrent ? 'Active Tier' : `Deploy ${plan.id}`}
              </button>
            </div>
          )
        })}
      </div>

      {/* Transaction History */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 px-10 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Transaction Record</h3>
        </div>
        <div className="p-20 text-center">
           <p className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">Vault is Currently Empty</p>
        </div>
      </div>
    </div>
  );
}
