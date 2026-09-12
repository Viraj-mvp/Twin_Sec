import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import * as fs from "fs";
import * as path from "path";

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
  { name: "email_confirmed", type: "INTEGER NOT NULL DEFAULT 1" },
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

export const db = drizzle(sqlite, { schema });
export { schema };
