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
      events:
        (parsedScenario.events as Array<Record<string, string | number | boolean>>) || [],
      decisions:
        (parsedScenario.decisions as Array<Record<string, string | number | boolean>>) || [],
      savedToDb: saveToDb,
    };
  });
