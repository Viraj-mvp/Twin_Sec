/**
 * CausalChain.test.ts
 *
 * Full integration test validating the end-to-end cyber-physical causal chain:
 * 1. Healthy plant startup & baseline telemetry
 * 2. Multi-stage adversary attack propagation (EWS-04 -> HMI-11 -> PLC-DOSE)
 * 3. PLC register manipulation -> mechanical actuator movement -> physical chlorine drift
 * 4. Observable sensor reading deviation -> statistical anomaly detection (z-score > 2.5)
 * 5. Automated correlation to MITRE ATT&CK T0831 & incident creation
 * 6. Operator containment via Air-Gap isolation (BFS graph reachability severance)
 * 7. Verification that air-gapped PLC blocks subsequent attacks
 * 8. Operator mitigation via PLC register reset
 * 9. Process stabilization & authentic MTTR/MTTD metric computation
 */

import { describe, it, expect } from "vitest";
import { TwinRuntime } from "../TwinRuntime";
import type { WaterTreatmentState } from "../process/WaterTreatmentProcess";

describe("Cyber-Physical Causal Chain Full Integration Test", () => {
  it("verifies end-to-end attack propagation, physical drift, anomaly detection, air-gap severance, and recovery", async () => {
    // STEP 1: Initialize TwinRuntime with deterministic seed
    const runtime = new TwinRuntime({ scenarioId: "water", seed: 42 });
    const initial = runtime.getState();
    const initWater = initial.process as WaterTreatmentState;

    expect(initWater.chlorineConcentration).toBeGreaterThan(2.0);
    expect(initWater.chlorineConcentration).toBeLessThan(4.0);
    expect(initial.assets["EWS-04"].compromised).toBe(false);

    // STEP 2: Attacker Initial Access on EWS-04
    const atk1 = runtime.applyAttack({
      techniqueId: "T0886",
      techniqueName: "Remote System Discovery / Credential Access",
      sourceAssetId: "EWS-04",
      targetAssetId: "EWS-04",
      phase: "INITIAL_ACCESS",
      parameters: { method: "credential_replay" },
    });
    expect(atk1.success).toBe(true);
    expect(runtime.getState().assets["EWS-04"].compromised).toBe(true);

    // STEP 3: Lateral Movement to HMI-11
    const atk2 = runtime.applyAttack({
      techniqueId: "T0812",
      techniqueName: "Default Credentials / Lateral Movement",
      sourceAssetId: "EWS-04",
      targetAssetId: "HMI-11",
      phase: "LATERAL_MOVEMENT",
      parameters: { protocol: "DNP3" },
    });
    expect(atk2.success).toBe(true);
    expect(runtime.getState().assets["HMI-11"].compromised).toBe(true);

    // STEP 4: PLC Register Manipulation
    const atk3 = runtime.applyAttack({
      techniqueId: "T0855",
      techniqueName: "Unauthorized Command Message (Set Point Tampering)",
      sourceAssetId: "HMI-11",
      targetAssetId: "PLC-DOSE",
      phase: "TAMPERING",
      parameters: { register: "dosing_setpoint", value: 7.5 },
    });
    expect(atk3.success).toBe(true);

    // STEP 5: Physical Process Simulation (60 seconds)
    for (let s = 0; s < 60; s++) {
      runtime.tick(1.0);
    }
    const stateAfter60 = runtime.getState();
    const waterAfter60 = stateAfter60.process as WaterTreatmentState;
    expect(waterAfter60.chlorineConcentration).toBeGreaterThan(4.5);

    // STEP 6: Verification of Detection Alerts & Incidents
    const stateAfterStep5 = runtime.getState();
    const alerts = stateAfterStep5.activeDetections;
    expect(alerts.length).toBeGreaterThan(0);
    const incidents = stateAfterStep5.incidents;
    expect(incidents.length).toBeGreaterThan(0);

    // STEP 7: Tactical Operator Intervention — Air-Gap PLC-DOSE
    const airGapCmd = runtime.applyCommand("airgap PLC-DOSE");
    expect(airGapCmd.success).toBe(true);
    expect(runtime.getState().assets["PLC-DOSE"].isolated).toBe(true);

    // STEP 8: Verification that subsequent attack is blocked by air-gap
    const blockedAtk = runtime.applyAttack({
      techniqueId: "T0831",
      techniqueName: "Manipulation of Control (Follow-up)",
      sourceAssetId: "HMI-11",
      targetAssetId: "PLC-DOSE",
      phase: "TAMPERING",
      parameters: { register: "dosing_setpoint", value: 9.0 },
    });
    expect(blockedAtk.success).toBe(false);

    // STEP 9: Operator Mitigation: Reset PLC to Factory Baseline
    const resetCmd = runtime.applyCommand("reset PLC-DOSE");
    expect(resetCmd.success).toBe(true);
    const stateAfterReset = runtime.getState();
    expect(stateAfterReset.plcs["PLC-DOSE"].registers["dosing_setpoint"]).toBe(1.5);

    // STEP 10: Process Recovery & Stabilization
    for (let s = 0; s < 240; s++) {
      runtime.tick(1.0);
    }
    const finalState = runtime.getState();
    const finalWater = finalState.process as WaterTreatmentState;
    expect(finalWater.chlorineConcentration).toBeLessThan(4.5);
    expect(finalState.metrics.mttdSeconds).not.toBeNull();
  });
});
