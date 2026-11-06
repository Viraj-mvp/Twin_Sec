export interface HaiAttackPeriod {
  index: number;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  durationFormatted: string;
  affectedProcess:
    "Boiler (P1)" | "Turbine (P2)" | "Water Treatment (P3)" | "Thermal Power (P4)" | "Multi-Stage";
  description: string;
}

export interface HaiTelemetryRow {
  timestamp: string;
  label: 0 | 1;
  // Core selected metrics for real-time visualization and SCADA panels
  p1_pressure: number; // P1_PIT01
  p1_temperature: number; // P1_TIT01
  p1_flow: number; // P1_FT01
  p1_level: number; // P1_LIT01
  p2_speed: number; // P2_SIT01 (RPM)
  p2_vibration: number; // P2_VIBTR01
  p3_flow: number; // P3_FIT01
  p3_level: number; // P3_LIT01
  p4_steam_pressure: number; // P4_ST_PT01
  p4_steam_temperature: number; // P4_ST_TT01
  rawSensors?: Record<string, number>;
}

export interface HaiDatasetStats {
  datasetName: string;
  fileName: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  totalRows: number;
  totalColumns: number;
  attackCount: number;
  totalAttackSeconds: number;
  attackPercentage: number;
  attackPeriods: HaiAttackPeriod[];
}

export interface HaiWindowQuery {
  attackIndex?: number;
  startTime?: string;
  durationSeconds?: number;
  limit?: number;
  step?: number; // Decimation step for smooth rendering (e.g. 1 = all, 5 = every 5s)
}

export interface HaiEvaluationResult {
  modelName: string;
  evaluatedSamples: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
  accuracy: number;
  threshold: number;
  anomalyDetections: {
    timestamp: string;
    groundTruth: number;
    predicted: number;
    score: number;
    metricsTriggered: string[];
  }[];
}
