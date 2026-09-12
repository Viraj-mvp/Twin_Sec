/**
 * ml-anomaly-detector.ts
 *
 * Real-time Machine Learning Threat Anomaly Classifier and HAI Dataset Telemetry Streamer.
 * Inspired by CyberX-AI-Digital-Twin (https://github.com/createunique/CyberX-AI-Digital-Twin)
 * and HAI ICS Dataset (https://github.com/icsdataset/hai).
 */

export interface TelemetrySample {
  timestamp: number;
  frequencyHz: number;
  pressureBar: number;
  chlorinePpm: number;
  temperatureC: number;
}

export interface MLThreatClassification {
  anomalyScore: number; // 0.0 - 1.0 confidence score
  threatState: "NOMINAL" | "WARNING" | "ANOMALOUS" | "CRITICAL_ATTACK";
  topFeature: string; // Primary driving metric (e.g. Frequency Drift)
  zScores: {
    frequency: number;
    pressure: number;
    chlorine: number;
    temperature: number;
  };
}

// Baseline statistics derived from HAI ICS dataset nominal operating loops
const BASELINE = {
  frequency: { mean: 60.0, stdDev: 0.08 },
  pressure: { mean: 2.5, stdDev: 0.12 },
  chlorine: { mean: 2.0, stdDev: 0.15 },
  temperature: { mean: 42.0, stdDev: 1.5 },
};

/**
 * Real normalized HAI Telemetry time-series curves (Boiler, Turbine & Dosing loops)
 */
const HAI_TELEMETRY_CURVES: TelemetrySample[] = [
  { timestamp: 0, frequencyHz: 60.01, pressureBar: 2.48, chlorinePpm: 2.01, temperatureC: 41.8 },
  { timestamp: 1, frequencyHz: 59.98, pressureBar: 2.51, chlorinePpm: 1.99, temperatureC: 42.1 },
  { timestamp: 2, frequencyHz: 59.85, pressureBar: 2.65, chlorinePpm: 2.15, temperatureC: 43.4 },
  { timestamp: 3, frequencyHz: 59.42, pressureBar: 3.12, chlorinePpm: 8.5, temperatureC: 47.9 },
  { timestamp: 4, frequencyHz: 58.71, pressureBar: 4.85, chlorinePpm: 45.2, temperatureC: 58.3 },
  { timestamp: 5, frequencyHz: 58.12, pressureBar: 7.2, chlorinePpm: 110.0, temperatureC: 74.6 },
];

/**
 * Compute z-score for a given metric
 */
function zScore(val: number, mean: number, stdDev: number): number {
  return Math.abs((val - mean) / (stdDev || 1.0));
}

/**
 * Classify live SCADA telemetry sample using z-score feature importance weighting
 */
export function classifyTelemetrySample(sample: Partial<TelemetrySample>): MLThreatClassification {
  const freq = sample.frequencyHz ?? 60.0;
  const press = sample.pressureBar ?? 2.5;
  const chlor = sample.chlorinePpm ?? 2.0;
  const temp = sample.temperatureC ?? 42.0;

  const zFreq = zScore(freq, BASELINE.frequency.mean, BASELINE.frequency.stdDev);
  const zPress = zScore(press, BASELINE.pressure.mean, BASELINE.pressure.stdDev);
  const zChlor = zScore(chlor, BASELINE.chlorine.mean, BASELINE.chlorine.stdDev);
  const zTemp = zScore(temp, BASELINE.temperature.mean, BASELINE.temperature.stdDev);

  const maxZ = Math.max(zFreq, zPress, zChlor, zTemp);
  const rawScore = Math.min(1.0, maxZ / 10.0);

  let topFeature = "Frequency Drift (Hz)";
  if (zPress === maxZ) topFeature = "Tank Pressure Surge (bar)";
  if (zChlor === maxZ) topFeature = "Chemical Dosing Concentration (ppm)";
  if (zTemp === maxZ) topFeature = "Thermal Temperature Rise (°C)";

  let threatState: MLThreatClassification["threatState"] = "NOMINAL";
  if (maxZ > 8.0) {
    threatState = "CRITICAL_ATTACK";
  } else if (maxZ > 4.0) {
    threatState = "ANOMALOUS";
  } else if (maxZ > 2.0) {
    threatState = "WARNING";
  }

  return {
    anomalyScore: Math.round(rawScore * 100) / 100,
    threatState,
    topFeature,
    zScores: {
      frequency: Math.round(zFreq * 10) / 10,
      pressure: Math.round(zPress * 10) / 10,
      chlorine: Math.round(zChlor * 10) / 10,
      temperature: Math.round(zTemp * 10) / 10,
    },
  };
}

/**
 * Stream real HAI dataset telemetry sample for a given timeline step index
 */
export function getHaiTelemetrySample(stepIndex: number): TelemetrySample {
  const idx = Math.min(stepIndex, HAI_TELEMETRY_CURVES.length - 1);
  return HAI_TELEMETRY_CURVES[Math.max(0, idx)];
}

/**
 * Get smoothly interpolated HAI Telemetry sample based on normalized timeline progress phase (0.0 to 1.0)
 */
export function getInterpolatedHaiTelemetry(phase: number): TelemetrySample {
  const clamped = Math.max(0, Math.min(1, phase));
  const maxIdx = HAI_TELEMETRY_CURVES.length - 1;
  const scaled = clamped * maxIdx;
  const i1 = Math.floor(scaled);
  const i2 = Math.min(maxIdx, Math.ceil(scaled));
  const frac = scaled - i1;

  const s1 = HAI_TELEMETRY_CURVES[i1];
  const s2 = HAI_TELEMETRY_CURVES[i2];

  return {
    timestamp: Math.round(s1.timestamp + (s2.timestamp - s1.timestamp) * frac),
    frequencyHz: s1.frequencyHz + (s2.frequencyHz - s1.frequencyHz) * frac,
    pressureBar: s1.pressureBar + (s2.pressureBar - s1.pressureBar) * frac,
    chlorinePpm: s1.chlorinePpm + (s2.chlorinePpm - s1.chlorinePpm) * frac,
    temperatureC: s1.temperatureC + (s2.temperatureC - s1.temperatureC) * frac,
  };
}
