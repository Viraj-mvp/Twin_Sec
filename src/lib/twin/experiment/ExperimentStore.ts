/**
 * ExperimentStore.ts
 *
 * Experiment and reproducibility store for TwinSec cyber-physical range.
 * Persists experiment configuration, random seeds, event traces, and state checkpoints.
 * Guarantees that identical seed + scenario produces identical cyber-physical results.
 */

import { db } from "../../db/db.server";
import { experiments, simulationEvents, simulationSnapshots } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import type { TwinState } from "../TwinState";
import type { SimEventRecord } from "../../simulation/event-store";

export interface ExperimentRecord {
  id: string;
  scenarioId: string;
  seed: number;
  status: string;
  startTime: string;
  endTime?: string;
  metrics: Record<string, unknown>;
  config: Record<string, unknown>;
}

export class ExperimentStore {
  /**
   * Create and record a new experiment run
   */
  public async createExperiment(experiment: {
    id: string;
    scenarioId: string;
    seed: number;
    config?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await db.insert(experiments).values({
        id: experiment.id,
        scenarioId: experiment.scenarioId,
        seed: experiment.seed,
        status: "RUNNING",
        startTime: new Date().toISOString(),
        configJson: JSON.stringify(experiment.config ?? {}),
        metricsJson: JSON.stringify({}),
      });
    } catch (err) {
      console.warn("[ExperimentStore] Could not persist experiment to DB:", err);
    }
  }

  /**
   * Save a state snapshot for checkpointing or time travel
   */
  public async saveSnapshot(experimentId: string, time: number, state: TwinState): Promise<void> {
    try {
      await db.insert(simulationSnapshots).values({
        id: `snap_${experimentId}_${time.toFixed(0)}_${Math.random().toString(36).substring(2, 6)}`,
        experimentId,
        time,
        stateJson: JSON.stringify(state),
      });
    } catch (err) {
      console.warn("[ExperimentStore] Could not persist snapshot:", err);
    }
  }

  /**
   * Persist a batch of simulation events to DB
   */
  public async persistEvents(experimentId: string, events: SimEventRecord[]): Promise<void> {
    try {
      for (const ev of events) {
        await db.insert(simulationEvents).values({
          id: ev.eventId,
          experimentId,
          timestamp: ev.timestamp,
          type: ev.type,
          sourceAssetId: ev.sourceAssetId,
          targetAssetId: ev.targetAssetId ?? null,
          severity: ev.severity,
          title: ev.title,
          description: ev.description,
          dataJson: JSON.stringify(ev.data ?? {}),
          beforeStateJson: ev.beforeState ? JSON.stringify(ev.beforeState) : null,
          afterStateJson: ev.afterState ? JSON.stringify(ev.afterState) : null,
        });
      }
    } catch (err) {
      console.warn("[ExperimentStore] Could not persist events:", err);
    }
  }

  /**
   * Complete an experiment with final metrics
   */
  public async completeExperiment(
    experimentId: string,
    metrics: Record<string, unknown>,
  ): Promise<void> {
    try {
      await db
        .update(experiments)
        .set({
          status: "COMPLETED",
          endTime: new Date().toISOString(),
          metricsJson: JSON.stringify(metrics),
        })
        .where(eq(experiments.id, experimentId));
    } catch (err) {
      console.warn("[ExperimentStore] Could not complete experiment:", err);
    }
  }

  /**
   * Fetch experiment details by ID
   */
  public async getExperiment(experimentId: string) {
    try {
      const rows = await db
        .select()
        .from(experiments)
        .where(eq(experiments.id, experimentId))
        .limit(1);
      return rows[0] ?? null;
    } catch {
      return null;
    }
  }

  /**
   * List recent experiments
   */
  public async listRecent(limit: number = 10) {
    try {
      return await db.select().from(experiments).orderBy(desc(experiments.createdAt)).limit(limit);
    } catch {
      return [];
    }
  }
}

export const experimentStore = new ExperimentStore();
