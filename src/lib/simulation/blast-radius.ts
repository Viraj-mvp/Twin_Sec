/**
 * blast-radius.ts
 *
 * Real-time graph partitioning and geometric hull projection engine for the
 * TwinSec Interactive Air-Gap Blast-Radius Simulator.
 *
 * Evaluates the cyber-physical consequences of severing an industrial node v_target:
 * G' = (V \ {v_target}, E \ E(v_target))
 *
 * Deterministically partitions the network into:
 * 1. Telemetry Loss Zone (V_blind): Devices disconnected from supervisory nodes
 * 2. Infection Blocked Zone (V_protected): Clean assets shielded from adversary foothold
 * 3. Trapped Threat Zone (V_quarantined): Adversary nodes isolated in severed enclave
 *
 * Generates smooth SVG path strings for 1-node, 2-node, and 3+ node convex hulls
 * with zero external dependencies.
 */

import type { Node, Edge } from "@/data/scenarios";

export interface BlastRadiusMetrics {
  totalAssets: number;
  blindedCount: number;
  blindnessPercentage: number;
  containmentScoreDelta: number;
  safetySystemsIntact: boolean;
}

export interface BlastRadiusResult {
  targetNodeId: string;
  targetNodeLabel: string;
  blindedNodeIds: string[];
  protectedNodeIds: string[];
  quarantinedNodeIds: string[];
  severedEdgeKeys: string[];
  blindedHullPath: string | null;
  protectedHullPath: string | null;
  metrics: BlastRadiusMetrics;
}

/**
 * Determines whether a node acts as a supervisory root (HMI, Historian, Engineering Station, SCADA master)
 */
export function isSupervisoryNode(node: Node): boolean {
  const id = node.id.toLowerCase();
  const kind = node.kind.toLowerCase();
  const exp = (node.exposure || "").toLowerCase();

  return (
    id === "ews-04" ||
    id === "hist" ||
    id === "hmi-11" ||
    id === "bms" ||
    id === "scada" ||
    id === "nocgw" ||
    id === "noc" ||
    id === "tos" ||
    id === "mes" ||
    id === "server" ||
    exp.includes("l4") ||
    exp.includes("l3") ||
    exp.includes("dmz") ||
    exp.includes("it") ||
    kind.includes("engineering") ||
    kind.includes("historian") ||
    kind.includes("console") ||
    kind.includes("scada") ||
    kind.includes("server") ||
    kind.includes("gateway")
  );
}

/**
 * Determines whether a node is a critical safety system (SIS, Fire, Emergency Interlock)
 */
export function isCriticalSafetyNode(node: Node): boolean {
  const id = node.id.toLowerCase();
  const label = node.label.toLowerCase();
  const kind = node.kind.toLowerCase();

  return (
    id === "sis" ||
    id === "fire" ||
    id === "psv1" ||
    label.includes("sis") ||
    label.includes("fire") ||
    label.includes("esd") ||
    label.includes("safe") ||
    label.includes("reefer") ||
    label.includes("ems") ||
    kind.includes("safety") ||
    kind.includes("interlock") ||
    kind.includes("emergency") ||
    kind.includes("relay")
  );
}

/**
 * Helper to build an undirected adjacency list from edges
 */
function buildAdjacencyList(
  nodes: Node[],
  edges: Edge[],
  excludedNodeIds: Set<string>,
): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const n of nodes) {
    if (!excludedNodeIds.has(n.id)) {
      adj.set(n.id, []);
    }
  }

  for (const e of edges) {
    if (!excludedNodeIds.has(e.from) && !excludedNodeIds.has(e.to)) {
      adj.get(e.from)?.push(e.to);
      adj.get(e.to)?.push(e.from);
    }
  }

  return adj;
}

/**
 * Breadth-First Search reachability in undirected graph
 */
function getReachableNodes(startNodes: string[], adj: Map<string, string[]>): Set<string> {
  const visited = new Set<string>();
  const queue: string[] = [];

  for (const s of startNodes) {
    if (adj.has(s) && !visited.has(s)) {
      visited.add(s);
      queue.push(s);
    }
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const neighbors = adj.get(curr) || [];
    for (const nxt of neighbors) {
      if (!visited.has(nxt)) {
        visited.add(nxt);
        queue.push(nxt);
      }
    }
  }

  return visited;
}

/* ------------------------------------------------------------------ */
/* GEOMETRIC CONVEX HULL & BOUNDING CAPSULE ENGINE                    */
/* ------------------------------------------------------------------ */

interface Point {
  x: number;
  y: number;
}

