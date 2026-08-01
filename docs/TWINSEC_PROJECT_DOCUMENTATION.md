# TwinSec Project Documentation

## Overview

TwinSec is a cyber-physical simulation platform for industrial operators. It provides digital twin environments for various critical infrastructure sectors, adversary emulation, and incident replay capabilities.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Routes & Pages](#routes--pages)
5. [Core Modules](#core-modules)
6. [Hooks](#hooks)
7. [API Functions](#api-functions)
8. [Configuration](#configuration)

---

## Project Structure

```
twinsec/
├── .vscode/
│   └── settings.json
├── src/
│   ├── assets/
│   │   ├── breaker.jpg
│   │   ├── facility.jpg
│   │   ├── manufacturing.jpg
│   │   ├── oil-gas.jpg
│   │   ├── port.jpg
│   │   ├── power.jpg
│   │   ├── schematic.jpg
│   │   ├── smart-building.jpg
│   │   └── smart-city.jpg
│   ├── components/
│   │   └── ui/ (shadcn/ui components)
│   ├── hooks/
│   │   ├── use-gsap-reveal.ts
│   │   ├── use-mobile.tsx
│   │   └── use-text-anim.ts
│   ├── lib/
│   │   ├── api/
│   │   │   ├── espionage.functions.ts
│   │   │   └── example.functions.ts
│   │   ├── ai-gateway.server.ts
│   │   ├── config.server.ts
│   │   ├── error-capture.ts
│   │   ├── error-page.ts
│   │   ├── error-reporting.ts
│   │   └── utils.ts
│   ├── routes/
│   │   ├── README.md
│   │   ├── __root.tsx
│   │   ├── def-con-brief.tsx
│   │   ├── espionage.tsx
│   │   ├── facility.$id.tsx
│   │   ├── field-reports.tsx
│   │   ├── index.tsx
│   │   ├── s4-talk.tsx
│   │   ├── simulation.tsx
│   │   ├── twin-engine.tsx
│   │   └── whitepapers.tsx
│   ├── routeTree.gen.ts
│   ├── router.tsx
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
├── .gitignore
├── .prettierignore
├── .prettierrc
├── bun.lock
├── bunfig.toml
├── components.json
├── eslint.config.js
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Tech Stack

- **Framework:** TanStack Start (React 19)
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui (built on Radix UI primitives)
- **Animations:** GSAP
- **AI:** Vercel AI SDK + AI Gateway
- **PDF Export:** jsPDF
- **Image Export:** html-to-image
- **Markdown Rendering:** react-markdown
- **Form Handling:** react-hook-form + zod

---

## Architecture

### Routing

Uses TanStack React Router for file-based routing. All route definitions are in `src/routes/`.

### State Management

- React Query for data fetching/caching
- Local React state for UI interactions

### Server-Side

- TanStack Start server functions (`createServerFn`) for API endpoints
- Server-side config is in `*.server.ts` files to prevent bundling into client

---

## Routes & Pages

### 1. Home Page (`src/routes/index.tsx`)

- Landing page with hero section, manifesto, attack surface, spread, replay, quote, dossier, closing, and footer
- Key features: Animated marquee, grid background, scanline effect

### 2. Twin Engine (`src/routes/twin-engine.tsx`)

- Facility selector with preview
- Facilities: Power, Water, Oil & Gas, Manufacturing, Port, Smart Building, Smart City
- Dependency graph visualization
- Activity stream

### 3. Facility Page (`src/routes/facility.$id.tsx`)

- Individual facility view
- Sections: Manifesto, living world topology, attack scenarios
- Dynamic world data based on facility ID

### 4. Simulation (`src/routes/simulation.tsx`)

- Live cyber-physical simulation
- Per-sector scenarios (HOLLOW, BASIN, SEVENTH BREATH, MISFIRE, MANIFEST, STILL-AIR, GRIDLOCK)
- Interactive decision branching
- Dossier export (PDF)
- Share link generation

### 5. Espionage Engine (`src/routes/espionage.tsx`)

- AI-generated nation-state espionage threat briefings
- MITRE ATT&CK for ICS mapping
- Defender coverage analysis
- PDF export

### 6. Field Reports (`src/routes/field-reports.tsx`)

- Declassified incident narratives
- 5 featured reports from 2026
- Exercise replay links

### 7. DEF CON Brief (`src/routes/def-con-brief.tsx`)

- DEF CON 33 talk page
- Schedule, presenter bios

### 8. S4 Talk (`src/routes/s4-talk.tsx`)

- S4x26 Miami talk page
- Talk segments, speaker info

### 9. Whitepapers (`src/routes/whitepapers.tsx`)

- Research papers
- 5 featured papers (2024-2026)

---

## Core Modules

### `src/lib/ai-gateway.server.ts`

- Creates an OpenAI-compatible provider for AI Gateway
- Used by espionage briefing generation

### `src/lib/utils.ts`

- `cn()` utility function for merging Tailwind classes (clsx + twMerge)

### `src/lib/error-capture.ts`

- Error capture utilities
- `src/lib/error-reporting.ts` - Error reporting integration
- `src/lib/error-page.ts` - Error page component

### `src/server.ts`

- Server entry point with SSR error handling wrapper
- Normalizes catastrophic SSR errors

---

## Hooks

### `useGsapReveal` (`src/hooks/use-gsap-reveal.ts`)

- Scroll-triggered reveal animation for elements with `[data-reveal]`
- Respects `prefers-reduced-motion`

### `useMobile` (`src/hooks/use-mobile.tsx`)

- Returns `true` when viewport is < 768px

### Text Animation Hooks (`src/hooks/use-text-anim.ts`)

1. `useSplitCharReveal`: Character-by-character reveal
2. `useScrambleReveal`: Scramble-text effect
3. `useWordReveal`: Word-by-word slide reveal

---

## API Functions

### `generateEspionageBriefing` (`src/lib/api/espionage.functions.ts`)

Server function to generate AI threat briefings.

**Input Zod Schema:**

```typescript
{
  sector: "power" |
    "water" |
    "oil-gas" |
    "manufacturing" |
    "port" |
    "smart-building" |
    "smart-city";
  adversary: string;
  objective: string;
  intensity: "reconnaissance" | "intrusion" | "persistence" | "exfiltration" | "full-chain";
  chain: "collection" | "infiltration" | "lateral-movement" | "disruption" | "full-spectrum";
}
```

**Safety Features:**

- Input scrubbing for sensitive patterns
- Output redaction (IPs, private keys, shellcode, etc.)
- Forces code blocks to be defanged
- System prompt enforces no runnable exploits

---

## Configuration

### `package.json`

Scripts:

- `dev`: Vite dev server
- `build`: Production build
- `preview`: Preview production build
- `lint`: ESLint
- `format`: Prettier

### `tsconfig.json`

- Target: ES2022
- Path alias: `@/*` → `src/*`
- Strict mode enabled

### `vite.config.ts`

- Uses `@lovable.dev/vite-tanstack-config` preset (kept for functionality)
- Custom server entry at `src/server.ts`

### Environment Variables

- `OPENROUTER_API_KEY`: Required for OpenRouter AI gateway access
