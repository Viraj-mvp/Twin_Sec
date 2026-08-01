# 05. EDR & OT Telemetry Pipeline Diagram

This document contains the **End-to-End EDR Telemetry & OT Packet Inspection Pipeline Diagram (Mermaid)** for **TwinSec**.

## EDR & Telemetry Ingestion Pipeline (Mermaid)

```mermaid
flowchart LR
    subgraph EventGeneration ["1. EVENT GENERATION"]
        TimeRunner["Time Runner (t+N)"]
        EventMap["Scenario Event Array"]
        TimeRunner -->|Tick| EventMap
    end

    subgraph FrameDissection ["2. OT FRAME INSPECTION"]
        PacketInspector["Packet Inspector Component"]
        Modbus["Modbus TCP Dissector (MBAP/PDU)"]
        Siemens["Siemens S7 Comm Dissector"]
        DNP3["DNP3 / BACnet Dissector"]

        EventMap --> PacketInspector
        PacketInspector --> Modbus
        PacketInspector --> Siemens
        PacketInspector --> DNP3
    end

    subgraph PhysicsCalculation ["3. DIFFERENTIAL PHYSICS"]
        PhysicsEngine["Physics Differential Engine"]
        RotorEq["dω/dt = (Tm - Te)/J - Dω"]
        TempEq["dT/dt = k*(P_loss) - h*(T - T_amb)"]

        EventMap --> PhysicsEngine
        PhysicsEngine --> RotorEq
        PhysicsEngine --> TempEq
    end

    subgraph SecurityExports ["4. SIEM & AUDIT EXPORTS"]
        CEF["CEF Event Stream Logger"]
        Sigma["Sigma Detection Rule Compiler (YAML)"]
        AuditLog["SQLite Audit Table Ingestion"]

        EventMap --> CEF
        EventMap --> Sigma
        EventMap --> AuditLog
    end
```

## Protocol Frame Decode Structure

```text
+-------------------------------------------------------------------------------+
| MODBUS TCP FRAME STRUCTURE                                                   |
| +-------------------------+-----------------------+-------------------------+ |
| | Transaction ID (2 bytes) | Protocol ID (2 bytes) | Length Field (2 bytes)  | |
| +-------------------------+-----------------------+-------------------------+ |
| | Unit ID (1 byte)        | Function Code (1 byte)| Data Payload (N bytes)  | |
| +-------------------------+-----------------------+-------------------------+ |
+-------------------------------------------------------------------------------+
```
