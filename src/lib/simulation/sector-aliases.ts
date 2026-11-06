/**
 * sector-aliases.ts
 *
 * Sector-aware target node resolution, natural command aliases, and domain-specific
 * operational verbs across all 7 industrial sectors in TwinSec.
 *
 * Specifically empowers operators in Smart Building to command:
 * - AHU-04 (Air Handling Unit) via 'ahu', 'ahu-04', 'ahu4', 'purge', 'vent'
 * - LOCK-SYS (Access Control) via 'lock-sys', 'locks', 'lock', 'lockdown', 'unlock'
 * - NOC-GW (Midtown Fiber Gateway) via 'noc-gw', 'nocgw', 'gateway', 'drop-uplink'
 *
 * As well as sector-specific operational verbs in Power, Water, Oil & Gas,
 * Manufacturing, Port Logistics, and Smart City.
 */

import type { SectorId, Node } from "@/data/scenarios";

// Strip hyphens, underscores, dots, and whitespace for fuzzy matching
export function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[-_\s.]/g, "");
}

/**
 * Sector node alias dictionary: maps lowercase aliases to the canonical Node ID
 */
export const SECTOR_NODE_ALIASES: Record<SectorId, Record<string, string | string[]>> = {
  "smart-building": {
    "switch-a": ["switch-a", "nocgw"],
    "sw-a": ["switch-a", "nocgw"],
    swa: ["switch-a", "nocgw"],
    "sw-mdf": ["switch-a", "nocgw"],
    swmdf: ["switch-a", "nocgw"],
    switch: ["switch-a", "nocgw"],
    sw: ["switch-a", "nocgw"],

    "plc-3": ["plc-3", "ahu"],
    plc3: ["plc-3", "ahu"],
    "bms-hvac": ["plc-3", "ahu"],
    bmshvac: ["plc-3", "ahu"],
    hvac: ["plc-3", "ahu", "hvac"],
    ahu: ["ahu", "plc-3"],
    "ahu-04": ["ahu", "plc-3"],
    ahu04: ["ahu", "plc-3"],
    ahu4: ["ahu", "plc-3"],
    air: ["ahu", "plc-3"],
    airhandler: ["ahu", "plc-3"],
    "air-handler": ["ahu", "plc-3"],
    vav: ["ahu", "plc-3"],
    vent: ["ahu", "plc-3"],
    ventilation: ["ahu", "plc-3"],

    "plc-7": ["plc-7", "locks"],
    plc7: ["plc-7", "locks"],
    acs: ["plc-7", "locks"],
    locks: ["locks", "plc-7"],
    "lock-sys": ["locks", "plc-7"],
    locksys: ["locks", "plc-7"],
    lock: ["locks", "plc-7"],
    doors: ["locks", "plc-7"],
    door: ["locks", "plc-7"],
    turnstile: ["locks", "plc-7"],
    turnstiles: ["locks", "plc-7"],
    "access-panel": ["locks", "plc-7"],
    accesspanel: ["locks", "plc-7"],
    hid: ["locks", "plc-7"],
    access: ["locks", "plc-7"],

    sis: ["sis", "fire"],
    "fire-p": ["sis", "fire"],
    firep: ["sis", "fire"],
    fire: ["fire", "sis"],
    "fire-alarm": ["fire", "sis"],
    firealarm: ["fire", "sis"],
    sprinkler: ["fire", "sis"],
    suppression: ["fire", "sis"],
    notifier: ["fire", "sis"],

    cent: ["cent", "hvac"],
    "mdf-04": ["cent", "hvac"],
    mdf04: ["cent", "hvac"],
    mdf: ["cent", "hvac"],
    chiller: ["hvac", "cent"],
    "chiller-a": ["hvac", "cent"],
    chillera: ["hvac", "cent"],
    cooling: ["hvac", "cent"],

    brk: ["brk", "locks"],
    "srv-dr": ["brk", "locks"],
    srvdr: ["brk", "locks"],
    serverdoor: ["brk", "locks"],
    mantrap: ["brk", "locks"],
    elevator: "brk",
    elevators: "brk",

    nocgw: ["nocgw", "switch-a"],
    "noc-gw": ["nocgw", "switch-a"],
    gateway: ["nocgw", "switch-a"],
    gw: ["nocgw", "switch-a"],
    fiber: ["nocgw", "switch-a"],
    "fiber-gw": ["nocgw", "switch-a"],
    "midtown-gw": ["nocgw", "switch-a"],
    router: ["nocgw", "switch-a"],
    uplink: ["nocgw", "switch-a"],
    fortinet: ["nocgw", "switch-a"],
    noc: ["nocgw", "switch-a"],

    bms: "bms",
    "bms-01": "bms",
    bms01: "bms",
    tridium: "bms",
    "ews-04": "ews-04",
    ews: "ews-04",
    hist: "hist",
    "hist-pi": "hist",
    "hmi-11": "hmi-11",
    hmi: "hmi-11",
  },

  power: {
    "switch-a": ["switch-a", "tx1"],
    "sw-a": ["switch-a", "tx1"],
    swa: ["switch-a", "tx1"],
    switch: ["switch-a", "tx1"],
    sw: ["switch-a", "tx1"],
    otswitch: ["switch-a", "tx1"],

    "plc-3": ["plc-3", "g1"],
    plc3: ["plc-3", "g1"],
    "plc-gen": ["plc-3", "g1"],
    siemens: ["plc-3", "g1"],
    s7: ["plc-3", "g1"],
    gov: ["plc-3", "g1"],
    governor: ["plc-3", "g1"],
    frequency: ["plc-3", "g1"],

    "plc-7": ["plc-7", "sub1"],
    plc7: ["plc-7", "sub1"],
    "plc-feeder": ["plc-7", "sub1"],
    feederctrl: ["plc-7", "sub1"],

    sis: ["sis", "r33"],
    "sis-ls": ["sis", "r33"],
    sisls: ["sis", "r33"],
    safety: ["sis", "r33"],
    hima: ["sis", "r33"],
    himax: ["sis", "r33"],
    interlock: ["sis", "r33"],

    cent: ["cent", "g1"],
    "cent-delta": ["cent", "g1"],
    centrifuge: ["cent", "g1"],
    turbine: ["cent", "g1"],
    rotor: ["cent", "g1"],

    brk: ["brk", "r33", "load1"],
    "brk-33b": ["brk", "r33", "load1"],
    brk33b: ["brk", "r33", "load1"],
    breaker: ["brk", "r33"],
    loadbank: ["brk", "load1"],

    g1: ["g1", "plc-3"],
    gen1: ["g1", "plc-3"],
    "gen-01": ["g1", "plc-3"],
    gen: ["g1", "plc-3"],
    generator: ["g1", "plc-3"],

    g2: ["g2", "plc-3"],
    gen2: ["g2", "plc-3"],
    "gen-02": ["g2", "plc-3"],

    tx1: ["tx1", "switch-a"],
    "tx-01": ["tx1", "switch-a"],
    "tx-delta": ["tx1", "switch-a"],
    transformer: ["tx1", "switch-a"],

    sub1: ["sub1", "plc-7"],
    "sub-9": ["sub1", "plc-7"],
    "sub-01": ["sub1", "plc-7"],
    substation: ["sub1", "plc-7"],

    sub2: ["sub2", "plc-7"],
    "sub-11": ["sub2", "plc-7"],
    "sub-02": ["sub2", "plc-7"],

    r33: ["r33", "brk", "sis"],
    rly1: ["r33", "brk"],
    "rly-33b": ["r33", "brk"],
    rly33b: ["r33", "brk"],
    relay: ["r33", "brk"],

    load1: ["load1", "brk"],
    "load-a": ["load1", "brk"],
    "feeder-a": ["load1", "brk"],
    feedera: ["load1", "brk"],
    feeder: ["load1", "brk"],

    load2: ["load2", "brk"],
    "load-b": ["load2", "brk"],
    "feeder-b": ["load2", "brk"],

    "ews-04": "ews-04",
    ews: "ews-04",
    hist: "hist",
    "hist-pi": "hist",
    "hmi-11": "hmi-11",
    hmi: "hmi-11",
  },

  water: {
    "switch-a": ["switch-a", "intake"],
    "sw-a": ["switch-a", "intake"],
    swa: ["switch-a", "intake"],
    switch: ["switch-a", "intake"],
    sw: ["switch-a", "intake"],
    otswitch: ["switch-a", "intake"],

    "plc-3": ["plc-3", "d1"],
    plc3: ["plc-3", "d1"],
    "plc-dose": ["plc-3", "d1"],
    plcdose: ["plc-3", "d1"],
    dose: ["d1", "plc-3"],
    dosing: ["d1", "plc-3"],
    chlorine: ["d1", "plc-3"],
    cl2: ["d1", "plc-3"],
    "cl2-dose": ["d1", "plc-3"],
    compactlogix: ["plc-3", "d1"],
    naoh: ["plc-3", "d1"],

    "plc-7": ["plc-7", "p1"],
    plc7: ["plc-7", "p1"],
    "plc-pump": ["plc-7", "p1"],
    plcpump: ["plc-7", "p1"],
    pumpctrl: ["plc-7", "p1"],
    m580: ["plc-7", "p1"],
    schneider: ["plc-7", "p1"],

    sis: "sis",
    "sis-cl2": "sis",
    siscl2: "sis",
    safety: "sis",
    interlock: "sis",
    tricon: "sis",
    triconex: "sis",

    cent: ["cent", "d1"],
    "dose-a": ["cent", "d1"],
    dosea: ["cent", "d1"],
    injector: ["cent", "d1"],
    chlorineinjector: ["cent", "d1"],
    grundfos: ["cent", "d1"],
    dda: ["cent", "d1"],

    brk: ["brk", "p2", "tank"],
    "pump-2b": ["brk", "p2"],
    pump2b: ["brk", "p2"],
    pump: ["brk", "p1", "p2"],
    pump2: ["brk", "p2"],
    distributionpump: ["brk", "p2"],
    ksb: "brk",
    etanorm: "brk",

    d1: ["d1", "plc-3"],
    "d-1": ["d1", "plc-3"],
    tank: ["tank", "brk"],
    "tank-delta": ["tank", "brk"],
    clearwell: ["tank", "brk"],
    basin: ["tank", "brk"],
    reservoir: "tank",
    effluent: "tank",

    intake: ["intake", "switch-a"],
    "intk-1": ["intake", "switch-a"],
    "pump-intk": "intake",
    raw: "intake",

    p1: ["p1", "plc-7"],
    "p-01": ["p1", "plc-7"],
    pump1: ["p1", "plc-7"],
    p2: ["p2", "brk"],
    "p-02": ["p2", "brk"],

    f1: "f1",
    "f-a": "f1",
    filter: "f1",
    f2: "f2",
    "f-b": "f2",

    "ews-04": "ews-04",
    ews: "ews-04",
    hist: "hist",
    "hist-pi": "hist",
    "hmi-11": "hmi-11",
    hmi: "hmi-11",
    scada: "hmi-11",
  },

  "oil-gas": {
    "switch-a": "switch-a",
    "sw-a": "switch-a",
    swa: "switch-a",
    switch: "switch-a",
    sw: "switch-a",

    "plc-3": ["plc-3", "c1"],
    plc3: ["plc-3", "c1"],
    "plc-comp": ["plc-3", "c1"],
    plccomp: ["plc-3", "c1"],
    comp: ["c1", "plc-3"],
    compressor: ["c1", "plc-3"],
    deltav: "plc-3",
    emerson: "plc-3",

    "plc-7": ["plc-7", "valve1"],
    plc7: ["plc-7", "valve1"],
    "plc-vlv": ["plc-7", "valve1"],
    plcvlv: ["plc-7", "valve1"],
    valvectrl: ["plc-7", "valve1"],
    valve: ["valve1", "plc-7"],
    valves: ["valve1", "plc-7"],
    yokogawa: "plc-7",
    centum: "plc-7",

    sis: "sis",
    "sis-og": "sis",
    sisog: "sis",
    esd: "sis",
    "esd-loop": "sis",
    interlock: "sis",
    triconex: "sis",
    safety: "sis",

    cent: "cent",
    "twr-t-a": "cent",
    twra: "cent",
    tower: "cent",
    distillation: "cent",
    reboiler: "cent",

    brk: ["brk", "psv1"],
    flare: ["brk", "psv1"],
    "flare-header": ["brk", "psv1"],
    stack: "brk",
    vent: "brk",
    emissions: "brk",

    c1: ["c1", "plc-3"],
    "c-04": ["c1", "plc-3"],
    stor1: "stor1",
    "tank-7": "stor1",
    tank: "stor1",
    pipe1: "pipe1",
    "p-n12": "pipe1",
    pipeline: "pipe1",
    dist1: "dist1",
    dist2: "dist2",
    psv1: "psv1",
    "psv-118": "psv1",
    valve1: "valve1",
    "v-44": "valve1",

    "ews-04": "ews-04",
    ews: "ews-04",
    hist: "hist",
    "hist-pi": "hist",
    "hmi-11": "hmi-11",
    hmi: "hmi-11",
  },

  manufacturing: {
    "switch-a": "switch-a",
    "sw-a": "switch-a",
    swa: "switch-a",
    switch: "switch-a",
    sw: "switch-a",

    "plc-3": ["plc-3", "qc"],
    plc3: ["plc-3", "qc"],
    "vis-ctl": ["plc-3", "qc"],
    visctl: ["plc-3", "qc"],
    vision: ["qc", "plc-3"],
    cognex: "plc-3",
    camera: ["qc", "plc-3"],
    inspection: ["qc", "plc-3"],

    "plc-7": ["plc-7", "ca"],
    plc7: ["plc-7", "ca"],
    "plc-line": ["plc-7", "ca"],
    plcline: ["plc-7", "ca"],
    line: "plc-7",
    mitsubishi: "plc-7",
    conveyor: ["ca", "plc-7"],

    sis: "sis",
    "safe-l": "sis",
    safel: "sis",
    pilz: "sis",
    safety: "sis",
    estop: "sis",
    lightcurtain: "sis",

    cent: ["cent", "r1"],
    "robot-4": ["cent", "r1"],
    robot4: ["cent", "r1"],
    robot: ["r1", "cent"],
    fanuc: "cent",
    arm: ["r1", "cent"],

    brk: ["brk", "out"],
    reject: "brk",
    diverter: "brk",
    chute: "brk",
    sorter: "brk",

    r1: ["r1", "cent"],
    r2: ["r2", "cent"],
    cnc: "plc-7",
    qc: ["qc", "plc-3"],
    mes: "hist",
    in: "in",
    ca: ["ca", "plc-7"],
    out: "out",

    "ews-04": "ews-04",
    ews: "ews-04",
    hist: "hist",
    "hist-pi": "hist",
    "hmi-11": "hmi-11",
    hmi: "hmi-11",
  },

  port: {
    "switch-a": "switch-a",
    "sw-a": "switch-a",
    swa: "switch-a",
    switch: "switch-a",
    sw: "switch-a",

    "plc-3": ["plc-3", "tos"],
    plc3: ["plc-3", "tos"],
    "tos-api": ["plc-3", "tos"],
    tosapi: ["plc-3", "tos"],
    tos: ["tos", "plc-3"],
    navis: "plc-3",
    manifest: "plc-3",

    "plc-7": ["plc-7", "crn1"],
    plc7: ["plc-7", "crn1"],
    "crane-4": ["plc-7", "crn1"],
    crane4: ["plc-7", "crn1"],
    crane: ["crn1", "plc-7"],
    kalmar: "plc-7",
    spreader: "plc-7",
    trolley: "plc-7",

    sis: "sis",
    reefer: "sis",
    orbcomm: "sis",
    coldchain: "sis",
    safety: "sis",

    cent: "cent",
    "berth-7": "cent",
    berth7: "cent",
    berth: "cent",
    dock: "cent",

    brk: "brk",
    hazmat: "brk",
    imdg: "brk",
    dangerousgoods: "brk",

    crn1: ["crn1", "plc-7"],
    crn2: ["crn2", "plc-7"],
    vessel: "vessel",
    agv: "agv",
    yard: "yard",
    gate: "gate",
    vts: "vts",

    "ews-04": "ews-04",
    ews: "ews-04",
    hist: "hist",
    "hist-pi": "hist",
    "hmi-11": "hmi-11",
    hmi: "hmi-11",
  },

  "smart-city": {
    "switch-a": ["switch-a", "noc"],
    "sw-a": ["switch-a", "noc"],
    swa: ["switch-a", "noc"],
    switch: ["switch-a", "noc"],
    sw: ["switch-a", "noc"],

    "plc-3": ["plc-3", "traf1"],
    plc3: ["plc-3", "traf1"],
    "tsc-ctl": ["plc-3", "traf1"],
    tscctl: ["plc-3", "traf1"],
    traffic: ["traf1", "plc-3"],
    signals: ["traf1", "plc-3"],
    econolite: "plc-3",
    intersection: "plc-3",

    "plc-7": ["plc-7", "noc"],
    plc7: ["plc-7", "noc"],
    "noc-rt": ["plc-7", "noc"],
    nocrt: ["plc-7", "noc"],
    router: ["noc", "plc-7"],
    cisco: "plc-7",
    backhaul: "plc-7",

    sis: ["sis", "ems"],
    "ems-dis": ["sis", "ems"],
    emsdis: ["sis", "ems"],
    ems: ["ems", "sis"],
    dispatch: ["ems", "sis"],
    cad: ["ems", "sis"],
    "911": ["ems", "sis"],
    tyler: "sis",
    safety: "sis",

    cent: "cent",
    "corr-a": "cent",
    corra: "cent",
    corridor: "cent",
    preemption: "cent",

    brk: "brk",
    "911-cad": "brk",
    "911cad": "brk",
    cadintake: "brk",

    traf1: ["traf1", "plc-3"],
    traf2: ["traf2", "plc-3"],
    noc: ["noc", "plc-7"],
    cctv: "cctv",
    transit: "transit",
    grid: "grid",
    water: "water",

    "ews-04": "ews-04",
    ews: "ews-04",
    hist: "hist",
    "hist-pi": "hist",
    "hmi-11": "hmi-11",
    hmi: "hmi-11",
  },
};

