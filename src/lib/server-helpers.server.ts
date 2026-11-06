import { db } from "./db/db.server";
import { getSessionCookie } from "./auth.server";
import { auditLogs, trainingRuns, sessions } from "./db/schema";
import { eq } from "drizzle-orm";

import crypto from "node:crypto";

// ── Auth & Audit Helpers ──────────────────────────────────────────

function timingSafeEqualStr(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function getAuthOperatorId(): Promise<string | null> {
  const token = getSessionCookie();
  if (!token) return null;

  const s = await db.query.sessions.findFirst({
    where: (fields) => eq(fields.token, token),
  });

  if (!s || new Date(s.expiresAt) < new Date()) {
    return null;
  }

  // Double check timing-safe equality to defend against timing side-channels
  if (!timingSafeEqualStr(s.token, token)) {
    return null;
  }

  return s.operatorId;
}

function sanitizeAuditDetails(val: unknown): unknown {
  if (typeof val === "string") {
    return val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").slice(0, 5000);
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeAuditDetails);
  }
  if (val && typeof val === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val)) {
      cleaned[k] = sanitizeAuditDetails(v);
    }
    return cleaned;
  }
  return val;
}

export async function logAudit(
  trainingRunId: string | null | undefined,
  eventType: string,
  details: unknown,
  operatorId: string | null = null,
) {
  const validRunId = trainingRunId && trainingRunId !== "none" ? trainingRunId : undefined;
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    trainingRunId: validRunId,
    operatorId: operatorId ?? undefined,
    timestamp: new Date().toISOString(),
    eventType,
    details: JSON.stringify(sanitizeAuditDetails(details)),
  });
}

export async function logAuditEvent(trainingRunId: string, eventType: string, details: unknown) {
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    trainingRunId: trainingRunId !== "none" ? trainingRunId : undefined,
    timestamp: new Date().toISOString(),
    eventType,
    details: JSON.stringify(sanitizeAuditDetails(details)),
  });
}

// ── 18 Authentic Industrial Cyber-Physical Benchmark Drills ──────

