/**
 * adversary-fallback-tree.ts
 *
 * Deterministic fallback decision tree for TwinSec Cyber Range.
 * Provides instant (<10ms) plausible adversary moves and defender options
 * when AI cloud API calls time out (>3s), hit rate limits, or operate offline.
 */

export interface FallbackAdversaryMove {
  action: "lateral_move" | "exfiltrate" | "persist" | "escalate" | "detonate" | "withdraw";
  targetNodeId: string;
  reasoning: string;
  detectionRisk: "low" | "medium" | "high";
  confidenceLevel: number;
}

export interface FallbackDefenderOption {
  id: string;
  label: string;
  actionType: "ISOLATE" | "PATCH" | "TRIP";
  targetNodeId: string;
  consequencePreview: string;
}

export function getFallbackAdversaryMove(
  sector: string,
  phase: string,
  compromisedCount: number,
): FallbackAdversaryMove {
  if (phase === "RECON") {
    return {
      action: "lateral_move",
      targetNodeId: "hist-01",
      reasoning:
        "Scanning primary plant historian database to map downstream Purdue Ring 2 SCADA HMI consoles.",
      detectionRisk: "low",
      confidenceLevel: 0.92,
    };
  }

  if (phase === "EXPLOIT") {
    if (compromisedCount <= 1) {
      return {
        action: "escalate",
        targetNodeId: "hmi-01",
        reasoning:
          "Replaying hijacked administrative credentials to compromise primary SCADA HMI console.",
        detectionRisk: "medium",
        confidenceLevel: 0.88,
      };
    }
    return {
      action: "detonate",
      targetNodeId: "plc-1",
      reasoning:
        "Injecting unauthorized setpoint write command to force turbine governor overspeed.",
      detectionRisk: "high",
      confidenceLevel: 0.95,
    };
  }

  // DEFEND / REVIEW
  return {
    action: "detonate",
    targetNodeId: "brk-01",
    reasoning:
      "Bypassing safety interlocks to force main breaker trip and cause cascading regional outage.",
    detectionRisk: "high",
    confidenceLevel: 0.98,
  };
}

export function getFallbackDefenderOptions(
  sector: string,
  phase: string,
  targetNodeId: string = "plc-1",
): FallbackDefenderOption[] {
  return [
    {
      id: "opt_isolate",
      label: "AIRGAP & ISOLATE SUBNET",
      actionType: "ISOLATE",
      targetNodeId,
      consequencePreview:
        "Blocks remote C2 traffic instantly, preserving physical turbine envelope.",
    },
    {
      id: "opt_patch",
      label: "DEPLOY INTEGRITY FIRMWARE PATCH",
      actionType: "PATCH",
      targetNodeId,
      consequencePreview:
        "Restores validated logic firmware with minor 2-minute telemetry interruption.",
    },
    {
      id: "opt_trip",
      label: "FAILSAFE MANUAL BREAKER TRIP",
      actionType: "TRIP",
      targetNodeId: "brk-01",
      consequencePreview:
        "Sheds 14 MW load immediately to prevent permanent physical turbine damage.",
    },
  ];
}
