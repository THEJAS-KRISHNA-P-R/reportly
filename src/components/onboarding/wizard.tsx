'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Users, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Globe, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

type Step = 'agency' | 'client' | 'ga4' | 'success';

// Bright-mode input — overrides dark globals
function BrightInput({
  placeholder,
  value,
  onChange,
  required,
  className = '',
}: {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;
}) {
  return (
    <input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className={`flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all ${className}`}
    />
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('agency');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [agencyName, setAgencyName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientWebsite, setClientWebsite] = useState('');
  const [ga4PropertyId, setGa4PropertyId] = useState('');
  const [properties, setProperties] = useState<any[]>([]);
  const [fetchingProperties, setFetchingProperties] = useState(false);

  const steps = [
    { id: 'agency', label: 'Agency', icon: Building2 },
    { id: 'client', label: 'First Client', icon: Users },
    { id: 'ga4', label: 'Analytics', icon: BarChart3 },
  ];

  const handleNext = () => {
    if (step === 'agency') {
      if (!agencyName.trim()) { setError('Please name your agency to continue'); return; }
      setError(''); setStep('client');
    } else if (step === 'client') {
      if (!clientName.trim() || !clientWebsite.trim()) { setError('Client details are required'); return; }
      setError(''); onStepChange('ga4');
    }
  };

  const handleBack = () => {
    if (step === 'client') setStep('agency');
    else if (step === 'ga4') setStep('client');
    setError('');
  };

  const fetchGa4Properties = async () => {
    setFetchingProperties(true);
    setError('');
    try {
      const response = await fetch('/api/ga4/properties');
      if (!response.ok) throw new Error('Could not fetch properties');
      const data = await response.json();
      setProperties(data.properties || []);
    } catch (err) {
      console.error('[Onboarding] Fetch error:', err);
    } finally {
      setFetchingProperties(false);
    }
  };

  const onStepChange = (newStep: Step) => {
    if (newStep === 'ga4') fetchGa4Properties();
    setStep(newStep);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/agencies/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyName, clientName, clientWebsite, ga4PropertyId }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete setup');
      }
      setStep('success');
      toast.success('Workspace created! Ready for lift-off 🚀');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const cardVariants = {
    initial: { opacity: 0, scale: 0.98, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98, y: -10 },
  };

  const currentIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="mx-auto max-w-xl">
      {/* ── Step Progress Bar ─────────────────────────────── */}
      {step !== 'success' && (
        <div className="mb-10 flex items-center px-2">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = s.id === step;
            const isCompleted = currentIndex > i;
            return (
              <div key={s.id} className="flex flex-1 flex-col items-center relative">
                {/* connector */}
                {i < steps.length - 1 && (
                  <div
                    className="absolute top-4 left-1/2 w-full h-px"
                    style={{ background: isCompleted ? '#0f172a' : '#e2e8f0' }}
                  />
                )}
                {/* circle */}
                <div
                  className="relative z-10 flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-all duration-300"
                  style={{
                    background: isActive || isCompleted ? '#0f172a' : '#ffffff',
                    borderColor: isActive || isCompleted ? '#0f172a' : '#e2e8f0',
                    color: isActive || isCompleted ? '#ffffff' : '#94a3b8',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span
                  className="mt-2 text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: isActive ? '#0f172a' : '#94a3b8' }}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {/* ── Card ─────────────────────────────────────────── */}
          <div
            className="rounded-2xl border p-8"
            style={{
              background: '#ffffff',
              borderColor: '#e2e8f0',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}
          >
            {/* STEP: Agency */}
            {step === 'agency' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border" style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#475569' }}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight" style={{ color: '#0f172a' }}>Define your identity</h2>
                    <p className="mt-1 text-sm" style={{ color: '#64748b' }}>First, what's the name of your agency?</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Agency Name</label>
                    <BrightInput placeholder="e.g. Skyline Digital" value={agencyName} onChange={e => setAgencyName(e.target.value)} />
                  </div>
                  {error && <p className="text-xs font-medium text-red-600">{error}</p>}
                  <button
                    onClick={handleNext}
                    className="group flex w-full items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: '#0f172a', color: '#ffffff' }}
                  >
                    Next Step <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP: Client */}
            {step === 'client' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border" style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#475569' }}>
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight" style={{ color: '#0f172a' }}>Add your first project</h2>
                    <p className="mt-1 text-sm" style={{ color: '#64748b' }}>Who are we tracking analytics for today?</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Client Name</label>
                    <BrightInput placeholder="e.g. Acme Corp" value={clientName} onChange={e => setClientName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Website URL</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#94a3b8' }} />
                      <BrightInput placeholder="acme.com" value={clientWebsite} onChange={e => setClientWebsite(e.target.value)} className="pl-9" />
                    </div>
                  </div>
                  {error && <p className="text-xs font-medium text-red-600">{error}</p>}
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleBack} className="h-10 px-4 rounded-xl text-xs font-semibold uppercase tracking-widest transition-colors hover:bg-slate-50" style={{ color: '#64748b' }}>
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      className="group flex flex-1 items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ background: '#0f172a', color: '#ffffff' }}
                    >
                      Next Step <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP: GA4 */}
            {step === 'ga4' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border" style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#475569' }}>
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold tracking-tight" style={{ color: '#0f172a' }}>Connect GA4</h2>
                      <Sparkles className="h-4 w-4" style={{ color: '#94a3b8' }} />
                    </div>
                    <p className="mt-1 text-sm" style={{ color: '#64748b' }}>Sync your property ID to enable AI insights.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Choose Property</label>
                      <button type="button" onClick={fetchGa4Properties} className="text-[9px] font-bold uppercase tracking-widest transition-colors hover:opacity-70" style={{ color: '#334155' }}>
                        Refresh List
                      </button>
                    </div>

                    {fetchingProperties ? (
                      <div className="flex flex-col items-center justify-center py-6 space-y-2 rounded-xl border border-dashed" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
                        <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#475569' }} />
                        <p className="text-xs font-medium" style={{ color: '#64748b' }}>Discovering properties...</p>
                      </div>
                    ) : properties.length > 0 ? (
                      <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
                        {properties.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setGa4PropertyId(p.id)}
                            className="flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all text-left"
                            style={{
                              background: ga4PropertyId === p.id ? '#f1f5f9' : '#ffffff',
                              borderColor: ga4PropertyId === p.id ? '#0f172a' : '#e2e8f0',
                            }}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold truncate" style={{ color: '#0f172a' }}>{p.displayName}</p>
                              <p className="text-[9px] font-mono" style={{ color: '#64748b' }}>{p.id}</p>
                            </div>
                            {ga4PropertyId === p.id && <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: '#0f172a' }} />}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center rounded-xl border border-dashed" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
                        <p className="text-xs font-medium italic" style={{ color: '#64748b' }}>No properties found. Enter manually below.</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Manual Property ID</label>
                    <BrightInput placeholder="123456789" value={ga4PropertyId} onChange={e => setGa4PropertyId(e.target.value)} required className="text-center tracking-widest font-mono" />
                  </div>

                  {error && <p className="text-xs font-medium text-red-600">{error}</p>}
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={handleBack} disabled={loading} className="h-10 px-4 rounded-xl text-xs font-semibold uppercase tracking-widest transition-colors hover:bg-slate-50" style={{ color: '#64748b' }}>
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex flex-1 items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                      style={{ background: '#0f172a', color: '#ffffff' }}
                    >
                      {loading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Setting up Workspace...</>
                      ) : 'Complete Onboarding'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* STEP: Success */}
            {step === 'success' && (
              <div className="py-8 text-center space-y-6">
                <div className="relative inline-flex">
                  <div className="relative h-20 w-20 rounded-full border flex items-center justify-center" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                    <CheckCircle2 className="h-10 w-10" style={{ color: '#0f172a' }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-bold" style={{ color: '#0f172a' }}>You're all set, {agencyName}!</h2>
                  <p className="text-sm font-medium max-w-xs mx-auto" style={{ color: '#64748b' }}>Your agency analytics node is live and secured.</p>
                </div>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full h-12 rounded-xl text-base font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: '#0f172a', color: '#ffffff' }}
                >
                  Enter Dashboard
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#94a3b8' }}>
        Enterprise Security Standard Verified
      </p>
    </div>
  );
}
