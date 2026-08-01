# 07. Component Architecture & Data Flow Diagram

This document models the frontend component hierarchy and client-to-server data flow across the application (`src/routes/simulation.tsx` and `@features/simulation`).

## Component Hierarchy & Data Flow

```mermaid
graph LR
    subgraph RouteLayer ["Routes Layer (/routes)"]
        IndexRoute["index.tsx (Main Hub)"]
        SimRoute["simulation.tsx (Range Page)"]
        FacilityRoute["facility.$id.tsx (Facility Inspector)"]
    end

    subgraph FeatureComponents ["Simulation Feature Suite (@features/simulation)"]
        Nav["KineticOperatorNav.tsx"]
        Menu["OperatorMenu.tsx"]
        StatusBar["StatusBar.tsx"]
        TransportBar["TransportBar.tsx"]
        Topology2D["Topology2D.tsx"]
        ThreeCanvas["Canvas3D (Three.js)"]
        RoleBriefing["RoleBriefingPanel.tsx"]
        PhaseGuidance["PhaseGuidancePanel.tsx"]
        PacketInspector["PacketInspector.tsx"]
        KaliTerminal["KaliTerminal.tsx"]
        DecisionOverlay["DecisionOverlay.tsx"]
        DebriefScorecard["DebriefScorecard.tsx"]
        Onboarding["SimulationOnboarding.tsx"]
    end

    subgraph APIFunctions ["Server RPC Functions (src/lib/api)"]
        AuthFn["auth.functions.ts"]
        RoleBriefingFn["role-briefing.functions.ts"]
        SimFn["simulation.functions.ts"]
        ExportFn["export.functions.ts"]
    end

    SimRoute --> StatusBar
    SimRoute --> TransportBar
    SimRoute --> Topology2D
    SimRoute --> ThreeCanvas
    SimRoute --> RoleBriefing
    SimRoute --> PhaseGuidance
    SimRoute --> PacketInspector
    SimRoute --> KaliTerminal
    SimRoute --> DecisionOverlay
    SimRoute --> DebriefScorecard
    SimRoute --> Onboarding

    RoleBriefing -->|RPC Request| RoleBriefingFn
    PhaseGuidance -->|RPC Request| RoleBriefingFn
    KaliTerminal -->|RPC Request| SimFn
    DebriefScorecard -->|RPC Request| ExportFn
    Menu -->|RPC Request| AuthFn
```

## Data Flow Protocol

1. **State Initialization**: When `/simulation?sector=water` mounts, `getScenarioData("water")` populates nodes, edges, events, and decisions into React state.
2. **Time Scrubbing**: Moving the `TransportBar` slider updates `t` state, triggering `activeIdx` search in scenario events.
3. **Topology Rendering**: `Topology2D` computes SVG node positions and edge line SVG paths, applying color highlights (`oklch`) based on node status (`NOMINAL`, `DRIFT`, `COMPROMISED`, `ISOLATED`).
4. **Packet Inspection**: Clicking any active network edge opens `PacketInspector`, which decodes raw Modbus TCP or Siemens S7 bytes dynamically based on event tags.
5. **Mitigation Interventions**: Executing an action (`ISOLATE`, `PATCH`, `TRIP`) updates `defMitigations` map, recalculates `choices` via ring-level analysis, and updates physics differential equations.
