# TwinSec Brand & Design Style Guide

Version: 3.1 · Last Updated: 2026-07-12

---

## 1. Core Identity

TwinSec is a cyber-physical simulation platform for industrial system operators. The brand communicates authority, technical precision, and urgency while maintaining a retro-futuristic industrial aesthetic.

### Taglines

- Primary: **"Attacks Don't Stay Digital."**
- Secondary: **"Rehearse the Next Incident."**
- Tertiary: **"Every Cable, Every Relay, Every Consequence."**

### Visual Principles

- **Contrast First**: High-contrast color pairs for readability in low-light control room environments
- **Industrial Brutalism**: Hard edges, blocky shadows, monospaced labels, and zero rounded corners
- **Grid Overlay**: Subtle 80x80 grid background for technical framing
- **Scanlines**: CRT/monitor-style scanline effects for retro-futuristic tech vibe
- **Text Animations**: Character-by-character reveal, word reveal, and digital scrambling for dynamic emphasis

---

## 2. Color Palette (OKLch)

All colors defined in OKLch for perceptual uniformity.

### Base Theme (Default)

| Token                 | Value                   | Description                                         |
| --------------------- | ----------------------- | --------------------------------------------------- |
| `--background`        | `oklch(0.14 0.005 240)` | Deep dark navy/blue background                      |
| `--foreground`        | `oklch(0.97 0.005 90)`  | High-brightness off-white for primary text          |
| `--paper`             | `oklch(0.96 0.01 90)`   | Off-white "paper" background for secondary sections |
| `--ink`               | `oklch(0.12 0.005 240)` | Dark text for paper sections                        |
| `--rule`              | `oklch(0.3 0.01 240)`   | Subtle border/rule color                            |
| `--muted`             | `oklch(0.2 0.01 240)`   | Muted background for secondary elements             |
| `--muted-foreground`  | `oklch(0.65 0.02 240)`  | Muted foreground text                               |
| `--accent`            | `oklch(0.86 0.24 125)`  | Acid lime green! (Primary highlight/CTA color)      |
| `--accent-foreground` | `oklch(0.12 0.005 240)` | Text on accent background                           |
| `--warn`              | `oklch(0.82 0.2 85)`    | Industrial yellow (warning level)                   |
| `--danger`            | `oklch(0.65 0.25 28)`   | Safety orange/red (critical level)                  |

### Alternative Themes

#### Theme: Amber

Warm dark amber palette for industrial/factory aesthetic.

- `--background`: `oklch(0.12 0.02 54)`
- `--foreground`: `oklch(0.85 0.12 70)`
- `--accent`: `oklch(0.78 0.18 70)`

#### Theme: Monochrome

Pure high-contrast black and white for maximum readability.

- `--background`: `oklch(0.08 0 0)`
- `--foreground`: `oklch(0.98 0 0)`
- `--accent`: `oklch(0.98 0 0)`

---

## 3. Typography

### Font Stacks

| Token            | Family           | Fallbacks                 | Use Case                            |
| ---------------- | ---------------- | ------------------------- | ----------------------------------- |
| `--font-display` | Bebas Neue       | Anton, Impact, sans-serif | Large, bold headings & display text |
| `--font-serif`   | Instrument Serif | Georgia, serif            | Body text, quotes, lead copy        |
| `--font-sans`    | Inter            | system-ui, sans-serif     | Default UI text, buttons            |
| `--font-mono`    | JetBrains Mono   | ui-monospace, monospace   | Labels, timestamps, code, telemetry |

### Custom Utilities

- `.display`: Bold display font, tight leading, all caps, used for large headings
- `.mono-label`: Small monospaced text, letter-spaced, all caps, muted color
- `.hairline`: 1px horizontal rule with `--rule` color

### Type Scale

- **Display**: 200px / 140px / 110px / 80px / 70px / 60px / 50px
- **Body Serif**: 3xl (2xl) / 2xl / xl / lg
- **UI Sans**: lg / md / sm / xs
- **Mono Labels**: xs / 10px

---

## 4. UI Components

### Buttons

- Variants: Default (solid accent), Outline, Secondary, Ghost, Link
- No rounded corners!
- Hover state swaps accent/foreground

### Cards

- Bordered with `--border`
- Solid `--card` background
- Shadow: Brutal (offset 8px, `--accent` color) or Brutal Ink (offset 8px, `--foreground` color)

### Badges

- Small, mono-label style
- Variants: Default, Secondary, Destructive, Outline

---

## 5. Background & Effects

### Grid Background

- 80x80 pixel grid with `--rule` color at 35% opacity
- Utility class: `.grid-bg`

### Scanlines

- Repeating linear gradient for CRT monitor effect
- Utility class: `.scanline`

### Animated Utilities

- `.animate-ticker`: Smooth infinite horizontal scroll (60s duration)
- `.animate-pulse-dot`: Soft pulse (1.6s ease-in-out)
- `.animate-reveal`: Slide-up + fade-in (0.9s cubic-bezier)

### Text Effects

- Scramble reveal: Text reveals with random character scrambling
- Split-char reveal: Individual character staggered reveal
- Word reveal: Per-word staggered reveal

---

## 6. Layout & Spacing

- Max width container: 1600px
- Base padding: 24px / 40px (mobile/desktop)
- Grid: 12-column responsive grid
- No rounded corners: `--radius-sm`, `--radius-md`, `--radius-lg` all set to 0

---

## 7. Accessibility

- High contrast ratios (at least 4.5:1 for body text)
- All interactive elements focusable
- Focus rings: 2px dashed `--accent`
- Text resizable up to 200%
- No content relies solely on color to convey information

---

## 8. Assets & Imagery

- Photos of real industrial facilities (substations, turbine halls, control rooms)
- Darkened/overlayed with brand colors for consistency
- Always include captions/figure numbers in mono-label style
- No stock "cyber security" imagery with generic hackers or padlocks

---

## 9. Tone of Voice

- **Authoritative**: Like a field manual or emergency bulletin
- **Precise**: Technical but not jargon-heavy; avoids hyperbole
- **Urgent but Calm**: Conveys seriousness without panic
- **First-Person Plural**: "We brief operators", "Bring your P&ID"
- **All Caps Mono Labels**: For section headers, timestamps, telemetry, IDs
- **Quotes in Italic Serif**: For operator testimonials, incident narratives
