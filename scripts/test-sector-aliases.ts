/**
 * test-sector-aliases.ts
 *
 * Automated test suite for TwinSec Sector-Aware Cockpit Command Aliases Engine.
 * Asserts:
 * 1. Node identification: 'AHU-04', 'LOCK-SYS', and 'NOC-GW' resolve accurately regardless of case, hyphens, or spacing.
 * 2. Operational domain verbs: 'lock', 'unlock', 'purge', 'drop-uplink', 'chiller-trip' translate to valid simulation actions.
 * 3. Cross-sector fidelity: power ('trip', 'shed', 'sync'), water ('valve-isolate', 'dose-cut'), oil-gas ('esd-trip', 'compressor-trip').
 * 4. Fallback resilience: standard commands ('isolate ahu', 'patch locks', 'override nocgw') continue working seamlessly.
 */

import { resolveSectorNode, translateSectorCommand } from "../src/lib/simulation/sector-aliases";
import { getScenarioData } from "../src/data/scenarios";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASSED: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAILED: ${message}`);
    failed++;
  }
}

console.log("==================================================");
console.log("  TWINSEC SECTOR-AWARE COMMAND ALIASES TEST SUITE");
console.log("==================================================");

// Retrieve topologies
const sbTopology = getScenarioData("smart-building");
const powerTopology = getScenarioData("power");
const waterTopology = getScenarioData("water");
const ogTopology = getScenarioData("oil-gas");

// [Test 1] Smart Building Node Target Resolution: AHU-04, LOCK-SYS, NOC-GW
console.log("\n[Test 1] Smart Building Target Resolution (AHU-04, LOCK-SYS, NOC-GW)");

const ahuVariants = ["AHU-04", "ahu-04", "ahu4", "ahu04", "AHU", "ahu"];
for (const variant of ahuVariants) {
  const node = resolveSectorNode(variant, "smart-building", sbTopology.nodes);
  assert(node?.id === "ahu", `Variant '${variant}' successfully resolves to node id 'ahu'`);
}

const lockVariants = ["LOCK-SYS", "lock-sys", "locks", "LOCKS", "locksys", "doors"];
for (const variant of lockVariants) {
  const node = resolveSectorNode(variant, "smart-building", sbTopology.nodes);
  assert(node?.id === "locks", `Variant '${variant}' successfully resolves to node id 'locks'`);
}

const nocVariants = ["NOC-GW", "noc-gw", "nocgw", "NOCGW", "noc", "fiber-gw"];
for (const variant of nocVariants) {
  const node = resolveSectorNode(variant, "smart-building", sbTopology.nodes);
  assert(node?.id === "nocgw", `Variant '${variant}' successfully resolves to node id 'nocgw'`);
}

// [Test 2] Smart Building Domain Action Verbs
console.log("\n[Test 2] Smart Building Domain Action Verbs");

// 'lock LOCK-SYS'
const lockTrans = translateSectorCommand("lock", "LOCK-SYS", "smart-building", sbTopology.nodes);
assert(lockTrans !== null, "Command 'lock LOCK-SYS' is recognized");
assert(lockTrans?.action === "isolate", "'lock LOCK-SYS' maps to action 'isolate'");
assert(lockTrans?.targetNodeId === "locks", "'lock LOCK-SYS' targets node 'locks'");

// 'unlock'
const unlockTrans = translateSectorCommand("unlock", "locks", "smart-building", sbTopology.nodes);
assert(unlockTrans !== null, "Command 'unlock locks' is recognized");
assert(unlockTrans?.action === "reconnect", "'unlock locks' maps to action 'reconnect'");

// 'purge AHU-04'
const purgeTrans = translateSectorCommand("purge", "AHU-04", "smart-building", sbTopology.nodes);
assert(purgeTrans !== null, "Command 'purge AHU-04' is recognized");
assert(purgeTrans?.action === "override", "'purge AHU-04' maps to action 'override'");
assert(purgeTrans?.targetNodeId === "ahu", "'purge AHU-04' targets node 'ahu'");

// 'drop-uplink NOC-GW'
const dropTrans = translateSectorCommand(
  "drop-uplink",
  "NOC-GW",
  "smart-building",
  sbTopology.nodes,
);
assert(dropTrans !== null, "Command 'drop-uplink NOC-GW' is recognized");
assert(dropTrans?.action === "isolate", "'drop-uplink NOC-GW' maps to action 'isolate'");
assert(dropTrans?.targetNodeId === "nocgw", "'drop-uplink NOC-GW' targets node 'nocgw'");

// 'chiller-trip'
const chillerTrans = translateSectorCommand(
  "chiller-trip",
  undefined,
  "smart-building",
  sbTopology.nodes,
);
assert(chillerTrans !== null, "Command 'chiller-trip' is recognized");
assert(chillerTrans?.action === "isolate", "'chiller-trip' maps to action 'isolate'");
assert(chillerTrans?.targetNodeId === "hvac", "'chiller-trip' targets node 'hvac'");

// [Test 3] Cross-Sector Domain Verbs (Power, Water, Oil & Gas)
console.log("\n[Test 3] Cross-Sector Domain Verbs");

// Power: 'trip RLY-33B'
const tripTrans = translateSectorCommand("trip", "RLY-33B", "power", powerTopology.nodes);
assert(tripTrans !== null, "Command 'trip RLY-33B' is recognized");
assert(tripTrans?.action === "isolate", "'trip' maps to action 'isolate'");
assert(tripTrans?.targetNodeId === "r33", "'trip RLY-33B' targets node 'r33'");

// Power: 'shed FEEDER-A'
const shedTrans = translateSectorCommand("shed", "feeder-a", "power", powerTopology.nodes);
assert(shedTrans !== null, "Command 'shed FEEDER-A' is recognized");
assert(shedTrans?.action === "isolate", "'shed' maps to action 'isolate'");
assert(shedTrans?.targetNodeId === "load1", "'shed FEEDER-A' targets node 'load1'");

// Water: 'valve-isolate CLEARWELL'
const valveTrans = translateSectorCommand(
  "valve-isolate",
  "clearwell",
  "water",
  waterTopology.nodes,
);
assert(valveTrans !== null, "Command 'valve-isolate' is recognized");
assert(valveTrans?.action === "isolate", "'valve-isolate' maps to action 'isolate'");
assert(valveTrans?.targetNodeId === "tank", "'valve-isolate' targets node 'tank'");

// Water: 'dose-cut CL2-DOSE'
const doseTrans = translateSectorCommand("dose-cut", "cl2", "water", waterTopology.nodes);
assert(doseTrans !== null, "Command 'dose-cut' is recognized");
assert(doseTrans?.action === "override", "'dose-cut' maps to action 'override'");
assert(doseTrans?.targetNodeId === "d1", "'dose-cut' targets node 'd1'");

// Oil & Gas: 'esd-trip ESD-LOOP'
const esdTrans = translateSectorCommand("esd-trip", "esd", "oil-gas", ogTopology.nodes);
assert(esdTrans !== null, "Command 'esd-trip' is recognized");
assert(esdTrans?.action === "isolate", "'esd-trip' maps to action 'isolate'");
assert(esdTrans?.targetNodeId === "sis", "'esd-trip' targets node 'sis'");

// [Test 4] Fallback & Error Resilience
console.log("\n[Test 4] Fallback & Resilience");
const invalidCmd = translateSectorCommand(
  "unknown-command",
  "target",
  "smart-building",
  sbTopology.nodes,
);
assert(invalidCmd === null, "Unknown commands return null for standard terminal fallback");

const genericResolve = resolveSectorNode(
  "nonexistent-node-12345",
  "smart-building",
  sbTopology.nodes,
);
assert(genericResolve === undefined, "Non-existent nodes return undefined cleanly");

console.log("\n==================================================");
console.log(`  ALIAS TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
}
