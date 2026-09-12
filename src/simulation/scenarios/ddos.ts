/**
 * ddos.ts
 *
 * Industrial OT Network DDoS & SCADA Flood Scenario definition (GRIDLOCK).
 */

import type { AttackScenario } from "./types";
import { SECTOR_TOPOLOGIES, DEFAULT_DECISIONS } from "@/data/scenarios";

const cityTopo = SECTOR_TOPOLOGIES["smart-city"];

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
  nodes: cityTopo.nodes.map((n) => ({ ...n })),
  edges: cityTopo.edges.map((e) => ({ ...e })),
  decisions: DEFAULT_DECISIONS.map((d) => ({ ...d })),
  events: [
    {
      id: "d-0",
      time: 0,
      type: "network.node",
      tag: "DISRUPTION",
      node: "noc",
      title: "SCADA network flood started",
      desc: "Massive DNP3 and NTCIP frame storm initiated (145,000 pps). NOC-RT router buffers exhausted.",
      sev: "HIGH",
      lifecycleState: "Impact",
      payload: {
        command: "hping3 -S -p 502 --flood 192.168.20.42",
        output: "[!] Packet storm active: 145,000 pps targeting NOC Router NOC-RT.",
        logEntry: {
          level: "CRITICAL",
          source: "NOC-RT",
          message: "ROUTER BUFFER OVERFLOW: Packet loss > 84% on OT-100 VLAN.",
        },
        popupHint: {
          title: "SCADA DENIAL OF SERVICE",
          text: "Packet storm flooding NOC Router NOC-RT! Telemetry feeds are dropping.",
          nodeId: "noc",
        },
      },
    },
    {
      id: "d-1",
      time: 2100,
      type: "network.node",
      tag: "COMM TIMEOUT",
      node: "traffic",
      title: "TSC-CTL controller heartbeat lost",
      desc: "SCADA master lost communication with Traffic Signal Controller TSC-CTL due to channel saturation.",
      sev: "CRITICAL",
      lifecycleState: "Impact",
      payload: {
        logEntry: {
          level: "CRITICAL",
          source: "NOC-RT",
          message: "HEARTBEAT TIMEOUT: TSC-CTL disconnected from SCADA poll group.",
        },
      },
    },
  ],
  briefing: {
    overview: {
      title: "EXERCISE GRIDLOCK · METRO SCADA DENIAL OF SERVICE",
      summary:
        "Adversary HALO-1 initiated a high-volume packet storm flooding NOC routers across Metro Coastline-East. SCADA polling frames are being dropped, causing signal controllers to enter fail-safe freezing states. Your objective is to rate-limit traffic on NOC routers and restore telemetry polling.",
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
      included: ["✔ DNP3 / NTCIP Packet Storms", "✔ NOC Router Buffer Exhaustion"],
      excluded: ["✖ Internet BGP routing hijacking"],
    },
    attackIntent: {
      narrative:
        "HALO-1 seeks to paralyze metro traffic signals by saturating SCADA communications.",
      attackerGoals: ["Saturate NOC router buffers.", "Force TSC-CTL polling timeouts."],
    },
    infrastructure: [
      { assetName: "NOC-RT", role: "NOC Router", purdueLevel: "Level 3", nodeId: "noc" },
      {
        assetName: "TSC-CTL",
        role: "Traffic Signal Ctrl",
        purdueLevel: "Level 1",
        nodeId: "traffic",
      },
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
        hintText: "Packet storm detected on NOC-RT. Open Kali CLI and isolate affected ports.",
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