export const BENCHMARK_DRILLS = [
  {
    id: "TR-BENCH-01",
    sector: "power",
    adversary: "Sandworm / Electrum (Industroyer2)",
    branch: "Branch A: Zero Loss Substation Air-Gap",
    mwShed: 120,
    mttd: 42,
    mttr: 180,
    cost: 180,
    score: 94,
    shareUrl: "/simulation?sector=power",
    attackType: "disruption",
    adversaryProfile: "nation-state",
    attackChain: "IEC-61850 Telemetry Override / Relay Trip",
    hoursAgo: 1,
  },
  {
    id: "TR-BENCH-02",
    sector: "power",
    adversary: "Sandworm / Voodoo Bear (BlackEnergy 3)",
    branch: "Branch B: Microgrid Feeder Islanding",
    mwShed: 340,
    mttd: 65,
    mttr: 240,
    cost: 420,
    score: 88,
    shareUrl: "/simulation?sector=power",
    attackType: "disruption",
    adversaryProfile: "nation-state",
    attackChain: "KillDisk SCADA Wiping / Breaker SCRAM",
    hoursAgo: 4,
  },
  {
    id: "TR-BENCH-03",
    sector: "power",
    adversary: "Dragonfly 2.0 / Energetic Bear (Havex)",
    branch: "Branch A: Immediate Protocol Severance",
    mwShed: 85,
    mttd: 28,
    mttr: 110,
    cost: 95,
    score: 96,
    shareUrl: "/simulation?sector=power",
    attackType: "espionage",
    adversaryProfile: "nation-state",
    attackChain: "OPC Classic DA/HDA Enumeration & Intercept",
    hoursAgo: 9,
  },
  {
    id: "TR-BENCH-04",
    sector: "power",
    adversary: "Volt Typhoon (Living off the Land)",
    branch: "Branch C: Cryptographic EWS Rollback",
    mwShed: 210,
    mttd: 54,
    mttr: 195,
    cost: 310,
    score: 91,
    shareUrl: "/simulation?sector=power",
    attackType: "disruption",
    adversaryProfile: "nation-state",
    attackChain: "EWS Firmware Modification via Stolen RDP",
    hoursAgo: 16,
  },
  {
    id: "TR-BENCH-05",
    sector: "water",
    adversary: "Volt Typhoon (Oldsmar Water Supply)",
    branch: "Branch A: Hardware Interlock Trip",
    mwShed: 0,
    mttd: 18,
    mttr: 85,
    cost: 45,
    score: 98,
    shareUrl: "/simulation?sector=water",
    attackType: "disruption",
    adversaryProfile: "nation-state",
    attackChain: "Municipal Chlorine Dosing 6x Poisoning Walk",
    hoursAgo: 24,
  },
  {
    id: "TR-BENCH-06",
    sector: "water",
    adversary: "Hunter / APT33 (Desalination Bleed)",
    branch: "Branch B: Secondary RO Pump Bypass",
    mwShed: 45,
    mttd: 72,
    mttr: 320,
    cost: 280,
    score: 85,
    shareUrl: "/simulation?sector=water",
    attackType: "disruption",
    adversaryProfile: "nation-state",
    attackChain: "RO Membrane High-Pressure Valve Override",
    hoursAgo: 30,
  },
  {
    id: "TR-BENCH-07",
    sector: "water",
    adversary: "Maroochy Replay (Sump Telemetry Spoof)",
    branch: "Branch A: Physical Mechanical Override",
    mwShed: 15,
    mttd: 35,
    mttr: 140,
    cost: 120,
    score: 92,
    shareUrl: "/simulation?sector=water",
    attackType: "disruption",
    adversaryProfile: "activist",
    attackChain: "Pumping Station Sewage Sump Replay Attack",
    hoursAgo: 42,
  },
  {
    id: "TR-BENCH-08",
    sector: "oil-gas",
    adversary: "TEMP.Veles / Xenotime (TRITON / Trisis)",
    branch: "Branch A: SIL-3 Mechanical Fail-Safe",
    mwShed: 180,
    mttd: 38,
    mttr: 160,
    cost: 650,
    score: 95,
    shareUrl: "/simulation?sector=oil-gas",
    attackType: "disruption",
    adversaryProfile: "nation-state",
    attackChain: "Triconex SIS Controller Firmware Invalidation",
    hoursAgo: 50,
  },
  {
    id: "TR-BENCH-09",
    sector: "oil-gas",
    adversary: "DarkSide / FIN7 (Blackout Pipeline)",
    branch: "Branch B: Flare Path Re-route",
    mwShed: 90,
    mttd: 60,
    mttr: 210,
    cost: 380,
    score: 89,
    shareUrl: "/simulation?sector=oil-gas",
    attackType: "disruption",
    adversaryProfile: "activist",
    attackChain: "Pipeline Compressor Discharge Creep Surge",
    hoursAgo: 64,
  },
  {
    id: "TR-BENCH-10",
    sector: "oil-gas",
    adversary: "Sandworm (Metering Skid Modbus)",
    branch: "Branch A: RTU Optical Cutoff",
    mwShed: 115,
    mttd: 45,
    mttr: 175,
    cost: 210,
    score: 93,
    shareUrl: "/simulation?sector=oil-gas",
    attackType: "disruption",
    adversaryProfile: "nation-state",
    attackChain: "Gas Flow Metering Skid Modbus Register Injection",
    hoursAgo: 78,
  },
  {
    id: "TR-BENCH-11",
    sector: "manufacturing",
    adversary: "Equation Group (Stuxnet Centrifuge Drift)",
    branch: "Branch A: VFD Frequency Inverter Isolation",
    mwShed: 60,
    mttd: 22,
    mttr: 95,
    cost: 520,
    score: 97,
    shareUrl: "/simulation?sector=manufacturing",
    attackType: "disruption",
    adversaryProfile: "nation-state",
    attackChain: "Siemens S7 Logic Modification Resonance Drift",
    hoursAgo: 92,
  },
  {
    id: "TR-BENCH-12",
    sector: "manufacturing",
    adversary: "Indikator / FIN11 (Assembly Arm Collision)",
    branch: "Branch B: Emergency Estop Bus Severance",
    mwShed: 40,
    mttd: 48,
    mttr: 185,
    cost: 340,
    score: 90,
    shareUrl: "/simulation?sector=manufacturing",
    attackType: "disruption",
    adversaryProfile: "activist",
    attackChain: "Robotic Welding Toolhead Joint Inversion",
    hoursAgo: 106,
  },
  {
    id: "TR-BENCH-13",
    sector: "manufacturing",
    adversary: "Lazarus ICS (Precision Tooling Tampering)",
    branch: "Branch C: Toolhead Retract & Flash Baseline",
    mwShed: 25,
    mttd: 80,
    mttr: 290,
    cost: 190,
    score: 86,
    shareUrl: "/simulation?sector=manufacturing",
    attackType: "espionage",
    adversaryProfile: "nation-state",
    attackChain: "CNC G-Code Precision Coordinate Shift",
    hoursAgo: 120,
  },
  {
    id: "TR-BENCH-14",
    sector: "port",
    adversary: "Ghost Fleet (Automated Crane Array DGPS)",
    branch: "Branch A: Optical LIDAR Telemetry Fallback",
    mwShed: 35,
    mttd: 32,
    mttr: 130,
    cost: 480,
    score: 94,
    shareUrl: "/simulation?sector=port",
    attackType: "disruption",
    adversaryProfile: "nation-state",
    attackChain: "Quayside Stacker Crane GNSS Spoofing",
    hoursAgo: 138,
  },
  {
    id: "TR-BENCH-15",
    sector: "port",
    adversary: "Volt Typhoon (Terminal OS Ransomware)",
    branch: "Branch B: Out-of-Band Cellular Air-Gap",
    mwShed: 50,
    mttd: 68,
    mttr: 260,
    cost: 720,
    score: 87,
    shareUrl: "/simulation?sector=port",
    attackType: "disruption",
    adversaryProfile: "nation-state",
    attackChain: "Container Terminal Navis N4 TOS Encryption",
    hoursAgo: 154,
  },
  {
    id: "TR-BENCH-16",
    sector: "smart-building",
    adversary: "APT41 / Winnti (Chiller Plant BACnet)",
    branch: "Branch A: Mechanical Relief Vent Trip",
    mwShed: 15,
    mttd: 40,
    mttr: 150,
    cost: 110,
    score: 91,
    shareUrl: "/simulation?sector=smart-building",
    attackType: "disruption",
    adversaryProfile: "nation-state",
    attackChain: "Central Chiller BACnet MSTP Loop Overpressure",
    hoursAgo: 172,
  },
  {
    id: "TR-BENCH-17",
    sector: "smart-building",
    adversary: "Lazarus Group (Halon Gas Discharge Pivot)",
    branch: "Branch A: Manual Key-Switch Override",
    mwShed: 10,
    mttd: 25,
    mttr: 90,
    cost: 85,
    score: 96,
    shareUrl: "/simulation?sector=smart-building",
    attackType: "disruption",
    adversaryProfile: "nation-state",
    attackChain: "Data Center Fire Suppression Actuator Hijack",
    hoursAgo: 190,
  },
  {
    id: "TR-BENCH-18",
    sector: "smart-city",
    adversary: "Chernovite / PIPEDREAM (Cross-Subnet Sync)",
    branch: "Branch A: Distributed Relay SCRAM",
    mwShed: 75,
    mttd: 50,
    mttr: 200,
    cost: 390,
    score: 92,
    shareUrl: "/simulation?sector=smart-city",
    attackType: "disruption",
    adversaryProfile: "nation-state",
    attackChain: "Synchronous Traffic Interlock & Substation Overdrive",
    hoursAgo: 210,
  },
];

