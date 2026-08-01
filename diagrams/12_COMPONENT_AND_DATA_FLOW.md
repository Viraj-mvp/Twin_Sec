# 12. Component Architecture & Data Flow Diagram

This document models the frontend component hierarchy and client-to-server data flow across the application (`src/routes/simulation.tsx` and `@features/simulation`).

## Component Hierarchy & Data Flow (Mermaid)

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
