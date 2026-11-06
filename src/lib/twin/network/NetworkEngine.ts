/**
 * NetworkEngine.ts
 *
 * Industrial Purdue-model network simulation and reachability engine.
 * Implements zone-based access control, firewall policy checks,
 * dynamic air-gap isolation, and sub-millisecond BFS reachability graph traversal.
 */

import type { SecurityZone, NetworkState, FirewallRule } from "../TwinState";

export interface NetworkEdge {
  id: string;
  from: string;
  to: string;
  protocol?: string;
  bidirectional?: boolean;
}

export interface NetworkNodeConfig {
  id: string;
  zone: SecurityZone;
  purdueLevel: number;
}

export class NetworkEngine {
  private nodes: Map<string, NetworkNodeConfig> = new Map();
  private edges: NetworkEdge[] = [];
  private isolatedNodes: Set<string> = new Set();
  private severedEdges: Set<string> = new Set(); // set of "from->to" or "to->from" keys
  private firewallRules: Map<string, FirewallRule> = new Map();

  constructor(nodes: NetworkNodeConfig[] = [], edges: NetworkEdge[] = []) {
    for (const node of nodes) {
      this.nodes.set(node.id, node);
    }
    this.edges = [...edges];
    this.initDefaultFirewallRules();
  }

  private edgeKey(from: string, to: string): string {
    return `${from}->${to}`;
  }

  private initDefaultFirewallRules(): void {
    // Default Purdue rules:
    // ENTERPRISE <-> DMZ allowed
    // DMZ <-> SCADA allowed (restricted protocols: HTTPS, SSH)
    // SCADA <-> CONTROL allowed (Modbus, CIP, DNP3, OPC-UA)
    // CONTROL <-> PROCESS allowed (hardwired/fieldbus 4-20mA, Modbus RTU)
    // Direct ENTERPRISE -> CONTROL or PROCESS is BLOCKED by default (Air-gap / Firewall rule)
    const defaultRules: FirewallRule[] = [
      {
        id: "fw-ent-dmz",
        fromZone: "ENTERPRISE",
        toZone: "DMZ",
        protocol: "ANY",
        allowed: true,
        active: true,
      },
      {
        id: "fw-dmz-scada",
        fromZone: "DMZ",
        toZone: "SCADA",
        protocol: "ANY",
        allowed: true,
        active: true,
      },
      {
        id: "fw-scada-control",
        fromZone: "SCADA",
        toZone: "CONTROL",
        protocol: "ANY",
        allowed: true,
        active: true,
      },
      {
        id: "fw-control-process",
        fromZone: "CONTROL",
        toZone: "PROCESS",
        protocol: "ANY",
        allowed: true,
        active: true,
      },
      // Direct jump bypass block
      {
        id: "fw-ent-scada-block",
        fromZone: "ENTERPRISE",
        toZone: "SCADA",
        protocol: "ANY",
        allowed: false,
        active: true,
      },
      {
        id: "fw-ent-control-block",
        fromZone: "ENTERPRISE",
        toZone: "CONTROL",
        protocol: "ANY",
        allowed: false,
        active: true,
      },
      {
        id: "fw-ent-proc-block",
        fromZone: "ENTERPRISE",
        toZone: "PROCESS",
        protocol: "ANY",
        allowed: false,
        active: true,
      },
      {
        id: "fw-dmz-control-block",
        fromZone: "DMZ",
        toZone: "CONTROL",
        protocol: "ANY",
        allowed: false,
        active: true,
      },
      {
        id: "fw-dmz-proc-block",
        fromZone: "DMZ",
        toZone: "PROCESS",
        protocol: "ANY",
        allowed: false,
        active: true,
      },
    ];

    for (const rule of defaultRules) {
      this.firewallRules.set(rule.id, rule);
    }
  }

  public addNode(node: NetworkNodeConfig): void {
    this.nodes.set(node.id, node);
  }

  public addEdge(edge: NetworkEdge): void {
    this.edges.push(edge);
  }

  public isolateAsset(assetId: string): boolean {
    if (!this.nodes.has(assetId)) return false;
    this.isolatedNodes.add(assetId);
    return true;
  }

  public reconnectAsset(assetId: string): boolean {
    return this.isolatedNodes.delete(assetId);
  }

  public isAssetIsolated(assetId: string): boolean {
    return this.isolatedNodes.has(assetId);
  }

  public severEdge(from: string, to: string): void {
    this.severedEdges.add(this.edgeKey(from, to));
    this.severedEdges.add(this.edgeKey(to, from));
  }

  public restoreEdge(from: string, to: string): void {
    this.severedEdges.delete(this.edgeKey(from, to));
    this.severedEdges.delete(this.edgeKey(to, from));
  }

  public isEdgeSevered(from: string, to: string): boolean {
    return (
      this.severedEdges.has(this.edgeKey(from, to)) || this.severedEdges.has(this.edgeKey(to, from))
    );
  }

