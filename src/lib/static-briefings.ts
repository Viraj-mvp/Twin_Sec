import type { SectorId } from "@/data/scenarios";
import { EXERCISES, getScenarioData } from "@/data/scenarios";
import type {
  RedPhase,
  BluePhase,
  GuidancePhase,
  OperationalRole,
  ThreatActorProfile,
  RoleBriefing,
  PhaseGuidance,
} from "./briefing-types";

const ADVERSARY_TYPE_BY_HANDLE: Record<string, ThreatActorProfile["type"]> = {
  "UNIT-414": "NATION-STATE",
  "AURA-9": "NATION-STATE",
  "SILT-2": "CYBER-CRIME",
  "MOTH-7": "CYBER-CRIME",
  "TIDE-3": "CYBER-CRIME",
  "FLOOR-0": "INSIDER",
  "HALO-1": "ACTIVIST",
};

const SOPH_BY_HANDLE: Record<string, 1 | 2 | 3 | 4 | 5> = {
  "UNIT-414": 5,
  "AURA-9": 5,
  "SILT-2": 4,
  "MOTH-7": 3,
  "TIDE-3": 3,
  "FLOOR-0": 3,
  "HALO-1": 2,
};

const MOTIVE_BY_HANDLE: Record<string, string> = {
  "UNIT-414": "Strategic disruption of target nation critical infrastructure",
  "AURA-9": "Water-supply manipulation with plausible deniability",
  "SILT-2": "Ransom of OT process assets prior to safety event",
  "MOTH-7": "Product recall damage against competitor supply chain",
  "TIDE-3": "Port congestion extortion against shippers",
  "FLOOR-0": "Physical asset access via coerced insider",
  "HALO-1": "Protest-motivated EMS degradation during demonstration",
};

const REG_BY_SECTOR: Record<SectorId, string[]> = {
  power: ["NERC CIP-010 R3", "Reportable Incident §119", "DOE Order 460.2"],
  water: [
    "EPA Safe Drinking Water §1414",
    "AWWA Cybersecurity Standard",
    "State Boil-Water Order Protocol",
  ],
  "oil-gas": ["PHMSA 49 CFR §195", "OSHA PSM §1910.119", "EPA RMP Accidental Release §112(r)"],
  manufacturing: ["21 CFR Part 820 (GMP)", "ISO 9001 §8.7", "Consumer Product Safety §15"],
  port: ["USCG 33 CFR §105", "ISPS Code Part A", "CBP ACE Cargo Manifest §491"],
  "smart-building": [
    "NFPA 101 Life Safety §7",
    "ASHRAE Guideline 21",
    "HIPAA Physical Safeguards if healthcare",
  ],
  "smart-city": [
    "NIST SP 800-171 §3.5.2",
    "NTIA Broadband PLIC",
    "Emergency Alert System FCC 47 CFR §11",
  ],
};

const ADVERSARY_HANDLE_TO_TYPE = (handle: string): ThreatActorProfile["type"] =>
  ADVERSARY_TYPE_BY_HANDLE[handle] ?? "NATION-STATE";

