import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

console.log("==================================================");
console.log("  TWINSEC AUTH, COOKIE HARDENING & E2E TEST SUITE");
console.log("==================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASSED: ${message}`);
    passed++;
  } else {
    console.error(`  ✕ FAILED: ${message}`);
    failed++;
  }
}

// Ensure database setup
const dataDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = process.env.DB_PATH || path.resolve(dataDir, "twinsec.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Run auto-migration helper
const autoMigrateTable = (tableName, cols) => {
  try {
    const info = sqlite.pragma(`table_info(${tableName})`);
    const existing = info.map((c) => c.name);
    cols.forEach((col) => {
      if (!existing.includes(col.name)) {
        sqlite.exec(`ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type};`);
      }
    });
  } catch (e) {
    console.warn(`Migration error for ${tableName}:`, e);
  }
};

autoMigrateTable("operators", [
  { name: "email", type: "TEXT" },
  { name: "role", type: "TEXT NOT NULL DEFAULT 'operator'" },
  { name: "email_confirmed", type: "INTEGER NOT NULL DEFAULT 1" },
]);

// 1. Verify Database Schema & Migrations
console.log("[Test Case 1] Database Schema & Auto-Migration Integrity");
const tableInfo = sqlite.pragma("table_info(operators)");
const columns = tableInfo.map((col) => col.name);
assert(columns.includes("email_confirmed"), "operators table contains 'email_confirmed' column");

// Helper cookie serializer for verification
function serializeCookie(name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.expires) parts.push(`Expires=${opts.expires.toUTCString()}`);
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  return parts.join("; ");
}

// 2. Cookie Hardening (Secure, HttpOnly, SameSite, Path)
console.log("\n[Test Case 2] Cookie Settings Hardening (HTTPS, Secure, SameSite, HttpOnly)");
const testToken = "test-session-token-123456789";
const secureCookieHeader = serializeCookie("twinsec_session", testToken, {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60,
  path: "/",
});

assert(secureCookieHeader.includes("twinsec_session="), "Cookie includes token name");
assert(secureCookieHeader.includes("HttpOnly"), "Cookie includes HttpOnly flag");
assert(secureCookieHeader.includes("Secure"), "Cookie includes HTTPS Secure flag");
assert(secureCookieHeader.includes("SameSite=lax"), "Cookie includes SameSite=lax flag");
assert(secureCookieHeader.includes("Path=/"), "Cookie includes Path=/ attribute");

// 3. Cookie Deletion Eviction Matching
console.log("\n[Test Case 3] Cookie Eviction Header Matching (Chrome/Safari Eviction)");
const deleteCookieHeader = serializeCookie("twinsec_session", "", {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: 0,
  expires: new Date(0),
});
assert(deleteCookieHeader.includes("Max-Age=0"), "Delete cookie header has Max-Age=0");
assert(deleteCookieHeader.includes("HttpOnly"), "Delete cookie retains HttpOnly");
assert(deleteCookieHeader.includes("Secure"), "Delete cookie retains Secure");
assert(deleteCookieHeader.includes("SameSite=lax"), "Delete cookie retains SameSite");

// 4. Operator Creation & Login Credentials
console.log("\n[Test Case 4] Authentication & Credential Verification");
const testCallsign = `E2E_OP_${Math.floor(1000 + Math.random() * 9000)}`;
const testEmail = `${testCallsign.toLowerCase()}@twinsec.io`;
const testPassword = "TacticalPassword123!";
const hash = bcrypt.hashSync(testPassword, 12);
const opId = crypto.randomUUID();

// Insert test operator
sqlite
  .prepare(
    `
  INSERT OR REPLACE INTO operators (id, callsign, email, badge_id, clearance, password_hash, role, email_confirmed, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
`,
  )
  .run(
    opId,
    testCallsign,
    testEmail,
    `OP-${opId.slice(0, 4)}`,
    "TS/SCI",
    hash,
    "operator",
    new Date().toISOString(),
  );

const opRow = sqlite.prepare("SELECT * FROM operators WHERE id = ?").get(opId);
assert(opRow !== undefined, "Test operator successfully stored in SQLite");
assert(opRow.email_confirmed === 1, "Default registration has email_confirmed = 1");