  /**
   * Check if zone-to-zone communication is permitted by active firewall rules.
   */
  public isZoneTrafficAllowed(
    fromZone: SecurityZone,
    toZone: SecurityZone,
    protocol: string = "ANY",
  ): boolean {
    if (fromZone === toZone) return true; // Intra-zone communication

    // Check specific blocking rules first
    for (const rule of this.firewallRules.values()) {
      if (!rule.active) continue;
      if (rule.fromZone === fromZone && rule.toZone === toZone) {
        if (rule.protocol === "ANY" || rule.protocol === protocol) {
          if (!rule.allowed) return false;
        }
      }
    }

    // Check allow rules
    for (const rule of this.firewallRules.values()) {
      if (!rule.active) continue;
      if (rule.fromZone === fromZone && rule.toZone === toZone) {
        if (rule.protocol === "ANY" || rule.protocol === protocol) {
          if (rule.allowed) return true;
        }
      }
    }

    // Default: allow if adjacent levels in Purdue hierarchy, otherwise deny
    const levels: Record<SecurityZone, number> = {
      ENTERPRISE: 4,
      DMZ: 3.5,
      SCADA: 3,
      CONTROL: 1,
      PROCESS: 0,
    };
    const diff = Math.abs(levels[fromZone] - levels[toZone]);
    return diff <= 1.5;
  }

  /**
   * Multi-source BFS reachability check to determine if an asset
   * can be reached from any compromised node through active, unsevered, non-isolated paths.
   */
  public isReachableFromCompromised(
    targetNodeId: string,
    compromisedNodeIds: Iterable<string>,
  ): boolean {
    if (this.isolatedNodes.has(targetNodeId)) return false;

    // Build dynamic adjacency map
    const adj = new Map<string, string[]>();
    for (const edge of this.edges) {
      if (this.isolatedNodes.has(edge.from) || this.isolatedNodes.has(edge.to)) {
        continue;
      }
      if (this.isEdgeSevered(edge.from, edge.to)) {
        continue;
      }

      let fromList = adj.get(edge.from);
      if (!fromList) {
        fromList = [];
        adj.set(edge.from, fromList);
      }
      fromList.push(edge.to);

      const isBi = edge.bidirectional !== false;
      if (isBi) {
        let toList = adj.get(edge.to);
        if (!toList) {
          toList = [];
          adj.set(edge.to, toList);
        }
        toList.push(edge.from);
      }
    }

    const queue: string[] = [];
    const visited = new Set<string>();

    for (const compId of compromisedNodeIds) {
      if (!this.isolatedNodes.has(compId)) {
        queue.push(compId);
        visited.add(compId);
      }
    }

    let head = 0;
    while (head < queue.length) {
      const curr = queue[head++];
      if (curr === targetNodeId) {
        return true;
      }

      const neighbors = adj.get(curr);
      if (neighbors) {
        for (let i = 0; i < neighbors.length; i++) {
          const neighbor = neighbors[i];
          if (!visited.has(neighbor) && !this.isolatedNodes.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
    }

    return false;
  }

  /**
   * Check if a direct or multi-hop path exists between source and target,
   * validating both physical connectivity and zone firewall traversal.
   */
  public canCommunicate(sourceId: string, targetId: string, protocol: string = "ANY"): boolean {
    if (sourceId === targetId) return true;
    if (this.isolatedNodes.has(sourceId) || this.isolatedNodes.has(targetId)) return false;

    const srcNode = this.nodes.get(sourceId);
    const tgtNode = this.nodes.get(targetId);
    if (!srcNode || !tgtNode) return false;

    // Check high-level zone policy first
    if (!this.isZoneTrafficAllowed(srcNode.zone, tgtNode.zone, protocol)) {
      return false;
    }

    // Check graph path
    return this.isReachableFromCompromised(targetId, [sourceId]);
  }

  /**
   * Export current network state for TwinState.
   */
  public getState(): NetworkState {
    const zones: Record<SecurityZone, string[]> = {
      ENTERPRISE: [],
      DMZ: [],
      SCADA: [],
      CONTROL: [],
      PROCESS: [],
    };

    for (const [id, node] of this.nodes.entries()) {
      zones[node.zone].push(id);
    }

    const severedEdgesArray: [string, string][] = [];
    const processed = new Set<string>();
    for (const key of this.severedEdges) {
      const [f, t] = key.split("->");
      const rev = `${t}->${f}`;
      if (!processed.has(key) && !processed.has(rev)) {
        severedEdgesArray.push([f, t]);
        processed.add(key);
        processed.add(rev);
      }
    }

    return {
      zones,
      isolatedAssets: Array.from(this.isolatedNodes),
      severedEdges: severedEdgesArray,
      firewallRules: Array.from(this.firewallRules.values()),
    };
  }

  /**
   * Restore network state from a snapshot.
   */
  public restoreState(state: NetworkState): void {
    this.isolatedNodes = new Set(state.isolatedAssets);
    this.severedEdges = new Set();
    for (const [from, to] of state.severedEdges) {
      this.severEdge(from, to);
    }
    this.firewallRules.clear();
    for (const rule of state.firewallRules) {
      this.firewallRules.set(rule.id, rule);
    }
  }
}
