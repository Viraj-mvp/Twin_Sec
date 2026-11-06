import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createOpenRouterGateway(apiKey: string) {
  return createOpenAICompatible({
    name: "openrouter",
    baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://twinsec.app",
      "X-Title": "TwinSec",
    },
  });
}

export function createGeminiGateway(apiKey: string) {
  return createOpenAICompatible({
    name: "gemini",
    baseURL:
      process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai/",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

export function createGroqGateway(apiKey: string) {
  return createOpenAICompatible({
    name: "groq",
    baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}
