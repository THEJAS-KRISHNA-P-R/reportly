---
name: antigravity-frontend
description: >
  Build stunning, production-grade frontend interfaces with antigravity/floating UI aesthetics,
  physics-based motion, and flawless responsiveness on ALL devices and screen sizes.
  ALWAYS use this skill when the user asks for: floating elements, levitation effects,
  antigravity UI, zero-gravity animations, physics-based interactions, hover-lift effects,
  parallax depth, or any design that should feel weightless, futuristic, or spatial.
  Also triggers for: "make it responsive", "works on all devices", "mobile-first design",
  "fluid layout", "adaptive UI", "best frontend design", or any combination of motion +
  responsiveness. Use aggressively — if the request involves beautiful modern UI with
  movement or cross-device support, this skill applies. Also triggers any time a UI looks
  plain, boring, flat, "shitty", or lacks depth — upgrade it using this skill.
---

# Antigravity Frontend Design Skill v2

> **LOOK AT THE SCREENSHOTS.** If the user has shared UI screenshots, your job is to diagnose exactly what's wrong (flat cards, no depth, dead whitespace, boring typography, no motion) and surgically fix it using the component ecosystem below. Never produce the same bland flat layout you're replacing.

---

## 🎯 First: Diagnose the Existing UI

When screenshots are provided, audit against:
- **Depth** — Are cards just boxes on a white bg? → Add glassmorphism + shadow stack
- **Motion** — Are there zero animations? → Add Framer Motion entrance + hover states
- **Color** — Flat whites/greys with no atmosphere? → Add bg gradients, glows, mesh
- **Typography** — System font at 14px everywhere? → Add display font + fluid scale
- **Spacing** — Cramped or randomly padded? → Apply consistent space scale
- **Components** — Custom-built boring inputs/buttons? → Replace with shadcn + uiverse
- **Layout** — Static rigid grid? → Use auto-fit + fluid container + responsive breakpoints

---

## 🧰 The Real Component Ecosystem

This skill is opinionated about using **real, proven libraries** — not reinventing wheels.

### Tier 1 — Install These First

```bash
# Core UI + primitives
npx shadcn@latest init
npx shadcn@latest add button card badge input dialog sheet tabs

# Motion — ALWAYS use this
npm install framer-motion

# Icons
npm install lucide-react

# Fonts (pick from approved list)
npm install @fontsource/syne @fontsource/plus-jakarta-sans
```

### Tier 2 — Component Sources

| Source | What to use it for | URL |
|---|---|---|
| **21st.dev** | Drop-in animated React components (navbars, heroes, cards, modals) | 21st.dev |
| **reactbits.dev** | Physics/animated primitives: Magnet, Ribbons, Noise, SplitText, Aurora, Particles | reactbits.dev |
| **uiverse.io** | Copy-paste CSS/Tailwind buttons, loaders, checkboxes, toggles | uiverse.io |
| **shadcn/ui** | Accessible, headless primitives — forms, dialogs, sheets, tabs, dropdown | ui.shadcn.com |
| **Aceternity UI** | Spotlight cards, moving borders, background beams, 3D cards | ui.aceternity.com |
| **Magic UI** | Animated counters, number tickers, shimmer, ripple, confetti | magicui.design |
| **Framer Motion** | Page transitions, layout animations, gesture-based interactions | framer.com/motion |

---

## 🌌 Reactbits.dev — The Power Tools

These are the components that do the heavy lifting for antigravity effects. **Always check reactbits first** before writing custom animation code.

