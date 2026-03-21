import { Link2, ShieldCheck, SendHorizonal } from 'lucide-react';

const steps = [
  {
    num:  '01',
    icon: Link2,
    title: 'Connect once',
    body:  'Link your Google Analytics account in under 2 minutes. No developer required. We only request read access.',
  },
  {
    num:  '02',
    icon: ShieldCheck,
    title: 'We fetch and validate',
    body:  'Every metric is verified before the AI sees it. Wrong data, null values, impossible spikes — all caught before they become embarrassing.',
  },
  {
    num:  '03',
    icon: SendHorizonal,
    title: 'Review, approve, send',
    body:  "Edit the AI narrative, approve it, and Reportly delivers the branded PDF to your client. Nothing goes out without your sign-off.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-[var(--bg-surface)]">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px flex-1 max-w-12 bg-[var(--accent)]/30" />
          <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--accent)]">The Process</span>
          <div className="h-px flex-1 max-w-12 bg-[var(--accent)]/30" />
        </div>
        <h2 className="text-[30px] md:text-[36px] font-semibold text-[var(--text-primary)] text-center tracking-[-0.02em] mb-4">
          From data to delivered report in minutes
        </h2>
        <p className="text-[16px] text-[var(--text-secondary)] text-center max-w-lg mx-auto mb-16">
          The entire workflow is automated. Your only job is reviewing and approving.
        </p>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-6 left-[calc(16.67%+3rem)] right-[calc(16.67%+3rem)] h-px border-t border-dashed border-[var(--border)]" />
          {steps.map(({ num, icon: Icon, title, body }, i) => (
            <div key={i} className="relative flex flex-col items-start md:items-center md:text-center">
              <div className="relative z-10 w-12 h-12 rounded-full bg-[var(--accent-light)] border border-[var(--accent)]/25 flex items-center justify-center mb-5">
                <span className="text-[13px] font-semibold text-[var(--accent)]">{num}</span>
              </div>
              <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center mb-4">
                <Icon size={18} strokeWidth={1.5} className="text-[var(--text-primary)]" />
              </div>
              <h3 className="text-[17px] font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
              <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
