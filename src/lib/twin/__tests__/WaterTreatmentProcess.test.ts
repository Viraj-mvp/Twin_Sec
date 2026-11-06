/**
 * WaterTreatmentProcess.test.ts
 *
 * Unit tests validating first-principles physical causality:
 * pump speed -> flow rate -> tank level;
 * dosing valve position -> chlorine injection -> concentration.
 */

import { describe, it, expect } from "vitest";
import { WaterTreatmentProcess } from "../process/WaterTreatmentProcess";

describe("WaterTreatmentProcess Physics Unit Tests", () => {
  it("validates nominal bounds, pump hydraulics, and chemical dosing causality", () => {
    const plant = new WaterTreatmentProcess();
    const initial = plant.getState();

    // 1. Initial nominal bounds (HAI P3 calibrated)
    expect(initial.chlorineConcentration).toBeGreaterThan(2.0);
    expect(initial.chlorineConcentration).toBeLessThan(4.0);
    expect(initial.settlingTankLevel).toBeGreaterThan(40);
    expect(initial.settlingTankLevel).toBeLessThan(70);

    // 2. Increase intake pump speed -> Flow rate must causally increase
    const beforeFlow = initial.intakeFlowRate;
    plant.tick(5.0, { intakePumpSpeed: 100 });
    const afterState = plant.getState();
    expect(afterState.intakeFlowRate).toBeGreaterThan(beforeFlow);

    // 3. Open chlorine dosing valve to 100% -> Chlorine concentration must rise
    for (let i = 0; i < 60; i++) {
      plant.tick(1.0, { dosingValvePosition: 100 });
    }
    const overdoseState = plant.getState();
    expect(overdoseState.chlorineConcentration).toBeGreaterThan(5.0);

    // 4. Emergency trip -> Actuators close and process enters safe containment
    plant.emergencyTrip();
    expect(plant.isTripped()).toBe(true);
  });
});
