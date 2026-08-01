import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db/db";
import { operators, sessions, trainingRuns, auditLogs } from "../db/schema";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  createSession,
  getSessionOperator,
  deleteSession,
  setSessionCookie,
  getSessionCookie,
  deleteSessionCookie,
  cleanExpiredSessions,
} from "../auth.server";
import { checkRateLimit, LIMITS } from "../rate-limit.server";

// Standard session response interface
export interface OperatorSession {
  id?: string;
  callsign: string;
  badgeId: string;
  clearance: string;
  role: string;
  loggedIn: boolean;
}

const RegisterInput = z.object({
  callsign: z
    .string()
    .min(3, "Callsign must be at least 3 characters")
    .max(20, "Callsign must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Callsign can only contain letters, numbers, dashes, and underscores",
    ),
  email: z.string().email("Invalid email format"),
  badgeId: z.string().optional(),
  clearance: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerOperator = createServerFn({ method: "POST" })
  .validator(RegisterInput)
  .handler(async ({ data }) => {
    await cleanExpiredSessions();
    const rl = checkRateLimit("auth_register:global", LIMITS.auth_register);
    if (!rl.allowed) {
      throw new Error(
        `Rate limit exceeded for registration. Try again after ${new Date(rl.resetAt).toLocaleTimeString()}`,
      );
    }

    const uppercaseCallsign = data.callsign.toUpperCase();
    const existingCallsign = await db.query.operators.findFirst({
      where: eq(operators.callsign, uppercaseCallsign),
    });

    if (existingCallsign) {
      throw new Error("Callsign is already registered.");
    }

    const normalizedEmail = data.email.toLowerCase();
    const existingEmail = await db.query.operators.findFirst({
      where: eq(operators.email, normalizedEmail),
    });
    if (existingEmail) {
      throw new Error("Email address is already registered.");
    }

    const badgeId = data.badgeId
      ? data.badgeId.toUpperCase()
      : `OP-${Math.floor(1000 + Math.random() * 9000)}`;
    const clearance = data.clearance || "TS/SCI · RED LEVEL";
    const passwordHash = await hashPassword(data.password);
    const newId = crypto.randomUUID();

    await db.insert(operators).values({
      id: newId,
      callsign: uppercaseCallsign,
      email: normalizedEmail,
      badgeId,
      clearance,
      passwordHash,
      role: "operator",
      createdAt: new Date().toISOString(),
    });

    // Create session and set cookie automatically for auto-login
    const token = await createSession(newId);
    setSessionCookie(token);

    // Audit log successful registration
    try {
      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        trainingRunId: null,
        operatorId: newId,
        timestamp: new Date().toISOString(),
        eventType: "register",
        severity: "info",
        details: JSON.stringify({
          callsign: uppercaseCallsign,
          email: normalizedEmail,
          role: "operator",
        }),
      });
    } catch (err) {
      // Audit log error non-fatal
    }

    return {
      success: true,
      operator: {
        id: newId,
        callsign: uppercaseCallsign,
        email: normalizedEmail,
        badgeId,
        clearance,
        role: "operator",
        loggedIn: true,
      },
    };
  });

const LoginInput = z.object({
  email: z.string().min(1, "Email or callsign is required"),
  password: z.string().min(1, "Password is required"),
});

export const loginOperator = createServerFn({ method: "POST" })
  .validator(LoginInput)
  .handler(async ({ data }) => {
    await cleanExpiredSessions();
    const rl = checkRateLimit(`auth_login:${data.email.toLowerCase()}`, LIMITS.auth_login);
    if (!rl.allowed) {
      throw new Error(`Too many failed login attempts. Account temporarily locked.`);
    }

    const searchIdent = data.email.trim().toLowerCase();
    let operator = await db.query.operators.findFirst({
      where: eq(operators.email, searchIdent),
    });

    if (!operator) {
      operator = await db.query.operators.findFirst({
        where: eq(operators.callsign, searchIdent.toUpperCase()),
      });
    }

    if (!operator) {
      throw new Error("Invalid email or password.");
    }

    const valid = await verifyPassword(data.password, operator.passwordHash);
    if (!valid) {
      // Audit log failed login
      try {
        await db.insert(auditLogs).values({
          id: crypto.randomUUID(),
          trainingRunId: null,
          operatorId: operator.id,
          timestamp: new Date().toISOString(),
          eventType: "auth_failed",
          severity: "warn",
          details: JSON.stringify({ callsign: operator.callsign, reason: "invalid_password" }),
        });
      } catch (err) {
        // Audit log error non-fatal
      }
      throw new Error("Invalid email or password.");
    }

    // Create session token and set cookie
    const token = await createSession(operator.id);
    setSessionCookie(token);

    // Audit log successful login
    try {
      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        trainingRunId: null,
        operatorId: operator.id,
        timestamp: new Date().toISOString(),
        eventType: "login",
        severity: "info",
        details: JSON.stringify({ callsign: operator.callsign, role: operator.role }),
      });
    } catch (err) {
      // Audit log error non-fatal
    }

    return {
      operator: {
        id: operator.id,
        callsign: operator.callsign,
        email: operator.email || undefined,
        badgeId: operator.badgeId || "OP-0000",
        clearance: operator.clearance || "TS/SCI · RED LEVEL",
        role: operator.role,
        loggedIn: true,
      },
    };
  });

export const getOperatorSession = createServerFn({ method: "GET" }).handler(async () => {
  const token = getSessionCookie();
  const operator = await getSessionOperator(token);

  if (!operator) {
    return {
      id: undefined,
      callsign: "GUEST OPERATOR",
      badgeId: "OP-0000",
      clearance: "UNCLASSIFIED",
      role: "guest",
      loggedIn: false,
    };
  }

  return {
    id: operator.id,
    callsign: operator.callsign,
    badgeId: operator.badgeId || "OP-0000",
    clearance: operator.clearance || "TS/SCI · RED LEVEL",
    role: operator.role,
    loggedIn: true,
  };
});

export const getCurrentOperator = getOperatorSession;

export const logoutOperator = createServerFn({ method: "POST" }).handler(async () => {
  const token = getSessionCookie();
  if (token) {
    await deleteSession(token);
  }
  deleteSessionCookie();
  return { ok: true, success: true };
});

export const deleteOperatorAccount = createServerFn({ method: "POST" }).handler(async () => {
  const token = getSessionCookie();
  const operator = await getSessionOperator(token);

  if (!operator) {
    deleteSessionCookie();
    throw new Error("Unauthorized.");
  }

  // Delete operator (cascades session delete)
  await db.delete(operators).where(eq(operators.id, operator.id));
  deleteSessionCookie();
  return { success: true };
});

export const exportOperatorData = createServerFn({ method: "GET" }).handler(async () => {
  const token = getSessionCookie();
  const operator = await getSessionOperator(token);

  if (!operator) {
    throw new Error("Unauthorized");
  }

  const runs = await db.query.trainingRuns.findMany({
    where: eq(trainingRuns.operatorId, operator.id),
  });

  return {
    operator: {
      callsign: operator.callsign,
      email: operator.email,
      badgeId: operator.badgeId,
      clearance: operator.clearance,
      role: operator.role,
      createdAt: operator.createdAt,
    },
    trainingRuns: runs,
    exportTimestamp: new Date().toISOString(),
    complianceNotice:
      "Exported in accordance with GDPR Article 20, DPDP Section 12, CCPA/CPRA, and PIPEDA.",
  };
});
