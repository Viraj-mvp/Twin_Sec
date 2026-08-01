import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db/db";
import { trainingRuns } from "../db/schema";
import { eq, avg, max, count } from "drizzle-orm";
import { getSessionCookie } from "../auth.server";

// Verify operator session on server
async function getAuthOperatorId() {
  const token = getSessionCookie();
  if (!token) return null;

  // Query the sessions table using fields lookup
  const s = await db.query.sessions.findFirst({
    where: (fields, { eq }) => eq(fields.token, token),
  });

  if (!s || new Date(s.expiresAt) < new Date()) {
    return null;
  }

  return s.operatorId;
}

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
}

const SaveRunInput = z.object({
  sector: z.string(),
  adversary: z.string(),
  branch: z.string(),
  mwShed: z.number(),
  mttd: z.number(),
  mttr: z.number(),
  cost: z.number(),
  score: z.number(),
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
    const operatorId = await getAuthOperatorId();
    if (!operatorId) {
      throw new Error("Unauthorized. Please log in to save training runs to the database.");
    }

    const runId = Math.random().toString(36).substring(2, 15);

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
      createdAt: new Date().toISOString(),
    });

    return { success: true, id: runId };
  });

export const getTrainingRuns = createServerFn({ method: "GET" }).handler(async () => {
  const operatorId = await getAuthOperatorId();
  if (!operatorId) {
    return []; // Return empty or offline mode handles local storage
  }

  const runs = await db.query.trainingRuns.findMany({
    where: (fields, { eq }) => eq(fields.operatorId, operatorId),
    orderBy: (fields, { desc }) => [desc(fields.createdAt)],
  });

  return runs.map((r) => ({
    id: r.id,
    timestamp: r.createdAt,
    sector: r.sector,
    adversary: r.adversary,
    branch: r.branch,
    mwShed: r.mwShed,
    mttd: r.mttd.toString() + "s",
    mttr: r.mttr.toString() + "s",
    cost: "$" + r.cost.toLocaleString() + "k",
    score: r.score,
    shareUrl: r.shareUrl,
    isolatedNodes: r.isolatedNodes ? JSON.parse(r.isolatedNodes) : [],
    attackType: r.attackType,
    adversaryProfile: r.adversaryProfile,
    attackChain: r.attackChain,
    espionageObjective: r.espionageObjective,
    exfiltrationTarget: r.exfiltrationTarget,
    persistenceMethod: r.persistenceMethod,
    attemptCount: r.attemptCount,
    decisionHistory: r.decisionHistory ? JSON.parse(r.decisionHistory) : null,
    terminalCommands: r.terminalCommands ? JSON.parse(r.terminalCommands) : null,
    hintLevel: r.hintLevel,
    exfiltratedData: r.exfiltratedData ? JSON.parse(r.exfiltratedData) : null,
    persistenceEstablished: r.persistenceEstablished,
    simulationState: r.simulationState ? JSON.parse(r.simulationState) : null,
  }));
});

export const getTrainingStats = createServerFn({ method: "GET" }).handler(async () => {
  const operatorId = await getAuthOperatorId();
  if (!operatorId) {
    return { totalRuns: 0, avgScore: 0, avgMwsShed: "0.0", bestScore: 0 };
  }

  // Run aggregations
  const result = await db
    .select({
      count: count(),
      avgScore: avg(trainingRuns.score),
      avgMw: avg(trainingRuns.mwShed),
      maxScore: max(trainingRuns.score),
    })
    .from(trainingRuns)
    .where(eq(trainingRuns.operatorId, operatorId));

  const stats = result[0];

  return {
    totalRuns: stats.count || 0,
    avgScore: stats.avgScore ? Math.round(Number(stats.avgScore)) : 0,
    avgMwsShed: stats.avgMw ? Number(stats.avgMw).toFixed(1) : "0.0",
    bestScore: stats.maxScore ? Number(stats.maxScore) : 0,
  };
});

// Generate replay link
export const generateReplayLink = createServerFn({ method: "POST" })
  .validator(
    z.object({
      simulationState: z.record(z.string(), z.any()),
      sector: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    // Encode simulation state
    const stateString = JSON.stringify(data.simulationState);
    const encodedState = btoa(encodeURIComponent(stateString));
    const shareUrl = `/simulation?sector=${data.sector}#s=${encodedState}`;
    return { shareUrl };
  });
