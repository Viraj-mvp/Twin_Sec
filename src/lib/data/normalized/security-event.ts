export type SecurityEventSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SecurityEventSource =
  | "HAI_TELEMETRY_ENGINE"
  | "PHYSICS_DRIFT_DETECTOR"
  | "ZSCORE_ANOMALY_ENGINE"
  | "MITRE_ICS_CORRELATOR"
  | "OTCAD_INTEL_FEED"
  | "OPERATOR_ACTION";

export interface NormalizedSecurityEvent {
  id: string;
  timestamp: string;
  source: SecurityEventSource;
  severity: SecurityEventSeverity;
  eventType: string; // e.g. "ANOMALY_DETECTED", "ATTACK_TRIGGERED", "AIR_GAP_SEVERED", "SETPOINT_DEVIATION"
  sector: string; // "power", "water", "oil-gas", "manufacturing", etc.
  targetComponent: string; // e.g. "P1_FCV01", "PLC-7", "SUB1"
  description: string;

  // ICS Physics & Telemetry details
  telemetryPayload?: {
    metric: string;
    value: number;
    expectedBaseline: number;
    zScore: number;
    driftPercent: number;
    groundTruthLabel?: 0 | 1;
  };

  // MITRE ATT&CK for ICS correlation
  mitreCorrelation?: {
    techniqueId: string; // e.g. "T0855", "T0831"
    techniqueName: string;
    tactics: string[];
    platforms: string[];
    mitigations: string[];
  };

  // OTCAD Historical Intelligence Parallel
  otcadParallel?: {
    incidentName: string;
    year: number;
    industry: string;
    consequence: string;
  };

  // Ground truth evaluation tag
  evaluationTag?: "TP" | "FP" | "TN" | "FN";
}
