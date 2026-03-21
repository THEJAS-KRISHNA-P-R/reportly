# Reportly — Design System

> **Aesthetic**: Editorial restraint. Quiet authority.
> Bloomberg Terminal precision meets Linear.io clarity.
> Premium, trustworthy, never flashy.

---

## Foundations

### Color System

| Token | Hex | Usage |
|---|---|---|
| `color-bg` | `#FFFFFF` | Page background |
| `color-surface` | `#F7F6F4` | Cards, panels, table rows |
| `color-text-primary` | `#0A0A0A` | Headings, body |
| `color-text-secondary` | `#4A4A4A` | Supporting text |
| `color-text-muted` | `#8A8A8A` | Labels, timestamps, captions |
| `color-border` | `#E8E8E8` | All borders, dividers |
| `color-accent` | `#C17B2F` | CTAs, active states, focus rings, key figures |
| `color-success` | `#1A6B3A` | Positive deltas, confirmed states |
| `color-error` | `#8B1F2A` | Errors, negative deltas, destructive actions |
| `color-warning` | `#B5690A` | Warnings, draft states |

> **On the accent color**: `#C17B2F` is not orange. It is aged leather — the color of a trusted advisor's desk, premium whiskey, a well-worn field notebook. It communicates seniority and deliberateness. Use it sparingly and purposefully.

---

### Typography — Inter

```
Display  56px / weight 600 / tracking -0.03em
H1       40px / weight 600 / tracking -0.02em
H2       28px / weight 600 / tracking -0.01em
H3       20px / weight 600
Body     15px / weight 400 / line-height 1.6
Small    13px / weight 400 / line-height 1.5
Label    11px / weight 500 / UPPERCASE / tracking 0.08em
Mono     13px / font-mono / weight 400
```

**Rules:**
- All badges, status chips, table column headers, and section labels use the Label style (11px / 500 / UPPERCASE).
- Never use bold within body copy — use color or size contrast instead.
- Numeric data displayed at scale (metric cards) uses weight 600, size 32–40px.

---

### Spacing Scale

| Step | Value | Usage |
|---|---|---|
| `sp-1` | 4px | Icon gap, badge inner padding |
| `sp-2` | 8px | Tight element spacing |
| `sp-3` | 12px | Compact layout gap |
| `sp-4` | 16px | Default gap, form row spacing |
| `sp-5` | 24px | Section gap |
| `sp-6` | 32px | Card internal padding |
| `sp-7` | 48px | Section separation |
| `sp-8` | 64px | Page-level breathing room |

---

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 4px | Badges, chips |
| `radius-md` | 6px | Badge pills |
| `radius-input` | 6px | Inputs, selects |
| `radius-card` | 12px | Cards, modals, panels |
| `radius-btn` | 8px | All buttons |

---

### Elevation (Box Shadows)

No colored or blurred shadows. All elevation is expressed through borders.

```css
/* Card resting state */
box-shadow: none;
border: 1px solid #E8E8E8;

/* Card hover / interactive lift */
box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.06);
border: 1px solid #E8E8E8;

/* Modal / flyout */
box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.10);
border: 1px solid #E8E8E8;
```

---

## Components

### Buttons

#### Primary Button
```
Background:  #C17B2F
Text:        #FFFFFF  |  15px / weight 500
Padding:     12px 24px
Radius:      8px
Border:      none

Hover:       background #A86826  (10% darker)
Active:      background #8F581F  (20% darker, scale 0.99)
Disabled:    opacity 0.4, cursor not-allowed
Focus:       outline 2px solid #C17B2F, outline-offset 2px
```

```
[ Generate Report ]
```

#### Secondary Button
```
Background:  #FFFFFF
Text:        #0A0A0A  |  15px / weight 500
Padding:     12px 24px
Radius:      8px
Border:      1px solid #E8E8E8

Hover:       background #F7F6F4
Active:      background #EEECE9
Disabled:    opacity 0.4
Focus:       outline 2px solid #C17B2F, outline-offset 2px
```

```
[ Cancel ]
```

#### Destructive Button
```
Background:  #FFFFFF
Text:        #8B1F2A  |  15px / weight 500
Padding:     12px 24px
Radius:      8px
Border:      1px solid #8B1F2A

Hover:       background #FDF3F4
```

```
[ Delete Client ]
```

#### Icon Button (square)
```
Size:        36px × 36px
Radius:      8px
Background:  transparent
Border:      1px solid #E8E8E8
Icon:        16px, color #4A4A4A

Hover:       background #F7F6F4
```

---

### Input Fields

