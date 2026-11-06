/**
 * SeededRng.ts
 *
 * Deterministic pseudo-random number generator for TwinSec simulation reproducibility.
 * Uses xoshiro128** algorithm — fast, high-quality, and fully deterministic from a 32-bit seed.
 *
 * CRITICAL: All simulation randomness MUST use this RNG, never Math.random().
 * Same seed + same call sequence = identical output.
 */

/**
 * 32-bit left bitwise rotation helper
 */
function rotl32(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}

export class SeededRng {
  private s: Uint32Array;

  constructor(seed: number) {
    // Initialize state from seed using splitmix32
    this.s = new Uint32Array(4);
    let z = (seed | 0) >>> 0;
    z = ((z ^ (z >>> 16)) * 0x45d9f3b) >>> 0;
    z = ((z ^ (z >>> 16)) * 0x45d9f3b) >>> 0;
    z = (z ^ (z >>> 16)) >>> 0;
    this.s[0] = z || 1;

    z = ((z + 0x9e3779b9) | 0) >>> 0;
    z = ((z ^ (z >>> 16)) * 0x45d9f3b) >>> 0;
    z = ((z ^ (z >>> 16)) * 0x45d9f3b) >>> 0;
    z = (z ^ (z >>> 16)) >>> 0;
    this.s[1] = z || 1;

    z = ((z + 0x9e3779b9) | 0) >>> 0;
    z = ((z ^ (z >>> 16)) * 0x45d9f3b) >>> 0;
    z = ((z ^ (z >>> 16)) * 0x45d9f3b) >>> 0;
    z = (z ^ (z >>> 16)) >>> 0;
    this.s[2] = z || 1;

    z = ((z + 0x9e3779b9) | 0) >>> 0;
    z = ((z ^ (z >>> 16)) * 0x45d9f3b) >>> 0;
    z = ((z ^ (z >>> 16)) * 0x45d9f3b) >>> 0;
    z = (z ^ (z >>> 16)) >>> 0;
    this.s[3] = z || 1;
  }

  /**
   * Generate next raw 32-bit unsigned integer (xoshiro128**)
   */
  private nextRaw(): number {
    const s = this.s;
    const s1x5 = Math.imul(s[1], 5) >>> 0;
    const rot = rotl32(s1x5, 7);
    const result = Math.imul(rot, 9) >>> 0;
    const t = (s[1] << 9) >>> 0;

    s[2] = (s[2] ^ s[0]) >>> 0;
    s[3] = (s[3] ^ s[1]) >>> 0;
    s[1] = (s[1] ^ s[2]) >>> 0;
    s[0] = (s[0] ^ s[3]) >>> 0;
    s[2] = (s[2] ^ t) >>> 0;
    s[3] = rotl32(s[3], 11);

    return result;
  }

  /**
   * Random float in [0, 1)
   */
  public random(): number {
    return this.nextRaw() / 4294967296;
  }

  /**
   * Random float in [min, max)
   */
  public range(min: number, max: number): number {
    return min + this.random() * (max - min);
  }

  /**
   * Random integer in [min, max] (inclusive)
   */
  public int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /**
   * Gaussian-distributed random number using Box-Muller transform.
   * Returns value with given mean and standard deviation.
   */
  public gaussian(mean: number = 0, stdDev: number = 1): number {
    const u1 = this.random() || 1e-10; // Avoid log(0)
    const u2 = this.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
  }

  /**
   * Generate deterministic ID string
   */
  public id(prefix: string = "id"): string {
    const a = this.nextRaw().toString(36);
    const b = this.nextRaw().toString(36);
    return `${prefix}_${a}${b}`;
  }

  /**
   * Generate deterministic hex string of specified length
   */
  public nextHex(len: number = 4): string {
    const raw = this.nextRaw().toString(16).padStart(8, "0");
    return raw.slice(0, len);
  }

  /**
   * Get snapshot of internal state for save/restore
   */
  public snapshot(): number[] {
    return [this.s[0], this.s[1], this.s[2], this.s[3]];
  }

  /**
   * Restore from snapshot
   */
  public restore(state: number[]): void {
    this.s[0] = state[0] >>> 0;
    this.s[1] = state[1] >>> 0;
    this.s[2] = state[2] >>> 0;
    this.s[3] = state[3] >>> 0;
  }
}
