'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Users, 
  BarChart3, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Globe, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

type Step = 'agency' | 'client' | 'ga4' | 'success';

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
      if (!agencyName.trim()) {
        setError('Please name your agency to continue');
        return;
      }
      setStep('client');
    } else if (step === 'client') {
      if (!clientName.trim() || !clientWebsite.trim()) {
        setError('Client details are required');
        return;
      }
      onStepChange('ga4');
    }
    setError('');
  };

  const handleBack = () => {
    if (step === 'client') setStep('agency');
    else if (step === 'ga4') setStep('client');
    setError('');
  };

  // Auto-fetch properties when reaching GA4 step
  const fetchGa4Properties = async () => {
    setFetchingProperties(true);
    setError('');
    try {
      const response = await fetch('/api/ga4/properties');
      if (!response.ok) throw new Error('Could not fetch properties automatically');
      const data = await response.json();
      setProperties(data.properties || []);
    } catch (err) {
      console.error('[Onboarding] Fetch error:', err);
      // Don't set error on screen, just fall back to manual entry
    } finally {
      setFetchingProperties(false);
    }
  };

  const onStepChange = (newStep: Step) => {
    if (newStep === 'ga4') {
      fetchGa4Properties();
    }
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
        body: JSON.stringify({
          agencyName,
          clientName,
          clientWebsite,
          ga4PropertyId
        }),
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
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="mx-auto max-w-xl">
      {/* Progress Stepper */}
      {step !== 'success' && (
        <div className="mb-12 flex items-center justify-between px-2">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = s.id === step;
            const isCompleted = steps.findIndex(st => st.id === step) > i;

            return (
              <div key={s.id} className="relative flex flex-col items-center flex-1">
                {/* Connector Line */}
                {i < steps.length - 1 && (
                  <div className={`absolute top-5 left-1/2 w-full h-[2px] ${isCompleted ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
                )}
                
                <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all duration-300 ${
                  isActive ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-110' :
                  isCompleted ? 'border-blue-600 bg-blue-600 text-white' :
                  'border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-900'
                }`}>
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={`mt-3 text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
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
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900/50 dark:backdrop-blur-xl"
        >
          {step === 'agency' && (
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10">
                  <Building2 className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Define your identity</h2>
                <p className="text-slate-500 dark:text-slate-400">First, what's the name of your agency?</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Agency Name</label>
                  <Input
                    placeholder="e.g. Skyline Digital"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="h-12 text-lg focus:ring-blue-500"
                  />
                </div>
                {error && <p className="text-sm font-medium text-rose-500">{error}</p>}
                <Button onClick={handleNext} className="w-full h-12 text-base font-semibold group bg-blue-600 hover:bg-blue-700">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          )}

          {step === 'client' && (
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10">
                  <Users className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Add your first project</h2>
                <p className="text-slate-500 dark:text-slate-400">Who are we tracking analytics for today?</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Client Name</label>
                    <Input
                      placeholder="e.g. Acme Corp"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Website URL</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                      <Input
                        placeholder="acme.com"
                        value={clientWebsite}
                        onChange={(e) => setClientWebsite(e.target.value)}
                        className="h-12 pl-10"
                      />
                    </div>
                  </div>
                </div>
                {error && <p className="text-sm font-medium text-rose-500">{error}</p>}
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={handleBack} className="h-12 px-6">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1 h-12 text-base font-semibold group bg-blue-600 hover:bg-blue-700">
                    Next Step
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 'ga4' && (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Connect GA4</h2>
                  <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500" />
                </div>
                <p className="text-slate-500 dark:text-slate-400">Sync your property ID to enable AI insights.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Analytics Property</label>
                  
                  {fetchingProperties ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
                      <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                      <p className="text-sm font-medium text-slate-500">Discovering your properties...</p>
                    </div>
                  ) : properties.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {properties.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setGa4PropertyId(p.id)}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left ${
                            ga4PropertyId === p.id 
                              ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 dark:bg-blue-500/10' 
                              : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{p.displayName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{p.id}</p>
                          </div>
                          {ga4PropertyId === p.id && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 dark:border-slate-800">
                      <p className="text-sm text-slate-400">No properties found. Please enter manually below.</p>
                    </div>
                  )}

                  <div className="pt-2">
                    <button 
                      type="button"
                      onClick={fetchGa4Properties}
                      className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                    >
                      Refresh List
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">GA4 Property ID</label>
                    <span className="text-[10px] text-slate-400 italic">Found in Admin → Property Settings</span>
                  </div>
                  <Input
                    placeholder="123456789"
                    value={ga4PropertyId}
                    onChange={(e) => setGa4PropertyId(e.target.value)}
                    className="h-12 font-mono text-center tracking-widest"
                    required
                  />
                </div>
                {error && <p className="text-sm font-medium text-rose-500">{error}</p>}
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={handleBack} disabled={loading} className="h-12 px-6">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1 h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      'Finish Setup'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="py-12 text-center space-y-8">
              <div className="relative inline-flex">
                <div className="absolute inset-0 blur-2xl opacity-20 bg-emerald-500 rounded-full animate-pulse" />
                <div className="relative h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center dark:bg-emerald-500/10">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white">You're all set, {agencyName}!</h2>
                <p className="text-slate-500 dark:text-slate-400">Your workspace is ready and secured. Welcome to the future of reporting.</p>
              </div>

              <Button 
                onClick={() => router.push('/dashboard')}
                className="w-full h-14 text-lg font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Enter Dashboard
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      
      <p className="mt-8 text-center text-xs text-slate-400 font-medium opacity-50">
        Trusted by 500+ agencies worldwide.
      </p>
    </div>
  );
}
