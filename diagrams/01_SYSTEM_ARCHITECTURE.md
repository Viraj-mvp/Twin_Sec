# 01. High-Level System Architecture Diagram

This document contains the formal **Mermaid System Architecture Diagram** for the **TwinSec Cyber-Physical Range & Incident Simulation Platform**.

## System Architecture (Mermaid)

```mermaid
graph TD
    subgraph ClientLayer ["1. CLIENT LAYER (Browser SPA)"]
        UI["React 19 Interactive Cockpit UI"]
        Canvas3D["Three.js 3D Attack Vector Canvas"]
        GSAP["GSAP Micro-Animation Engine"]
        Tailwind["TailwindCSS v4 Neo-Brutalist Tokens"]
    end

    subgraph ServerLayer ["2. APPLICATION SERVER LAYER (TanStack Start + Node.js)"]
        SSR["TanStack Start SSR Engine"]
        RPC["Server RPC Handlers (src/lib/api)"]
        Physics["7-Sector Physics Differential Engine"]
        Scrubber["Security Defanging & Sanitization Filter"]
    end

    subgraph PersistenceLayer ["3. PERSISTENCE & DATA LAYER"]
        SQLite[(Better-SQLite3 Database)]
        Drizzle["Drizzle ORM Schema & Migration"]
        LocalStorage["Client LocalStorage Ledger"]
    end

    subgraph AIGatewayLayer ["4. MULTI-PROVIDER AI GATEWAY LAYER"]
        Groq["Groq API (Llama 3.3 70B Versatile)"]
        OpenRouter["OpenRouter API (Llama 3.1 8B)"]
        Gemini["Google Gemini API (2.0 Flash)"]
        Ollama["Local Ollama Instance (Offline)"]
    end

    %% Client to Server Flow
    UI -->|Render & Action Events| SSR
    UI -->|RPC Server Function Calls| RPC
    UI -->|Persist Local State| LocalStorage

    %% Server to Persistence Flow
    RPC -->|CRUD Operations| Drizzle
    Drizzle -->|SQL Queries| SQLite

    %% Server to Physics & Security
    RPC -->|Compute Telemetry| Physics
    RPC -->|Scrub Raw Outputs| Scrubber

    %% Server to AI Gateway
    RPC -->|Sanitized Prompt Request| AIGatewayLayer
    AIGatewayLayer -->|Primary Fast Provider| Groq
    AIGatewayLayer -->|Secondary Cloud Fallback| OpenRouter
    AIGatewayLayer -->|Tertiary Cloud Provider| Gemini
    AIGatewayLayer -->|Local Offline Fallback| Ollama
```

## Layer Descriptions

1. **Client Layer:** Renders the neo-brutalist user interface using React 19, Three.js 3D Canvas visualizers, and GSAP micro-animations.
2. **Application Server Layer:** Executes server-side rendering, type-safe RPC endpoints, physics differential equation evaluation, and regex payload defanging.
3. **Persistence Layer:** Manages relational user accounts, session cookies, training runs, and audit event logs via Drizzle ORM and Better-SQLite3.
4. **Multi-Provider AI Gateway Layer:** Directs LLM prompts across Groq, OpenRouter, Gemini, and Ollama with an 8-second timeout cap and fallback failover logic.
