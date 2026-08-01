# 07. Use Case Diagram

This document contains the **System Use Case Diagram (Mermaid)** mapping primary user roles (Range Operator, Instructor, System Administrator) to core system capabilities.

## Use Case Diagram (Mermaid)

```mermaid
graph LR
    subgraph Actors ["User Roles / Actors"]
        Operator["Range Operator / Defender"]
        Instructor["OT Instructor / Evaluator"]
        Admin["System Administrator"]
    end

    subgraph UseCases ["TwinSec System Use Cases"]
        UC1(("UC-1: Authenticate Session & Badge"))
        UC2(("UC-2: Select Infrastructure Sector"))
        UC3(("UC-3: Run OT Port Scan & Discovery"))
        UC4(("UC-4: Stage Red-Team Exploit Chain"))
        UC5(("UC-5: Execute Real-Time Mitigation (Isolate/Patch/Trip)"))
        UC6(("UC-6: Inspect Raw Hex Packets (Modbus/S7)"))
        UC7(("UC-7: Generate AI Role Briefing & Phase Guidance"))
        UC8(("UC-8: Review Post-Mortem Scorecard & Metrics"))
        UC9(("UC-9: Export CEF SIEM Logs & Sigma Rules"))
        UC10(("UC-10: Create Custom Simulation Scenarios"))
        UC11(("UC-11: Audit Operator Training Ledger"))
    end

    %% Operator Connections
    Operator --> UC1
    Operator --> UC2
    Operator --> UC3
    Operator --> UC4
    Operator --> UC5
    Operator --> UC6
    Operator --> UC7
    Operator --> UC8
    Operator --> UC9

    %% Instructor Connections
    Instructor --> UC1
    Instructor --> UC8
    Instructor --> UC9
    Instructor --> UC10
    Instructor --> UC11

    %% Admin Connections
    Admin --> UC1
    Admin --> UC10
    Admin --> UC11
```

## Actor & Use Case Summary

| Actor              | Key Objectives                                              | Primary Interactions                                                                                                 |
| ------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Range Operator** | Practice incident containment, minimize MW shed & MTTD/MTTR | Scans topology nodes, executes defense interventions, inspects raw Modbus/S7 hex frames, downloads debrief dossiers. |
| **OT Instructor**  | Evaluate operator readiness, design custom OT cyber drills  | Creates custom scenarios (`simulationScenarios`), audits student performance logs, exports CEF telemetry.            |
| **System Admin**   | Maintain range availability, manage database tables         | Manages SQLite database schemas, monitors session validity, verifies AI Gateway provider configurations.             |
