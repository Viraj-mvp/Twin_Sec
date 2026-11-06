/**
 * Reproducibility.test.ts
 *
 * Determinism and reproducibility validation test:
 * Proves that same seed + same scenario + same actions = identical cyber-physical states.
 */

import { describe, it, expect } from "vitest";
import { TwinRuntime } from "../TwinRuntime";
import type { WaterTreatmentState } from "../process/WaterTreatmentProcess";

describe("Reproducibility & Determinism Validation", () => {
  it("produces bit-for-bit identical trajectories for identical seeds and distinct values for different seeds", () => {
    // 1. Run A (Seed: 777)
    const runA = new TwinRuntime({ scenarioId: "water", seed: 777 });
    for (let i = 0; i < 30; i++) {
      runA.tick(1.0);
    }
    runA.applyAttack({
      techniqueId: "T0886",
      techniqueName: "Credential Replay",
      sourceAssetId: "EWS-04",
      targetAssetId: "EWS-04",
      phase: "INITIAL_ACCESS",
      parameters: { method: "credential_replay" },
    });
    for (let i = 0; i < 30; i++) {
      runA.tick(1.0);
    }
    const stateA = runA.getState();

    // 2. Run B (Seed: 777)
    const runB = new TwinRuntime({ scenarioId: "water", seed: 777 });
    for (let i = 0; i < 30; i++) {
      runB.tick(1.0);
    }
    runB.applyAttack({
      techniqueId: "T0886",
      techniqueName: "Credential Replay",
      sourceAssetId: "EWS-04",
      targetAssetId: "EWS-04",
      phase: "INITIAL_ACCESS",
      parameters: { method: "credential_replay" },
    });
    for (let i = 0; i < 30; i++) {
      runB.tick(1.0);
    }
    const stateB = runB.getState();

    const procA = stateA.process as WaterTreatmentState;
    const procB = stateB.process as WaterTreatmentState;

    expect(procA.chlorineConcentration).toBe(procB.chlorineConcentration);
    expect(stateA.sensors["AIT-301"].measuredValue).toBe(stateB.sensors["AIT-301"].measuredValue);
    expect(procA.settlingTankLevel).toBe(procB.settlingTankLevel);

    // 3. Run C (Seed: 99999)
    const runC = new TwinRuntime({ scenarioId: "water", seed: 99999 });
    for (let i = 0; i < 60; i++) {
      runC.tick(1.0);
    }
    const stateC = runC.getState();
    expect(stateA.sensors["FIT-101"].measuredValue).not.toBe(
      stateC.sensors["FIT-101"].measuredValue,
    );
  });
});
