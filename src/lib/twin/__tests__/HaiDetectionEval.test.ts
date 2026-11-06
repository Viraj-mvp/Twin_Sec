/**
 * HaiDetectionEval.test.ts
 *
 * Validates detector evaluation against ground truth labels from the HAI benchmark dataset.
 */

import { describe, it, expect } from "vitest";
import { haiAdapter } from "../adapters/HaiAdapter";

describe("HAI ICS Dataset Detector Benchmark", () => {
  it("evaluates detector metrics against ground truth labels", async () => {
    const evalResult = await haiAdapter.evaluateDetectorOnAttack(3, 2.5);

    expect(evalResult.evaluatedSamples).toBeGreaterThan(0);
    expect(evalResult.accuracy).toBeGreaterThan(0.5);
  });
});