```jsx
// Aurora Background (replaces flat #fff backgrounds)
import Aurora from './Aurora'; // from reactbits
<Aurora colorStops={["#3A1C71", "#D76D77", "#FFAF7B"]} speed={0.5} />

// Particles (replaces static backgrounds)
import Particles from './Particles';
<Particles quantity={120} color="#4f8bff" />

// Magnet (wraps any button/element for physics hover)
import Magnet from './Magnet';
<Magnet padding={80} disabled={false}>
  <Button>Ship Report</Button>
</Magnet>

// SplitText (replaces static headings)
import SplitText from './SplitText';
<SplitText text="My Agency" className="text-5xl font-bold" delay={50} />

// Ribbons (decorative background element)
import Ribbons from './Ribbons';
<Ribbons baseThickness={30} colors={['#4f8bff', '#a855f7']} />

// Noise (texture overlay for depth)
import Noise from './Noise';
<Noise opacity={0.04} />

// Orb (floating ambient light blob)
import Orb from './Orb';
<Orb color="#4f8bff" size={400} />
```

Install pattern: Copy component source from reactbits.dev → save to `components/ui/` → import and use.

---

## 🎬 Framer Motion — The Animation Engine

**Every interactive element gets Framer Motion.** No exceptions for React projects.

### Standard Motion Variants (use these everywhere)

```jsx
// Page/section entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
};

// Use it:
<motion.div variants={containerVariants} initial="hidden" animate="visible">
  <motion.h1 variants={itemVariants}>Title</motion.h1>
  <motion.p variants={itemVariants}>Subtitle</motion.p>
  <motion.div variants={itemVariants}><Button /></motion.div>
</motion.div>
```

### Float Card with Framer

```jsx
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export function FloatCard({ children }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ y: -12, scale: 1.02, boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(79,139,255,0.25)" }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="float-card"
    >
      {children}
    </motion.div>
  );
}
```

### Sidebar with AnimatePresence

```jsx
// Mobile sidebar — slides in with blur
<AnimatePresence>
  {open && (
    <motion.aside
      initial={{ x: "-100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      className="fixed inset-y-0 left-0 z-50 w-72 glass-panel"
    >
      {/* nav items */}
    </motion.aside>
  )}
</AnimatePresence>
```

### Hover + Tap Spring Buttons

```jsx
<motion.button
  whileHover={{ y: -4, scale: 1.03 }}
  whileTap={{ scale: 0.97, y: 0 }}
  transition={{ type: "spring", stiffness: 500, damping: 25 }}
  className="btn-primary"
>
  Ship Report
</motion.button>
```

---

## 🎨 shadcn/ui — The Right Way to Use It

Don't use shadcn defaults unstyled. **Always override with the visual system.**

```jsx
// ❌ BAD — raw shadcn card, completely plain
<Card>
  <CardContent>Summary</CardContent>
</Card>

// ✅ GOOD — shadcn structure + glass + motion
<motion.div variants={itemVariants}>
  <Card className="glass-card border-white/10 bg-white/5 hover:border-white/20 transition-colors">
    <CardHeader>
      <CardTitle className="font-display text-xl tracking-tight">Summary</CardTitle>
    </CardHeader>
    <CardContent className="text-muted">...</CardContent>
  </Card>
</motion.div>
```

**shadcn theming via CSS variables** — add to `globals.css`:
```css
:root {
  --background: 5 8 16;       /* #050810 */
  --foreground: 240 250 255;
  --card: 15 22 41;
  --card-foreground: 240 250 255;
  --border: 255 255 255 / 0.08;
  --ring: 79 139 255;
  --primary: 79 139 255;
  --primary-foreground: 255 255 255;
  --muted: 150 170 220 / 0.6;
  --radius: 1rem;
}
```

---

## 🎭 21st.dev — Drop-In Premium Components

Use these for complex components you'd otherwise spend hours on:

| Need | Component to grab |
|---|---|
| Animated navigation | Navbar with blur + mobile slide |
| Hero section | Hero with particle bg + split text |
| Feature cards | Card grid with stagger entrance |
| Pricing table | Animated pricing with toggle |
| Dashboard sidebar | Collapsible sidebar with icons |
| Modal/Dialog | Full-screen modal with scale-in |
| Toast notifications | Sonner-style animated toasts |
| Stepper/Progress | Animated multi-step flow |

