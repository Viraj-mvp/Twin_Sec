/**
 * TwinState.ts
 *
 * Authoritative, immutable simulation state representation for TwinSec.
 * Holds complete state snapshot across cyber, physical, network, attack,
 * detection, incident, and metric planes.
 */

import type { PlcSnapshot } from "./devices/PlcDevice";
import type { SensorState } from "./devices/SensorDevice";
import type { ActuatorState } from "./devices/ActuatorDevice";
import type { WaterTreatmentState } from "./process/WaterTreatmentProcess";
import type { PowerGridState } from "./process/PowerGridProcess";

export type AssetPurdueLevel = 0 | 1 | 2 | 3 | 4;
export type AssetStatus = "ONLINE" | "DEGRADED" | "FAILED" | "OFFLINE";
export type AssetRole =
  "EWS" | "HMI" | "PLC" | "SENSOR" | "ACTUATOR" | "SWITCH" | "FIREWALL" | "SERVER" | "ROUTER";
export type SecurityZone = "ENTERPRISE" | "DMZ" | "SCADA" | "CONTROL" | "PROCESS";

export interface AssetState {
  id: string;
  name: string;
  role: AssetRole;
  purdueLevel: AssetPurdueLevel;
  zone: SecurityZone;
  ipAddress: string;
  status: AssetStatus;
  compromised: boolean;
  isolated: boolean;
  patched: boolean;
  services: string[];
  vulnerabilities: string[];
}

export interface FirewallRule {
  id: string;
  fromZone: SecurityZone;
  toZone: SecurityZone;
  protocol: string;
  port?: number;
  allowed: boolean;
  active: boolean;
}

export interface NetworkState {
  zones: Record<SecurityZone, string[]>; // zone -> asset IDs
  isolatedAssets: string[];
  severedEdges: [string, string][];
  firewallRules: FirewallRule[];
}

export type AttackPhase =
  | "RECON"
  | "INITIAL_ACCESS"
  | "LATERAL_MOVEMENT"
  | "PRIVILEGE_ESCALATION"
  | "COMMAND_INJECTION"
  | "TAMPERING"
  | "IMPACT";

export type AttackStatus = "PENDING" | "IN_PROGRESS" | "SUCCESSFUL" | "BLOCKED" | "FAILED";

export interface ActiveAttackState {
  id: string;
  name: string;
  techniqueId: string; // MITRE ATT&CK for ICS (e.g. T0831, T0855)
  techniqueName: string;
  sourceAssetId: string;
  targetAssetId: string;
  phase: AttackPhase;
  status: AttackStatus;
  progress: number; // 0-100%
  payload: Record<string, unknown>;
  startTime: number;
  completedTime?: number;
  blockedReason?: string;
}

export type DetectionSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type DetectorType = "STATISTICAL" | "RULES_SIGMA" | "ML_ISOLATION_FOREST" | "CORRELATION";

export interface DetectionAlert {
  id: string;
  timestamp: number;
  detectorType: DetectorType;
  targetAssetId: string;
  variableName: string;
  observedValue: number;
  baselineMean: number;
  zScore: number;
  severity: DetectionSeverity;
  description: string;
  mitreTechniqueId?: string;
  acknowledged: boolean;
}

export type IncidentStatus = "OPEN" | "INVESTIGATING" | "CONTAINED" | "RECOVERING" | "RESOLVED";

export interface IncidentRecord {
  id: string;
  title: string;
  severity: DetectionSeverity;
  status: IncidentStatus;
  createdTime: number;
  containedTime?: number;
  resolvedTime?: number;
  affectedAssets: string[];
  triggerDetections: string[];
  mitreTechniques: string[];
  timeline: Array<{
    timestamp: number;
    action: string;
    actor: "system" | "operator" | "attacker" | "automated_defense";
  }>;
}

export interface TwinMetrics {
  mttdSeconds: number | null; // Mean Time to Detect
  mttrSeconds: number | null; // Mean Time to Recover
  totalEvents: number;
  totalAttacksAttempted: number;
  totalAttacksBlocked: number;
  systemIntegrity: number; // 0-100 %
  safetyTripActive: boolean;
  consequenceSeverity: "NOMINAL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export type SimulationStatus = "INITIALIZING" | "RUNNING" | "PAUSED" | "STOPPED" | "COMPLETED";

export interface TwinState {
  simulationId: string;
  scenarioId: string;
  experimentId: string;
  seed: number;
  time: number; // simulation seconds from start
  dt: number; // tick step in seconds
  status: SimulationStatus;
  assets: Record<string, AssetState>;
  plcs: Record<string, PlcSnapshot>;
  sensors: Record<string, SensorState>;
  actuators: Record<string, ActuatorState>;
  process: WaterTreatmentState | PowerGridState;
  network: NetworkState;
  activeAttacks: ActiveAttackState[];
  activeDetections: DetectionAlert[];
  incidents: IncidentRecord[];
  metrics: TwinMetrics;
}

/**
 * Deep clone state to ensure immutability when returned to consumers.
 */
export function cloneTwinState(state: TwinState): TwinState {
  return JSON.parse(JSON.stringify(state));
}
