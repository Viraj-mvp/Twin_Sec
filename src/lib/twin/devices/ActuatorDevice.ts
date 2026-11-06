/**
 * ActuatorDevice.ts
 *
 * Actuator simulation model for TwinSec.
 * Translates PLC register commands into physical process actions.
 * Models physical inertia — actuators don't reach target instantly.
 */

export interface ActuatorConfig {
  id: string;
  label: string;
  unit: string;
  plcId: string; // Which PLC controls this actuator
  commandRegister: string; // PLC register name that sets the target
  minPosition: number;
  maxPosition: number;
  rampRate: number; // Units per second (how fast actuator moves)
  safePosition: number; // Position on emergency stop / SIS trip
}

export interface ActuatorState {
  id: string;
  targetPosition: number; // Commanded by PLC register
  currentPosition: number; // Actual physical position (may lag target)
  isMoving: boolean;
  isFaulted: boolean;
}

export class ActuatorDevice {
  public readonly id: string;
  public readonly label: string;
  public readonly unit: string;
  public readonly plcId: string;
  public readonly commandRegister: string;

  private minPosition: number;
  private maxPosition: number;
  private rampRate: number;
  private safePosition: number;

  private targetPosition: number;
  private currentPosition: number;
  private faulted: boolean = false;

  constructor(config: ActuatorConfig) {
    this.id = config.id;
    this.label = config.label;
    this.unit = config.unit;
    this.plcId = config.plcId;
    this.commandRegister = config.commandRegister;
    this.minPosition = config.minPosition;
    this.maxPosition = config.maxPosition;
    this.rampRate = config.rampRate;
    this.safePosition = config.safePosition;

    // Start at safe position
    this.targetPosition = config.safePosition;
    this.currentPosition = config.safePosition;
  }

  /**
   * Set new target position from PLC register value.
   */
  public setTarget(target: number): void {
    if (this.faulted) return;
    this.targetPosition = Math.max(this.minPosition, Math.min(this.maxPosition, target));
  }

  public setTargetPosition(pos: number): void {
    this.setTarget(pos);
  }

  /**
   * Advance actuator position toward target by dt seconds.
   * Returns the new current position.
   */
  public update(dt: number): number {
    if (this.faulted) return this.currentPosition;

    const diff = this.targetPosition - this.currentPosition;
    if (Math.abs(diff) < 0.001) {
      this.currentPosition = this.targetPosition;
      return this.currentPosition;
    }

    const maxMove = this.rampRate * dt;
    if (Math.abs(diff) <= maxMove) {
      this.currentPosition = this.targetPosition;
    } else {
      this.currentPosition += Math.sign(diff) * maxMove;
    }

    return this.currentPosition;
  }

  public tick(dt: number): number {
    return this.update(dt);
  }

  /**
   * Emergency trip — immediately move to safe position.
   */
  public tripToSafe(): void {
    this.targetPosition = this.safePosition;
    this.currentPosition = this.safePosition; // Instant trip (safety-rated)
  }

  public getPosition(): number {
    return this.currentPosition;
  }

  public getCurrentPosition(): number {
    return this.currentPosition;
  }

  public getTarget(): number {
    return this.targetPosition;
  }

  public isMoving(): boolean {
    return Math.abs(this.targetPosition - this.currentPosition) > 0.001;
  }

  public setFaulted(val: boolean): void {
    this.faulted = val;
  }

  public isFaulted(): boolean {
    return this.faulted;
  }

  public getState(): ActuatorState {
    return {
      id: this.id,
      targetPosition: this.targetPosition,
      currentPosition: this.currentPosition,
      isMoving: this.isMoving(),
      isFaulted: this.faulted,
    };
  }

  public restore(state: ActuatorState): void {
    this.targetPosition = state.targetPosition;
    this.currentPosition = state.currentPosition;
    this.faulted = state.isFaulted;
  }
}
