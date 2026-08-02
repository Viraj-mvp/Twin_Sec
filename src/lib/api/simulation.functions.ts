import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db/db";
import { trainingRuns, auditLogs, simulationScenarios } from "../db/schema";
import { getSessionCookie, getSessionOperator } from "../auth.server";
import { checkRateLimit, LIMITS } from "../rate-limit.server";
import { SectorId } from "../../data/scenarios";
import { SimPhase, TERMINAL_TEMPLATES } from "../../data/terminal-templates";
import { HINT_LIBRARY } from "../../data/hints";
import { callAI } from "../ai-providers.server";
import { generateText } from "ai";
import { scrubContent } from "./enhanced-simulation.functions";

const SECTORS = [
  "power",
  "water",
  "oil-gas",
  "manufacturing",
  "port",
  "smart-building",
  "smart-city",
] as const;

const SIMULATION_PHASES = ["RECON", "EXPLOIT", "DEFEND", "REVIEW"] as const;

// ── 1. GENERATE TERMINAL COMMAND ─────────────────────────────────────────
const GenerateTerminalCommandInput = z.object({
  sector: z.enum(SECTORS),
  phase: z.enum(SIMULATION_PHASES),
  nodeId: z.string().optional().default("default"),
  attackType: z.enum(["disruption", "espionage"]).optional().default("disruption"),
  adversaryProfile: z
    .enum(["nation-state", "activist", "script-kiddie"])
    .optional()
    .default("nation-state"),
});

export const generateTerminalCommand = createServerFn({ method: "POST" })
  .validator(GenerateTerminalCommandInput)
  .handler(async ({ data }) => {
    const token = getSessionCookie();
    const operator = await getSessionOperator(token);
    const ipKey = operator?.callsign || "guest";

    const rl = checkRateLimit(`ai_terminal:${ipKey}`, LIMITS.ai_terminal);
    if (!rl.allowed) {
      throw new Error(`Rate limit exceeded for terminal command generation.`);
    }

    const { sector, phase, nodeId } = data;
    let templateOutput: string | undefined;

    // Check static templates first
    const phaseTemplates = TERMINAL_TEMPLATES[phase as SimPhase];
    if (phaseTemplates && phaseTemplates[sector as SectorId]) {
      const sectorTemplates = phaseTemplates[sector as SectorId]!;
      templateOutput = sectorTemplates[nodeId] || sectorTemplates["default"];
    }

    let rawOutput = templateOutput;
    let aiGenerated = false;

    if (!rawOutput) {
      // Fallback to AI generation if custom scenario without template
      aiGenerated = true;
      try {
        rawOutput = await callAI("terminal_command", async ({ provider, model }) => {
          const res = await generateText({
            model: provider(model),
            prompt: `Generate a defanged industrial cyber range terminal output for Sector: ${sector}, Phase: ${phase}, Node: ${nodeId}. Include [DEFANGED - TRAINING ONLY] header. Maximum 8 lines.`,
          });
          return res.text;
        });
      } catch {
        rawOutput = `[DEFANGED - TRAINING ONLY]\n${sector.toUpperCase()} > scan ${nodeId}\n[+] Node ${nodeId.toUpperCase()} active over OT industrial subnet.`;
      }
    }

    // Always safety scrub output
    const cleanOutput = scrubContent(rawOutput);

    // Audit log
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      operatorId: operator?.id || null,
      timestamp: new Date().toISOString(),
      eventType: "terminal-command",
      severity: "info",
      details: JSON.stringify({
        sector,
        phase,
        nodeId,
        templateUsed: !aiGenerated,
        aiGenerated,
      }),
    });

    return { command: `${sector.toUpperCase()} > query ${nodeId}`, output: cleanOutput };
  });

// ── 2. PROGRESSIVE HINTS ──────────────────────────────────────────────────
const GetHintInput = z.object({
  trainingRunId: z.string().optional(),
  sector: z.enum(SECTORS),
  phase: z.enum(SIMULATION_PHASES),
  currentHintLevel: z.number().min(0).max(2),
});

