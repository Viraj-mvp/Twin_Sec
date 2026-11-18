import { describe, it, expect } from "vitest";
import { generateForensicDossierPDF, type DossierExportPayload } from "../pdf-debrief-generator";

describe("pdf-debrief-generator", () => {
  const mockPayload: DossierExportPayload = {
    exercise: {
      code: "INC-P01",
      title: "Industroyer Kyiv Blackout Replay",
      site: "Pivnichna 330kV Transmission Substation",
      adversary: "Sandworm (Russian GRU Unit 74455)",
      initialNode: "nocgw",
      targetNode: "rly-33b",
      mitreIds: ["T0855", "T0836"],
      attackFlow: "Infiltration -> Lateral Movement -> Breaker Manipulation",
    },
    outcome: {
      branch: "CONTAINED",
      dossierId: "TEST-DOSSIER-99",
      mttd: "00:34",
      mttr: "01:12",
      cost: "$0 Avoided Loss",
      mw: 0,
      duration: "03:45",
      alarms: "3 Alarms Cleared",
      impactLabel: "KINETIC IMPACT",
      impactFormatted: "0.0 MW LOAD SHED",
      narrative: "Operator initiated swift air-gap isolation at the perimeter.",
    },
    sector: "power",
    operator: {
      callsign: "VIPER-ONE",
      badgeId: "TS-8842",
      clearance: "TOP SECRET // SCI",
      role: "INCIDENT COMMANDER",
      loggedIn: true,
    },
    nodes: [
      { id: "nocgw", label: "NOC GATEWAY", kind: "gw", x: 10, y: 15, ring: 4, vendor: "Cisco", firmware: "15.4", exposure: "L4", affects: [] },
      { id: "scada", label: "SCADA MASTER", kind: "scada", x: 40, y: 35, ring: 3, vendor: "ABB", firmware: "800xA", exposure: "L3", affects: [] },
      { id: "rtu-01", label: "SUBSTATION RTU", kind: "rtu", x: 65, y: 60, ring: 2, vendor: "SEL", firmware: "3530", exposure: "L2", affects: [] },
      { id: "rly-33b", label: "BREAKER RELAY", kind: "ied", x: 85, y: 85, ring: 1, vendor: "GE", firmware: "UR-F60", exposure: "L1", affects: [] },
    ],
    edges: [
      { from: "nocgw", to: "scada" },
      { from: "scada", to: "rtu-01" },
      { from: "rtu-01", to: "rly-33b" },
    ],
    compromisedNodes: new Set(["nocgw"]),
    isolatedNodes: new Set(["nocgw"]),
    choices: {
      "dec-1": "ACT",
    },
    decisions: [
      {
        id: "dec-1",
        t: 45,
        trigger: "SCADA ALARM",
        question: "Unscheduled trip command detected on Bus 33B. Sever connection?",
        context: "IEC-104 APDU payload mismatch.",
        options: [
          { id: "ACT", label: "ISOLATE NOC GATEWAY", consequence: "Perimeter air-gapped; 0MW dropped." },
          { id: "DEFER", label: "MONITOR", consequence: "Cascade allowed to spread." },
          { id: "MISS", label: "TIMEOUT", consequence: "Breakers tripped." },
        ],
      },
    ],
    events: [
      {
        t: 15,
        tag: "INGRESS",
        node: "nocgw",
        title: "Malicious IEC-104 connection initiated",
        desc: "External IP injected crafted telecontrol packet.",
        sev: "HIGH",
        mitreId: "T0855",
      },
      {
        t: 40,
        tag: "EXCURSION",
        node: "rtu-01",
        title: "Grid frequency spike detected",
        desc: "Frequency shifted to 63.8 Hz.",
        sev: "CRITICAL",
        mitreId: "T0836",
      },
    ],
    activeIdx: 1,
    totalTime: 180,
    targetSpeed: 1,
    terminalLogs: [
      "┌──(kali㏌twinsec)-[~/cyber-range]\n└─$ isolate nocgw",
      "[+] Node 'nocgw' AIR-GAPPED from the industrial bus.",
    ],
    blastRadius: {
      targetNodeId: "nocgw",
      targetNodeLabel: "NOC GATEWAY",
      blindedNodeIds: [],
      protectedNodeIds: ["scada", "rtu-01", "rly-33b"],
      quarantinedNodeIds: ["nocgw"],
      severedEdgeKeys: ["nocgw-scada"],
      blindedHullPath: null,
      protectedHullPath: null,
      metrics: {
        totalAssets: 4,
        blindedCount: 0,
        blindnessPercentage: 0,
        containmentScoreDelta: 45,
        safetySystemsIntact: true,
      },
    },
    historicalAttack: {
      id: "industroyer",
      code: "INC-P01",
      name: "Industroyer / CRASHOVERRIDE",
      year: 2016,
      sector: "power",
      targetFacility: "Pivnichna 330kV Transmission Substation, Kyiv",
      threatActor: "Sandworm (Russian GRU Unit 74455 / Electrum)",
      classification: "State-Sponsored APT Cyber Warfare",
      attackVector: "IEC 60870-5-104 and IEC 61850 Telecontrol APDU Invalidation",
      exploitedProtocols: ["IEC 60870-5-104", "IEC 61850 GOOSE", "OPC DA"],
      targetedHardware: [
        { category: "Protective Relay", model: "SIPROTEC 4", role: "Transmission Line Protection" },
      ],
      mitreTtpList: [
        { id: "T0855", name: "Unauthorized Command Message", desc: "IEC-104 direct command execution." },
      ],
      physicsImpact: {
        metric: "Grid Frequency & Feeder Active Power",
        baseline: "50.00 Hz nominal, 200MW active power flow",
        consequence: "Simultaneous trip of all 330kV feeders, causing total blackout.",
      },
      summary: "First malware designed specifically to disrupt electric power grids via direct ICS protocol commands.",
      tacticalObjectives: ["Isolate telecontrol gateway", "Block IEC-104 APDU commands"],
      terminalCommands: [{ cmd: "isolate nocgw", desc: "Sever gateway" }],
      events: [],
      decisions: [],
    },
  };

  it("should generate a 5-page forensic dossier PDF", async () => {
    const pdf = await generateForensicDossierPDF(mockPayload);
    expect(pdf).toBeDefined();
    // 5 pages generated
    expect(pdf.getNumberOfPages()).toBe(5);
  });

  it("should produce a lightweight PDF under 300 KB (98%+ reduction from 19 MB)", async () => {
    const pdf = await generateForensicDossierPDF(mockPayload);
    const pdfArrayBuffer = pdf.output("arraybuffer");
    const byteLength = pdfArrayBuffer.byteLength;

    // Must be under 300,000 bytes (< 300 KB)
    expect(byteLength).toBeLessThan(300_000);
    // Print size in KB for verification
    const kb = (byteLength / 1024).toFixed(1);
    console.log(`Generated Forensic Dossier PDF size: ${kb} KB (Original was ~19,000 KB)`);
  });

  it("should work for water sector without errors", async () => {
    const waterPayload = {
      ...mockPayload,
      sector: "water" as const,
      exercise: {
        ...mockPayload.exercise,
        code: "INC-W01",
        title: "Oldsmar Water Treatment Chemical Drift Replay",
        site: "Oldsmar Water Treatment Facility",
      },
    };
    const pdf = await generateForensicDossierPDF(waterPayload);
    expect(pdf.getNumberOfPages()).toBe(5);
  });
});
