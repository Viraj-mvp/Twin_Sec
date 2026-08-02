/**
 * types.ts
 *
 * Data structure and type definitions for Attack Scenarios, Structured Attack Events,
 * and Pre-Simulation Mission Briefings.
 */

import type { AttackEventType } from "@/lib/event-bus";
import type { Node, Edge, Decision, Severity, SectorId, ChoiceId } from "@/data/scenarios";

export type AttackLifecycleState =
  | "Idle"
  | "Recon"
  | "Enumeration"
  | "Initial Access"
  | "Execution"
  | "Persistence"
  | "Privilege Escalation"
  | "Credential Access"
  | "Discovery"
  | "Lateral Movement"
  | "Impact"
  | "Recovery";

export interface StructuredAttackEvent {
  id: string;
  time: number; // Seconds (T+)
  type: AttackEventType;
  tag: string;
  node: string;
  title: string;
  desc: string;
  sev: Severity;
  lifecycleState?: AttackLifecycleState;
  payload: {
    command?: string;
    output?: string;
    outputStream?: string[];
    delayMs?: number;
    highlightNodes?: string[];
    affectedNodes?: string[];
    edgeFrom?: string;
    edgeTo?: string;
    metrics?: Record<string, number | string>;
    logEntry?: {
      level: "INFO" | "WARN" | "CRITICAL" | "SUCCESS";
      message: string;
      source: string;
    };
    alert?: {
      id: string;
      title: string;
      severity: Severity;
      mitreId: string;
    };
    popupHint?: {
      title: string;
      text: string;
      nodeId?: string;
      level?: number;
    };
    aiExplanation?: {
      title: string;
      text: string;
      mitreTactics?: string[];
      recommendedAction?: string;
    };
    recommendation?: {
      title: string;
      text: string;
      actionType: "isolate" | "patch" | "override";
      targetNodeId: string;
    };
    [key: string]: unknown;
  };
}

export interface CommandExplanation {
  command: string;
  purpose: string;
  syntax: string;
  expectedOutput: string;
  attackerIntent: string;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  detectionOpportunities: string;
  mitreTechnique: string;
}

export interface NodeExplanation {
  nodeId: string;
  label: string;
  role: string;
  purdueLevel: string;
  securityImpact: string;
  defensiveRecommendations: string[];
  mitreMapping: string[];
}

export interface TimelineExplanation {
  time: number;
  title: string;
  whatHappened: string;
  whyItHappened: string;
  impact: string;
  detectionOpportunities: string[];
  possibleMitigations: string[];
  aiSummary: string;
}

export interface MITRETacticOverview {
  id: string;
  name: string;
  techniqueId: string;
  techniqueName: string;
  description: string;
  sequenceOrder: number;
}

export interface BriefingData {
  overview: {
    title: string;
    summary: string;
    targetInfrastructure: string;
    threatActor: string;
    businessImpact: string;
  };
  learningObjectives: string[];
  scope: {
    included: string[];
    excluded: string[];
  };
  attackIntent: {
    narrative: string;
    attackerGoals: string[];
  };
  infrastructure: {
    assetName: string;
    role: string;
    purdueLevel: string;
    nodeId: string;
  }[];
  mitreOverview: MITRETacticOverview[];
  controls: {
    name: string;
    description: string;
    hotkey?: string;
  }[];
  guidedHints: {
    triggerEventId: string;
    hintText: string;
  }[];
  helpContent: {
    idleSuggestionText: string;
    commonFAQ: { question: string; answer: string }[];
  };
  commandExplanations: CommandExplanation[];
  nodeExplanations: Record<string, NodeExplanation>;
  timelineExplanations: TimelineExplanation[];
  successCriteria: string[];
}

export interface AttackScenario {
  id: string;
  sector: SectorId;
  name: string;
  code: string;
  site: string;
  byline: string;
  adversary: string;
  protocols: string;
  description: string;
  duration: number;
  mitreMapping: string[];
  severity: Severity;
  nodes: Node[];
  edges: Edge[];
  decisions: Decision[];
  events: StructuredAttackEvent[];
  briefing: BriefingData;
}
