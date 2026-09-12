---
name: neo-brutalist-design-system
description: Authoritative Industrial Neo-Brutalist Design System rules, tokens, component templates, and prohibited patterns for the TwinSec Cyber-Physical platform.
---

# INDUSTRIAL NEO-BRUTALIST DESIGN SYSTEM // AGENT RULES & DIRECTIVES

## v2.1 — TwinSec Cyber-Physical & Tactile Industrial Brutalism

> **AUTHORITATIVE MANDATE FOR ALL AI CODING AGENTS** (Antigravity, Gemini, Claude, Cursor, Copilot)
>
> This document is the **single source of truth** for every visual, layout, and interactive decision in the TwinSec codebase. It supersedes generic aesthetic defaults, pastel template habits, and non-project conventions.
>
> **Brand & Purpose:** TwinSec is a living cyber-physical simulation platform for industrial operators (SCADA / ICS / OT). The aesthetic is **Industrial Neo-Brutalist**: raw, high-contrast, tactile, and systematic.

---

## 1. CORE DIRECTIVES

1. **Thick Structural Strokes & Rules:** Every container, card, button, input, badge, and modal gets a crisp `border-2 border-rule` or `border-2 border-black` (or `border-2 border-accent` when accented).
2. **Squared Corners Everywhere:** All radii are `0px` (`rounded-none`). Rounded cards, rounded inputs, and rounded buttons are strictly prohibited.
3. **Narrow Geometric Exception (`rounded-full`):** Circular geometry is permitted ONLY for:
   - User avatar profile images (`<Avatar className="rounded-full">`)
   - Numbered step badges (`①`, `②`, `③` or `[1]`, `[2]`, `[3]`)
   - Real-time status/presence telemetry pulse dots (`size-2 rounded-full bg-accent animate-pulse-dot`)
4. **Authentic TwinSec Industrial Palette:**
   - **Primary Accent:** Acid Lime (`oklch(0.86 0.24 125)` / `#bfff2e` / `var(--accent)`) — primary actions, active telemetry, high-priority nodes.
   - **Industrial Amber:** Industrial Yellow (`oklch(0.82 0.2 85)` / `var(--warn)`) — warnings, caution indicators, watch levels.
   - **Safety Orange / Danger Red:** Alert Red (`oklch(0.65 0.25 28)` / `var(--danger)` / `var(--destructive)`) — SCRAM, breaches, critical threats, destructive buttons.
   - **Background:** Industrial Deep Charcoal (`oklch(0.14 0.005 240)` / `bg-background`) — SOC / OT terminal room default canvas.
   - **Foreground:** High-Visibility Bone White (`oklch(0.97 0.005 90)` / `text-foreground`).
   - **Rule / Grid Border:** High-Contrast Dark Grid Border (`oklch(0.3 0.01 240)` / `border-rule` / `var(--rule)`).
   - **Dossier Paper:** Physical incident manuals and field report callouts use `--paper` (`oklch(0.96 0.01 90)`) and `--bone` (`oklch(0.88 0.01 80)`).
5. **Physical Elevation (Never Fake Blur):** No `blur()`, `backdrop-blur`, or diffuse drop-shadows (`shadow-md`, `shadow-lg`). Elevation is achieved solely through hard, crisp offset shadows:
   - Default / Component: `shadow-comic` (`4px 4px 0 0 #000000`) or `shadow-[4px_4px_0px_#000000]`
   - Accent Highlight: `shadow-comic-accent` (`4px 4px 0 0 var(--accent)`)
   - Hero / Modal / Deck: `shadow-[6px_6px_0px_#000000]` or `shadow-[12px_12px_0px_#000000]`
6. **One Primary Action Per View:** Never place multiple competing high-intensity primary buttons in the same viewport. The hierarchy must be unambiguous: one `Primary Accent Filled`, others `Outline Secondary` or `Ghost`.
7. **Strict Multi-Column Grid Alignment:** Use rigid grid boundaries with hairline separators (`hairline`, `grid-bg`, `border-b border-rule`).
8. **Tokens, Never Ad-hoc Literals:** Always use defined CSS custom properties and Tailwind v4 utilities (`bg-accent`, `text-accent-foreground`, `border-rule`, `shadow-comic`).

---

## 2. DESIGN TOKENS (TAILWIND CSS v4)

In TwinSec (`src/styles.css`), Tailwind v4 `@theme inline` and CSS variables define the token system:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-warn: var(--warn);
  --color-danger: var(--danger);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-paper: var(--paper);
  --color-ink: var(--ink);
  --color-bone: var(--bone);
  --color-rule: var(--rule);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);

  --font-display: "Bebas Neue", "Anton", Impact, sans-serif;
  --font-serif: "Instrument Serif", Georgia, serif;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --radius-sm: 0px;
  --radius-md: 0px;
  --radius-lg: 0px;
}