/**
 * Robustly resolve user target input to a Node in the current sector topology.
 * Supports exact id, exact label, normalized alphanumeric match, alias dictionary,
 * and fuzzy label/kind substring matching.
 */
export function resolveSectorNode(
  rawTarget: string | undefined,
  sector: SectorId,
  nodes: Node[],
): Node | undefined {
  if (!rawTarget) return undefined;
  const input = rawTarget.trim().toLowerCase();
  const inputNorm = normalizeKey(input);

  // 1. Direct match on node.id
  const directId = nodes.find((n) => n.id.toLowerCase() === input);
  if (directId) return directId;

  // 2. Direct match on node.label
  const directLabel = nodes.find((n) => n.label.toLowerCase() === input);
  if (directLabel) return directLabel;

  // 3. Normalized match (e.g. 'ahu-04' <-> 'ahu04', 'nocgw' <-> 'noc-gw')
  const normMatch = nodes.find(
    (n) => normalizeKey(n.id) === inputNorm || normalizeKey(n.label) === inputNorm,
  );
  if (normMatch) return normMatch;

  // 4. Sector-specific alias dictionary
  const sectorAliases = SECTOR_NODE_ALIASES[sector];
  if (sectorAliases) {
    const match = sectorAliases[input] || sectorAliases[inputNorm];
    if (match) {
      const candidates = Array.isArray(match) ? match : [match];
      const nodeFromAlias = nodes.find((n) => candidates.includes(n.id));
      if (nodeFromAlias) return nodeFromAlias;
    }
  }

  // 5. Fallback substring matching on label, kind, or id
  const partial = nodes.find(
    (n) =>
      n.label.toLowerCase().includes(input) ||
      input.includes(n.label.toLowerCase()) ||
      n.kind.toLowerCase().includes(input) ||
      n.id.toLowerCase().includes(input),
  );
  if (partial) return partial;

  return undefined;
}

