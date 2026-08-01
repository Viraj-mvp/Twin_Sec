# 02. EDR & OT Telemetry Pipeline Diagram

This diagram details how **TwinSec** ingests raw operational network events, parses OT protocol headers, updates differential physics engines, and outputs security telemetry (CEF, Sigma Rules, SIEM Logs).

## Pipeline Flowchart

```mermaid
flowchart TD
    subgraph IncidentSimulation ["1. Incident Timeline & Event Simulation"]
        A[Time Runner t+N] --> B[Scenario Event Trigger]
        B --> C{Purdue Ring Affected?}
        C -->|Ring 0-1| D[Gateway / EWS Compromise]
        C -->|Ring 2-3| E[HMI / Controller Setpoint Walk]
        C -->|Ring 4| F[SIS Interlock Bypass / Breaker Trip]
    end

    subgraph ProtocolInspection ["2. EDR & OT Protocol Frame Inspector"]
        E --> G[Raw Frame Synthesizer]
        G --> H1[Modbus TCP Header MBAP/PDU Decode]
        G --> H2[Siemens S7 Comm Memory Read/Write Decode]
        G --> H3[DNP3 / BACnet Register Inspection]
        H1 --> I[Hex Packet Inspector Display]
        H2 --> I
        H3 --> I
    end

    subgraph DifferentialPhysics ["3. Real-Time Physics Engine"]
        F --> J[Physics Differential Equations]
        J -->|Rotational Inertia| K1["dω/dt = (Tm - Te)/J - Dω"]
        J -->|Thermal Load| K2["dT/dt = k*(P_loss) - h*(T - T_amb)"]
        K1 --> L[Sparkline Telemetry Generator]
        K2 --> L
        L --> M[Live Physics Telemetry Sparklines]
    end

    subgraph DetectionOutputs ["4. Enterprise Security Telemetry Exports"]
        B --> N[SIEM Event Converter]
        N --> O1[Common Event Format - CEF Logger]
        N --> O2[Sigma Detection Rule Compiler - YAML]
        N --> O3[Audit Log Database Ingestion]
    end
```

## Telemetry Export Formats

### 1. CEF Log Structure

```text
CEF:0|TwinSec|CyberRange|1.0|T0858|Program State Change|8|src=10.0.3.4 dst=10.0.3.50 act=WRITE_REGISTER msg="Modbus function 0x06 setpoint modified on PLC-3"
```

### 2. Sigma Rule Output Sample

```yaml
title: Unauthorized OT PLC Rung Logic Modification
id: 9a4f21b8-2940-4e31-8f1d-twinsec001
status: experimental
description: Detects unauthorized Modbus Write Multiple Registers (0x10) to Ring 3 PLCs
logsource:
  category: ot_network
  product: modbus
detection:
  selection:
    FunctionCode: 16
    UnitID: 1
    RegisterAddress: 40001
  condition: selection
falsepositives:
  - Authorized engineering maintenance window
level: critical
```
