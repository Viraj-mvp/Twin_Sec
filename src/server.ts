import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// In-memory rate limiter (for development; in production, use a distributed store like Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration per endpoint path pattern
const RATE_LIMIT_CONFIG: Record<string, { limit: number; windowMs: number }> = {
  "/_rpc/generateTerminalCommand": { limit: 30, windowMs: 60000 }, // 30 requests per minute
  "/_rpc/generateEspionageBriefing": { limit: 10, windowMs: 60000 }, // 10 requests per minute
  "/_rpc/generateDynamicAttack": { limit: 10, windowMs: 60000 }, // 10 requests per minute
  default: { limit: 100, windowMs: 60000 }, // 100 requests per minute for everything else
};

function getRateLimitConfig(path: string): { limit: number; windowMs: number } {
  for (const [pattern, config] of Object.entries(RATE_LIMIT_CONFIG)) {
    if (path.includes(pattern)) {
      return config;
    }
  }
  return RATE_LIMIT_CONFIG.default;
}

function isRateLimited(request: Request): { limited: boolean; remaining: number; reset: number } {
  const url = new URL(request.url);
  const path = url.pathname;
  const config = getRateLimitConfig(path);

  // Get client identifier (in production, use X-Forwarded-For or similar if behind a proxy)
  const clientId = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown-client";
  const key = `${clientId}:${path}`;

  const now = Date.now();
  // Evict expired entries so the in-memory store can't grow without
  // bound under sustained traffic (each client+path is a key).
  for (const [k, v] of rateLimitStore) {
    if (now > v.resetTime) rateLimitStore.delete(k);
  }
  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + config.windowMs };
    rateLimitStore.set(key, entry);
  }

  entry.count++;
  const remaining = Math.max(0, config.limit - entry.count);
  const reset = Math.ceil(entry.resetTime / 1000);

  return {
    limited: entry.count > config.limit,
    remaining,
    reset,
  };
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // Step 1: Check rate limit
      const rateLimit = isRateLimited(request);
      if (rateLimit.limited) {
        return new Response(JSON.stringify({ error: "Too Many Requests" }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": String(getRateLimitConfig(new URL(request.url).pathname).limit),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(rateLimit.reset),
          },
        });
      }

      // Step 2: Get server entry and handle request
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);

      // Step 3: Normalize SSR errors
      const normalizedResponse = await normalizeCatastrophicSsrResponse(response);

      // Step 4: Add security headers
      const headers = new Headers(normalizedResponse.headers);

      // Content Security Policy (CSP)
      headers.set(
        "Content-Security-Policy",
        [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
          "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
          "img-src 'self' data: https: blob:",
          "font-src 'self' https://fonts.gstatic.com data:",
          "connect-src 'self' https://api.openai.com https://openrouter.ai https://api.groq.com https://api.cerebras.ai https://generativelanguage.googleapis.com",
          "frame-src 'none'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; "),
      );

      // Other security headers
      headers.set("X-Frame-Options", "DENY");
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("X-XSS-Protection", "1; mode=block");
      headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

      // Add rate limit headers
      headers.set(
        "X-RateLimit-Limit",
        String(getRateLimitConfig(new URL(request.url).pathname).limit),
      );
      headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
      headers.set("X-RateLimit-Reset", String(rateLimit.reset));

      return new Response(normalizedResponse.body, {
        status: normalizedResponse.status,
        statusText: normalizedResponse.statusText,
        headers,
      });
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