**Workflow**: Go to 21st.dev → find component → copy JSX + CSS → paste into project → customize colors to match design system.

---

## ✨ uiverse.io — CSS Component Upgrades

Replace every boring default HTML input/button with uiverse equivalents.

High-value swaps:
- **Checkboxes** → animated check with spring bounce
- **Toggle switches** → smooth slide with glow
- **Loaders/spinners** → orbital or pulse variants
- **Radio buttons** → scale-in check animation
- **Text inputs** → floating label + focus glow border
- **Progress bars** → shimmer fill animation

Search strategy on uiverse: `[component type] [style: glassmorphism / dark / neon / minimal]`

---

## 🎨 Visual Design System

### Approved Color Palettes

**Dark Cosmos (default — use for dashboards, SaaS)**
```css
:root {
  --bg-void:    #050810;
  --bg-deep:    #0a0f1e;
  --bg-surface: #0f1629;
  --bg-float:   #141c35;
  --glow-1: #4f8bff;
  --glow-2: #a855f7;
  --glow-3: #06ffd4;
  --text-1: rgba(255,255,255,0.97);
  --text-2: rgba(200,215,255,0.75);
  --text-3: rgba(130,150,200,0.5);
}
```

**Light Aurora (for marketing, landing pages)**
```css
:root {
  --bg-void:    #f8faff;
  --bg-deep:    #f0f4ff;
  --bg-surface: #ffffff;
  --glow-1: #4f8bff;
  --glow-2: #7c3aed;
  --text-1: #0a1628;
  --text-2: #334466;
}
```

**Void Neon (for creative portfolios)**
```css
:root {
  --bg-void:    #000000;
  --bg-surface: #0d0d0d;
  --glow-1: #00ff87;
  --glow-2: #ff006e;
  --glow-3: #ffbe0b;
  --text-1: #ffffff;
}
```

### Typography (never use system fonts)

```css
/* tailwind.config.js */
fontFamily: {
  display: ['Syne', 'sans-serif'],     /* headings — bold, geometric */
  body: ['Plus Jakarta Sans', 'sans-serif'],  /* body — clean, readable */
  mono: ['JetBrains Mono', 'monospace'], /* code, data, metrics */
}

/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');
```

### Enterprise Compact Standard (High Density)

For professional SaaS tools, avoid overly large "marketing" proportions. Use these compact scales:

```css
/* Compact Space Scale */
--space-section: clamp(4rem, 8vw, 6rem);    /* Inner section padding */
--space-component: clamp(1rem, 2vw, 1.5rem); /* Card/Component padding */
--space-inset: 1.5rem;                       /* Standard container inset */

/* Compact Typography Scale */
--text-xs:   clamp(0.65rem, 1.2vw, 0.75rem);
--text-sm:   clamp(0.75rem, 1.5vw, 0.875rem); /* Standard body text */
--text-base: clamp(0.875rem, 1.8vw, 1rem);    /* Feature headers */
--text-lg:   clamp(1rem, 2.2vw, 1.25rem);
--text-xl:   clamp(1.25rem, 3vw, 1.75rem);    /* Section headers */
--text-2xl:  clamp(1.75rem, 4vw, 2.25rem);
--text-3xl:  clamp(2.25rem, 5vw, 3rem);       /* Hero headers */
```

### Margin & Alignment Rules
1. **The 5% Rule**: Never let text touch the screen edges. Use a minimum of 5% horizontal padding or `px-[clamp(1rem, 5vw, 4rem)]`.
2. **Left Alignment**: Default to left-alignment for all data-heavy sections. Centering is for Heros only.
3. **Hierarchy**: Use weight (Bold/Black) and sub-text color (opacity 40-60%) for hierarchy, not just size.
```

### Glassmorphism Surface System

```css
/* Ground-level panels */
.glass-0 {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
}

