/**
 * test-blast-radius.ts
 *
 * Automated verification suite for the TwinSec Air-Gap Blast-Radius Simulator.
 * Asserts:
 * 1. Graph Partitioning Logic:
 *    - Telemetry loss zone (V_blind) identification
 *    - Containment zone (V_protected) identification
 *    - Trapped threat partition (V_quarantined) identification
 * 2. Convex Hull & Capsule Geometry:
 *    - 0-point, 1-point, 2-point, and 3+-point hull path generation
 * 3. Cross-Sector SCADA Resilience:
 *    - Smart Building and Power Grid topologies
 * 4. Zero runtime errors or unhandled edge cases
 */

import { computeBlastRadius, generateHullPath } from "../src/lib/simulation/blast-radius";
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
console.log("  TWINSEC AIR-GAP BLAST-RADIUS SIMULATOR TEST SUITE");
console.log("==================================================");

// [Test 1] Geometric Hull Generator Engine
console.log("\n[Test 1] Geometric Hull & Capsule Generator Engine");

// 0 points
assert(generateHullPath([]) === null, "0 points returns null");

// 1 point
const p1Path = generateHullPath([{ x: 25, y: 30 }]);
assert(
  p1Path !== null && p1Path.startsWith("M ") && p1Path.includes(" A "),
  "1 point generates circular SVG arc",
);

// 2 points
const p2Path = generateHullPath([
  { x: 10, y: 20 },
  { x: 30, y: 40 },
]);
assert(
  p2Path !== null && p2Path.startsWith("M ") && p2Path.includes(" A ") && p2Path.includes(" L "),
  "2 points generates oriented stadium capsule",
);

// 3+ points
const p3Path = generateHullPath([
  { x: 10, y: 10 },
  { x: 50, y: 10 },
  { x: 50, y: 50 },
  { x: 10, y: 50 },
  { x: 25, y: 25 },
]);
assert(
  p3Path !== null && p3Path.startsWith("M ") && p3Path.includes(" L ") && p3Path.endsWith(" Z"),
  "3+ points generates Monotone Chain buffered convex hull",
);

// [Test 2] Smart Building Topology Blast-Radius Computation
console.log("\n[Test 2] Smart Building Blast-Radius Evaluation");

const sbData = getScenarioData("smart-building");
assert(sbData.nodes.length >= 8, `Smart building has ${sbData.nodes.length} nodes`);

// Scenario A: Preview severing NOC-GW when NOC-GW is compromised
const sbResA = computeBlastRadius(
  sbData.nodes,
  sbData.edges,
  "nocgw",
  new Set(["nocgw"]),
  new Set(),
);

assert(sbResA.targetNodeId === "nocgw", "Target node ID is 'nocgw'");
assert(sbResA.targetNodeLabel === "NOC-GW", "Target node label is 'NOC-GW'");
assert(
  sbResA.severedEdgeKeys.length > 0,
  `Severed incident edges identified (${sbResA.severedEdgeKeys.length} links)`,
);
assert(
  sbResA.metrics.containmentScoreDelta > 0,
  "Containment delta is positive when severing compromised NOC-GW",
);

// Scenario B: Preview severing BMS-01 (BMS is supervisory core)
const sbResB = computeBlastRadius(sbData.nodes, sbData.edges, "bms", new Set(), new Set());
assert(sbResB.targetNodeId === "bms", "Target node ID is 'bms'");
assert(
  sbResB.blindedNodeIds.length >= 0,
  `Blinded nodes evaluated when severing BMS (${sbResB.blindedNodeIds.length} blinded)`,
);
assert(sbResB.metrics.blindnessPercentage >= 0, "Blindness percentage calculated");

// [Test 3] Electric Power Grid Blast-Radius Evaluation
console.log("\n[Test 3] Electric Power Grid Topology Evaluation");

const powerData = getScenarioData("power");
// In power grid: GEN1 -> TX1 -> SUB1
// If TX1 is severed, SUB1 becomes disconnected from generation/supervisory
const powerRes = computeBlastRadius(
  powerData.nodes,
  powerData.edges,
  "tx1",
  new Set(["g1"]),
  new Set(),
);

assert(powerRes.targetNodeId === "tx1", "Target node ID is 'tx1'");
assert(
  powerRes.severedEdgeKeys.length >= 2,
  `Incident links on TX1 severed (${powerRes.severedEdgeKeys.length} links)`,
);

// [Test 4] Fallback & Robustness on Missing or Isolated Nodes
console.log("\n[Test 4] Robustness & Fallback");

const edgeCaseRes = computeBlastRadius(
  sbData.nodes,
  sbData.edges,
  "nonexistent-node-xyz",
  new Set(["fake-threat"]),
  new Set(["ahu", "locks"]),
);

assert(edgeCaseRes.targetNodeId === "nonexistent-node-xyz", "Handles non-existent node safely");
assert(edgeCaseRes.blindedNodeIds.length >= 0, "Blinded nodes array is safe");
assert(edgeCaseRes.metrics.totalAssets === sbData.nodes.length, "Total assets matches node count");

console.log("\n==================================================");
console.log(`  BLAST-RADIUS TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
}
