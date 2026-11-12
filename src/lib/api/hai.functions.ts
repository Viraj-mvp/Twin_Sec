/**
 * hai.functions.ts
 *
 * TanStack Start server functions for HAI ICS continuous telemetry dataset,
 * attack window retrieval, and ground-truth detection evaluation.
 */

import { createServerFn } from "@tanstack/react-start";
import { haiDataParser } from "../data/hai/hai-parser.server";
import { evaluateTelemetrySeries, classifyHaiRow } from "../engines/detection-engine";
import { correlationEngine } from "../engines/correlation-engine";
import type { HaiDatasetStats, HaiWindowQuery, HaiEvaluationResult } from "../data/hai/types";

export const getHaiDatasetOverviewFn = createServerFn({ method: "GET" }).handler(async () => {
  return haiDataParser.getStats();
});

export const getHaiAttackPeriodsFn = createServerFn({ method: "GET" }).handler(async () => {
  return haiDataParser.getAttackPeriods();
});

export const getHaiTelemetryWindowFn = createServerFn({ method: "GET" })
  .validator((query: HaiWindowQuery) => query)
  .handler(async ({ data }) => {
    return haiDataParser.getTelemetryWindow(data);
  });

export const evaluateHaiAttackWindowFn = createServerFn({ method: "POST" })
  .validator((payload: { attackIndex?: number; threshold?: number; limit?: number }) => payload)
  .handler(async ({ data }) => {
    const windowRes = await haiDataParser.getTelemetryWindow({
      attackIndex: data.attackIndex || 1,
      limit: data.limit || 800,
    });

    const threshold = data.threshold ?? 2.5;
    const evaluation = evaluateTelemetrySeries(windowRes.rows, threshold);

    // Correlate the highest scoring anomaly row (guard empty telemetry windows)
    const fallbackRow = {
      timestamp: windowRes.queryStartTime || new Date().toISOString(),
      label: 0,
      p1_pressure: 0,
      p1_temperature: 0,
      p1_flow: 0,
      p1_level: 0,
      p2_speed: 0,
      p2_vibration: 0,
      p3_flow: 0,
      p3_level: 0,
      p4_steam_pressure: 0,
      p4_steam_temperature: 0,
    };
    const worstRow = windowRes.rows.find((r) => r.label === 1) ?? windowRes.rows[0] ?? fallbackRow;
    const inference = classifyHaiRow(worstRow, threshold);
    const advisory = correlationEngine.correlate(inference, "manufacturing");

    return {
      attackPeriod: windowRes.attackPeriod,
      queryStartTime: windowRes.queryStartTime,
      queryEndTime: windowRes.queryEndTime,
      totalSamples: windowRes.rows.length,
      evaluation,
      advisory,
      sampleTelemetry: windowRes.rows.slice(0, 150), // Window for visual charts
    };
  });
