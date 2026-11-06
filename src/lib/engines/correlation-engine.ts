import type { NormalizedSecurityEvent } from "../data/normalized/security-event";
import { mitreParser } from "../data/mitre/mitre-stix-parser";
import { otcadParser } from "../data/otcad/otcad-parser";
import type { DetectionInference } from "./detection-engine";

export interface CorrelationAdvisory {
  incidentId: string;
  timestamp: string;
  threatLevel: "NOMINAL" | "SUSPICIOUS" | "ANOMALOUS" | "CRITICAL_ATTACK";
  summary: string;
  primaryTechnique?: {
    id: string;
    name: string;
    description: string;
    tactics: string[];
    mitigations: { name: string; description: string }[];
  };
  historicalPrecedents: {
    name: string;
    year: number;
    industry: string;
    consequence: string;
  }[];
  recommendedActions: string[];
  eventChain: NormalizedSecurityEvent[];
}

export class SecurityCorrelationEngine {
  /**
   * Correlate a live detection inference with MITRE ICS knowledge and OTCAD historical incidents
   */
  public correlate(
    inference: DetectionInference,
    sector: string = "manufacturing",
  ): CorrelationAdvisory {
    const incidentId = `INC-ICS-${Date.now().toString(36).toUpperCase()}`;
    const timestamp = inference.timestamp;
    const threatLevel = inference.threatLevel;

    // 1. Identify primary affected process and metric
    const topMetric = inference.topAnomalousMetrics[0];
    let candidateTechniqueId = "T0831"; // Default: Manipulation of Control
    let targetComponent = "Industrial PLC";

    if (topMetric) {
      if (topMetric.metric.includes("pressure") || topMetric.metric.includes("PIT")) {
        candidateTechniqueId = "T0831";
        targetComponent = "Boiler Steam Drum / Pressure Sensor (P1_PIT01)";
      } else if (
        topMetric.metric.includes("speed") ||
        topMetric.metric.includes("vibration") ||
        topMetric.metric.includes("SIT")
      ) {
        candidateTechniqueId = "T0814"; // Denial of Service / Frequency Drift
        targetComponent = "Turbine Rotor Speed Governor (P2_SIT01)";
      } else if (
        topMetric.metric.includes("flow") ||
        topMetric.metric.includes("FT") ||
        topMetric.metric.includes("FIT")
      ) {
        candidateTechniqueId = "T0855"; // Unauthorized Command Message
        targetComponent = "Flow Control Valve (P1_FCV01 / P3_FIT01)";
      } else if (topMetric.metric.includes("level") || topMetric.metric.includes("LIT")) {
        candidateTechniqueId = "T0887"; // Wireless Sniffing / Sensor Replay
        targetComponent = "Liquid Level Transmitter (P1_LIT01)";
      }
    }

    // 2. Fetch MITRE technique details from local STIX parser
    const tech = mitreParser.getTechnique(candidateTechniqueId);
    const mitreData = tech
      ? {
          id: tech.externalId,
          name: tech.name,
          description: tech.description.slice(0, 300) + "...",
          tactics: tech.tactics,
          mitigations: (tech.mitigations || []).slice(0, 3).map((m) => ({
            name: m.name,
            description: m.description.slice(0, 150) + "...",
          })),
        }
      : undefined;

    // 3. Search OTCAD historical parallels matching sector or attack type
    const queryTerm = sector === "water" ? "water" : sector === "power" ? "power" : "manufacturing";
    const otcadMatches = otcadParser.search({ industry: queryTerm, limit: 2 });
    const historicalPrecedents = otcadMatches.map((m) => ({
      name: m.name,
      year: m.year,
      industry: m.industry,
      consequence: m.consequence || "Operational disruption",
    }));

    // 4. Generate tactical incident recommendations
    const recommendedActions: string[] = [];
    if (threatLevel === "CRITICAL_ATTACK") {
      recommendedActions.push(
        `AIR-GAP SEVERANCE: Sever network trunk to ${targetComponent} immediately.`,
      );
      recommendedActions.push(
        `TRIP EMERGENCY RELIEF: Verify SIL-3 hardware interlocks have not been bypassed.`,
      );
      recommendedActions.push(
        `FORENSIC EXTRACTION: Capture PCAP and volatile RAM from Engineering Workstation.`,
      );
    } else if (threatLevel === "ANOMALOUS") {
      recommendedActions.push(
        `INSPECT REGISTERS: Verify Modbus/DNP3 setpoint integrity for ${targetComponent}.`,
      );
      recommendedActions.push(
        `CROSS-CHECK SECONDARY SENSORS: Confirm physical drift matches redundant transmitters.`,
      );
      recommendedActions.push(
        `FIREWALL AUDIT: Inspect remote VPN ingress logs for unauthorized control sessions.`,
      );
    } else {
      recommendedActions.push(`ROUTINE MONITORING: Maintain nominal telemetry logging.`);
    }

    // 5. Build Normalized Event
    const normalizedEvent: NormalizedSecurityEvent = {
      id: `EVT-${Date.now().toString(36).toUpperCase()}`,
      timestamp,
      source: "PHYSICS_DRIFT_DETECTOR",
      severity:
        threatLevel === "CRITICAL_ATTACK"
          ? "CRITICAL"
          : threatLevel === "ANOMALOUS"
            ? "HIGH"
            : threatLevel === "SUSPICIOUS"
              ? "MEDIUM"
              : "INFO",
      eventType: inference.isPredictedAnomaly
        ? "TELEMETRY_ANOMALY_DETECTED"
        : "NOMINAL_TELEMETRY_SAMPLE",
      sector,
      targetComponent,
      description: topMetric
        ? `Observed ${topMetric.label} at ${topMetric.value} (Expected: ${topMetric.expectedMean}, z-score: ${topMetric.zScore})`
        : "All telemetry parameters within statistical baseline.",
      telemetryPayload: topMetric
        ? {
            metric: topMetric.metric,
            value: topMetric.value,
            expectedBaseline: topMetric.expectedMean,
            zScore: topMetric.zScore,
            driftPercent: topMetric.deviationPercent,
            groundTruthLabel: inference.groundTruth,
          }
        : undefined,
      mitreCorrelation: mitreData
        ? {
            techniqueId: mitreData.id,
            techniqueName: mitreData.name,
            tactics: mitreData.tactics,
            platforms: tech?.platforms || ["ICS"],
            mitigations: mitreData.mitigations.map((m) => m.name),
          }
        : undefined,
      otcadParallel: historicalPrecedents[0]
        ? {
            incidentName: historicalPrecedents[0].name,
            year: historicalPrecedents[0].year,
            industry: historicalPrecedents[0].industry,
            consequence: historicalPrecedents[0].consequence,
          }
        : undefined,
      evaluationTag: inference.evaluationTag,
    };

    const summary = topMetric
      ? `Detected ${threatLevel} anomaly on ${targetComponent} with z-score ${topMetric.zScore}. Correlated with MITRE ATT&CK ${candidateTechniqueId} (${tech?.name || "ICS Attack"}).`
      : `Operational parameters nominal at ${timestamp}.`;

    return {
      incidentId,
      timestamp,
      threatLevel,
      summary,
      primaryTechnique: mitreData,
      historicalPrecedents,
      recommendedActions,
      eventChain: [normalizedEvent],
    };
  }

