/**
 * TwinSec Industrial Web Audio & Tactile Haptics Engine
 * Procedural synthesis of SCADA relays, air-gap contactors, breaker alarms,
 * and radar blips using native Web Audio API (zero external dependencies).
 */

import { getPreferences } from "./auth-store";
import { log } from "./logger";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch((err) => {
      log.debug("AudioContext resume deferred until user gesture:", err);
    });
  }
  return audioCtx;
}

/**
 * Tactical haptic vibration pulse for mobile and tactile displays
 */
export function triggerHaptic(durationMs: number = 40) {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  const prefs = getPreferences();
  if (!prefs.hapticFeedback) return;

  if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Haptics not allowed or blocked
    }
  }
}

/**
 * Mechanical Air-Gap Relay Contactor "Thud-Click"
 * Triggered when isolating or severing a SCADA network connection.
 */
export function playAirGapRelaySound() {
  const prefs = getPreferences();
  if (!prefs.radarSound) return;
  triggerHaptic(60);

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Sub-bass mechanical latch thud (50Hz - 30Hz drop)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);

    // High frequency mechanical metallic relay snap
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = "triangle";
    snapOsc.frequency.setValueAtTime(1400, now);
    snapOsc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    snapGain.gain.setValueAtTime(0.2, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    snapOsc.connect(snapGain);
    snapGain.connect(ctx.destination);
    snapOsc.start(now);
    snapOsc.stop(now + 0.04);
  } catch {
    // Audio execution safely ignored
  }
}

/**
 * Radar Pulse Ping (880Hz high-tech blip)
 * Triggered on scan, telemetry sweep, or phase advancement.
 */
export function playRadarPingSound() {
  const prefs = getPreferences();
  if (!prefs.radarSound) return;
  triggerHaptic(25);

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch {
    // Audio execution safely ignored
  }
}

/**
 * Tactical Terminal Key Clack
 * Executed upon command evaluation or terminal execution.
 */
export function playTerminalKeySound() {
  const prefs = getPreferences();
  if (!prefs.radarSound) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(2200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.02);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.02);
  } catch {
    // Audio execution safely ignored
  }
}

/**
 * Critical High-Voltage Breaker Trip Alert
 */
export function playBreakerTripAlert() {
  const prefs = getPreferences();
  if (!prefs.radarSound) return;
  triggerHaptic(100);

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(640, now + 0.15);
    osc.frequency.linearRampToValueAtTime(320, now + 0.3);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch {
    // Audio execution safely ignored
  }
}
