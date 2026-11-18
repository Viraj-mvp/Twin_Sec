# GEMINI.md — Instructions for Gemini & Antigravity Agents

> **Project:** TwinSec Cyber-Physical Range & Threat Platform  
> **Workspace:** `d:\PRJ-7\twinsec`

---

## 🎨 UI & DESIGN SYSTEM: INDUSTRIAL BRUTALISM

When working on UI or frontend code in TwinSec:

- **Style:** Industrial Neo-Brutalism (Bold, Raw, High-Contrast, Systematic).
- **Strokes:** 2px solid strokes (`border-2 border-rule` or `border-2 border-black`).
- **Corners:** Squared corners (`rounded-none` / `0px` radius).
- **Shadows:** Hard offset shadows only (`shadow-comic` / `4px 4px 0 0 #000000`, `shadow-comic-accent` / `4px 4px 0 0 var(--accent)`). NEVER use blur shadows.
- **Palette:**
  - **Primary Accent:** Acid Lime (`oklch(0.86 0.24 125)` / `#bfff2e` / `var(--accent)`)
  - **Industrial Amber:** Industrial Yellow (`oklch(0.82 0.2 85)` / `var(--warn)`)
  - **Alert Red / Orange:** Danger Red (`oklch(0.65 0.25 28)` / `var(--danger)`)
  - **Background:** Industrial Deep Charcoal (`oklch(0.14 0.005 240)` / `bg-background`)
  - **Foreground:** High-Visibility Bone White (`oklch(0.97 0.005 90)` / `text-foreground`)
  - **Rule / Grid:** Dark Charcoal Rule (`oklch(0.3 0.01 240)` / `border-rule`)
- **Hit Areas:** All interactive controls must have at least `44px` touch/click target area (`min-h-[44px]` or `h-11`).
- **Hierarchy:** One primary action per screen.

### 🚫 STRICT PROHIBITIONS:

- ❌ Do NOT use generic pink, baby blue, or yellow/teal poster templates.
- ❌ Do NOT use `rounded-md`, `rounded-lg`, `rounded-xl`, or rounded cards/buttons.
- ❌ Do NOT use blur shadows (`shadow-md`, `shadow-lg`, `shadow-xl`, `blur`).
- ❌ Do NOT use glassmorphism or `backdrop-blur`.
- ❌ Do NOT use subtle low-contrast grey borders or unbordered buttons.

---

## 🛠️ ENGINEERING PRINCIPLES

- Follow YAGNI & DRY. Reuse existing code in `src/components/ui/`, `src/lib/`, and `src/data/`.
- No unsanctioned git pushes.
- Session handling: Always use `useOperator()` context.
- Server APIs: Use `createServerFn()` from `@tanstack/react-start`.
