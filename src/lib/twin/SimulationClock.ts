/**
 * SimulationClock.ts
 *
 * Deterministic simulation clock for TwinSec cyber-physical range.
 * Decoupled from wall-clock time — advances only via explicit tick() calls.
 * Supports pause, resume, seek, and speed multiplier.
 */

export class SimulationClock {
  private currentTime: number = 0;
  private running: boolean = false;
  private speed: number = 1;
  private tickCount: number = 0;

  constructor(initialTime: number = 0) {
    this.currentTime = initialTime;
  }

  /**
   * Advance clock by dt seconds (scaled by speed multiplier).
   * Returns the new simulation time.
   */
  public tick(dtSeconds: number): number {
    if (!this.running) return this.currentTime;
    const advance = dtSeconds * this.speed;
    this.currentTime += advance;
    this.tickCount++;
    return this.currentTime;
  }

  /**
   * Advance clock by exactly dt seconds, ignoring speed multiplier.
   * Used for deterministic step-by-step execution.
   */
  public step(dtSeconds: number): number {
    this.currentTime += dtSeconds;
    this.tickCount++;
    return this.currentTime;
  }

  public start(): void {
    this.running = true;
  }

  public pause(): void {
    this.running = false;
  }

  public resume(): void {
    this.running = true;
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getTime(): number {
    return this.currentTime;
  }

  public getTickCount(): number {
    return this.tickCount;
  }

  public seek(time: number): void {
    this.currentTime = Math.max(0, time);
  }

  public setSpeed(multiplier: number): void {
    this.speed = Math.max(0.1, Math.min(1000, multiplier));
  }

  public getSpeed(): number {
    return this.speed;
  }

  public reset(): void {
    this.currentTime = 0;
    this.running = false;
    this.tickCount = 0;
  }

  public snapshot(): { time: number; running: boolean; speed: number; tickCount: number } {
    return {
      time: this.currentTime,
      running: this.running,
      speed: this.speed,
      tickCount: this.tickCount,
    };
  }

  public restore(snap: { time: number; running: boolean; speed: number; tickCount: number }): void {
    this.currentTime = snap.time;
    this.running = snap.running;
    this.speed = snap.speed;
    this.tickCount = snap.tickCount;
  }
}