export const getSimulationHint = createServerFn({ method: "POST" })
  .validator(GetHintInput)
  .handler(async ({ data }) => {
    const token = getSessionCookie();
    const operator = await getSessionOperator(token);

    const nextLevel = (data.currentHintLevel + 1) as 1 | 2 | 3;
    const sectorHints = HINT_LIBRARY[data.sector as SectorId];
    const phaseHints = sectorHints ? sectorHints[data.phase as SimPhase] : undefined;
    const hintObj = phaseHints ? phaseHints[nextLevel] : undefined;

    const hintText = hintObj
      ? hintObj.text
      : `Hint Level ${nextLevel}: Focus on isolating affected nodes and checking SCADA telemetry alarms.`;

    // Audit log hint request
    if (data.trainingRunId) {
      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        trainingRunId: data.trainingRunId,
        operatorId: operator?.id || null,
        timestamp: new Date().toISOString(),
        eventType: "hint",
        severity: "info",
        details: JSON.stringify({ phase: data.phase, hintLevel: nextLevel }),
      });
    }

    return {
      hintLevel: nextLevel,
      text: hintText,
      solution: hintObj?.solution,
      scorePenalty: 5,
    };
  });

// ── 3. EXECUTE DEFENSE ACTION ─────────────────────────────────────────────
const DefenseActionInput = z.object({
  trainingRunId: z.string().optional(),
  phase: z.enum(SIMULATION_PHASES),
  action: z.enum(["ISOLATE", "PATCH", "TRIP"]),
  nodeId: z.string(),
  simulationTime: z.number().optional().default(0),
});

export const executeDefenseAction = createServerFn({ method: "POST" })
  .validator(DefenseActionInput)
  .handler(async ({ data }) => {
    const token = getSessionCookie();
    const operator = await getSessionOperator(token);

    if (data.phase !== "DEFEND") {
      throw new Error("Defense actions are only valid during active cascade (DEFEND Phase).");
    }

    let consequence = "";
    let mwShedReduction = 0;
    let mttdBonus = 0;

    switch (data.action) {
      case "ISOLATE":
        consequence = `Network isolation (airgap) applied to node ${data.nodeId.toUpperCase()}. Adversary lateral movement halted at subnet boundary.`;
        mttdBonus = -30;
        break;
      case "PATCH":
        consequence = `Firmware patch & key rotation pushed to ${data.nodeId.toUpperCase()}. Rung logic integrity restored.`;
        break;
      case "TRIP":
        mwShedReduction = 4;
        consequence = `Manual trip executed on ${data.nodeId.toUpperCase()}. Controlled 4MW deload executed; physical equipment preserved.`;
        break;
    }

    // Log to audit table
    if (data.trainingRunId) {
      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        trainingRunId: data.trainingRunId,
        operatorId: operator?.id || null,
        timestamp: new Date().toISOString(),
        eventType: "decision",
        severity: "info",
        details: JSON.stringify({
          action: data.action,
          nodeId: data.nodeId,
          consequence,
          simulationTime: data.simulationTime,
        }),
      });
    }

    return {
      success: true,
      action: data.action,
      nodeId: data.nodeId,
      consequence,
      metricsEffect: { mwShedReduction, mttdBonus },
    };
  });

// ── 4. SAVE TRAINING RUN ──────────────────────────────────────────────────
const SaveRunInput = z.object({
  sector: z.enum(SECTORS),
  adversary: z.string(),
  branch: z.string(),
  mwShed: z.number(),
  mttd: z.number(),
  mttr: z.number(),
  cost: z.number(),
  score: z.number().optional(),
  shareUrl: z.string().optional(),
  isolatedNodes: z.array(z.string()).optional(),
  attackType: z.string().optional().default("disruption"),
  adversaryProfile: z.string().optional().default("nation-state"),
  hintCount: z.number().optional().default(0),
  decisionHistory: z.string().optional(),
  terminalCommands: z.string().optional(),
});

