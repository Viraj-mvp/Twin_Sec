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

let lastRateLimitCleanup = 0;

function isRateLimited(request: Request): { limited: boolean; remaining: number; reset: number } {
  const url = new URL(request.url);
  const path = url.pathname;

  // Bypass rate limiting for internal dev bundler paths and static assets
  if (
    path.startsWith("/@") ||
    path.startsWith("/src/") ||
    path.startsWith("/node_modules/") ||
    path.startsWith("/assets/") ||
    path.endsWith(".js") ||
    path.endsWith(".css") ||
    path.endsWith(".svg") ||
    path.endsWith(".ico") ||
    path.endsWith(".jpg") ||
    path.endsWith(".png")
  ) {
    return { limited: false, remaining: 999, reset: 0 };
  }

  const config = getRateLimitConfig(path);

  // Get client identifier (prioritizing trusted reverse proxy headers; rightmost hop for X-Forwarded-For)
  const cfIp = request.headers.get("cf-connecting-ip");
  const realIp = request.headers.get("x-real-ip");
  const forwarded = request.headers.get("x-forwarded-for");
  let clientId = "internal-client";
  if (cfIp) {
    clientId = cfIp.trim();
  } else if (realIp) {
    clientId = realIp.trim();
  } else if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    clientId = parts[parts.length - 1] || "internal-client";
  }
  const key = `${clientId}:${path}`;

  const now = Date.now();
  // Throttled cleanup: evict expired entries at most once every 30 seconds
  if (now - lastRateLimitCleanup > 30000) {
    lastRateLimitCleanup = now;
    for (const [k, v] of rateLimitStore) {
      if (now > v.resetTime) rateLimitStore.delete(k);
    }
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
async function normalizeCatastrophicSsrResponse(
  response: Response,
  request?: Request,
): Promise<Response> {
  // If the client aborted the connection (e.g. quick tab navigation, reload, socket close),
  // return an empty 499 response gracefully without logging false catastrophic 500 crashes.
  if (request?.signal?.aborted) {
    consumeLastCapturedError();
    return new Response(null, { status: 499 });
  }

  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();

  // If the SSR stream aborted due to client reload or socket disconnection, handle gracefully
  if (
    request?.signal?.aborted ||
    body.includes('"ECONNRESET"') ||
    body.includes('"aborted"') ||
    body.includes("ERR_STREAM_PREMATURE_CLOSE") ||
    body.includes("ERR_HTTP_REQUEST_ABORTED")
  ) {
    consumeLastCapturedError();
    return new Response(null, { status: 499 });
  }

  if (!body.includes('"unhandled":true')) {
    return response;
  }

  const capturedErr = consumeLastCapturedError() as
    { message?: string; code?: string; cause?: { code?: string; message?: string } } | undefined;
  const errMsg = String(capturedErr?.message || capturedErr || "");
  const errCode = capturedErr?.code || capturedErr?.cause?.code;
  const causeMsg = String(capturedErr?.cause?.message || "");

  // Ignore client-side connection resets / stream aborts
  if (
    request?.signal?.aborted ||
    errCode === "ECONNRESET" ||
    errCode === "ECANCELED" ||
    errCode === "ERR_HTTP_REQUEST_ABORTED" ||
    errCode === "ERR_STREAM_PREMATURE_CLOSE" ||
    errMsg.includes("aborted") ||
    errMsg.includes("ECONNRESET") ||
    causeMsg.includes("aborted") ||
    causeMsg.includes("ECONNRESET")
  ) {
    return new Response(null, { status: 499 });
  }

  console.error(capturedErr ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // Handle client-aborted requests early
      if (request.signal?.aborted) {
        return new Response(null, { status: 499 });
      }

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
      const normalizedResponse = await normalizeCatastrophicSsrResponse(response, request);

      // Step 4: Add security headers
      const headers = new Headers(normalizedResponse.headers);

      // Content Security Policy (CSP) — Universal Cross-Browser Compatibility (Chrome, Safari, Firefox, Edge)
      headers.set(
        "Content-Security-Policy",
        [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
          "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
          "img-src 'self' data: https: http: blob:",
          "font-src 'self' https://fonts.gstatic.com data:",
          "connect-src 'self' ws: wss: http: https: https://api.openai.com https://openrouter.ai https://api.groq.com https://api.cerebras.ai https://generativelanguage.googleapis.com",
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
      const errStr = String(error || "");
      const errCode =
        (error as { code?: string; cause?: { code?: string } })?.code ||
        (error as { cause?: { code?: string } })?.cause?.code;
      if (
        request.signal?.aborted ||
        errCode === "ECONNRESET" ||
        errCode === "ECANCELED" ||
        errCode === "ERR_STREAM_PREMATURE_CLOSE" ||
        errCode === "ERR_HTTP_REQUEST_ABORTED" ||
        errStr.includes("aborted") ||
        errStr.includes("ECONNRESET")
      ) {
        return new Response(null, { status: 499 });
      }
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
