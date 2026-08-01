<h1 align="center"><b>TwinSec</b></h1>

<p align="center">
  <img src="src/assets/twinsec_banner.png" alt="TwinSec Banner" width="100%">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4.2.1-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind v4">
  <img src="https://img.shields.io/badge/TanStack_Start-v1.167.50-FF4154?style=flat-square&logo=react" alt="TanStack Start">
  <img src="https://img.shields.io/badge/OpenRouter-API-7C3AED?style=flat-square&logo=openai&logoColor=white" alt="OpenRouter API">
  <img src="https://img.shields.io/badge/GSAP-Animations-88CE02?style=flat-square&logo=greensock&logoColor=white" alt="GSAP Animations">
  <img src="https://img.shields.io/badge/Zod-v4.4.3-3E67B1?style=flat-square&logo=zod&logoColor=white" alt="Zod Schema">
  <img src="https://img.shields.io/badge/Academic_Viva-Ready-green?style=flat-square" alt="Academic Viva Ready">
</p>

<p align="center">
  <b>TwinSec</b> is an interactive cyber-physical range and incident simulation platform. Designed for grid engineers, OT security operations, and critical infrastructure defenders, it provides a safe, frame-consistent environment to rehearse containment playbook drills and analyze physical cascades caused by cyberattacks.
</p>

---

## ⚡ Core Emulation Pillars & "WOW" Features

TwinSec goes beyond generic web dashboards by introducing low-level protocol inspection, dynamic signature synthesis, and mathematical physics modeling.

### 🔍 1. OT Protocol Hex Packet Inspector

Analyze network activity at the raw byte level. During a simulation, operators can launch the **Packet Inspector** to view low-level protocol frame decodes:

- **Modbus TCP:** MBAP Header decoding, Transaction IDs, Unit IDs, and register payload extractions.
- **Siemens S7 Comm:** PDU parsing, Parameter data block reads, and memory address variables.
- **DNP3 & BACnet:** Frames and target physical register state changes.

```
+-----------------------------------------------------------------------+
|  MBAP HEADER (7 Bytes)                                                |
|  [Trans ID: 0x04D2] [Proto ID: 0x0000] [Len: 0x0006] [Unit ID: 0x01]  |
+-----------------------------------------------------------------------+
|  PDU (5 Bytes)                                                        |
|  [Func Code: 0x06 (Write)] [Reg Addr: 0x9C41] [Val: 0x02A0]           |
+-----------------------------------------------------------------------+
|  Raw Hex: 00 00 00 00 00 06 01 06 9C 41 02 A0                         |
+-----------------------------------------------------------------------+
```

### 📈 2. Real-Time Physics Differential Engine

Incident outcomes are governed by dynamic mathematical formulas rather than static timelines. The platform graphs rotor velocity ω(t) and bearing thermal load T(t) dynamically using differential equations:

$$\frac{d\omega}{dt} = \frac{T_m - T_e}{J} - D\omega$$

Making containment choices like **Fail-Safe** or **Manual Trip** alters the parameters, curving the line graph away from the critical danger threshold.

### 📝 3. Dynamic Sigma Rule Compiler

Defenders can automatically generate a **Sigma Detection Rule (YAML)** for each attack stage (e.g., _HMI Credential Replay_ or _SIS Interlock Bypass_) to import directly into active enterprise SIEM tools.

### 💻 4. Interactive Command-Line Console

Toggle the **Control Room Terminal** (Ctrl+T or terminal drawer) to command the simulation range via shell inputs:

```bash
# Discover active Modbus (502) and S7 (102) controller ports
$ scan 10.0.3.5

# Write value to PLC-3 register to manipulate physical telemetry
$ write-register plc-3 40001 500

# Deactivate safety interlock cutoff thresholds
$ inject-bypass sis-ls
```

### 🎯 5. Espionage Briefing Engine (AI-Powered)

Generate context-aware threat briefings using OpenRouter's Qwen model with safety-gated I/O scrubbing to prevent malicious content propagation.

### 🏭 6. Critical Infrastructure Facility Library

Explore multiple critical infrastructure sectors with pre-built facilities including power plants, smart buildings, oil & gas refineries, water treatment plants, manufacturing facilities, and ports.

### 📜 7. DEF CON Briefing & S4 Talk Tracks

Access DEF CON-style security briefings and S4 (SCADA Security Scientific Symposium) talk content for OT security learning.

### 📊 8. Field Reports & Whitepapers

Browse curated field reports from real-world OT incidents and academic whitepapers on OT security best practices.

---

## 💼 Enterprise-Grade Capabilities

