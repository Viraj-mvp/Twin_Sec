import type { SectorId } from "./scenarios";

export type TelemetryMetric = {
  id: string;
  label: string;
  unit: string;
  baseline: number;
  impactFn: (phase: number, physicsMul: number, t: number) => number;
};

export type SectorTelemetry = {
  metrics: [TelemetryMetric, TelemetryMetric, TelemetryMetric];
};

export const SECTOR_TELEMETRY: Record<SectorId, SectorTelemetry> = {
  power: {
    metrics: [
      {
        id: "m1",
        label: "ROTOR SPEED",
        unit: "Hz",
        baseline: 50.0,
        impactFn: (phase, physicsMul, t) =>
          50.0 + Math.sin(t / 40) * 0.4 + phase * 1.8 * physicsMul,
      },
      {
        id: "m2",
        label: "BEARING TEMP",
        unit: "°C",
        baseline: 62.0,
        impactFn: (phase, physicsMul, t) => 62 + phase * 38 * physicsMul + Math.sin(t / 9) * 1.2,
      },
      {
        id: "m3",
        label: "FEEDER PRESS",
        unit: "bar",
        baseline: 8.2,
        impactFn: (phase, physicsMul, t) =>
          8.2 - phase * 0.9 * physicsMul + Math.sin(t / 15) * 0.05,
      },
    ],
  },
  water: {
    metrics: [
      {
        id: "m1",
        label: "CHLORINE RESIDUAL",
        unit: "ppm",
        baseline: 1.2,
        impactFn: (phase, physicsMul, t) => 1.2 + phase * 7.2 * physicsMul + Math.sin(t / 25) * 0.1,
      },
      {
        id: "m2",
        label: "MAINS FLOW RATE",
        unit: "ML/D",
        baseline: 412,
        impactFn: (phase, physicsMul, t) => 412 + Math.sin(t / 30) * 8 + phase * 45 * physicsMul,
      },
      {
        id: "m3",
        label: "TANK-Δ RESERVOIR",
        unit: "%",
        baseline: 88,
        impactFn: (phase, physicsMul, t) => 88 - phase * 32 * physicsMul + Math.sin(t / 20) * 1.5,
      },
    ],
  },
  "oil-gas": {
    metrics: [
      {
        id: "m1",
        label: "DISCHARGE PRESS",
        unit: "psi",
        baseline: 980,
        impactFn: (phase, physicsMul, t) => 980 + phase * 70 * physicsMul + Math.sin(t / 35) * 4,
      },
      {
        id: "m2",
        label: "TOWER T-A TEMP",
        unit: "°C",
        baseline: 185,
        impactFn: (phase, physicsMul, t) => 185 + phase * 42 * physicsMul + Math.sin(t / 12) * 2,
      },
      {
        id: "m3",
        label: "FLARE HEADER FLOW",
        unit: "t/h",
        baseline: 0.4,
        impactFn: (phase, physicsMul, t) => 0.4 + phase * 3.8 * physicsMul + Math.sin(t / 18) * 0.1,
      },
    ],
  },
  manufacturing: {
    metrics: [
      {
        id: "m1",
        label: "STATION CYCLE TIME",
        unit: "s",
        baseline: 2.8,
        impactFn: (phase, physicsMul, t) => 2.8 + phase * 1.6 * physicsMul + Math.sin(t / 15) * 0.2,
      },
      {
        id: "m2",
        label: "FASTENER TORQUE",
        unit: "Nm",
        baseline: 48.0,
        impactFn: (phase, physicsMul, t) =>
          48.0 - phase * 8.4 * physicsMul + Math.sin(t / 10) * 0.5,
      },
      {
        id: "m3",
        label: "DEFECT REJECT RATE",
        unit: "%",
        baseline: 0.6,
        impactFn: (phase, physicsMul, t) => 0.6 + phase * 8.8 * physicsMul + Math.sin(t / 22) * 0.2,
      },
    ],
  },
  port: {
    metrics: [
      {
        id: "m1",
        label: "STS CRANE SPEED",
        unit: "m/s",
        baseline: 4.2,
        impactFn: (phase, physicsMul, t) => 4.2 - phase * 1.8 * physicsMul + Math.sin(t / 20) * 0.1,
      },
      {
        id: "m2",
        label: "AGV YARD QUEUE",
        unit: "TEU",
        baseline: 142,
        impactFn: (phase, physicsMul, t) => 142 + phase * 198 * physicsMul + Math.sin(t / 30) * 5,
      },
      {
        id: "m3",
        label: "GATE-16 DELAY",
        unit: "min",
        baseline: 4.5,
        impactFn: (phase, physicsMul, t) =>
          4.5 + phase * 38.0 * physicsMul + Math.sin(t / 16) * 1.2,
      },
    ],
  },
  "smart-building": {
    metrics: [
      {
        id: "m1",
        label: "HVAC CHILLER LOAD",
        unit: "kW",
        baseline: 340,
        impactFn: (phase, physicsMul, t) => 340 + phase * 160 * physicsMul + Math.sin(t / 25) * 10,
      },
      {
        id: "m2",
        label: "CARD READER UNLOCKS",
        unit: "events/m",
        baseline: 12,
        impactFn: (phase, physicsMul, t) => 12 + phase * 84 * physicsMul + Math.sin(t / 14) * 2,
      },
      {
        id: "m3",
        label: "SERVER ROOM TEMP",
        unit: "°C",
        baseline: 19.5,
        impactFn: (phase, physicsMul, t) =>
          19.5 + phase * 14.5 * physicsMul + Math.sin(t / 18) * 0.4,
      },
    ],
  },
  "smart-city": {
    metrics: [
      {
        id: "m1",
        label: "TRAFFIC SIGNAL PHASE",
        unit: "s",
        baseline: 45,
        impactFn: (phase, physicsMul, t) => 45 + phase * 75 * physicsMul + Math.sin(t / 20) * 3,
      },
      {
        id: "m2",
        label: "EMS DISPATCH QUEUE",
        unit: "calls",
        baseline: 3,
        impactFn: (phase, physicsMul, t) => 3 + phase * 42 * physicsMul + Math.sin(t / 15) * 1,
      },
      {
        id: "m3",
        label: "GRID FREQUENCY",
        unit: "Hz",
        baseline: 60.0,
        impactFn: (phase, physicsMul, t) =>
          60.0 - phase * 1.4 * physicsMul + Math.sin(t / 35) * 0.1,
      },
    ],
  },
};
