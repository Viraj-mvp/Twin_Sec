import bcrypt from "bcryptjs";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import { db, schema } from "./db";
import { eq, and, gt, lt } from "drizzle-orm";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12); // bcrypt work factor 12 for production
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(operatorId: string): Promise<string> {
  const token = crypto.randomUUID() + "-" + crypto.randomUUID(); // 72 chars
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  await db.insert(schema.sessions).values({
    id: crypto.randomUUID(),
    token,
    operatorId,
    expiresAt,
    createdAt: new Date().toISOString(),
  });
  return token;
}

export async function getSessionOperator(token: string | undefined) {
  if (!token) return null;
  const now = new Date().toISOString();
  const [row] = await db
    .select({ operator: schema.operators })
    .from(schema.sessions)
    .innerJoin(schema.operators, eq(schema.sessions.operatorId, schema.operators.id))
    .where(and(eq(schema.sessions.token, token), gt(schema.sessions.expiresAt, now)))
    .limit(1);

  return row?.operator ?? null;
}

export async function deleteSession(token: string) {
  await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
}

export async function cleanExpiredSessions() {
  const now = new Date().toISOString();
  await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, now));
}

const COOKIE_NAME = "twinsec_session";

// Self-contained cookie serialization (no external cookie lib needed).
function serializeCookie(
  name: string,
  value: string,
  opts: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
    maxAge?: number;
    path?: string;
    expires?: Date;
  } = {},
): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.expires) parts.push(`Expires=${opts.expires.toUTCString()}`);
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  return parts.join("; ");
}

// NOTE: TanStack Start serverFns do NOT populate Nitro's event
// AsyncLocalStorage, so `getEvent()` throws "outside request context".
// The documented, reliable cookie API for serverFns is
// `getRequestHeader` / `setResponseHeader` from `@tanstack/react-start/server`
// (this writes the Set-Cookie onto the actual HTTP response the browser
// receives, so the session persists across requests).
export function setSessionCookie(token: string) {
  try {
    const secure = process.env.NODE_ENV === "production";
    setResponseHeader(
      "Set-Cookie",
      serializeCookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        path: "/",
      }),
    );
  } catch (err) {
    console.warn("Unable to set session cookie:", err);
  }
}

export function getSessionCookie(): string | undefined {
  try {
    const header = getRequestHeader("cookie");
    if (!header) return undefined;
    const cookies: Record<string, string> = {};
    for (const pair of header.split(";")) {
      const idx = pair.indexOf("=");
      if (idx === -1) continue;
      const k = pair.slice(0, idx).trim();
      const v = pair.slice(idx + 1).trim();
      cookies[k] = decodeURIComponent(v);
    }
    return cookies[COOKIE_NAME];
  } catch {
    return undefined;
  }
}

export function deleteSessionCookie() {
  try {
    setResponseHeader(
      "Set-Cookie",
      serializeCookie(COOKIE_NAME, "", {
        httpOnly: true,
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      }),
    );
  } catch {
    // Ignore context errors
  }
}
