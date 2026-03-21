'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input }   from '@/components/ui/Input';
import { Button }  from '@/components/ui/Button';
import { Shield }  from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName]     = useState('');
  const [color, setColor]   = useState('#C17B2F');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Agency name must be at least 2 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/agencies/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), brand_color: color }),
      });
      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-surface)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[480px] bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-8">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-white rounded-sm" />
          </div>
          <span className="text-[18px] font-semibold text-[var(--text-primary)] tracking-tight">Reportly</span>
        </div>

        <h2 className="text-[24px] font-semibold text-[var(--text-primary)] text-center mb-2">
          Set up your agency
        </h2>
        <p className="text-[14px] text-[var(--text-secondary)] text-center mb-8">
          This takes 60 seconds. You can change everything later.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Agency Name"
            placeholder="e.g. Pixel Digital, Growth Media Co."
            value={name}
            onChange={e => setName(e.target.value)}
            error={error}
            required
            id="agency-name"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[var(--text-secondary)]">
              Brand Color <span className="text-[var(--text-muted)] font-normal">(optional)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-10 h-10 rounded-[var(--radius-md)] border border-[var(--border)] cursor-pointer bg-[var(--bg-primary)] p-0.5"
                id="brand-color-picker"
              />
              <input
                type="text"
                value={color}
                onChange={e => setColor(e.target.value)}
                placeholder="#C17B2F"
                className="
                  flex-1 h-10 px-3 rounded-[var(--radius-md)]
                  bg-[var(--bg-primary)] border border-[var(--border)]
                  text-[14px] font-mono text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)]
                  focus:outline-none focus:border-[var(--accent)] focus:shadow-[var(--shadow-focus)]
                  transition-all duration-[120ms] ease-[ease]
                "
                id="brand-color-text"
              />
            </div>
            <p className="text-[12px] text-[var(--text-muted)]">This color appears on your client reports</p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full mt-2"
            id="onboarding-submit"
          >
            Get started →
          </Button>
        </form>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full text-center text-[13px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] mt-4 transition-colors duration-[120ms] ease-[ease]"
          id="onboarding-skip"
        >
          Skip for now
        </button>

        <div className="flex items-center justify-center gap-1.5 mt-6 pt-6 border-t border-[var(--border)]">
          <Shield size={12} className="text-[var(--text-muted)]" strokeWidth={1.5} />
          <span className="text-[11px] text-[var(--text-muted)]">Your data is encrypted and never shared</span>
        </div>
      </div>
    </div>
  );
}
