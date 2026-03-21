export function TopBar({ title, actions }: { title: string; actions?: React.ReactNode }) {
  return (
    <header className="
      sticky top-0 z-20
      h-[64px] flex items-center justify-between
      px-8 bg-[var(--bg-primary)]/95 backdrop-blur-sm
      border-b border-[var(--border)] shrink-0
    ">
      <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">{title}</h1>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