```
Height:      40px
Padding:     0 12px
Radius:      6px
Border:      1px solid #E8E8E8
Background:  #FFFFFF
Text:        15px / #0A0A0A
Placeholder: 15px / #8A8A8A

Focus:       border-color #C17B2F
             outline: 2px solid rgba(193, 123, 47, 0.2)
Error:       border-color #8B1F2A
             outline: 2px solid rgba(139, 31, 42, 0.15)

Label:       11px / weight 500 / UPPERCASE / #8A8A8A
             margin-bottom 6px
Helper text: 12px / #8A8A8A / margin-top 4px
Error text:  12px / #8B1F2A / margin-top 4px
```

```
AGENCY NAME                    (label)
┌────────────────────────────┐
│ Pixel Digital Co.           │  ← focus ring in amber
└────────────────────────────┘
```

#### Select / Dropdown
Same dimensions as text input. Arrow icon at right using `#8A8A8A`.

#### Textarea
```
Min-height: 80px
Padding:    10px 12px
Resize:     vertical only
```

---

### Cards

#### Standard Card
```
Background:  #F7F6F4
Border:      1px solid #E8E8E8
Radius:      12px
Padding:     24px

Hover (if interactive):
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.06)
  transition: box-shadow 150ms ease
```

```
┌──────────────────────────────────────────┐
│  LABEL                              •••  │
│                                          │
│  Card Title                             │
│  Supporting description text here       │
│                                          │
└──────────────────────────────────────────┘
```

#### Metric Card
The primary display unit for KPI data. The number is the hero.

```
Background:  #FFFFFF
Border:      1px solid #E8E8E8
Radius:      12px
Padding:     24px

Structure:
  Row 1: SOURCE LABEL (11px / weight 500 / UPPERCASE / #8A8A8A)
  Row 2: Large number (36px / weight 600 / #0A0A0A)
           + Delta badge (inline, right of number)
  Row 3: Description (13px / #8A8A8A)
```

```
┌──────────────────────────────────────────┐
│  GOOGLE ADS — IMPRESSIONS                │  ← muted label
│                                          │
│  1,284,392   ▲ 14.2%                    │  ← big number + delta
│                                          │
│  vs. previous 30 days                   │  ← muted caption
└──────────────────────────────────────────┘
```

**Delta arrow rules:**
- Positive: `▲` in `#1A6B3A` (forest green)
- Negative: `▼` in `#8B1F2A` (crimson)
- Neutral/zero: `—` in `#8A8A8A`

---

### Badges & Status Chips

```
Font:        11px / weight 500 / UPPERCASE / tracking 0.08em
Padding:     3px 8px
Radius:      6px
Dot:         5px circle, same color as text, inline left
```

| Status | Background | Text | Dot |
|---|---|---|---|
| Active | `#EFF7F3` | `#1A6B3A` | `#1A6B3A` |
| Draft | `#FDF8F2` | `#B5690A` | `#B5690A` |
| Error | `#FDF3F4` | `#8B1F2A` | `#8B1F2A` |
| Pending | `#F5F5F5` | `#4A4A4A` | `#8A8A8A` |
| Sent | `#F7F6FD` | `#3D3DA6` | `#3D3DA6` |

```
● ACTIVE     ● DRAFT     ● ERROR     ● PENDING
```

---

### Tables

```
Header row:
  Background: #F7F6F4
  Text:       11px / weight 500 / UPPERCASE / #8A8A8A / tracking 0.08em
  Padding:    12px 16px
  Border-bottom: 1px solid #E8E8E8

Body row:
  Background: #FFFFFF
  Text:       14px / #0A0A0A
  Padding:    14px 16px
  Border-bottom: 1px solid #E8E8E8

Hover row:   background #F7F6F4   (transition 80ms)
Selected row: background #FDF8F2  (warm amber tint)
```

```
┌──────────────┬────────────┬──────────┬──────────┐
│ CLIENT        │ LAST SENT  │ STATUS   │ ACTIONS  │
├──────────────┼────────────┼──────────┼──────────┤
│ Acme Corp     │ 12 Mar     │ ● ACTIVE │  Edit    │
│ Blue Media    │ 8 Mar      │ ● DRAFT  │  Edit    │
└──────────────┴────────────┴──────────┴──────────┘
```

---

### Navigation (Sidebar)

```
Width:            240px
Background:       #FFFFFF
Border-right:     1px solid #E8E8E8

Logo area:        height 56px, border-bottom 1px solid #E8E8E8

Nav item:
  Padding:        8px 12px
  Radius:         6px
  Font:           14px / weight 400 / #4A4A4A
  Icon:           16px

Nav item (active):
  Background:     #FDF8F2
  Text:           #C17B2F / weight 500
  Icon:           #C17B2F
  Left indicator: 2px solid #C17B2F (on left edge)

Nav item (hover):
  Background:     #F7F6F4
  Text:           #0A0A0A

Section label:
  11px / weight 500 / UPPERCASE / #8A8A8A / tracking 0.08em
  Padding:        12px 12px 4px
```

