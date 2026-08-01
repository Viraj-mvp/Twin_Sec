---
name: twinsec-project
description: TwinSec cyber-physical simulation platform — architecture reference, known patterns, gotchas, and troubleshooting. Use when working on the twinsec codebase.
---

# TwinSec Project Skill

## When to Use

- Any task touching the `twinsec` workspace (d:\PRJ-7\twinsec)
- Debugging auth, simulation, AI, or routing issues
- Adding features or fixing bugs in the project

## Tech Stack

- **Framework**: TanStack Start (React 19 + SSR) with Vite 7
- **Routing**: TanStack Router (file-based, `src/routes/`)
- **Styling**: Tailwind CSS v4 (brutalist/neo-editorial design)
- **Database**: SQLite via better-sqlite3 + Drizzle ORM
- **AI**: Multi-provider via Vercel AI SDK (`@ai-sdk/openai-compatible`)
- **Animations**: GSAP 3.15 (scroll reveals, text scramble, menu animations)
- **3D**: Three.js / React Three Fiber (facility pages only)
- **Auth**: Cookie-based sessions (bcrypt, 7-day expiry)

## Architecture Overview

```
src/
├── routes/          # File-based routing (TanStack Start)
│   ├── __root.tsx   # Root layout: QueryClient, OperatorProvider, KineticOperatorNav
│   ├── index.tsx    # Landing page (editorial sections)
│   ├── simulation.tsx # Core simulation engine & scenario player
│   ├── twin-engine.tsx # Facility index & selection
│   ├── facility.$id.tsx # Per-facility detail page
│   ├── login.tsx    # Auth sign-in page
│   ├── signup.tsx   # Auth registration page
│   └── dashboard.tsx # Operator dashboard
├── features/
│   ├── auth/index.ts    # Re-exports from lib/auth-store, lib/api/auth.functions, contexts/OperatorContext
│   └── simulation/index.ts # Re-exports simulation components & data
├── components/
│   ├── simulation/  # 16 simulation sub-components
│   ├── ui/          # shadcn/ui primitives
│   ├── KineticOperatorNav.tsx # Global slide-out menu (GSAP animated)
│   └── CyberMatrixTrigger.tsx # Nav trigger button
├── lib/
│   ├── api/         # Server functions (createServerFn)
│   ├── db/          # SQLite + Drizzle schema + auto-migrations
│   ├── auth.server.ts # Session cookie handling
│   ├── ai-providers.server.ts # Multi-provider AI gateway
│   └── auth-store.ts # Client-side session + preferences (localStorage)
├── data/            # Static scenario data (scenarios.ts, threat-actors.ts, etc.)
├── contexts/        # React contexts (OperatorContext, EventStoreContext)
└── hooks/           # Custom hooks (GSAP, text animation, attack simulation)
```

## Known Gotchas

### 1. Dual Session System

There are TWO independent session mechanisms:

- `useOperatorSession()` from `lib/auth-store.ts` — reads localStorage + fires server fetch
- `useOperator()` from `contexts/OperatorContext.tsx` — fires server fetch only

Both call `getOperatorSession()` on mount. Components pick whichever is logged in first:

```ts
const activeSession = contextOperator?.loggedIn ? contextOperator : session;
```

**Rule**: Always prefer `useOperator()`. The `useOperatorSession()` hook is legacy.

### 2. Duplicate CyberMatrixTrigger

Two components share this name:

- `src/components/CyberMatrixTrigger.tsx` — the nav menu trigger button (used in KineticOperatorNav)
- `src/components/simulation/KaliTerminal.tsx` L192 — a floating CLI circle button (exported alongside KaliTerminal)

The `@features/simulation` barrel re-exports the KaliTerminal version.
**Rule**: The KaliTerminal one should be renamed to `TerminalFAB`.

### 3. AI Timeouts

`ai-providers.server.ts` uses `PRIMARY_TIMEOUT_MS`. Free-tier providers (Groq, OpenRouter) need 3-15s.
If AI calls always fail, check this timeout first.

### 4. SQLite Auto-Migration

`db.ts` runs raw SQL `CREATE TABLE IF NOT EXISTS` on startup + `autoMigrateTable()` for column additions.
No Drizzle migrations are used. Schema changes must be added both to `schema.ts` AND `db.ts`.

### 5. Server Functions

All API calls use `createServerFn()` from `@tanstack/react-start`. These are RPC calls, not REST endpoints.
Cookie reading uses `getRequestHeader("cookie")` from `@tanstack/react-start/server` (NOT Nitro's getEvent).

### 6. Build Chunks

`vite.config.ts` defines manual chunks for jspdf, three.js, gsap, recharts to keep bundle sizes manageable.
`chunkSizeWarningLimit` is set to 2000KB.

## Common Debug Patterns

### "AI features don't work"

1. Check `.env` has at least one valid API key (GROQ_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY)
2. Check `PRIMARY_TIMEOUT_MS` in `ai-providers.server.ts` — if too low, all calls time out
3. Check `hasValidKeys()` — returns false if no env vars set

### "Login doesn't persist"

1. Session cookie (`twinsec_session`) is HttpOnly — check browser dev tools > Application > Cookies
2. `setSessionCookie()` uses `setResponseHeader()` which only works inside server function context
3. Client also saves to localStorage via `saveLocalSession()` — check for stale data

### "Simulation doesn't load"

1. Check `?sector=` query param is one of: power, water, oil-gas, manufacturing, port, smart-building, smart-city
2. Check `getScenarioData(sector)` in `data/scenarios.ts` returns nodes/events/decisions
3. Check schematic image import (`SCHEMATIC_LOADERS[sector]`) resolves

### Formatting/Lint

```bash
npm run format   # Prettier auto-fix
npm run lint     # ESLint check (125+ prettier/prettier errors if not formatted)
npm run lint -- --fix  # Auto-fix fixable lint errors
```

## Security Notes

- Passwords hashed with bcrypt (work factor 12)
- Sessions are random UUID tokens (72 chars), stored in SQLite, 7-day expiry
- Rate limiting is in-memory (Map) — resets on server restart
- AI input/output scrubbing via regex (shellcode, private keys, AWS keys)
- Cookie: HttpOnly, SameSite=lax, Secure in production
- **IMPORTANT**: `data/` directory containing SQLite DB should be in `.gitignore`