export const saveTrainingRun = createServerFn({ method: "POST" })
  .validator(SaveRunInput)
  .handler(async ({ data }) => {
    const token = getSessionCookie();
    const operator = await getSessionOperator(token);

    // Calculate score dynamically if not provided
    const baseScore = 100;
    const mttdPenalty = Math.min(20, Math.floor(data.mttd / 60));
    const mttrPenalty = Math.min(20, Math.floor(data.mttr / 60));
    const mwPenalty = Math.min(30, Math.floor(data.mwShed * 2));
    const hintPenalty = (data.hintCount || 0) * 5;
    const isolationBonus = (data.isolatedNodes?.length || 0) * 3;

    const calculatedScore = Math.max(
      0,
      Math.min(
        100,
        baseScore - mttdPenalty - mttrPenalty - mwPenalty - hintPenalty + isolationBonus,
      ),
    );

    const score = data.score !== undefined ? data.score : calculatedScore;
    const runId = crypto.randomUUID();

    const payload = {
      sector: data.sector,
      adversary: data.adversary,
      branch: data.branch,
      score,
      mwShed: data.mwShed,
    };

    const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
    const shareUrl =
      data.shareUrl || `https://twinsec.io/simulation?sector=${data.sector}#s=${encoded}`;

    await db.insert(trainingRuns).values({
      id: runId,
      operatorId: operator?.id || null,
      sector: data.sector,
      adversary: data.adversary,
      branch: data.branch,
      mwShed: data.mwShed,
      mttd: data.mttd,
      mttr: data.mttr,
      cost: data.cost,
      score,
      shareUrl,
      isolatedNodes: data.isolatedNodes ? JSON.stringify(data.isolatedNodes) : null,
      attackType: data.attackType,
      adversaryProfile: data.adversaryProfile,
      hintCount: data.hintCount,
      decisionHistory: data.decisionHistory,
      terminalCommands: data.terminalCommands,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    // Create audit log entry for run completion
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      trainingRunId: runId,
      operatorId: operator?.id || null,
      timestamp: new Date().toISOString(),
      eventType: "run_complete",
      severity: "info",
      details: JSON.stringify({ score, branch: data.branch, mwShed: data.mwShed }),
    });

    return { runId, score, shareUrl };
  });

// ── 5. GENERATE DEBRIEF SCORECARD ─────────────────────────────────────────
const DebriefInput = z.object({
  sector: z.enum(SECTORS),
  adversaryProfile: z.string().default("nation-state"),
  score: z.number(),
  mttd: z.number(),
  mttr: z.number(),
  mwShed: z.number(),
  hintCount: z.number().default(0),
});

export const generateDebriefScorecard = createServerFn({ method: "POST" })
  .validator(DebriefInput)
  .handler(async ({ data }) => {
    try {
      const debriefJson = await callAI("debrief_scorecard", async ({ provider, model }) => {
        const res = await generateText({
          model: provider(model),
          prompt: `Analyze a ${data.sector} cyber-physical simulation exercise for operator evaluation. Score: ${data.score}/100, MTTD: ${data.mttd}s, MTTR: ${data.mttr}s, MW Shed: ${data.mwShed}MW. Hints used: ${data.hintCount}. Return JSON format with summary, mitreDefended, mitreMissed, and improvements list.`,
        });
        return res.text;
      });

      return JSON.parse(debriefJson);
    } catch {
      return {
        summary: `Operator demonstrated effective containment across ${data.sector.toUpperCase()} simulation exercise, maintaining grid envelope within safe limits.`,
        mitreDefended: ["T0846", "T0836"],
        mitreMissed: ["T0885"],
        improvements: [
          "Reduce mean-time-to-detect by automating Modbus anomaly alerts.",
          "Enforce hardware keylock switches on L1 logic controllers.",
          "Conduct periodic offline backups of PLC rung programs.",
        ],
      };
    }
  });

// ── 6. LIST DB ATTACK SCENARIOS ──────────────────────────────────────────
export const listDatabaseAttacks = createServerFn({ method: "GET" }).handler(async () => {
  return await db.select().from(simulationScenarios);
});

// ── 7. ADD DB ATTACK SCENARIO ───────────────────────────────────────────
const AddAttackInput = z.object({
  name: z.string().min(3),
  sector: z.enum(SECTORS),
  description: z.string(),
  attackType: z.string().default("disruption"),
  adversaryProfile: z.string().default("nation-state"),
  eventsJson: z.string().optional(),
  decisionsJson: z.string().optional(),
  nodesJson: z.string().optional(),
});

export const addDatabaseAttack = createServerFn({ method: "POST" })
  .validator(AddAttackInput)
  .handler(async ({ data }) => {
    const token = getSessionCookie();
    const operator = await getSessionOperator(token);

    const scenarioId = `attack-${crypto.randomUUID()}`;
    await db.insert(simulationScenarios).values({
      id: scenarioId,
      createdBy: operator?.id || null,
      sector: data.sector,
      name: data.name,
      description: data.description,
      attackType: data.attackType,
      adversaryProfile: data.adversaryProfile,
      eventsJson: data.eventsJson || "[]",
      decisionsJson: data.decisionsJson || "[]",
      nodesJson: data.nodesJson || "[]",
      isPublic: true,
      createdAt: new Date().toISOString(),
    });

    return { success: true, scenarioId };
  });
