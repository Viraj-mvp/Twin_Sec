/**
 * PlcDevice.test.ts
 *
 * Unit tests validating PLC registers, mode transitions, command tracking,
 * and snapshot restoration.
 */

import { describe, it, expect } from "vitest";
import { PlcDevice } from "../devices/PlcDevice";

describe("PlcDevice Controller Unit Tests", () => {
  it("initializes registers and modes accurately", () => {
    const plc = new PlcDevice({
      id: "PLC-DOSE-01",
      label: "Dosing Controller",
      purdueLevel: 1,
      registers: [
        {
          name: "dosing_setpoint",
          value: 1.5,
          unit: "ppm",
          min: 0.2,
          max: 10.0,
          baseline: 1.5,
          description: "Chlorine ppm setpoint",
        },
        {
          name: "feed_valve",
          value: 45,
          unit: "%",
          min: 0,
          max: 100,
          baseline: 45,
          description: "Valve position",
        },
      ],
    });

    expect(plc.getRegisterValue("dosing_setpoint")).toBe(1.5);
    expect(plc.getMode()).toBe("AUTO");

    // Authorized register write
    const writeRes = plc.writeRegister("dosing_setpoint", 6.8, "operator", 10);
    expect(writeRes.success).toBe(true);
    expect(plc.getRegisterValue("dosing_setpoint")).toBe(6.8);

    // Out-of-bounds rejection
    const badWrite = plc.writeRegister("dosing_setpoint", 99.0, "attacker", 15);
    expect(badWrite.success).toBe(false);
    expect(plc.getRegisterValue("dosing_setpoint")).toBe(6.8);

    // Mode transition
    plc.setMode("STOP");
    expect(plc.getMode()).toBe("STOP");
    const stoppedWrite = plc.writeRegister("dosing_setpoint", 3.0, "operator", 20);
    expect(stoppedWrite.success).toBe(false);

    // Reset to baseline
    plc.setMode("AUTO");
    plc.resetToBaseline(25);
    expect(plc.getRegisterValue("dosing_setpoint")).toBe(1.5);

    // Snapshot & restore
    const snap = plc.snapshot();
    plc.writeRegister("dosing_setpoint", 4.0, "attacker", 30);
    expect(plc.getRegisterValue("dosing_setpoint")).toBe(4.0);
    plc.restoreSnapshot(snap);
    expect(plc.getRegisterValue("dosing_setpoint")).toBe(1.5);
  });
});