export function staticRoleBriefing(sector: SectorId, role: OperationalRole): RoleBriefing {
  const scenario = getScenarioData(sector);
  const ex = EXERCISES[sector];
  const events = scenario.events;
  const lastT = events[events.length - 1].t;
  const handle = ex.adversary;
  return {
    sector,
    role,
    scenarioCode: ex.code,
    generatedAt: new Date().toISOString(),
    objectives: [
      {
        id: "obj-1",
        priority: "PRIMARY",
        description:
          role === "RED"
            ? "Evade perimeter detections to reach the process controllers at ring 3"
            : "Prevent the adversary from modifying controller logic at ring 3",
        mitreTactic: "T0858 Change Program State",
      },
      {
        id: "obj-2",
        priority: "SECONDARY",
        description:
          role === "RED"
            ? "Disable the SIS safety interlock solver so it cannot trip on physics envelope breach"
            : "Verify SIS trip authority is independent from the HMI/SCADA console",
        mitreTactic: "T0833 Disable Safety Interlocks",
      },
      {
        id: "obj-3",
        priority: "OPPORTUNISTIC",
        description:
          role === "RED"
            ? "Exploit unsegmented OT VLANs for lateral movement within 10 seconds"
            : "Validate OT VLAN segmentation by tracing the HMI → switch → controller path",
        mitreTactic: "T0813 Lateral Movement via Credential Replay",
      },
    ],
    ttps: events.slice(0, 6).map((e, i) => ({
      id: `T0${800 + i}`,
      tactic: e.tag,
      title: e.title,
      observedIn: [e.node],
      sectorContext: `${e.desc} — ${sector} node ${e.node}`,
    })),
    impact: {
      primaryImpact: ex.byline,
      timeToImpactSec: lastT + 60,
      humanFactor:
        "Shift change or vendor VPN windows used by adversary to blend into baseline traffic",
      regulatory: REG_BY_SECTOR[sector],
    },
    threatActor: {
      handle,
      type: ADVERSARY_HANDLE_TO_TYPE(handle),
      sophistication: SOPH_BY_HANDLE[handle] ?? 4,
      typicalMotive: MOTIVE_BY_HANDLE[handle] ?? "Disruption for strategic gain",
      historicalTTPs: [
        "Supply-chain compromise of engineering vendor software",
        "Cached credential reuse during shift handover",
        "Slow sub-alarm-threshold setpoint walks rather than one-shot changes",
      ],
      sectorAffinity: `${sector.toUpperCase()} targeting: ${ex.site}`,
    },
    redFrame:
      role === "RED"
        ? "Think as the threat actor: you want the cascade, not the win — make every step look like normal operations."
        : undefined,
    blueFrame:
      role === "BLUE"
        ? "Think as the defender: SCADA lies when rung checksums are spoofed — trust the twin baseline, not the display."
        : undefined,
    prerequisites: [
      "Locate the 4 baseline data sources: HMI, historian, twin, SIS",
      "Identify which node sits at ring 0 (IT side), ring 3 (controllers), ring 4 (SIS)",
      "Write down, in your own words, the one event that makes escalation irreversible in this scenario",
    ],
  };
}

export function staticPhaseGuidance(
  sector: SectorId,
  role: OperationalRole,
  phase: GuidancePhase,
): PhaseGuidance {
  const sectorNodes = getScenarioData(sector).nodes;
  const ring0 = sectorNodes.find((n) => n.ring === 0)?.id ?? "ews-04";
  const ring3 = sectorNodes.filter((n) => n.ring === 3).map((n) => n.id);
  const ring4 = sectorNodes.find((n) => n.ring === 4)?.id ?? "sis";

  if (role === "RED") {
    switch (phase) {
      case "RECON":
        return redTemplate(
          sector,
          phase,
          ring0,
          ring3,
          ring4,
          "RECON → WEAPON on INITIAL ACCESS event",
          "INITIAL ACCESS",
        );
      case "WEAPON":
        return redTemplate(
          sector,
          phase,
          ring0,
          ring3,
          ring4,
          "WEAPON → DELIVER on DISCOVERY event",
          "DISCOVERY",
        );
      case "DELIVER":
        return redTemplate(
          sector,
          phase,
          ring0,
          ring3,
          ring4,
          "DELIVER → EXPLOIT on LATERAL event",
          "LATERAL",
        );
      case "EXPLOIT":
        return redTemplate(
          sector,
          phase,
          ring0,
          ring3,
          ring4,
          "EXPLOIT → INSTALL on STAGING event",
          "STAGING",
        );
      case "INSTALL":
        return redTemplate(
          sector,
          phase,
          ring0,
          ring3,
          ring4,
          "INSTALL → C2 on first IMPACT event",
          "IMPACT",
        );
      case "C2":
        return redTemplate(
          sector,
          phase,
          ring0,
          ring3,
          ring4,
          "C2 → AOO on BYPASS event",
          "BYPASS",
        );
      case "AOO":
        return redTemplate(
          sector,
          phase,
          ring0,
          ring3,
          ring4,
          "AOO terminates on CONSEQUENCE event → debrief",
          "CONSEQUENCE",
        );
    }
  }

  switch (phase) {
    case "PREPARATION":
      return blueTemplate(
        sector,
        phase,
        ring0,
        ring3,
        ring4,
        "PREPARATION → IDENTIFICATION on INITIAL ACCESS event",
        "INITIAL ACCESS",
      );
    case "IDENTIFICATION":
      return blueTemplate(
        sector,
        phase,
        ring0,
        ring3,
        ring4,
        "IDENTIFICATION → CONTAINMENT on LATERAL event",
        "LATERAL",
      );
    case "CONTAINMENT":
      return blueTemplate(
        sector,
        phase,
        ring0,
        ring3,
        ring4,
        "CONTAINMENT → ERADICATION on STAGING event",
        "STAGING",
      );
    case "ERADICATION":
      return blueTemplate(
        sector,
        phase,
        ring0,
        ring3,
        ring4,
        "ERADICATION → RECOVERY on BYPASS event",
        "BYPASS",
      );
    case "RECOVERY":
      return blueTemplate(
        sector,
        phase,
        ring0,
        ring3,
        ring4,
        "RECOVERY → POST_INCIDENT on CONSEQUENCE event",
        "CONSEQUENCE",
      );
  }
  return blueTemplate(
    sector,
    "POST_INCIDENT",
    ring0,
    ring3,
    ring4,
    "POST_INCIDENT → debrief scorecard",
    "(none — final phase)",
  );
}