/* Standard floating card */
.glass-card {
  background: rgba(255,255,255,0.06);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: clamp(12px, 2vw, 20px);
  box-shadow:
    0 8px 32px rgba(0,0,0,0.4),
    0 0 0 0.5px rgba(255,255,255,0.05) inset,
    0 0 30px rgba(79,139,255,0.08);
}

/* High-altitude panel */
.glass-elevated {
  background: rgba(255,255,255,0.09);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border: 1px solid rgba(255,255,255,0.15);
  box-shadow:
    0 20px 60px rgba(0,0,0,0.5),
    0 0 0 0.5px rgba(255,255,255,0.08) inset,
    0 0 60px rgba(79,139,255,0.12);
}
```

### Shadow / Glow Stack

```css
--shadow-xs:  0 2px 8px rgba(0,0,0,0.3);
--shadow-sm:  0 4px 16px rgba(0,0,0,0.35), 0 0 8px rgba(79,139,255,0.08);
--shadow-md:  0 8px 32px rgba(0,0,0,0.4),  0 0 24px rgba(79,139,255,0.12);
--shadow-lg:  0 20px 60px rgba(0,0,0,0.5), 0 0 50px rgba(79,139,255,0.18);
--shadow-xl:  0 30px 90px rgba(0,0,0,0.6), 0 0 80px rgba(79,139,255,0.25);
--glow-sm:  0 0 15px rgba(79,139,255,0.4);
--glow-md:  0 0 40px rgba(79,139,255,0.5), 0 0 80px rgba(79,139,255,0.2);
--glow-lg:  0 0 80px rgba(79,139,255,0.6), 0 0 160px rgba(79,139,255,0.3);
```

---

## 📐 Responsive Layout System

### The One Container to Rule Them All

```tsx
// Always wrap content in this
<div className="w-full max-w-[1400px] mx-auto px-[clamp(1rem,5vw,3rem)]">
```

### Fluid Grid (no fixed columns)

```css
.grid-fluid {
  display: grid;
  gap: clamp(1rem, 2.5vw, 1.5rem);
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
}
```

### Tailwind Responsive Tokens (use these, not custom breakpoints)

```
sm:  640px   → 2-col starts
md:  768px   → 3-col, sidebar shows
lg:  1024px  → full layout, sidebar fixed
xl:  1280px  → max content width
2xl: 1536px  → wide padding
```

### Sidebar Layout Pattern

```tsx
// Dashboard pattern — sidebar + main content
<div className="flex h-screen overflow-hidden">
  {/* Desktop sidebar — always visible */}
  <aside className="hidden md:flex w-64 lg:w-72 flex-col glass-card border-r border-white/8 shrink-0">
    <Sidebar />
  </aside>

  {/* Mobile sidebar — AnimatePresence sheet */}
  <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
    <SheetContent side="left" className="w-72 glass-elevated p-0">
      <Sidebar />
    </SheetContent>
  </Sheet>

  {/* Main content — scrollable */}
  <main className="flex-1 overflow-y-auto">
    <TopBar onMenuClick={() => setMobileOpen(true)} />
    <div className="p-[clamp(1rem,3vw,2rem)]">
      {children}
    </div>
  </main>
</div>
```

### Breakpoint Audit — REQUIRED Before Ship

```
320px  — iPhone SE: Nothing cut off, tap targets ≥44px
375px  — iPhone 14: Standard mobile layout
430px  — iPhone 15 Pro Max: Larger mobile
768px  — iPad portrait: Sidebar appears, 2-col grid
1024px — iPad landscape / small laptop: Full layout
1280px — Standard laptop
1440px — Large desktop
1920px — 1080p — most common screen
2560px — 2K/4K — no content stretching
```

---

## 🌊 Background Systems (pick ONE per page)

### Aurora (reactbits)
```jsx
<div className="fixed inset-0 -z-10">
  <Aurora colorStops={["#0f1629", "#1a0a2e", "#0a1628"]} speed={0.3} />
