# 02. Data Flow Diagram — Level 0 (Context Diagram)

This document contains the **Level 0 Context Data Flow Diagram (DFD)** for the **TwinSec Platform**.

## DFD Level 0 Context Diagram (Mermaid)

```mermaid
flowchart LR
    subgraph ExternalEntities ["External Entities"]
        Operator["Operator / Defender User"]
        Instructor["Instructor / Admin User"]
        SIEM["Enterprise SIEM (Splunk / Sentinel)"]
        AICloud["Cloud AI Providers (Groq / OpenRouter)"]
    end

    subgraph SystemBoundary ["TwinSec System Boundary (0.0)"]
        TwinSec["0.0 TwinSec Cyber-Physical Simulation & Range Platform"]
    end

    %% Inputs to System
    Operator -->|"1. Credentials / Role Selection / Mitigation Actions"| TwinSec
    Instructor -->|"2. Custom Scenario Configuration & Scenario Rules"| TwinSec
    AICloud -->|"3. LLM Generated Briefings & Tactical Hints"| TwinSec

    %% Outputs from System
    TwinSec -->|"4. Telemetry Sparklines / Packet Decodes / Scorecard"| Operator
    TwinSec -->|"5. Student Benchmarks / Audit Ledgers / Run Reports"| Instructor
    TwinSec -->|"6. CEF Event Logs & Compiled Sigma Rules (YAML)"| SIEM
    TwinSec -->|"7. Sanitized & Defanged System Prompts"| AICloud
```

## Entity Descriptions

- **Operator / Defender User:** Interacts with the cockpit, triggers node scans, applies containment actions (`ISOLATE`, `PATCH`, `TRIP`), and views debrief scorecards.
- **Instructor / Admin User:** Manages custom simulation scenarios, monitors student audit logs, and exports aggregate training metrics.
- **Enterprise SIEM:** Ingests Common Event Format (CEF) logs and Sigma rules generated during containment drills.
- **Cloud AI Providers:** Receives scrubbed operational prompts and returns defanged role briefings and hints.
