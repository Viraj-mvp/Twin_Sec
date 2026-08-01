/**
 * adaptive-engine.functions.ts
 *
 * AI-Adaptive Decision Engine & Incident Explainability Server Functions for TwinSec.
 * Routes LLM requests through the fast Groq provider (Llama 3.3 70B Versatile),
 * enforces 3-second hard timeout caps, and falls back to deterministic decision trees.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { callAI } from "../ai-providers.server";
import { getThreatActor } from "../../data/threat-actors";
import {
  getFallbackAdversaryMove,
  getFallbackDefenderOptions,
} from "../../data/adversary-fallback-tree";

const AdversaryMoveSchema = z.object({
  action: z.enum(["lateral_move", "exfiltrate", "persist", "escalate", "detonate", "withdraw"]),
  targetNodeId: z.string(),
  reasoning: z.string(),
  detectionRisk: z.enum(["low", "medium", "high"]),
  confidenceLevel: z.number().min(0).max(1),
});

const ExplainAnomalySchema = z.object({
  summary: z.string(),
  rootCauseNodeId: z.string(),
  causalChainSteps: z.array(z.string()),
  recommendedAction: z.string(),
});

export const generateAdversaryMove = createServerFn({ method: "POST" })
  .validator(
    z.object({
      sector: z.string(),
      threatActorId: z.string(),
      currentPhase: z.string(),
      compromisedNodes: z.array(z.string()),
      elapsedSeconds: z.number(),
    }),
  )
  .handler(
    async ({
      data,
    }: {
      data: {
        sector: string;
        threatActorId: string;
        currentPhase: string;
        compromisedNodes: string[];
        elapsedSeconds: number;
      };
    }) => {
      const actor = getThreatActor(data.threatActorId);

      try {
        // 3-second hard timeout cap for sub-second responsiveness
        const result = await Promise.race([
          callAI("adversary_chat", async (cfg) => {
            const prompt = `You are playing as threat actor ${actor?.name ?? "APT"} in an OT simulation.
Sector: ${data.sector}
Phase: ${data.currentPhase}
Breached Nodes: ${data.compromisedNodes.join(", ") || "none"}
Psychology: ${actor?.psychologicalProfile.keyInsight ?? "Calculated strategic attack"}

Select the single best next action in JSON format:
{
  "action": "lateral_move",
  "targetNodeId": "plc-1",
  "reasoning": "1-2 sentence in-character reasoning",
  "detectionRisk": "medium",
  "confidenceLevel": 0.95
}`;
            const res = await generateText({
              model: cfg.provider(cfg.model),
              prompt,
            });
            const jsonMatch = res.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON in response");
            return AdversaryMoveSchema.parse(JSON.parse(jsonMatch[0]));
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("AI timeout >3s")), 3000),
          ),
        ]);

        return { success: true, move: result, source: "ai" as const };
      } catch {
        // Transparent fallback execution <10ms
        const fallback = getFallbackAdversaryMove(
          data.sector,
          data.currentPhase,
          data.compromisedNodes.length,
        );
        return { success: true, move: fallback, source: "fallback" as const };
      }
    },
  );

export const explainIncidentAnomaly = createServerFn({ method: "POST" })
  .validator(
    z.object({
      sector: z.string(),
      targetAssetId: z.string(),
      eventTitle: z.string(),
      eventDesc: z.string(),
    }),
  )
  .handler(
    async ({
      data,
    }: {
      data: { sector: string; targetAssetId: string; eventTitle: string; eventDesc: string };
    }) => {
      try {
        const result = await Promise.race([
          callAI("diagnostic_questions", async (cfg) => {
            const prompt = `Analyze this industrial cyber incident anomaly:
Sector: ${data.sector}
Asset: ${data.targetAssetId}
Event: ${data.eventTitle}
Details: ${data.eventDesc}

Provide a structured explanation in JSON:
{
  "summary": "1-2 sentence plain-language summary of what caused the anomaly",
  "rootCauseNodeId": "${data.targetAssetId}",
  "causalChainSteps": ["Step 1: Credential replay", "Step 2: PLC logic bypass"],
  "recommendedAction": "Action to contain the outage"
}`;
            const res = await generateText({
              model: cfg.provider(cfg.model),
              prompt,
            });
            const jsonMatch = res.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON in response");
            return ExplainAnomalySchema.parse(JSON.parse(jsonMatch[0]));
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("AI timeout >3s")), 3000),
          ),
        ]);

        return { success: true, explanation: result, source: "ai" as const };
      } catch {
        return {
          success: true,
          explanation: {
            summary: `Setpoint anomaly on ${data.targetAssetId.toUpperCase()} caused by unauthorized command write over Modbus TCP.`,
            rootCauseNodeId: data.targetAssetId,
            causalChainSteps: [
              "1. Phished Engineering Workstation credentials",
              "2. Lateral traversal across Purdue Ring 2 SCADA HMI",
              `3. Setpoint modification on target ${data.targetAssetId.toUpperCase()}`,
            ],
            recommendedAction:
              "Execute network isolation on target node and deploy verified firmware patch.",
          },
          source: "fallback" as const,
        };
      }
    },
  );