- 💾 **LocalStorage History Ledger:** Saves operator choices, MTTD/MTTR statistics, and branch outcomes to compile a persistent dashboard scorecard.
- 📊 **CEF Log Exporter:** Outputs simulated event logs in Common Event Format (CEF) for testing detection rules in Splunk or Microsoft Sentinel.
- 🔑 **Generative AI Safety Gates:** Input/output data of espionage briefings is scrubbed using Zod schemas and regex to defang malicious playbooks, shellcode, and keys.
- 🌐 **OpenRouter Integration:** Leverages OpenRouter API with configurable models (default: qwen/qwen3-next-80b-a3b-instruct:free) for AI-powered content generation.
- 📄 **PDF Export:** Export facility schematics, simulation reports, and briefings to PDF using jsPDF and html-to-image.
- 🔒 **SSR Concurrency-Safe:** Refactored simulation engine eliminates global mutable state to prevent race conditions in multi-user SSR environments.

---

## 📂 Project Architecture

```
twinsec/
├── src/
│   ├── routes/                    # File-Based Routing (TanStack Start)
│   │   ├── index.tsx              # Landing Dashboard
│   │   ├── simulation.tsx         # Live Simulation & Network Graph
│   │   ├── espionage.tsx          # AI Threat Dossier Briefing Cockpit
│   │   ├── facility.$id.tsx       # Facility-Specific Schematics
│   │   ├── def-con-brief.tsx      # DEF CON Style Security Briefings
│   │   ├── s4-talk.tsx            # S4 SCADA Security Talks
│   │   ├── field-reports.tsx      # Real-World OT Incident Reports
│   │   ├── whitepapers.tsx        # Academic & Industry Whitepapers
│   │   └── twin-engine.tsx        # TwinSec Engine Documentation
│   ├── components/ui/             # shadcn/ui Components (Radix Primitives)
│   ├── hooks/                     # GSAP Scroll Animations & Text Reveals
│   │   ├── use-gsap-reveal.ts
│   │   ├── use-mobile.tsx
│   │   └── use-text-anim.ts
│   └── lib/
│       ├── api/                   # Zod-Validated Server Functions
│       │   ├── espionage.functions.ts
│       │   └── example.functions.ts
│       ├── ai-gateway.server.ts   # OpenRouter LLM Provider Config
│       ├── config.server.ts
│       ├── error-capture.ts
│       ├── error-page.ts
│       ├── error-reporting.ts
│       └── utils.ts
├── .env                           # Environment Variables (gitignored)
├── .env.example                   # Example Environment Variables
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Running the Range Locally

Deploy the cyber range locally with these commands:

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=gsk_your_groq_key_here          # Primary ultra-fast 70B AI inference
OPENROUTER_API_KEY=sk-or-v1-your-key-here     # Fallback AI cloud provider
GEMINI_API_KEY=AQ.your_gemini_key_here        # Optional Gemini provider
CEREBRAS_API_KEY=csk-your_cerebras_key_here   # Optional Cerebras provider
```

