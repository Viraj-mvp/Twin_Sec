import type { SectorId } from "@/data/scenarios";

export const GUIDANCE_PHASES_RED = [
  "RECON",
  "WEAPON",
  "DELIVER",
  "EXPLOIT",
  "INSTALL",
  "C2",
  "AOO",
] as const;

export const GUIDANCE_PHASES_BLUE = [
  "PREPARATION",
  "IDENTIFICATION",
  "CONTAINMENT",
  "ERADICATION",
  "RECOVERY",
  "POST_INCIDENT",
] as const;

export type RedPhase = (typeof GUIDANCE_PHASES_RED)[number];
export type BluePhase = (typeof GUIDANCE_PHASES_BLUE)[number];
export type GuidancePhase = RedPhase | BluePhase;
export type OperationalRole = "RED" | "BLUE";

export type AttackObjective = {
  id: string;
  priority: "PRIMARY" | "SECONDARY" | "OPPORTUNISTIC";
  description: string;
  mitreTactic: string;
};

export type TechniqueEntry = {
  id: string;
  tactic: string;
  title: string;
  observedIn: string[];
  sectorContext: string;
};

export type ImpactAssessment = {
  primaryImpact: string;
  timeToImpactSec: number;
  humanFactor: string;
  regulatory: string[];
};

export type ThreatActorProfile = {
  handle: string;
  type: "NATION-STATE" | "INSIDER" | "ACTIVIST" | "CYBER-CRIME" | "SCRIPT-KIDDIE";
  sophistication: 1 | 2 | 3 | 4 | 5;
  typicalMotive: string;
  historicalTTPs: string[];
  sectorAffinity: string;
};

export type RoleBriefing = {
  sector: SectorId;
  role: OperationalRole;
  scenarioCode: string;
  generatedAt: string;
  objectives: AttackObjective[];
  ttps: TechniqueEntry[];
  impact: ImpactAssessment;
  threatActor: ThreatActorProfile;
  redFrame?: string;
  blueFrame?: string;
  prerequisites: string[];
};

export type RequiredDecision = {
  triggerId: string;
  questionPreview: string;
  redPitfall?: string;
  bluePitfall?: string;
};

export type ToolboxEntry = {
  name: string;
  usedFor: string;
  terminalCommand?: string;
  applicableNodes: string[];
};

export type PhaseGuidance = {
  role: OperationalRole;
  phase: GuidancePhase;
  sector: SectorId;
  purpose: string;
  commonActivities: string[];
  requiredDecisions: RequiredDecision[];
  toolbox: ToolboxEntry[];
  checkYourUnderstanding: string[];
  progressHint: string;
  nextPhaseTrigger: string;
};
