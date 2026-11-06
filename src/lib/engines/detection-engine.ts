import type { HaiEvaluationResult, HaiTelemetryRow } from "../data/hai/types";

export interface MetricBaseline {
  mean: number;
  std: number;
  unit: string;
  label: string;
}

export const REAL_HAI_BASELINES: Record<string, MetricBaseline> = {
  p1_pressure: { mean: 1.032, std: 0.124, unit: "bar", label: "Boiler Drum Pressure (P1_PIT01)" },
  p1_temperature: {
    mean: 30.216,
    std: 0.981,
    unit: "°C",
    label: "Boiler Feed Temperature (P1_TIT01)",
  },
  p1_flow: { mean: 58.99, std: 11.981, unit: "m³/h", label: "Feed Water Flow Rate (P1_FT01)" },
  p1_level: { mean: 361.307, std: 24.884, unit: "mm", label: "Boiler Water Level (P1_LIT01)" },
  p2_speed: { mean: 911.403, std: 5.757, unit: "RPM", label: "Turbine Rotor Speed (P2_SIT01)" },
  p2_vibration: { mean: 6.951, std: 0.338, unit: "mm/s", label: "Bearing Vibration (P2_VIBTR01)" },
};

export interface MetricAnomalyScore {
  metric: string;
  label: string;
  value: number;
  expectedMean: number;
  zScore: number;
  deviationPercent: number;
  isAnomalous: boolean;
}

export interface DetectionInference {
  timestamp: string;
  groundTruth: 0 | 1;
  isPredictedAnomaly: boolean;
  compositeScore: number; // Maximum or weighted z-score
  threatLevel: "NOMINAL" | "SUSPICIOUS" | "ANOMALOUS" | "CRITICAL_ATTACK";
  topAnomalousMetrics: MetricAnomalyScore[];
  evaluationTag: "TP" | "FP" | "TN" | "FN";
}

/**
 * Compute z-score for a metric against empirical baseline
 */
export function computeZScore(val: number, baseline: MetricBaseline): number {
  if (!baseline.std || baseline.std === 0) return 0;
  return Math.abs((val - baseline.mean) / baseline.std);
}

/**
 * Classify a single HAI telemetry row against empirical baselines
 * @param row The telemetry row
 * @param threshold Z-score threshold for anomaly flag (default 2.5)
 */
export function classifyHaiRow(row: HaiTelemetryRow, threshold: number = 2.5): DetectionInference {
  const metricScores: MetricAnomalyScore[] = [];

  for (const [key, base] of Object.entries(REAL_HAI_BASELINES)) {
    const val = (row as unknown as Record<string, unknown>)[key];
    if (typeof val === "number" && !isNaN(val)) {
      const z = computeZScore(val, base);
      const devPct = base.mean !== 0 ? ((val - base.mean) / base.mean) * 100 : 0;
      metricScores.push({
        metric: key,
        label: base.label,
        value: parseFloat(val.toFixed(3)),
        expectedMean: base.mean,
        zScore: parseFloat(z.toFixed(2)),
        deviationPercent: parseFloat(devPct.toFixed(1)),
        isAnomalous: z >= threshold,
      });
    }
  }

  // Sort descending by zScore
  metricScores.sort((a, b) => b.zScore - a.zScore);

  const maxZ = metricScores.length > 0 ? metricScores[0].zScore : 0;
  const isPredictedAnomaly = maxZ >= threshold;

  let threatLevel: DetectionInference["threatLevel"] = "NOMINAL";
  if (maxZ >= 6.0) threatLevel = "CRITICAL_ATTACK";
  else if (maxZ >= 3.5) threatLevel = "ANOMALOUS";
  else if (maxZ >= threshold) threatLevel = "SUSPICIOUS";

  // Evaluate against ground truth
  let evaluationTag: DetectionInference["evaluationTag"] = "TN";
  if (isPredictedAnomaly && row.label === 1) evaluationTag = "TP";
  else if (isPredictedAnomaly && row.label === 0) evaluationTag = "FP";
  else if (!isPredictedAnomaly && row.label === 1) evaluationTag = "FN";
  else evaluationTag = "TN";

  return {
    timestamp: row.timestamp,
    groundTruth: row.label,
    isPredictedAnomaly,
    compositeScore: maxZ,
    threatLevel,
    topAnomalousMetrics: metricScores.filter((m) => m.zScore >= threshold),
    evaluationTag,
  };
}

/**
 * Evaluate a series of telemetry rows against ground truth labels to produce standard ML metrics
 */
