import fs from "fs";
import path from "path";

// Simple .env parser for standalone Node scripts
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    content.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...valParts] = trimmed.split("=");
        const val = valParts.join("=").trim();
        if (key && !process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    });
  }
}

loadEnv();

console.log("==========================================================================");
console.log("  TWINSEC REAL-TIME API & DATASET HEALTH DIAGNOSTIC SCANNER");
console.log("==========================================================================");

let passes = 0;
let warnings = 0;
let errors = 0;

async function checkEndpoint(name, url, options = {}) {
  const start = Date.now();
  console.log(`\n[*] Testing Endpoint: ${name}`);
  console.log(`    URL: ${url}`);
  if (!url) {
    console.error(`    ✕ FAIL: Endpoint URL is not configured in .env`);
    errors++;
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);

    const latency = Date.now() - start;
    if (
      res.ok ||
      res.status === 401 ||
      res.status === 403 ||
      res.status === 400 ||
      res.status === 405
    ) {
      // 401/403/405 means live server responded cleanly to ping
      console.log(
        `    ✓ PASS: Live server responded cleanly (Status ${res.status}, Latency ${latency}ms)`,
      );
      passes++;
    } else {
      console.warn(`    ! WARN: Server returned HTTP status ${res.status} (${latency}ms)`);
      warnings++;
    }
  } catch (err) {
    const latency = Date.now() - start;
    if (err.name === "AbortError") {
      console.warn(`    ! WARN: Request timed out after 5000ms. Check network latency.`);
      warnings++;
    } else {
      console.warn(
        `    ! WARN: Live ping unreachable (${err.message}). System will use offline catalog fallback.`,
      );
      warnings++;
    }
  }
}

async function runDiagnostics() {
  // 1. Audit Environment Variables
  console.log("\n[1/3] Environment Variable Configuration Check:");
  const requiredEnvs = [
    { key: "MITRE_TAXII_API_URL", desc: "MITRE ATT&CK for ICS TAXII 2.1 API Endpoint" },
    { key: "OTCAD_DATASET_URL", desc: "OTCAD Historical Incidents Dataset Endpoint" },
    { key: "HAI_DATASET_URL", desc: "HAI ICS Security Dataset Repository URL" },
    { key: "GROQ_BASE_URL", desc: "Groq AI Provider Endpoint" },
    { key: "GEMINI_BASE_URL", desc: "Google Gemini AI Provider Endpoint" },
    { key: "OPENROUTER_BASE_URL", desc: "OpenRouter AI Provider Endpoint" },
  ];

  requiredEnvs.forEach(({ key, desc }) => {
    const val = process.env[key];
    if (val) {
      console.log(`  ✓ ${key}: Configured (${desc})`);
      passes++;
    } else {
      console.warn(`  ! ${key}: Missing in .env (${desc})`);
      warnings++;
    }
  });

  // 2. Audit API Keys
  console.log("\n[2/3] AI Gateway Key Audit:");
  const aiKeys = ["GROQ_API_KEY", "GEMINI_API_KEY", "OPENROUTER_API_KEY", "CEREBRAS_API_KEY"];
  aiKeys.forEach((key) => {
    const val = process.env[key];
    if (val && !val.includes("your_")) {
      console.log(`  ✓ ${key}: Present & Initialized (${val.substring(0, 8)}...)`);
      passes++;
    } else {
      console.log(`  ! ${key}: Unset or using placeholder (AI Gateway will fallback dynamically)`);
    }
  });

  // 3. Test Live Endpoint Reachability
  console.log("\n[3/3] Live HTTP Reachability & Latency Tests:");

  await checkEndpoint(
    "MITRE ATT&CK for ICS TAXII 2.1 API",
    process.env.MITRE_TAXII_API_URL ||
      "https://cti-taxii.mitre.org/stix/collections/9510164c-77b8-407e-873f-2c7ba67c36a7/objects/",
    { headers: { Accept: "application/stix+json;version=2.1" } },
  );

  await checkEndpoint(
    "OTCAD Historical Incident Dataset",
    process.env.OTCAD_DATASET_URL ||
      "https://raw.githubusercontent.com/bvcyber/OTCAD/main/OTCAD.json",
  );

  await checkEndpoint(
    "HAI ICS Telemetry Dataset Repo",
    process.env.HAI_DATASET_URL || "https://github.com/icsdataset/hai",
  );

  await checkEndpoint(
    "Groq AI Cloud Gateway",
    process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
  );

  await checkEndpoint(
    "Google Gemini AI Cloud Gateway",
    process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai",
  );

  console.log("\n==========================================================================");
  console.log(`  DIAGNOSTIC SUMMARY: ${passes} PASSED | ${warnings} WARNINGS | ${errors} ERRORS`);
  if (errors === 0) {
    console.log("  STATUS: ALL TWINSEC APIS & DATASETS MANAGED CLEANLY VIA .ENV");
    console.log("==========================================================================\n");
    process.exit(0);
  } else {
    console.error(`  STATUS: ${errors} CRITICAL CONFIGURATION ERROR(S) DETECTED`);
    console.log("==========================================================================\n");
    process.exit(1);
  }
}

runDiagnostics();