export async function seedBenchmarkDrills(targetOperatorId?: string | null) {
  const now = Date.now();
  for (const b of BENCHMARK_DRILLS) {
    const timestamp = new Date(now - b.hoursAgo * 3600 * 1000).toISOString();
    const runId = targetOperatorId ? `${b.id}-${targetOperatorId.slice(0, 8)}` : b.id;

    // Check existence
    const existing = await db.query.trainingRuns.findFirst({
      where: (fields, { eq }) => eq(fields.id, runId),
    });

    if (!existing) {
      await db.insert(trainingRuns).values({
        id: runId,
        operatorId: targetOperatorId || null,
        sector: b.sector,
        adversary: b.adversary,
        branch: b.branch,
        mwShed: b.mwShed,
        mttd: b.mttd,
        mttr: b.mttr,
        cost: b.cost,
        score: b.score,
        shareUrl: b.shareUrl,
        isolatedNodes: JSON.stringify(["PLC-01", "RTU-04", "RELAY-12"]),
        attackType: b.attackType,
        adversaryProfile: b.adversaryProfile,
        attackChain: b.attackChain,
        attemptCount: 1,
        completedAt: timestamp,
        createdAt: timestamp,
      });
    }
  }
}

export async function updateRunHint(
  trainingRunId: string,
  nextHintLevel: number,
  finalHash: string,
) {
  await db
    .update(trainingRuns)
    .set({
      hintLevel: nextHintLevel,
      lastHintHash: finalHash,
    })
    .where(eq(trainingRuns.id, trainingRunId));
}
