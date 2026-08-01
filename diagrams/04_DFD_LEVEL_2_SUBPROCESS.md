# 04. Data Flow Diagram — Level 2 (Sub-Process Decomposition)

This document details the **Level 2 Sub-Process Breakdown (DFD Level 2)** for two core systems:

1. **Sub-Process 4.0:** Dynamic Physics Differential Calculator
2. **Sub-Process 5.0:** AI Security Scrubber & Defanging Pipeline

---

## 1. DFD Level 2 — Physics Engine (Sub-Process 4.0)

```mermaid
flowchart TD
    subgraph Ingestion ["Inputs"]
        TimeIn["Time t (0 -> Total)"]
        ChoicesIn["User Mitigation Choices (d1, d2, d3)"]
        SectorIn["Sector ID (power, water, oil-gas, etc.)"]
    end

    subgraph SubProcess4 ["4.0 Physics Differential Calculator"]
        P4_1["4.1 Calculate Mitigation Factor (physicsMul)"]
        P4_2["4.2 Compute Sector Telemetry Impact"]
        P4_3["4.3 Apply Damping & Differential Waveforms"]
        P4_4["4.4 Update Sparkline History Buffer (20 pts)"]
    end

    subgraph Outputs4 ["Outputs"]
        Spark1["Metric 1 Sparkline (e.g. Rotor Speed Hz / Chlorine ppm)"]
        Spark2["Metric 2 Sparkline (e.g. Bearing Temp °C / Flow Rate)"]
        Spark3["Metric 3 Sparkline (e.g. Feeder Press bar / Tank Level)"]
    end

    TimeIn --> P4_2
    SectorIn --> P4_2
    ChoicesIn --> P4_1
    P4_1 -->|"physicsMul multiplier"| P4_2
    P4_2 --> P4_3
    P4_3 --> P4_4
    P4_4 --> Spark1
    P4_4 --> Spark2
    P4_4 --> Spark3
```

---

## 2. DFD Level 2 — AI Gateway & Defanging Scrubber (Sub-Process 5.0)

```mermaid
flowchart TD
    subgraph Ingestion5 ["Inputs"]
        UserReq["User Prompt / Briefing Request"]
        TaskType["Task Type (role_briefing, phase_guidance, etc.)"]
    end

    subgraph SubProcess5 ["5.0 AI Gateway & Security Scrubber"]
        P5_1["5.1 Validate & Sanitize Input via Zod Schema"]
        P5_2["5.2 Select Provider Chain (Groq -> OpenRouter -> Ollama)"]
        P5_3["5.3 Execute LLM Request with 8s Timeout Cap"]
        P5_4["5.4 Regex Redact Credentials & API Keys"]
        P5_5["5.5 Prepend [DEFANGED - TRAINING ONLY] Header"]
        P5_6["5.6 Log Audit Entry (trainingRunId, timestamp)"]
    end

    subgraph DataStore5 ["Data Store"]
        AuditDB[("D4: Audit Logs Table")]
    end

    subgraph Output5 ["Outputs"]
        DefangedDossier["Defanged Role Briefing / Phase Guidance Dossier"]
    end

    UserReq --> P5_1
    TaskType --> P5_1
    P5_1 --> P5_2
    P5_2 --> P5_3
    P5_3 --> P5_4
    P5_4 --> P5_5
    P5_5 --> P5_6
    P5_6 -->|"Insert Row (FK Validated)"| AuditDB
    P5_5 --> DefangedDossier
```
