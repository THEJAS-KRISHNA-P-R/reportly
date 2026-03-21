const stats = [
  { value: '90+',   label: 'Hours saved per agency per month'       },
  { value: '3 min', label: 'Average report generation time'         },
  { value: '100%',  label: 'Reports reviewed by agency before send' },
  { value: '₹0',    label: 'Extra cost per additional report'       },
];

export function Stats() {
  return (
    <section className="py-20 px-6 bg-[var(--bg-dark)]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-white/10">
          {stats.map(({ value, label }, i) => (
            <div key={i} className="flex flex-col items-center text-center md:px-8">
              <span className="text-[40px] md:text-[48px] font-semibold text-[var(--accent)] leading-none mb-3">{value}</span>
              <span className="text-[13px] md:text-[14px] text-[var(--text-muted)] leading-snug">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-[12px] text-[var(--text-muted)]/60 mt-10">
          Based on average usage across active Reportly agencies.
        </p>
      </div>
    </section>
  );
}
