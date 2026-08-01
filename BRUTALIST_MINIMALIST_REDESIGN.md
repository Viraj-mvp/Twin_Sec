# TWINSEC // BRUTALIST & MINIMALIST DESIGN SYSTEM & SPECIFICATION

This document details the architectural design system, layout structures, color palettes, typography rules, and component specifications for the **TwinSec** platform redesign, built upon **Neo-Brutalism** and **Raw Functional Minimalism**.

---

## 1. CORE DESIGN PHILOSOPHY

The aesthetic merges raw, functional industrial brutality with minimalist clarity:

- **Raw Architectural Structure**: High-contrast, unpolished structural layouts, visible grid lines (`grid-bg`), 1px hairline rules, and zero rounded corners (`--radius: 0px`).
- **Heavy Blocky Offset Shadows**: Sharp `4px 4px 0 0 #000000` (`shadow-comic`) and `8px 8px 0 0 var(--color-accent)` (`shadow-brutal`) shadows without blurs.
- **Monochrome & High-Visibility Accents**: Stark black/charcoal surfaces offset with Acid Lime (`oklch(0.86 0.24 125)` / `#bfff2e`), Warning Amber, and Danger Red.
- **Strict Geometric Precision**: Sharp square corner brackets, rectangular badges, uppercase monospace indicators, and crisp borders (`border-2`).

---

## 2. DESIGN TOKENS & SYSTEM SPECIFICATIONS

### Color Palette (OKLCH)

- **Background**: `oklch(0.14 0.005 240)` — Industrial Deep Charcoal
- **Foreground**: `oklch(0.97 0.005 90)` — High-Visibility Bone White
- **Paper**: `oklch(0.96 0.01 90)` — Technical Raw Document Background
- **Accent**: `oklch(0.86 0.24 125)` — Acid Lime (`#bfff2e`)
- **Warn**: `oklch(0.82 0.2 85)` — Industrial Yellow
- **Danger**: `oklch(0.65 0.25 28)` — Safety Orange / Alert Red
- **Rule / Border**: `oklch(0.28 0.01 240)` — High-Contrast Dark Grid Border

### Typography Hierarchy

- **Display Headings**: `"Bebas Neue", "Anton", Impact, sans-serif`
  - Uppercase, compressed line-height (`0.85`), tight letter-spacing.
- **Monospace Telemetry & Labels**: `"JetBrains Mono", ui-monospace, monospace`
  - Uppercase, wide letter-spacing (`0.18em`), 10px-12px size for metadata, badge IDs, and status indicators.
- **Serif Quotes / Dossier Notes**: `"Instrument Serif", Georgia, serif`
  - Used strictly for psychological threat quotes, behavioral insights, and officer statements.
- **Body Text**: `"Inter", system-ui, sans-serif`
  - Clean, unadorned sans-serif for long-form reading.

---

## 3. PAGES & COMPONENTS OUTLINE

### 3.1 Home Page

- **Hero Section**:
  - **Layout**: Full-width grid container (`grid-bg`) with 1px hairline rules. Large scale `display` title (`TWINSEC CYBER-PHYSICAL RANGE`) with an acid lime highlight.
  - **Interactive Elements**: Dual CTA buttons (`LAUNCH SIMULATION`, `EXPLORE RANGE`) with sharp 2px black borders and acid-lime offset shadows (`shadow-comic-accent`).
  - **Telemetry Ticker**: Infinite scrolling ticker with operational status metrics, anomaly alerts, and threat vectors.
- **Sector Grid**:
  - **Layout**: 3-column sharp card matrix representing power grid, water treatment, oil refinery, smart city, and maritime port digital twins.
  - **Card Aesthetic**: 2px stark rule borders, zero border-radius, hover border glow in acid lime, square status dot (`[ONLINE]`).

### 3.2 About Page (Platform Dossier)

- **Manifesto & Mission**:
  - **Layout**: Single-column narrow reading deck flanked by structural grid guide lines.
  - **Typography**: Large serif quotes paired with monospace tactical headers (`// MISSION STATEMENT`).
  - **Interactive Elements**: Expandable timeline of ICS/SCADA cyber-physical incidents (Stuxnet, Industroyer, Triton) rendered in stark black accordion blocks with zero border-radius.

### 3.3 Contact & Support Page (Operator Helpdesk)

- **Interface Deck**:
  - **Form Layout**: 2-column brutalist form container with crisp monospace labels (`CALLSIGN`, `FACILITY ID`, `TELEMETRY LOG`).
  - **Input Styling**: Sharp rectangular input boxes with dark background, 1px/2px high-contrast rule borders, zero border-radius, and crisp acid lime focus outlines (`focus:border-accent`).
  - **Submit Button**: Full-width high-contrast acid lime button (`shadow-comic-accent`), active offset click effect (`active:translate-x-1 active:translate-y-1`).

### 3.4 Services & Products Section (Cyber Range Index)

- **Product Matrix**:
  - **Digital Twin Engine**: Interactive sector selector with real-time PLC/SCADA simulation parameters.
  - **Mindhunter BAU Dossiers**: FBI Behavioral Analysis Unit threat actor psychological profiles.
  - **Encrypted Training Ledger**: Immutable audit trail of completed operator drills.
  - **Card Design**: Blocky zero-radius cards with sharp hard shadows, monospace tag overlays, and direct action triggers.

---

## 4. KEY COMPONENT REFACTORS & STANDARDIZATION

### 4.1 Menu Button & Kinetic Operator Nav

- **Menu Trigger Button (`CyberMatrixTrigger`)**:
  - **Redesign**: Removed soft cyan sci-fi glows and angled polygon clip-paths. Replaced with sharp rectangular 2px border button with a 4px hard block shadow (`shadow-comic-accent`).
  - **Indicators**: Square status beacon and clean uppercase monospace label (`[OPERATOR MENU]`).
- **Kinetic Operator Drawer (`KineticOperatorNav`)**:
  - **Redesign**: Zero border-radius drawer container, sharp 2px dividing rules, high-contrast monospace links, and zero-radius user identity badges.

### 4.2 Login & Auth Deck (`LoginPage`)

- **Redesign**: Removed glassmorphic blurs, rounded 12px containers, and liquid blob physics (`#gooey`).
- **Brutalist Auth Panel**: Built around a sharp 2px bordered card (`shadow-comic-accent`) with a background grid, crisp rectangular tab switchers (`LOGIN` / `REGISTER`), sharp monospace input fields, and a high-contrast acid lime submit button.

### 4.3 Mindhunter Threat Profiles (`ThreatProfilesIndex` & `ThreatProfileDetail`)

- **Redesign**:
  - Replaced soft glowing red blurs and rounded badges with crisp 2px borders, square tags (`rounded-none`), and hard offset shadows (`shadow-comic-dark` / `shadow-comic-accent`).
  - Standardized background to use central design tokens (`bg-background`, `text-foreground`, `border-rule`).
  - Post-capture interrogation chat feed refactored into a sharp brutalist console with rectangular action buttons.

---

_TwinSec Design System Specification — Brutalism & Minimalism Redesign Document_