function redTemplate(
  sector: SectorId,
  phase: RedPhase,
  ring0: string,
  ring3: string[],
  ring4: string,
  progressHint: string,
  nextPhaseTrigger: string,
): PhaseGuidance {
  return {
    role: "RED",
    phase,
    sector,
    purpose: `${phase} phase for the ${sector} scenario: UNIT-414's recon operator maps Purdue model layers from the IT-side EWS (${ring0}) through the switch and up to controllers (${ring3.join("/")}) while staying sub-threshold so the NOC does not block the path. The SIS solver (${ring4}) is the final gate before actions on objectives.`,
    commonActivities: [
      `Slow nmap sweeps of the contractor VPN range (≤10 ports/min) to avoid IDS signature fires`,
      `Passive DNS / certificate transparency lookups against the ${sector} EWS vendor`,
      `Whois-BACnet/Modbus sweeps from a compromised jump host — not the attacker source IP`,
      `Credential-harvest of shift-change HMI PINs and cached RDP tokens`,
      `Fingerprint of controller firmware to identify which rung offsets are writable without signed firmware`,
      `Build of plausible-excuse decoy traffic (historian queries, engineering software 'heartbeats')`,
    ],
    requiredDecisions: [
      {
        triggerId: "decision-approach",
        questionPreview: "Use a trojanized engineering document vs direct exploitation of the HMI?",
        redPitfall:
          "One-shot exploitation of a public HMI port gets caught by the perimeter IDS. Prefer the slower document vector — every defender drops their guard for 'engineering files'.",
      },
    ],
    toolbox: [
      {
        name: "Modbus RTU sweeper",
        usedFor: "Enumerate RTU slave IDs on an unsegmented OT bus",
        terminalCommand: `[illustrative] modscan -f 1,2,3,4 203.0.113.0/24`,
        applicableNodes: [ring0, ...ring3],
      },
      {
        name: "Vendor credential spray",
        usedFor: "Default-credential guess against the EWS software portal",
        applicableNodes: [ring0],
      },
    ],
    checkYourUnderstanding: [
      `Which Purdue model layer does ${ring0} sit at in a ${sector} plant?`,
      "Why is a 10-port/min scan safer than a 1000-port/min scan for the same target?",
      `What protocol would you expect to find between the ${ring3[0]} controller and the ${ring4} safety solver?`,
    ],
    progressHint,
    nextPhaseTrigger,
  };
}

function blueTemplate(
  sector: SectorId,
  phase: BluePhase,
  ring0: string,
  ring3: string[],
  ring4: string,
  progressHint: string,
  nextPhaseTrigger: string,
): PhaseGuidance {
  return {
    role: "BLUE",
    phase,
    sector,
    purpose: `${phase} phase for the ${sector} scenario: shift-lead defender verifies the 4-source trust model (HMI vs historian vs twin vs SIS) at ring 0 (${ring0}), builds containment plays for the OT switch, and decides — ahead of time — which authority owns the ${ring4} manual trip.`,
    commonActivities: [
      `Confirm all off-going shift HMI tokens are revoked on ${ring0}`,
      `Verify historian checksum-of-checksums baseline has not drifted in the last 24 hours`,
      `Run signed ladder-logic diff against the golden baseline for controllers ${ring3.join(", ")}`,
      `Walk through authority matrix for ${ring4} manual ESD — names, not roles`,
      `Validate ORBCOMM/PI historian feed is independent from the HMI (dual path, not replayed)`,
      `Patch the EWS (${ring0}) vendor portal credential reuse vector`,
    ],
    requiredDecisions: [
      {
        triggerId: "decision-first-detection",
        questionPreview: "Trust the HMI nominal or the twin-reported rung delta?",
        bluePitfall:
          "Trusting SCADA because 'alarms would tell us' is the single error that punishes every ${sector} scenario. Rung checksums are spoofed — compare the golden baseline, not the screen.",
      },
    ],
    toolbox: [
      {
        name: "Rung diff",
        usedFor: "Detect silent ladder-logic overwrite with spoofed HMI checksum",
        terminalCommand: `[illustrative] DIFF ${ring3[0]} RUNG GOLDEN vs LIVE`,
        applicableNodes: ring3,
      },
      {
        name: "SIS pin-to-hardware",
        usedFor: "Take the ${ring4} solver off the network and force hardwired trip authority",
        terminalCommand: `[illustrative] PIN ${ring4} HARDWIRE`,
        applicableNodes: [ring4],
      },
    ],
    checkYourUnderstanding: [
      `Which data source should you trust FIRST if ${ring3[0]} display on the HMI disagrees with the twin baseline?`,
      `Why is a ${ring4} manual ESD procedure OWNED BY NAME rather than by job title?`,
      `What does the ORBCOMM direct feed protect you against in ${sector} networks?`,
    ],
    progressHint,
    nextPhaseTrigger,
  };
}

