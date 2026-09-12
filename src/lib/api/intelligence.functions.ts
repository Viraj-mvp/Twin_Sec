import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db/db";
import { simulationScenarios, auditLogs } from "../db/schema";
import { getSessionCookie, getSessionOperator } from "../auth.server";
import { checkRateLimit, LIMITS } from "../rate-limit.server";
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

const GenerateAIAttackInput = z.object({
  sector: z.enum(SECTORS).default("power"),
  prompt: z.string().min(3),
  adversaryName: z.string().optional().default("CUSTOM-AI-ACTOR"),
  saveToDb: z.boolean().optional().default(true),
});

export const generateAndStoreAIAttack = createServerFn({ method: "POST" })
  .validator(GenerateAIAttackInput)
  .handler(async ({ data }) => {
    const token = getSessionCookie();
    const operator = await getSessionOperator(token);
    const ipKey = operator?.callsign || "guest";

    const rl = checkRateLimit(`ai_attack:${ipKey}`, LIMITS.ai_terminal);
    if (!rl.allowed) {
      throw new Error("Rate limit exceeded for AI attack generation.");
    }

    const { sector, prompt, adversaryName, saveToDb } = data;
    const scenarioId = crypto.randomUUID();

    let rawAnalysis = "";
    try {
      rawAnalysis = await callAI("attack_generator", async ({ provider, model }) => {
        const res = await generateText({
          model: provider(model),
          prompt: `You are an industrial cybersecurity researcher analyzing this threat research prompt: "${prompt}".
Generate a defanged SCADA attack chain for sector "${sector}" and adversary "${adversaryName}".
Include 5 sequential events (t in seconds, tag, node, title, desc, sev) and 3 operator decisions (t, trigger, question, context, options).
Return strict JSON without markdown formatting.`,
        });
        return res.text;
      });
    } catch {
      rawAnalysis = JSON.stringify({
        name: `AI Scenario: ${adversaryName}`,
        description: `Synthetic threat scenario generated for ${sector} sector based on research prompt: "${prompt}".`,
        attackType: "disruption",
        adversaryProfile: adversaryName,
        events: [
          {
            t: 0,
            tag: "INITIAL ACCESS",
            node: "ews-04",
            title: "Spear-phish payload executed",
            desc: "Beacon established to adversary C2.",
            sev: "MEDIUM",
          },
          {
            t: 800,
            tag: "DISCOVERY",
            node: "hist",
            title: "SCADA Historian enumerated",
            desc: "Modbus/TCP register tags indexed.",
            sev: "HIGH",
          },
          {
            t: 1400,
            tag: "LATERAL",
            node: "hmi-11",
            title: "Operator console hijacked",
            desc: "Cached operator token replayed.",
            sev: "HIGH",
          },
          {
            t: 6200,
            tag: "IMPACT",
            node: "plc-3",
            title: "PLC logic setpoints walked",
            desc: "Tolerance threshold drift executed.",
            sev: "CRITICAL",
          },
          {
            t: 9000,
            tag: "BYPASS",
            node: "sis",
            title: "Safety interlock disarmed",
            desc: "Trip solver disarmed silently.",
            sev: "CRITICAL",
          },
        ],
        decisions: [
          {
            id: "d1",
            t: 1400,
            trigger: "Operator console hijacked",
            question: "Sever RDP console session and force MFA re-auth?",
            context: "Console reuse detected mid-shift.",
            options: [
              { id: "ACT", label: "SEVER CONSOLE", consequence: "Adversary loop broken at L2." },
              {
                id: "DEFER",
                label: "LOG ONLY",
                consequence: "Adversary continues setpoint drift.",
              },
              { id: "MISS", label: "IGNORE", consequence: "Full physics cascade occurs." },
            ],
          },
        ],
      });
    }

    const cleanContent = scrubContent(rawAnalysis);
    let parsedScenario: Record<string, unknown> = {};
    try {
      parsedScenario = JSON.parse(cleanContent);
    } catch {
      parsedScenario = {
        name: `Scenario ${adversaryName}`,
        description: prompt,
        events: [],
        decisions: [],
      };
    }

    if (saveToDb) {
      await db.insert(simulationScenarios).values({
        id: scenarioId,
        createdBy: operator?.id || null,
        sector,
        name: String(parsedScenario.name || `AI Scenario: ${adversaryName}`),
        description: String(parsedScenario.description || prompt),
        attackType: String(parsedScenario.attackType || "disruption"),
        adversaryProfile: adversaryName,
        eventsJson: JSON.stringify(parsedScenario.events || []),
        decisionsJson: JSON.stringify(parsedScenario.decisions || []),
        isPublic: true,
        createdAt: new Date().toISOString(),
      });

      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        operatorId: operator?.id || null,
        timestamp: new Date().toISOString(),
        eventType: "ai_scenario_generated",
        severity: "info",
        details: JSON.stringify({ scenarioId, sector, adversaryName }),
      });
    }

    return {
      scenarioId,
      sector,
      name: (parsedScenario.name as string) || `AI Scenario: ${adversaryName}`,
      description: (parsedScenario.description as string) || prompt,
      events: (parsedScenario.events as Array<Record<string, string | number | boolean>>) || [],
      decisions:
        (parsedScenario.decisions as Array<Record<string, string | number | boolean>>) || [],
      savedToDb: saveToDb,
    };
  });

