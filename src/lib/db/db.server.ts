import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import * as fs from "fs";
import * as path from "path";
import { mitreParser } from "../data/mitre/mitre-stix-parser";
import { otcadParser } from "../data/otcad/otcad-parser";
import { haiDataParser } from "../data/hai/hai-parser.server";

// Ensure data directory exists
const isVercel = !!process.env.VERCEL;
const dataDir = isVercel ? "/tmp/data" : path.resolve(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (e) {
    console.warn("Could not create data directory, possibly read-only filesystem:", e);
  }
}

declare global {
  var __twinsec_sqlite: Database.Database | undefined;
  var __twinsec_db_initialized: boolean | undefined;
}

const dbPath = process.env.DB_PATH ?? path.resolve(dataDir, "twinsec.db");
const sqlite = globalThis.__twinsec_sqlite ?? new Database(dbPath);
if (!globalThis.__twinsec_sqlite) {
  globalThis.__twinsec_sqlite = sqlite;
}

// Enable industrial high-throughput PRAGMAs & memory-mapped I/O
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("busy_timeout = 5000");
sqlite.pragma("synchronous = NORMAL");
sqlite.pragma("cache_size = -64000"); // 64MB memory cache
sqlite.pragma("mmap_size = 268435456"); // 256MB memory-mapped I/O
sqlite.pragma("temp_store = MEMORY");
sqlite.pragma("foreign_keys = ON");

