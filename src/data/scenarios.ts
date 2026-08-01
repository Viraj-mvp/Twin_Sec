const SECTOR_IDS = [
  "power",
  "water",
  "oil-gas",
  "manufacturing",
  "port",
  "smart-building",
  "smart-city",
] as const;
export type SectorId = (typeof SECTOR_IDS)[number];

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type Node = {
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

export type Edge = { from: string; to: string };

export type Event = {
  t: number;
  tag: string;
  node: string;
  title: string;
  desc: string;
  sev: Severity;
};

export type ChoiceId = "ACT" | "DEFER" | "MISS";

export type Decision = {
  id: string;
  t: number;
  trigger: string;
  question: string;
  context: string;
  options: { id: ChoiceId; label: string; consequence: string }[];
};

export type ScenarioData = {
  nodes: Node[];
  edges: Edge[];
  events: Event[];
  decisions: Decision[];
  total: number;
};

export type Exercise = {
  code: string;
  title: string;
  site: string;
  byline: string;
  adversary: string;
  protocols: string;
};

export const DEFAULT_NODES: readonly Node[] = [
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

export const EDGES: readonly Edge[] = [
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

const DEFAULT_EVENTS: readonly Event[] = [
  {
    t: 0,
    tag: "INITIAL ACCESS",
    node: "ews-04",
    title: "Spear-phish accepted",
    desc: "Macro payload runs on engineering workstation EWS-04. Beacon established to attacker C2.",
    sev: "MEDIUM",
  },
  {
    t: 862,
    tag: "DISCOVERY",
    node: "hist",
    title: "Historian fingerprinted",
    desc: "OSIsoft PI node enumerated. 14 protocol anomalies on Modbus/TCP.",
    sev: "HIGH",
  },
  {
    t: 1244,
    tag: "LATERAL",
    node: "hmi-11",
    title: "HMI credential replay",
    desc: "Cached operator credentials reused. Unsegmented OT VLAN crossed in 6 seconds.",
    sev: "HIGH",
  },
  {
    t: 3731,
    tag: "STAGING",
    node: "switch-a",
    title: "Project file checked out",
    desc: "Engineering software opened. Project file staged for modification.",
    sev: "MEDIUM",
  },
  {
    t: 6489,
    tag: "IMPACT",
    node: "plc-3",
    title: "Ladder logic overwritten",
    desc: "Rungs 14–16 silently rewritten. Checksum spoofed. Operator does not know.",
    sev: "CRITICAL",
  },
  {
    t: 7820,
    tag: "IMPACT",
    node: "plc-7",
    title: "Setpoint drift initiated",
    desc: "Speed setpoint walked +0.3 Hz/s. Within tolerance band — invisible to alarm system.",
    sev: "CRITICAL",
  },
  {
    t: 9120,
    tag: "BYPASS",
    node: "sis",
    title: "Safety interlock bypassed",
    desc: "Safety logic solver re-tasked. Trip thresholds disarmed.",
    sev: "CRITICAL",
  },
  {
    t: 9520,
    tag: "PHYSICS",
    node: "cent",
    title: "Resonance band entered",
    desc: "Bearing temperature +84°C. Vibration crossed mechanical envelope.",
    sev: "CRITICAL",
  },
  {
    t: 9541,
    tag: "CONSEQUENCE",
    node: "brk",
    title: "Breaker 33-B latched",
    desc: "Cascading isolation. 14 MW load shed. Downstream pressure loss in feeder loop.",
    sev: "CRITICAL",
  },
];

export const DEFAULT_DECISIONS: readonly Decision[] = [
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

type Scenario = {
  nodeOverrides?: Partial<Record<string, Partial<Node>>>;
  events?: readonly Event[];
  decisions?: readonly Decision[];
};

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
        t: 750,
        tag: "DISCOVERY",
        node: "hist",
        title: "SCADA historian mapped",
        desc: "OPC-UA browse enumerates dosing setpoints, basin turbidity tags, chlorine residuals.",
        sev: "HIGH",
      },
      {
        t: 1350,
        tag: "LATERAL",
        node: "hmi-11",
        title: "Operator console hijacked",
        desc: "RDP session opened during shift change. Alarms suppressed at the console.",
        sev: "HIGH",
      },
      {
        t: 3500,
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
        t: 7700,
        tag: "IMPACT",
        node: "plc-7",
        title: "Distribution pump forced ON",
        desc: "PUMP-2B held at 100% duty. Contaminated water pushed toward two districts.",
        sev: "CRITICAL",
      },
      {
        t: 9050,
        tag: "BYPASS",
        node: "sis",
        title: "Overdose interlock disarmed",
        desc: "TRICONEX safety trip re-tasked. Cl₂ high-high threshold suppressed.",
        sev: "CRITICAL",
      },
      {
        t: 9520,
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
        t: 1350,
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
            label: "DO NOTHING",
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
        t: 9050,
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

export const EXERCISES: Record<SectorId, Exercise> = {
  power: {
    code: "HOLLOW",
    title: "HOLLOW",
    site: "Substation-07 · Sector 9",
    byline:
      "A relay misconfiguration cascades. 14 MW dropped. Hospital ring on generators before ops notice.",
    adversary: "UNIT-414",
    protocols: "MODBUS · S7 · DNP3",
  },
  water: {
    code: "BASIN",
    title: "BASIN",
    site: "Municipal Works · Basin-3",
    byline:
      "Dosing setpoint walked +6×. Turbidity sensors report nominal. Two districts drink the drift.",
    adversary: "AURA-9",
    protocols: "MODBUS · OPC-UA · SCADA",
  },
  "oil-gas": {
    code: "SEVENTH-BREATH",
    title: "SEVENTH BREATH",
    site: "Refinery Delta-12 · Tower T-A",
    byline:
      "Compressor discharge pressure walked. Safety solver disarmed. Twenty-two minutes to overpressure.",
    adversary: "SILT-2",
    protocols: "HART · FF · SIS PROFIsafe",
  },
  manufacturing: {
    code: "MISFIRE",
    title: "MISFIRE",
    site: "Smart Factory · Line-A",
    byline:
      "Vision model swapped mid-shift. Defective parts pass. A recall assembles itself on the pallet.",
    adversary: "MOTH-7",
    protocols: "PROFINET · EtherCAT · OPC-UA",
  },
  port: {
    code: "MANIFEST",
    title: "MANIFEST",
    site: "Port · Berth 7–14",
    byline:
      "TOS rewrites container destinations. Reefers land on dry stacks. Hazmat vanishes in the yard.",
    adversary: "TIDE-3",
    protocols: "EDIFACT · TOS API · AIS",
  },
  "smart-building": {
    code: "STILL-AIR",
    title: "STILL AIR",
    site: "Tower · Midtown-North",
    byline:
      "BMS holds the doors and the temperature. Server room card readers set to always-unlock at 03:14.",
    adversary: "FLOOR-0",
    protocols: "BACnet · KNX · Modbus",
  },
  "smart-city": {
    code: "GRIDLOCK",
    title: "GRIDLOCK",
    site: "Metro · Coastline-East",
    byline:
      "NOC routing tables poisoned. Signals freeze. EMS goes silent across two boroughs at rush hour.",
    adversary: "HALO-1",
    protocols: "MQTT · NTCIP · DNP3",
  },
};

export function getScenarioData(sector: SectorId): ScenarioData {
  const s = SCENARIOS[sector];
  let nodes = DEFAULT_NODES.map((n) => ({ ...n }));
  const rawEvents = s.events ?? DEFAULT_EVENTS;
  const rawDecisions = s.decisions ?? DEFAULT_DECISIONS;
  const events = rawEvents.map((e) => ({ ...e }));
  const decisions = rawDecisions.map((d) => ({
    ...d,
    options: d.options.map((o) => ({ ...o })),
  }));

  if (s.nodeOverrides) {
    nodes = nodes.map((n) => {
      const o = s.nodeOverrides![n.id];
      return o ? { ...n, ...o } : n;
    });
  }

  const edges = EDGES.map((e) => ({ ...e }));
  const total = events[events.length - 1].t + 60;
  return { nodes, edges, events, decisions, total };
}

export { SECTOR_IDS };

/* ------------------------------------------------------------------ */
/*  OUTCOME LOGIC                                                     */
/* ------------------------------------------------------------------ */

const IMPACT_LABELS: Record<SectorId, { label: string; unit: string; factor: number }> = {
  power: { label: "MW SHED", unit: "MW", factor: 1 },
  water: { label: "CL₂ OVERDOSE", unit: "ppm", factor: 0.6 },
  "oil-gas": { label: "OVERPRESSURE", unit: "psi", factor: 5 },
  manufacturing: { label: "DEFECTIVE UNITS", unit: "%", factor: 0.7 },
  port: { label: "YARD QUEUE", unit: "TEU", factor: 15 },
  "smart-building": { label: "UNLOCKED DOORS", unit: "#", factor: 6 },
  "smart-city": { label: "SIGNAL LOCKOUT", unit: "min", factor: 3 },
};

export function computeOutcome(
  choices: Record<string, ChoiceId>,
  decisions: readonly Decision[] = DEFAULT_DECISIONS,
  sector: SectorId = "power",
) {
  let mw = 14;
  let mttdMin = 14;
  let mttrH = 48;
  let costM = 4.1;
  let physicsMul = 1;
  let acts = 0;

  for (const d of decisions) {
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

  const sectorImpact = IMPACT_LABELS[sector] ?? IMPACT_LABELS.power;
  const impactVal = (mw * sectorImpact.factor).toFixed(1).replace(/\.0$/, "");
  const impactFormatted = `${impactVal} ${sectorImpact.unit}`;

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
      ? "The SCADA console showed nothing wrong until the process failed. The twin saw it 14 minutes earlier."
      : acts === 3
        ? "Every prompt was answered. The twin's early warnings translated to action. The facility envelope held."
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
    impactLabel: sectorImpact.label,
    impactFormatted,
  };
}

/* ------------------------------------------------------------------ */
/*  FORMATTING UTILITIES                                              */
/* ------------------------------------------------------------------ */

export const sevColor = (s: Severity) =>
  s === "CRITICAL" ? "bg-danger" : s === "HIGH" ? "bg-warn" : "bg-accent";

export const fmt = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};