:root {
  --background: oklch(0.14 0.005 240);
  --foreground: oklch(0.97 0.005 90);
  --paper: oklch(0.96 0.01 90);
  --ink: oklch(0.12 0.005 240);
  --bone: oklch(0.88 0.01 80);
  --rule: oklch(0.3 0.01 240);
  --muted: oklch(0.2 0.01 240);
  --muted-foreground: oklch(0.65 0.02 240);
  --accent: oklch(0.86 0.24 125); /* acid lime */
  --accent-foreground: oklch(0.12 0.005 240);
  --warn: oklch(0.82 0.2 85); /* industrial yellow */
  --danger: oklch(0.65 0.25 28); /* safety orange/red */
  --border: oklch(0.28 0.01 240);
  --card: oklch(0.16 0.005 240);
  --card-foreground: oklch(0.97 0.005 90);
}
```

---

## 3. TYPOGRAPHY HIERARCHY

| Style Level                | Class Utility                                                                        | Usage                                             |
| -------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| **Display Hero (H1)**      | `display text-[12vw] lg:text-[135px] leading-[0.82] uppercase`                       | Top hero titles, high-impact statements           |
| **Section Header (H2)**    | `font-mono text-xl sm:text-2xl font-black uppercase tracking-wider text-foreground`  | Major deck headers, module titles                 |
| **Card Header (H3/H4)**    | `display text-2xl sm:text-3xl tracking-tight leading-tight text-foreground`          | Container and subnet card headings                |
| **Editorial Lead**         | `font-serif text-2xl md:text-3xl leading-[1.15] text-foreground/90 italic`           | Field manual quotes, scenario narrative leads     |
| **Body Copy**              | `font-sans text-sm md:text-base leading-relaxed text-foreground/90`                  | Technical scenario details, operator explanations |
| **Telemetry / Mono Label** | `mono-label` (`font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground`) | Sensor readings, ICS tags, node metrics           |

---

## 4. COMPONENT STATES (MANDATORY COVERAGE)

Every interactive component MUST define all applicable states:

| State                | Required Styling Treatment                                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Default**          | Solid background (`bg-accent` or `bg-card` or `bg-background`), `border-2 border-rule` or `border-2 border-black`, `shadow-comic`            |
| **Hover**            | Visible shift: `hover:bg-accent/90`, `hover:border-accent`, or `hover:-translate-y-0.5`                                                      |
| **Active / Pressed** | `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none` (physical tactile push)                                               |
| **Focus-Visible**    | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background` |
| **Disabled**         | `disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none`                                          |
| **Loading**          | Mono status text (`[PROCESSING...]` or `[CALCULATING VECTOR...]`) + full size preservation (no layout jump)                                  |
| **Error (Inputs)**   | `border-2 border-danger text-danger`, with error label `p.mono-label.text-danger` directly beneath and `aria-invalid="true"`                 |
| **Empty State**      | Bordered `border-2 border-rule border-dashed p-8 text-center font-mono uppercase text-muted-foreground`                                      |

---

## 5. STANDARD COMPONENT TEMPLATES

### 5.1 Button — Primary Accent (Acid Lime)

```tsx
<button
  className="min-h-[44px] h-11 px-6 bg-accent text-accent-foreground font-mono text-xs font-black uppercase tracking-wider
             border-2 border-black shadow-comic-accent
             hover:bg-accent/90 hover:brightness-105
             active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
             disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background
             transition-all cursor-pointer flex items-center justify-center gap-2"
>
  <Zap className="size-4 stroke-[2.5]" />
  <span>LAUNCH DRILL</span>
</button>
```

### 5.2 Button — Outline Secondary

```tsx
<button
  className="min-h-[44px] h-11 px-6 bg-background text-foreground font-mono text-xs font-bold uppercase tracking-wider
             border-2 border-rule shadow-comic
             hover:bg-accent hover:text-accent-foreground hover:border-accent
             active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
             disabled:opacity-40 disabled:cursor-not-allowed
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
             transition-all cursor-pointer"
>
  VIEW SCHEMATIC
</button>
```

### 5.3 Button — Destructive / Emergency SCRAM

```tsx
<button
  className="min-h-[44px] h-11 px-6 bg-destructive text-destructive-foreground font-mono text-xs font-black uppercase tracking-wider
             border-2 border-destructive shadow-comic
             hover:bg-destructive/90
             active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
             disabled:opacity-40 disabled:cursor-not-allowed
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive
             transition-all cursor-pointer flex items-center justify-center gap-2"
>
  <AlertTriangle className="size-4 stroke-[2.5]" />
  <span>EMERGENCY SCRAM</span>
</button>
```

