import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callAI, withTimeout } from "../ai-providers.server";
import { generateText } from "ai";
import { SectorId } from "../../data/scenarios";
import { SimPhase } from "../../data/terminal-templates";
import { scrubContent } from "./enhanced-simulation.functions";

// Bounded, evicting cache — without a cap this Map grows forever
// across sessions (every event/sector/phase/node combo), leaking RAM.
const NARRATION_CACHE_MAX = 200;
const narrationCache = new Map<string, string>();

function cacheSet(key: string, value: string) {
  if (narrationCache.size >= NARRATION_CACHE_MAX) {
    const oldest = narrationCache.keys().next().value;
    if (oldest !== undefined) narrationCache.delete(oldest);
  }
  narrationCache.set(key, value);
}

const NARRATION_TIMEOUT_MS = 15000;

const NarrationInput = z.object({
  event: z.object({
    t: z.number(),
    tag: z.string(),
    title: z.string(),
    desc: z.string(),
    node: z.string(),
  }),
  sector: z.string(),
  phase: z.string(),
  compromisedNodeCount: z.number().default(0),
});

export const generateEventNarration = createServerFn({ method: "POST" })
  .validator(NarrationInput)
  .handler(async ({ data }) => {
    const cacheKey = `${data.sector}:${data.phase}:${data.event.tag}:${data.event.node}`;
    if (narrationCache.has(cacheKey)) {
      return { narration: narrationCache.get(cacheKey)! };
    }

    try {
      const text = await callAI("simulation_narration", async ({ provider, model }) => {
        const res = await withTimeout(
          generateText({
            model: provider(model),
            prompt: `You are the TwinSec Range Announcer for a ${data.sector} cyber-physical simulation.
When an attack event occurs, generate ONE punchy sentence (max 25 words) describing what just happened in physical/operational terms — NOT technical/cyber terms. Industrial emergency radio tone.
Event: ${data.event.title} — ${data.event.desc} (Node: ${data.event.node}, Compromised: ${data.compromisedNodeCount})`,
          }),
          NARRATION_TIMEOUT_MS,
        );
        return res.text;
      });

      const cleanNarration = scrubContent(text.replace(/"/g, "").trim());
      cacheSet(cacheKey, cleanNarration);
      return { narration: cleanNarration };
    } catch {
      const fallback = `ALERT: Critical incident delta recorded at ${data.event.node.toUpperCase()}. Physical systems entering unstable state.`;
      return { narration: fallback };
    }
  });