function crossProduct(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/**
 * Generates an SVG path string for a point set with automated geometry branching:
 * - 0 points: null
 * - 1 point: circular bubble
 * - 2 points: oriented stadium capsule
 * - 3+ points: Monotone Chain convex hull with outward normal vertex buffer
 */
export function generateHullPath(points: Point[], buffer: number = 5.5): string | null {
  if (points.length === 0) return null;

  // Single node: circular pill
  if (points.length === 1) {
    const { x, y } = points[0];
    const r = buffer * 1.25;
    return `M ${x - r} ${y} A ${r} ${r} 0 1 0 ${x + r} ${y} A ${r} ${r} 0 1 0 ${x - r} ${y} Z`;
  }

  // Two nodes: oriented capsule around the pair
  if (points.length === 2) {
    const [p1, p2] = points;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return generateHullPath([p1], buffer);

    const nx = (-dy / len) * buffer;
    const ny = (dx / len) * buffer;

    const c1 = { x: p1.x + nx, y: p1.y + ny };
    const c2 = { x: p2.x + nx, y: p2.y + ny };
    const c3 = { x: p2.x - nx, y: p2.y - ny };
    const c4 = { x: p1.x - nx, y: p1.y - ny };

    return `M ${c1.x.toFixed(2)} ${c1.y.toFixed(2)} L ${c2.x.toFixed(2)} ${c2.y.toFixed(2)} A ${buffer} ${buffer} 0 0 1 ${c3.x.toFixed(2)} ${c3.y.toFixed(2)} L ${c4.x.toFixed(2)} ${c4.y.toFixed(2)} A ${buffer} ${buffer} 0 0 1 ${c1.x.toFixed(2)} ${c1.y.toFixed(2)} Z`;
  }

  // 3+ nodes: Monotone Chain 2D Convex Hull
  const sorted = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

  // Lower hull
  const lower: Point[] = [];
  for (const p of sorted) {
    while (
      lower.length >= 2 &&
      crossProduct(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  // Upper hull
  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (
      upper.length >= 2 &&
      crossProduct(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }

  // Combine hulls (last point of lower and upper is duplicate)
  lower.pop();
  upper.pop();
  const hull = lower.concat(upper);

  if (hull.length < 3) {
    return generateHullPath(hull.slice(0, 2), buffer);
  }

  // Expand hull outward along vertex normal bisectors
  const n = hull.length;
  const bufferedPoints: Point[] = [];

  for (let i = 0; i < n; i++) {
    const prev = hull[(i - 1 + n) % n];
    const curr = hull[i];
    const next = hull[(i + 1) % n];

    // Edge vectors
    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };

    const l1 = Math.hypot(v1.x, v1.y) || 1;
    const l2 = Math.hypot(v2.x, v2.y) || 1;

    // Normal vectors (pointing outward for CCW hull)
    const n1 = { x: -v1.y / l1, y: v1.x / l1 };
    const n2 = { x: -v2.y / l2, y: v2.x / l2 };

    // Bisector
    let bx = n1.x + n2.x;
    let by = n1.y + n2.y;
    const bl = Math.hypot(bx, by) || 1;
    bx /= bl;
    by /= bl;

    bufferedPoints.push({
      x: curr.x + bx * buffer,
      y: curr.y + by * buffer,
    });
  }

  // Construct SVG polygon path
  const [first, ...rest] = bufferedPoints;
  const pathD =
    `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} ` +
    rest.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ") +
    " Z";

  return pathD;
}

/* ------------------------------------------------------------------ */
/* MAIN BLAST-RADIUS COMPUTATION                                      */
/* ------------------------------------------------------------------ */

export function computeBlastRadius(
  nodes: Node[],
  edges: Edge[],
  targetNodeId: string,
  compromisedNodeIds: Set<string> = new Set(),
  currentlyIsolatedNodeIds: Set<string> = new Set(),
  mapCoords?: (x: number, y: number) => { x: number; y: number },
  bufferRadius: number = 6.0,
): BlastRadiusResult {
  const targetNode = nodes.find((n) => n.id === targetNodeId);
  const targetLabel = targetNode ? targetNode.label : targetNodeId.toUpperCase();

  // Severed edges are all incident links to targetNodeId that aren't already severed
  const severedEdgeKeys = edges
    .filter(
      (e) =>
        (e.from === targetNodeId || e.to === targetNodeId) &&
        !currentlyIsolatedNodeIds.has(e.from) &&
        !currentlyIsolatedNodeIds.has(e.to),
    )
    .map((e) => `${e.from}->${e.to}`);

  // Base excluded nodes: targetNodeId + previously isolated nodes
  const excluded = new Set<string>([...Array.from(currentlyIsolatedNodeIds), targetNodeId]);

  // Identify supervisory roots in remaining graph
  const allSupervisory = nodes.filter((n) => isSupervisoryNode(n));
  const activeSupervisory = allSupervisory.filter((n) => !excluded.has(n.id)).map((n) => n.id);

  // If no supervisory roots remain unexcluded, default to the lowest ring node (L3/L2)
  if (activeSupervisory.length === 0) {
    const fallback = nodes.filter((n) => !excluded.has(n.id)).sort((a, b) => a.ring - b.ring)[0];
    if (fallback) activeSupervisory.push(fallback.id);
  }

  // Graph G' without targetNode and without previously isolated nodes
  const adjGPrime = buildAdjacencyList(nodes, edges, excluded);

  // Reachable from supervisory roots in G'
  const reachableFromSupervisory = getReachableNodes(activeSupervisory, adjGPrime);

  // 1. Telemetry Loss Partition (V_blind)
  // Devices that are NOT the target, NOT previously isolated, and CANNOT reach any supervisory node
  const blindedNodes = nodes.filter(
    (n) => !excluded.has(n.id) && !reachableFromSupervisory.has(n.id),
  );
  const blindedNodeIds = blindedNodes.map((n) => n.id);

  // Original graph G (with target node, but without previously isolated nodes)
  const adjG = buildAdjacencyList(nodes, edges, currentlyIsolatedNodeIds);
  const activeCompromised = Array.from(compromisedNodeIds).filter(
    (c) => !currentlyIsolatedNodeIds.has(c),
  );

  // In original G: what could compromised nodes reach?
  const originalThreatReachable = getReachableNodes(activeCompromised, adjG);

  // In G': what can compromised nodes reach now?
  const activeCompromisedGPrime = activeCompromised.filter((c) => !excluded.has(c));
  const newThreatReachable = getReachableNodes(activeCompromisedGPrime, adjGPrime);

  // 2. Infection Blocked Partition (V_protected)
  // Nodes that were reachable by threat in G, but are NO LONGER reachable in G'
  const protectedNodes = nodes.filter(
    (n) =>
      !excluded.has(n.id) &&
      !compromisedNodeIds.has(n.id) &&
      originalThreatReachable.has(n.id) &&
      !newThreatReachable.has(n.id),
  );
  const protectedNodeIds = protectedNodes.map((n) => n.id);

  // 3. Trapped Threat Partition (V_quarantined)
  // Compromised nodes that now have zero path to critical safety systems
  const criticalSafetyNodes = nodes.filter((n) => isCriticalSafetyNode(n)).map((n) => n.id);
  const quarantinedNodeIds = activeCompromisedGPrime.filter((c) => {
    const reach = getReachableNodes([c], adjGPrime);
    return !criticalSafetyNodes.some((safe) => reach.has(safe));
  });

  // Calculate Hulls
  const transform = mapCoords || ((x: number, y: number) => ({ x, y }));
  const blindedPoints = blindedNodes.map((n) => transform(n.x, n.y));
  const protectedPoints = protectedNodes.map((n) => transform(n.x, n.y));

  const blindedHullPath = generateHullPath(blindedPoints, bufferRadius);
  const protectedHullPath = generateHullPath(protectedPoints, bufferRadius);

  // Metrics calculation
  const totalAssets = nodes.length;
  const blindedCount = blindedNodeIds.length;
  const blindnessPercentage = Math.round((blindedCount / Math.max(1, totalAssets)) * 100);

  // Containment score delta (+% increase in isolated threat vector)
  const threatsContained =
    activeCompromised.length > 0 &&
    (targetNodeId === "nocgw" ||
      compromisedNodeIds.has(targetNodeId) ||
      protectedNodeIds.length > 0);
  const containmentScoreDelta = threatsContained
    ? Math.min(100, Math.round(35 + protectedNodeIds.length * 15))
    : 0;

  // Check if critical safety systems remain reachable from supervisory or remain intact
  const safetySystemsIntact = criticalSafetyNodes.every((sId) => {
    return !compromisedNodeIds.has(sId) && !blindedNodeIds.includes(sId);
  });

  return {
    targetNodeId,
    targetNodeLabel: targetLabel,
    blindedNodeIds,
    protectedNodeIds,
    quarantinedNodeIds,
    severedEdgeKeys,
    blindedHullPath,
    protectedHullPath,
    metrics: {
      totalAssets,
      blindedCount,
      blindnessPercentage,
      containmentScoreDelta,
      safetySystemsIntact,
    },
  };
}
