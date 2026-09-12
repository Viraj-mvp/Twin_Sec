import { getScenarioData, SECTOR_IDS } from "../src/data/scenarios";
import {
  isNodeReachableFromCompromised,
  evaluateSimulationState,
} from "../src/lib/simulation-graph";
import { CASE_FILES } from "../src/data/case-files";

console.log("==================================================");
console.log("  TWINSEC SECTOR TOPOLOGY & GRAPH ENGINE TEST SUITE");
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

// -----------------------------------------------------------------
// TEST CASE 1: Sector Topology Nodes, Coordinates & Edges Integrity
// -----------------------------------------------------------------
console.log("[Test Case 1] Sector Topologies Node Labels, Coordinates & Edge Connections");

SECTOR_IDS.forEach((sector) => {
  const scenario = getScenarioData(sector);
  const { nodes, edges } = scenario;

  assert(
    nodes && nodes.length >= 5,
    `Sector '${sector}' has at least 5 SCADA nodes (${nodes?.length} found)`,
  );
  assert(
    edges && edges.length >= 4,
    `Sector '${sector}' has at least 4 directed edges (${edges?.length} found)`,
  );

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Verify node labels, coordinates, and rings
  let validNodes = true;
  nodes.forEach((n) => {
    if (
      !n.id ||
      !n.label ||
      typeof n.x !== "number" ||
      typeof n.y !== "number" ||
      typeof n.ring !== "number"
    ) {
      validNodes = false;
    }
    if (n.x < 0 || n.x > 100 || n.y < 0 || n.y > 100) {
      validNodes = false;
    }
  });

  assert(
    validNodes,
    `Sector '${sector}' node coordinates are bounded within 0-100 grid and have valid labels`,
  );

  // Verify edges connect existing node IDs
  let validEdges = true;
  edges.forEach((e) => {
    if (!nodeMap.has(e.from) || !nodeMap.has(e.to)) {
      validEdges = false;
      console.error(`    ✕ Invalid edge in ${sector}: ${e.from} -> ${e.to}`);
    }
  });

  assert(validEdges, `Sector '${sector}' all edge endpoints point to valid existing node IDs`);
});

// -----------------------------------------------------------------
// TEST CASE 2: Graph Reachability & Air-Gap Containment Performance
// -----------------------------------------------------------------
console.log("\n[Test Case 2] Graph Reachability BFS & Air-Gap Severance Engine");

const powerScenario = getScenarioData("power");
const compromised = new Set(["g1"]);
const isolated = new Set(["tx1"]);

// Test unisolated reachability
const isReachableBeforeIsolation = isNodeReachableFromCompromised(
  "sub1",
  compromised,
  powerScenario.edges,
  new Set(),
);
assert(
  isReachableBeforeIsolation === true,
  "Substation SUB1 is reachable from Generator G1 when no nodes are air-gapped",
);

// Test isolated air-gap reachability
const isReachableAfterIsolation = isNodeReachableFromCompromised(
  "sub1",
  compromised,
  powerScenario.edges,
  isolated,
);
assert(
  isReachableAfterIsolation === false,
  "Substation SUB1 becomes UNREACHABLE when Transformer TX1 is air-gapped/isolated",
);

// -----------------------------------------------------------------
// TEST CASE 3: Dynamic Physics State Evaluation Benchmark
// -----------------------------------------------------------------
console.log("\n[Test Case 3] Dynamic Physics & MTTD/MTTR Graph State Benchmark");

const startTime = performance.now();
const evalCount = 1000;
for (let i = 0; i < evalCount; i++) {
  evaluateSimulationState({
    t: i * 5,
    nodes: powerScenario.nodes,
    edges: powerScenario.edges,
    events: powerScenario.events,
    decisions: powerScenario.decisions,
    choices: { d1: "ACT" },
    isolatedNodes: isolated,
  });
}
const elapsedMs = performance.now() - startTime;
const msPerEval = elapsedMs / evalCount;

assert(
  msPerEval < 1.0,
  `Graph evaluation is ultra-fast (< 1.0ms per frame). Measured: ${msPerEval.toFixed(3)} ms/eval`,
);

// -----------------------------------------------------------------
// TEST CASE 4: Historic ICS Cyber Attack Case Files Verification
// -----------------------------------------------------------------
console.log("\n[Test Case 4] Famous Historic ICS Cyber Attack Scenarios Integrity");

const famousCases = ["stuxnet", "ukraine-grid", "triton", "oldsmar-water", "colonial-pipeline"];

famousCases.forEach((caseId) => {
  const cFile = CASE_FILES.find((c) => c.id === caseId);
  assert(cFile !== undefined, `Historic case file '${caseId}' registered in case-files database`);
  if (cFile) {
    assert(
      cFile.story && cFile.story.timeline.length >= 3,
      `Case file '${caseId}' contains detailed story timeline`,
    );
    assert(
      cFile.mitreMapping && cFile.mitreMapping.length >= 2,
      `Case file '${caseId}' mapped to MITRE ATT&CK for ICS TTPs`,
    );
  }
});

// -----------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------
console.log("\n==================================================");
console.log(`  SECTOR TOPOLOGY TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
if (failed === 0) {
  console.log("  SUCCESS: ALL SECTOR TOPOLOGY & GRAPH TESTS PASSED 100%");
  console.log("==================================================\n");
  process.exit(0);
} else {
  console.error("  FAILURE: ONE OR MORE TOPOLOGY TESTS FAILED");
  console.log("==================================================\n");
  process.exit(1);
}
