// In-memory rate limiter (development). In production use a shared
// store (Redis/Upstash) so limits hold across server instances.
// Entries are evicted when their window expires so the Map can't
// grow without bound under traffic.

export interface RateLimit {
  limit: number;
  windowMs: number;
}

export const LIMITS: Record<string, RateLimit> = {
  auth_register: { limit: 10, windowMs: 60_000 },
  auth_login: { limit: 20, windowMs: 60_000 },
  ai_terminal: { limit: 30, windowMs: 60_000 },
};

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

import { getRequestHeader } from "@tanstack/react-start/server";

const IPV4_REGEX =
  /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/;
const IPV6_REGEX = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$/;

function isValidIp(ip: string): boolean {
  return IPV4_REGEX.test(ip) || IPV6_REGEX.test(ip);
}

export function getClientIp(): string {
  try {
    const cf = getRequestHeader("cf-connecting-ip");
    if (cf && isValidIp(cf.trim())) return cf.trim();

    const real = getRequestHeader("x-real-ip");
    if (real && isValidIp(real.trim())) return real.trim();

    const forwarded = getRequestHeader("x-forwarded-for");
    if (forwarded) {
      const candidates = forwarded
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .reverse(); // scan right-to-left: closest trusted reverse proxy hop
      for (const ip of candidates) {
        if (isValidIp(ip)) {
          return ip;
        }
      }
    }
  } catch {
    // Outside request context
  }
  return "127.0.0.1";
}

export function checkRateLimit(
  key: string,
  limit: RateLimit,
): { limited: boolean; allowed: boolean; remaining: number; reset: number; resetAt: number } {
  const now = Date.now();

  // Evict expired buckets when store grows to avoid memory leak
  if (store.size > 50) {
    for (const [k, v] of store.entries()) {
      if (now > v.resetAt) store.delete(k);
    }
  }

  let bucket = store.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + limit.windowMs };
    store.set(key, bucket);
  }

  bucket.count += 1;
  const limited = bucket.count > limit.limit;
  const remaining = Math.max(0, limit.limit - bucket.count);
  const reset = Math.ceil(bucket.resetAt / 1000);

  return {
    limited,
    allowed: !limited,
    remaining,
    reset,
    resetAt: bucket.resetAt,
  };
}
