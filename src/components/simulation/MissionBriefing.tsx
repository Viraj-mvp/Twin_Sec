/**
 * MissionBriefing.tsx
 *
 * Interactive Pre-Simulation Mission Briefing screen.
 * Prepares the user before entering any attack scenario with full context:
 * 1. Scenario Overview
 * 2. Learning Objectives
 * 3. Scope
 * 4. Attack Intent
 * 5. Infrastructure Overview
 * 6. MITRE ATT&CK Overview
 * 7. Simulation Controls
 * 8. Interactive Walkthrough (Guided Mode vs Normal Mode toggle)
 * 9. Guided Hint System Details
 * 10. Contextual Help Info
 * 11. Explain Commands (Clickable command explanations)
 * 12. Explain Graph Changes
 * 13. Explain Timeline Events
 * 14. Mission Success Criteria
 * 15. End-to-End Learning Experience Launch CTA
 */

import React, { useState } from "react";
import type {
  AttackScenario,
  CommandExplanation,
  NodeExplanation,
  TimelineExplanation,
} from "@/simulation/scenarios/types";
import { CommandExplanationModal } from "./CommandExplanationModal";

interface MissionBriefingProps {
  scenario: AttackScenario;
  onStartSimulation: (guidedMode: boolean) => void;
  onBackToSelection?: () => void;
}

