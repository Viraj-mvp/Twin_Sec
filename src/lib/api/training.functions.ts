import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db/db";
import { trainingRuns, leaderboardEntries, operators } from "../db/schema";
import { eq, or, isNull, avg, max, count, desc } from "drizzle-orm";
import { getAuthOperatorId, seedBenchmarkDrills } from "../server-helpers.server";

export interface TrainingRun {
  id: string;
  timestamp: string;
  createdAt?: string;
  sector: string;
  adversary: string;
  branch: string;
  mwShed: number;
  score: number;
  shareUrl: string;
  mttd?: string;
  mttr?: string;
  cost?: string;
  isolatedNodes?: string[];
  attackType?: string;
  adversaryProfile?: string;
  attackChain?: string;
}

const SaveRunInput = z.object({
  sector: z.string(),
  adversary: z.string(),
  branch: z.string(),
  mwShed: z.number(),
  mttd: z.number().optional().default(30),
  mttr: z.number().optional().default(120),
  cost: z.number().optional().default(100),
  score: z.number().optional().default(90),
  shareUrl: z.string(),
  isolatedNodes: z.array(z.string()).optional(),
  attackType: z.enum(["disruption", "espionage"]).optional().default("disruption"),
  adversaryProfile: z
    .enum(["nation-state", "activist", "script-kiddie"])
    .optional()
    .default("nation-state"),
  attackChain: z.string().optional().default("full-spectrum"),
  espionageObjective: z
    .enum(["data-exfiltration", "persistence", "lateral-movement", "full-spectrum"])
    .optional(),
  exfiltrationTarget: z.string().optional(),
  persistenceMethod: z.string().optional(),
  attemptCount: z.number().optional().default(0),
  decisionHistory: z
    .array(
      z.object({
        timestamp: z.string(),
        phase: z.enum(["RECON", "EXPLOIT", "DEFEND", "REVIEW"]),
        decision: z.enum(["ACT", "DEFER", "DO_NOTHING"]),
        consequence: z.string(),
      }),
    )
    .optional(),
  terminalCommands: z
    .array(
      z.object({
        timestamp: z.string(),
        command: z.string(),
        output: z.string(),
        success: z.boolean(),
      }),
    )
    .optional(),
  hintLevel: z.number().optional().default(0),
  exfiltratedData: z.record(z.string(), z.any()).optional(),
  persistenceEstablished: z.boolean().optional().default(false),
  simulationState: z.record(z.string(), z.any()).optional(),
});

