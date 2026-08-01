# 📐 TwinSec Software Engineering Mermaid Diagram Suite

This directory contains the full suite of **Native Mermaid Software Engineering Diagrams** for the **TwinSec Cyber-Physical Range & Incident Simulation Platform**.

All diagrams are authored in pure **Mermaid code block syntax** (` ```mermaid `) so they render dynamically in GitHub, VS Code, and IDE previews with crisp boxes, levels, arrows, and data flow paths.

---

## 📑 Software Engineering Diagram Index

| File                                                                                                                       | Diagram Type                  | Scope & Description                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 🏗 **[01_SYSTEM_ARCHITECTURE.md](file:///d:/PRJ-7/twinsec/diagrams/01_SYSTEM_ARCHITECTURE.md)**                             | **System Architecture**       | High-level 4-tier stack (Client SPA, TanStack Start SSR, Persistence, Multi-Provider AI Gateway).                |
| 🔄 **[02_DFD_LEVEL_0_CONTEXT.md](file:///d:/PRJ-7/twinsec/diagrams/02_DFD_LEVEL_0_CONTEXT.md)**                            | **DFD Level 0 (Context)**     | System boundary `0.0 TwinSec`, external entities (Operator, Instructor, SIEM, Cloud AI), and data flows.         |
| 📊 **[03_DFD_LEVEL_1_DETAILED.md](file:///d:/PRJ-7/twinsec/diagrams/03_DFD_LEVEL_1_DETAILED.md)**                          | **DFD Level 1 (Process)**     | Detailed sub-process breakdown (`1.0 Auth` to `6.0 Exporter`), data stores (`D1`-`D5`), and flow paths.          |
| 🔍 **[04_DFD_LEVEL_2_SUBPROCESS.md](file:///d:/PRJ-7/twinsec/diagrams/04_DFD_LEVEL_2_SUBPROCESS.md)**                      | **DFD Level 2 (Sub-Process)** | Sub-process decomposition for Physics Differential Engine (`4.0`) and AI Security Scrubber (`5.0`).              |
| 📡 **[05_EDR_OT_TELEMETRY_PIPELINE.md](file:///d:/PRJ-7/twinsec/diagrams/05_EDR_OT_TELEMETRY_PIPELINE.md)**                | **EDR & Telemetry Pipeline**  | End-to-End EDR pipeline: Modbus/S7 hex frame decode, physics equations, CEF SIEM & Sigma rules.                  |
| 📦 **[06_UML_CLASS_DIAGRAM.md](file:///d:/PRJ-7/twinsec/diagrams/06_UML_CLASS_DIAGRAM.md)**                                | **UML Class Diagram**         | Object-oriented class relationships (`SimulationEngine`, `Node`, `RoleBriefing`, `AIGateway`, `Operator`).       |
| 🎯 **[07_USE_CASE_DIAGRAM.md](file:///d:/PRJ-7/twinsec/diagrams/07_USE_CASE_DIAGRAM.md)**                                  | **Use Case Diagram**          | User roles (Range Operator, OT Instructor, System Admin) mapped to system capabilities (`UC-1` to `UC-11`).      |
| ⚙️ **[08_SIMULATION_STATE_MACHINE.md](file:///d:/PRJ-7/twinsec/diagrams/08_SIMULATION_STATE_MACHINE.md)**                  | **State Machine**             | State transitions across `RECON` → `EXPLOIT` → `DEFEND` → `REVIEW` lifecycle and decision intervention loops.    |
| 🗄 **[09_ENTITY_RELATIONSHIP_DIAGRAM.md](file:///d:/PRJ-7/twinsec/diagrams/09_ENTITY_RELATIONSHIP_DIAGRAM.md)**             | **ERD Database Schema**       | Database schema (`OPERATORS`, `SESSIONS`, `TRAINING_RUNS`, `AUDIT_LOGS`, `SIMULATION_SCENARIOS`).                |
| 🛡 **[10_AI_GATEWAY_DEFANGING_SEQUENCE.md](file:///d:/PRJ-7/twinsec/diagrams/10_AI_GATEWAY_DEFANGING_SEQUENCE.md)**         | **Sequence Diagram**          | Multi-provider AI routing (Groq 70B, OpenRouter, Gemini), 8-second timeout caps, and `scrubContent()` defanging. |
| 🏭 **[11_PURDUE_MODEL_OT_TOPOLOGY.md](file:///d:/PRJ-7/twinsec/diagrams/11_PURDUE_MODEL_OT_TOPOLOGY.md)**                  | **OT Network Topology**       | 5-layer Purdue Model OT network topology (Ring 0 Perimeter to Ring 5 Physical Process) across 7 sectors.         |
| 🧩 **[12_COMPONENT_AND_DATA_FLOW.md](file:///d:/PRJ-7/twinsec/diagrams/12_COMPONENT_AND_DATA_FLOW.md)**                    | **Component & Data Flow**     | React 19 component hierarchy, TanStack RPC server functions, state propagation, and interactive UI drawers.      |
| 🖼 **[VISUAL_SOFTWARE_ENGINEERING_DIAGRAMS.md](file:///d:/PRJ-7/twinsec/diagrams/VISUAL_SOFTWARE_ENGINEERING_DIAGRAMS.md)** | **Graphical Draw.io Suite**   | High-resolution visual diagrams with embedded PNGs for slide presentations.                                      |

---

## 🛠 Usage in Academic Project Reports & Viva Presentations

All 12 `.md` files contain native **Mermaid syntax** (` ```mermaid ` codeblocks). You can copy the Mermaid code directly into:

1. **GitHub / GitLab Markdown Preview**
2. **VS Code / Cursor Markdown Preview**
3. **Notion / Obsidian / HackMD**
4. **Mermaid Live Editor** ([mermaid.live](https://mermaid.live)) to export high-res SVG/PNG vector files for your thesis report.
