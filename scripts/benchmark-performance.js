#!/usr/bin/env node
/**
 * scripts/benchmark-performance.js
 *
 * Automated diagnostic and performance benchmark auditor.
 * Validates dev server configuration, bundle boundaries, database PRAGMAs,
 * and router preload throttling according to the TwinSec performance remediation plan.
 */

import * as fs from "fs";
import * as path from "path";
import Database from "better-sqlite3";

const rootDir = process.cwd();

console.log("==================================================");
console.log("  TWINSEC PERFORMANCE & STARTUP BENCHMARK AUDIT");
console.log("==================================================\n");

let passedChecks = 0;
let totalChecks = 0;

function check(title, condition, detail) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✓ [PASSED] ${title}`);
    if (detail) console.log(`             └─ ${detail}`);
  } else {
    console.log(`  ❌ [FAILED] ${title}`);
    if (detail) console.log(`             └─ ${detail}`);
  }
}

// 1. Audit Vite Watcher Exclusions
console.log("[1/5] Auditing Dev Server Watcher Configuration...");
const viteConfigPath = path.resolve(rootDir, "vite.config.ts");
if (fs.existsSync(viteConfigPath)) {
  const viteContent = fs.readFileSync(viteConfigPath, "utf-8");
  check(
    "Dataset directory ignored by file watcher",
    viteContent.includes("**/dataset/**"),
    "Prevents recursive watcher locks over multi-MB HAI/OTCAD CSV trees.",
  );
  check(
    "Dist build directory ignored by file watcher",
    viteContent.includes("**/dist/**"),
    "Prevents client & server production bundles from triggering dev loops.",
  );
  check(
    "Database artifacts ignored by file watcher",
    viteContent.includes("**/*.db*"),
    "Prevents SQLite WAL/SHM writes from causing server reloads.",
  );
  check(
    "Pre-bundled dependencies configured in optimizeDeps.include",
    viteContent.includes("@tanstack/react-router") &&
      viteContent.includes("@tanstack/react-query") &&
      viteContent.includes("date-fns"),
    "Prevents dynamic runtime dependency discovery freezes on page load.",
  );
} else {
  check("vite.config.ts found", false, "vite.config.ts not located.");
}

// 2. Audit TanStack Router Preload Throttling
console.log("\n[2/5] Auditing Navigation & Preload Throttling...");
const routerPath = path.resolve(rootDir, "src", "router.tsx");
if (fs.existsSync(routerPath)) {
  const routerContent = fs.readFileSync(routerPath, "utf-8");
  check(
    "defaultPreloadDelay active in router configuration",
    routerContent.includes("defaultPreloadDelay"),
    "Delays route preloading by 150ms to stop accidental cursor thrashing.",
  );
} else {
  check("src/router.tsx found", false, "src/router.tsx not located.");
}

// 3. Audit Server Rate Limiting & Dev Asset Bypass
console.log("\n[3/5] Auditing Server Request Pipeline...");
const serverPath = path.resolve(rootDir, "src", "server.ts");
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, "utf-8");
  check(
    "Internal dev/static assets bypass rate-limit evaluation",
    serverContent.includes('path.startsWith("/@")') &&
      serverContent.includes('path.startsWith("/src/")'),
    "Ensures dev asset floods do not incur rate limiter overhead or false 429s.",
  );
  check(
    "Rate limiter cleanup is throttled",
    serverContent.includes("lastRateLimitCleanup"),
    "Avoids full Map iteration on every HTTP request.",
  );
} else {
  check("src/server.ts found", false, "src/server.ts not located.");
}

// 4. Audit SQLite Database PRAGMAs & Memory Mappings
console.log("\n[4/5] Auditing SQLite Storage Engine Performance...");
const dbFilePath = path.resolve(rootDir, "data", "twinsec.db");
if (fs.existsSync(dbFilePath)) {
  try {
    const db = new Database(dbFilePath, { readonly: true });
    const journalMode = db.pragma("journal_mode", { simple: true });
    const synchronous = db.pragma("synchronous", { simple: true });
    db.close();

    check(
      "SQLite WAL Journal Mode active",
      String(journalMode).toLowerCase() === "wal",
      `Journal mode: ${journalMode} (Concurrent non-blocking read/writes).`,
    );
    check(
      "SQLite Synchronous set to NORMAL or OFF",
      synchronous === 1 || synchronous === 0,
      `Synchronous level: ${synchronous} (Optimized for SSD performance).`,
    );
  } catch (err) {
    check("Database PRAGMA inspection", false, String(err));
  }
} else {
  check("twinsec.db exists", false, "data/twinsec.db not found.");
}

// 5. Audit Production Artifact Footprint
console.log("\n[5/5] Auditing Build Artifact Footprints...");
const distClientPath = path.resolve(rootDir, "dist", "client", "assets");
if (fs.existsSync(distClientPath)) {
  const files = fs.readdirSync(distClientPath);
  const pdfChunk = files.find((f) => f.startsWith("vendor-pdf-"));
  const animChunk = files.find((f) => f.startsWith("vendor-animation-"));
  const tanstackChunk = files.find((f) => f.startsWith("vendor-tanstack-"));

  check(
    "Heavy PDF/canvas bundle isolated into vendor-pdf chunk",
    !!pdfChunk,
    pdfChunk ? `Found: ${pdfChunk}` : "vendor-pdf chunk not isolated",
  );
  check(
    "GSAP animation engine isolated into vendor-animation chunk",
    !!animChunk,
    animChunk ? `Found: ${animChunk}` : "vendor-animation chunk not isolated",
  );
  check(
    "TanStack framework isolated into vendor-tanstack chunk",
    !!tanstackChunk,
    tanstackChunk ? `Found: ${tanstackChunk}` : "vendor-tanstack chunk not isolated",
  );
} else {
  console.log("  ℹ Dist client artifacts not compiled yet. Run 'npm run build' to inspect.");
}

console.log("\n==================================================");
console.log(`  PERFORMANCE BENCHMARK AUDIT: ${passedChecks}/${totalChecks} CHECKS PASSED`);
if (passedChecks === totalChecks) {
  console.log("  STATUS: ALL REMEDIATION CONTROLS VERIFIED & ACTIVE");
} else {
  console.log("  STATUS: WARNING - SOME CONTROLS REQUIRE ATTENTION");
}
console.log("==================================================\n");