export const saveTrainingRun = createServerFn({ method: "POST" })
  .validator(SaveRunInput)
  .handler(async ({ data }) => {
    // Authenticated operator required to persist run in SQLite cloud database
    const operatorId = await getAuthOperatorId();
    if (!operatorId) {
      throw new Error(
        "Unauthorized: Guest training runs must be persisted locally in client guest-store.",
      );
    }
    const runId = `TR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    await db.insert(trainingRuns).values({
      id: runId,
      operatorId,
      sector: data.sector,
      adversary: data.adversary,
      branch: data.branch,
      mwShed: data.mwShed,
      mttd: data.mttd,
      mttr: data.mttr,
      cost: data.cost,
      score: data.score,
      shareUrl: data.shareUrl,
      isolatedNodes: data.isolatedNodes ? JSON.stringify(data.isolatedNodes) : null,
      attackType: data.attackType,
      adversaryProfile: data.adversaryProfile,
      attackChain: data.attackChain,
      espionageObjective: data.espionageObjective,
      exfiltrationTarget: data.exfiltrationTarget,
      persistenceMethod: data.persistenceMethod,
      attemptCount: data.attemptCount,
      decisionHistory: data.decisionHistory ? JSON.stringify(data.decisionHistory) : null,
      terminalCommands: data.terminalCommands ? JSON.stringify(data.terminalCommands) : null,
      hintLevel: data.hintLevel,
      exfiltratedData: data.exfiltratedData ? JSON.stringify(data.exfiltratedData) : null,
      persistenceEstablished: data.persistenceEstablished,
      simulationState: data.simulationState ? JSON.stringify(data.simulationState) : null,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    return { success: true, id: runId };
  });

const SyncGuestRunsInput = z.object({
  runs: z.array(
    z.object({
      id: z.string(),
      sector: z.string(),
      adversary: z.string(),
      branch: z.string(),
      mwShed: z.number(),
      mttd: z.string().or(z.number()).optional(),
      mttr: z.string().or(z.number()).optional(),
      cost: z.string().or(z.number()).optional(),
      score: z.number(),
      shareUrl: z.string().optional(),
      isolatedNodes: z.array(z.string()).optional(),
      attackType: z.string().optional(),
      adversaryProfile: z.string().optional(),
      attackChain: z.string().optional(),
      timestamp: z.string().optional(),
      createdAt: z.string().optional(),
    }),
  ),
});

export const syncGuestTrainingRuns = createServerFn({ method: "POST" })
  .validator(SyncGuestRunsInput)
  .handler(async ({ data }) => {
    const operatorId = await getAuthOperatorId();
    if (!operatorId) {
      throw new Error(
        "Unauthorized: Cannot sync guest runs without an authenticated operator session.",
      );
    }

    let syncedCount = 0;
    await db.transaction(async (tx) => {
      for (const r of data.runs) {
        const existing = await tx.query.trainingRuns.findFirst({
          where: eq(trainingRuns.id, r.id),
        });

        const mttdNum =
          typeof r.mttd === "string"
            ? parseInt(r.mttd.replace(/[^0-9]/g, ""), 10) || 30
            : r.mttd || 30;
        const mttrNum =
          typeof r.mttr === "string"
            ? parseInt(r.mttr.replace(/[^0-9]/g, ""), 10) || 120
            : r.mttr || 120;
        const costNum =
          typeof r.cost === "string"
            ? parseInt(r.cost.replace(/[^0-9]/g, ""), 10) || 100
            : r.cost || 100;
        const runTimestamp = r.createdAt || r.timestamp || new Date().toISOString();

        if (!existing) {
          await tx.insert(trainingRuns).values({
            id: r.id,
            operatorId,
            sector: r.sector,
            adversary: r.adversary,
            branch: r.branch,
            mwShed: r.mwShed,
            mttd: mttdNum,
            mttr: mttrNum,
            cost: costNum,
            score: r.score,
            shareUrl: r.shareUrl || `/simulation?sector=${r.sector}`,
            isolatedNodes: r.isolatedNodes ? JSON.stringify(r.isolatedNodes) : null,
            attackType: r.attackType || "disruption",
            adversaryProfile: r.adversaryProfile || "nation-state",
            attackChain: r.attackChain || "full-spectrum",
            completedAt: runTimestamp,
            createdAt: runTimestamp,
          });
          syncedCount++;
        } else if (!existing.operatorId) {
          await tx.update(trainingRuns).set({ operatorId }).where(eq(trainingRuns.id, r.id));
          syncedCount++;
        }
      }
    });

    return { success: true, syncedCount };
  });

export const getTrainingRuns = createServerFn({ method: "GET" }).handler(async () => {
  const operatorId = await getAuthOperatorId();

  // Query operator-specific runs, or global benchmark runs if unauthenticated
  const condition = operatorId
    ? or(eq(trainingRuns.operatorId, operatorId), isNull(trainingRuns.operatorId))
    : isNull(trainingRuns.operatorId);

  let runs = await db
    .select()
    .from(trainingRuns)
    .where(condition)
    .orderBy(desc(trainingRuns.createdAt))
    .limit(100);

  // If database is empty, auto-seed the 18 authentic benchmark qualification drills
  if (runs.length === 0) {
    await seedBenchmarkDrills(operatorId);
    runs = await db
      .select()
      .from(trainingRuns)
      .where(condition)
      .orderBy(desc(trainingRuns.createdAt))
      .limit(100);
  }

  return runs.map((r) => ({
    id: r.id,
    timestamp: r.createdAt,
    createdAt: r.createdAt,
    sector: r.sector,
    adversary: r.adversary,
    branch: r.branch,
    mwShed: r.mwShed,
    mttd: r.mttd ? (r.mttd >= 60 ? `${(r.mttd / 60).toFixed(1)}m` : `${r.mttd}s`) : "30s",
    mttr: r.mttr
      ? r.mttr >= 3600
        ? `${(r.mttr / 3600).toFixed(1)}h`
        : `${Math.round(r.mttr / 60)}m`
      : "120s",
    cost: r.cost
      ? r.cost >= 1_000_000
        ? `$${(r.cost / 1_000_000).toFixed(1)}M`
        : `$${Math.round(r.cost / 1000)}k`
      : "$100k",
    score: r.score,
    shareUrl: r.shareUrl || `/simulation?sector=${r.sector}`,
    isolatedNodes: (() => {
      if (!r.isolatedNodes) return [];
      try {
        const parsed = JSON.parse(r.isolatedNodes);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })(),
    attackType: r.attackType || "disruption",
    adversaryProfile: r.adversaryProfile || "nation-state",
    attackChain: r.attackChain || "full-spectrum",
  }));
});

export const getTrainingStats = createServerFn({ method: "GET" }).handler(async () => {
  const operatorId = await getAuthOperatorId();

  const condition = operatorId
    ? or(eq(trainingRuns.operatorId, operatorId), isNull(trainingRuns.operatorId))
    : isNull(trainingRuns.operatorId);

  // Run aggregations
  const result = await db
    .select({
      count: count(),
      avgScore: avg(trainingRuns.score),
      avgMw: avg(trainingRuns.mwShed),
      maxScore: max(trainingRuns.score),
    })
    .from(trainingRuns)
    .where(condition);

  const stats = result[0];

  if (!stats || stats.count === 0) {
    await seedBenchmarkDrills(operatorId);
    const reResult = await db
      .select({
        count: count(),
        avgScore: avg(trainingRuns.score),
        avgMw: avg(trainingRuns.mwShed),
        maxScore: max(trainingRuns.score),
      })
      .from(trainingRuns)
      .where(condition);
    const reStats = reResult[0];
    return {
      totalRuns: reStats?.count || 18,
      avgScore: reStats?.avgScore ? Math.round(Number(reStats.avgScore)) : 92,
      avgMwsShed: reStats?.avgMw ? Number(reStats.avgMw).toFixed(1) : "1460.0",
      bestScore: reStats?.maxScore ? Number(reStats.maxScore) : 98,
    };
  }

  return {
    totalRuns: stats.count || 0,
    avgScore: stats.avgScore ? Math.round(Number(stats.avgScore)) : 92,
    avgMwsShed: stats.avgMw ? Number(stats.avgMw).toFixed(1) : "0.0",
    bestScore: stats.maxScore ? Number(stats.maxScore) : 0,
  };
});

// Reseed benchmark drills manually
export const reseedBenchmarkDrills = createServerFn({ method: "POST" }).handler(async () => {
  const operatorId = await getAuthOperatorId();
  await seedBenchmarkDrills(operatorId);
  return { success: true, count: 18 };
});

// Generate replay link
export const generateReplayLink = createServerFn({ method: "POST" })
  .validator(
    z.object({
      simulationState: z.record(z.string(), z.any()),
      sector: z.enum([
        "power",
        "water",
        "oil-gas",
        "manufacturing",
        "port",
        "smart-building",
        "smart-city",
      ]),
    }),
  )
  .handler(async ({ data }) => {
    const operatorId = await getAuthOperatorId();
    const stateString = JSON.stringify(data.simulationState);
    if (stateString.length > 50000) {
      throw new Error("Payload size exceeds permitted simulation state limits.");
    }
    const encodedState = Buffer.from(encodeURIComponent(stateString)).toString("base64url");
    const shareUrl = `/simulation?sector=${data.sector}#s=${encodedState}`;
    return { shareUrl, operatorId };
  });

