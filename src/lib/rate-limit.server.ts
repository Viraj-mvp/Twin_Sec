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

export function checkRateLimit(
  key: string,
  limit: RateLimit,
): { limited: boolean; allowed: boolean; remaining: number; reset: number; resetAt: number } {
  const now = Date.now();

  // Evict expired buckets so the store can't leak memory.
  for (const [k, v] of Array.from(store.entries())) {
    if (now > v.resetAt) store.delete(k);
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
