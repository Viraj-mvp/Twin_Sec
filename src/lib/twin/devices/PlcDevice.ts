/**
 * PlcDevice.ts
 *
 * Programmable Logic Controller simulation model for TwinSec.
 * Each PLC holds named registers, processes commands, and connects
 * to actuators/sensors. Register writes by attackers or operators
 * causally propagate through the process model.
 */

import type { SeededRng } from "../SeededRng";

// ─── Register Types ──────────────────────────────────────────────

export interface PlcRegister {
  name: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  baseline: number;
  description: string;
}

export type PlcMode = "AUTO" | "MANUAL" | "STOP" | "FAULTED";

// ─── Command History Entry ───────────────────────────────────────

export interface PlcCommandRecord {
  timestamp: number;
  source: "operator" | "attacker" | "system" | "sis";
  register: string;
  previousValue: number;
  newValue: number;
  accepted: boolean;
  rejectReason?: string;
}

// ─── PLC State Snapshot ──────────────────────────────────────────

export interface PlcSnapshot {
  id: string;
  mode: PlcMode;
  registers: Record<string, number>;
  compromised: boolean;
  accessGranted: string[];
}

// ─── PLC Device ──────────────────────────────────────────────────

export class PlcDevice {
  public readonly id: string;
  public readonly label: string;
  public readonly purdueLevel: number;

  private mode: PlcMode = "AUTO";
  private registers: Map<string, PlcRegister> = new Map();
  private compromised: boolean = false;
  private accessGranted: Set<string> = new Set(); // asset IDs that have access
  private commandHistory: PlcCommandRecord[] = [];

  constructor(
    configOrId:
      | string
      | {
          id: string;
          label: string;
          purdueLevel: number;
          registers: (Omit<PlcRegister, "value"> | PlcRegister)[];
        },
    label?: string,
    purdueLevel?: number,
    registerDefs?: (Omit<PlcRegister, "value"> | PlcRegister)[],
  ) {
    if (typeof configOrId === "object") {
      this.id = configOrId.id;
      this.label = configOrId.label;
      this.purdueLevel = configOrId.purdueLevel;
      for (const def of configOrId.registers || []) {
        const val = "value" in def && typeof def.value === "number" ? def.value : def.baseline;
        this.registers.set(def.name, {
          ...def,
          value: val,
        });
      }
    } else {
      this.id = configOrId;
      this.label = label || configOrId;
      this.purdueLevel = purdueLevel ?? 1;
      for (const def of registerDefs || []) {
        const val = "value" in def && typeof def.value === "number" ? def.value : def.baseline;
        this.registers.set(def.name, {
          ...def,
          value: val,
        });
      }
    }
  }

  // ─── Register Access ─────────────────────────────────────────

  public readRegister(name: string): number | undefined {
    return this.registers.get(name)?.value;
  }

  public getRegisterValue(name: string): number {
    const reg = this.registers.get(name);
    return reg ? reg.value : 0;
  }

  public getRegisterDef(name: string): PlcRegister | undefined {
    return this.registers.get(name);
  }

  public getAllRegisters(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [name, reg] of this.registers) {
      result[name] = reg.value;
    }
    return result;
  }

  public getRegisters(): PlcRegister[] {
    return Array.from(this.registers.values());
  }

  public setRegisterValue(name: string, value: number): void {
    const reg = this.registers.get(name);
    if (reg) {
      reg.value = value;
    }
  }

  /**
   * Write a register value. Returns whether the write was accepted.
   * Rejects if PLC is in STOP/FAULTED mode or value is out of range.
   */
  public writeRegister(
    name: string,
    value: number,
    source: PlcCommandRecord["source"],
    timestamp: number,
  ): {
    accepted: boolean;
    success: boolean;
    previousValue: number;
    rejectReason?: string;
    reason?: string;
  } {
    const reg = this.registers.get(name);
    if (!reg) {
      const err = `Unknown register: ${name}`;
      return { accepted: false, success: false, previousValue: 0, rejectReason: err, reason: err };
    }

    const previousValue = reg.value;

    // STOP or FAULTED PLCs reject all writes except system/sis reset
    if (
      (this.mode === "STOP" || this.mode === "FAULTED") &&
      source !== "system" &&
      source !== "sis"
    ) {
      const record: PlcCommandRecord = {
        timestamp,
        source,
        register: name,
        previousValue,
        newValue: value,
        accepted: false,
        rejectReason: `PLC in ${this.mode} mode`,
      };
      this.commandHistory.push(record);
      return {
        accepted: false,
        success: false,
        previousValue,
        rejectReason: record.rejectReason,
        reason: record.rejectReason,
      };
    }

    // Firmware bounds check: reject out of range values
    if (value < reg.min || value > reg.max) {
      const reason = `Value ${value} exceeds register bounds [${reg.min}, ${reg.max}]`;
      const record: PlcCommandRecord = {
        timestamp,
        source,
        register: name,
        previousValue,
        newValue: value,
        accepted: false,
        rejectReason: reason,
      };
      this.commandHistory.push(record);
      return { accepted: false, success: false, previousValue, rejectReason: reason, reason };
    }

    reg.value = value;

    const record: PlcCommandRecord = {
      timestamp,
      source,
      register: name,
      previousValue,
      newValue: value,
      accepted: true,
    };
    this.commandHistory.push(record);

    // Cap history at 500 entries
    if (this.commandHistory.length > 500) {
      this.commandHistory = this.commandHistory.slice(-400);
    }

    return { accepted: true, success: true, previousValue };
  }

  // ─── Mode Control ────────────────────────────────────────────

  public getMode(): PlcMode {
    return this.mode;
  }

  public setMode(mode: PlcMode): void {
    this.mode = mode;
  }

  // ─── Compromise State ────────────────────────────────────────

  public isCompromised(): boolean {
    return this.compromised;
  }

  public setCompromised(val: boolean): void {
    this.compromised = val;
  }

  // ─── Access Control ──────────────────────────────────────────

  public grantAccess(assetId: string): void {
    this.accessGranted.add(assetId);
  }

  public revokeAccess(assetId: string): void {
    this.accessGranted.delete(assetId);
  }

  public hasAccess(assetId: string): boolean {
    return this.accessGranted.has(assetId);
  }

  // ─── Reset to Baseline ──────────────────────────────────────

  public resetToBaseline(_timestamp?: number): void {
    for (const reg of this.registers.values()) {
      reg.value = reg.baseline;
    }
    this.mode = "AUTO";
    this.compromised = false;
  }

  // ─── History ─────────────────────────────────────────────────

  public getCommandHistory(): readonly PlcCommandRecord[] {
    return this.commandHistory;
  }

  public getRecentCommands(count: number = 20): PlcCommandRecord[] {
    return this.commandHistory.slice(-count);
  }

  // ─── Snapshot / Restore ──────────────────────────────────────

  public snapshot(): PlcSnapshot {
    return {
      id: this.id,
      mode: this.mode,
      registers: this.getAllRegisters(),
      compromised: this.compromised,
      accessGranted: Array.from(this.accessGranted),
    };
  }

  public restore(snap: PlcSnapshot): void {
    this.mode = snap.mode;
    this.compromised = snap.compromised;
    this.accessGranted = new Set(
      Array.isArray(snap.accessGranted) ? snap.accessGranted : Array.from(snap.accessGranted || []),
    );
    for (const [name, value] of Object.entries(snap.registers)) {
      const reg = this.registers.get(name);
      if (reg) reg.value = value;
    }
  }

  public restoreSnapshot(snap: PlcSnapshot): void {
    this.restore(snap);
  }
}
