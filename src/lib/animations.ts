import { Variants } from 'framer-motion';

// Fade up — use for section content reveals
export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  },
};

// Stagger children — wrap parent list items
export const staggerContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// Fade in — subtle, for cards
export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

// Scale up — for modals and popovers
export const scaleUp: Variants = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, scale: 1,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
};

// Slide in from left — sidebar
export const slideInLeft: Variants = {
  hidden:  { x: '-100%' },
  visible: { x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};
