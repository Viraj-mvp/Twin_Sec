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

    // Correlate the highest scoring anomaly row
    const worstRow = windowRes.rows.find((r) => r.label === 1) || windowRes.rows[0];
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
