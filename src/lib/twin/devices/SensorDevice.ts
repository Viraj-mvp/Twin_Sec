/**
 * SensorDevice.ts
 *
 * Sensor simulation model for TwinSec.
 * Reads a physical process variable, applies noise (from seeded RNG),
 * and optionally applies attacker-injected offset for sensor spoofing attacks.
 */

import type { SeededRng } from "../SeededRng";

export interface SensorConfig {
  id: string;
  label: string;
  unit: string;
  processVariable: string; // Key into ProcessState to read
  noiseSigma: number; // Gaussian noise standard deviation (0 = perfect sensor)
  min: number; // Sensor output floor
  max: number; // Sensor output ceiling
}

export interface SensorState {
  id: string;
  rawValue: number; // True process variable value
  measuredValue: number; // rawValue + noise + spoofOffset
  spoofOffset: number; // Attacker-injected bias
  isSpoofed: boolean;
  lastUpdateTime: number;
}

export class SensorDevice {
  public readonly id: string;
  public readonly label: string;
  public readonly unit: string;
  public readonly processVariable: string;

  private noiseSigma: number;
  private min: number;
  private max: number;

  private rawValue: number = 0;
  private measuredValue: number = 0;
  private spoofOffset: number = 0;
  private lastUpdateTime: number = 0;

  constructor(config: SensorConfig) {
    this.id = config.id;
    this.label = config.label;
    this.unit = config.unit;
    this.processVariable = config.processVariable;
    this.noiseSigma = config.noiseSigma;
    this.min = config.min;
    this.max = config.max;
  }

  /**
   * Update sensor reading from the true process variable value.
   */
  public update(trueValue: number, arg2: SeededRng | number, arg3?: SeededRng | number): number {
    let rng: SeededRng | undefined;
    let timestamp: number = 0;

    if (typeof arg2 === "number") {
      timestamp = arg2;
      rng = arg3 as SeededRng;
    } else {
      rng = arg2 as SeededRng;
      timestamp = (arg3 as number) || 0;
    }

    this.rawValue = trueValue;

    // Apply sensor noise (Gaussian)
    const noise = this.noiseSigma > 0 && rng?.gaussian ? rng.gaussian(0, this.noiseSigma) : 0;

    // Apply attacker offset (if spoofed)
    const reading = trueValue + noise + this.spoofOffset;

    // Clamp to sensor output range
    this.measuredValue = Math.max(this.min, Math.min(this.max, reading));
    this.lastUpdateTime = timestamp;

    return this.measuredValue;
  }

  /**
   * Get the current sensor reading (what SCADA/HMI would see)
   */
  public getReading(): number {
    return this.measuredValue;
  }

  public getMeasuredValue(): number {
    return this.measuredValue;
  }

  /**
   * Get the true process value (ground truth — not visible to SCADA)
   */
  public getTrueValue(): number {
    return this.rawValue;
  }

  // ─── Spoofing ────────────────────────────────────────────────

  public setSpoofOffset(offset: number): void {
    this.spoofOffset = offset;
  }

  public clearSpoof(): void {
    this.spoofOffset = 0;
  }

  public isSpoofed(): boolean {
    return this.spoofOffset !== 0;
  }

  // ─── State ───────────────────────────────────────────────────

  public getState(): SensorState {
    return {
      id: this.id,
      rawValue: this.rawValue,
      measuredValue: this.measuredValue,
      spoofOffset: this.spoofOffset,
      isSpoofed: this.spoofOffset !== 0,
      lastUpdateTime: this.lastUpdateTime,
    };
  }

  public restore(state: SensorState): void {
    this.rawValue = state.rawValue;
    this.measuredValue = state.measuredValue;
    this.spoofOffset = state.spoofOffset;
    this.lastUpdateTime = state.lastUpdateTime;
  }
}
