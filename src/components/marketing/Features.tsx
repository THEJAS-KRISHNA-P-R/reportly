import { ShieldCheck, Brain, UserCheck, ScrollText } from 'lucide-react';

const features = [
  {
    label: 'AI NARRATIVE ENGINE',
    icon: Brain,
    title: 'Reports that explain themselves',
    body: "AI writes the commentary so your team doesn't have to. Every insight is backed by real data from Google Analytics — not guesswork or hallucination.",
    side: 'right' as const,
  },
  {
    label: 'DATA INTEGRITY',
    icon: ShieldCheck,
    title: 'Wrong numbers never reach your clients',
    body: 'Every metric is validated before the AI sees it. Null values, impossible spikes, stale data — all caught and flagged before they become an embarrassing report.',
    side: 'left' as const,
  },
  {
    label: 'AGENCY CONTROL',
    icon: UserCheck,
    title: 'You approve it. Then it sends.',
    body: "Nothing reaches your client without your sign-off. Edit the narrative, adjust the tone, then click approve. The system handles the rest.",
    side: 'right' as const,
  },
  {
    label: 'FULL AUDIT TRAIL',
    icon: ScrollText,
    title: 'Every decision is on record',
    body: "Raw data, AI inputs, edits, approvals — everything is logged permanently. If a client ever questions a number, you have proof of exactly what the API returned.",
    side: 'left' as const,
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-[var(--bg-primary)]">
      <div className="max-w-[1200px] mx-auto space-y-24">
        {features.map(({ label, icon: Icon, title, body, side }, i) => (
          <div
            key={i}
            className={[
              'flex flex-col md:flex-row items-center gap-12 md:gap-20',
              side === 'left' ? 'md:flex-row-reverse' : '',
            ].join(' ')}
          >
            <div className="flex-1 max-w-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-[var(--radius-md)] bg-[var(--accent-light)] flex items-center justify-center">
                  <Icon size={14} strokeWidth={1.5} className="text-[var(--accent)]" />
                </div>
                <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--accent)]">
                  {label}
                </span>
              </div>
              <h3 className="text-[24px] md:text-[28px] font-semibold text-[var(--text-primary)] tracking-[-0.01em] leading-[1.3] mb-4">
                {title}
              </h3>
              <p className="text-[16px] text-[var(--text-secondary)] leading-[1.7]">{body}</p>
            </div>

            <div className="flex-1 w-full">
              <div className="w-full h-64 rounded-[var(--radius-xl)] bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-[var(--radius-xl)] bg-[var(--accent-light)] border border-[var(--accent)]/20 flex items-center justify-center mx-auto mb-3">
                    <Icon size={20} strokeWidth={1.5} className="text-[var(--accent)]" />
                  </div>
                  <span className="text-[12px] text-[var(--text-muted)]">Screenshot goes here</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