if (!globalThis.__twinsec_db_initialized) {
  globalThis.__twinsec_db_initialized = true;

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
    email_confirmed INTEGER NOT NULL DEFAULT 1,
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

  CREATE INDEX IF NOT EXISTS idx_training_runs_operator_id ON training_runs(operator_id);
  CREATE INDEX IF NOT EXISTS idx_training_runs_sector ON training_runs(sector);
  CREATE INDEX IF NOT EXISTS idx_training_runs_created_at ON training_runs(created_at);

  CREATE TABLE IF NOT EXISTS simulation_scenarios (
    id TEXT PRIMARY KEY,
    created_by TEXT REFERENCES operators(id),
    sector TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    attack_type TEXT NOT NULL,
    adversary_profile TEXT NOT NULL,
    initial_nodes TEXT DEFAULT '[]',
    events TEXT DEFAULT '[]',
    decisions TEXT DEFAULT '[]',
    nodes_json TEXT DEFAULT '[]',
    events_json TEXT DEFAULT '[]',
    decisions_json TEXT DEFAULT '[]',
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

  CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id TEXT PRIMARY KEY,
    operator_id TEXT REFERENCES operators(id) ON DELETE SET NULL,
    callsign TEXT NOT NULL,
    training_run_id TEXT REFERENCES training_runs(id) ON DELETE CASCADE,
    sector TEXT NOT NULL,
    adversary TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    mw_shed REAL NOT NULL DEFAULT 0,
    mttd INTEGER NOT NULL DEFAULT 0,
    mttr INTEGER NOT NULL DEFAULT 0,
    verified INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mitre_techniques (
    id TEXT PRIMARY KEY,
    external_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    tactics_json TEXT NOT NULL DEFAULT '[]',
    platforms_json TEXT NOT NULL DEFAULT '[]',
    mitigations_json TEXT DEFAULT '[]',
    is_subtechnique INTEGER NOT NULL DEFAULT 0,
    is_revoked INTEGER NOT NULL DEFAULT 0,
    revoked_by TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS otcad_incidents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    year INTEGER NOT NULL,
    industry TEXT NOT NULL,
    attack_type TEXT NOT NULL,
    sources_json TEXT NOT NULL DEFAULT '[]',
    target_component TEXT,
    mitre_tactic TEXT,
    consequence TEXT,
    severity TEXT NOT NULL DEFAULT 'HIGH',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS hai_attack_periods (
    id TEXT PRIMARY KEY,
    attack_index INTEGER NOT NULL UNIQUE,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    duration_formatted TEXT NOT NULL,
    affected_process TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS experiments (
    id TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL,
    seed INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'RUNNING',
    start_time TEXT NOT NULL,
    end_time TEXT,
    metrics_json TEXT,
    config_json TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS simulation_events (
    id TEXT PRIMARY KEY,
    experiment_id TEXT,
    timestamp REAL NOT NULL,
    type TEXT NOT NULL,
    source_asset_id TEXT NOT NULL,
    target_asset_id TEXT,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    data_json TEXT,
    before_state_json TEXT,
    after_state_json TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS simulation_snapshots (
    id TEXT PRIMARY KEY,
    experiment_id TEXT NOT NULL,
    time REAL NOT NULL,
    state_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_token_expires ON sessions(token, expires_at);
  CREATE INDEX IF NOT EXISTS idx_sessions_operator_id ON sessions(operator_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_operator_timestamp ON audit_logs(operator_id, timestamp);
  CREATE INDEX IF NOT EXISTS idx_leaderboard_sector ON leaderboard_entries(sector);
  CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard_entries(score DESC);
  CREATE INDEX IF NOT EXISTS idx_leaderboard_created ON leaderboard_entries(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_mitre_external_id ON mitre_techniques(external_id);
  CREATE INDEX IF NOT EXISTS idx_otcad_industry_year ON otcad_incidents(industry, year DESC);
  CREATE INDEX IF NOT EXISTS idx_hai_attack_index ON hai_attack_periods(attack_index);
  CREATE INDEX IF NOT EXISTS idx_sim_events_exp ON simulation_events(experiment_id, timestamp);
  CREATE INDEX IF NOT EXISTS idx_sim_snapshots_exp ON simulation_snapshots(experiment_id, time);
`);

  // Dynamic column additions for backward-compatibility with earlier database files
  const ALLOWED_TABLES = new Set([
    "operators",
    "simulation_scenarios",
    "training_runs",
    "audit_logs",
  ]);
  const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  // Strict DDL column type whitelist to prevent SQL injection in ALTER TABLE
  const DDL_TYPE_REGEX = /^[A-Z0-9_\s'(),]+$/i;

  const autoMigrateTable = (tableName: string, columns: { name: string; type: string }[]) => {
    try {
      if (!ALLOWED_TABLES.has(tableName)) return;
      const tableInfo = sqlite.pragma(`table_info(${tableName})`);
      const existingColumns = (tableInfo as Array<{ name: string }>).map((col) => col.name);
      columns.forEach((col) => {
        const isSafeName = IDENTIFIER_REGEX.test(col.name);
        const isSafeType =
          DDL_TYPE_REGEX.test(col.type) &&
          !col.type.includes(";") &&
          !col.type.includes("--") &&
          !col.type.includes("/*");

        if (!existingColumns.includes(col.name) && isSafeName && isSafeType) {
          sqlite.exec(`ALTER TABLE "${tableName}" ADD COLUMN "${col.name}" ${col.type};`);
        }
      });
    } catch (err) {
      console.warn(`Auto-migration for ${tableName} skipped:`, err);
    }
  };

  autoMigrateTable("operators", [
    { name: "email", type: "TEXT" },
    { name: "role", type: "TEXT NOT NULL DEFAULT 'operator'" },
    { name: "email_confirmed", type: "INTEGER NOT NULL DEFAULT 1" },
    { name: "preferences_json", type: "TEXT" },
  ]);

  autoMigrateTable("simulation_scenarios", [
    { name: "is_public", type: "INTEGER DEFAULT 0" },
    { name: "red_tactics_json", type: "TEXT" },
    { name: "blue_mitigations_json", type: "TEXT" },
    { name: "case_file_id", type: "TEXT" },
    { name: "research_references_json", type: "TEXT" },
    { name: "initial_nodes", type: "TEXT DEFAULT '[]'" },
    { name: "events", type: "TEXT DEFAULT '[]'" },
    { name: "decisions", type: "TEXT DEFAULT '[]'" },
    { name: "events_json", type: "TEXT DEFAULT '[]'" },
    { name: "decisions_json", type: "TEXT DEFAULT '[]'" },
    { name: "nodes_json", type: "TEXT DEFAULT '[]'" },
  ]);

  // Migrate audit_logs table if training_run_id has NOT NULL constraint from legacy schema
  try {
    const auditLogCols = sqlite.pragma("table_info(audit_logs)") as Array<{
      name: string;
      notnull: number;
    }>;
    const trCol = auditLogCols.find((c) => c.name === "training_run_id");
    if (trCol && trCol.notnull === 1) {
      sqlite.exec("PRAGMA foreign_keys = OFF;");
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
      sqlite.exec("PRAGMA foreign_keys = ON;");
    }
  } catch (e) {
    console.warn("Audit logs migration skipped:", e);
  }

  autoMigrateTable("audit_logs", [
    { name: "training_run_id", type: "TEXT REFERENCES training_runs(id) ON DELETE CASCADE" },
    { name: "operator_id", type: "TEXT REFERENCES operators(id) ON DELETE SET NULL" },
    { name: "severity", type: "TEXT NOT NULL DEFAULT 'info'" },
  ]);

  // Seed default cyber-physical attack scenarios into database
  try {
    const seedScenarios = [
      {
        id: "hollow-substation-07",
        sector: "power",
        name: "ATTACK OF HOLLOW: Substation-07 Power Grid Cascade",
        description:
          "Targeted OT malware (ELECTRUM / Sandworm) exploiting IEC 60870-5-104 & IEC 61850 substation protocols. Silently overwrites PLC-7 ladder logic, walking frequency setpoints while disarming SIS safety interlocks to trip 14MW circuit breakers and trigger cascading power blackout.",
        attack_type: "disruption",
        adversary_profile: "Sandworm / ELECTRUM (APT44)",
        case_file_id: "ukraine-grid",
        red_tactics_json: JSON.stringify([
          "nmap -sS -p 104,2404 10.0.4.0/24 (Scan IEC-104 Substation Bus)",
          "modbus-cli read plc-7 40001 (Read Frequency Setpoint)",
          "iec104-inject --target plc-7 --cmd SET_FREQ --val 65.4 (Overdrive Rotor Frequency)",
          "exploit-plc --target sis-ls --payload OVERRIDE_TRIP (Disable SIL-3 Safety Interlocks)",
        ]),
        blue_mitigations_json: JSON.stringify([
          "isolate-node plc-7 (Disconnect Compromised Substation PLC)",
          "block-ip 10.0.0.45 (Sever Rogue EWS-04 VPN Tunnel)",
          "restore-logic plc-7 (Flash Clean IEC-61850 Firmware Image)",
          "patch-cve CVE-2022-3165 (Apply SIL-3 Interlock Protection Patch)",
        ]),
        is_public: 1,
        created_at: new Date().toISOString(),
        initial_nodes: "[]",
        events: "[]",
        decisions: "[]",
        events_json: "[]",
        decisions_json: "[]",
        nodes_json: "[]",
      },
      {
        id: "operation-waterfall",
        sector: "water",
        name: "OPERATION WATERFALL: Municipal Chemical Dosing Overdose",
        description:
          "Volt Typhoon stealth intrusion exploiting contractor VPN credentials. Replays SCADA historian trends to mask a 6x chlorine dosing walk toward municipal reservoir distribution.",
        attack_type: "sabotage",
        adversary_profile: "Volt Typhoon / Industrial Sabre",
        case_file_id: "oldsmar-water",
        red_tactics_json: JSON.stringify([
          "nmap -sV -p 502 10.0.2.0/24 (Scan Modbus Dosing PLCs)",
          "replay-telemetry --target historian --mask NORMAL (Spoof SCADA Telemetry)",
          "modbus-write --target plc-cl2 --reg 3004 --val 600 (Walk Chlorine Dosing to 6x)",
        ]),
        blue_mitigations_json: JSON.stringify([
          "isolate-node plc-cl2 (Emergency Shutoff Chemical Feed Valve)",
          "block-ip 192.168.10.4 (Revoke Stolen VPN Session)",
          "restore-logic plc-cl2 (Reset Dosing Rate to Safe 1.5 PPM Standard)",
        ]),
        is_public: 1,
        created_at: new Date().toISOString(),
        initial_nodes: "[]",
        events: "[]",
        decisions: "[]",
        events_json: "[]",
        decisions_json: "[]",
        nodes_json: "[]",
      },
      {
        id: "centrifuge-drift",
        sector: "manufacturing",
        name: "CENTRIFUGE DRIFT: High-Frequency Resonance Stuxnet Attack",
        description:
          "Stuxnet-derivative logic modification targeting Siemens S7 controllers. Drives high-speed centrifuges into destructive mechanical resonance band without triggering SCADA alarms.",
        attack_type: "sabotage",
        adversary_profile: "Equation Group / Olympic Games",
        case_file_id: "stuxnet",
        red_tactics_json: JSON.stringify([
          "usb-inject --payload stuxnet.s7p (Infect Engineering Workstation)",
          "s7-rootkit --target s7-315 --override DB80 (Inject Frequency Ramp Logic)",
          "replay-telemetry --duration 21s (Freeze SCADA Historian Telemetry)",
        ]),
        blue_mitigations_json: JSON.stringify([
          "isolate-node s7-315 (Disconnect Centrifuge Frequency Drive)",
          "verify-code-signature --target s7-315 (Purge Unsigned PLC Blocks)",
          "restore-logic s7-315 (Flash Factory Firmware Baseline)",
        ]),
        is_public: 1,
        created_at: new Date().toISOString(),
        initial_nodes: "[]",
        events: "[]",
        decisions: "[]",
        events_json: "[]",
        decisions_json: "[]",
        nodes_json: "[]",
      },
      {
        id: "blackout-pipeline",
        sector: "oil-gas",
        name: "BLACKOUT PIPELINE: Compressor Surge Cascade",
        description:
          "Creep attack on compressor discharge pressure. Throttles flare relief paths while bypassing SIL-3 safety instrumented systems.",
        attack_type: "disruption",
        adversary_profile: "DarkSide / Industrial Sabre",
        case_file_id: "triton",
        red_tactics_json: JSON.stringify([
          "dnp3-scan --target compressor-01 (Identify Outstation Registers)",
          "triton-inject --target triconex-sis --memory 0x4000 (Disarm Safety Emergency Trip)",
          "modbus-write --target valve-rel-01 --val 0 (Close Flare Relief Path)",
        ]),
        blue_mitigations_json: JSON.stringify([
          "isolate-node triconex-sis (Trigger Manual Mechanical Safety Trip)",
          "block-ip 172.16.4.20 (Terminate Remote IT-OT Gateway Proxy)",
          "patch-cve CVE-2018-8840 (Remediate Triconex Key Switch Bypass)",
        ]),
        is_public: 1,
        created_at: new Date().toISOString(),
        initial_nodes: "[]",
        events: "[]",
        decisions: "[]",
        events_json: "[]",
        decisions_json: "[]",
        nodes_json: "[]",
      },
    ];

    const checkStmt = sqlite.prepare(
      "SELECT COUNT(*) as count FROM simulation_scenarios WHERE id = ?",
    );
    const insertStmt = sqlite.prepare(`
    INSERT INTO simulation_scenarios (
      id, sector, name, description, attack_type, adversary_profile, case_file_id,
      red_tactics_json, blue_mitigations_json, is_public, created_at,
      initial_nodes, events, decisions, events_json, decisions_json, nodes_json
    )
    VALUES (
      @id, @sector, @name, @description, @attack_type, @adversary_profile, @case_file_id,
      @red_tactics_json, @blue_mitigations_json, @is_public, @created_at,
      @initial_nodes, @events, @decisions, @events_json, @decisions_json, @nodes_json
    )
  `);

    for (const s of seedScenarios) {
      const res = checkStmt.get(s.id) as { count: number };
      if (res.count === 0) {
        insertStmt.run(s);
      }
    }
  } catch (err) {
    console.warn("Simulation scenarios seeding skipped:", err);
  }

  // Seed real datasets (MITRE ATT&CK for ICS, OTCAD, HAI) into SQLite if not already populated
  try {
    const mitreCount = (
      sqlite.prepare("SELECT COUNT(*) as count FROM mitre_techniques").get() as { count: number }
    ).count;
    if (mitreCount === 0) {
      const techniques = mitreParser.getAllTechniques(true);
      const insertMitre = sqlite.prepare(`
      INSERT OR REPLACE INTO mitre_techniques (
        id, external_id, name, description, tactics_json, platforms_json, mitigations_json,
        is_subtechnique, is_revoked, revoked_by, created_at
      ) VALUES (
        @id, @external_id, @name, @description, @tactics_json, @platforms_json, @mitigations_json,
        @is_subtechnique, @is_revoked, @revoked_by, @created_at
      )
    `);
      const insertMany = sqlite.transaction((items: Record<string, unknown>[]) => {
        for (const item of items) insertMitre.run(item);
      });
      insertMany(
        techniques.map((t) => ({
          id: t.id,
          external_id: t.externalId,
          name: t.name,
          description: t.description,
          tactics_json: JSON.stringify(t.tactics),
          platforms_json: JSON.stringify(t.platforms),
          mitigations_json: JSON.stringify(t.mitigations || []),
          is_subtechnique: t.isSubtechnique ? 1 : 0,
          is_revoked: t.isRevoked ? 1 : 0,
          revoked_by: t.revokedBy || null,
          created_at: new Date().toISOString(),
        })),
      );
    }

    const otcadCount = (
      sqlite.prepare("SELECT COUNT(*) as count FROM otcad_incidents").get() as { count: number }
    ).count;
    if (otcadCount === 0) {
      const incidents = otcadParser.getAll();
      const insertOtcad = sqlite.prepare(`
      INSERT OR REPLACE INTO otcad_incidents (
        id, name, year, industry, attack_type, sources_json, target_component, mitre_tactic,
        consequence, severity, created_at
      ) VALUES (
        @id, @name, @year, @industry, @attack_type, @sources_json, @target_component, @mitre_tactic,
        @consequence, @severity, @created_at
      )
    `);
      const insertMany = sqlite.transaction((items: Record<string, unknown>[]) => {
        for (const item of items) insertOtcad.run(item);
      });
      insertMany(
        incidents.map((inc) => ({
          id: inc.guid,
          name: inc.name,
          year: inc.year,
          industry: inc.industry,
          attack_type: inc.attackType,
          sources_json: JSON.stringify(inc.sources),
          target_component: inc.targetComponent || null,
          mitre_tactic: inc.mitreTactic || null,
          consequence: inc.consequence || null,
          severity: inc.severity || "HIGH",
          created_at: new Date().toISOString(),
        })),
      );
    }

    const haiCount = (
      sqlite.prepare("SELECT COUNT(*) as count FROM hai_attack_periods").get() as { count: number }
    ).count;
    if (haiCount === 0) {
      const periods = haiDataParser.getAttackPeriods();
      const insertHai = sqlite.prepare(`
      INSERT OR REPLACE INTO hai_attack_periods (
        id, attack_index, start_time, end_time, duration_seconds, duration_formatted,
        affected_process, description, created_at
      ) VALUES (
        @id, @attack_index, @start_time, @end_time, @duration_seconds, @duration_formatted,
        @affected_process, @description, @created_at
      )
    `);
      const insertMany = sqlite.transaction((items: Record<string, unknown>[]) => {
        for (const item of items) insertHai.run(item);
      });
      insertMany(
        periods.map((p) => ({
          id: `hai-attack-${p.index}`,
          attack_index: p.index,
          start_time: p.startTime,
          end_time: p.endTime,
          duration_seconds: p.durationSeconds,
          duration_formatted: p.durationFormatted,
          affected_process: p.affectedProcess,
          description: p.description,
          created_at: new Date().toISOString(),
        })),
      );
    }
  } catch (err) {
    console.warn("Dataset seeding into SQLite skipped or failed:", err);
  }
}

export const db = drizzle(sqlite, { schema });
export { schema };
export default db;
