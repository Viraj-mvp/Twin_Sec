import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db/db";
import { trainingRuns, auditLogs } from "../db/schema";
import { eq } from "drizzle-orm";
import { getSessionCookie } from "../auth.server";
import { generateText } from "ai";
import { callAI, AIUnavailableError } from "../ai-providers.server";
import { scrubContent, detectPromptInjection } from "./enhanced-simulation.functions";
import { EXERCISES } from "@/data/scenarios";
import type { SectorId } from "@/data/scenarios";
import {
  buildRoleBriefingSystemPrompt,
  buildPhaseGuidanceSystemPrompt,
  buildDiagnosticQuestionsSystemPrompt,
  buildContextHintSystemPrompt,
  staticRoleBriefing,
  staticPhaseGuidance,
  staticDiagnosticQuestions,
  staticContextHint,
  GUIDANCE_PHASES_RED,
  GUIDANCE_PHASES_BLUE,
  type OperationalRole,
  type GuidancePhase,
  type RoleBriefing,
  type PhaseGuidance,
} from "../briefing-prompts.server";

const SECTORS = [
  "power",
  "water",
  "oil-gas",
  "manufacturing",
  "port",
  "smart-building",
  "smart-city",
] as const;

// ── Zod schemas ────────────────────────────────────────────────────
const GenerateRoleBriefingInput = z.object({
  sector: z.enum(SECTORS),
  role: z.enum(["RED", "BLUE"]),
  scenarioCode: z.string().max(64),
  threatActor: z.string().max(64),
});

const GeneratePhaseGuidanceInput = z.object({
  sector: z.enum(SECTORS),
  role: z.enum(["RED", "BLUE"]),
  phase: z.union([z.enum(GUIDANCE_PHASES_RED), z.enum(GUIDANCE_PHASES_BLUE)]),
  eventTagsSeen: z.array(z.string()).max(32).default([]),
  lastDecisionId: z.string().max(32).optional(),
});

const GenerateContextHintInput = z.object({
  sector: z.enum(SECTORS),
  role: z.enum(["RED", "BLUE"]),
  phase: z.union([z.enum(GUIDANCE_PHASES_RED), z.enum(GUIDANCE_PHASES_BLUE)]),
  currentHintLevel: z.number().min(0).max(3).default(0),
  stuckNodeId: z.string().max(32).optional(),
  lastDecisionTrigger: z.string().max(128).optional(),
  lastTerminalCommand: z.string().max(256).optional(),
  lastHintHash: z.string().max(128).optional(),
  trainingRunId: z.string().max(64).optional(),
});

const GenerateDiagnosticQuestionsInput = z.object({
  sector: z.enum(SECTORS),
  role: z.enum(["RED", "BLUE"]),
  phase: z.union([z.enum(GUIDANCE_PHASES_RED), z.enum(GUIDANCE_PHASES_BLUE)]),
  focusContext: z.string().max(512).default(""),
});

// ── Shared helpers ─────────────────────────────────────────────────
async function getAuthOperatorId() {
  const token = getSessionCookie();
  if (!token) return null;
  const session = await db.query.sessions.findFirst({
    where: (fields) => eq(fields.token, token),
  });
  if (!session || new Date(session.expiresAt) < new Date()) return null;
  return session.operatorId;
}

async function logAudit(
  trainingRunId: string | null | undefined,
  eventType: string,
  details: unknown,
  operatorId: string | null = null,
) {
  const validRunId = trainingRunId && trainingRunId !== "none" ? trainingRunId : undefined;
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    trainingRunId: validRunId,
    operatorId: operatorId ?? undefined,
    timestamp: new Date().toISOString(),
    eventType,
    details: JSON.stringify(details),
  });
}

