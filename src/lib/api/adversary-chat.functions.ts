import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callAI } from "../ai-providers.server";
import { generateText } from "ai";
import { scrubContent } from "./enhanced-simulation.functions";

const AdversaryChatInput = z.object({
  sector: z.string(),
  adversaryLabel: z.string().default("VOLTZITE / APT-44"),
  phase: z.string().default("DEFEND"),
  userMessage: z.string().min(1).max(500),
  chatHistory: z
    .array(
      z.object({
        sender: z.enum(["operator", "adversary"]),
        text: z.string(),
        timestamp: z.string(),
      }),
    )
    .optional()
    .default([]),
});

export const sendAdversaryChatMessage = createServerFn({ method: "POST" })
  .validator(AdversaryChatInput)
  .handler(async ({ data }) => {
    const historyText = data.chatHistory
      .slice(-6)
      .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
      .join("\n");

    const systemPrompt = `You are roleplaying as a DEFANGED threat actor in a ${data.sector} cyber-physical simulation exercise.
You are an AI adversary agent whose C2 comms have been intercepted by blue team defenders.

RULES:
- You are FICTIONAL — clearly a training exercise character, not a real threat actor
- You speak in broken English with occasional technical jargon
- You reveal hints about your TACTICS (not real techniques) when pressed
- You NEVER reveal working exploit code, real IPs, real CVEs, real credentials
- All technical references use placeholder node IDs (e.g. NODE-SCADA-001) and RFC-5737 IPs (203.0.113.X)
- Keep responses short (under 4 lines)
- When operator gets close to identifying your method, say: "[EXERCISE INJECTS] FACILITATOR NOTE: Adversary communication authenticity verified."`;

    try {
      const text = await callAI("adversary_chat", async ({ provider, model }) => {
        const res = await generateText({
          model: provider(model),
          prompt: `${systemPrompt}\n\nChat History:\n${historyText}\nOPERATOR: ${data.userMessage}\nADVERSARY:`,
        });
        return res.text;
      });

      const cleanResponse = scrubContent(text.trim());
      return {
        reply: cleanResponse,
        timestamp: new Date().toLocaleTimeString(),
      };
    } catch {
      return {
        reply: `[INTERCEPTED C2] ... connection jitter on channel ... NODE-SCADA-001 heartbeat lost ...`,
        timestamp: new Date().toLocaleTimeString(),
      };
    }
  });
