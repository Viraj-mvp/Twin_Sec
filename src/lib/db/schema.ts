import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ── OPERATORS ──────────────────────────────────────────────────────────────
export const operators = sqliteTable("operators", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  callsign: text("callsign").notNull().unique(),
  email: text("email").unique(),
  badgeId: text("badge_id").unique(),
  clearance: text("clearance").default("TS/SCI · RED LEVEL"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("operator"), // 'operator' | 'instructor' | 'admin'
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ── SESSIONS ───────────────────────────────────────────────────────────────
export const sessions = sqliteTable("sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  token: text("token").notNull().unique(),
  operatorId: text("operator_id")
    .notNull()
    .references(() => operators.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ── TRAINING RUNS ──────────────────────────────────────────────────────────
export const trainingRuns = sqliteTable("training_runs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  operatorId: text("operator_id").references(() => operators.id, { onDelete: "set null" }),

  // Core scenario
  sector: text("sector").notNull(),
  adversary: text("adversary").notNull(),
  attackType: text("attack_type").notNull().default("disruption"), // disruption | espionage
  adversaryProfile: text("adversary_profile").notNull().default("nation-state"),
  attackChain: text("attack_chain").notNull().default("full-spectrum"),
  espionageObjective: text("espionage_objective"),

  // Outcome metrics
  branch: text("branch").notNull(),
  mwShed: real("mw_shed").notNull().default(0),
  mttd: integer("mttd").notNull().default(0), // seconds
  mttr: integer("mttr").notNull().default(0), // seconds
  cost: integer("cost").notNull().default(0), // USD
  score: integer("score").notNull().default(0), // 0-100

  // Run details
  role: text("role"), // RED | BLUE
  briefingGeneratedAt: text("briefing_generated_at"),
  lastHintHash: text("last_hint_hash"),
  hintLevel: integer("hint_level").notNull().default(0),
  hintCount: integer("hint_count").notNull().default(0),
  attemptCount: integer("attempt_count").notNull().default(0),
  decisionHistory: text("decision_history"), // JSON: Decision[]
  terminalCommands: text("terminal_commands"), // JSON: TerminalCommand[]
  isolatedNodes: text("isolated_nodes"), // JSON: string[]
  exfiltratedData: text("exfiltrated_data"), // JSON: Record<string, any>
  exfiltrationTarget: text("exfiltration_target"),
  persistenceMethod: text("persistence_method"),
  persistenceEstablished: integer("persistence_established", { mode: "boolean" }).default(false),
  simulationState: text("simulation_state"),

  // Sharing
  shareUrl: text("share_url").notNull().default(""),

  // Timestamps
  completedAt: text("completed_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ── AUDIT LOGS ────────────────────────────────────────────────────────────
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  trainingRunId: text("training_run_id").references(() => trainingRuns.id, { onDelete: "cascade" }),
  operatorId: text("operator_id").references(() => operators.id, { onDelete: "set null" }),
  timestamp: text("timestamp")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  eventType: text("event_type").notNull(), // decision | terminal-command | hint | solution | error | state-change | scrub
  severity: text("severity").notNull().default("info"), // info | warn | error
  details: text("details").notNull(), // JSON
});

// ── SIMULATION SCENARIOS ──────────────────────────────────────────────────
export const simulationScenarios = sqliteTable("simulation_scenarios", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdBy: text("created_by").references(() => operators.id),
  sector: text("sector").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  attackType: text("attack_type").notNull(),
  adversaryProfile: text("adversary_profile").notNull(),
  initialNodes: text("initial_nodes"),
  events: text("events"),
  decisions: text("decisions"),
  nodesJson: text("nodes_json"),
  eventsJson: text("events_json"),
  decisionsJson: text("decisions_json"),
  isPublic: integer("is_public", { mode: "boolean" }).default(false),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ── TYPE EXPORTS ──────────────────────────────────────────────────────────
export type Operator = typeof operators.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type TrainingRun = typeof trainingRuns.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