const ConvertIntelInput = z.object({
  caseFileId: z.string().min(1),
  title: z.string().min(1),
  incidentSummary: z.string().min(1),
  sector: z.string().default("power"),
  threatActor: z.string().optional(),
});

export const convertCaseFileToScenario = createServerFn({ method: "POST" })
  .validator(ConvertIntelInput)
  .handler(async ({ data }) => {
    const token = getSessionCookie();
    const operator = await getSessionOperator(token);
    const { caseFileId, title, incidentSummary, sector, threatActor } = data;

    const { convertIntelToScenario } = await import("../scenario-generator.server");
    const generated = await convertIntelToScenario({
      caseFileId,
      title,
      incidentSummary,
      sector,
      threatActor,
    });

    const scenarioId = `intel-${caseFileId}`;
    const existing = await db.query.simulationScenarios.findFirst({
      where: (s, { eq }) => eq(s.id, scenarioId),
    });

    if (!existing) {
      await db.insert(simulationScenarios).values({
        id: scenarioId,
        createdBy: operator?.id || null,
        sector: generated.sector,
        name: generated.name,
        description: generated.description,
        attackType: generated.attackType,
        adversaryProfile: generated.adversaryProfile,
        caseFileId,
        redTacticsJson: JSON.stringify(generated.redTactics),
        blueMitigationsJson: JSON.stringify(generated.blueMitigations),
        isPublic: true,
        createdAt: new Date().toISOString(),
      });
    }

    return {
      success: true,
      scenarioId,
      sector: generated.sector,
      name: generated.name,
      redTactics: generated.redTactics,
      blueMitigations: generated.blueMitigations,
    };
  });

export const getScenarioWithRedBlueBriefing = createServerFn({ method: "GET" })
  .validator(z.object({ scenarioId: z.string() }))
  .handler(async ({ data }) => {
    const sc = await db.query.simulationScenarios.findFirst({
      where: (s, { eq }) => eq(s.id, data.scenarioId),
    });

    if (!sc) {
      return {
        found: false,
        redTactics: [
          "nmap -sS -p 104,502 10.0.0.0/24 (Recon Substation & SCADA Bus)",
          "modbus-cli write --target plc-01 --val 1 (Execute Setpoint Override)",
        ],
        blueMitigations: [
          "isolate-node plc-01 (Isolate Compromised Controller)",
          "block-ip 10.0.0.45 (Block Adversary C2 IP)",
        ],
      };
    }

    let redTactics: string[] = [];
    let blueMitigations: string[] = [];
    try {
      if (sc.redTacticsJson) redTactics = JSON.parse(sc.redTacticsJson);
      if (sc.blueMitigationsJson) blueMitigations = JSON.parse(sc.blueMitigationsJson);
    } catch {
      // JSON parse fallback
    }

    return {
      found: true,
      scenario: {
        id: sc.id,
        name: sc.name,
        sector: sc.sector,
        description: sc.description,
        attackType: sc.attackType,
        adversaryProfile: sc.adversaryProfile,
        caseFileId: sc.caseFileId,
      },
      redTactics,
      blueMitigations,
    };
  });
