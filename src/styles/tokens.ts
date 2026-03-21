// src/styles/tokens.ts
// SINGLE SOURCE OF TRUTH — every color, spacing, and style value lives here
// To reskin the entire app: change the accent block only

export const tokens = {
  colors: {
    // Base
    white:  '#FFFFFF',
    black:  '#0A0A0A',

    // Backgrounds
    bgPrimary: '#FFFFFF',
    bgSurface: '#F7F6F4',
    bgDark:    '#0A0A0A',
    bgMuted:   '#FAFAF9',

    // Text
    textPrimary:     '#0A0A0A',
    textSecondary:   '#4A4A4A',
    textMuted:       '#8A8A8A',
    textInverse:     '#FFFFFF',
    textPlaceholder: '#ADADAD',

    // Borders
    border:       '#E8E8E8',
    borderStrong: '#D0D0D0',
    borderFocus:  '#C17B2F',

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ACCENT — change ONLY these 4 to reskin
    accent:      '#C17B2F',
    accentHover: '#A86824',
    accentLight: '#FAF0E4',
    accentDark:  '#7A4D1A',
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Semantic
    success:     '#1A6B3A',
    successBg:   '#F0F8F3',
    successText: '#166534',
    warning:     '#B5690A',
    warningBg:   '#FAF0E4',
    warningText: '#7A4D1A',
    error:       '#8B1F2A',
    errorBg:     '#FFF5F5',
    errorText:   '#7F1D1D',
    info:        '#1B3A5C',
    infoBg:      '#F0F4F8',

    // Overlays
    overlay: 'rgba(10,10,10,0.4)',
    scrim:   'rgba(10,10,10,0.08)',
  },

  typography: {
    fontSans: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontMono: "'DM Mono', 'Fira Code', monospace",
  },

  spacing: {
    px:   '1px',
    0.5:  '2px',
    1:    '4px',
    2:    '8px',
    3:    '12px',
    4:    '16px',
    5:    '20px',
    6:    '24px',
    8:    '32px',
    10:   '40px',
    12:   '48px',
    16:   '64px',
    20:   '80px',
    24:   '96px',
    32:   '128px',
  },

  radius: {
    sm:   '4px',
    md:   '8px',
    lg:   '12px',
    xl:   '16px',
    '2xl':'20px',
    full: '9999px',
  },

  shadows: {
    xs:    '0 1px 2px rgba(0,0,0,0.05)',
    sm:    '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    md:    '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)',
    lg:    '0 10px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
    xl:    '0 20px 48px rgba(0,0,0,0.10), 0 8px 16px rgba(0,0,0,0.06)',
    card:  '0 1px 3px rgba(0,0,0,0.06)',
    hover: '0 4px 16px rgba(0,0,0,0.10)',
    hero:  '0 24px 64px rgba(0,0,0,0.12)',
    focus: '0 0 0 3px rgba(193,123,47,0.15)',
  },

  transitions: {
    fast:   '120ms ease',
    normal: '200ms ease',
    slow:   '300ms ease',
    spring: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  layout: {
    maxWidth:         '1200px',
    sidebarWidth:     '240px',
    sidebarCollapsed: '64px',
    topbarHeight:     '64px',
    navHeight:        '64px',
    contentPadding:   '32px',
    sectionPaddingY:  '96px',
    cardPadding:      '24px',
  },
} as const;
