/**
 * water.ts
 *
 * Water Sector (BASIN) Attack Scenario definition.
 * Complete event timeline and Pre-Simulation Mission Briefing data.
 */

import type { AttackScenario } from "./types";
import { DEFAULT_NODES, EDGES, DEFAULT_DECISIONS } from "@/data/scenarios";

export const WATER_SCENARIO: AttackScenario = {
  id: "water",
  sector: "water",
  name: "BASIN",
  code: "BASIN",
  site: "Municipal Works · Basin-3",
  byline:
    "Dosing setpoint walked +6×. Turbidity sensors report nominal. Two districts drink the drift.",
  adversary: "AURA-9",
  protocols: "MODBUS · OPC-UA · SCADA",
  description:
    "Replay attack on water treatment SCADA trend buffer combined with chlorine overdose setpoint manipulation.",
  duration: 9600,
  severity: "CRITICAL",
  mitreMapping: ["T0886", "T0855", "T0831", "T0836"],
  nodes: DEFAULT_NODES.map((n) => {
    if (n.id === "plc-3")
      return {
        ...n,
        label: "PLC-DOSE",
        kind: "Dosing Controller",
        vendor: "ALLEN-BRADLEY CompactLogix",
        affects: ["Chlorine dose pump", "pH loop"],
      };
    if (n.id === "plc-7")
      return {
        ...n,
        label: "PLC-PUMP",
        kind: "Pump Controller",
        vendor: "SCHNEIDER M580",
        affects: ["Distribution pump", "Reservoir level"],
      };
    if (n.id === "sis")
      return {
        ...n,
        label: "SIS-CL2",
        kind: "Chem Safety Logic",
        vendor: "TRICONEX Tricon v11",
        affects: ["Overdose interlock", "Tank isolation"],
      };
    if (n.id === "cent")
      return {
        ...n,
        label: "DOSE-A",
        kind: "Chlorine Injector",
        vendor: "GRUNDFOS DDA",
        affects: ["Basin-3 chlorine ppm", "Downstream mains"],
      };
    if (n.id === "brk")
      return {
        ...n,
        label: "PUMP-2B",
        kind: "Distribution Pump",
        vendor: "KSB Etanorm",
        affects: ["District pressure", "Reservoir draw"],
      };
    return { ...n };
  }),
  edges: EDGES.map((e) => ({ ...e })),
  decisions: DEFAULT_DECISIONS.map((d) => ({ ...d })),
  events: [
    {
      id: "w-0",
      time: 0,
      type: "network.node",
      tag: "INITIAL ACCESS",
      node: "ews-04",
      title: "Vendor VPN token replayed",
      desc: "Stale contractor VPN session reused. Engineering laptop reached over site-to-site tunnel.",
      sev: "MEDIUM",
      lifecycleState: "Initial Access",
      payload: {
        command: "openvpn --config contractor_stale.ovpn & ssh engineering@192.168.10.8",
        output: "[+] VPN Tunnel established. Shell obtained on EWS-04 (192.168.10.8).",
        logEntry: {
          level: "WARN",
          source: "VPN Gateway",
          message: "Stale contractor token authenticated from unusual geo-IP (103.22.14.9).",
        },
        popupHint: {
          title: "VENDOR VPN REPLAY",
          text: "Stale contractor credentials were used to bypass perimeter auth.",
          nodeId: "ews-04",
        },
      },
    },
    {
      id: "w-1",
      time: 780,
      type: "network.node",
      tag: "DISCOVERY",
      node: "hist",
      title: "SCADA historian mapped",
      desc: "OPC-UA browse enumerates dosing setpoints, basin turbidity tags, chlorine residuals.",
      sev: "HIGH",
      lifecycleState: "Discovery",
      payload: {
        command: "opc-browse --endpoint opc.tcp://192.168.10.24:4840",
        output: "[+] Enumerated 412 SCADA tags. Found: Basin3.Chlorine.PPM, Basin3.Turbidity.NTU",
        logEntry: {
          level: "WARN",
          source: "HIST-PI",
          message: "OPC-UA node tree browsed completely by remote client.",
        },
      },
    },
    {
      id: "w-2",
      time: 1420,
      type: "network.node",
      tag: "LATERAL",
      node: "hmi-11",
      title: "Operator console hijacked",
      desc: "RDP session opened during shift change. Alarms suppressed at the console.",
      sev: "HIGH",
      lifecycleState: "Lateral Movement",
      payload: {
        command: "xfreerdp /v:192.168.20.22 /u:Operator /p:P@ssword123",
        output: "[+] RDP connection established to HMI-11 console. Console locked for local user.",
        logEntry: {
          level: "CRITICAL",
          source: "HMI-11",
          message: "Interactive console session taken over via RDP from EWS-04.",
        },
      },
    },
    {
      id: "w-4",
      time: 6200,
      type: "network.node",
      tag: "IMPACT",
      node: "plc-3",
      title: "Chlorine dose walked +6×",
      desc: "Setpoint driven from 1.2 ppm to 7.1 ppm in small deltas. Trend UI shows nominal — replayed.",
      sev: "CRITICAL",
      lifecycleState: "Impact",
      payload: {
        command: "modscan 192.168.30.60 -r 40102 -v 710",
        output: "[!] Holding Register 40102 updated: Chlorine setpoint set to 7.10 mg/L.",
        logEntry: {
          level: "CRITICAL",
          source: "PLC-DOSE",
          message: "CHLORINE OVERDOSE: Chemical injection rate increased by +591%.",
        },
        popupHint: {
          title: "CHLORINE OVERDOSE SETPOINT",
          text: "Chemical dosing walked +6x while trend display is replayed.",
          nodeId: "plc-3",
        },
      },
    },
    {
      id: "w-5",
      time: 7900,
      type: "network.node",
      tag: "IMPACT",
      node: "plc-7",
      title: "Distribution pump forced ON",
      desc: "PUMP-2B held at 100% duty. Contaminated water pushed toward two districts.",
      sev: "CRITICAL",
      lifecycleState: "Impact",
      payload: {
        logEntry: {
          level: "CRITICAL",
          source: "PLC-PUMP",
          message: "Distribution Pump PUMP-2B forced 100% duty cycle override.",
        },
      },
    },
    {
      id: "w-6",
      time: 9020,
      type: "network.node",
      tag: "BYPASS",
      node: "sis",
      title: "Overdose interlock disarmed",
      desc: "TRICONEX safety trip re-tasked. Cl₂ high-high threshold suppressed.",
      sev: "CRITICAL",
      lifecycleState: "Impact",
      payload: {
        logEntry: {
          level: "CRITICAL",
          source: "SIS-CL2",
          message: "TRICONEX SAFETY TRIP DISARMED: Cl₂ High-High interlock overridden.",
        },
      },
    },
  ],
  briefing: {
    overview: {
      title: "EXERCISES BASIN · MUNICIPAL WATER WORKS OVERDOSE",
      summary:
        "Adversary AURA-9 compromised vendor VPN access to manipulate chlorine dosing setpoints at Municipal Works Basin-3. The attacker is walking chlorine concentration +6x above WHO safety limits while injecting a rolling buffer of nominal telemetry to trick SCADA trends. Your task is to detect the trend replay attack, verify true water physics, and isolate dosing controllers before contaminated water reaches distribution mains.",
      targetInfrastructure: "Municipal Water Treatment Plant Basin-3 (17,000 Service Connections)",
      threatActor: "AURA-9 (Water Infrastructure Sabotage Group)",
      businessImpact:
        "Potable water contamination affecting 17,000 connections across two districts, emergency boil-water advisory, chemical flushing costs exceeding $1.8M.",
    },
    learningObjectives: [
      "Detect telemetry trend replay attacks on process historians.",
      "Understand chemical dosing control loops and safety interlocks.",
      "Execute emergency air-gap containment on chemical controllers.",
    ],
    scope: {
      included: [
        "✔ VPN Token Replay",
        "✔ OPC-UA Tag Browsing",
        "✔ SCADA Trend Buffer Manipulation",
        "✔ Chlorine Overdose Setpoint Walks",
      ],
      excluded: ["✖ Physical water sampling", "✖ Water distribution pipe repair"],
    },
    attackIntent: {
      narrative:
        "AURA-9 seeks to deliver off-spec chemical water into public distribution mains while hiding telemetry drift.",
      attackerGoals: [
        "Replay contractor VPN token.",
        "Map OPC-UA dosing tags.",
        "Walk chlorine setpoint to 7.1 ppm.",
        "Disarm TRICONEX safety interlocks.",
      ],
    },
    infrastructure: [
      { assetName: "EWS-04", role: "Engineering Laptop", purdueLevel: "Level 4", nodeId: "ews-04" },
      { assetName: "HIST-PI", role: "Process Historian", purdueLevel: "Level 3.5", nodeId: "hist" },
      { assetName: "PLC-DOSE", role: "Dosing Controller", purdueLevel: "Level 1", nodeId: "plc-3" },
      { assetName: "SIS-CL2", role: "Safety Logic", purdueLevel: "Level 1", nodeId: "sis" },
    ],
    mitreOverview: [
      {
        id: "mw1",
        name: "Initial Access",
        techniqueId: "T0865",
        techniqueName: "External Remote Services",
        description: "Contractor VPN replay.",
        sequenceOrder: 1,
      },
      {
        id: "mw2",
        name: "Impact",
        techniqueId: "T0831",
        techniqueName: "Manipulation of Control",
        description: "Walk chlorine dosing setpoint +6x.",
        sequenceOrder: 2,
      },
    ],
    controls: [
      { name: "Play / Pause", description: "Control timeline execution." },
      { name: "Kali CLI", description: "Air-gap nodes with 'isolate plc-3'." },
    ],
    guidedHints: [
      {
        triggerEventId: "w-4",
        hintText:
          "Chlorine setpoint walked +6x. Run 'isolate plc-3' in Kali CLI to cut dosing communication.",
      },
    ],
    helpContent: {
      idleSuggestionText:
        "Observe water physics in the telemetry panel. Compare chlorine ppm against WHO limits.",
      commonFAQ: [
        {
          question: "How do I stop the overdose?",
          answer: "Isolate PLC-DOSE using Kali terminal ('isolate plc-3') or node dossier.",
        },
      ],
    },
    commandExplanations: [
      {
        command: "opc-browse --endpoint opc.tcp://192.168.10.24",
        purpose: "Enumerates water treatment tags over OPC-UA protocol.",
        syntax: "opc-browse --endpoint <url>",
        expectedOutput: "Enumerated 412 SCADA tags.",
        attackerIntent: "Identify chlorine injection setpoint registers.",
        riskLevel: "HIGH",
        detectionOpportunities: "Audit OPC-UA session logs.",
        mitreTechnique: "T0886 - Discovery",
      },
    ],
    nodeExplanations: {},
    timelineExplanations: [],
    successCriteria: [
      "Prevent chlorine ppm from exceeding 4.0 mg/L limit.",
      "Maintain distribution water quality.",
    ],
  },
};
