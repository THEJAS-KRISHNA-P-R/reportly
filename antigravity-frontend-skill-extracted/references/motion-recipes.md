# Motion Recipes — Copy-Paste Framer Motion

## Core Variants (paste into every component file)

```tsx
export const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } }
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] } }
};

export const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

export const slideRight = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};
```

## Page Transition Wrapper

```tsx
// Wrap each page/route with this
export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

## Staggered Grid (for card grids)

```tsx
<motion.div
  variants={stagger}
  initial="hidden"
  animate="visible"
  className="grid grid-cols-2 lg:grid-cols-4 gap-4"
>
  {items.map(item => (
    <motion.div key={item.id} variants={fadeUp}>
      <Card item={item} />
    </motion.div>
  ))}
</motion.div>
```

## Animated Number Counter

```tsx
function AnimatedNumber({ value, prefix = "", suffix = "" }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) animate(count, value, { duration: 1.5, ease: "easeOut" });
  }, [inView, value]);

  return (
    <span ref={ref}>
      {prefix}<motion.span>{rounded}</motion.span>{suffix}
    </span>
  );
}
```

## Modal with Scale + Blur

```tsx
<AnimatePresence>
  {open && (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          z-50 w-[min(90vw,520px)] glass-elevated rounded-2xl p-6"
      >
        {/* content */}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

## Accordion / Expand

```tsx
<motion.div
  initial={false}
  animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
  style={{ overflow: "hidden" }}
>
  {content}
</motion.div>
```

## Infinite Marquee (Testimonials / Logos)

```tsx
function Marquee({ items, speed = 25 }) {
  return (
    <div className="overflow-hidden flex gap-4">
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="flex gap-4 shrink-0"
          animate={{ x: ["0%", "-100%"] }}
          transition={{ repeat: Infinity, duration: speed, ease: "linear" }}
        >
          {items.map((item, j) => <MarqueeItem key={j} item={item} />)}
        </motion.div>
      ))}
    </div>
  );
}
```

## Floating Card (3D tilt)

```tsx
function TiltCard({ children }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]));
  const rotY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]));
  const scale = useSpring(1);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <motion.div
      style={{ rotateX: rotX, rotateY: rotY, scale, transformStyle: "preserve-3d" }}
      onMouseMove={onMove}
      onMouseEnter={() => scale.set(1.03)}
      onMouseLeave={() => { x.set(0); y.set(0); scale.set(1); }}
    >
      {children}
    </motion.div>
  );
}
```

## Drag to Reorder List

```tsx
import { Reorder } from "framer-motion";

<Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
  {items.map((item) => (
    <Reorder.Item key={item.id} value={item}
      className="glass-card p-3 cursor-grab active:cursor-grabbing"
      whileDrag={{ scale: 1.02, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
    >
      {item.label}
    </Reorder.Item>
  ))}
</Reorder.Group>
```

## Notification Toast (Sonner)

```tsx
import { Toaster, toast } from "sonner";

// In root layout
<Toaster
  theme="dark"
  toastOptions={{
    className: "glass-card border-white/10",
    style: { background: "rgba(15,22,41,0.9)", backdropFilter: "blur(20px)" }
  }}
/>

// Trigger
toast.success("Report shipped!", { description: "Client notified via email." });
toast.error("Validation failed", { description: "GA4 data not synced." });
```

## Progress Bar (animated)

```tsx
function ProgressBar({ value, max = 100 }) {
  return (
    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(value / max) * 100}%` }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500
          shadow-[0_0_8px_rgba(79,139,255,0.6)]"
      />
    </div>
  );
}
```
