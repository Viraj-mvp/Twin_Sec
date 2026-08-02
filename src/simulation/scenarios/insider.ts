/**
 * insider.ts
 *
 * Insider Threat & Unauthorized PLC Logic Tampering Scenario definition (STILL-AIR).
 */

import type { AttackScenario } from "./types";
import { DEFAULT_NODES, EDGES, DEFAULT_DECISIONS } from "@/data/scenarios";

export const INSIDER_SCENARIO: AttackScenario = {
  id: "insider",
  sector: "smart-building",
  name: "STILL-AIR",
  code: "STILL-AIR",
  site: "Tower · Midtown-North",
  byline:
    "BMS holds the doors and the temperature. Server room card readers set to always-unlock at 03:14.",
  adversary: "FLOOR-0",
  protocols: "BACnet · KNX · Modbus",
  description:
    "Disgruntled internal technician using valid administrative engineering tools to bypass physical access controls.",
  duration: 9600,
  severity: "HIGH",
  mitreMapping: ["T0812", "T0855", "T0836"],
  nodes: DEFAULT_NODES.map((n) => ({ ...n })),
  edges: EDGES.map((e) => ({ ...e })),
  decisions: DEFAULT_DECISIONS.map((d) => ({ ...d })),
  events: [
    {
      id: "i-0",
      time: 0,
      type: "network.node",
      tag: "INSIDER ACTIVITY",
      node: "ews-04",
      title: "Legitimate admin session logged",
      desc: "Disgruntled technician logged into EWS-04 using valid smartcard credentials at 03:14.",
      sev: "MEDIUM",
      lifecycleState: "Execution",
      payload: {
        command: "bacnet-util --write 1002,PRESENT_VALUE,1",
        output: "[+] BACnet Object AccessControl:Door_04 set to ALWAYS_UNLOCK.",
        logEntry: {
          level: "WARN",
          source: "EWS-04",
          message: "Valid smartcard logon outside normal shift hours (03:14 AM).",
        },
      },
    },
    {
      id: "i-1",
      time: 1800,
      type: "network.node",
      tag: "BYPASS",
      node: "plc-3",
      title: "Physical card readers disabled",
      desc: "Server room access doors unlocked permanently in BMS controller memory.",
      sev: "CRITICAL",
      lifecycleState: "Impact",
      payload: {
        logEntry: {
          level: "CRITICAL",
          source: "PLC-3",
          message: "PHYSICAL SECURITY BYPASS: Server Room card reader set to ALWAYS_UNLOCKED.",
        },
        popupHint: {
          title: "INSIDER THREAT BYPASS",
          text: "Physical access control doors were unlocked via direct BACnet write.",
          nodeId: "plc-3",
        },
      },
    },
  ],
  briefing: {
    overview: {
      title: "EXERCISE STILL AIR · INSIDER ACCESS CONTROL TAMPERING",
      summary:
        "Adversary FLOOR-0 (a disgruntled internal technician) used valid administrative credentials outside shift hours to tamper with Building Management System (BMS) controllers. Card readers guarding data center server rooms were set to always-unlocked. Your task is to audit BACnet writes and restore physical access controls.",
      targetInfrastructure: "Midtown-North Tower Building Management System",
      threatActor: "FLOOR-0 (Malicious Insider Technician)",
      businessImpact: "Physical security compromise of server rooms, compliance violation.",
    },
    learningObjectives: [
      "Audit internal administrative BACnet write requests.",
      "Implement zero-trust session validation for OT engineering stations.",
    ],
    scope: {
      included: ["✔ Malicious BACnet Object Writes", "✔ BMS Door Reader Overrides"],
      excluded: ["✖ Physical security Guard intervention"],
    },
    attackIntent: {
      narrative:
        "FLOOR-0 seeks to disable physical access control barriers to enable unmonitored server room access.",
      attackerGoals: ["Log into EWS-04 with smartcard.", "Write ALWAYS_UNLOCK to door object."],
    },
    infrastructure: [
      { assetName: "EWS-04", role: "Workstation", purdueLevel: "Level 4", nodeId: "ews-04" },
    ],
    mitreOverview: [
      {
        id: "in1",
        name: "Execution",
        techniqueId: "T0855",
        techniqueName: "Unauthorized Command",
        description: "BACnet override write.",
        sequenceOrder: 1,
      },
    ],
    controls: [{ name: "Play / Pause", description: "Manage simulation clock." }],
    guidedHints: [
      {
        triggerEventId: "i-1",
        hintText:
          "Door access reader unlocked. Use 'patch plc-3' in Kali CLI to re-lock controllers.",
      },
    ],
    helpContent: { idleSuggestionText: "Review administrative login audit logs.", commonFAQ: [] },
    commandExplanations: [],
    nodeExplanations: {},
    timelineExplanations: [],
    successCriteria: ["Re-enable card reader security controls within 300 seconds."],
  },
};
