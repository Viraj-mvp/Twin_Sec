# 08. Simulation Phase State Machine Diagram

This document models the state transitions and execution lifecycle of the **TwinSec Simulation Engine** (`src/routes/simulation.tsx`).

## State Machine Diagram (Mermaid)

```mermaid
stateDiagram-v2
    [*] --> RECON: Mount Route (/simulation?sector=X)

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
