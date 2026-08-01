# 09. Entity-Relationship (ER) Database Schema Diagram

This document illustrates the database schema and table relationships for **TwinSec** backed by Drizzle ORM and Better-SQLite3 (`src/lib/db/schema.ts`).

## Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    OPERATORS ||--o{ SESSIONS : "authenticates"
    OPERATORS ||--o{ TRAINING_RUNS : "executes"
    OPERATORS ||--o{ AUDIT_LOGS : "triggers"
    OPERATORS ||--o{ SIMULATION_SCENARIOS : "creates"
    TRAINING_RUNS ||--o{ AUDIT_LOGS : "logs events to"

    OPERATORS {
        string id PK "crypto.randomUUID()"
        string callsign UK "Unique Call Sign"
        string email UK "Unique Email Address"
        string badgeId UK "Unique Badge ID"
        string clearance "TS/SCI · RED LEVEL"
        string passwordHash "Bcrypt Hash"
        string role "operator | instructor | admin"
        string createdAt "ISO 8601 Timestamp"
    }

    SESSIONS {
        string id PK "crypto.randomUUID()"
        string token UK "Session Cookie Token"
        string operatorId FK "references operators.id (CASCADE)"
        string expiresAt "ISO 8601 Expiry Timestamp"
        string ip "Client IP Address"
        string userAgent "Client User Agent"
        string createdAt "ISO 8601 Timestamp"
    }

    TRAINING_RUNS {
        string id PK "crypto.randomUUID()"
        string operatorId FK "references operators.id (SET NULL)"
        string sector "power | water | oil-gas | etc."
        string adversary "UNIT-414 | AURA-9 | SILT-2 | etc."
        string attackType "disruption | espionage"
        string adversaryProfile "nation-state | insider | etc."
        string attackChain "full-spectrum"
        string espionageObjective "Text description"
        string branch "A - BASELINE | D - CONTAINED"
        real mwShed "Megawatts / Impact Shed"
        integer mttd "Mean Time To Detect (sec)"
        integer mttr "Mean Time To Respond (sec)"
        integer cost "Simulated Cost (USD)"
        integer score "Performance Score (0-100)"
        string role "RED | BLUE"
        string briefingGeneratedAt "Timestamp"
        integer hintCount "Hints used"
        string decisionHistory "JSON Array"
        string terminalCommands "JSON Array"
        string isolatedNodes "JSON Array"
        string shareUrl "Replay Link URL"
        string completedAt "Timestamp"
        string createdAt "Timestamp"
    }

    AUDIT_LOGS {
        string id PK "crypto.randomUUID()"
        string trainingRunId FK "references training_runs.id (CASCADE)"
        string operatorId FK "references operators.id (SET NULL)"
        string timestamp "ISO 8601 Timestamp"
        string eventType "decision | terminal-command | hint | scrub"
        string severity "info | warn | error"
        string details "JSON Metadata Payload"
    }

    SIMULATION_SCENARIOS {
        string id PK "crypto.randomUUID()"
        string createdBy FK "references operators.id"
        string sector "Sector Identifier"
        string name "Custom Scenario Name"
        string description "Scenario Description"
        string attackType "disruption | espionage"
        string adversaryProfile "Profile Type"
        string initialNodes "JSON Nodes Array"
        string events "JSON Events Array"
        string decisions "JSON Decisions Array"
    }
```