### 5.4 Card Container / Telemetry Deck

```tsx
<div className="rounded-none border-2 border-rule bg-card text-card-foreground p-6 shadow-comic space-y-4">
  <div className="flex items-center justify-between border-b border-rule pb-3">
    <div className="flex items-center gap-2">
      <span className="size-2 bg-accent rounded-full animate-pulse-dot" />
      <span className="mono-label !text-foreground font-bold">SUBSTATION-07 TELEMETRY</span>
    </div>
    <span className="px-2 py-0.5 border border-accent bg-black text-accent font-mono text-[10px] font-bold">
      ONLINE · 60.02 Hz
    </span>
  </div>
  <h3 className="display text-2xl text-foreground">GRID FREQUENCY STABILITY</h3>
  <p className="font-sans text-sm text-muted-foreground">
    Continuous waveform analysis across 14 breaker nodes under Industroyer2 emulation.
  </p>
</div>
```

### 5.5 Input Field (with Error & A11y Wiring)

```tsx
<div className="space-y-1">
  <label htmlFor="callsign-input" className="mono-label block">
    OPERATOR CALLSIGN
  </label>
  <input
    id="callsign-input"
    aria-invalid={hasError}
    aria-describedby={hasError ? "callsign-error" : undefined}
    className={cn(
      "min-h-[44px] h-11 w-full rounded-none bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground",
      "border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
      hasError ? "border-danger text-danger" : "border-rule focus:border-accent",
    )}
    placeholder="CALLSIGN (e.g. OP-SPECTRE)"
  />
  {hasError && (
    <p id="callsign-error" className="font-mono text-xs uppercase text-danger mt-1">
      {errorMessage}
    </p>
  )}
</div>
```

### 5.6 Badge / Incident Tape

```tsx
<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black bg-accent text-accent-foreground font-mono text-[10px] font-black uppercase shadow-[2px_2px_0px_#000000]">
  <span className="size-1.5 bg-black rounded-full" />
  CRITICAL THREAT
</span>
```

---

## 6. TEXTURES & REAL INDUSTRIAL SIGNALS

Depth and sensory tactile feel come from mathematically rendered CSS utilities, not bloated image files:

- **Grid Background:** `grid-bg` — subtle 80px hairline grid representing architectural blueprints / SCADA schematics.
- **CRT Scanline:** `scanline` — applied strictly to live telemetry, SimTerminal, or real-time simulation output.
- **Hairline Rule:** `hairline` — 1px dark hairline divider separating data rows.

---

## 7. MOTION & ACCESSIBILITY RULES

1. **Permitted Animations Only:** Animate `transform` (`translate`, `scale`) and `opacity` only. NEVER animate `width`, `height`, `top`, `left`, `margin`, or `padding` (prevents browser reflow stutters).
2. **Mandatory Reduced Motion Support:**
   ```css
   @media (prefers-reduced-motion: reduce) {
     *,
     *::before,
     *::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```
3. **Minimum Hit Target Area:** All interactive controls (buttons, inputs, clickable badges, drawer toggles) MUST satisfy `min-h-[44px]` (or `h-11` / `size-11` for icon-only buttons).
4. **Keyboard Accessibility:** All custom interactive containers must support keyboard navigation (`tabIndex={0}`, `onKeyDown` for Enter/Space, and visible focus rings).

---

## 8. STRICT PROHIBITIONS ("DO NOT USE")

- ❌ `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`
- ❌ Blurred shadows (`shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`)
- ❌ Glassmorphism, translucency, or `backdrop-blur-*`
- ❌ Generic pastel poster palettes (baby blue, soft pink, generic web teal/magenta templates)
- ❌ Low-contrast grey borders (`border-gray-200`, `border-border/40`)
- ❌ `focus:outline-none` without an explicit high-contrast replacement ring
- ❌ Multiple competing primary accent buttons on the same screen
- ❌ Hardcoded random hex values in components where tokens exist (`var(--accent)`, `border-rule`, etc.)

---

## 9. AGENT BEHAVIORAL PROTOCOL & SELF-AUDIT

Before marking any UI task complete, the agent must verify:

- [ ] Every stroke is crisp `border-2` (`border-rule`, `border-black`, or `border-accent`) with `rounded-none`.
- [ ] Palette adheres strictly to TwinSec Industrial tokens (`accent` Acid Lime, `warn` Amber, `danger` Red, `background` Deep Charcoal).
- [ ] All interactive elements feature default, hover, active (push translate), focus-visible, and disabled states.
- [ ] Minimum touch/click target area is at least 44px (`min-h-[44px]`).
- [ ] No prohibited anti-patterns (rounded corners, blur shadows, glassmorphism) exist in the diff.