function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const raw = fenced ? fenced[1] : text;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function sha256(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

// ── Server Function: generateRoleBriefing ──────────────────────────
export const generateRoleBriefing = createServerFn({ method: "POST" })
  .validator(GenerateRoleBriefingInput)
  .handler(async ({ data }) => {
    const operatorId = await getAuthOperatorId();
    const allInputs = JSON.stringify(data);
    const injection = detectPromptInjection(allInputs);
    const auditDetails = {
      sector: data.sector,
      role: data.role,
      scenarioCode: data.scenarioCode,
      threatActor: data.threatActor,
      injection: injection.detected,
      patterns: injection.patterns,
    };
    if (injection.detected) {
      await logAudit("none", "prompt-injection-blocked", auditDetails, operatorId);
      throw new Error("Potential prompt injection detected");
    }

    let briefing: RoleBriefing;
    let source: "primary" | "ollama" | "openrouter" | "static" = "static";
    let tokensUsed = 0;

    try {
      const aiResp = await callAI("role_briefing", async (cfg) => {
        const prompt = buildRoleBriefingSystemPrompt(
          data.sector as SectorId,
          data.role as OperationalRole,
          data.scenarioCode || EXERCISES[data.sector as SectorId].code,
          data.threatActor || EXERCISES[data.sector as SectorId].adversary,
        );
        const res = await generateText({
          model: cfg.provider(cfg.model),
          maxOutputTokens: cfg.maxTokens,
          system: prompt,
          prompt: "Return valid JSON only. No prose, no comments.",
        });
        return { text: res.text, tokens: res.usage?.totalTokens ?? 0 };
      });
      const parsed = safeJsonParse<RoleBriefing>(
        aiResp.text,
        staticRoleBriefing(data.sector as SectorId, data.role as OperationalRole),
      );
      briefing = {
        ...parsed,
        sector: data.sector as SectorId,
        role: data.role as OperationalRole,
        scenarioCode: data.scenarioCode,
        generatedAt: new Date().toISOString(),
      };
      tokensUsed = aiResp.tokens;
      source = "primary";
    } catch (err) {
      if (!(err instanceof AIUnavailableError) && !(err as Error).name?.includes("Timeout")) {
        console.warn(`[RoleBriefing] AI failed, using static fallback: ${(err as Error).message}`);
      }
      briefing = staticRoleBriefing(data.sector as SectorId, data.role as OperationalRole);
      source = "static";
    }

    const scrubbed: RoleBriefing = {
      ...briefing,
      objectives: briefing.objectives.map((o) => ({
        ...o,
        description: scrubContent(o.description),
      })),
      ttps: briefing.ttps.map((t) => ({
        ...t,
        sectorContext: scrubContent(t.sectorContext),
        title: scrubContent(t.title),
      })),
      impact: {
        ...briefing.impact,
        primaryImpact: scrubContent(briefing.impact.primaryImpact),
        humanFactor: scrubContent(briefing.impact.humanFactor),
      },
      threatActor: {
        ...briefing.threatActor,
        handle: scrubContent(briefing.threatActor.handle),
        typicalMotive: scrubContent(briefing.threatActor.typicalMotive),
        sectorAffinity: scrubContent(briefing.threatActor.sectorAffinity),
      },
      prerequisites: briefing.prerequisites.map((p) => scrubContent(p)),
      redFrame: briefing.redFrame ? scrubContent(briefing.redFrame) : undefined,
      blueFrame: briefing.blueFrame ? scrubContent(briefing.blueFrame) : undefined,
    };

    await logAudit(
      "none",
      "briefing-generated",
      { ...auditDetails, source, tokensUsed },
      operatorId,
    );

    return { briefing: scrubbed, tokensUsed, source };
  });

// ── Server Function: generatePhaseGuidance ─────────────────────────
export const generatePhaseGuidance = createServerFn({ method: "POST" })
  .validator(GeneratePhaseGuidanceInput)
  .handler(async ({ data }) => {
    const operatorId = await getAuthOperatorId();
    const allInputs = JSON.stringify(data);
    const injection = detectPromptInjection(allInputs);
    if (injection.detected) {
      await logAudit(
        "none",
        "prompt-injection-blocked",
        { event: "phase-guidance", patterns: injection.patterns },
        operatorId,
      );
      throw new Error("Potential prompt injection detected");
    }

    let guidance: PhaseGuidance;
    let source: "primary" | "ollama" | "openrouter" | "static" = "static";
    let tokensUsed = 0;

    try {
      const aiResp = await callAI("phase_guidance", async (cfg) => {
        const prompt = buildPhaseGuidanceSystemPrompt(
          data.sector as SectorId,
          data.role as OperationalRole,
          data.phase as GuidancePhase,
          data.eventTagsSeen,
          data.lastDecisionId,
        );
        const res = await generateText({
          model: cfg.provider(cfg.model),
          maxOutputTokens: cfg.maxTokens,
          system: prompt,
          prompt: "Return valid JSON only.",
        });
        return { text: res.text, tokens: res.usage?.totalTokens ?? 0 };
      });
      const parsed = safeJsonParse<PhaseGuidance>(
        aiResp.text,
        staticPhaseGuidance(
          data.sector as SectorId,
          data.role as OperationalRole,
          data.phase as GuidancePhase,
        ),
      );
      guidance = {
        ...parsed,
        role: data.role as OperationalRole,
        phase: data.phase as GuidancePhase,
        sector: data.sector as SectorId,
      };
      tokensUsed = aiResp.tokens;
      source = "primary";
    } catch {
      guidance = staticPhaseGuidance(
        data.sector as SectorId,
        data.role as OperationalRole,
        data.phase as GuidancePhase,
      );
      source = "static";
    }

    const scrubbed: PhaseGuidance = {
      ...guidance,
      purpose: scrubContent(guidance.purpose),
      commonActivities: guidance.commonActivities.map((a) => scrubContent(a)),
      toolbox: guidance.toolbox.map((t) => ({
        ...t,
        name: scrubContent(t.name),
        usedFor: scrubContent(t.usedFor),
        terminalCommand: t.terminalCommand ? scrubContent(t.terminalCommand) : undefined,
      })),
      requiredDecisions: guidance.requiredDecisions.map((r) => ({
        ...r,
        questionPreview: scrubContent(r.questionPreview),
        redPitfall: r.redPitfall ? scrubContent(r.redPitfall) : undefined,
        bluePitfall: r.bluePitfall ? scrubContent(r.bluePitfall) : undefined,
      })),
      progressHint: scrubContent(guidance.progressHint),
      nextPhaseTrigger: scrubContent(guidance.nextPhaseTrigger),
    };

    await logAudit(
      "none",
      "phase-guidance-fetched",
      {
        phase: data.phase,
        role: data.role,
        sector: data.sector,
        source,
        tokensUsed,
      },
      operatorId,
    );

    return { guidance: scrubbed, tokensUsed, source };
  });

// ── Server Function: generateContextHint ───────────────────────────
export const generateContextHint = createServerFn({ method: "POST" })
  .validator(GenerateContextHintInput)
  .handler(async ({ data }) => {
    const operatorId = await getAuthOperatorId();
    const allInputs = JSON.stringify(data);
    const injection = detectPromptInjection(allInputs);
    if (injection.detected) {
      await logAudit(
        data.trainingRunId ?? "none",
        "prompt-injection-blocked",
        { event: "context-hint", patterns: injection.patterns },
        operatorId,
      );
      throw new Error("Potential prompt injection detected");
    }

    const rawLevel = Math.max(0, Math.min(3, data.currentHintLevel));
    const nextHintLevel = (data.lastHintHash ? Math.min(3, rawLevel + 1) : rawLevel) as
      0 | 1 | 2 | 3;

    let hintText = "";
    let delivery: "terminal" | "popover" | "diagnostic" = "terminal";
    let popoverNodeId: string | undefined;
    let diagnosticQuestions: string[] | undefined;

    try {
      const aiResp = await callAI("hint", async (cfg) => {
        const prompt = buildContextHintSystemPrompt(
          data.sector as SectorId,
          data.role as OperationalRole,
          data.phase as GuidancePhase,
          nextHintLevel,
          data.stuckNodeId,
          data.lastDecisionTrigger,
          data.lastTerminalCommand,
        );
        const res = await generateText({
          model: cfg.provider(cfg.model),
          maxOutputTokens: cfg.maxTokens,
          system: prompt,
          prompt: nextHintLevel === 0 ? "JSON array only." : "Plain text.",
        });
        return { text: res.text };
      });
      if (nextHintLevel === 0) {
        const qs = safeJsonParse<string[]>(aiResp.text, []);
        if (qs.length >= 2 && qs.every((q) => /\?$/.test(q.trim()))) {
          delivery = "diagnostic";
          diagnosticQuestions = qs.map((q) => scrubContent(q));
        } else {
          throw new Error("Invalid diagnostic Qs format");
        }
      } else {
        hintText = scrubContent(aiResp.text);
        delivery = nextHintLevel === 1 && data.stuckNodeId ? "popover" : "terminal";
        if (delivery === "popover") popoverNodeId = data.stuckNodeId;
      }
    } catch {
      const f = staticContextHint(
        data.sector as SectorId,
        data.role as OperationalRole,
        data.phase as GuidancePhase,
        nextHintLevel,
        data.stuckNodeId,
        data.lastDecisionTrigger,
      );
      hintText = f.hintText ? scrubContent(f.hintText) : "";
      delivery = f.delivery;
      popoverNodeId = f.popoverNodeId;
      diagnosticQuestions = f.diagnosticQuestions
        ? f.diagnosticQuestions.map((q) => scrubContent(q))
        : undefined;
    }

    const finalHint = hintText || "";
    const finalHash = sha256(finalHint + JSON.stringify(diagnosticQuestions ?? []));

    if (data.trainingRunId) {
      await logAudit(
        data.trainingRunId,
        nextHintLevel === 3 ? "solution" : "hint",
        {
          phase: data.phase,
          role: data.role,
          sector: data.sector,
          hintLevel: nextHintLevel,
          delivery,
          hintHash: finalHash,
        },
        operatorId,
      );
      await db
        .update(trainingRuns)
        .set({
          hintLevel: nextHintLevel,
          lastHintHash: finalHash,
        })
        .where(eq(trainingRuns.id, data.trainingRunId));
    }

    return {
      nextHintLevel,
      hintText: finalHint,
      hintHash: finalHash,
      delivery,
      popoverNodeId,
      diagnosticQuestions,
    };
  });

// ── Server Function: generateDiagnosticQuestions ───────────────────
export const generateDiagnosticQuestions = createServerFn({ method: "POST" })
  .validator(GenerateDiagnosticQuestionsInput)
  .handler(async ({ data }) => {
    const operatorId = await getAuthOperatorId();
    const allInputs = JSON.stringify(data);
    const injection = detectPromptInjection(allInputs);
    if (injection.detected) {
      await logAudit(
        "none",
        "prompt-injection-blocked",
        { event: "diagnostic-questions", patterns: injection.patterns },
        operatorId,
      );
      throw new Error("Potential prompt injection detected");
    }

    let questions: string[] = [];
    let tokensUsed = 0;

    try {
      const aiResp = await callAI("diagnostic_questions", async (cfg) => {
        const prompt = buildDiagnosticQuestionsSystemPrompt(
          data.sector as SectorId,
          data.role as OperationalRole,
          data.phase as GuidancePhase,
          data.focusContext,
        );
        const res = await generateText({
          model: cfg.provider(cfg.model),
          maxOutputTokens: cfg.maxTokens,
          system: prompt,
          prompt: "JSON array of 2-3 questions only.",
        });
        return { text: res.text, tokens: res.usage?.totalTokens ?? 0 };
      });
      const parsed = safeJsonParse<string[]>(aiResp.text, []);
      if (parsed.length >= 2 && parsed.every((q) => /\?$/.test(q.trim()))) {
        questions = parsed.map((q) => scrubContent(q));
      } else {
        throw new Error("Diagnostic Qs validation failed");
      }
      tokensUsed = aiResp.tokens;
    } catch {
      questions = staticDiagnosticQuestions(
        data.sector as SectorId,
        data.role as OperationalRole,
        data.phase as GuidancePhase,
      ).map((q) => scrubContent(q));
    }

    await logAudit(
      "none",
      "diagnostic-questions",
      {
        phase: data.phase,
        role: data.role,
        sector: data.sector,
        tokensUsed,
        count: questions.length,
      },
      operatorId,
    );

    return { questions, tokensUsed };
  });
