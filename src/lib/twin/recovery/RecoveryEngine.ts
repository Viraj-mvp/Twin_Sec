/**
 * RecoveryEngine.ts
 *
 * Cyber-physical recovery engine for TwinSec.
 * Tracks process stabilization following operator containment/mitigation,
 * validates telemetry convergence back to nominal distributions,
 * and calculates authentic MTTR (Mean Time to Recover).
 */

import type { WaterTreatmentState } from "../process/WaterTreatmentProcess";
import type { PowerGridState } from "../process/PowerGridProcess";

export interface RecoveryStatus {
  isRecovering: boolean;
  isFullyRecovered: boolean;
  recoveryStartTime?: number;
  recoveryEndTime?: number;
  mttrSeconds?: number;
  stabilizationPercentage: number; // 0-100%
  deviantVariables: string[];
}

export class RecoveryEngine {
  private recoveryStartTime: number | null = null;
  private recoveryEndTime: number | null = null;
  private isRecovering: boolean = false;
  private isFullyRecovered: boolean = false;

  // Calibrated safe baseline ranges (HAI P3 nominal operational bounds)
  private readonly SAFE_BOUNDS = {
    chlorineConcentration: { min: 1.5, max: 4.5 }, // nominal 2.95 ppm
    settlingTankLevel: { min: 30, max: 85 }, // nominal 55%
    distributionPressure: { min: 3.0, max: 6.0 }, // nominal 4.5 bar
    intakeFlowRate: { min: 100, max: 550 }, // nominal ~450 m3/h
  };

  /**
   * Signal the start of recovery (e.g. when PLC is reset or asset is isolated)
   */
  public initiateRecovery(timestamp: number): void {
    if (!this.isRecovering && !this.isFullyRecovered) {
      this.isRecovering = true;
      this.recoveryStartTime = timestamp;
    }
  }

  /**
   * Evaluate whether process variables have stabilized back within safe operating bounds.
   */
  public evaluateStabilization(
    processState: WaterTreatmentState | PowerGridState,
    timestamp: number,
  ): RecoveryStatus {
    const deviantVariables: string[] = [];

    if ("frequencyHz" in processState) {
      if (processState.frequencyHz < 49.5 || processState.frequencyHz > 50.5) {
        deviantVariables.push("frequencyHz");
      }
      if (processState.bearingTemperatureC > 80.0) {
        deviantVariables.push("bearingTemperatureC");
      }
      if (processState.feederPressureBar < 7.2) {
        deviantVariables.push("feederPressureBar");
      }
      const totalMonitored = 3;
      const nominalCount = totalMonitored - deviantVariables.length;
      const stabilizationPercentage = Math.round((nominalCount / totalMonitored) * 100);

      if (this.isRecovering && deviantVariables.length === 0) {
        this.isFullyRecovered = true;
        this.isRecovering = false;
        this.recoveryEndTime = timestamp;
      }

      const mttrSeconds =
        this.recoveryStartTime !== null && this.recoveryEndTime !== null
          ? this.recoveryEndTime - this.recoveryStartTime
          : undefined;

      return {
        isRecovering: this.isRecovering,
        isFullyRecovered: this.isFullyRecovered,
        recoveryStartTime: this.recoveryStartTime ?? undefined,
        recoveryEndTime: this.recoveryEndTime ?? undefined,
        mttrSeconds,
        stabilizationPercentage,
        deviantVariables,
      };
    }

    if (
      processState.chlorineConcentration < this.SAFE_BOUNDS.chlorineConcentration.min ||
      processState.chlorineConcentration > this.SAFE_BOUNDS.chlorineConcentration.max
    ) {
      deviantVariables.push("chlorineConcentration");
    }

    if (
      processState.settlingTankLevel < this.SAFE_BOUNDS.settlingTankLevel.min ||
      processState.settlingTankLevel > this.SAFE_BOUNDS.settlingTankLevel.max
    ) {
      deviantVariables.push("settlingTankLevel");
    }

    if (
      processState.distributionPressure < this.SAFE_BOUNDS.distributionPressure.min ||
      processState.distributionPressure > this.SAFE_BOUNDS.distributionPressure.max
    ) {
      deviantVariables.push("distributionPressure");
    }

    const totalMonitored = Object.keys(this.SAFE_BOUNDS).length;
    const nominalCount = totalMonitored - deviantVariables.length;
    const stabilizationPercentage = Math.round((nominalCount / totalMonitored) * 100);

    if (this.isRecovering && deviantVariables.length === 0) {
      this.isFullyRecovered = true;
      this.isRecovering = false;
      this.recoveryEndTime = timestamp;
    }

    const mttrSeconds =
      this.recoveryStartTime !== null && this.recoveryEndTime !== null
        ? this.recoveryEndTime - this.recoveryStartTime
        : undefined;

    return {
      isRecovering: this.isRecovering,
      isFullyRecovered: this.isFullyRecovered,
      recoveryStartTime: this.recoveryStartTime ?? undefined,
      recoveryEndTime: this.recoveryEndTime ?? undefined,
      mttrSeconds,
      stabilizationPercentage,
      deviantVariables,
    };
  }

  public reset(): void {
    this.recoveryStartTime = null;
    this.recoveryEndTime = null;
    this.isRecovering = false;
    this.isFullyRecovered = false;
  }
}
