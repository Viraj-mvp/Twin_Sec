import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db/db";
import { trainingRuns, auditLogs } from "../db/schema";
import { eq } from "drizzle-orm";

const ExportSIEMInput = z.object({
  trainingRunId: z.string(),
  format: z.enum(["CEF", "SYSLOG", "JSON"]).default("CEF"),
});

export const exportSIEMLog = createServerFn({ method: "POST" })
  .validator(ExportSIEMInput)
  .handler(async ({ data }) => {
    const run = await db.query.trainingRuns.findFirst({
      where: eq(trainingRuns.id, data.trainingRunId),
    });

    if (!run) {
      throw new Error(`Training run ${data.trainingRunId} not found.`);
    }

    const logs = await db.query.auditLogs.findMany({
      where: eq(auditLogs.trainingRunId, data.trainingRunId),
    });

    if (data.format === "JSON") {
      return {
        runId: run.id,
        sector: run.sector,
        adversary: run.adversary,
        score: run.score,
        logs: logs.map((l) => ({
          id: l.id,
          timestamp: l.timestamp,
          eventType: l.eventType,
          severity: l.severity,
          details: JSON.parse(l.details || "{}"),
        })),
      };
    }

    // CEF Lines mapping
    const cefLines = logs.map((l, index) => {
      const severityNum = l.severity === "error" ? 8 : l.severity === "warn" ? 4 : 2;
      const details = l.details.replace(/\|/g, "\\|");
      return `CEF:0|TwinSec|CyberRange|3.1|${index + 1000}|${l.eventType}|${severityNum}|rt=${l.timestamp} src=203.0.113.10 dst=203.0.113.50 suser=OPERATOR msg=${details}`;
    });

    if (data.format === "SYSLOG") {
      const syslogLines = logs.map(
        (l) => `<14>1 ${l.timestamp} twinsec-range CyberRange 1234 ${l.eventType} - ${l.details}`,
      );
      return { text: syslogLines.join("\n") };
    }

    return { text: cefLines.join("\n") };
  });

const ExportDebriefPDFInput = z.object({
  trainingRunId: z.string(),
});

export const exportDebriefPDF = createServerFn({ method: "POST" })
  .validator(ExportDebriefPDFInput)
  .handler(async ({ data }) => {
    const run = await db.query.trainingRuns.findFirst({
      where: eq(trainingRuns.id, data.trainingRunId),
    });

    if (!run) {
      throw new Error("Run not found.");
    }

    const logs = await db.query.auditLogs.findMany({
      where: eq(auditLogs.trainingRunId, data.trainingRunId),
    });

    return {
      metadata: {
        runId: run.id,
        sector: run.sector.toUpperCase(),
        adversary: run.adversary,
        branch: run.branch,
        mwShed: run.mwShed,
        mttd: run.mttd,
        mttr: run.mttr,
        score: run.score,
        completedAt: run.completedAt || run.createdAt,
        auditLogCount: logs.length,
      },
      redTeamReport: {
        threatActor: run.adversary,
        initialAccessVector:
          "Spearphishing Attachment on IT Engineering Workstation (Purdue Ring 0)",
        lateralMovementPath: ["ews-04", "hist-01", "hmi-01", "plc-1", "brk-01"],
        tacticsUsed: [
          "T0865: Spearphishing Attachment",
          "T0859: Valid Account Reuse",
          "T0855: Unauthorized Command Write",
        ],
        breachOutcome: run.mwShed > 0 ? "PARTIAL OUTAGE DETONATED" : "CONTAINED AT PURDUE RING 3",
      },
      blueTeamReport: {
        mttdSeconds: run.mttd,
        mttrSeconds: run.mttr,
        loadShedMW: run.mwShed,
        containmentEfficiencyPercent: Math.max(0, 100 - run.mwShed * 2),
        defensiveInterventionsApplied: logs.filter(
          (l) => l.eventType.includes("DEFENSE") || l.eventType.includes("MITIGATION"),
        ).length,
        recommendations: [
          "Enforce industrial DMZ micro-segmentation between L3.5 IT and L2 OT subnets.",
          "Deploy physical hardware keylocks and dual-custody authorization on critical PLCs.",
          "Automate Modbus/TCP & S7 protocol anomaly detection on substation gateways.",
        ],
      },
      causalTimeline: logs.map((l) => ({
        timestamp: l.timestamp,
        event: l.eventType,
        severity: l.severity,
        details: l.details,
      })),
    };
  });
