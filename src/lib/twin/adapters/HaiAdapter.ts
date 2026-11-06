/**
 * HaiAdapter.ts
 *
 * Dataset adapter connecting HAI (Hardware-in-the-Loop Augmented ICS Security Dataset)
 * to TwinSec simulation and detection runtime.
 * Normalizes HAI process variables, executes detector evaluations against ground truth labels,
 * and calibrates simulation parameters against empirical distributions.
 */

import { haiDataParser } from "../../data/hai/hai-parser.server";
import type { HaiEvaluationResult, HaiTelemetryRow } from "../../data/hai/types";
import { evaluateTelemetrySeries, classifyHaiRow } from "../../engines/detection-engine";
import type { WaterTreatmentState } from "../process/WaterTreatmentProcess";

export class HaiAdapter {
  /**
   * Fetch an attack replay window for a specific attack index (e.g., Attack 3: P3 Water Treatment)
   */
  public async getAttackWindow(attackIndex: number = 3, limit: number = 300) {
    return haiDataParser.getTelemetryWindow({
      attackIndex,
      limit,
      step: 1,
    });
  }

  /**
   * Run benchmark evaluation of the detection engine against the specified HAI attack window.
   */
  public async evaluateDetectorOnAttack(
    attackIndex: number = 3,
    threshold: number = 2.5,
  ): Promise<HaiEvaluationResult> {
    const window = await this.getAttackWindow(attackIndex);
    return evaluateTelemetrySeries(window.rows, threshold);
  }

  /**
   * Convert a HAI telemetry row to a TwinSec WaterTreatmentState snapshot
   */
  public mapHaiRowToWaterState(row: HaiTelemetryRow): Partial<WaterTreatmentState> {
    // P3 Water Treatment process variables in HAI
    const p3Flow =
      typeof row.p3_flow === "number"
        ? row.p3_flow
        : typeof row.rawSensors?.["P3_FIT01"] === "number"
          ? row.rawSensors["P3_FIT01"]
          : 58.99;

    const p3Level =
      typeof row.p3_level === "number"
        ? row.p3_level
        : typeof row.rawSensors?.["P3_LIT01"] === "number"
          ? row.rawSensors["P3_LIT01"]
          : 361.3;

    const p3Pressure =
      typeof row.rawSensors?.["P3_PIT01"] === "number"
        ? row.rawSensors["P3_PIT01"]
        : typeof row.p1_pressure === "number"
          ? row.p1_pressure
          : 1.03;

    return {
      intakeFlowRate: p3Flow * 7.5, // Scaled to plant throughput
      settlingTankLevel: Math.min(100, Math.max(0, (p3Level / 500) * 100)),
      distributionPressure: p3Pressure * 4.0,
    };
  }
}

export const haiAdapter = new HaiAdapter();
