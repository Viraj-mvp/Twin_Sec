/**
 * causal-engine.ts
 *
 * Causal Propagation Engine for TwinSec Industrial Cyber Range.
 * Maintains a directed dependency graph of SCADA/ICS assets across Purdue Model layers
 * (Ring 0 Perimeter to Ring 5 Physical Process). When an event occurs on a parent asset,
 * the causal engine calculates impact deltas and propagates child cascade events.
 */

import { SimEventRecord } from "./event-store";

export interface AssetNode {
  id: string;
  label: string;
  kind: "workstation" | "server" | "hmi" | "plc" | "sis" | "actuator" | "sensor";
  purdueRing: number; // 0 = IT/Perimeter, 1 = DMZ, 2 = Control/HMI, 3 = PLC, 4 = SIS, 5 = Process
  children: string[]; // Downstream dependent asset IDs
  baselineMetric: number;
  criticalThreshold: number;
}

export interface CausalCascadeResult {
  sourceEvent: SimEventRecord;
  propagatedEvents: Omit<SimEventRecord, "eventId">[];
  affectedAssetIds: string[];
}

// 7-Sector Asset Topology Registry
export const ASSET_TOPOLOGY_GRAPH: Record<string, Record<string, AssetNode>> = {
  power: {
    "ews-04": {
      id: "ews-04",
      label: "Engineering Workstation",
      kind: "workstation",
      purdueRing: 0,
      children: ["hist-01", "hmi-01"],
      baselineMetric: 0,
      criticalThreshold: 1,
    },
    "hist-01": {
      id: "hist-01",
      label: "Plant Historian DB",
      kind: "server",
      purdueRing: 1,
      children: ["hmi-01"],
      baselineMetric: 0,
      criticalThreshold: 1,
    },
    "hmi-01": {
      id: "hmi-01",
      label: "Primary SCADA HMI",
      kind: "hmi",
      purdueRing: 2,
      children: ["plc-1", "plc-2", "plc-3"],
      baselineMetric: 60,
      criticalThreshold: 62,
    },
    "plc-1": {
      id: "plc-1",
      label: "Turbine Governor PLC",
      kind: "plc",
      purdueRing: 3,
      children: ["sis-01"],
      baselineMetric: 3000,
      criticalThreshold: 3600,
    },
    "plc-2": {
      id: "plc-2",
      label: "Substation Feeder PLC",
      kind: "plc",
      purdueRing: 3,
      children: ["brk-01"],
      baselineMetric: 230,
      criticalThreshold: 260,
    },
    "plc-3": {
      id: "plc-3",
      label: "Distribution Valve PLC",
      kind: "plc",
      purdueRing: 3,
      children: ["brk-01"],
      baselineMetric: 100,
      criticalThreshold: 140,
    },
    "sis-01": {
      id: "sis-01",
      label: "Safety Logic Solver (ESD)",
      kind: "sis",
      purdueRing: 4,
      children: ["brk-01"],
      baselineMetric: 0,
      criticalThreshold: 1,
    },
    "brk-01": {
      id: "brk-01",
      label: "230kV Main Generator Breaker",
      kind: "actuator",
      purdueRing: 5,
      children: [],
      baselineMetric: 1,
      criticalThreshold: 0,
    },
  },
  water: {
    "ews-04": {
      id: "ews-04",
      label: "Water Admin Workstation",
      kind: "workstation",
      purdueRing: 0,
      children: ["hist-01", "hmi-01"],
      baselineMetric: 0,
      criticalThreshold: 1,
    },
    "hist-01": {
      id: "hist-01",
      label: "Water Data Historian",
      kind: "server",
      purdueRing: 1,
      children: ["hmi-01"],
      baselineMetric: 0,
      criticalThreshold: 1,
    },
    "hmi-01": {
      id: "hmi-01",
      label: "Treatment SCADA HMI",
      kind: "hmi",
      purdueRing: 2,
      children: ["plc-1", "plc-2"],
      baselineMetric: 7.2,
      criticalThreshold: 8.5,
    },
    "plc-1": {
      id: "plc-1",
      label: "Chlorine Dosing PLC",
      kind: "plc",
      purdueRing: 3,
      children: ["sis-01"],
      baselineMetric: 2.0,
      criticalThreshold: 5.0,
    },
    "plc-2": {
      id: "plc-2",
      label: "Intake Pump PLC",
      kind: "plc",
      purdueRing: 3,
      children: ["brk-01"],
      baselineMetric: 450,
      criticalThreshold: 600,
    },
    "sis-01": {
      id: "sis-01",
      label: "Chlorine Interlock Cutoff",
      kind: "sis",
      purdueRing: 4,
      children: ["brk-01"],
      baselineMetric: 0,
      criticalThreshold: 1,
    },
    "brk-01": {
      id: "brk-01",
      label: "Main Intake Valve Actuator",
      kind: "actuator",
      purdueRing: 5,
      children: [],
      baselineMetric: 1,
      criticalThreshold: 0,
    },
  },
};

/**
 * Propagate causal impact downstream along the asset graph
 */
export function propagateCausalCascade(
  sector: string,
  triggerEvent: SimEventRecord,
  activeMitigations: Record<string, string> = {},
): CausalCascadeResult {
  const graph = ASSET_TOPOLOGY_GRAPH[sector] ?? ASSET_TOPOLOGY_GRAPH.power;
  const sourceNode = graph[triggerEvent.sourceAssetId];

  const propagatedEvents: Omit<SimEventRecord, "eventId">[] = [];
  const affectedAssetIds: string[] = [triggerEvent.sourceAssetId];

  if (!sourceNode) {
    return { sourceEvent: triggerEvent, propagatedEvents, affectedAssetIds };
  }

  // Iterate over immediate downstream children
  for (const childId of sourceNode.children) {
    const childNode = graph[childId];
    if (!childNode) continue;

    // Check if child node has active mitigation applied (e.g. ISOLATED or PATCHED)
    const mitigation = activeMitigations[childId];
    if (mitigation === "ISOLATE" || mitigation === "PATCH") {
      propagatedEvents.push({
        timestamp: triggerEvent.timestamp + 2,
        type: "DEFENSE_INTERVENTION",
        sourceAssetId: childId,
        parentEventId: triggerEvent.eventId,
        severity: "INFO",
        title: `CASCADE CONTAINED ON ${childNode.label.toUpperCase()}`,
        description: `Defensive mitigation [${mitigation}] blocked lateral propagation from ${sourceNode.label}.`,
        data: { mitigation, blockedSource: sourceNode.id },
      });
      continue;
    }

    affectedAssetIds.push(childId);

    // Create child cascade event
    propagatedEvents.push({
      timestamp: triggerEvent.timestamp + (childNode.purdueRing - sourceNode.purdueRing) * 3,
      type: childNode.purdueRing >= 4 ? "SIS_TRIP" : "PHYSICAL_CASCADE",
      sourceAssetId: childId,
      targetAssetId: childNode.children[0],
      parentEventId: triggerEvent.eventId,
      severity: childNode.purdueRing >= 4 ? "CRITICAL" : "HIGH",
      title: `CASCADE IMPACT: ${childNode.label.toUpperCase()}`,
      description: `Upstream breach on ${sourceNode.label} propagated setpoint anomaly to Ring ${childNode.purdueRing} controller.`,
      data: {
        ring: childNode.purdueRing,
        metricDelta: childNode.criticalThreshold - childNode.baselineMetric,
      },
    });
  }

  return {
    sourceEvent: triggerEvent,
    propagatedEvents,
    affectedAssetIds,
  };
}
