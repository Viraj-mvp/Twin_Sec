/**
 * simulation.functions.ts
 *
 * TanStack Start server functions for TwinSec cyber-physical simulation runtime.
 * Provides server-authoritative state progression, operator response commands,
 * adversary attack execution, and deterministic experiment management.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { TwinRuntime } from "../twin/TwinRuntime";
import { experimentStore } from "../twin/experiment/ExperimentStore";
import { globalEventStore } from "../simulation/event-store";
import { getAuthOperatorId } from "../server-helpers.server";
import { checkRateLimit, getClientIp } from "../rate-limit.server";
import type { TwinState } from "../twin/TwinState";
import type { AttackActionPayload } from "../twin/attacks/AttackEngine";

// In-memory active runtime store (keyed by simulation ID or default singleton for active session)
declare global {
  var __twinsec_active_runtime: TwinRuntime | undefined;
}

function getActiveRuntime(scenarioId: string = "water", seed: number = 1337): TwinRuntime {
  if (!globalThis.__twinsec_active_runtime) {
    globalThis.__twinsec_active_runtime = new TwinRuntime({ scenarioId, seed });
  }
  return globalThis.__twinsec_active_runtime;
}

// ── Validation Schemas ─────────────────────────────────────────────

const StartSimulationSchema = z.object({
  scenarioId: z.string().max(50).default("water"),
  seed: z.number().int().min(1).max(2147483647).default(1337),
});

const TickSimulationSchema = z.object({
  dt: z.number().min(0.01).max(60.0).default(1.0),
});

const ApplyCommandSchema = z.object({
  command: z.string().trim().min(1).max(512),
});

const ApplyAttackSchema = z.object({
  techniqueId: z.string().max(100),
  techniqueName: z.string().max(100).optional().default("Custom Adversary Payload"),
  sourceAssetId: z.string().max(100).optional().default("EWS-04"),
  targetAssetId: z.string().max(100).optional().default("PLC-3"),
  targetNodeId: z.string().max(100).optional(),
  payloadType: z.string().max(100).optional().default("command_override"),
  phase: z.string().max(100).optional().default("Impact"),
  parameters: z.record(z.string(), z.any()).optional(),
});

const GetEventsSchema = z.object({
  maxTime: z.number().nonnegative().optional(),
});

/**
 * Start or reset a cyber-physical simulation
 */
export const startTwinSimulationFn = createServerFn({ method: "POST" })
  .validator(StartSimulationSchema)
  .handler(async ({ data }): Promise<any> => {
    const ip = getClientIp();
    const rl = checkRateLimit(`sim_start_${ip}`, { limit: 30, windowMs: 60_000 });
    if (rl.limited) {
      throw new Error(
        `Simulation reset rate limit exceeded. Reset in ${Math.ceil(rl.reset / 1000)}s.`,
      );
    }

    const seed = data.seed ?? 1337;
    const scenarioId = data.scenarioId ?? "water";
    globalThis.__twinsec_active_runtime = new TwinRuntime({ scenarioId, seed });
    const runtime = globalThis.__twinsec_active_runtime;

    await experimentStore.createExperiment({
      id: runtime.experimentId,
      scenarioId,
      seed,
    });

    return runtime.getState();
  });

/**
 * Advance simulation time by dt seconds
 */
export const tickTwinSimulationFn = createServerFn({ method: "POST" })
  .validator(TickSimulationSchema)
  .handler(async ({ data }): Promise<any> => {
    const runtime = getActiveRuntime();
    const dt = data.dt ?? 1.0;
    return runtime.tick(dt);
  });

/**
 * Execute operator command (terminal or UI intervention)
 */
export const applyTwinCommandFn = createServerFn({ method: "POST" })
  .validator(ApplyCommandSchema)
  .handler(async ({ data }): Promise<any> => {
    const ip = getClientIp();
    const rl = checkRateLimit(`sim_cmd_${ip}`, { limit: 120, windowMs: 60_000 });
    if (rl.limited) {
      throw new Error(
        `Terminal command rate limit exceeded. Reset in ${Math.ceil(rl.reset / 1000)}s.`,
      );
    }

    const runtime = getActiveRuntime();
    const result = runtime.applyCommand(data.command);
    return {
      result,
      state: runtime.getState(),
    };
  });

/**
 * Execute adversary attack action
 */
export const applyTwinAttackFn = createServerFn({ method: "POST" })
  .validator(ApplyAttackSchema)
  .handler(async ({ data }): Promise<any> => {
    const ip = getClientIp();
    const rl = checkRateLimit(`sim_atk_${ip}`, { limit: 60, windowMs: 60_000 });
    if (rl.limited) {
      throw new Error(
        `Attack action rate limit exceeded. Reset in ${Math.ceil(rl.reset / 1000)}s.`,
      );
    }

    const runtime = getActiveRuntime();
    const result = runtime.applyAttack(data as unknown as AttackActionPayload);
    return {
      result,
      state: runtime.getState(),
    };
  });

/**
 * Get current authoritative TwinState snapshot
 */
export const getTwinStateFn = createServerFn({ method: "GET" }).handler(async (): Promise<any> => {
  const runtime = getActiveRuntime();
  return runtime.getState();
});

/**
 * Get chronological simulation event trace
 */
export const getTwinEventsFn = createServerFn({ method: "GET" })
  .validator(GetEventsSchema)
  .handler(async ({ data }): Promise<any> => {
    return globalEventStore.getEvents(data?.maxTime);
  });

/**
 * Save current state checkpoint snapshot
 */
export const saveTwinSnapshotFn = createServerFn({ method: "POST" }).handler(async () => {
  const operatorId = await getAuthOperatorId();
  const runtime = getActiveRuntime();
  const state = runtime.getState();
  await experimentStore.saveSnapshot(runtime.experimentId, state.time, state);
  return { success: true, time: state.time, operatorId };
});