export const MissionBriefing: React.FC<MissionBriefingProps> = ({
  scenario,
  onStartSimulation,
  onBackToSelection,
}) => {
  const briefing = scenario.briefing;
  const [guidedMode, setGuidedMode] = useState<boolean>(true);
  const [selectedCommand, setSelectedCommand] = useState<CommandExplanation | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState<TimelineExplanation | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"briefing" | "commands" | "infrastructure" | "mitre">(
    "briefing",
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Banner Header */}
      <header className="border-b border-rule bg-paper text-ink px-6 lg:px-10 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="size-2.5 bg-accent animate-pulse-dot" />
          <span className="mono-label text-xs tracking-wider">
            TWINSEC · PRE-SIMULATION MISSION BRIEFING
          </span>
        </div>
        <div className="flex items-center gap-4">
          {onBackToSelection && (
            <button
              onClick={onBackToSelection}
              className="mono-label text-xs border border-ink/40 px-3 py-1.5 hover:bg-ink hover:text-paper transition-colors"
            >
              ← SCENARIOS
            </button>
          )}
          <span className="mono-label text-xs text-ink/70">EXERCISE {scenario.code}</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 mx-auto max-w-[1600px] w-full px-5 sm:px-8 lg:px-12 py-10 flex flex-col gap-12">
        {/* Title Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-rule pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="mono-label text-accent">
                TARGET SECTOR · {scenario.sector.toUpperCase()}
              </span>
              <span className="mono-label px-2 py-0.5 text-[10px] bg-red-950/60 text-red-400 border border-red-500/40">
                SEVERITY: {scenario.severity}
              </span>
            </div>
            <h1 className="display text-5xl sm:text-6xl lg:text-7xl leading-[0.9]">
              {briefing.overview.title}
            </h1>
            <p className="font-serif italic text-lg sm:text-xl text-foreground/80 mt-4 max-w-4xl leading-relaxed">
              {scenario.byline}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <button
              onClick={() => onStartSimulation(guidedMode)}
              className="w-full sm:w-auto bg-accent text-accent-foreground px-8 py-4 mono-label font-bold text-sm hover:bg-foreground hover:text-background transition-colors shadow-lg flex items-center justify-center gap-3"
            >
              <span>ENTER LIVE SIMULATION →</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-rule overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab("briefing")}
            className={`mono-label px-5 py-3 border-b-2 text-xs transition-colors whitespace-nowrap ${
              activeTab === "briefing"
                ? "border-accent text-accent bg-muted/20"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            01. MISSION BRIEFING
          </button>
          <button
            onClick={() => setActiveTab("infrastructure")}
            className={`mono-label px-5 py-3 border-b-2 text-xs transition-colors whitespace-nowrap ${
              activeTab === "infrastructure"
                ? "border-accent text-accent bg-muted/20"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            02. INFRASTRUCTURE & NODES ({briefing.infrastructure.length})
          </button>
          <button
            onClick={() => setActiveTab("mitre")}
            className={`mono-label px-5 py-3 border-b-2 text-xs transition-colors whitespace-nowrap ${
              activeTab === "mitre"
                ? "border-accent text-accent bg-muted/20"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            03. MITRE ATT&CK TACTICS ({briefing.mitreOverview.length})
          </button>
          <button
            onClick={() => setActiveTab("commands")}
            className={`mono-label px-5 py-3 border-b-2 text-xs transition-colors whitespace-nowrap ${
              activeTab === "commands"
                ? "border-accent text-accent bg-muted/20"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            04. CLI COMMAND EXPLANATIONS ({briefing.commandExplanations.length})
          </button>
        </div>

        {/* TAB 1: BRIEFING OVERVIEW */}
        {activeTab === "briefing" && (
          <div className="grid grid-cols-12 gap-8">
            {/* Left Column (8 Cols) */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-10">
              {/* Section 1: Scenario Overview */}
              <section className="border border-rule p-6 sm:p-8 bg-background">
                <p className="mono-label text-accent mb-3">SECTION 1 · SCENARIO OVERVIEW</p>
                <p className="font-serif text-lg text-foreground/90 leading-relaxed mb-6">
                  {briefing.overview.summary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-rule font-mono text-xs">
                  <div>
                    <span className="text-foreground/50">TARGET INFRASTRUCTURE:</span>
                    <p className="text-foreground font-semibold mt-1">
                      {briefing.overview.targetInfrastructure}
                    </p>
                  </div>
                  <div>
                    <span className="text-foreground/50">THREAT ACTOR:</span>
                    <p className="text-accent font-semibold mt-1">
                      {briefing.overview.threatActor}
                    </p>
                  </div>
                  <div className="sm:col-span-2 pt-2">
                    <span className="text-foreground/50">ESTIMATED BUSINESS IMPACT:</span>
                    <p className="text-red-400 font-semibold mt-1">
                      {briefing.overview.businessImpact}
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 2: Learning Objectives */}
              <section className="border border-rule p-6 sm:p-8 bg-background">
                <p className="mono-label text-accent mb-3">SECTION 2 · LEARNING OBJECTIVES</p>
                <ul className="space-y-3 font-serif text-base text-foreground/90">
                  {briefing.learningObjectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-accent font-mono font-bold">0{i + 1}.</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 3: Scope */}
              <section className="border border-rule p-6 sm:p-8 bg-background">
                <p className="mono-label text-accent mb-3">SECTION 3 · SIMULATION SCOPE</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="mono-label text-emerald-400 text-xs">INCLUDED IN SIMULATION</p>
                    <ul className="space-y-1.5 font-mono text-xs text-foreground/80">
                      {briefing.scope.included.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="mono-label text-foreground/50 text-xs">NOT INCLUDED</p>
                    <ul className="space-y-1.5 font-mono text-xs text-foreground/50">
                      {briefing.scope.excluded.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 4: Attack Intent */}
              <section className="border border-rule p-6 sm:p-8 bg-background">
                <p className="mono-label text-accent mb-3">SECTION 4 · ATTACK INTENT & NARRATIVE</p>
                <p className="font-serif italic text-base text-foreground/80 mb-4">
                  "{briefing.attackIntent.narrative}"
                </p>
                <p className="mono-label text-xs text-foreground/60 mb-2">
                  ATTACKER STEP-BY-STEP GOALS:
                </p>
                <ol className="space-y-2 font-mono text-xs text-foreground/90">
                  {briefing.attackIntent.attackerGoals.map((goal, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="size-1.5 bg-red-400 rounded-full" />
                      <span>{goal}</span>
                    </li>
                  ))}
                </ol>
              </section>

              {/* Section 14: Mission Success Criteria */}
              <section className="border border-accent/40 bg-accent/5 p-6 sm:p-8">
                <p className="mono-label text-accent mb-3">SECTION 14 · MISSION SUCCESS CRITERIA</p>
                <ul className="space-y-2.5 font-mono text-xs text-foreground">
                  {briefing.successCriteria.map((crit, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="text-accent font-bold">✓</span>
                      <span>{crit}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Right Column (4 Cols) */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
              {/* Section 8: Interactive Walkthrough Toggle */}
              <section className="border border-rule p-6 bg-paper text-ink">
                <p className="mono-label !text-ink/60 mb-2">SECTION 8 · WALKTHROUGH MODE</p>
                <h3 className="display text-2xl mb-4">Select Experience</h3>

                <div className="space-y-3">
                  <label
                    className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                      guidedMode ? "border-ink bg-ink text-paper" : "border-ink/30 hover:bg-ink/5"
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      checked={guidedMode}
                      onChange={() => setGuidedMode(true)}
                      className="mt-1"
                    />
                    <div>
                      <p className="mono-label text-xs">GUIDED MODE (RECOMMENDED)</p>
                      <p className="font-serif italic text-xs mt-1 opacity-80">
                        Contextual popup hints and step-by-step AI guidance appear automatically
                        during attack events.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                      !guidedMode ? "border-ink bg-ink text-paper" : "border-ink/30 hover:bg-ink/5"
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      checked={!guidedMode}
                      onChange={() => setGuidedMode(false)}
                      className="mt-1"
                    />
                    <div>
                      <p className="mono-label text-xs">EXPERT / ADVANCED MODE</p>
                      <p className="font-serif italic text-xs mt-1 opacity-80">
                        No automatic popups. Run the simulation silently at your own pace.
                      </p>
                    </div>
                  </label>
                </div>
              </section>

              {/* Section 7: Simulation Controls Guide */}
              <section className="border border-rule p-6 bg-background">
                <p className="mono-label text-accent mb-3">SECTION 7 · SIMULATION CONTROLS</p>
                <div className="space-y-3 font-mono text-xs">
                  {briefing.controls.map((ctrl, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center border-b border-rule/40 pb-2"
                    >
                      <div>
                        <p className="text-foreground font-semibold">{ctrl.name}</p>
                        <p className="text-foreground/60 text-[11px]">{ctrl.description}</p>
                      </div>
                      {ctrl.hotkey && (
                        <span className="mono-label bg-muted/40 px-2 py-0.5 text-[10px] border border-rule">
                          {ctrl.hotkey}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 9 & 10: Guided Hints & Contextual Help Preview */}
              <section className="border border-rule p-6 bg-background">
                <p className="mono-label text-accent mb-2">SECTIONS 9 & 10 · HINTS & HELP</p>
                <p className="font-serif text-sm text-foreground/80 mb-3">
                  During live execution, popup hints react dynamically to attack events. If you
                  become stuck, press `?` or click the CLI terminal trigger.
                </p>
                <div className="bg-amber-950/30 p-3 border border-amber-500/40 font-mono text-xs text-amber-300">
                  💡 {briefing.helpContent.idleSuggestionText}
                </div>
              </section>

              {/* CTA Box */}
              <div className="border border-accent p-6 bg-background flex flex-col gap-4 text-center">
                <p className="mono-label text-accent">READY TO BEGIN?</p>
                <button
                  onClick={() => onStartSimulation(guidedMode)}
                  className="w-full bg-accent text-accent-foreground py-4 mono-label font-bold hover:bg-foreground hover:text-background transition-colors"
                >
                  START SIMULATION NOW →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INFRASTRUCTURE OVERVIEW */}
        {activeTab === "infrastructure" && (
          <div className="space-y-6">
            <div className="border border-rule p-6 bg-background">
              <p className="mono-label text-accent mb-2">
                SECTION 5 · INFRASTRUCTURE & TARGET ASSETS
              </p>
              <p className="font-serif text-base text-foreground/80">
                Click any asset node to view detailed Purdue model classification, vulnerability
                exposure, and defensive containment instructions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {briefing.infrastructure.map((asset, i) => {
                const isSelected = selectedNodeId === asset.nodeId;
                const nodeExp = briefing.nodeExplanations[asset.nodeId];

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedNodeId(isSelected ? null : asset.nodeId)}
                    className={`border p-5 cursor-pointer transition-all ${
                      isSelected
                        ? "border-accent bg-accent/10"
                        : "border-rule bg-background hover:border-foreground/40"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono font-bold text-lg text-accent">
                        {asset.assetName}
                      </span>
                      <span className="mono-label text-[10px] px-2 py-0.5 bg-muted/40 border border-rule">
                        {asset.purdueLevel}
                      </span>
                    </div>
                    <p className="font-serif italic text-sm text-foreground/80 mb-3">
                      {asset.role}
                    </p>

                    {nodeExp ? (
                      <div className="mt-3 pt-3 border-t border-rule/40 font-mono text-xs space-y-2">
                        <p className="text-foreground/70">{nodeExp.securityImpact}</p>
                        {isSelected && (
                          <div className="pt-2 space-y-1 text-emerald-400">
                            <p className="font-bold text-[11px]">DEFENSIVE ACTION:</p>
                            {nodeExp.defensiveRecommendations.map((rec, rIdx) => (
                              <p key={rIdx}>• {rec}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="font-mono text-xs text-foreground/50">
                        Click to expand details
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: MITRE ATT&CK TACTICS */}
        {activeTab === "mitre" && (
          <div className="space-y-6">
            <div className="border border-rule p-6 bg-background">
              <p className="mono-label text-accent mb-2">SECTION 6 · MITRE ATT&CK MATRIX MAPPING</p>
              <p className="font-serif text-base text-foreground/80">
                As the simulation progresses, these adversary tactics fire in sequence across the
                timeline.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {briefing.mitreOverview.map((tactic) => (
                <div key={tactic.id} className="border border-rule p-5 bg-background space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="mono-label text-accent text-xs">
                      STAGE {tactic.sequenceOrder}
                    </span>
                    <span className="font-mono text-xs text-foreground/60">
                      {tactic.techniqueId}
                    </span>
                  </div>
                  <h4 className="font-mono font-bold text-base text-foreground">{tactic.name}</h4>
                  <p className="mono-label text-xs text-accent">{tactic.techniqueName}</p>
                  <p className="font-serif italic text-xs text-foreground/70">
                    {tactic.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CLI COMMAND EXPLANATIONS */}
        {activeTab === "commands" && (
          <div className="space-y-6">
            <div className="border border-rule p-6 bg-background">
              <p className="mono-label text-accent mb-2">SECTION 11 · EXPLAIN COMMANDS</p>
              <p className="font-serif text-base text-foreground/80">
                Click any simulated terminal command below to open its full syntax reference, risk
                analysis, and detection opportunities.
              </p>
            </div>

            {briefing.commandExplanations.length > 0 ? (
              <div className="space-y-3 font-mono text-xs">
                {briefing.commandExplanations.map((cmd, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedCommand(cmd)}
                    className="border border-rule p-4 bg-black/80 hover:border-accent cursor-pointer transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                  >
                    <div>
                      <span className="text-accent font-bold text-sm">{cmd.command}</span>
                      <p className="text-foreground/70 text-xs mt-1">{cmd.purpose}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="mono-label text-[10px] text-foreground/50">
                        {cmd.mitreTechnique}
                      </span>
                      <button className="mono-label text-xs bg-accent text-accent-foreground px-3 py-1">
                        INSPECT →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-rule p-8 text-center font-mono text-xs text-foreground/50">
                Default CLI commands available in Kali Terminal (`help`, `scan`, `isolate`, `patch`,
                `override`, `status`).
              </div>
            )}
          </div>
        )}
      </main>

      {/* Interactive Command Modal */}
      <CommandExplanationModal
        commandExp={selectedCommand}
        onClose={() => setSelectedCommand(null)}
      />
    </div>
  );
};