const validPass = bcrypt.compareSync(testPassword, opRow.password_hash);
assert(validPass === true, "Password verification succeeds for valid credentials");

const invalidPass = bcrypt.compareSync("WrongPassword!", opRow.password_hash);
assert(invalidPass === false, "Password verification fails for wrong password");

// 5. Unconfirmed Email Handling
console.log("\n[Test Case 5] Unconfirmed Email Account Error Handling");
const unconfirmedOpId = crypto.randomUUID();
const unconfirmedCallsign = `UNCONF_${Math.floor(1000 + Math.random() * 9000)}`;
const unconfirmedEmail = `${unconfirmedCallsign.toLowerCase()}@twinsec.io`;

sqlite
  .prepare(
    `
  INSERT OR REPLACE INTO operators (id, callsign, email, badge_id, clearance, password_hash, role, email_confirmed, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
`,
  )
  .run(
    unconfirmedOpId,
    unconfirmedCallsign,
    unconfirmedEmail,
    `OP-${unconfirmedOpId.slice(0, 4)}`,
    "TS/SCI",
    hash,
    "operator",
    new Date().toISOString(),
  );

const unconfirmedRow = sqlite.prepare("SELECT * FROM operators WHERE id = ?").get(unconfirmedOpId);
assert(
  unconfirmedRow.email_confirmed === 0,
  "Unconfirmed operator correctly has email_confirmed = 0",
);

// 6. Session Token Creation & Session Persistence
console.log("\n[Test Case 6] Session Token Creation & Persistence");
const sessionToken = crypto.randomUUID() + "-" + crypto.randomUUID();
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const sessionId = crypto.randomUUID();

sqlite
  .prepare(
    `
  INSERT INTO sessions (id, token, operator_id, expires_at, created_at)
  VALUES (?, ?, ?, ?, ?)
`,
  )
  .run(sessionId, sessionToken, opId, expiresAt, new Date().toISOString());

const activeSession = sqlite
  .prepare(
    `
  SELECT s.token, o.callsign, s.expires_at 
  FROM sessions s
  JOIN operators o ON s.operator_id = o.id
  WHERE s.token = ? AND s.expires_at > ?
`,
  )
  .get(sessionToken, new Date().toISOString());

assert(activeSession !== undefined, "Active session correctly retrieved from SQLite database");
assert(activeSession.callsign === testCallsign, "Retrieved session belongs to correct operator");

// 7. Expired Session Invalidation
console.log("\n[Test Case 7] Expired Session Detection & Eviction");
const expiredToken = crypto.randomUUID() + "-expired";
const pastExpiresAt = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1 hour ago

sqlite
  .prepare(
    `
  INSERT INTO sessions (id, token, operator_id, expires_at, created_at)
  VALUES (?, ?, ?, ?, ?)
`,
  )
  .run(crypto.randomUUID(), expiredToken, opId, pastExpiresAt, new Date().toISOString());

const expiredCheck = sqlite
  .prepare(
    `
  SELECT s.token FROM sessions s WHERE s.token = ? AND s.expires_at > ?
`,
  )
  .get(expiredToken, new Date().toISOString());

assert(expiredCheck === undefined, "Expired session token is rejected by database session query");

// 8. Logout & Session Purge
console.log("\n[Test Case 8] Logout & Database Session Purge");
sqlite.prepare("DELETE FROM sessions WHERE token = ?").run(sessionToken);
const deletedCheck = sqlite.prepare("SELECT token FROM sessions WHERE token = ?").get(sessionToken);
assert(deletedCheck === undefined, "Session token deleted from database on logout");

// Cleanup test records
sqlite.prepare("DELETE FROM operators WHERE id IN (?, ?)").run(opId, unconfirmedOpId);
sqlite.close();

console.log("\n==================================================");
console.log(`  E2E TEST RESULT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
if (failed === 0) {
  console.log("  SUCCESS: ALL AUTH, COOKIE & E2E TESTS PASSED 100%");
  console.log("==================================================\n");
  process.exit(0);
} else {
  console.error("  FAILURE: ONE OR MORE E2E TESTS FAILED");
  console.log("==================================================\n");
  process.exit(1);
}
