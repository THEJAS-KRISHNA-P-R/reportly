import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", 'system-ui', 'sans-serif'],
        mono: ["'IBM Plex Mono'", 'monospace'],
      },
      colors: {
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        'border-subtle': 'var(--border-subtle)',
        input: 'var(--border)',
        ring: 'var(--accent)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        'foreground-muted': 'var(--foreground-muted)',
        'foreground-subtle': 'var(--foreground-subtle)',
        'foreground-faint': 'var(--foreground-faint)',
        surface: {
          100: 'var(--surface-100)',
          200: 'var(--surface-200)',
          300: 'var(--surface-300)',
          400: 'var(--surface-400)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
        error: 'var(--danger)',
        destructive: 'var(--danger)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'shimmer-slide': 'shimmer-slide var(--speed) ease-in-out infinite alternate',
        'spin-around':   'spin-around calc(var(--speed)*2) infinite linear',
        'float':         'float 6s ease-in-out infinite',
        'fade-in':       'fadeIn 0.3s ease forwards',
        'pulse-dot':     'pulse-dot 1.4s ease-in-out infinite',
      },
      keyframes: {
        'spin-around': {
          '0%':        { transform: 'translateZ(0) rotate(0)' },
          '15%, 35%':  { transform: 'translateZ(0) rotate(90deg)' },
          '65%, 85%':  { transform: 'translateZ(0) rotate(270deg)' },
          '100%':      { transform: 'translateZ(0) rotate(360deg)' },
        },
        'shimmer-slide': {
          to: { transform: 'translate(calc(100cqw - 100%), 0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        'fadeIn': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
