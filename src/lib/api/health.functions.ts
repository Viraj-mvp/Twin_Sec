import { createServerFn } from "@tanstack/react-start";
import { db } from "../db/db";
import { operators, trainingRuns } from "../db/schema";
import { count } from "drizzle-orm";
import { getProviderForTask, AITask, withTimeout } from "../ai-providers.server";
import { generateText } from "ai";

const HEALTH_PING_TIMEOUT_MS = 6000;

export interface SystemHealthReport {
  status: "HEALTHY" | "DEGRADED" | "CRITICAL";
  timestamp: string;
  database: {
    connected: boolean;
    operatorCount: number;
    trainingRunCount: number;
  };
  aiGateway: Array<{
    name: string;
    status: "ok" | "error";
    latencyMs?: number;
    error?: string;
  }>;
  version: string;
}

export const runFullSystemHealthCheck = createServerFn({ method: "GET" }).handler(
  async (): Promise<SystemHealthReport> => {
    let dbStatus = false;
    let operatorCount = 0;
    let trainingRunCount = 0;

    try {
      const ops = await db.select({ value: count() }).from(operators);
      const runs = await db.select({ value: count() }).from(trainingRuns);
      operatorCount = ops[0]?.value || 0;
      trainingRunCount = runs[0]?.value || 0;
      dbStatus = true;
    } catch {
      dbStatus = false;
    }

    const providers = [
      { name: "Groq", task: "terminal_command" as AITask, ping: "Reply with: OK" },
      { name: "Cerebras", task: "debrief_scorecard" as AITask, ping: "Reply with: OK" },
      { name: "Gemini", task: "espionage_briefing" as AITask, ping: "Reply with: OK" },
      { name: "OpenRouter", task: "terminal_command" as AITask, ping: "Reply with: OK" },
    ];

    const aiResults = await Promise.allSettled(
      providers.map(async (p) => {
        const start = Date.now();
        const config = getProviderForTask(p.task);
        await withTimeout(
          generateText({
            model: config.provider(config.model),
            messages: [{ role: "user", content: p.ping }],
            maxOutputTokens: 5,
          }),
          HEALTH_PING_TIMEOUT_MS,
        );
        return { name: p.name, status: "ok" as const, latencyMs: Date.now() - start };
      }),
    );

    const aiReport = aiResults.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : {
            name: providers[i].name,
            status: "error" as const,
            error: (r.reason as Error)?.message ?? String(r.reason),
          },
    );

    const anyAiOk = aiReport.some((a) => a.status === "ok");
    const overallStatus = dbStatus && anyAiOk ? "HEALTHY" : dbStatus ? "DEGRADED" : "CRITICAL";

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      database: {
        connected: dbStatus,
        operatorCount,
        trainingRunCount,
      },
      aiGateway: aiReport,
      version: "2026.06.11-viva-build",
    };
  },
);
