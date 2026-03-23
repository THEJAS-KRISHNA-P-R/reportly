# Component Sources — Where to Get What

## reactbits.dev — Full Component Catalog

All components are copy-paste React. Go to reactbits.dev → search → copy JSX + CSS.

### Backgrounds
- `Aurora` — animated gradient blob background
- `Particles` — floating dot particles
- `Waves` — animated SVG wave background
- `DotGrid` / `GridDistortion` — interactive grid
- `Noise` — film grain texture overlay
- `Ribbons` — flowing ribbon decorations
- `Hyperspeed` — starfield / warp effect

### Text Effects
- `SplitText` — character-by-character entrance animation
- `BlurText` — blur-in reveal for headings
- `GradientText` — animated gradient on text
- `CountUp` — animated number counter
- `RotatingText` — cycles through words (hero subtitles)
- `ShinyText` — shimmer/gloss effect
- `Typewriter` — character-by-character typewriter
- `DecryptedText` — matrix-style decode animation

### Cards & Containers
- `TiltCard` — 3D mouse-tracking tilt
- `SpotlightCard` — moving spotlight on hover
- `MagneticCard` — magnetic pull toward cursor
- `GlassIcons` — glassmorphism icon containers
- `BentoCard` — bento grid layout card

### Buttons & Interactions
- `Magnet` — wraps any element with magnetic hover
- `MagneticButton` — full magnetic button with spring
- `RippleButton` — click ripple effect

### UI Elements
- `CircularProgress` — animated ring progress
- `AnimatedList` — staggered list with spring entrance
- `Dock` — macOS-style dock with magnification
- `Stepper` — animated multi-step indicator
- `InfiniteScroll` — auto-scroll marquee

---

## 21st.dev — Premium React Components

Visit 21st.dev → click component → copy code → paste.

### Navigation
- **Navbar** — glass blur top nav, mobile-responsive
- **Sidebar** — collapsible with icons, animated
- **Mobile Menu** — full-screen overlay with stagger
- **Breadcrumb** — animated with separator icons

### Hero Sections
- **Hero Simple** — headline + CTA + particles
- **Hero Split** — text left, visual right
- **Hero Center** — centered with animated badge

### Cards
- **Feature Card** — icon + title + description with hover glow
- **Pricing Card** — toggle monthly/yearly with spring
- **Stats Card** — animated number + trend
- **Team Card** — avatar + social links

### Forms & Inputs
- **Floating Label Input** — label animates on focus
- **Search Command** — CMD+K style command palette
- **File Upload** — drag and drop with animation
- **OTP Input** — digit-by-digit animated input

### Feedback
- **Toast (Sonner)** — animated notifications
- **Alert** — animated entrance banner
- **Progress** — shimmer progress bar
- **Skeleton** — loading placeholder

---

## uiverse.io — CSS Components

Search on uiverse.io. Filter: `CSS`, `Tailwind`, or `React`. Copy the code block.

### Best-in-class picks:

**Buttons** — search "button dark glassmorphism"
- Neon glow border buttons
- Magnetic 3D push buttons
- Ripple fill buttons
- Shimmer border buttons

**Inputs** — search "input dark floating label"
- Label float on focus
- Gradient underline focus
- Glowing border on focus

**Checkboxes** — search "checkbox animated dark"
- Spring bounce check
- Scale pop check
- Draw-on check animation

**Loaders** — search "loader minimal dark"
- Orbital ring spinner
- Pulse dot loader
- DNA helix loader
- Morphing shape loader

**Cards** — search "card glassmorphism dark"
- Spotlight border cards
- Neon glow cards
- Frosted glass cards

**Toggles** — search "toggle switch neon"
- Glow on/off toggle
- Slide with shadow toggle

---

## Aceternity UI — Dramatic Effects

Install: `npm install @aceternity/ui` or copy from ui.aceternity.com

### High-impact components:
- `BackgroundBeams` — animated light beams
- `SparklesCore` — particle sparkles
- `MovingBorder` — animated gradient border
- `CardSpotlight` — mouse-tracked light card
- `TextGenerateEffect` — word-by-word reveal
- `TypewriterEffect` — smooth typewriter
- `BackgroundGradientAnimation` — animated gradient bg
- `FloatingNav` — scroll-aware floating navbar
- `HoverBorderGradient` — rotating gradient border on hover
- `BentoGrid` — animated bento layout

```tsx
// Example: Moving border on a card
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
<HoverBorderGradient
  containerClassName="rounded-full"
  className="bg-[#0a0f1e] text-white text-sm px-6 py-2"
>
  Ship Report
</HoverBorderGradient>
```

---

## Magic UI — Micro-Animations

Install from magicui.design

- `NumberTicker` — count up animation
- `AnimatedShinyText` — shiny shimmer text
- `ShimmerButton` — light sweep button
- `RainbowButton` — rotating rainbow gradient
- `MagicCard` — spotlight hover card
- `Meteors` — shooting stars animation
- `GridPattern` — animated grid background
- `Ripple` — radial ripple circles
- `Confetti` — celebration effect
- `RetroGrid` — 3D perspective grid

```tsx
import { NumberTicker } from "@/components/magicui/number-ticker";
<NumberTicker value={24500} prefix="$" className="font-display font-bold text-3xl text-white" />
```

---

## Framer Motion — Cheatsheet of What to Actually Use

```tsx
// Appearance on enter viewport
import { useInView } from "framer-motion";
const ref = useRef(null);
const inView = useInView(ref, { once: true, margin: "-100px" });
<motion.div ref={ref} animate={inView ? "visible" : "hidden"} variants={itemVariants} />

// Layout animation (reorder lists, expand/collapse)
<motion.div layout layoutId="card-123">

// Shared element transition (navigate between pages)
<motion.img layoutId="hero-image" src={img} />

// Scroll-linked animations
const { scrollYProgress } = useScroll();
const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

// Gesture drag
<motion.div drag dragConstraints={{ left: -100, right: 100 }} dragElastic={0.2} />

// Infinite scroll marquee
<motion.div animate={{ x: [0, -1000] }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} />
```

---

## shadcn/ui — Components to Always Add

```bash
# Run these after init
npx shadcn@latest add button card badge input dialog sheet tabs
npx shadcn@latest add dropdown-menu popover tooltip select
npx shadcn@latest add separator skeleton progress avatar
npx shadcn@latest add command  # CMD+K palette
```

Theming file — `components/ui/globals.css`:
Override shadcn's default CSS vars with the antigravity palette. See main SKILL.md.