You can obtain free API keys from [Groq Console](https://console.groq.com/keys) or [OpenRouter](https://openrouter.ai/keys).

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the cockpit.

### 4. Build for Production

```bash
npm run build
```

### 5. Linting & Formatting

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

---

## 📐 Software Engineering & Project Report Diagrams

TwinSec provides a comprehensive set of native **Mermaid Software Engineering Diagrams** (` ```mermaid ` codeblocks) for direct inclusion into academic project reports, technical whitepapers, and viva presentations. All diagrams are located in the [`diagrams/`](file:///d:/PRJ-7/twinsec/diagrams/) directory:

- 🏗 **[01_SYSTEM_ARCHITECTURE.md](file:///d:/PRJ-7/twinsec/diagrams/01_SYSTEM_ARCHITECTURE.md)** — High-level 4-tier system architecture diagram.
- 🔄 **[02_DFD_LEVEL_0_CONTEXT.md](file:///d:/PRJ-7/twinsec/diagrams/02_DFD_LEVEL_0_CONTEXT.md)** — Data Flow Diagram Level 0 context diagram (`0.0 TwinSec`).
- 📊 **[03_DFD_LEVEL_1_DETAILED.md](file:///d:/PRJ-7/twinsec/diagrams/03_DFD_LEVEL_1_DETAILED.md)** — Data Flow Diagram Level 1 process decomposition (`1.0` to `6.0`).
- 🔍 **[04_DFD_LEVEL_2_SUBPROCESS.md](file:///d:/PRJ-7/twinsec/diagrams/04_DFD_LEVEL_2_SUBPROCESS.md)** — DFD Level 2 sub-process breakdown (Physics Engine & AI Safety Scrubber).
- 📡 **[05_EDR_OT_TELEMETRY_PIPELINE.md](file:///d:/PRJ-7/twinsec/diagrams/05_EDR_OT_TELEMETRY_PIPELINE.md)** — EDR & OT packet inspection, physics engine, CEF & Sigma pipeline.
- 📦 **[06_UML_CLASS_DIAGRAM.md](file:///d:/PRJ-7/twinsec/diagrams/06_UML_CLASS_DIAGRAM.md)** — UML Class & Module Structure diagram.
- 🎯 **[07_USE_CASE_DIAGRAM.md](file:///d:/PRJ-7/twinsec/diagrams/07_USE_CASE_DIAGRAM.md)** — System Use Case diagram for Operators, Instructors, and Admins.
- ⚙️ **[08_SIMULATION_STATE_MACHINE.md](file:///d:/PRJ-7/twinsec/diagrams/08_SIMULATION_STATE_MACHINE.md)** — Simulation lifecycle state machine (`RECON` → `EXPLOIT` → `DEFEND` → `REVIEW`).
- 🗄 **[09_ENTITY_RELATIONSHIP_DIAGRAM.md](file:///d:/PRJ-7/twinsec/diagrams/09_ENTITY_RELATIONSHIP_DIAGRAM.md)** — SQLite/Drizzle ORM database entity-relationship diagram.
- 🛡 **[10_AI_GATEWAY_DEFANGING_SEQUENCE.md](file:///d:/PRJ-7/twinsec/diagrams/10_AI_GATEWAY_DEFANGING_SEQUENCE.md)** — AI Gateway sequence diagram, failover routing, and safety defanging.
- 🏭 **[11_PURDUE_MODEL_OT_TOPOLOGY.md](file:///d:/PRJ-7/twinsec/diagrams/11_PURDUE_MODEL_OT_TOPOLOGY.md)** — 5-Layer Purdue Model industrial OT network topology across 7 sectors.
- 🧩 **[12_COMPONENT_AND_DATA_FLOW.md](file:///d:/PRJ-7/twinsec/diagrams/12_COMPONENT_AND_DATA_FLOW.md)** — React 19 component tree hierarchy and client/server RPC data flow.
- 🖼 **[VISUAL_SOFTWARE_ENGINEERING_DIAGRAMS.md](file:///d:/PRJ-7/twinsec/diagrams/VISUAL_SOFTWARE_ENGINEERING_DIAGRAMS.md)** — Graphical Draw.io visual suite for slide decks.

---

## 🎓 Academic Viva Evaluation Guide (Semester 7)

Use this checklist during your final evaluation viva to demonstrate deep project rigor:

1.  **Explain Concurrency-Safe Routing:** Discuss how you refactored raw global array manipulations in [simulation.tsx](file:///d:/PRJ-7/twinsec/src/routes/simulation.tsx) into pure hooks and React context state scopes, resolving multi-tenant SSR race conditions.
2.  **Demonstrate Hex Decoding:** Click the **Packet Inspector** to showcase low-level frame decoding, showing you understand network protocols.
3.  **Explain Physics Modeling:** Discuss the differential equations governing rotor damping and temperature coefficients, showing mathematical integration with React rendering.
4.  **Demonstrate SIEM Export Loop:** Download the CEF logs and a Sigma rule to prove the application serves an end-to-end security purpose.
5.  **Show AI Gateway Safety:** Explain how [ai-providers.server.ts](file:///d:/PRJ-7/twinsec/src/lib/ai-providers.server.ts) routes requests through Groq/OpenRouter and uses `scrubContent()` safety gates to defang malicious code.
6.  **Navigate Facility Library:** Showcase the various critical infrastructure facilities and their interactive schematics.
7.  **Export a PDF:** Demonstrate PDF export functionality for simulation reports or briefings.

---

## 📚 Additional Documentation

- [diagrams/README.md](file:///d:/PRJ-7/twinsec/diagrams/README.md) - Software Engineering & Architecture Diagram Directory Index
- [TWINSEC_PROJECT_DOCUMENTATION.md](file:///d:/PRJ-7/twinsec/TWINSEC_PROJECT_DOCUMENTATION.md) - Comprehensive project documentation for AI assistants
- [TWINSEC_PROCESS_FLOWS.md](file:///d:/PRJ-7/twinsec/TWINSEC_PROCESS_FLOWS.md) - Process flow diagrams and documentation
