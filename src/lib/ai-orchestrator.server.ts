import { generateText } from "ai";
import {
  getProviderForTask,
  getFallbackProvider,
  AITask,
  withTimeout,
  AITimeoutError,
} from "./ai-providers.server";
import { SectorId } from "../data/scenarios";
import { SimPhase, TERMINAL_TEMPLATES } from "../data/terminal-templates";
import { log } from "./logger";

interface CacheEntry {
  value: string;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();
const AI_CACHE_MAX = 500; // hard cap — without eviction this Map grows unbounded under traffic

function cacheKey(task: string, input: object): string {
  return `${task}:${JSON.stringify(input)}`;
}

function getCached(key: string): string | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached(key: string, value: string, ttlMs = 5 * 60 * 1000) {
  // Evict the oldest entry (FIFO by insertion order) when over the cap,
  // so the process can't leak RAM on a stream of distinct prompts.
  if (cache.size >= AI_CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export async function callAIWithFallback(
  task: AITask,
  prompt: { system: string; user: string },
  maxTokens: number,
): Promise<string> {
  const key = cacheKey(task, prompt);
  const cached = getCached(key);
  if (cached) return cached;

  const providerConfig = getProviderForTask(task);

  try {
    const { text } = await withTimeout(
      generateText({
        model: providerConfig.provider(providerConfig.model),
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        maxOutputTokens: maxTokens,
      }),
      20000,
    );
    setCached(key, text);
    return text;
  } catch (err: unknown) {
    const errorObj = err as { status?: number };
    if (errorObj?.status === 429 || errorObj?.status === 503 || errorObj?.status === 500) {
      console.warn(
        `[AI Orchestrator] ${task} primary failed (${errorObj.status}), using OpenRouter fallback`,
      );
      const fallback = getFallbackProvider();
      const { text } = await withTimeout(
        generateText({
          model: fallback.provider(fallback.model),
          messages: [
            { role: "system", content: prompt.system },
            { role: "user", content: prompt.user },
          ],
          maxOutputTokens: Math.min(maxTokens, 1000),
        }),
        20000,
      );
      return text;
    }
    throw err;
  }
}

export async function callAIParallel(
  calls: Array<{
    task: AITask;
    prompt: { system: string; user: string };
    maxTokens: number;
    fallbackValue?: string;
  }>,
): Promise<(string | null)[]> {
  const promises = calls.map(({ task, prompt, maxTokens, fallbackValue }) =>
    callAIWithFallback(task, prompt, maxTokens).catch((err) => {
      log.error(`[AI Orchestrator] ${task} failed:`, err.message);
      return fallbackValue ?? null;
    }),
  );
  const results = await Promise.allSettled(promises);
  return results.map((r) => (r.status === "fulfilled" ? r.value : null));
}

export async function preGeneratePhaseContent(
  sector: SectorId,
  nextPhase: SimPhase,
  nodeIds: string[],
): Promise<void> {
  const topNodes = nodeIds.slice(0, 3);

  await callAIParallel(
    topNodes.map((nodeId) => ({
      task: "terminal_command" as AITask,
      prompt: {
        system: "Generate defanged industrial terminal output for training.",
        user: `Sector: ${sector}, Phase: ${nextPhase}, Node: ${nodeId}`,
      },
      maxTokens: 600,
      fallbackValue:
        TERMINAL_TEMPLATES[nextPhase]?.[sector]?.[nodeId] ||
        TERMINAL_TEMPLATES[nextPhase]?.[sector]?.["default"] ||
        `[DEFANGED] ${sector.toUpperCase()} > scan ${nodeId}`,
    })),
  );
}
