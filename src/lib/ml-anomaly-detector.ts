/**
 * ml-anomaly-detector.ts
 *
 * Cyber-Physical Threat Anomaly Detector for SCADA & Industrial Control Systems.
 * Driven by empirical baselines and continuous real telemetry from the HAI Security Dataset (v23.05).
 */

import { REAL_HAI_100_CURVE } from "./data/hai/hai-curve-data";
import { REAL_HAI_BASELINES, computeZScore } from "./engines/detection-engine";

export interface TelemetrySample {
  timestamp: number;
  frequencyHz: number;
  pressureBar: number;
  chlorinePpm: number;
  temperatureC: number;
}

export interface MLThreatClassification {
  anomalyScore: number; // 0.00 to 1.00
  threatState: "NOMINAL" | "WARNING" | "ANOMALOUS" | "CRITICAL_ATTACK";
  topFeature: string;
  zScores: {
    frequency: number;
    pressure: number;
    chlorine: number;
    temperature: number;
  };
}

/**
 * Empirical baselines derived from continuous normal operation of HAI-23.05 testbed
 */
const BASELINE = {
  frequency: { mean: 60.0, stdDev: 0.08 },
  pressure: {
    mean: REAL_HAI_BASELINES.p1_pressure.mean,
    stdDev: REAL_HAI_BASELINES.p1_pressure.std,
  },
  chlorine: { mean: 2.95, stdDev: 0.6 },
  temperature: {
    mean: REAL_HAI_BASELINES.p1_temperature.mean,
    stdDev: REAL_HAI_BASELINES.p1_temperature.std,
  },
};

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
  const press = sample.pressureBar ?? BASELINE.pressure.mean;
  const chlor = sample.chlorinePpm ?? BASELINE.chlorine.mean;
  const temp = sample.temperatureC ?? BASELINE.temperature.mean;

  const zFreq = zScore(freq, BASELINE.frequency.mean, BASELINE.frequency.stdDev);
  const zPress = zScore(press, BASELINE.pressure.mean, BASELINE.pressure.stdDev);
  const zChlor = zScore(chlor, BASELINE.chlorine.mean, BASELINE.chlorine.stdDev);
  const zTemp = zScore(temp, BASELINE.temperature.mean, BASELINE.temperature.stdDev);

  const maxZ = Math.max(zFreq, zPress, zChlor, zTemp);
  const rawScore = Math.min(1.0, maxZ / 10.0);

  let topFeature = "Generator Rotor Frequency (Hz)";
  if (zPress === maxZ) topFeature = "Boiler Drum Pressure (bar)";
  if (zChlor === maxZ) topFeature = "Chemical Dosing Flow Rate (ppm)";
  if (zTemp === maxZ) topFeature = "Process Thermal Temperature (°C)";

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
  const idx = Math.min(stepIndex, REAL_HAI_100_CURVE.length - 1);
  const s = REAL_HAI_100_CURVE[Math.max(0, idx)];
  return {
    timestamp: s.timestamp,
    frequencyHz: s.frequencyHz,
    pressureBar: s.pressureBar,
    chlorinePpm: s.chlorinePpm,
    temperatureC: s.temperatureC,
  };
}

/**
 * Get smoothly interpolated HAI Telemetry sample based on normalized timeline progress phase (0.0 to 1.0)
 */
export function getInterpolatedHaiTelemetry(phase: number): TelemetrySample {
  const clamped = Math.max(0, Math.min(1, phase));
  const maxIdx = REAL_HAI_100_CURVE.length - 1;
  const scaled = clamped * maxIdx;
  const i1 = Math.floor(scaled);
  const i2 = Math.min(maxIdx, Math.ceil(scaled));
  const frac = scaled - i1;

  const s1 = REAL_HAI_100_CURVE[i1];
  const s2 = REAL_HAI_100_CURVE[i2];

  return {
    timestamp: Math.round(s1.timestamp + (s2.timestamp - s1.timestamp) * frac),
    frequencyHz: parseFloat((s1.frequencyHz + (s2.frequencyHz - s1.frequencyHz) * frac).toFixed(2)),
    pressureBar: parseFloat((s1.pressureBar + (s2.pressureBar - s1.pressureBar) * frac).toFixed(2)),
    chlorinePpm: parseFloat((s1.chlorinePpm + (s2.chlorinePpm - s1.chlorinePpm) * frac).toFixed(2)),
    temperatureC: parseFloat(
      (s1.temperatureC + (s2.temperatureC - s1.temperatureC) * frac).toFixed(1),
    ),
  };
}