export interface SectorActionTranslation {
  action: "isolate" | "reconnect" | "patch" | "override" | "attack" | "scan" | "status";
  targetNodeId: string;
  targetNodeLabel: string;
  outputLogs: string[];
  param?: string;
  value?: number;
}

/**
 * Translates domain-specific operational verbs into canonical simulation actions.
 * Handles:
 * - Smart Building: lock, unlock, purge, vent, drop-uplink, sever-gateway, chiller-trip
 * - Power: trip, shed, sync, gov-sync
 * - Water: valve-isolate, dose-cut, dose-reset
 * - Oil & Gas: esd-trip, compressor-trip, flare-purge
 * - Manufacturing: estop, robot-hold
 * - Port: crane-lock, tos-freeze
 * - Smart City: signal-allred, ems-priority
 */
export function translateSectorCommand(
  rawCmd: string,
  rawTarget: string | undefined,
  sector: SectorId,
  nodes: Node[],
): SectorActionTranslation | null {
  const cmd = rawCmd.toLowerCase();

  /* ------------------------------------------------------------------ */
  /* SMART BUILDING COMMAND VERBS                                       */
  /* ------------------------------------------------------------------ */
  if (sector === "smart-building") {
    // 1. LOCK / LOCKDOWN (LOCK-SYS)
    if (cmd === "lock" || cmd === "lockdown" || cmd === "lock-all" || cmd === "doors-lock") {
      const target = resolveSectorNode(rawTarget || "locks", sector, nodes);
      if (!target) return null;
      return {
        action: "isolate",
        targetNodeId: target.id,
        targetNodeLabel: target.label,
        outputLogs: [
          `[+] ACCESS CONTROL INTERLOCK ENGAGED: Target '${target.label}' (${target.id}) LOCKED.`,
          `[*] Fail-secure relays latched. Turnstiles, executive suites, and data center perimeters sealed.`,
          `[*] Physical air-gap boundary enforced at HID Aero X1100 controller.`,
        ],
      };
    }

    // 2. UNLOCK / DOOR-RELEASE (LOCK-SYS)
    if (cmd === "unlock" || cmd === "door-release" || cmd === "release-doors") {
      const target = resolveSectorNode(rawTarget || "locks", sector, nodes);
      if (!target) return null;
      return {
        action: "reconnect",
        targetNodeId: target.id,
        targetNodeLabel: target.label,
        outputLogs: [
          `[+] EMERGENCY EGRESS RELEASE: Target '${target.label}' (${target.id}) UNLOCKED.`,
          `[*] NFPA life-safety override asserted. Magnetic door strikes de-energized.`,
          `[*] Access control network re-synchronized with building management core.`,
        ],
      };
    }

    // 3. PURGE / VENT / SMOKE-EVAC (AHU-04)
    if (
      cmd === "purge" ||
      cmd === "vent" ||
      cmd === "smoke-evac" ||
      cmd === "ahu-purge" ||
      cmd === "vent-purge"
    ) {
      const target = resolveSectorNode(rawTarget || "ahu", sector, nodes);
      if (!target) return null;
      return {
        action: "override",
        targetNodeId: target.id,
        targetNodeLabel: target.label,
        param: "fan_speed_cfm",
        value: 100,
        outputLogs: [
          `[+] HVAC EMERGENCY PURGE COMMAND DISPATCHED: Target '${target.label}' (${target.id}).`,
          `[*] Carrier 39M Air Handling Unit commanded to 100% outside air exhaust mode.`,
          `[*] VAV dampers forced 100% OPEN. Indoor air contamination scrub cycle initiated.`,
        ],
      };
    }

    // 4. DROP-UPLINK / SEVER-GATEWAY (NOC-GW)
    if (
      cmd === "drop-uplink" ||
      cmd === "sever-gateway" ||
      cmd === "noc-isolate" ||
      cmd === "wan-sever" ||
      cmd === "drop-gw"
    ) {
      const target = resolveSectorNode(rawTarget || "nocgw", sector, nodes);
      if (!target) return null;
      return {
        action: "isolate",
        targetNodeId: target.id,
        targetNodeLabel: target.label,
        outputLogs: [
          `[+] PERIMETER UPLINK SEVERED: Target '${target.label}' (${target.id}) AIR-GAPPED.`,
          `[*] Fortinet 60F fiber uplink dropped. External C2 tunnel to Midtown fiber backhaul severed.`,
          `[*] Building automation network operating in autonomous dark-site mode.`,
        ],
      };
    }

    // 5. CHILLER-TRIP (CHILLER-A / HVAC)
    if (cmd === "chiller-trip" || cmd === "trip-chiller" || cmd === "kill-chiller") {
      const target = resolveSectorNode(rawTarget || "hvac", sector, nodes);
      if (!target) return null;
      return {
        action: "isolate",
        targetNodeId: target.id,
        targetNodeLabel: target.label,
        outputLogs: [
          `[!] CHILLER PLANT BREAKER TRIPPED: Target '${target.label}' (${target.id}) ISOLATED.`,
          `[*] York centrifugal compressor offline. Chilled water supply valve bypassed.`,
        ],
      };
    }
  }

  /* ------------------------------------------------------------------ */
  /* ELECTRIC POWER GRID COMMAND VERBS                                  */
  /* ------------------------------------------------------------------ */
  if (sector === "power") {
    // 1. TRIP BREAKER (RLY-33B / SUBSTATION)
    if (cmd === "trip" || cmd === "trip-breaker" || cmd === "open-breaker") {
      const target = resolveSectorNode(rawTarget || "r33", sector, nodes);
      if (!target) return null;
      return {
        action: "isolate",
        targetNodeId: target.id,
        targetNodeLabel: target.label,
        outputLogs: [
          `[!] HIGH-VOLTAGE BREAKER TRIPPED: Target '${target.label}' (${target.id}) ISOLATED.`,
          `[*] Substation interrupter forced OPEN. Fault current cleared on 230kV busbar.`,
        ],
      };
    }

    // 2. LOAD SHEDDING (LOAD-A / FEEDER-A)
    if (cmd === "shed" || cmd === "shed-load") {
      const target = resolveSectorNode(rawTarget || "load1", sector, nodes);
      if (!target) return null;
      return {
        action: "isolate",
        targetNodeId: target.id,
        targetNodeLabel: target.label,
        outputLogs: [
          `[+] EMERGENCY LOAD SHED ACTIVATED: Target '${target.label}' (${target.id}) DROPPED.`,
          `[*] Under-frequency load shedding relay tripped 14 MW non-critical feeder. Grid frequency stabilized.`,
        ],
      };
    }

    // 3. GOVERNOR RESYNCHRONIZATION (GEN-01)
    if (cmd === "gov-sync" || cmd === "sync" || cmd === "synchronize") {
      const target = resolveSectorNode(rawTarget || "g1", sector, nodes);
      if (!target) return null;
      return {
        action: "override",
        targetNodeId: target.id,
        targetNodeLabel: target.label,
        param: "frequency",
        value: 50.0,
        outputLogs: [
          `[+] GENERATOR GOVERNOR RESYNCHRONIZED: Target '${target.label}' (${target.id}).`,
          `[*] Rotor speed locked to 50.00 Hz nominal synchro-check envelope. Telemetry normalized.`,
        ],
      };
    }
  }

  /* ------------------------------------------------------------------ */
  /* WATER TREATMENT COMMAND VERBS                                      */
  /* ------------------------------------------------------------------ */
  if (sector === "water") {
    // 1. VALVE-ISOLATE (CLEARWELL / TANK-Δ)
    if (cmd === "valve-isolate" || cmd === "valve-close" || cmd === "isolate-valve") {
      const target = resolveSectorNode(rawTarget || "tank", sector, nodes);
      if (!target) return null;
      return {
        action: "isolate",
        targetNodeId: target.id,
        targetNodeLabel: target.label,
        outputLogs: [
          `[+] MOTORIZED EFFLUENT VALVE SEVERED: Target '${target.label}' (${target.id}) ISOLATED.`,
          `[*] Clearwell basin isolation valve CLOSED. Contaminated effluent blocked from distribution mains.`,
        ],
      };
    }

    // 2. DOSE-CUT / RESET (CHEMICAL DOSING / D-1)
    if (cmd === "dose-cut" || cmd === "dose-reset" || cmd === "reset-dose") {
      const target = resolveSectorNode(rawTarget || "d1", sector, nodes);
      if (!target) return null;
      return {
        action: "override",
        targetNodeId: target.id,
        targetNodeLabel: target.label,
        param: "chlorine_ppm",
        value: 1.5,
        outputLogs: [
          `[+] CHEMICAL INJECTION OVERRIDE APPLIED: Target '${target.label}' (${target.id}).`,
          `[*] Sodium Hydroxide / Chlorine dosing setpoint reset to nominal baseline (1.50 PPM).`,
        ],
      };
    }
  }

  /* ------------------------------------------------------------------ */
  /* OIL & GAS COMMAND VERBS                                            */
  /* ------------------------------------------------------------------ */
  if (sector === "oil-gas") {
    // 1. ESD TRIP (SIS-OG / ESD LOOP)
    if (cmd === "esd-trip" || cmd === "esd" || cmd === "emergency-shutdown") {
      const target = resolveSectorNode(rawTarget || "sis", sector, nodes);
      if (!target) return null;
      return {
        action: "isolate",
        targetNodeId: target.id,
        targetNodeLabel: target.label,
        outputLogs: [
          `[!] SIL-3 EMERGENCY SHUTDOWN ASSERTED: Target '${target.label}' (${target.id}).`,
          `[*] Triconex SIS loop de-energized. Wellhead choke valves slammed shut. Overpressure contained.`,
        ],
      };
    }

    // 2. COMPRESSOR TRIP (C-04)
    if (cmd === "compressor-trip" || cmd === "trip-comp") {
      const target = resolveSectorNode(rawTarget || "c1", sector, nodes);
      if (!target) return null;
      return {
        action: "isolate",
        targetNodeId: target.id,
        targetNodeLabel: target.label,
        outputLogs: [
          `[+] PIPELINE COMPRESSOR TRIPPED: Target '${target.label}' (${target.id}) ISOLATED.`,
          `[*] Centrifugal compressor rotor uncoupled. Anti-surge recycle valve forced 100% OPEN.`,
        ],
      };
    }

    // 3. FLARE PURGE (PSV-118)
    if (cmd === "flare-purge" || cmd === "purge-flare") {
      const target = resolveSectorNode(rawTarget || "psv1", sector, nodes);
      if (!target) return null;
      return {
        action: "isolate",
        targetNodeId: target.id,
        targetNodeLabel: target.label,
        outputLogs: [
          `[+] EMERGENCY FLARE PURGE OPENED: Target '${target.label}' (${target.id}).`,
          `[*] Overpressure relief header routed to thermal oxidizer stack.`,
        ],
      };
    }
  }

  /* ------------------------------------------------------------------ */
  /* ADVANCED MANUFACTURING COMMAND VERBS                               */
  /* ------------------------------------------------------------------ */
  if (sector === "manufacturing") {
    if (cmd === "estop" || cmd === "robot-hold" || cmd === "e-stop") {
      const target = resolveSectorNode(rawTarget || "r1", sector, nodes);
      if (!target) return null;
      return {
        action: "isolate",
        targetNodeId: target.id,
        targetNodeLabel: target.label,
        outputLogs: [
          `[!] HARDWARE EMERGENCY STOP (ESTOP) TRIPPED: Target '${target.label}' (${target.id}).`,
          `[*] Safety relay contactors dropped. 6-axis robotic welding arm dynamic brake locked.`,
        ],
      };
    }
  }

  /* ------------------------------------------------------------------ */
  /* MARITIME PORT COMMAND VERBS                                        */
  /* ------------------------------------------------------------------ */
  if (sector === "port") {
    if (cmd === "crane-lock" || cmd === "crane-hold" || cmd === "park-cranes") {
      const target = resolveSectorNode(rawTarget || "crn1", sector, nodes);
      if (!target) return null;
      return {
        action: "isolate",
        targetNodeId: target.id,
        targetNodeLabel: target.label,
        outputLogs: [
          `[+] STS GANTRY CRANE HOLD ASSERTED: Target '${target.label}' (${target.id}) ISOLATED.`,
          `[*] Spreader hoisted to parking clearance. Automatic container sequencing halted.`,
        ],
      };
    }
  }

  /* ------------------------------------------------------------------ */
  /* SMART CITY COMMAND VERBS                                           */
  /* ------------------------------------------------------------------ */
  if (sector === "smart-city") {
    if (cmd === "signal-allred" || cmd === "all-red" || cmd === "freeze-signals") {
      const target = resolveSectorNode(rawTarget || "traf1", sector, nodes);
      if (!target) return null;
      return {
        action: "override",
        targetNodeId: target.id,
        targetNodeLabel: target.label,
        param: "light_state",
        value: 0,
        outputLogs: [
          `[!] ALL-RED CORRIDOR LOCKDOWN ASSERTED: Target '${target.label}' (${target.id}).`,
          `[*] Solid-state traffic signal conflict monitors forced ALL-RED. Emergency clearway established.`,
        ],
      };
    }
  }

  return null;
}
