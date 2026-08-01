import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export type AITask =
  | "terminal_command"
  | "espionage_briefing"
  | "debrief_scorecard"
  | "hint"
  | "simulation_narration"
  | "adversary_chat"
  | "role_briefing"
  | "phase_guidance"
  | "diagnostic_questions"
  | "attack_generator";

// ── Timeout helper ──────────────────────────────────────────────
// The Vercel AI SDK has NO built-in request timeout. A slow/free-tier
// provider would hang the call (and the UI) for minutes. We cap every
// AI call so the demo never freezes on a pending provider response.
export class AITimeoutError extends Error {
  constructor(ms: number) {
    super(`AI request timed out after ${ms}ms`);
    this.name = "AITimeoutError";
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new AITimeoutError(ms)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

const PRIMARY_TIMEOUT_MS = 15000;
const FALLBACK_TIMEOUT_MS = 20000;

export function hasValidKeys(): boolean {
  return Boolean(
    process.env.GROQ_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.OLLAMA_BASE_URL,
  );
}

export function getProviderForTask(task: AITask) {
  // If Groq API key is present, prefer Groq for fast 70B inference
  if (process.env.GROQ_API_KEY) {
    return {
      provider: createOpenAICompatible({
        name: "groq",
        baseURL: "https://api.groq.com/openai/v1",
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      }),
      model: "llama-3.3-70b-versatile",
      maxTokens: 2000,
    };
  }

  switch (task) {
    case "espionage_briefing":
    case "adversary_chat":
    case "role_briefing":
      if (process.env.GEMINI_API_KEY) {
        return {
          provider: createOpenAICompatible({
            name: "google",
            baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
            headers: { Authorization: `Bearer ${process.env.GEMINI_API_KEY}` },
          }),
          model: "gemini-2.0-flash",
          maxTokens: 4000,
        };
      }
      return getFallbackProvider();
    default:
      return getFallbackProvider();
  }
}

export function getFallbackProvider() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      provider: createOpenAICompatible({
        name: "openrouter",
        baseURL: "https://openrouter.ai/api/v1",
        headers: { Authorization: "Bearer unconfigured" },
      }),
      model: "meta-llama/llama-3.1-8b-instruct",
      maxTokens: 1000,
    };
  }
  return {
    provider: createOpenAICompatible({
      name: "openrouter",
      baseURL: "https://openrouter.ai/api/v1",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://twinsec.io",
        "X-Title": "TwinSec Cyber Range",
      },
    }),
    model: "meta-llama/llama-3.1-8b-instruct",
    maxTokens: 1000,
  };
}

export function getOllamaProvider() {
  const baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
  const model = process.env.OLLAMA_MODEL || "qwen2.5:7b";
  return {
    provider: createOpenAICompatible({
      name: "ollama",
      baseURL,
      headers: {},
    }),
    model,
    maxTokens: 1400,
  };
}

function getFallbackProviders(): Array<ReturnType<typeof getProviderForTask>> {
  const list: Array<ReturnType<typeof getProviderForTask>> = [];
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (apiKey) list.push(getFallbackProvider());
  if (process.env.OLLAMA_BASE_URL) list.push(getOllamaProvider());
  return list;
}

// Any of these mean "try the fallback provider"; anything else (e.g. a
// schema/validation problem) is rethrown as-is.
function isRetryable(err: unknown): boolean {
  const e = err as { status?: number; code?: string; name?: string };
  if (e?.name === "AITimeoutError") return true;
  if (e?.status === undefined && e?.code === undefined) return true; // network/DNS/unknown → retry
  return (
    e?.status === 401 ||
    e?.status === 403 ||
    e?.status === 429 ||
    e?.status === 500 ||
    e?.status === 502 ||
    e?.status === 503 ||
    e?.status === 504 ||
    e?.code === "ENOTFOUND" ||
    e?.code === "ECONNREFUSED"
  );
}

export class AIUnavailableError extends Error {
  constructor(task: string, cause?: unknown) {
    super(`AI generation unavailable for "${task}"`);
    this.name = "AIUnavailableError";
    this.cause = cause as Error | undefined;
  }
}

export async function callAI<T>(
  task: AITask,
  generateFn: (providerConfig: ReturnType<typeof getProviderForTask>) => Promise<T>,
): Promise<T> {
  // Instant bypass if no valid keys are present to avoid network timeouts & lag
  if (!hasValidKeys()) {
    throw new AIUnavailableError(task, new Error("No AI API keys configured"));
  }

  // Build an ordered provider chain
  const primary = getProviderForTask(task);
  const chain: Array<{ label: string; cfg: ReturnType<typeof getProviderForTask> }> = [
    { label: "primary", cfg: primary },
  ];
  for (const p of getFallbackProviders()) {
    if (p.provider.name !== primary.provider.name) {
      chain.push({ label: p.provider.name, cfg: p });
    }
  }

  let lastErr: unknown;
  for (const { label, cfg } of chain) {
    try {
      return await withTimeout(generateFn(cfg), PRIMARY_TIMEOUT_MS);
    } catch (err) {
      if (!isRetryable(err)) throw err;
      lastErr = err;
    }
  }
  throw new AIUnavailableError(task, lastErr);
}

function describeErr(err: unknown): string {
  const e = err as { status?: number; code?: string; name?: string; message?: string };
  return e?.status ? `HTTP ${e.status}` : (e?.name ?? e?.code ?? e?.message ?? "unknown");
}
