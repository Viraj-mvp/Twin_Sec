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
  emailConfirmed: integer("email_confirmed", { mode: "boolean" }).notNull().default(true),
  preferencesJson: text("preferences_json"),
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
  redTacticsJson: text("red_tactics_json"),
  blueMitigationsJson: text("blue_mitigations_json"),
  caseFileId: text("case_file_id"),
  researchReferencesJson: text("research_references_json"),
  isPublic: integer("is_public", { mode: "boolean" }).default(false),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ── LEADERBOARD ENTRIES ───────────────────────────────────────────────────
export const leaderboardEntries = sqliteTable("leaderboard_entries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  operatorId: text("operator_id").references(() => operators.id, { onDelete: "set null" }),
  callsign: text("callsign").notNull(),
  trainingRunId: text("training_run_id").references(() => trainingRuns.id, { onDelete: "cascade" }),
  sector: text("sector").notNull(),
  adversary: text("adversary").notNull(),
  score: integer("score").notNull().default(0),
  mwShed: real("mw_shed").notNull().default(0),
  mttd: integer("mttd").notNull().default(0),
  mttr: integer("mttr").notNull().default(0),
  verified: integer("verified", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ── MITRE ATT&CK FOR ICS TECHNIQUES ───────────────────────────────────────
export const mitreTechniques = sqliteTable("mitre_techniques", {
  id: text("id").primaryKey(), // STIX ID e.g. attack-pattern--...
  externalId: text("external_id").notNull().unique(), // e.g. T0855, T1692.001
  name: text("name").notNull(),
  description: text("description").notNull(),
  tacticsJson: text("tactics_json").notNull().default("[]"),
  platformsJson: text("platforms_json").notNull().default("[]"),
  mitigationsJson: text("mitigations_json").default("[]"),
  isSubtechnique: integer("is_subtechnique", { mode: "boolean" }).notNull().default(false),
  isRevoked: integer("is_revoked", { mode: "boolean" }).notNull().default(false),
  revokedBy: text("revoked_by"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ── OTCAD HISTORICAL ICS CYBER INCIDENTS ──────────────────────────────────
export const otcadIncidents = sqliteTable("otcad_incidents", {
  id: text("id").primaryKey(), // GUID
  name: text("name").notNull(),
  year: integer("year").notNull(),
  industry: text("industry").notNull(),
  attackType: text("attack_type").notNull(),
  sourcesJson: text("sources_json").notNull().default("[]"),
  targetComponent: text("target_component"),
  mitreTactic: text("mitre_tactic"),
  consequence: text("consequence"),
  severity: text("severity").notNull().default("HIGH"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ── HAI ICS GROUND TRUTH ATTACK PERIODS ────────────────────────────────────
export const haiAttackPeriods = sqliteTable("hai_attack_periods", {
  id: text("id").primaryKey(),
  attackIndex: integer("attack_index").notNull().unique(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  durationFormatted: text("duration_formatted").notNull(),
  affectedProcess: text("affected_process").notNull(),
  description: text("description").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ── EXPERIMENTS ──────────────────────────────────────────────────────────
export const experiments = sqliteTable("experiments", {
  id: text("id").primaryKey(),
  scenarioId: text("scenario_id").notNull(),
  seed: integer("seed").notNull(),
  status: text("status").notNull().default("RUNNING"),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  metricsJson: text("metrics_json"),
  configJson: text("config_json"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ── SIMULATION EVENTS ────────────────────────────────────────────────────
export const simulationEvents = sqliteTable("simulation_events", {
  id: text("id").primaryKey(),
  experimentId: text("experiment_id"),
  timestamp: real("timestamp").notNull(),
  type: text("type").notNull(),
  sourceAssetId: text("source_asset_id").notNull(),
  targetAssetId: text("target_asset_id"),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dataJson: text("data_json"),
  beforeStateJson: text("before_state_json"),
  afterStateJson: text("after_state_json"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ── SIMULATION SNAPSHOTS ─────────────────────────────────────────────────
export const simulationSnapshots = sqliteTable("simulation_snapshots", {
  id: text("id").primaryKey(),
  experimentId: text("experiment_id").notNull(),
  time: real("time").notNull(),
  stateJson: text("state_json").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ── TYPE EXPORTS ──────────────────────────────────────────────────────────
export type Operator = typeof operators.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type TrainingRun = typeof trainingRuns.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type MitreTechniqueRow = typeof mitreTechniques.$inferSelect;
export type OtcadIncidentRow = typeof otcadIncidents.$inferSelect;
export type HaiAttackPeriodRow = typeof haiAttackPeriods.$inferSelect;
export type ExperimentRow = typeof experiments.$inferSelect;
export type SimulationEventRow = typeof simulationEvents.$inferSelect;
export type SimulationSnapshotRow = typeof simulationSnapshots.$inferSelect;
