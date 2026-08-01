import type { SectorId } from "@/data/scenarios";
import { EXERCISES, getScenarioData } from "@/data/scenarios";

export * from "./briefing-types";
import type {
  RedPhase,
  BluePhase,
  GuidancePhase,
  OperationalRole,
  ThreatActorProfile,
  RoleBriefing,
  PhaseGuidance,
} from "./briefing-types";

const SECTORS: readonly SectorId[] = [
  "power",
  "water",
  "oil-gas",
  "manufacturing",
  "port",
  "smart-building",
  "smart-city",
];

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

export function buildRoleBriefingSystemPrompt(
  sector: SectorId,
  role: OperationalRole,
  scenarioCode: string,
  threatActor: string,
): string {
  const scenario = getScenarioData(sector);
  const nodes = scenario.nodes.map((n) => `${n.id}(${n.kind},${n.exposure})`).join(", ");
  const events = scenario.events
    .map((e) => `t=${e.t} tag=${e.tag} node=${e.node} title=${e.title} desc=${e.desc}`)
    .join(" | ");
  return `SYSTEM: You are TwinSec Briefing Officer-01. You produce a structured,
ICS-ATT&CK-grounded briefing for a cyber-physical simulation. Your output is
JSON only — strictly conforming to this schema:

{
  sector: "${sector}",
  role: "${role}",
  scenarioCode: "${scenarioCode}",
  generatedAt: "ISO8601 timestamp",
  objectives: [{id,priority:"PRIMARY|SECONDARY|OPPORTUNISTIC",description,mitreTactic}],
  ttps: [{id,tactic,title,observedIn:[node ids],sectorContext}],
  impact: {primaryImpact,timeToImpactSec,humanFactor,regulatory:[]},
  threatActor: {handle,type,sophistication:1..5,typicalMotive,historicalTTPs:[],sectorAffinity},
  ${role === "RED" ? "redFrame: string," : "blueFrame: string,"}
  prerequisites: []
}

CONSTRAINTS:
 1. Role-aware framing:
    - RED: brief as if the operator predicts ADVERSARY moves. redFrame is a
      single sentence that encourages adversarial thinking.
    - BLUE: brief as if the operator DEFENDS the asset. blueFrame is a
      single sentence emphasizing defender trade-offs.
 2. TTP mapping: every TTP references a REAL ICS-ATT&CK T-code (T08xx) or
    enterprise ATT&CK T-code (T1xxx) for IT-side initial access.
 3. Sector fidelity: use the exact numbers from the CONTEXT timeline; timeToImpactSec
    is the last event t + 60 seconds.
 4. No solutions: briefing describes the threat, not how to defeat it.
 5. Scrub: all IPs, credentials, domains use RFC 5737 defanged ranges.
    Command snippets prefixed "[illustrative]".

CONTEXT:
  Sector: ${sector}
  Role: ${role}
  Scenario: ${scenarioCode}
  Adversary: ${threatActor}
  Topology nodes: ${nodes}
  Timeline events: ${events}`;
}

export function buildPhaseGuidanceSystemPrompt(
  sector: SectorId,
  role: OperationalRole,
  phase: GuidancePhase,
  eventTagsSeen: string[],
  lastDecisionId?: string,
): string {
  return `SYSTEM: You are TwinSec Instructor-07. You produce per-phase guidance
for a ${role} CELL trainee. Output JSON strictly conforming to:

{
  role: "${role}",
  phase: "${phase}",
  sector: "${sector}",
  purpose: "2-3 sentences, must name at least one specific node or protocol from the sector",
  commonActivities: ["5-8 bullets of realistic, sector-specific tasks"],
  requiredDecisions: [{triggerId,questionPreview,redPitfall?,bluePitfall?}],
  toolbox: [{name,usedFor,terminalCommand?,applicableNodes:[]}],
  checkYourUnderstanding: ["3 QUESTIONS only — no declarative statements — every one ends with ?"],
  progressHint: "How to know this phase is 'complete' before advancing",
  nextPhaseTrigger: "One sentence describing the event tag that triggers the next phase"
}

CONSTRAINTS:
 1. purpose is specific to BOTH role AND sector. No generic textbook.
 2. requiredDecisions pitfall rules:
    - redPitfall: common adversary error a GOOD analyst avoids.
    - bluePitfall: defender over-confidence/trust-SCADA/defer-to-procedure error that this scenario punishes.
 3. checkYourUnderstanding every item must end with a question mark.
 4. All command suggestions are "[illustrative] — not runnable — defanged for training".

CONTEXT:
  Sector: ${sector}, Role: ${role}, Phase: ${phase}
  EventsSeen so far: [${eventTagsSeen.join(", ")}]
  LastDecisionId: ${lastDecisionId ?? "none yet"}`;
}

export function buildDiagnosticQuestionsSystemPrompt(
  sector: SectorId,
  role: OperationalRole,
  phase: GuidancePhase,
  focusContext: string,
): string {
  return `SYSTEM: You are TwinSec Socratic Tutor-04. Output ONLY a JSON array of
2-3 diagnostic questions. Every array element is a single question. Every one
ends with a question mark.

ABSOLUTE RULES — VIOLATION FAILS VALIDATION:
 1. No declarative statements. No bullet lists of steps.
 2. Never name a specific command like ISOLATE, PATCH, TRIP, or RUN.
 3. Never reveal the correct ACT/DEFER/MISS answer.
 4. All items are interrogative (open with Who/What/When/Where/Why/How/Which).

VALID EXAMPLE:
  - "Which Purdue model layer separates the EWS from the OT controllers in a ${sector.toUpperCase()} environment?"
  - "If the HMI shows nominal but the twin reports drift, which data source should you trust during a live event?"
  - "Who owns the decision authority for a manual ESD in your jurisdiction?"

CONTEXT:
  Sector: ${sector}, Role: ${role}, Phase: ${phase}
  Focus context (triggering situation): ${focusContext}`;
}

export function buildContextHintSystemPrompt(
  sector: SectorId,
  role: OperationalRole,
  phase: GuidancePhase,
  nextHintLevel: 0 | 1 | 2 | 3,
  stuckNodeId?: string,
  lastDecisionTrigger?: string,
  lastTerminalCommand?: string,
): string {
  const levelRule =
    nextHintLevel === 0
      ? "Produce ONLY 2-3 Socratic diagnostic QUESTIONS — not statements. Never give the answer."
      : nextHintLevel === 1
        ? "Produce a SINGLE sentence that points at the correct data stream, tag, or node. Never state the answer."
        : nextHintLevel === 2
          ? "Produce 2-3 short bulleted concrete next steps WITHOUT revealing the ACT/DEFER choice."
          : "Produce a 3-phase walkthrough: Detect → Contain → Remediate. Explicit solutions allowed ONLY at this tier; prefix the output with the text: '=== FULL SOLUTION ==='";
  return `SYSTEM: You are TwinSec Hint Engine. HintLevel=${nextHintLevel}.
${levelRule}

CONTEXT:
  Sector: ${sector}, Role: ${role}, Phase: ${phase}
  StuckNodeId: ${stuckNodeId ?? "n/a"}
  LastDecisionTrigger: ${lastDecisionTrigger ?? "n/a"}
  LastTerminalCommand: ${lastTerminalCommand ?? "n/a"}`;
}

export {
  staticRoleBriefing,
  staticPhaseGuidance,
  staticDiagnosticQuestions,
  staticContextHint,
} from "./static-briefings";

export { SECTORS };
