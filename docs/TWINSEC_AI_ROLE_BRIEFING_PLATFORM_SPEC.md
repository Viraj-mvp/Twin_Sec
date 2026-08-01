# TwinSec AI-Driven Role-Based Simulation Platform Specification

## Table of Contents

1.  [Executive Overview](#1-executive-overview)
2.  [System Architecture](#2-system-architecture)
3.  [Role Selection UX](#3-role-selection-ux)
4.  [AI-Driven Initial Briefing Module](#4-ai-driven-initial-briefing-module)
5.  [Phase-by-Phase Lifecycle Guidance Engine](#5-phase-by-phase-lifecycle-guidance-engine)
6.  [Intelligent Context-Sensitive Assistance](#6-intelligent-context-sensitive-assistance)
7.  [TypeScript Data Models & API Contracts](#7-typescript-data-models--api-contracts)
8.  [AI Prompt Library & Safety Guardrails](#8-ai-prompt-library--safety-guardrails)
9.  [UI/UX Flow & Wireframe Narrative](#9-uiux-flow--wireframe-narrative)
10. [Integration With Existing Codebase](#10-integration-with-existing-codebase)
11. [Validation, Metrics & Test Strategy](#11-validation-metrics--test-strategy)

---

## 1. Executive Overview

### 1.1 Purpose

This specification defines the AI-driven, user-oriented cybersecurity simulation
experience built on top of the existing TwinSec cyber-physical range engine. The
core experience requires that upon a user's explicit selection of a **Red Team**
(offensive operations / adversary analyst) or **Blue Team** (defensive operations /
incident responder) role, the system immediately presents a concise yet
comprehensive AI-generated briefing of a relevant attack scenario, then
progressively guides the user through each phase of the lifecycle with
intelligent, context-aware assistance.

### 1.2 Core Design Principles

| Principle                                                                                                                              | Rationale                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Role-First**                                                                                                                         | Every UX element, AI prompt, and metric is conditioned on `OperationalRole = RED \| BLUE`.                                               |
| **AI-as-Tutor**                                                                                                                        | AI never gives direct solutions unless HintLevel=3 (Socratic prompt → diagnostic question → contextual hint → step-by-step solution).    |
| **TTP-Grounded**                                                                                                                       | All briefings and guidance reference real MITRE ATT&CK tactics, sector-specific ICS-ATT&CK techniques, and real-world threat-actor TTPs. |
| **Physics-Respecting**                                                                                                                 | Guidance and decisions remain faithful to the `ScenarioData` topology in [scenarios.ts](file:///d:/PRJ-7/twinsec/src/data/scenarios.ts). |
| **Lazy + Auth-Gated**                                                                                                                  | All AI calls happen server-side through the existing lazy authentication gate                                                            |
| ([SimulationAuthGate.tsx](file:///d:/PRJ-7/twinsec/src/components/SimulationAuthGate.tsx)). Guest sessions are unrecorded and debriefs |
| are watermarked per project constraints.                                                                                               |
| **SSR-Safe**                                                                                                                           | No mutable module-scope state; AI calls are side-effect-free server functions.                                                           |
| **Defanged-By-Default**                                                                                                                | All AI textual output containing command examples, IPs, tokens, or exploit                                                               |
| artefacts passes through the existing `scrubOutput()` pipeline defined in                                                              |
| [enhanced-simulation.functions.ts](file:///d:/PRJ-7/twinsec/src/lib/api/enhanced-simulation.functions.ts#L68-L149).                    |

### 1.3 Scope Matrix: 7 Sectors × 2 Roles × 7 Kill-Chain Phases

The system operates over the 7 sectors already modelled:

| Sector ID        | Scenario Code  | Red Team Focus (Offensive)                       | Blue Team Focus (Defensive)                         |
| ---------------- | -------------- | ------------------------------------------------ | --------------------------------------------------- |
| `power`          | HOLLOW         | Trip-coil tampering, ladder-logic overwrites     | DNP3 anomaly detection, SIS monitoring              |
| `water`          | BASIN          | Chlorine setpoint walk, OPC-UA credential replay | Grab-sample verification, SIS bypass detection      |
| `oil-gas`        | SEVENTH-BREATH | Anti-surge margin trimming, SIL-3 solver disarm  | ESD hardwire procedures, DeltaV domain isolation    |
| `manufacturing`  | MISFIRE        | Vision model swap, reject-diverter disable       | QA hash verification, torque profile drift alerting |
| `port`           | MANIFEST       | EDIFACT replay, hazmat register manipulation     | BAPLIE reconciliation, ORBCOMM direct feed          |
| `smart-building` | STILL-AIR      | BACnet whois sweeps, door schedule rewrite       | Desigo pin-to-hardware, man-trap reversion          |
| `smart-city`     | GRIDLOCK       | OSPF injection, MQTT default-cred usage          | Field fallback, EMS radio-only fallback             |

---

## 2. System Architecture

### 2.1 Layered Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER (Client)                        │
│  ┌────────────┐ ┌────────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ PathSelector│ │ BriefingPanel  │ │PhaseGuidance │ │HintAssistant │ │
│  │ (RED/BLUE)  │ │ (AI overview)  │ │ (per-phase)  │ │ (4 levels)   │ │
│  └─────┬──────┘ └────────┬───────┘ └──────┬───────┘ └──────┬───────┘ │
└────────┼─────────────────┼────────────────┼────────────────┼─────────┘
         │ React 19 + TanStack Router + Tailwind v4              │
         ▼                                                        ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  ORCHESTRATION LAYER (Server Fns)                    │
│  ┌──────────────────────┐  ┌────────────────────────────────────┐   │
│  │ generateRoleBriefing │  │ generatePhaseGuidance              │   │
│  │ (AITask = briefing)  │  │ (AITask = phase_guidance)         │   │
│  └──────────┬───────────┘  └──────────────┬────────────────────┘   │
│             │                              │                        │
│  ┌──────────┴───────────┐  ┌──────────────┴────────────────────┐   │
│  │ generateContextHint  │  │ generateDiagnosticQuestions       │   │
│  │ (AITask = hint)      │  │ (AITask = hint)                   │   │
│  └──────────┬───────────┘  └──────────────┬────────────────────┘   │
└─────────────┼─────────────────────────────┼────────────────────────┘
              │                             │
              ▼                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  AI GATEWAY LAYER (ai-providers.server.ts)           │
│  callAI() → Primary task-based provider → Ollama fallback →          │
│            OpenRouter fallback (see §8)                               │
└─────────────┬─────────────────────────────┬────────────────────────┘
              │                             │
              ▼                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│              DOMAIN LAYER (scenarios + hints + training DB)          │
│  [scenarios.ts](file:///d:/PRJ-7/twinsec/src/data/scenarios.ts)  │
│  [enhanced-simulation.functions.ts](file:///d:/PRJ-7/twinsec/src/lib/api/enhanced-simulation.functions.ts) │
│  [schema.ts](file:///d:/PRJ-7/twinsec/src/lib/db/schema.ts)       │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 Existing Modules Reused Without Modification

- **AI Gateway**: [ai-providers.server.ts](file:///d:/PRJ-7/twinsec/src/lib/ai-providers.server.ts) (`callAI`, provider
  chain, timeouts, retryability).
- **Prompt Injection Detection**: `detectPromptInjection()` in
  [enhanced-simulation.functions.ts](file:///d:/PRJ-7/twinsec/src/lib/api/enhanced-simulation.functions.ts#L34-L65).
- **Output Scrubbing**: `scrubOutput()` in
  [enhanced-simulation.functions.ts](file:///d:/PRJ-7/twinsec/src/lib/api/enhanced-simulation.functions.ts#L68-L149).
- **Training Persistence**: `trainingRuns` and `auditLogs` tables in
  [schema.ts](file:///d:/PRJ-7/twinsec/src/lib/db/schema.ts).
- **PathSelector**: [PathSelector.tsx](file:///d:/PRJ-7/twinsec/src/components/simulation/PathSelector.tsx)
  (existing role-selector card UI, extended with "show brief →" CTA).
- **Scenario Topology**: All 7 sectors in [scenarios.ts](file:///d:/PRJ-7/twinsec/src/data/scenarios.ts).

### 2.3 New Modules Introduced

| Module                       | File                                               | Responsibility                                                                                                           |
| ---------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `RoleBriefingPanel`          | `src/components/simulation/RoleBriefingPanel.tsx`  | Rendered AI briefing with objectives, TTPs, impact, threat actor.                                                        |
| `PhaseGuidancePanel`         | `src/components/simulation/PhaseGuidancePanel.tsx` | Progressive per-phase tutorial with explanation, common activities, required decisions, and tooling.                     |
| `HintAssistant`              | `src/components/simulation/HintAssistant.tsx`      | Integrated terminal-like widget + contextual pop-ups + diagnostic question flow.                                         |
| `role-briefing.functions.ts` | `src/lib/api/role-briefing.functions.ts`           | Server functions: `generateRoleBriefing`, `generatePhaseGuidance`, `generateContextHint`, `generateDiagnosticQuestions`. |
| `briefing-prompts.server.ts` | `src/lib/briefing-prompts.server.ts`               | Prompt library, sector/role-specific system instructions, TTP references.                                                |

---

## 3. Role Selection UX

### 3.1 Entry Condition

The user arrives at `/simulation?sector=<SectorId>` (validated by
[Route.validateSearch](file:///d:/PRJ-7/twinsec/src/routes/simulation.tsx#L142-L152)).
The `SimulationAuthGate` has already cleared access. If `role` is **not** in the
search params, the `PathSelector` overlay (z-999) blocks the topology.

### 3.2 PathSelector Contract (Enhanced)

The existing `PathSelector` remains the sole entry point. The following
contract is enforced:

```ts
export type OperationalRole = "RED" | "BLUE";

interface PathSelectorProps {
  scenarioName: string; // e.g. "HOLLOW"
  sectorName: SectorId; // e.g. "power"
  threatActorName: string; // e.g. "UNIT-414"
  onSelectRole: (role: OperationalRole) => void; // triggers (a) push route param, (b) launch briefing
}
```

**On `onSelectRole`**:

1. Append `?sector=<sector>&role=<red|blue>` to the TanStack router state.
2. Persist the choice to the simulation state (`useAttackSimulation`).
3. **Immediately** (no loading spinner gap) invoke `generateRoleBriefing()`
   server function — while the overlay fades out, the briefing panel fades in
   as a sticky right rail (`md:sticky md:top-24 md:w-[420px]`).

### 3.3 Replay Sessions

If the user returns to a saved run via the training ledger and a `role` is
already recorded in the `trainingRuns` row, `PathSelector` is skipped and the
last active `PhaseGuidance` panel is restored.

---

## 4. AI-Driven Initial Briefing Module

### 4.1 Triggers

The briefing is generated server-side once, precisely when:

- A `role` is selected (RED/BLUE) on a fresh scenario;
- The simulation timeline is at `t=0` (before any event fires);
- The operator has **not** already requested a briefing (deduplicated via
  `auditLogs.eventType = "briefing-generated"`).

### 4.2 Briefing Output Schema

Every briefing conforms to a typed JSON structure returned by the AI (validated
by a Zod schema before rendering). This is essential to ensure sections are
always present and can be independently rendered.

```ts
type AttackObjective = {
  id: string;
  priority: "PRIMARY" | "SECONDARY" | "OPPORTUNISTIC";
  description: string;
  mitreTactic: string; // e.g. "Impact - T0814" (ICS-ATT&CK)
};

type TechniqueEntry = {
  id: string; // e.g. "T0813"
  tactic: string; // e.g. "Lateral Movement"
  title: string; // e.g. "HMI credential replay"
  observedIn: string[]; // relevant node ids e.g. ["hmi-11"]
  sectorContext: string; // 1-2 sentence sector-specific meaning
};

type ImpactAssessment = {
  primaryImpact: string; // e.g. "14 MW load shed + breaker latch"
  timeToImpactSec: number; // 9541 for HOLLOW (last event.t in scenario)
  humanFactor: string; // e.g. "Hospital ring on backup generators"
  regulatory: string[]; // e.g. ["NERC CIP-010 R3", "Reportable Incident §119"]
};

type ThreatActorProfile = {
  handle: string; // adversary codename from EXERCISES
  type: "NATION-STATE" | "INSIDER" | "ACTIVIST" | "CYBER-CRIME" | "SCRIPT-KIDDIE";
  sophistication: 1 | 2 | 3 | 4 | 5;
  typicalMotive: string; // 1 sentence
  historicalTTPs: string[]; // 3-5 bullet references
  sectorAffinity: string; // why they target this sector
};

type RoleBriefing = {
  sector: SectorId;
  role: OperationalRole;
  scenarioCode: string;
  generatedAt: string;
  objectives: AttackObjective[]; // 3-4 objectives, ordered by priority
  ttps: TechniqueEntry[]; // 6-8 techniques covering full chain
  impact: ImpactAssessment; // physics + human + regulatory
  threatActor: ThreatActorProfile; // with codename + sophistication
  redFrame?: string; // RED-only: 1-sentence "think like the adversary" frame
  blueFrame?: string; // BLUE-only: 1-sentence defender framing
  prerequisites: string[]; // 3 bullets of what operator should look for first
};
```

### 4.3 Role-Conditional Section Framing

The same scenario produces structurally identical sections but with role-aware
framing in every paragraph.

**RED Team (Adversary Analyst) Frame — Example (HOLLOW/power):**

> **Framing**: Your objective is to predict the adversary's next move before the
> defender detects it. The briefing below describes the attack _as the threat
> actor UNIT-414 planned it_. When asked for decisions, choose the option that
> matches what a sophisticated actor would actually do, not what you wish a
> defender would block.

**BLUE Team (Incident Responder) Frame — Example (same sector):**

> **Framing**: Your objective is to minimise physical impact (MW shed, cascading
> fault). The briefing below describes the attack _as your SIEM should
> eventually reconstruct it_. When asked for decisions, choose the option that
> balances detection confidence against production halt risk.

### 4.4 TTP Reference Source

The briefing always cross-references real framework IDs:

- **ICS-ATT&CK**: https://collaborate.mitre.org/attackics (T-codes T0800…T0880)
- **MITRE ATT&CK for Enterprise**: Used for IT-side initial-access vectors
  (T1566 spear-phish, T1190 public-facing app exploit, etc.)
- **CISA ICS Advisories**: Referenced where `cve-map.ts` has entries for the
  specific node vendor (Siemens S7-1500, OSIsoft PI, etc.)

### 4.5 Briefing Render (BriefingPanel.tsx)

```
┌─ ROLE BRIEFING (RED CELL · power · HOLLOW) ───────────┐
│ ⚫ THREAT ACTOR  UNIT-414 · sophistication ████░░     │
│    "Nation-state · grid disruption · DNP3/Modbus TTPs" │
├──────────────────────────────────────────────────────┤
│ 🎯 PRIMARY OBJECTIVES                                  │
│ 1. Trip Coil Tampering (T0814, Impact)                │
│ 2. Ladder Logic Overwrite (T0858, Impact)             │
│ 3. SIS Safety Bypass (T0833, Defense Evasion)         │
├──────────────────────────────────────────────────────┤
│ ⛓  OBSERVED TTPs (6 mapped)                           │
│ T1566 Spear-phish → EWS-04       [INITIAL ACCESS]     │
│ T0846 Historian fingerprint → HIST [DISCOVERY]        │
│ ... 8 more ...                                        │
├──────────────────────────────────────────────────────┤
│ ⚠️  IMPACT ASSESSMENT (at +9 541s)                     │
│ • 14 MW load shed · BRK-33B latch                     │
│ • Hospital ring on backup gen                         │
│ • NERC CIP-010 R3 · reportable §119                   │
├──────────────────────────────────────────────────────┤
│ 👁  YOUR ASSIGNMENT (red-frame / blue-frame)           │
│    "…1-sentence role frame …"                          │
├──────────────────────────────────────────────────────┤
│ [► BEGIN PHASE 1: RECON / PREPARATION]                │
└──────────────────────────────────────────────────────┘
```

Clicking **BEGIN PHASE 1** collapses the briefing to a summary strip and
activates the `PhaseGuidance` panel for Phase 1.

---

## 5. Phase-by-Phase Lifecycle Guidance Engine

### 5.1 Dual Lifecycle Model

| Red Team Lifecycle (Cyber Kill-Chain / ICS-ATT&CK) | Blue Team Lifecycle (NIST SP 800-61 IR) |
| -------------------------------------------------- | --------------------------------------- |
| 1. Reconnaissance (RECON)                          | 1. Preparation                          |
| 2. Weaponization (WEAPON)                          | 2. Identification                       |
| 3. Delivery (DELIVER)                              | 3. Containment                          |
| 4. Exploitation (EXPLOIT)                          | 4. Eradication                          |
| 5. Installation (INSTALL)                          | 5. Recovery                             |
| 6. Command & Control (C2)                          | 6. Post-Incident Activity               |
| 7. Actions on Objectives (AOO)                     | — (synthesis + debrief)                 |

The guidance engine is activated when:

- The simulation event timeline enters the time-bucket for a phase (e.g.,
  events tagged `RECON` / `DISCOVERY` map to Phase 1 on both sides), OR
- The operator manually clicks the **advance phase** button in the
  `PhaseIndicator`.

### 5.2 Per-Phase Guidance Data Model

```ts
type GuidancePhase =
  // RED
  | "RECON"
  | "WEAPON"
  | "DELIVER"
  | "EXPLOIT"
  | "INSTALL"
  | "C2"
  | "AOO"
  // BLUE
  | "PREPARATION"
  | "IDENTIFICATION"
  | "CONTAINMENT"
  | "ERADICATION"
  | "RECOVERY"
  | "POST_INCIDENT";

type PhaseGuidance = {
  role: OperationalRole;
  phase: GuidancePhase;
  sector: SectorId;
  purpose: string; // 2-3 sentences: what this phase is for
  commonActivities: string[]; // 5-8 bullets of typical tasks
  requiredDecisions: {
    // 2-4 likely upcoming DecisionModal triggers
    triggerId: string; // matches Decision.trigger
    questionPreview: string;
    redPitfall?: string; // RED-only: common adversary error
    bluePitfall?: string; // BLUE-only: common defender error
  }[];
  toolbox: {
    // tools available in-simulation at this phase
    name: string;
    usedFor: string;
    terminalCommand?: string; // e.g. "ISOLATE hist"
    applicableNodes: string[];
  }[];
  checkYourUnderstanding: string[]; // 3 Socratic questions (no AI call)
  progressHint: string; // tells operator how to know they've "completed" phase
  nextPhaseTrigger: string; // sentence describing the event that advances phase
};
```

### 5.3 RED Phase Guidance — Detailed Examples (HOLLOW/power)

**Phase 1 — RECONNAISSANCE (RECON)**

> **Purpose**: You are UNIT-414's recon operator. You have zero foothold yet.
> Your goal is to map the Purdue model layers of Substation-07 without
> triggering the NOC's port-scan thresholds.
>
> **Common Activities**
>
> - Passive OSINT against vendor domains (target: Schneider/Dell EWS firmware notes)
> - Slow nmap sweeps of the contractor VPN range (≤10 ports/min)
> - BACnet/Modbus whois queries from a compromised jump host
> - Harvester-ingest of engineering portal password-reset pages
>
> **Likely Upcoming Decisions**
>
> - trigger="Spear-phish accepted" → pitfall: "Obvious .exe attachment
>   increases the probability of EDR catch; use weaponized engineering
>   document macro instead."
>
> **Toolbox**
>
> - `nmap -sV --max-rate 10 <range>` → recon EWS/historian range
> - `modscan -f 1,2,3,4,5,6,16 -a 1..254 203.0.113.0/24` → map RTU addresses

**Phase 7 — ACTIONS ON OBJECTIVES (AOO)**

> **Purpose**: The ladder logic has been overwritten and the SIS is disarmed.
> You are now walking the setpoint into the mechanical resonance band. Your
> final task is to ensure the trip sequence produces the _cascading_ breaker
> latch rather than an SIS-mediated single-node stop.

### 5.4 BLUE Phase Guidance — Detailed Examples (HOLLOW/power)

**Phase 1 — PREPARATION**

> **Purpose**: You are the shift lead on the SCADA operations console.
> Preparation means confirming the data sources you will trust during the
> incident (twin-vs-SCADA divergence, engineer sign-off for field fallback,
> ESD procedure ownership).
>
> **Common Activities**
>
> - Confirm shift-handoff HMI tokens are revoked for off-going operators
> - Verify the ORBCOMM/PI historian checksum-of-checksums baseline
> - Confirm manual trip authority for SIS bypass situations
>
> **Likely Upcoming Decisions**
>
> - trigger="HMI credential replay" → pitfall: "Deferring re-auth just
>   because production is mid-shift costs you the only clean break in the
>   kill chain. 6 seconds is all the adversary needs for lateral VLAN move."

**Phase 3 — CONTAINMENT**

> **Purpose**: You have _identified_ the rung delta on PLC-3. Containment is
> the decision to physically stop the controller before the setpoint walk
> enters resonance. You must balance the 2-MW deferred-load cost against the
> 14-MW cascade risk.
>
> **Toolbox**
>
> - `TRIP PLC-3` (failsafe ladder — controlled stop)
> - `PATCH PLC-3` (remote rung revert — leaves the credential vector hot)
> - `QUARANTINE switch-a` (breaks the lateral path but not the SIS link)

### 5.5 Phase Advancement Logic

The phase indicator [PhaseIndicator](file:///d:/PRJ-7/twinsec/src/components/simulation/PhaseIndicator.tsx)
drives phase transitions. A phase auto-advances when **any** event with a tag
matching the next phase fires (see DEFAULT_EVENTS `tag` field mappings):

| Event Tag Pattern   | RED Phase                 | BLUE Phase                   |
| ------------------- | ------------------------- | ---------------------------- |
| INITIAL ACCESS      | RECON → WEAPON transition | PREPARATION → IDENTIFICATION |
| DISCOVERY           | RECON/WEAPON              | IDENTIFICATION               |
| LATERAL             | DELIVER/EXPLOIT           | IDENTIFICATION → CONTAINMENT |
| STAGING             | INSTALL                   | CONTAINMENT                  |
| IMPACT              | AOO                       | CONTAINMENT → ERADICATION    |
| BYPASS              | AOO                       | ERADICATION                  |
| PHYSICS/CONSEQUENCE | AOO terminal              | RECOVERY                     |

The `PhaseGuidancePanel` is notified of the transition, fetches
`generatePhaseGuidance()` for the new phase, and fades the new content in with
a 400-ms slide animation.

---

## 6. Intelligent Context-Sensitive Assistance

### 6.1 Trigger Conditions for Assistance

Assistance activates if ANY of the following become true:

| Trigger              | Example                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Explicit request** | User types `/help`, `/hint`, `?`, or clicks the `Need help?` chip.                                                                |
| **Stuck timer**      | User has not advanced a decision or entered a terminal command for `>90 s` during an active decision window.                      |
| **Dead-end action**  | User chooses `MISS` on 2 consecutive decision modals; OR user runs 3 consecutive terminal commands that all return success=false. |
| **Phase regression** | The timeline rewinds to an earlier phase and the user has already failed a decision in that phase.                                |

### 6.2 Hint Levels (4-Level Progressive System — Incremental)

The existing 3-level `sectorHints` matrix in
[enhanced-simulation.functions.ts](file:///d:/PRJ-7/twinsec/src/lib/api/enhanced-simulation.functions.ts#L634-L1082)
is extended with a new **Level 0 — Diagnostic Questions** tier and renamed:

| Level | Name                 | Trigger                                    | AI Delivery                                       | Philosophy                                              |
| ----- | -------------------- | ------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------- |
| **0** | Diagnostic Questions | Explicit `/help` or first stuck timer      | 2-3 Socratic questions (never statements)         | "What data source would tell you X?"                    |
| **1** | Contextual Hint      | Repeated Level 0 OR `/hint`                | 1 sentence, points at the correct node/tag/metric | "Check the rung checksum on PLC-3, not the HMI display" |
| **2** | Targeted Suggestion  | 2× Level-1 hints OR explicit "still stuck" | Bullet list of 2-3 concrete next steps            | "1) Run `DIFF PLC-3 RUNG 14-16` …"                      |
| **3** | Full Walkthrough     | Final tier OR explicit `/solution`         | Step-by-step phase resolution                     | 3-phase procedure (Detect → Contain → Remediate)        |

**Strict Guardrail**: Level-3 walkthroughs are only given if:

- The operator has exhausted Levels 0, 1, 2 (each ≥1 invocations), OR
- The simulation's time-to-impact countdown is ≤60 seconds.

Level 3 is always wrapped with a footer:

> ⚠️ SOLUTION MODE — Retry this scenario without the solution to build
> operational intuition. This walkthrough is watermarked for guest sessions.

### 6.3 Three Delivery Channels

#### 6.3.1 Channel 1 — Terminal-Like Hint Widget (HintAssistant.tsx)

Integrated into the bottom pane, sharing real estate with the
[TerminalEmulator](file:///d:/PRJ-7/twinsec/src/components/simulation/TerminalEmulator.tsx):

```
┌─ TERMINAL ───────────────┐┌─ HINT ASSISTANT ──────────┐
│ POWER > diff plc-3 rung  ││ LEVEL 0 · diagnostic       │
│ Comparing checksum...    ││                           │
│ [!] Delta on rung 14-16  ││ ❓ 1. Which data source in │
│                           ││    the topology panel says │
│                           ││    "checksum spoofed"?     │
│                           ││                           │
│                           ││ ❓ 2. The HMI shows a nom- │
│                           ││    inal value; where does  │
│                           ││    the twin disagree?      │
└───────────────────────────┘└───────────────────────────┘
```

The assistant uses the same terminal aesthetic: 80-char line wrap, green-on-black
for Level 0, amber-on-black for Level 1-2, red-on-black for Level 3 (solution
mode). Every line is prefixed with the existing `[DEFANGED]` guard via
`scrubOutput()`.

#### 6.3.2 Channel 2 — Contextual Pop-Ups Tied to Topology Elements

When `useAttackSimulation` reports the current stuck-decision is bound to a
specific `nodeId`, the HintAssistant fires a transient popover (Tailwind v4
`hover-card` / `popover`) anchored to that node in AttackTopology3D:

```
  ┌─ HINT (level 1) ───────────────────────────┐
  │  Node: PLC-3                                │
  │  Hint: The rung delta is invisible to the   │
  │  HMI because the checksum has been spoofed. │
  │  Compare the twin-baseline checksum.        │
  │  [ Run DIFF PLC-3 RUNG 14-16 ]              │
  └──────────────────────────────────────────────┘
                   ▲
                   └── popover anchored to <AttackNode3D id="plc-3" />
```

#### 6.3.3 Channel 3 — AI-Generated Diagnostic Questions (Level 0 Only)

Level 0 is the _most important_ pedagogical channel. Questions are generated
server-side by `generateDiagnosticQuestions()` and follow a strict template
that forbids declarative statements:

```
✅ VALID LEVEL-0 FORMAT (Socratic):
  "Which node in the L3.5 DMZ ring would record the credential replay?"
  "Name one protocol anomaly you would expect to see in MODBUS traffic during
   a lateral move across OT VLAN 100."
  "Who owns the decision authority for a manual ESD trip in your jurisdiction?"

❌ INVALID LEVEL-0 FORMAT (declarative / direct hint):
  "Look at the historian node HIST-PI."         (declarative)
  "Run ISOLATE switch-a."                       (direct command)
  "The decision is ACT — QUARANTINE."           (direct solution)
```

The AI prompt enforcing this constraint is defined in
`briefing-prompts.server.ts` (see §8).

### 6.4 Adaptive Hinting — Staleness Avoidance

The `trainingRuns.hintLevel` field (already in schema) is reused. In addition:

- A new `lastHintContext: string` column records the SHA-256 hash of the last
  delivered hint text.
- `generateContextHint()` refuses to deliver the same hash twice; it
  automatically increments the hint level if the same context is requested
  again, preventing "hint loops".

---

## 7. TypeScript Data Models & API Contracts

### 7.1 New Server Functions (role-briefing.functions.ts)

All functions use `createServerFn()` with `validator()` wrapping payloads in a
`data` key, per project convention.

```ts
// ── Enums shared with client ────────────────────────────────────────
export const GUIDANCE_PHASES_RED = [
  "RECON",
  "WEAPON",
  "DELIVER",
  "EXPLOIT",
  "INSTALL",
  "C2",
  "AOO",
] as const;
export const GUIDANCE_PHASES_BLUE = [
  "PREPARATION",
  "IDENTIFICATION",
  "CONTAINMENT",
  "ERADICATION",
  "RECOVERY",
  "POST_INCIDENT",
] as const;
export type RedPhase = (typeof GUIDANCE_PHASES_RED)[number];
export type BluePhase = (typeof GUIDANCE_PHASES_BLUE)[number];
export type GuidancePhase = RedPhase | BluePhase;

// ── Inputs / Outputs validated via Zod ─────────────────────────────
export const GenerateRoleBriefingInput = z.object({
  sector: z.enum(SECTORS),
  role: z.enum(["RED", "BLUE"]),
  scenarioCode: z.string().max(64),
  threatActor: z.string().max(64),
});
export const GenerateRoleBriefingOutput = z.object({
  briefing: RoleBriefingSchema, // matches §4.2 types above
  tokensUsed: z.number(),
  source: z.enum(["primary", "ollama", "openrouter"]),
});

export const GeneratePhaseGuidanceInput = z.object({
  sector: z.enum(SECTORS),
  role: z.enum(["RED", "BLUE"]),
  phase: z.union([z.enum(GUIDANCE_PHASES_RED), z.enum(GUIDANCE_PHASES_BLUE)]),
  eventTagsSeen: z.array(z.string()).max(32),
  lastDecisionId: z.string().max(32).optional(),
});
export const GeneratePhaseGuidanceOutput = z.object({
  guidance: PhaseGuidanceSchema, // matches §5.2
  tokensUsed: z.number(),
  source: z.enum(["primary", "ollama", "openrouter"]),
});

export const GenerateContextHintInput = z.object({
  sector: z.enum(SECTORS),
  role: z.enum(["RED", "BLUE"]),
  phase: GuidancePhase,
  currentHintLevel: z.number().min(0).max(3),
  stuckNodeId: z.string().max(32).optional(),
  lastDecisionTrigger: z.string().max(128).optional(),
  lastTerminalCommand: z.string().max(256).optional(),
  lastHintHash: z.string().max(128).optional(), // dedup
});
export const GenerateContextHintOutput = z.object({
  nextHintLevel: z.number().min(0).max(3),
  hintText: z.string(),
  hintHash: z.string(), // SHA-256 of hintText
  delivery: z.enum(["terminal", "popover", "diagnostic"]),
  popoverNodeId: z.string().optional(),
  diagnosticQuestions: z.array(z.string()).max(5).optional(),
});

export const GenerateDiagnosticQuestionsInput = z.object({
  sector: z.enum(SECTORS),
  role: z.enum(["RED", "BLUE"]),
  phase: GuidancePhase,
  focusContext: z.string().max(512), // the specific trigger: decision, command, tag
});
export const GenerateDiagnosticQuestionsOutput = z.object({
  questions: z.array(z.string()).min(2).max(4),
  tokensUsed: z.number(),
});
```

### 7.2 Database Schema Extensions (schema.ts)

All existing columns preserved; additions only:

```sql
-- trainingRuns: add role + briefing idempotency + hint dedup
ALTER TABLE trainingRuns
  ADD COLUMN role TEXT CHECK (role IN ('RED','BLUE')),
  ADD COLUMN briefing_generated_at TEXT,
  ADD COLUMN last_hint_hash TEXT;

-- auditLogs: eventType already string; add these values:
--   "briefing-generated"  (sector, role, scenarioCode in details JSON)
--   "phase-guidance-fetched" (phase, tokensUsed)
--   "hint-delivered"      (level, delivery, hintHash)
--   "diagnostic-questions" (questions array hash)
--   "stuck-detected"      (trigger: timer|dead-end|manual)
```

---

## 8. AI Prompt Library & Safety Guardrails

### 8.1 Provider Selection Mapping (ai-providers.server.ts)

Leverage the existing `callAI()` and `getProviderForTask()` machinery.
Register two new `AITask` enum members in
[ai-providers.server.ts](file:///d:/PRJ-7/twinsec/src/lib/ai-providers.server.ts#L3-L9):

```ts
export type AITask =
  | "terminal_command"
  | "espionage_briefing"
  | "debrief_scorecard"
  | "hint"
  | "simulation_narration"
  | "adversary_chat"
  | "role_briefing" // ← NEW: Gemini/Flash primary (4000 tokens)
  | "phase_guidance"; // ← NEW: Cerebras Llama 3.1 70b primary (1200 tokens)
```

**Provider routing table (matches `getProviderForTask` pattern):**

| Task             | Primary Provider                                                 | Fallback Chain                               |
| ---------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| `role_briefing`  | Gemini 2.0 Flash (`maxTokens: 4000`) → sector-structured JSON    | Ollama qwen2.5:14b → OpenRouter Llama 3.1 8b |
| `phase_guidance` | Cerebras Llama 3.1 70b (`maxTokens: 1800`) → structured guidance | Ollama qwen2.5:14b → OpenRouter Llama 3.1 8b |
| `hint`           | Groq Llama 3.3 70b (low-latency) — reused from existing          | Ollama → OpenRouter                          |
| `diagnostic`     | Groq — same as hints (fast, 4 questions)                         | Ollama → OpenRouter                          |

### 8.2 System Prompt: Role Briefing (role_briefing)

```
SYSTEM: You are TwinSec Briefing Officer-01. You produce a structured,
ICS-ATT&CK-grounded briefing for a cyber-physical simulation. Your output is
JSON only — strictly conforming to the RoleBriefing schema.

CONSTRAINTS:
 1. Role-aware framing:
    - If role=RED: brief as if the operator is predicting ADVERSARY moves.
      Add a 1-sentence "redFrame" that encourages adversarial thinking.
    - If role=BLUE: brief as if the operator is DEFENDING the asset.
      Add a 1-sentence "blueFrame" that emphasizes defender trade-offs.
 2. TTP mapping:
    - Every TTP in `ttps[]` must reference a REAL ICS-ATT&CK T-code (T08xx)
      OR an enterprise ATT&CK T-code (T1xxx) for IT-side initial access.
    - No fabricated T-codes.
 3. Sector physics fidelity:
    - Numbers (timeToImpactSec, MW shed, etc.) MUST be derived from the
      scenario's event stream. Do not invent numbers.
 4. No solutions:
    - The briefing describes the threat, not how to defeat it.
 5. Scrub:
    - All IPs, credentials, domains MUST use the RFC 5737 defanged ranges.
    - Prefix all command snippets with "[illustrative]".

SCHEMA: {RoleBriefingSchema — see §4.2}

CONTEXT:
  Sector: <sector>
  Role: <role>
  Scenario: <scenarioCode>
  Adversary: <threatActor>
  Topology nodes: [<comma-separated ids + kinds + exposures>]
  Timeline events: [<t,tag,node,title,desc for every event> — truncated if >12k chars]
```

### 8.3 System Prompt: Phase Guidance (phase_guidance)

```
SYSTEM: You are TwinSec Instructor-07. You produce structured per-phase
guidance for either a RED CELL (adversary analyst) or BLUE CELL (incident
responder) trainee. Output JSON strictly conforming to PhaseGuidanceSchema.

CONSTRAINTS:
 1. Phase purpose is specific to BOTH the role AND the sector. Do NOT write
    generic textbook explanations. Name a specific VLAN, node or protocol
    from the CONTEXT in every bullet.
 2. requiredDecisions pitfall rules:
    - redPitfall: Describe a common adversary mistake that a GOOD analyst
      would AVOID. Do NOT give the correct answer.
    - bluePitfall: Describe a common defender over-confidence / trust-SCADA
      / defer-to-procedure error that the scenario punishes.
 3. checkYourUnderstanding (3 bullets) must be QUESTIONS, never statements.
 4. No command blocks with exploitable details. All command suggestions in
    the toolbox are illustrative and will later be defanged by the scrubber.

SCHEMA: {PhaseGuidanceSchema — see §5.2}
CONTEXT:
  Sector: <sector>, Role: <role>, Phase: <phase>
  EventsSeen: [<eventTagsSeen — only tags already fired>]
  LastDecisionId: <lastDecisionId>  [if any]
```

### 8.4 System Prompt: Diagnostic Questions (Level-0 hints)

```
SYSTEM: You are TwinSec Socratic Tutor-04. Your ONLY output is a JSON array
of 2-3 diagnostic questions. These questions must guide the trainee toward
the answer without ever stating the answer.

ABSOLUTE RULES — VIOLATION FAILS VALIDATION:
 1. Every array element is a single QUESTION. Ends with a question mark.
 2. No declarative statements. No bullet lists of steps.
 3. No mention of specific decision IDs, node labels, or command names in a
    way that reveals the answer.
 4. No imperative sentences ("Run X", "Check Y"). All must be interrogative.

VALID:  "Which Purdue model layer separates the EWS from the OT controllers?"
VALID:  "If the HMI shows nominal but the twin reports drift, which data
        source should you trust during a live event?"
INVALID: "Check PLC-3." (imperative, no question mark)
INVALID: "The answer is to QUARANTINE switch-a." (direct solution)
```

### 8.5 Non-AI Static Fallbacks

If `callAI()` throws `AIUnavailableError`, every server function returns a
pre-computed static fallback — one per (sector × role × phase) tuple. These
are author-written in `briefing-prompts.server.ts` as plain data; they are
less personalised but preserve the training experience offline.

---

## 9. UI/UX Flow & Wireframe Narrative

### 9.1 Complete Flow: First-Time Operator (Power Sector)

```
Step 1. /simulation?sector=power  (no role yet)
         → PathSelector overlay renders (HOLLOW · UNIT-414)

Step 2. Operator clicks [ENTER BLUE CELL INCIDENT RESPONDER MODE]
         → URL mutates → ?sector=power&role=blue
         → PathSelector fade-out (300 ms)
         → debounced call to generateRoleBriefing(role=blue, sector=power)

Step 3. BriefingPanel slides in from right as sticky 420 px rail
         → 7 sections rendered (§4.5)
         → Meanwhile, AttackTopology3D starts at t=0
         → CRTOverlay + grid-bg render beneath

Step 4. Event "Spear-phish accepted" fires (t=0)
         → Phase auto: PREPARATION → IDENTIFICATION
         → PhaseGuidancePanel: BLUE Phase 2 rendered
         → NarrationFeed shows AI narration for INITIAL ACCESS (reuses existing)

Step 5. At t=1244, decision d1 fires (trigger="HMI credential replay")
         → DecisionModal opens
         → 90-second stuck timer starts
         → If timer expires, HintAssistant activates at Level 0 (diagnostic)
         → Popover anchors to hmi-11 node with Level 0 questions

Step 6. Operator picks ACT / DEFER / MISS
         → consequence plays out
         → HintAssistant resets hintLevel to 0 for the next phase

Step 7. t=9541 final consequence fires → DebriefScorecard opens
         → Guest sessions get watermarked PDF / PNG per project constraints
         → Logged operators: saveEnhancedTrainingRun persists run with role
```

### 9.2 Sticky Panels Layout (Responsive)

```
  md+ viewports (>768 px):                   sm/mobile viewports:
  ┌───────────┬─────────────────┬─────────┐  ┌────────────────────────────┐
  │ Kill-chain│ AttackTopology3D│ Briefing│  │     AttackTopology3D       │
  │ indicator │                 │ rail  ◀ │  │  (full viewport-height)    │
  ├───────────┤                 ├─────────┤  ├────────────────────────────┤
  │ Sparklines│                 │ Phase   │  │  PHASE GUIDANCE (scroll)   │
  ├───────────┤                 │ Guidance│  ├────────────────────────────┤
  │ Narration │                 │ rail    │  │  BRIEFING SUMMARY STRIP    │
  ├───────────┴─────────────────┴─────────┤  ├────────────────────────────┤
  │ TerminalEmulator · HintAssistant tabbed│  │  TERMINAL / HINT tabbed    │
  └────────────────────────────────────────┘  └────────────────────────────┘
```

Panels use the project's **Industrial Brutalist** conventions:

- radius=0, 80×80 grid backgrounds, CRT scanline overlays (CRTOverlay).
- Tailwind v4 syntax: `!` for importance suffix, standard increments for
  z-index, no arbitrary pixel widths where Tailwind equivalents exist.

### 9.3 Hook-Order Compliance

All new client hooks are declared BEFORE any early returns. This is enforced
in code review and must match the pattern established in
[simulation.tsx](file:///d:/PRJ-7/twinsec/src/routes/simulation.tsx):
useState → useMemo → useEffect → useCallback → early-return guards.

---

## 10. Integration With Existing Codebase

### 10.1 Touchpoints — Exact Files Modified

| #   | File                                                                                    | Changes                                                                                                                                                                                                  |
| --- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | [ai-providers.server.ts](file:///d:/PRJ-7/twinsec/src/lib/ai-providers.server.ts#L3-L9) | Add two new `AITask` entries (`role_briefing`, `phase_guidance`) + their `getProviderForTask` case branches.                                                                                             |
| 2   | [schema.ts](file:///d:/PRJ-7/twinsec/src/lib/db/schema.ts)                              | Add 3 nullable columns to `trainingRuns`: `role`, `briefing_generated_at`, `last_hint_hash`.                                                                                                             |
| 3   | [simulation.tsx](file:///d:/PRJ-7/twinsec/src/routes/simulation.tsx#L142-L152)          | Extend `validateSearch` to carry `role=red\|blue`; mount the three new panels (BriefingPanel, PhaseGuidancePanel, HintAssistant); plumb `PhaseIndicator` transitions into `generatePhaseGuidance` calls. |
| 4   | [PathSelector.tsx](file:///d:/PRJ-7/twinsec/src/components/simulation/PathSelector.tsx) | Add `onSelectRole → router.navigate with role param` side-effect CTA.                                                                                                                                    |

### 10.2 New Files Added (See §2.3)

- `src/components/simulation/RoleBriefingPanel.tsx`
- `src/components/simulation/PhaseGuidancePanel.tsx`
- `src/components/simulation/HintAssistant.tsx`
- `src/lib/api/role-briefing.functions.ts`
- `src/lib/briefing-prompts.server.ts`

### 10.3 Re-Use Without Modification (Zero New Dependencies)

No new packages. Everything is built with the existing stack:

- React 19, TanStack Start, TanStack Router, Tailwind v4
- Vercel AI SDK (`@ai-sdk/openai-compatible`)
- Zod for validation
- Drizzle + SQLite (twinsec.db)
- `html-to-image` for dossier capture (NOT `html2canvas` — project rule)

---

## 11. Validation, Metrics & Test Strategy

### 11.1 Validation Gates for Every AI Output

Before any AI-generated text reaches the client, all four gates execute in
this order. A failure at any gate falls back to the static sector/role/phase
fallback (see §8.5):

```
AI Output → 1. Zod parse (strict JSON schema)
            → 2. prompt-injection check on reflected user text (§8)
            → 3. scrubOutput() defang pipeline
            → 4. token budget / length check (< maxTokens per task)
            → OK: render to client  |  FAIL: static fallback + audit warn
```

### 11.2 Metrics Collected for Pedagogical Efficacy

Captured in `auditLogs.details JSON` for analysis:

| Metric                       | Meaning                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `hintRequestsPerPhase`       | Counts how many hints per phase (0 = self-sufficient, 4+ = material too hard) |
| `hintLevelDistribution`      | 0/1/2/3 distribution — heavy level-3 use = briefings lack clarity             |
| `stuckTimerFirings`          | Automated stuck-detection activations                                         |
| `decisionCorrectnessByPhase` | ACT/DEFER/MISS grouped by phase — identifies hardest decisions                |
| `timeSpentReadingBriefingMs` | Time between BriefingPanel mount and "BEGIN PHASE 1" click                    |
| `briefingToFirstHintTimeMs`  | Latency from briefing end to first `/help` — briefing comprehension proxy     |

### 11.3 Test Checklist

| ID   | Test                                                       | How                                                                                    |
| ---- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| T-01 | RED role briefing frame correct vs BLUE                    | Snapshot diff of BriefingPanel for same sector                                         |
| T-02 | PhaseGuidance matches scenario event tags                  | Feed synthetic `eventsSeen` arrays, validate JSON fields match sector topology         |
| T-03 | Level-0 diagnostic questions are interrogative             | Regex `/.+\?$/` on every question; grep for imperatives (Run / Check / Click) → fail   |
| T-04 | Hint dedup: repeated requests auto-advance level           | Submit same context 3×, assert nextHintLevel increments monotonically                  |
| T-05 | Level-3 solution gate: require exhausted 0/1/2 first       | Short-circuit hintLevel → expect `AIUnavailableError` or static fallback; NOT solution |
| T-06 | Scrub pipeline asserts: no un-defanged IPs / creds         | Run 50 random AI outputs, grep non-RFC-5737 public IP regex                            |
| T-07 | SSR hygiene: no module-mutable state in prompts            | Code review + ESLint rule                                                              |
| T-08 | Hook order in 3 new components valid                       | ESLint `react-hooks/rules-of-hooks` + build                                            |
| T-09 | Guest session watermark on Level-3 hints                   | Render PDF dossier, assert watermark SVG present                                       |
| T-10 | Auth gate: AI calls rejected pre-`SimulationAuthGate` open | Integration test: AI server function without session cookie → 401                      |

### 11.4 Commands for CI/CD (Already Project Standard)

```powershell
# Linting & typecheck — must be zero-diagnostics
bun run lint
# Production build — validates route trees, server fns, TS
bun run build
```

---

_End of Specification. TwinSec v3.1 — AI Role-Based Simulation Platform._
