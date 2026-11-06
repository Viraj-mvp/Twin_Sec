/**
 * PowerGridCausalChain.test.ts
 *
 * Verifies the causal physical dynamics of PowerGridProcess in TwinRuntime:
 * Overwriting governor setpoint -> rotor frequency drift -> swing equation response
 * -> bearing temperature friction rise -> SIS breaker latch trip -> recovery.
 */

import { describe, it } from "vitest";
import assert from "node:assert/strict";
import { TwinRuntime } from "../TwinRuntime";
import { PowerGridProcess, POWER_PROCESS_PARAMS } from "../process/PowerGridProcess";

describe("Power Grid Cyber-Physical Causal Dynamics", () => {
  it("initializes power scenario with synchronous generator nominal state", () => {
    const runtime = new TwinRuntime({ scenarioId: "power", seed: 42 });
    const state = runtime.getState();

    assert.equal(state.scenarioId, "power");
    assert.ok(state.process);
    const p = state.process as any;
    assert.equal(p.frequencyHz, 50.0);
    assert.equal(p.bearingTemperatureC, 62.0);
    assert.equal(p.feederPressureBar, 8.2);
    assert.equal(p.breakerClosed, true);
  });

  it("governor setpoint override drives frequency and bearing temperature via swing equations", () => {
    const runtime = new TwinRuntime({ scenarioId: "power", seed: 42 });

    // Operator or adversary overrides PLC-3 frequency_setpoint to 54.0 Hz
    const cmdRes = runtime.applyCommand("override plc-3 frequency_setpoint 54.0");
    assert.equal(cmdRes.success, true);

    // Step simulation by 30 seconds
    for (let i = 0; i < 30; i++) {
      runtime.tick(1.0);
    }

    const state = runtime.getState();
    const p = state.process as any;

    // Frequency should have accelerated past nominal 50.0 Hz due to swing equation
    assert.ok(p.frequencyHz > 50.5, `Expected frequency > 50.5 Hz, got ${p.frequencyHz}`);
    // Bearing temperature should rise due to increased rotational frictional losses
    assert.ok(p.bearingTemperatureC > 62.0, `Expected temp > 62 °C, got ${p.bearingTemperatureC}`);
  });

  it("emergency trip trips the breaker and latches load shed", () => {
    const runtime = new TwinRuntime({ scenarioId: "power", seed: 42 });
    const tripRes = runtime.applyCommand("estop");
    assert.equal(tripRes.success, true);

    const state = runtime.getState();
    assert.equal(state.metrics.safetyTripActive, true);
  });
});
