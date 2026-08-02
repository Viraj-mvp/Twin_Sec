/**
 * power.ts
 *
 * Power Sector (HOLLOW) Attack Scenario definition.
 * Includes complete event timeline and Pre-Simulation Mission Briefing data.
 */

import type { AttackScenario } from "./types";
import { DEFAULT_NODES, EDGES, DEFAULT_DECISIONS } from "@/data/scenarios";

export const POWER_SCENARIO: AttackScenario = {
  id: "power",
  sector: "power",
  name: "HOLLOW",
  code: "HOLLOW",
  site: "Substation-07 · Sector 9",
  byline:
    "A relay misconfiguration cascades. 14 MW dropped. Hospital ring on generators before ops notice.",
  adversary: "UNIT-414",
  protocols: "MODBUS · S7 · DNP3",
  description:
    "Advanced persistent threat executing unauthorized ladder logic rewrites and setpoint drift on Substation-07 controllers.",
  duration: 9600,
  severity: "CRITICAL",
  mitreMapping: ["T0865", "T0886", "T0855", "T0836", "T0831", "T0813"],
  nodes: DEFAULT_NODES.map((n) => ({ ...n })),
  edges: EDGES.map((e) => ({ ...e })),
  decisions: DEFAULT_DECISIONS.map((d) => ({
    ...d,
    options: d.options.map((o) => ({ ...o })),
  })),
  events: [
    {
      id: "evt-0",
      time: 0,
      type: "network.node",
      tag: "INITIAL ACCESS",
      node: "ews-04",
      title: "Spear-phish accepted",
      desc: "Macro payload runs on engineering workstation EWS-04. Beacon established to attacker C2.",
      sev: "MEDIUM",
      lifecycleState: "Initial Access",
      payload: {
        command: "powershell -ExecutionPolicy Bypass -Enc SVBY... (C2 Beacon)",
        output: "[+] C2 Beacon established to 185.220.101.5:443 (Session ID: 0x9A41)",
        logEntry: {
          level: "WARN",
          source: "EWS-04 (Win10)",
          message: "Unrecognized PowerShell process spawned from Excel macro execution.",
        },
        popupHint: {
          title: "INITIAL ACCESS DETECTED",
          text: "Notice how the attacker gains an initial foothold via spear-phishing on EWS-04.",
          nodeId: "ews-04",
        },
        aiExplanation: {
          title: "Initial Foothold via Spear-Phishing",
          text: "The adversary UNIT-414 compromised engineering workstation EWS-04 using a weaponized document. An encrypted C2 beacon communicates over port 443.",
          mitreTactics: ["Initial Access (T0865)", "Execution (T0807)"],
          recommendedAction: "Isolate EWS-04 immediately using Kali CLI: 'isolate ews-04'",
        },
      },
    },
    {
      id: "evt-1",
      time: 862,
      type: "network.node",
      tag: "DISCOVERY",
      node: "hist",
      title: "Historian fingerprinted",
      desc: "OSIsoft PI node enumerated. 14 protocol anomalies on Modbus/TCP.",
      sev: "HIGH",
      lifecycleState: "Discovery",
      payload: {
        command: "nmap -sV -p 502,102,44818 192.168.10.24 --script=modbus-discover",
        output: "PORT 502/TCP OPEN  modbus OSIsoft PI Historian v3.4.420.X (Unit ID 1)",
        logEntry: {
          level: "WARN",
          source: "HIST-PI (DMZ)",
          message: "Modbus/TCP port 502 sweep detected from EWS-04. 14 anomalous function calls.",
        },
        popupHint: {
          title: "RECONNAISSANCE & DISCOVERY",
          text: "Observe the sudden sweep of Modbus ports targeting the OSIsoft PI Historian.",
          nodeId: "hist",
        },
        aiExplanation: {
          title: "SCADA Historian Enumeration",
          text: "The attacker sweeps DMZ segment L3.5 looking for process databases. Identifying the historian allows mapping active SCADA tags and process trends.",
          mitreTactics: ["Discovery (T0846)", "Remote System Discovery (T0886)"],
        },
      },
    },
    {
      id: "evt-2",
      time: 1244,
      type: "network.node",
      tag: "LATERAL",
      node: "hmi-11",
      title: "HMI credential replay",
      desc: "Cached operator credentials reused. Unsegmented OT VLAN crossed in 6 seconds.",
      sev: "HIGH",
      lifecycleState: "Lateral Movement",
      payload: {
        command: 'mimikatz "securlsa::logonpasswords" & psexec \\hmi-11 -u Operator',
        output: "[+] NTLM Hash extracted for user 'Operator'. Remote session spawned on HMI-11.",
        logEntry: {
          level: "CRITICAL",
          source: "HMI-11 (OT/L2)",
          message: "Operator console login from unauthorized workstation IP (192.168.10.8).",
        },
        popupHint: {
          title: "LATERAL MOVEMENT TO HMI",
          text: "Cached credentials were harvested to jump across the unsegmented OT VLAN to HMI-11.",
          nodeId: "hmi-11",
        },
        aiExplanation: {
          title: "Unsegmented OT Boundary Cross",
          text: "Using stolen NTLM hashes, UNIT-414 authenticated to Wonderware InTouch console HMI-11. Lack of internal MFA allows direct lateral movement.",
          mitreTactics: ["Lateral Movement (T0886)", "Default Credentials (T0812)"],
        },
      },
    },
    {
      id: "evt-3",
      time: 3731,
      type: "network.node",
      tag: "STAGING",
      node: "switch-a",
      title: "Project file checked out",
      desc: "Engineering software opened. Project file staged for modification.",
      sev: "MEDIUM",
      lifecycleState: "Execution",
      payload: {
        command: "plcscan --target 192.168.20.42 --download-proj SUB07_SAFETY.ap17",
        output: "[+] Siemens STEP 7 Project downloaded: SUB07_SAFETY.ap17 (14.2 MB)",
        logEntry: {
          level: "INFO",
          source: "SW-A (OT Switch)",
          message: "Large file transfer (14.2 MB) on OT-100 VLAN toward engineering workstation.",
        },
      },
    },
    {
      id: "evt-4",
      time: 6489,
      type: "network.node",
      tag: "IMPACT",
      node: "plc-3",
      title: "Ladder logic overwritten",
      desc: "Rungs 14–16 silently rewritten. Checksum spoofed. Operator does not know.",
      sev: "CRITICAL",
      lifecycleState: "Impact",
      payload: {
        command: "s7-client --ip 192.168.30.60 --write-db DB100,0 --force-rung 14",
        output: "[!] PLC-3 Block DB100 updated. CRC32 spoofed to match 0x98F4A1.",
        logEntry: {
          level: "CRITICAL",
          source: "PLC-3 (Siemens S7-1500)",
          message: "UNAUTHORIZED LADDER LOGIC WRITE: Rungs 14–16 modified during active shift.",
        },
        popupHint: {
          title: "PLC LADDER LOGIC OVERWRITE",
          text: "The PLC controller logic has been overwritten to bypass local alarm thresholds.",
          nodeId: "plc-3",
        },
        aiExplanation: {
          title: "Malicious Ladder Logic Injection",
          text: "UNIT-414 directly rewrote controller logic on PLC-3 controlling Centrifuge CENT-Δ. Checksum manipulation hides the modification from the SCADA console.",
          mitreTactics: ["Modify Control Logic (T0833)", "Unauthorized Command (T0855)"],
        },
      },
    },
    {
      id: "evt-5",
      time: 7820,
      type: "network.node",
      tag: "IMPACT",
      node: "plc-7",
      title: "Setpoint drift initiated",
      desc: "Speed setpoint walked +0.3 Hz/s. Within tolerance band — invisible to alarm system.",
      sev: "CRITICAL",
      lifecycleState: "Impact",
      payload: {
        command: "modscan 192.168.30.62 -r 40001 -v 5250",
        output:
          "[+] Modbus Holding Register 40001 updated: Setpoint = 52.5 Hz (Drift rate +0.3 Hz/s)",
        logEntry: {
          level: "CRITICAL",
          source: "PLC-7 (Siemens S7-1500)",
          message: "Turbine speed setpoint increased incrementally to 52.5 Hz.",
        },
      },
    },
    {
      id: "evt-6",
      time: 9120,
      type: "network.node",
      tag: "BYPASS",
      node: "sis",
      title: "Safety interlock bypassed",
      desc: "Safety logic solver re-tasked. Trip thresholds disarmed.",
      sev: "CRITICAL",
      lifecycleState: "Impact",
      payload: {
        command: "hima-tool --target 192.168.40.78 --disarm-trip-relay TR-04",
        output: "[!] HIMA HIMax Trip Relay TR-04 DISARMED. Emergency mechanical trip disabled.",
        logEntry: {
          level: "CRITICAL",
          source: "SIS-LS (HIMA HIMax)",
          message: "SAFETY LOGIC SOLVER DISARMED: Interlock trip relay set to ALWAYS_PASS.",
        },
        popupHint: {
          title: "SAFETY SYSTEM (SIS) BYPASS",
          text: "The SIS safety logic solver was re-tasked, disarming mechanical trip protection.",
          nodeId: "sis",
        },
      },
    },
    {
      id: "evt-7",
      time: 9520,
      type: "network.node",
      tag: "PHYSICS",
      node: "cent",
      title: "Resonance band entered",
      desc: "Bearing temperature +84°C. Vibration crossed mechanical envelope.",
      sev: "CRITICAL",
      lifecycleState: "Impact",
      payload: {
        logEntry: {
          level: "CRITICAL",
          source: "CENT-Δ (GE-OEM 14MW)",
          message:
            "PHYSICAL ANOMALY: Vibration 14.2 mm/s (Envelope 8.0 mm/s). Bearing Temp 96.4°C.",
        },
      },
    },
    {
      id: "evt-8",
      time: 9541,
      type: "network.node",
      tag: "CONSEQUENCE",
      node: "brk",
      title: "Breaker 33-B latched",
      desc: "Cascading isolation. 14 MW load shed. Downstream pressure loss in feeder loop.",
      sev: "CRITICAL",
      lifecycleState: "Recovery",
      payload: {
        logEntry: {
          level: "CRITICAL",
          source: "BRK-33B (ABB SACE E2.2)",
          message: "MAIN BREAKER LATCHED OPEN: 14 MW Load Shed on Substation-07 Sector 9.",
        },
      },
    },
  ],
  briefing: {
    overview: {
      title: "EXERCISE HOLLOW · SUBSTATION-07 SUBSTATION CASCADE",
      summary:
        "An advanced adversary (UNIT-414) has breached the IT/OT DMZ boundary at Substation-07. The attacker is actively attempting to overwrite Siemens S7-1500 PLC ladder logic, walk turbine setpoints into destructive mechanical resonance bands, and disarm the HIMA HIMax Safety Instrumented System (SIS). Your mission is to observe the attack lifecycle, maintain process physics visibility, and execute air-gap containment or firmware patches before catastrophic breaker trip occurs.",
      targetInfrastructure: "Electrical Substation-07 (Sector 9 Grid, 14 MW Load Center)",
      threatActor: "UNIT-414 (State-Sponsored ICS Sabotage Group)",
      businessImpact:
        "14 MW power blackout across Sector 9, emergency generator failovers at regional hospital, potential permanent rotor damage costing $4.1M.",
    },
    learningObjectives: [
      "Understand the multi-stage OT attack lifecycle from initial access to physical degradation.",
      "Identify protocol anomalies on Modbus/TCP and Siemens S7-comm protocols.",
      "Observe lateral movement across unsegmented Purdue Level 2 and Level 3 networks.",
      "Recognize the critical difference between HMI SCADA telemetry and true Digital Twin physics.",
      "Execute timely air-gap isolation (`isolate <node>`) and firmware patching (`patch <node>`).",
    ],
    scope: {
      included: [
        "✔ Network Reconnaissance & Port Sweeps (Modbus/S7/DNP3)",
        "✔ Credential Harvesting & Lateral Movement",
        "✔ Engineering Workstation (EWS) Staging",
        "✔ PLC Ladder Logic Overwrite & Setpoint Manipulation",
        "✔ Safety Instrumented System (SIS) Interlock Bypass",
        "✔ Incident Response (Air-gap containment & setpoint overrides)",
      ],
      excluded: [
        "✖ Malware binary reverse engineering",
        "✖ Cryptographic key cracking",
        "✖ Substation physical perimeter security breach",
      ],
    },
    attackIntent: {
      narrative:
        "UNIT-414 aims to induce rotor structural failure in the 14 MW centrifuge while concealing setpoint drift from operator SCADA screens.",
      attackerGoals: [
        "Harvest operator credentials from EWS-04.",
        "Traverse unsegmented OT switches to reach Level 1 PLCs.",
        "Overwrite PLC-3 logic to disable local alarms.",
        "Walk PLC-7 speed setpoints into resonance (+0.3 Hz/s).",
        "Disarm SIS-LS trip interlocks to prevent automated safety shutdown.",
      ],
    },
    infrastructure: [
      {
        assetName: "EWS-04",
        role: "Engineering Workstation",
        purdueLevel: "Level 4 (IT)",
        nodeId: "ews-04",
      },
      {
        assetName: "HIST-PI",
        role: "Process Historian",
        purdueLevel: "Level 3.5 (DMZ)",
        nodeId: "hist",
      },
      {
        assetName: "HMI-11",
        role: "Operator Console",
        purdueLevel: "Level 2 (OT)",
        nodeId: "hmi-11",
      },
      {
        assetName: "SW-A",
        role: "Industrial Switch",
        purdueLevel: "Level 2 (OT)",
        nodeId: "switch-a",
      },
      {
        assetName: "PLC-3",
        role: "Centrifuge Controller",
        purdueLevel: "Level 1 (OT)",
        nodeId: "plc-3",
      },
      {
        assetName: "PLC-7",
        role: "Feeder Controller",
        purdueLevel: "Level 1 (OT)",
        nodeId: "plc-7",
      },
      {
        assetName: "SIS-LS",
        role: "Safety Logic Solver",
        purdueLevel: "Level 1 (SIS)",
        nodeId: "sis",
      },
      {
        assetName: "CENT-Δ",
        role: "14MW Centrifuge",
        purdueLevel: "Level 0 (Physical)",
        nodeId: "cent",
      },
      {
        assetName: "BRK-33B",
        role: "Feeder Breaker",
        purdueLevel: "Level 0 (Physical)",
        nodeId: "brk",
      },
    ],
    mitreOverview: [
      {
        id: "m1",
        name: "Initial Access",
        techniqueId: "T0865",
        techniqueName: "Spearphishing Attachment",
        description: "Attacker delivers macro payload via email attachment to EWS-04.",
        sequenceOrder: 1,
      },
      {
        id: "m2",
        name: "Discovery",
        techniqueId: "T0886",
        techniqueName: "Remote System Discovery",
        description: "Modbus/TCP sweep maps OSIsoft PI historian and S7 PLCs.",
        sequenceOrder: 2,
      },
      {
        id: "m3",
        name: "Lateral Movement",
        techniqueId: "T0812",
        techniqueName: "Default Credentials / Replay",
        description: "Replay operator NTLM hashes to access HMI-11 console.",
        sequenceOrder: 3,
      },
      {
        id: "m4",
        name: "Execution",
        techniqueId: "T0855",
        techniqueName: "Unauthorized Command Execution",
        description: "Deploy unauthorized commands to overwrite S7 ladder logic.",
        sequenceOrder: 4,
      },
      {
        id: "m5",
        name: "Impact",
        techniqueId: "T0831",
        techniqueName: "Manipulation of Control",
        description: "Walk rotor setpoint +0.3 Hz/s into mechanical resonance band.",
        sequenceOrder: 5,
      },
      {
        id: "m6",
        name: "Inhibit Response",
        techniqueId: "T0836",
        techniqueName: "Modify Parameter / Disarm SIS",
        description: "Re-task HIMA HIMax logic solver to bypass automated trip.",
        sequenceOrder: 6,
      },
    ],
    controls: [
      {
        name: "Play / Pause",
        description: "Start or suspend attack timeline clock.",
        hotkey: "Space",
      },
      {
        name: "Speed Toggle (1x–300x)",
        description: "Adjust simulation speed for rapid rehearsal.",
        hotkey: "1 / 2 / 3",
      },
      {
        name: "Kali CLI Terminal",
        description: "Open interactive cyber range shell for scanning and air-gapping.",
        hotkey: "` (Backtick)",
      },
      {
        name: "Asset Dossier",
        description:
          "Click any node on topology graph to inspect vulnerabilities and issue patches.",
        hotkey: "Click Node",
      },
    ],
    guidedHints: [
      {
        triggerEventId: "evt-0",
        hintText:
          "Initial compromise registered on EWS-04. Open Kali terminal and run 'scan' to inspect node air-gap statuses.",
      },
      {
        triggerEventId: "evt-2",
        hintText:
          "Adversary crossed OT VLAN to HMI-11. Consider air-gaps on 'switch-a' or 'plc-3' to stop propagation.",
      },
      {
        triggerEventId: "evt-4",
        hintText:
          "PLC-3 logic has been overwritten. Use 'patch plc-3' in Kali CLI or open asset dossier to apply cryptographic attestation.",
      },
    ],
    helpContent: {
      idleSuggestionText:
        "Simulation is currently paused. Review the timeline markers below or press Play to resume attack propagation.",
      commonFAQ: [
        {
          question: "How do I isolate a compromised PLC?",
          answer:
            "Open the Kali CLI terminal and type 'isolate plc-3', or click node PLC-3 on the topology map and click ISOLATE (AIR-GAP).",
        },
        {
          question: "What happens if I patch a node?",
          answer:
            "Patching deploys signed firmware attestation, reverting malicious ladder rungs and blocking further command execution.",
        },
        {
          question: "How is the outcome calculated?",
          answer:
            "Outcome branches (A through D) depend on your MTTD (detection time), MTTR (containment time), and load shed (MW).",
        },
      ],
    },
    commandExplanations: [
      {
        command: "nmap -sV -p 502,102 192.168.10.24",
        purpose:
          "Enumerates open Modbus/TCP (port 502) and Siemens ISO-TSAP (port 102) industrial ports.",
        syntax: "nmap [flags] <target_ip>",
        expectedOutput: "PORT 502/TCP OPEN modbus, PORT 102/TCP OPEN iso-tsap",
        attackerIntent: "Map active SCADA controllers and identify vendor implementations.",
        riskLevel: "MEDIUM",
        detectionOpportunities: "SIEM rule: >10 Modbus SYN packets from non-engineering IP in 5s.",
        mitreTechnique: "T0886 - Remote System Discovery",
      },
      {
        command: "plcscan --target 192.168.20.42 --download-proj",
        purpose: "Extracts active PLC project file from OT switch or controller.",
        syntax: "plcscan --target <ip> --download-proj <file>",
        expectedOutput: "STEP 7 Project downloaded: SUB07_SAFETY.ap17",
        attackerIntent: "Obtain ladder logic rungs to craft undetected modifications.",
        riskLevel: "HIGH",
        detectionOpportunities: "Monitor high-volume outbound TCP transfers on port 102.",
        mitreTechnique: "T0843 - Program Download",
      },
      {
        command: "s7-client --ip 192.168.30.60 --write-db DB100",
        purpose: "Sends raw S7-comm write request to overwrite PLC DB block memory.",
        syntax: "s7-client --ip <ip> --write-db <db>,<offset>",
        expectedOutput: "Block DB100 updated successfully.",
        attackerIntent: "Modify control logic to walk setpoints or disable local trip alarms.",
        riskLevel: "CRITICAL",
        detectionOpportunities: "Deep Packet Inspection (DPI) alert on S7 Job Write commands.",
        mitreTechnique: "T0855 - Unauthorized Command Execution",
      },
    ],
    nodeExplanations: {
      "ews-04": {
        nodeId: "ews-04",
        label: "EWS-04",
        role: "Engineering Workstation",
        purdueLevel: "Level 4 (Enterprise)",
        securityImpact:
          "Primary entry point. Holds project files, S7 engineering software, and cached domain credentials.",
        defensiveRecommendations: [
          "Enforce application whitelisting",
          "Restrict PowerShell execution policy",
          "Isolate IT/OT jump host",
        ],
        mitreMapping: ["T0865", "T0807"],
      },
      "plc-3": {
        nodeId: "plc-3",
        label: "PLC-3",
        role: "Centrifuge Controller",
        purdueLevel: "Level 1 (Direct Control)",
        securityImpact:
          "Controls speed and bearing temperature loops for Centrifuge CENT-Δ. Logic overwrite leads to rotor failure.",
        defensiveRecommendations: [
          "Enable physical key-switch lock on PLC",
          "Enforce firmware cryptographic attestation",
          "Air-gap OT switch port",
        ],
        mitreMapping: ["T0833", "T0855"],
      },
    },
    timelineExplanations: [
      {
        time: 0,
        title: "Initial Access via Spear-Phishing",
        whatHappened:
          "EWS-04 opened a malicious macro attachment, spawning an encrypted C2 beacon to attacker infrastructure.",
        whyItHappened:
          "Phishing email bypassed gateway filters; local user had local administrator rights.",
        impact: "Attacker gained unmonitored command shell inside Enterprise network.",
        detectionOpportunities: [
          "EDR parent-child process anomaly alert",
          "DNS query to newly registered C2 domain",
        ],
        possibleMitigations: ["Email attachment sandboxing", "Endpoint Privilege Management"],
        aiSummary: "Initial foothold established. Network perimeter breached.",
      },
      {
        time: 6489,
        title: "Siemens S7 Ladder Logic Overwritten",
        whatHappened:
          "Attacker injected modified rungs into DB100 on PLC-3, bypassing speed threshold checks.",
        whyItHappened: "S7-comm protocol lacks native mutual authentication or packet signing.",
        impact: "Rotor speed setpoint can now be increased without triggering local SCADA alarm.",
        detectionOpportunities: [
          "Suricata / Snort S7-comm DPI write alerts",
          "Digital Twin telemetry comparison",
        ],
        possibleMitigations: ["Hardware key-switch lock", "Network segmentation via OT firewall"],
        aiSummary: "Controller compromised. Physical impact imminent.",
      },
    ],
    successCriteria: [
      "Observe the full 9600s attack timeline or scrub to key milestones.",
      "Understand how adversary UNIT-414 moves laterally across Purdue levels.",
      "Test air-gap containment using Kali CLI 'isolate plc-3' or node dossier.",
      "Apply signed firmware patch using Kali CLI 'patch plc-3'.",
      "Achieve zero load shed (Branch D — CONTAINED).",
    ],
  },
};
