# Dashboard Patterns Reference

## App Shell (Full Responsive Layout)

```tsx
// app/layout.tsx or _app.tsx
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[#050810] overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 bg-mesh pointer-events-none" />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] lg:w-[280px] shrink-0
        border-r border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[280px] bg-[#0a0f1e]/95
          border-r border-white/10 backdrop-blur-2xl">
          <SidebarContent pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overscroll-contain">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="p-[clamp(1rem,3vw,2rem)] max-w-[1600px] mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
```

## Sidebar Component

```tsx
const navItems = [
  { icon: LayoutDashboard, label: "Overview",  href: "/" },
  { icon: Users,           label: "Clients",   href: "/clients" },
  { icon: FileText,        label: "Reports",   href: "/reports", badge: "2" },
  { icon: BarChart2,       label: "Analytics", href: "/analytics" },
  { icon: Paintbrush,      label: "Customize", href: "/customize" },
  { icon: Settings,        label: "Settings",  href: "/settings" },
];

function SidebarContent({ pathname, onNavigate }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-white/[0.06]">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600
            flex items-center justify-center text-white font-bold text-sm
            shadow-[0_0_20px_rgba(79,139,255,0.4)]">
            M
          </div>
          <span className="font-display font-semibold text-white/90 text-sm">My Agency</span>
        </motion.div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item, i) => {
          const active = pathname === item.href;
          return (
            <motion.a
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              whileHover={{ x: 3 }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group",
                active
                  ? "bg-blue-500/15 text-blue-400 border border-blue-500/20 shadow-[0_0_12px_rgba(79,139,255,0.15)]"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
              )}
            >
              <item.icon size={16} className={active ? "text-blue-400" : "text-white/40 group-hover:text-white/60"} />
              <span>{item.label}</span>
              {item.badge && (
                <Badge className="ml-auto text-[10px] h-4 bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {item.badge}
                </Badge>
              )}
            </motion.a>
          );
        })}
      </nav>

      {/* Bottom User */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] cursor-pointer transition-colors">
          <div className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center text-white text-xs font-bold">M</div>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-xs font-medium truncate">My Agency</p>
            <p className="text-white/30 text-[10px] truncate">admin@agency.com</p>
          </div>
          <ChevronDown size={12} className="text-white/30" />
        </div>
      </div>
    </div>
  );
}
```

## TopBar / Header

```tsx
function TopBar({ onMenuClick, title = "Report Editor" }) {
  return (
    <header className="sticky top-0 z-40 flex items-center gap-4
      px-[clamp(1rem,3vw,2rem)] py-3
      bg-[#050810]/80 backdrop-blur-xl
      border-b border-white/[0.06]">

      {/* Mobile menu button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg hover:bg-white/[0.07] text-white/60 hover:text-white"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </motion.button>

      <h1 className="font-display font-semibold text-white/90 text-base flex-1 min-w-0 truncate">
        {title}
      </h1>

      {/* Right side badges + avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Badge variant="outline" className="hidden sm:flex text-[10px] text-white/50 border-white/10 gap-1">
          REPORTS: 1/2
        </Badge>
        <Badge variant="outline" className="text-[10px] text-red-400 border-red-500/30 gap-1">
          CLIENTS: 1/1
        </Badge>
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="relative p-2 rounded-lg hover:bg-white/[0.07] text-white/50 hover:text-white"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </motion.button>
        <div className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center text-white text-xs font-bold cursor-pointer">M</div>
      </div>
    </header>
  );
}
```

## Metrics / KPI Cards

```tsx
const metrics = [
  { label: "Total Revenue", value: "$24,500", change: "+12%", up: true },
  { label: "Active Clients", value: "14", change: "+2", up: true },
  { label: "Reports Sent", value: "38", change: "+8%", up: true },
  { label: "Avg. Open Rate", value: "73%", change: "-2%", up: false },
];

<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
  className="grid grid-cols-2 lg:grid-cols-4 gap-[clamp(0.75rem,2vw,1.25rem)]"
>
  {metrics.map((m) => (
    <motion.div key={m.label} variants={itemVariants}>
      <Card className="glass-card p-4 hover:border-white/20 transition-all duration-300
        hover:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_30px_rgba(79,139,255,0.1)]
        cursor-default group">
        <p className="text-white/40 text-xs font-medium uppercase tracking-wide mb-2">{m.label}</p>
        <p className="font-display font-bold text-white text-2xl lg:text-3xl mb-1">{m.value}</p>
        <p className={cn("text-xs font-medium", m.up ? "text-emerald-400" : "text-red-400")}>
          {m.change} vs last month
        </p>
      </Card>
    </motion.div>
  ))}
</motion.div>
```

## Validation Check Panel (from screenshots)

```tsx
// Replace the boring plain validation list with this
function ValidationPanel({ checks }) {
  return (
    <div className="glass-card p-4 space-y-3">
      <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">Validation Check</p>
      {checks.map((check, i) => (
        <motion.div
          key={check.label}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-3"
        >
          <motion.div
            animate={check.done ? { scale: [1, 1.3, 1] } : {}}
            className={cn(
              "w-4 h-4 rounded-full flex items-center justify-center",
              check.done
                ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                : "border border-white/20"
            )}
          >
            {check.done && <Check size={10} />}
          </motion.div>
          <span className={cn("text-xs", check.done ? "text-white/70" : "text-white/30")}>
            {check.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
```

## Content Segment Tabs (from screenshots)

```tsx
// Replace the static list with animated tabs
const segments = ["Summary", "Key Performance", "Audience Growth", "Social Impact", "AI Analysis", "Strategy"];

<div className="space-y-1 p-3">
  <p className="text-white/25 text-[9px] uppercase tracking-widest px-2 mb-3">Content Segments</p>
  {segments.map((seg, i) => (
    <motion.button
      key={seg}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06 }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => setActive(seg)}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left transition-all",
        active === seg
          ? "bg-neutral-900 text-white font-semibold shadow-sm border border-white/10"
          : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
      )}
    >
      {seg}
      {active === seg && <Eye size={13} className="text-white/40" />}
    </motion.button>
  ))}
</div>
```
