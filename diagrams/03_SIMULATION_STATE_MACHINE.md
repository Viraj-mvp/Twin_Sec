# 03. Simulation Phase State Machine Diagram

This document models the state transitions and execution lifecycle of the **TwinSec Simulation Engine** (`src/routes/simulation.tsx`).

## State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> RECON: Sector Selected (/simulation?sector=X)

    state RECON {
        [*] --> SelectAsset: Click Node in Topology
        SelectAsset --> ExecuteScan: Run Port / Firmware Scan
        ExecuteScan --> UnlockExploit: Scanned Nodes >= 3
    }

    RECON --> EXPLOIT: Advance Phase or Scan Threshold Met

    state EXPLOIT {
        [*] --> StageAttackChain: Select Target Path
        StageAttackChain --> DefangPayload: AI / Rule Safety Gate
        DefangPayload --> LaunchSimulation: Operator Clicks 'LAUNCH ATTACK 🚨'
    }

    EXPLOIT --> DEFEND: Attack Staged & Scrub Transport Played

    state DEFEND {
        [*] --> TimelineRunning: Transport T+0 -> T+Total
        TimelineRunning --> DecisionTrigger: Incident Event Reached
        DecisionTrigger --> UserIntervention: Pause & Display Decision Prompt

        state UserIntervention {
            [*] --> ActionISOLATE: Isolate Network (Airgap)
            [*] --> ActionPATCH: Push Firmware Patch
            [*] --> ActionTRIP: Manual Fail-Safe Trip
        }

        ActionISOLATE --> ResumeTimeline: Physics Impact Dampened
        ActionPATCH --> ResumeTimeline: Cascade Contained
        ActionTRIP --> ResumeTimeline: Envelope Preserved
    }

    DEFEND --> REVIEW: Timeline T = T_Max Completed

    state REVIEW {
        [*] --> ComputeScore: Calculate Score (0-100), MTTD, MTTR
        ComputeScore --> RenderScorecard: Render Debrief Scorecard Modal
        RenderScorecard --> SaveTrainingRun: Write Run to SQLite Audit Database
        SaveTrainingRun --> ExportSIEM: Generate CEF / Sigma / PDF Reports
    }

    REVIEW --> [*]: Operator Restarts or Selects New Sector
```

## Phase Summary Table

| Phase       | Cell Mode  | Primary Operator Action                                                         | Key State Transitions                                        |
| ----------- | ---------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **RECON**   | Red Cell   | Scan Purdue Ring 0–1 nodes, discover open ports and OT protocols                | `scannedNodes.size >= 3` → Unlocks Exploit Stage             |
| **EXPLOIT** | Red Cell   | Stage attack vector against Ring 3 controllers and Ring 4 SIS                   | `defangPayload()` → Transition to DEFEND mode                |
| **DEFEND**  | Blue Cell  | Monitor physics sparklines, apply containment mitigations on event triggers     | `defMitigations[nodeId]` → Adjust `physicsMul` multiplier    |
| **REVIEW**  | Evaluation | Inspect debrief scorecard, review MTTD/MTTR metrics, export CEF/Sigma artifacts | `saveTrainingRun()` → Ingest run into SQLite `training_runs` |