export function evaluateTelemetrySeries(
  rows: HaiTelemetryRow[],
  threshold: number = 2.5,
): HaiEvaluationResult {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  const anomalyDetections: HaiEvaluationResult["anomalyDetections"] = [];

  for (const row of rows) {
    const inf = classifyHaiRow(row, threshold);

    if (inf.evaluationTag === "TP") tp++;
    else if (inf.evaluationTag === "FP") fp++;
    else if (inf.evaluationTag === "TN") tn++;
    else if (inf.evaluationTag === "FN") fn++;

    if (inf.isPredictedAnomaly || inf.groundTruth === 1) {
      anomalyDetections.push({
        timestamp: row.timestamp,
        groundTruth: row.label,
        predicted: inf.isPredictedAnomaly ? 1 : 0,
        score: inf.compositeScore,
        metricsTriggered: inf.topAnomalousMetrics.map((m) => `${m.label} (z=${m.zScore})`),
      });
    }
  }

  const total = rows.length || 1;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const accuracy = (tp + tn) / total;

  return {
    modelName: "ICS Physical Residual & Z-Score Anomaly Detector v2.0",
    evaluatedSamples: rows.length,
    truePositives: tp,
    falsePositives: fp,
    trueNegatives: tn,
    falseNegatives: fn,
    precision: parseFloat(precision.toFixed(4)),
    recall: parseFloat(recall.toFixed(4)),
    f1Score: parseFloat(f1.toFixed(4)),
    accuracy: parseFloat(accuracy.toFixed(4)),
    threshold,
    anomalyDetections: anomalyDetections.slice(0, 100), // Cap for display
  };
}

// ─── Twin Live Process Detection ──────────────────────────────────

export const WATER_TREATMENT_BASELINES: Record<
  string,
  MetricBaseline & { targetAssetId: string; mitre: string }
> = {
  chlorineConcentration: {
    mean: 2.95,
    std: 0.6,
    unit: "mg/L",
    label: "Residual Chlorine (AIT-301)",
    targetAssetId: "PLC-DOSE",
    mitre: "T0831", // Manipulation of Control
  },
  settlingTankLevel: {
    mean: 55.0,
    std: 5.2,
    unit: "%",
    label: "Settling Tank Level (LIT-101)",
    targetAssetId: "PLC-INTAKE",
    mitre: "T0855", // Unauthorized Command Message
  },
  intakeFlowRate: {
    mean: 450.0,
    std: 28.5,
    unit: "m³/h",
    label: "Raw Intake Flow Rate (FIT-101)",
    targetAssetId: "PLC-INTAKE",
    mitre: "T0855",
  },
  distributionPressure: {
    mean: 4.5,
    std: 0.35,
    unit: "bar",
    label: "Distribution Main Pressure (PIT-501)",
    targetAssetId: "PLC-DIST",
    mitre: "T0855",
  },
  pH: {
    mean: 7.2,
    std: 0.25,
    unit: "pH",
    label: "Water Acidity/pH (PH-401)",
    targetAssetId: "PLC-DOSE",
    mitre: "T0831",
  },
};

/**
 * Classify a live process state from TwinRuntime and generate DetectionAlerts
 * for any variables exceeding statistical z-score thresholds.
 */
export function classifyLiveProcessState(
  processState: Record<string, number>,
  timestamp: number,
  threshold: number = 2.5,
): Array<{
  id: string;
  timestamp: number;
  detectorType: "STATISTICAL";
  targetAssetId: string;
  variableName: string;
  observedValue: number;
  baselineMean: number;
  zScore: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  mitreTechniqueId?: string;
  acknowledged: boolean;
}> {
  const alerts: Array<any> = [];

  for (const [varName, baseline] of Object.entries(WATER_TREATMENT_BASELINES)) {
    const val = processState[varName];
    if (typeof val !== "number") continue;

    const zScore = Math.abs((val - baseline.mean) / baseline.std);
    if (zScore >= threshold) {
      let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
      if (zScore >= 6.0) severity = "CRITICAL";
      else if (zScore >= 4.0) severity = "HIGH";
      else if (zScore >= 3.0) severity = "MEDIUM";

      alerts.push({
        id: `alt-${timestamp.toFixed(0)}-${varName}`,
        timestamp,
        detectorType: "STATISTICAL",
        targetAssetId: baseline.targetAssetId,
        variableName: varName,
        observedValue: parseFloat(val.toFixed(3)),
        baselineMean: baseline.mean,
        zScore: parseFloat(zScore.toFixed(2)),
        severity,
        description: `Statistical anomaly detected on ${baseline.label}: observed ${val.toFixed(2)} ${baseline.unit} (baseline ${baseline.mean} ± ${baseline.std}, z=${zScore.toFixed(2)})`,
        mitreTechniqueId: baseline.mitre,
        acknowledged: false,
      });
    }
  }

  return alerts;
}