export function staticDiagnosticQuestions(
  sector: SectorId,
  role: OperationalRole,
  phase: GuidancePhase,
): string[] {
  return [
    `In the ${sector} topology, which Purdue model layer node records the initial-access event?`,
    role === "RED"
      ? "What deception story would make a vendor-VPN-reuse access look like routine contractor activity?"
      : "If the HMI display and the twin baseline disagree for the same node, which source should the IR playbook trust?",
    `Who holds the hardwired-esd decision authority for the ${sector} site in your jurisdiction?`,
  ];
}

export function staticContextHint(
  sector: SectorId,
  role: OperationalRole,
  phase: GuidancePhase,
  nextHintLevel: 0 | 1 | 2 | 3,
  stuckNodeId?: string,
  _lastDecisionTrigger?: string,
): {
  nextHintLevel: 0 | 1 | 2 | 3;
  hintText: string;
  delivery: "terminal" | "popover" | "diagnostic";
  popoverNodeId?: string;
  diagnosticQuestions?: string[];
} {
  const node = stuckNodeId ?? getScenarioData(sector).nodes[2].id;
  if (nextHintLevel === 0) {
    return {
      nextHintLevel: 0,
      hintText: "",
      delivery: "diagnostic",
      diagnosticQuestions: staticDiagnosticQuestions(sector, role, phase),
    };
  }
  if (nextHintLevel === 1) {
    return {
      nextHintLevel: 1,
      hintText:
        role === "RED"
          ? `Focus on the VLAN segmentation between the switch and ${node}; the adversary does not need an exploit if credentials carry them.`
          : `Stop staring at the HMI screen; go diff the golden baseline rung checksum on ${node} — the checksum shown on the display is the spoofed one.`,
      delivery: "popover",
      popoverNodeId: node,
    };
  }
  if (nextHintLevel === 2) {
    const nodeForHint = stuckNodeId ?? "plc-3";
    return {
      nextHintLevel: 2,
      hintText:
        role === "RED"
          ? [
              "1. Enumerate cached HMI tokens on the EWS (ring 0) — do not spray new credentials.",
              "2. Cross the OT switch VLAN during the documented shift-handover window only.",
              "3. Stage the rung modification with sub-alarm deltas, not one-shot rewrites.",
            ].join("\n")
          : [
              `1. Run \`DIFF ${nodeForHint} RUNG GOLDEN vs LIVE\` against the golden baseline checksum, not the HMI.`,
              `2. If delta exists: immediately force the ${nodeForHint} controller to FAIL-SAFE, do not defer to a maintenance window.`,
              "3. Revoke every operator token issued in the last 12 hours — credential replay is the lateral path.",
            ].join("\n"),
      delivery: "terminal",
    };
  }
  return {
    nextHintLevel: 3,
    hintText: [
      "=== FULL SOLUTION ===",
      "DETECT: Trust the twin baseline rung diff over the HMI — checksums on the display are spoofed by the adversary.",
      "CONTAIN: Take the OT switch VLAN segment that connects the EWS to controllers OFF the routed path.",
      "REMEDIATE: Force fail-safe on every controller at ring 3, revert ladder-logic from signed golden backups, then rotate operator tokens.",
    ].join("\n"),
    delivery: "terminal",
  };
}