</div>
```

### Animated Mesh Gradient (pure CSS)
```css
.bg-mesh {
  background:
    radial-gradient(ellipse 80% 60% at 20% 30%, rgba(79,139,255,0.12) 0%, transparent 55%),
    radial-gradient(ellipse 60% 80% at 80% 70%, rgba(168,85,247,0.09) 0%, transparent 55%),
    radial-gradient(ellipse 40% 50% at 60% 20%, rgba(6,255,212,0.06) 0%, transparent 50%),
    #050810;
  animation: mesh-breathe 8s ease-in-out infinite alternate;
}
@keyframes mesh-breathe {
  from { background-position: 0% 50%; }
  to   { background-position: 100% 50%; }
}
```

### Particles (reactbits)
```jsx
<Particles
  className="absolute inset-0 -z-10"
  quantity={100}
  ease={80}
  color="#4f8bff"
  refresh
/>
```

### Dot Grid (subtle depth)
```css
.bg-dots {
  background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px);
  background-size: 28px 28px;
}
```

---

## 🚀 Button System (Uiverse + Motion)

Pick a style and go hard. Don't use plain `<button>`:

```tsx
// Glow primary button
<motion.button
  whileHover={{ scale: 1.04, y: -3 }}
  whileTap={{ scale: 0.97 }}
  transition={{ type: "spring", stiffness: 500, damping: 20 }}
  className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full
    bg-gradient-to-r from-blue-500 to-violet-600
    text-white font-semibold text-sm tracking-wide
    shadow-[0_0_24px_rgba(79,139,255,0.5)]
    hover:shadow-[0_0_40px_rgba(79,139,255,0.8)]
    border border-blue-400/30
    transition-shadow duration-300"
>
  <span className="relative z-10">Ship Report</span>
</motion.button>

// Ghost outline button
<motion.button
  whileHover={{ scale: 1.03, y: -2, borderColor: "rgba(79,139,255,0.8)" }}
  whileTap={{ scale: 0.97 }}
  className="px-6 py-2.5 rounded-full border border-white/20
    text-white/80 text-sm font-medium
    hover:text-white hover:bg-white/5
    transition-colors duration-200"
>
  Draft
</motion.button>
```

---

## ♿ Accessibility Non-Negotiables

```tsx
// ALWAYS on interactive elements
<motion.button
  whileTap={{ scale: 0.97 }}
  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-2"
  aria-label="Ship report to client"
>
```

```css
/* Reduced motion — ALWAYS include */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}
```

```tsx
// Framer Motion respects this automatically
const shouldReduceMotion = useReducedMotion();
const variants = shouldReduceMotion ? {} : myVariants;
```

---

## 🔧 Performance Rules

- Animate ONLY `transform`, `opacity`, `filter` — never `width`, `height`, `top`, `left`
- Use `will-change: transform` on hover targets only (not statically on everything)
- Lazy-load heavy components: `const Particles = lazy(() => import('./Particles'))`
- Wrap lazy components in `<Suspense fallback={<div />}>`
- `backdrop-filter` is GPU-intensive — cap at 3 simultaneously visible elements
- Test on mobile: open Chrome DevTools → throttle CPU 6x → should still feel smooth

---

## 📦 The Stack Reference

```json
{
  "dependencies": {
    "framer-motion": "^11",
    "lucide-react": "latest",
    "@radix-ui/react-*": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "sonner": "latest"
  },
  "devDependencies": {
    "tailwindcss": "^3",
    "@tailwindcss/typography": "latest"
  }
}
```

---

## 📁 Reference Files

Read these for specific contexts:
- `references/dashboard-patterns.md` — Sidebar, nav, data tables, metrics cards
- `references/motion-recipes.md` — Copy-paste Framer Motion patterns for every situation
- `references/component-sources.md` — Exact component names + URLs from each library
- `references/responsiveness.md` — Breakpoint-by-breakpoint decision guide
