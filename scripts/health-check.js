import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

console.log("==================================================");
console.log("  TWINSEC REGULAR SYSTEM & SCENARIO HEALTH CHECK");
console.log("==================================================");

let errors = 0;

// 1. Check Data Directory & Database
const dataDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.resolve(dataDir, "twinsec.db");
console.log(`\n[1/4] Checking SQLite Database connection at: ${dbPath}`);
try {
  const db = new Database(dbPath);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const tableNames = tables.map((t) => t.name);
  console.log(`  ✓ Database connected cleanly. Tables found: ${tableNames.join(", ")}`);

  if (!tableNames.includes("operators")) {
    console.error("  ✕ ERROR: 'operators' table missing");
    errors++;
  }
  if (!tableNames.includes("training_runs")) {
    console.error("  ✕ ERROR: 'training_runs' table missing");
    errors++;
  }
  if (!tableNames.includes("simulation_scenarios")) {
    console.error("  ✕ ERROR: 'simulation_scenarios' table missing");
    errors++;
  }
  db.close();
} catch (err) {
  console.error(`  ✕ Database connection failed: ${err.message}`);
  errors++;
}

// 2. Check Static Assets & Schematics
console.log("\n[2/4] Checking Facility & Schematic Image Assets...");
const assetsDir = path.resolve(process.cwd(), "src", "assets");
const requiredAssets = [
  "facility.jpg",
  "schematic.jpg",
  "power.jpg",
  "Muncipal.png",
  "oil-gas.png",
  "manufacturing.jpg",
  "port.jpg",
  "smart-building.jpg",
  "smart-city.jpg",
  "mindhunter.png",
];

requiredAssets.forEach((asset) => {
  const p = path.join(assetsDir, asset);
  if (fs.existsSync(p)) {
    console.log(`  ✓ Found asset: ${asset}`);
  } else {
    console.error(`  ✕ Missing asset: ${asset}`);
    errors++;
  }
});

// 3. Check AI Provider Key Configuration
console.log("\n[3/4] Checking AI Provider API Keys...");
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  const keysFound = [];
  if (envContent.includes("GROQ_API_KEY=")) keysFound.push("Groq");
  if (envContent.includes("GEMINI_API_KEY=")) keysFound.push("Gemini");
  if (envContent.includes("OPENROUTER_API_KEY=")) keysFound.push("OpenRouter");
  if (envContent.includes("CEREBRAS_API_KEY=")) keysFound.push("Cerebras");
  console.log(
    `  ✓ .env file present. API Keys configured: ${keysFound.join(", ") || "None (will use local fallback)"}`,
  );
} else {
  console.log("  ! Notice: No .env file found. System will rely on fallback templates.");
}

// 4. Build Output Artifact Check
console.log("\n[4/4] Checking Production Build Dist Directory...");
const distClient = path.resolve(process.cwd(), "dist", "client");
const distServer = path.resolve(process.cwd(), "dist", "server");
if (fs.existsSync(distClient) && fs.existsSync(distServer)) {
  console.log("  ✓ Production build artifacts exist in dist/ (Client & Server).");
} else {
  console.log(
    "  ! Notice: Production bundle not built yet. Run 'npm run build' before deployment.",
  );
}

console.log("\n==================================================");
if (errors === 0) {
  console.log("  SUCCESS: ALL SYSTEM HEALTH CHECKS PASSED 100%");
  console.log("  TWINSEC IS READY FOR PRESENTATION & DEMONSTRATION!");
  console.log("==================================================\n");
  process.exit(0);
} else {
  console.error(`  FAILURE: ${errors} HEALTH CHECK ERROR(S) DETECTED`);
  console.log("==================================================\n");
  process.exit(1);
}