  /**
   * Correlate a simulation DetectionAlert directly
   */
  public correlateDetectionAlert(
    alert: {
      id: string;
      timestamp: number;
      targetAssetId: string;
      variableName: string;
      observedValue: number;
      zScore: number;
      severity: string;
      mitreTechniqueId?: string;
    },
    sector: string = "water",
  ): CorrelationAdvisory {
    const techId =
      alert.mitreTechniqueId || (alert.variableName.includes("chlorine") ? "T0831" : "T0855");
    const tech = mitreParser.getTechnique(techId);
    const otcadMatches = otcadParser.search({ industry: sector, limit: 2 });

    const threatLevel: CorrelationAdvisory["threatLevel"] =
      alert.severity === "CRITICAL"
        ? "CRITICAL_ATTACK"
        : alert.severity === "HIGH"
          ? "ANOMALOUS"
          : alert.severity === "MEDIUM"
            ? "SUSPICIOUS"
            : "NOMINAL";

    return {
      incidentId: `INC-${alert.id}`,
      timestamp: new Date().toISOString(),
      threatLevel,
      summary: `Process anomaly on ${alert.variableName} (z=${alert.zScore}): ${alert.observedValue} observed. Mapped to ${techId} (${tech?.name || "ICS Technique"}).`,
      primaryTechnique: tech
        ? {
            id: tech.externalId,
            name: tech.name,
            description: tech.description.slice(0, 300) + "...",
            tactics: tech.tactics,
            mitigations: (tech.mitigations || []).slice(0, 3).map((m) => ({
              name: m.name,
              description: m.description.slice(0, 150) + "...",
            })),
          }
        : undefined,
      historicalPrecedents: otcadMatches.map((m) => ({
        name: m.name,
        year: m.year,
        industry: m.industry,
        consequence: m.consequence || "Operational disruption",
      })),
      recommendedActions: [
        `Isolate ${alert.targetAssetId} from the Purdue control zone.`,
        `Inspect PLC register commands and compare against baseline.`,
        `Recalibrate sensor instruments to eliminate false offsets.`,
      ],
      eventChain: [],
    };
  }
}

export const correlationEngine = new SecurityCorrelationEngine();
