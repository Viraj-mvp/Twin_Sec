# 11. Purdue Model Industrial OT Network Topology Diagram

This document illustrates the 5-layer **Purdue Model Architecture** mapped across the 7 critical infrastructure sectors supported by TwinSec (`src/data/scenarios.ts`).

## Purdue Model Layer Mapping (Mermaid)

```mermaid
graph TD
    subgraph EnterpriseIT ["Level 4/5 · Enterprise IT & Cloud"]
        ERP["ERP System / Corporate AD"]
        Cloud["TwinSec Range Gateway"]
    end

    subgraph DemilitarizedZone ["Level 3.5 · Industrial DMZ (IDMZ)"]
        FW_DMZ["IDMZ Firewall & Jump Host (fw)"]
        HistorianMirror["Replicated Historian (hist-rep)"]
    end

    subgraph OperationsControl ["Level 3 · Site Operations & Supervisory"]
        EWS["Engineering Workstation (ews-04)"]
        PlantHistorian["Plant Historian (hist-01)"]
        OT_Switch["OT Core Managed Switch (sw-core)"]
    end

    subgraph ControlLevel ["Level 2 · Control & Supervisory HMI"]
        HMI1["Primary SCADA Console HMI (hmi-01)"]
        HMI2["Backup Alarm Display (hmi-02)"]
    end

    subgraph ControllerLevel ["Level 1 · Field Logic Controllers & Safety"]
        PLC1["Turbine / Pump Controller (plc-1)"]
        PLC2["Substation / Feed Controller (plc-2)"]
        PLC3["Distribution / Valve PLC (plc-3)"]
        SIS["Safety Logic Solver / ESD (sis-01)"]
    end

    subgraph ProcessLevel ["Level 0 · Physical Process & Actuators"]
        Gen["Generators / Intake Pumps"]
        Breaker["230kV Circuit Breakers (brk-01)"]
        Valves["Emergency Cutoff Valves (v-44)"]
        Sensors["Temperature / Flow / Pressure Sensors"]
    end

    %% Network Connections
    Cloud <--> FW_DMZ
    ERP <--> FW_DMZ
    FW_DMZ <--> OT_Switch
    HistorianMirror <--> OT_Switch

    OT_Switch <--> EWS
    OT_Switch <--> PlantHistorian
    OT_Switch <--> HMI1
    OT_Switch <--> HMI2

    HMI1 <--> PLC1
    HMI1 <--> PLC2
    HMI2 <--> PLC3

    PLC1 <--> SIS
    PLC2 <--> SIS
    PLC3 <--> SIS

    PLC1 <--> Gen
    PLC2 <--> Breaker
    PLC3 <--> Valves
    SIS <--> Breaker
    SIS <--> Valves
    Sensors <--> PLC1
    Sensors <--> PLC2
    Sensors <--> PLC3
```
