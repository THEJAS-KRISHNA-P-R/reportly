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
    <div className="max-w-4xl mx-auto py-8">
      {/* Load Razorpay SDK */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#000000' }}>Billing & Plans</h1>
        <p className="text-sm mt-1" style={{ color: '#666666' }}>
          Manage your subscription, view payment history, and upgrade your limits.
        </p>
      </div>

      {/* Current Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="rounded-xl border p-6" style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}>
          <p className="text-sm font-medium" style={{ color: '#666666' }}>Current Plan</p>
          <div className="flex items-end gap-2 mt-2">
            <h3 className="text-2xl font-bold uppercase tracking-tight" style={{ color: '#000000' }}>{currentPlan}</h3>
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded border border-green-200">
            <ShieldCheck size={14} /> Active
          </div>
        </div>

        <div className="rounded-xl border p-6" style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}>
          <p className="text-sm font-medium" style={{ color: '#666666' }}>Report Usage</p>
          <div className="mt-2 flex items-baseline gap-1">
            <h3 className="text-2xl font-bold" style={{ color: '#000000' }}>{agency?.reports_generated_this_month || 0}</h3>
            <span className="text-sm font-medium" style={{ color: '#666666' }}>/ {agency?.plan_report_limit || 2} used</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-4 overflow-hidden">
            <div 
              className="h-full bg-black rounded-full" 
              style={{ width: `${Math.min(((agency?.reports_generated_this_month || 0) / (agency?.plan_report_limit || 2)) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border p-6 flex flex-col justify-between" style={{ borderColor: '#E5E5E5', background: '#FAFAFA' }}>
           <div>
             <p className="text-sm font-medium" style={{ color: '#000000' }}>Payment Method</p>
             <div className="flex items-center gap-3 mt-4 text-sm" style={{ color: '#666666' }}>
               <CreditCard size={18} />
               <span>No card on file</span>
             </div>
           </div>
           <button className="text-sm font-medium hover:underline text-left mt-4" style={{ color: '#000000' }}>
             Add Payment Method
           </button>
        </div>
      </div>

      {/* Pricing grid */}
      <h2 className="text-lg font-semibold tracking-tight mb-6" style={{ color: '#000000' }}>Upgrade Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {plans.map(plan => {
          const isCurrent = currentPlan === plan.id;
          
          return (
            <div 
              key={plan.id}
              className={`rounded-xl border p-6 flex flex-col ${isCurrent ? 'ring-2 ring-black bg-gray-50' : 'bg-white'}`}
              style={{ borderColor: isCurrent ? '#000000' : '#E5E5E5' }}
            >
              <h3 className="font-semibold text-lg" style={{ color: '#000000' }}>{plan.name}</h3>
              <div className="mt-4 mb-6 flex items-baseline gap-1 text-black">
                <span className="text-2xl font-bold">₹{plan.price.toLocaleString()}</span>
                <span className="text-sm text-gray-500 font-medium">/mo</span>
              </div>
              
              <div className="space-y-3 mb-8 flex-1">
                <div className="flex items-start gap-2.5 text-sm font-medium text-black">
                  <Check size={16} className="mt-0.5 shrink-0" />
                  {plan.limits}
                </div>
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <Check size={16} className="mt-0.5 shrink-0 text-gray-400" />
                    {f}
                  </div>
                ))}
              </div>

              <button
                disabled={isCurrent || processing}
                onClick={() => handleUpgrade(plan.id, plan.price)}
                className={`w-full h-10 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-transparent' 
                    : plan.id === 'pro'
                      ? 'bg-black text-white hover:bg-gray-900 border-transparent'
                      : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          )
        })}
      </div>

      {/* Invoice History */}
      <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: '#E5E5E5' }}>
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between" style={{ borderColor: '#E5E5E5' }}>
          <h3 className="font-semibold text-sm" style={{ color: '#000000' }}>Invoice History</h3>
        </div>
        <div className="p-12 text-center text-sm" style={{ color: '#666666' }}>
          No invoices yet.
        </div>
      </div>
    </div>
  );
}
