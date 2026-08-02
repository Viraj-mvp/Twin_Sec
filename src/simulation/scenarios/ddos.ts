/**
 * ddos.ts
 *
 * Industrial OT Network DDoS & SCADA Flood Scenario definition (GRIDLOCK).
 */

import type { AttackScenario } from "./types";
import { DEFAULT_NODES, EDGES, DEFAULT_DECISIONS } from "@/data/scenarios";

export const DDOS_SCENARIO: AttackScenario = {
  id: "ddos",
  sector: "smart-city",
  name: "GRIDLOCK",
  code: "GRIDLOCK",
  site: "Metro · Coastline-East",
  byline:
    "NOC routing tables poisoned. Signals freeze. EMS goes silent across two boroughs at rush hour.",
  adversary: "HALO-1",
  protocols: "MQTT · NTCIP · DNP3",
  description:
    "Distributed Denial of Service attack flooding SCADA control channels with malformed Modbus and DNP3 frames.",
  duration: 9600,
  severity: "HIGH",
  mitreMapping: ["T0814", "T0886", "T0826"],
  nodes: DEFAULT_NODES.map((n) => ({ ...n })),
  edges: EDGES.map((e) => ({ ...e })),
  decisions: DEFAULT_DECISIONS.map((d) => ({ ...d })),
  events: [
    {
      id: "d-0",
      time: 0,
      type: "network.node",
      tag: "DISRUPTION",
      node: "switch-a",
      title: "SCADA network flood started",
      desc: "Massive DNP3 and Modbus frame storm initiated (145,000 pps). OT switch buffers exhausted.",
      sev: "HIGH",
      lifecycleState: "Impact",
      payload: {
        command: "hping3 -S -p 502 --flood 192.168.20.42",
        output: "[!] Packet storm active: 145,000 pps targeting OT Switch SW-A.",
        logEntry: {
          level: "CRITICAL",
          source: "SW-A",
          message: "SWITCH BUFFER OVERFLOW: Packet loss > 84% on OT-100 VLAN.",
        },
        popupHint: {
          title: "SCADA DENIAL OF SERVICE",
          text: "Packet storm flooding OT Switch SW-A! Telemetry feeds are dropping.",
          nodeId: "switch-a",
        },
      },
    },
    {
      id: "d-1",
      time: 2100,
      type: "network.node",
      tag: "COMM TIMEOUT",
      node: "plc-3",
      title: "PLC controller heartbeat lost",
      desc: "SCADA master lost communication with PLC-3 due to channel saturation.",
      sev: "CRITICAL",
      lifecycleState: "Impact",
      payload: {
        logEntry: {
          level: "CRITICAL",
          source: "HMI-11",
          message: "HEARTBEAT TIMEOUT: PLC-3 disconnected from SCADA poll group.",
        },
      },
    },
  ],
  briefing: {
    overview: {
      title: "EXERCISE GRIDLOCK · METRO SCADA DENIAL OF SERVICE",
      summary:
        "Adversary HALO-1 initiated a high-volume packet storm flooding OT network switches across Metro Coastline-East. SCADA polling frames are being dropped, causing signal controllers to enter fail-safe freezing states. Your objective is to rate-limit traffic on OT switches and restore telemetry polling.",
      targetInfrastructure: "Metro Traffic NOC & Rail Signal Network",
      threatActor: "HALO-1 (City Infrastructure Disruption Group)",
      businessImpact:
        "Gridlock across two metro boroughs during peak rush hour, EMS dispatch delays.",
    },
    learningObjectives: [
      "Identify OT network Denial of Service storms.",
      "Apply rate-limiting and VLAN isolation.",
    ],
    scope: {
      included: ["✔ DNP3 / Modbus Packet Storms", "✔ OT Switch Buffer Exhaustion"],
      excluded: ["✖ Internet BGP routing hijacking"],
    },
    attackIntent: {
      narrative:
        "HALO-1 seeks to paralyze metro traffic signals by saturating SCADA communications.",
      attackerGoals: ["Saturate OT switch buffers.", "Force PLC polling timeouts."],
    },
    infrastructure: [
      { assetName: "SW-A", role: "Industrial Switch", purdueLevel: "Level 2", nodeId: "switch-a" },
    ],
    mitreOverview: [
      {
        id: "dd1",
        name: "Impact",
        techniqueId: "T0814",
        techniqueName: "Denial of Service",
        description: "Packet flood on port 502.",
        sequenceOrder: 1,
      },
    ],
    controls: [{ name: "Play / Pause", description: "Manage simulation clock." }],
    guidedHints: [
      {
        triggerEventId: "d-0",
        hintText: "Packet storm detected on SW-A. Open Kali CLI and isolate affected ports.",
      },
    ],
    helpContent: {
      idleSuggestionText: "Check packets/sec metric gauge on status bar.",
      commonFAQ: [],
    },
    commandExplanations: [],
    nodeExplanations: {},
    timelineExplanations: [],
    successCriteria: ["Restore SCADA heartbeat communications within 180 seconds."],
  },
};
