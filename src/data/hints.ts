import { SectorId } from "./scenarios";
import { SimPhase } from "./terminal-templates";

export type HintItem = {
  level: 1 | 2 | 3;
  text: string;
  solution?: string;
};

export const HINT_LIBRARY: Record<SectorId, Record<SimPhase, Record<number, HintItem>>> = {
  power: {
    RECON: {
      1: {
        level: 1,
        text: "Inspect SIEM logs for anomalous Modbus TCP / DNP3 polling from non-engineering hosts.",
      },
      2: {
        level: 2,
        text: "Target node EWS-04 shows active enumeration. Isolate engineering workstation EWS-04.",
      },
      3: {
        level: 3,
        text: "Full Solution: Deploy industrial IDS filter on DNP3 port 20000 and force MFA re-authentication on workstation EWS-04.",
        solution:
          "1. Sever RDP/VNC sessions on EWS-04\n2. Isolate Switch port SW-A\n3. Re-verify PLC-3 ladder logic checksum",
      },
    },
    EXPLOIT: {
      1: {
        level: 1,
        text: "Watch for setpoint drift on PLC-3 rotor speed loops.",
      },
      2: {
        level: 2,
        text: "Adversary is overriding rung 14-16 checksums. Initiate manual fail-safe on PLC-3.",
      },
      3: {
        level: 3,
        text: "Full Solution: Force PLC-3 into keylock RUN mode and trigger controlled decel before resonance.",
        solution: "1. Execute fail-safe stop on PLC-3\n2. Isolate SIS interlock bus",
      },
    },
    DEFEND: {
      1: {
        level: 1,
        text: "Adversary has reached safety logic solver (SIS). Physical trip imminent.",
      },
      2: {
        level: 2,
        text: "Execute manual breaker trip on BRK-33B to prevent centrifuge rotor damage.",
      },
      3: {
        level: 3,
        text: "Full Solution: Pull manual ESD hardwire immediately to shed 14MW controlled load rather than experiencing catastrophic rotor resonance.",
        solution: "1. Pull manual trip on BRK-33B\n2. Open feeder bypass",
      },
    },
    REVIEW: {
      1: { level: 1, text: "Review event timelines for MTTD/MTTR optimization." },
      2: { level: 2, text: "Cross-reference MITRE ATT&CK for ICS T0846 and T0885." },
      3: {
        level: 3,
        text: "Full Post-Mortem: Validate airgap controls between L3.5 DMZ and L2 OT.",
      },
    },
  },
  water: {
    RECON: {
      1: { level: 1, text: "Check historian OPC-UA browse logs for chlorine dosing tags." },
      2: { level: 2, text: "Vendor VPN token replayed. Sever RDP session on HMI-11 console." },
      3: {
        level: 3,
        text: "Full Solution: Revoke contractor VPN certificate and force MFA on HMI-11.",
      },
    },
    EXPLOIT: {
      1: { level: 1, text: "Chlorine setpoint walking detected. SCADA UI shows replayed trend." },
      2: {
        level: 2,
        text: "Dosing pump PLC-3 walk setpoint to 7.1 ppm. Force dosing pump to manual.",
      },
      3: {
        level: 3,
        text: "Full Solution: Override dosing pump to manual 1.2 ppm and flush basin sample lines.",
      },
    },
    DEFEND: {
      1: { level: 1, text: "Overdose interlock suppressed on TRICONEX safety solver." },
      2: {
        level: 2,
        text: "Isolate Basin-3 output immediately before distribution pump pushes flow.",
      },
      3: {
        level: 3,
        text: "Full Solution: Close Basin-3 isolation valve to contain off-spec water.",
      },
    },
    REVIEW: {
      1: { level: 1, text: "Analyze water quality recovery timeline." },
      2: { level: 2, text: "Verify WHO potable chlorine threshold compliance." },
      3: { level: 3, text: "Full Post-Mortem: Update OPC-UA security policy to SignAndEncrypt." },
    },
  },
  "oil-gas": {
    RECON: {
      1: { level: 1, text: "Monitor DeltaV DCS workstation trust relationships." },
      2: { level: 2, text: "Revoke operator console tokens issued during prior shift." },
      3: { level: 3, text: "Full Solution: Isolate compressor control network from refinery IT." },
    },
    EXPLOIT: {
      1: { level: 1, text: "Compressor discharge pressure creeping +2 psi / 60s." },
      2: { level: 2, text: "Force compressor recycle valve open to drop backpressure." },
      3: {
        level: 3,
        text: "Full Solution: Initiate recycle mode to hold discharge below 980 psi.",
      },
    },
    DEFEND: {
      1: { level: 1, text: "SIL-3 trip suppressed in safety solver." },
      2: { level: 2, text: "Pull hardwired ESD-1 to depressurize tower T-A." },
      3: { level: 3, text: "Full Solution: Execute manual ESD-1 flare trip." },
    },
    REVIEW: {
      1: { level: 1, text: "Evaluate flare volume and regulatory notifications." },
      2: { level: 2, text: "Review pressure relief curves." },
      3: { level: 3, text: "Full Post-Mortem: Harden OPC-UA and DCS firewall boundaries." },
    },
  },
  manufacturing: {
    RECON: {
      1: { level: 1, text: "Audit MES quality database queries for vision model tags." },
      2: { level: 2, text: "Detect rogue ONNX vision model upload to VIS-CTL." },
      3: {
        level: 3,
        text: "Full Solution: Quarantined developer host and restore verified vision weights.",
      },
    },
    EXPLOIT: {
      1: { level: 1, text: "Assembly torque profile drifting −8%." },
      2: { level: 2, text: "Halt line PLC-LINE and verify torque wrench calibration." },
      3: { level: 3, text: "Full Solution: Stop conveyor and execute fastener audit." },
    },
    DEFEND: {
      1: { level: 1, text: "Reject diverter disabled in safety relay." },
      2: { level: 2, text: "Trip safety relay SAFE-L to halt assembly line." },
      3: {
        level: 3,
        text: "Full Solution: Trigger E-stop chain to prevent shipping uninspected units.",
      },
    },
    REVIEW: {
      1: { level: 1, text: "Review defect containment metrics." },
      2: { level: 2, text: "Evaluate scrap rate impact." },
      3: { level: 3, text: "Full Post-Mortem: Sign all ONNX model artifacts cryptographically." },
    },
  },
  port: {
    RECON: {
      1: { level: 1, text: "Monitor TOS API request logs for unauthenticated container queries." },
      2: { level: 2, text: "Isolate compromised vendor account in NAVIS N4." },
      3: {
        level: 3,
        text: "Full Solution: Revoke vendor token and restrict TOS access to internal VLAN.",
      },
    },
    EXPLOIT: {
      1: { level: 1, text: "Ship-to-shore crane dispatch commands altered." },
      2: { level: 2, text: "Switch crane controllers to manual cab operation." },
      3: { level: 3, text: "Full Solution: Take cranes offline from TOS dispatch queue." },
    },
    DEFEND: {
      1: { level: 1, text: "Container tracking database corrupted." },
      2: { level: 2, text: "Halt automated gate entry and switch to manual manifest check." },
      3: { level: 3, text: "Full Solution: Lock TOS database and fail over to local backup." },
    },
    REVIEW: {
      1: { level: 1, text: "Evaluate TEU throughput delay." },
      2: { level: 2, text: "Review supply chain impact." },
      3: { level: 3, text: "Full Post-Mortem: Enforce mTLS on all TOS crane endpoints." },
    },
  },
  "smart-building": {
    RECON: {
      1: { level: 1, text: "Detect BACnet Who-Is sweeps across building automation network." },
      2: { level: 2, text: "Disable default BACnet MSTP router credentials." },
      3: { level: 3, text: "Full Solution: Segment BMS network from public Wi-Fi." },
    },
    EXPLOIT: {
      1: { level: 1, text: "Chiller plant temperature setpoint driven to maximum." },
      2: { level: 2, text: "Override HVAC BMS controller to local manual setpoints." },
      3: {
        level: 3,
        text: "Full Solution: Isolate BMS controller and enforce manual cooling mode.",
      },
    },
    DEFEND: {
      1: { level: 1, text: "Access control doors locked in fail-close state." },
      2: { level: 2, text: "Trigger emergency fire alarm override to unlock all egress paths." },
      3: { level: 3, text: "Full Solution: Engage mechanical key override on life-safety doors." },
    },
    REVIEW: {
      1: { level: 1, text: "Review occupant safety metrics." },
      2: { level: 2, text: "Audit HVAC equipment thermal stress." },
      3: { level: 3, text: "Full Post-Mortem: Deploy BACnet/SC (Secure Connect) across facility." },
    },
  },
  "smart-city": {
    RECON: {
      1: { level: 1, text: "Identify unauthenticated MQTT subscriptions on traffic subnets." },
      2: { level: 2, text: "Block external IP access to port 1883 on traffic signal broker." },
      3: { level: 3, text: "Full Solution: Enable TLS and JWT auth on municipal MQTT broker." },
    },
    EXPLOIT: {
      1: { level: 1, text: "Traffic signals forced to green on intersecting corridors." },
      2: { level: 2, text: "Switch signal controllers to amber flash emergency mode." },
      3: {
        level: 3,
        text: "Full Solution: Force local conflict monitor relays into mechanical flash.",
      },
    },
    DEFEND: {
      1: { level: 1, text: "Gridlock spreading across 14 intersections." },
      2: { level: 2, text: "Isolate central traffic management server from field network." },
      3: {
        level: 3,
        text: "Full Solution: Cut OT gateway connection to restore local intersection control.",
      },
    },
    REVIEW: {
      1: { level: 1, text: "Evaluate transit delay and emergency response metrics." },
      2: { level: 2, text: "Audit signal controller event logs." },
      3: {
        level: 3,
        text: "Full Post-Mortem: Mandate hardware conflict monitors on all signal cabinets.",
      },
    },
  },
};
