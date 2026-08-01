# 06. UML Class & Module Structure Diagram

This document models the object-oriented structure, interfaces, server functions, and data schemas for **TwinSec** using a **Mermaid Class Diagram**.

## UML Class Diagram (Mermaid)

```mermaid
classDiagram
    class Node {
        +string id
        +string label
        +string kind
        +number x
        +number y
        +number ring
    }

    class Event {
        +number t
        +string node
        +string tag
        +string title
        +string desc
        +string sev
    }

    class Decision {
        +string id
        +number t
        +string question
        +string actText
        +string deferText
    }

    class TelemetryMetric {
        +string id
        +string label
        +string unit
        +number baseline
        +impactFn(phase, physicsMul, t) number
    }

    class RoleBriefing {
        +SectorId sector
        +OperationalRole role
        +string scenarioCode
        +string generatedAt
        +AttackObjective[] objectives
        +TechniqueEntry[] ttps
        +ImpactAssessment impact
        +ThreatActorProfile threatActor
        +string[] prerequisites
    }

    class Operator {
        +string id
        +string callsign
        +string email
        +string badgeId
        +string clearance
        +string passwordHash
        +string role
        +string createdAt
    }

    class TrainingRun {
        +string id
        +string operatorId
        +SectorId sector
        +string adversary
        +string attackType
        +string branch
        +number mwShed
        +number mttd
        +number mttr
        +number score
        +string shareUrl
        +string completedAt
    }

    class AuditLog {
        +string id
        +string trainingRunId
        +string operatorId
        +string timestamp
        +string eventType
        +string severity
        +string details
    }

    class AIGateway {
        +PRIMARY_TIMEOUT_MS: number
        +getProviderForTask(task) ProviderConfig
        +getFallbackProvider() ProviderConfig
        +callAI(task, generateFn) Promise~T~
        +scrubContent(text) string
    }

    class SimulationEngine {
        +SectorId sector
        +number t
        +boolean playing
        +Set~string~ scannedNodes
        +Set~string~ activeCompromisedNodes
        +Record~string, string~ defMitigations
        +computeOutcome(choices, decisions, sector) Outcome
        +calculateLiveScore(metrics) LiveScore
    }

    SimulationEngine "1" -- "*" Node : contains
    SimulationEngine "1" -- "*" Event : triggers
    SimulationEngine "1" -- "*" Decision : prompts
    SimulationEngine "1" -- "3" TelemetryMetric : monitors
    SimulationEngine ..> RoleBriefing : displays
    Operator "1" -- "*" TrainingRun : executes
    Operator "1" -- "*" AuditLog : triggers
    TrainingRun "1" -- "*" AuditLog : records
    AIGateway ..> RoleBriefing : synthesizes
```

## Module Responsibilities

1. **`SimulationEngine`**: Core state orchestrator (`src/routes/simulation.tsx`) managing timeline playback, decision evaluation, and live scoring.
2. **`TelemetryMetric`**: Registry defining 3 physics metrics per sector (`src/data/sector-telemetry.ts`).
3. **`AIGateway`**: Multi-provider wrapper managing timeouts, provider switching, and output defanging (`src/lib/ai-providers.server.ts`).
4. **`Operator` / `TrainingRun` / `AuditLog`**: Relational database models backed by Drizzle ORM (`src/lib/db/schema.ts`).