const SubmitLeaderboardInput = z.object({
  trainingRunId: z.string(),
  sector: z.string(),
  score: z.number().min(0).max(100),
  mwShed: z.number(),
  mttd: z.number().optional().default(30),
  mttr: z.number().optional().default(120),
  adversary: z.string(),
});

export const submitToLeaderboard = createServerFn({ method: "POST" })
  .validator(SubmitLeaderboardInput)
  .handler(async ({ data }) => {
    const operatorId = await getAuthOperatorId();
    if (!operatorId) {
      throw new Error("Unauthorized. Please log in to submit to the public leaderboard.");
    }

    const op = await db.query.operators.findFirst({
      where: (fields, { eq }) => eq(fields.id, operatorId),
    });

    const callsign = op?.callsign || "OPERATOR";
    const entryId = `LB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    await db.insert(leaderboardEntries).values({
      id: entryId,
      operatorId,
      callsign,
      trainingRunId: data.trainingRunId,
      sector: data.sector,
      adversary: data.adversary,
      score: data.score,
      mwShed: data.mwShed,
      mttd: data.mttd,
      mttr: data.mttr,
      verified: true,
      createdAt: new Date().toISOString(),
    });

    return { success: true, id: entryId, rankCallsign: callsign };
  });

export const getLeaderboardEntries = createServerFn({ method: "GET" })
  .validator(z.object({ sector: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const sector = data?.sector && data.sector !== "ALL" ? data.sector : undefined;

    const entries = await db.query.leaderboardEntries.findMany({
      where: sector ? (fields, { eq }) => eq(fields.sector, sector) : undefined,
      orderBy: (fields, { desc }) => [desc(fields.score), desc(fields.createdAt)],
      limit: 50,
    });

    return entries.map((e) => ({
      id: e.id,
      callsign: e.callsign,
      sector: e.sector,
      adversary: e.adversary,
      score: e.score,
      mwShed: e.mwShed,
      mttd: e.mttd.toString() + "s",
      mttr: e.mttr.toString() + "s",
      verified: e.verified,
      createdAt: e.createdAt,
    }));
  });