---

### Toasts / Notifications

```
Width:       320px (fixed)
Radius:      8px
Padding:     14px 16px
Shadow:      0 4px 16px rgba(0,0,0,0.10)
Border:      1px solid #E8E8E8
Background:  #FFFFFF

Icon:        20px, left-aligned, color matches type
Title:       14px / weight 500 / #0A0A0A
Body:        13px / #4A4A4A
Close:       top-right corner, 16px × 16px

Types:
  Success — left border 3px solid #1A6B3A
  Error   — left border 3px solid #8B1F2A
  Warning — left border 3px solid #B5690A
  Info    — left border 3px solid #C17B2F
```

---

### Modals / Dialogs

```
Overlay:      rgba(0, 0, 0, 0.40)
Panel:        background #FFFFFF, radius 12px, max-width 480px
              shadow: 0 8px 32px rgba(0,0,0,0.10)
              border: 1px solid #E8E8E8

Header:       H2 title + close button (top-right)
              padding: 24px 24px 0
Border:       1px solid #E8E8E8 between header and body
Body:         padding 24px
Footer:       padding 16px 24px
              right-aligned: [Secondary] [Primary]
```

---

### Empty States

```
Layout:   centered, vertical stack, max-width 320px
Icon:     40px, color #E8E8E8 (outlined, not filled)
Title:    20px / weight 600 / #0A0A0A  (margin-top 16px)
Body:     15px / #8A8A8A              (margin-top 8px)
CTA:      Primary button              (margin-top 24px)
```

---

### Dividers

```
Horizontal: 1px solid #E8E8E8
Vertical:   1px solid #E8E8E8 (in flex/grid rows)

With label (section break):
  Line ——— TEXT ——— Line
  Text: 11px / weight 500 / UPPERCASE / #8A8A8A
```

---

### Loading States

No spinners. Use skeleton screens.

```
Skeleton element:
  Background:   #F7F6F4
  Radius:       matches element it replaces
  Animation:    pulse opacity 0.5 → 1.0, 1.2s ease-in-out infinite
```

---

## Interaction Principles

1. **Transitions**: 120–180ms ease. Never animated color changes on text.
2. **Hover**: Subtle background tint (`#F7F6F4`). No scale transforms on data elements.
3. **Focus**: Always visible — amber `2px` outline. Never remove focus rings.
4. **Active/pressed**: `scale(0.99)` on buttons only, not cards.
5. **No decorative animation**: This is a work tool. Animate only to communicate state change.

---

## Anti-Patterns

> These styles are explicitly **forbidden** in this design system.

| ❌ Do Not | ✓ Use Instead |
|---|---|
| Gradients on any UI surface | Flat fills |
| Glassmorphism / blur effects | Solid white backgrounds |
| Colored shadows | No shadow, or `rgba(0,0,0,0.06)` only |
| Neon / vibrant accent colors | Cognac amber `#C17B2F` only |
| All-caps headings | All-caps labels only (11px) |
| Multiple accent colors | Single accent `#C17B2F` |
| Rounded corners > 12px | Max `radius-card` at 12px |
| Animations > 200ms | 120–180ms transitions |
| Dark mode variants | Light mode only |

---

## CSS Variables Reference

```css
:root {
  /* Colors */
  --color-bg:              #FFFFFF;
  --color-surface:         #F7F6F4;
  --color-text-primary:    #0A0A0A;
  --color-text-secondary:  #4A4A4A;
  --color-text-muted:      #8A8A8A;
  --color-border:          #E8E8E8;
  --color-accent:          #C17B2F;
  --color-accent-hover:    #A86826;
  --color-accent-subtle:   #FDF8F2;
  --color-success:         #1A6B3A;
  --color-success-subtle:  #EFF7F3;
  --color-error:           #8B1F2A;
  --color-error-subtle:    #FDF3F4;
  --color-warning:         #B5690A;
  --color-warning-subtle:  #FDF8F2;

  /* Typography */
  --font-sans:    'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing */
  --sp-1: 4px;   --sp-2: 8px;   --sp-3: 12px;  --sp-4: 16px;
  --sp-5: 24px;  --sp-6: 32px;  --sp-7: 48px;  --sp-8: 64px;

  /* Radius */
  --radius-sm:    4px;
  --radius-md:    6px;
  --radius-input: 6px;
  --radius-card:  12px;
  --radius-btn:   8px;

  /* Transitions */
  --transition-fast:   120ms ease;
  --transition-base:   160ms ease;
}
```

---

*Reportly Design System — v1.0 — March 2026*
