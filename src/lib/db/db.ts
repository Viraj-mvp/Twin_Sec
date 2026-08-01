import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import * as fs from "fs";
import * as path from "path";

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH ?? path.resolve(dataDir, "twinsec.db");
const sqlite = new Database(dbPath);

// Enable WAL mode & foreign keys
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Run raw migrations on startup to make initialization seamless
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS operators (
    id TEXT PRIMARY KEY,
    callsign TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    badge_id TEXT UNIQUE,
    clearance TEXT DEFAULT 'TS/SCI · RED LEVEL',
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    operator_id TEXT NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS training_runs (
    id TEXT PRIMARY KEY,
    operator_id TEXT REFERENCES operators(id) ON DELETE SET NULL,
    sector TEXT NOT NULL,
    adversary TEXT NOT NULL,
    branch TEXT NOT NULL,
    mw_shed REAL NOT NULL DEFAULT 0,
    mttd INTEGER NOT NULL DEFAULT 0,
    mttr INTEGER NOT NULL DEFAULT 0,
    cost INTEGER NOT NULL DEFAULT 0,
    score INTEGER NOT NULL DEFAULT 0,
    share_url TEXT NOT NULL DEFAULT '',
    isolated_nodes TEXT,
    attack_type TEXT NOT NULL DEFAULT 'disruption',
    adversary_profile TEXT NOT NULL DEFAULT 'nation-state',
    attack_chain TEXT NOT NULL DEFAULT 'full-spectrum',
    espionage_objective TEXT,
    exfiltration_target TEXT,
    persistence_method TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    decision_history TEXT,
    terminal_commands TEXT,
    hint_level INTEGER NOT NULL DEFAULT 0,
    hint_count INTEGER NOT NULL DEFAULT 0,
    exfiltrated_data TEXT,
    persistence_established INTEGER NOT NULL DEFAULT 0,
    simulation_state TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS simulation_scenarios (
    id TEXT PRIMARY KEY,
    created_by TEXT REFERENCES operators(id),
    sector TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    attack_type TEXT NOT NULL,
    adversary_profile TEXT NOT NULL,
    initial_nodes TEXT,
    events TEXT,
    decisions TEXT,
    nodes_json TEXT,
    events_json TEXT,
    decisions_json TEXT,
    is_public INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    training_run_id TEXT REFERENCES training_runs(id) ON DELETE CASCADE,
    operator_id TEXT REFERENCES operators(id) ON DELETE SET NULL,
    timestamp TEXT NOT NULL,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info',
    details TEXT NOT NULL
  );
`);

// Dynamic column additions for backward-compatibility with earlier database files
const autoMigrateTable = (tableName: string, columns: { name: string; type: string }[]) => {
  try {
    const tableInfo = sqlite.pragma(`table_info(${tableName})`);
    const existingColumns = (tableInfo as Array<{ name: string }>).map((col) => col.name);
    columns.forEach((col) => {
      if (!existingColumns.includes(col.name)) {
        sqlite.exec(`ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type};`);
      }
    });
  } catch (err) {
    console.warn(`Auto-migration for ${tableName} skipped:`, err);
  }
};

autoMigrateTable("operators", [
  { name: "email", type: "TEXT" },
  { name: "role", type: "TEXT NOT NULL DEFAULT 'operator'" },
]);

// Migrate audit_logs table if training_run_id has NOT NULL constraint from legacy schema
try {
  const auditLogCols = sqlite.pragma("table_info(audit_logs)") as Array<{
    name: string;
    notnull: number;
  }>;
  const trCol = auditLogCols.find((c) => c.name === "training_run_id");
  if (trCol && trCol.notnull === 1) {
    sqlite.exec(`
      CREATE TABLE audit_logs_new (
        id TEXT PRIMARY KEY,
        training_run_id TEXT REFERENCES training_runs(id) ON DELETE CASCADE,
        operator_id TEXT REFERENCES operators(id) ON DELETE SET NULL,
        timestamp TEXT NOT NULL,
        event_type TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'info',
        details TEXT NOT NULL
      );
      INSERT INTO audit_logs_new SELECT id, training_run_id, operator_id, timestamp, event_type, severity, details FROM audit_logs;
      DROP TABLE audit_logs;
      ALTER TABLE audit_logs_new RENAME TO audit_logs;
    `);
  }
} catch (err) {
  console.warn("Audit logs migration skipped:", err);
}

try {
  sqlite.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_operators_email ON operators(email);");
} catch {
  // Index already exists
}

// Indexes on foreign-key lookup columns so "my runs", "my sessions" and
// audit-log queries don't full-scan as the tables grow. Safe to re-run on
// existing databases (IF NOT EXISTS) and cheap on first boot.
const CREATE_INDEX_SQL = [
  "CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);",
  "CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);",
  "CREATE INDEX IF NOT EXISTS idx_sessions_operator_id ON sessions(operator_id);",
  "CREATE INDEX IF NOT EXISTS idx_training_runs_operator_id ON training_runs(operator_id);",
  "CREATE INDEX IF NOT EXISTS idx_audit_logs_operator_id ON audit_logs(operator_id);",
  "CREATE INDEX IF NOT EXISTS idx_audit_logs_training_run_id ON audit_logs(training_run_id);",
];
for (const sql of CREATE_INDEX_SQL) {
  try {
    sqlite.exec(sql);
  } catch {
    // Index already exists or column missing — non-fatal.
  }
}

autoMigrateTable("sessions", [
  { name: "created_at", type: "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP" },
]);

autoMigrateTable("training_runs", [
  { name: "hint_count", type: "INTEGER NOT NULL DEFAULT 0" },
  { name: "completed_at", type: "TEXT" },
]);

autoMigrateTable("audit_logs", [
  { name: "operator_id", type: "TEXT REFERENCES operators(id) ON DELETE SET NULL" },
  { name: "severity", type: "TEXT NOT NULL DEFAULT 'info'" },
]);

export const db = drizzle(sqlite, { schema });
export { schema };
