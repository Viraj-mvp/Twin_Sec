/**
 * MissionBriefing.tsx
 *
 * Sleek Deep Dark Black Neo-Brutalist Pre-Simulation Mission Briefing screen.
 * Aligned 100% with TwinSec's core design system (deep dark #09090B/#0D0E12 background,
 * high-contrast Acid Lime #BFFF2E, Cyan #00F0FF, and Crimson #FF2E55 accents,
 * heavy 3px borders, hard drop shadows, and CyberRadar canvas).
 *
 * Dynamically updates simulation tasks, CLI command explanations, and infrastructure nodes
 * based on selected Sector and Red vs. Blue Operational Cell preference.
 */

import React, { useState } from "react";
import type {
  AttackScenario,
  CommandExplanation,
  NodeExplanation,
  TimelineExplanation,
} from "@/simulation/scenarios/types";
import type { SectorId } from "@/data/scenarios";
import { CommandExplanationModal } from "./CommandExplanationModal";
import { TwinSecLogo } from "@/components/TwinSecLogo";
import { CyberRadarCanvas } from "@/components/CyberRadarCanvas";
import { CyberNetworkCanvas } from "@/components/CyberNetworkCanvas";
import {
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Zap,
  ArrowLeft,
  Crosshair,
  Activity,
  Layers,
  Command,
  CheckCircle2,
  Lock,
  Cpu,
  ListChecks,
  FolderLock,
  Sparkles,
  Download,
} from "lucide-react";
import {
  exportRunLedgerJSON,
  exportRunLedgerCSV,
  exportRunLedgerReport,
  type RunLedgerData,
} from "@/lib/ledger-export";

interface MissionBriefingProps {
  scenario: AttackScenario;
  onStartSimulation: (guidedMode: boolean, role?: "RED" | "BLUE") => void;
  onBackToSelection?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const MissionBriefing: React.FC<MissionBriefingProps> = ({
  scenario,
  onStartSimulation,
  onBackToSelection,
  onClose,
  isModal = false,
}) => {
  const briefing = scenario.briefing;
  const [guidedMode, setGuidedMode] = useState<boolean>(true);
  const [selectedRole, setSelectedRole] = useState<"RED" | "BLUE">("BLUE");
  const [selectedCommand, setSelectedCommand] = useState<CommandExplanation | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"briefing" | "commands" | "infrastructure" | "mitre">(
    "briefing",
  );

  const handleExport = (fmt: "json" | "csv" | "report") => {
    const mockData: RunLedgerData = {
      runId: `DOSSIER-${scenario.sector.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      sector: scenario.sector as SectorId,
      adversary: scenario.byline,
      role: selectedRole,
      choices: {},
      decisions: [],
      terminalCommands: briefing.commandExplanations.map((c) => c.syntax),
      isolatedNodes: [],
      patchedNodes: [],
      metrics: {
        mwShed: 0,
        mttdFormatted: "14.0m",
        mttrFormatted: "0.8h",
        costFormatted: "$0.4M",
        score: 100,
        outcomeBranch: "D — CONTAINED",
        impactLabel: "IMPACT",
        impactFormatted: "0.0 UNIT",
        physics: { speedHz: 50, bearingC: 62, pressure: 8.2 },
      },
      activeEvents: [],
    };

    if (fmt === "csv") exportRunLedgerCSV(mockData);
    else if (fmt === "report") exportRunLedgerReport(mockData);
    else exportRunLedgerJSON(mockData);
  };

  return (
    <div
      className={
        isModal
          ? "fixed inset-0 z-[60] bg-black/90 backdrop-blur-md p-3 sm:p-6 select-none overflow-y-auto overflow-x-hidden font-mono flex items-center justify-center"
          : "min-h-screen w-full max-w-full bg-[#09090B] text-white relative p-3 sm:p-6 lg:p-8 select-none overflow-y-auto overflow-x-hidden font-mono flex items-center justify-center"
      }
    >
      {/* 60fps Interactive SCADA Cyber Radar Canvas Background */}
      <CyberRadarCanvas className="opacity-60" />
      <CyberNetworkCanvas className="opacity-30" />
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none z-0" />
      <div className="absolute inset-0 scanline opacity-30 pointer-events-none z-0" />

      {/* SLEEK DEEP DARK BLACK DOSSIER CONTAINER (#0D0E12) */}
      <main className="relative z-10 w-full max-w-6xl bg-[#0D0E12] border-3 border-zinc-800 lg:border-[#BFFF2E]/40 shadow-[12px_12px_0px_0px_#000000] p-4 sm:p-6 lg:p-8 space-y-6 flex flex-col justify-between my-auto">
        {/* Top Header Bar & Stamped Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            {onBackToSelection && (
              <button
                type="button"
                onClick={onBackToSelection}
                className="bg-zinc-900 text-white hover:bg-[#BFFF2E] hover:text-black transition-colors px-3.5 py-1.5 font-mono text-xs font-black uppercase border border-zinc-700 flex items-center gap-2 shadow-[2px_2px_0px_0px_#000000] cursor-pointer"
              >
                <ArrowLeft className="size-4" />
                <span>← SCENARIOS</span>
              </button>
            )}
            <span className="bg-[#BFFF2E] text-black font-black text-[11px] uppercase px-3 py-1 border border-black shadow-[2px_2px_0px_0px_#000000]">
              EXERCISE {scenario.code}
            </span>
          </div>

          {/* Stamped Security Badges & Close Button */}
          <div className="flex items-center gap-2">
            <span className="bg-[#BFFF2E] text-black font-black text-[10px] uppercase px-2.5 py-0.5 border border-black shadow-[2px_2px_0px_0px_#000000] transform -rotate-1">
              ★ SECTOR: {scenario.sector.toUpperCase()}
            </span>
            <span className="bg-red-600 text-white font-black text-[10px] uppercase px-2.5 py-0.5 border border-black shadow-[2px_2px_0px_0px_#000000] transform rotate-1">
              RESTRICTED // LEVEL 4
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="bg-red-950 text-red-400 hover:bg-red-600 hover:text-white font-black text-[10px] uppercase px-3 py-1 border border-red-500/60 shadow-[2px_2px_0px_0px_#000000] cursor-pointer transition-colors ml-2"
                title="Dismiss Briefing Dossier Overlay"
              >
                ✕ DISMISS
              </button>
            )}
          </div>
        </div>

        {/* Header & Scenario Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <TwinSecLogo showWordmark variant="dark" size={40} />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleExport("report")}
                className="bg-[#BFFF2E] text-black hover:bg-white font-black text-[10px] uppercase px-2.5 py-1 border border-black shadow-[2px_2px_0px_0px_#000000] flex items-center gap-1 cursor-pointer transition-colors"
                title="Download HTML Debrief Dossier Report"
              >
                <Download className="size-3" />
                <span>DOSSIER REPORT</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport("json")}
                className="bg-zinc-900 text-[#BFFF2E] hover:bg-[#BFFF2E] hover:text-black font-black text-[10px] uppercase px-2.5 py-1 border border-[#BFFF2E]/40 shadow-[2px_2px_0px_0px_#000000] flex items-center gap-1 cursor-pointer transition-colors"
                title="Export JSON Run Ledger"
              >
                <Download className="size-3" />
                <span>JSON</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport("csv")}
                className="bg-zinc-900 text-[#BFFF2E] hover:bg-[#BFFF2E] hover:text-black font-black text-[10px] uppercase px-2.5 py-1 border border-[#BFFF2E]/40 shadow-[2px_2px_0px_0px_#000000] flex items-center gap-1 cursor-pointer transition-colors"
                title="Export CSV Run Ledger"
              >
                <Download className="size-3" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          <div className="flex items-start gap-4 pt-1">
            <FolderLock className="size-9 text-[#BFFF2E] shrink-0 mt-1" />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="bg-black text-[#BFFF2E] font-black text-[10px] uppercase px-2.5 py-0.5 border border-[#BFFF2E]/40">
                  {scenario.sector.toUpperCase()} SECTOR SIMULATION
                </span>
                <span className="bg-red-500/20 text-red-400 border border-red-500/50 font-black text-[10px] uppercase px-2.5 py-0.5">
                  SEVERITY: {scenario.severity}
                </span>
              </div>
              <h1 className="display text-3xl sm:text-4xl lg:text-5xl text-white uppercase tracking-wide leading-tight">
                {briefing.overview.title}
              </h1>
              <p className="font-serif italic text-base sm:text-lg text-zinc-300 mt-1 max-w-4xl leading-relaxed">
                "{scenario.byline}"
              </p>
            </div>
          </div>
        </div>

        {/* SELECTIVE OPERATIONAL TEAM ROLE SELECTOR (RED VS BLUE) */}
        <div className="bg-[#14161D] border-2 border-zinc-800 p-4 sm:p-5 space-y-3 shadow-[4px_4px_0px_0px_#000000]">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="bg-zinc-900 text-[#BFFF2E] font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 border border-[#BFFF2E]/40 flex items-center gap-1.5">
              <Crosshair className="size-3 text-[#BFFF2E]" />
              00 // SELECT OPERATIONAL TEAM ROLE & PLAYGAME PERSPECTIVE
            </span>
            <Lock className="size-3.5 text-zinc-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Blue Team Defender Option */}
            <div
              onClick={() => setSelectedRole("BLUE")}
              className={`p-4 border-2 cursor-pointer transition-all ${
                selectedRole === "BLUE"
                  ? "bg-[#090b0e] text-white border-[#00F0FF] shadow-[6px_6px_0px_0px_#00F0FF] translate-x-[-2px] translate-y-[-2px]"
                  : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    className={`size-5 ${selectedRole === "BLUE" ? "text-[#00F0FF]" : "text-zinc-500"}`}
                  />
                  <span
                    className={`font-black text-sm uppercase tracking-wider ${selectedRole === "BLUE" ? "text-[#00F0FF]" : "text-zinc-300"}`}
                  >
                    🛡️ BLUE CELL (DEFENDER)
                  </span>
                </div>
                {selectedRole === "BLUE" && (
                  <span className="bg-[#00F0FF] text-black font-black text-[9px] uppercase px-2 py-0.5 border border-black shadow-[1px_1px_0px_0px_#000000]">
                    ACTIVE
                  </span>
                )}
              </div>
              <p
                className={`text-xs leading-relaxed font-bold ${selectedRole === "BLUE" ? "text-zinc-200" : "text-zinc-400"}`}
              >
                Live ongoing attack sequence unfolding in real time. Type incident containment
                commands in the terminal (
                <code className="bg-black text-[#00F0FF] px-1">isolate</code>,{" "}
                <code className="bg-black text-[#00F0FF] px-1">block-ip</code>,{" "}
                <code className="bg-black text-[#00F0FF] px-1">restore-logic</code>) to defend SCADA
                assets.
              </p>
            </div>

            {/* Red Team Attacker Option */}
            <div
              onClick={() => setSelectedRole("RED")}
              className={`p-4 border-2 cursor-pointer transition-all ${
                selectedRole === "RED"
                  ? "bg-[#090b0e] text-white border-[#FF2E55] shadow-[6px_6px_0px_0px_#FF2E55] translate-x-[-2px] translate-y-[-2px]"
                  : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert
                    className={`size-5 ${selectedRole === "RED" ? "text-[#FF2E55]" : "text-zinc-500"}`}
                  />
                  <span
                    className={`font-black text-sm uppercase tracking-wider ${selectedRole === "RED" ? "text-[#FF2E55]" : "text-zinc-300"}`}
                  >
                    ⚔️ RED CELL (ATTACKER)
                  </span>
                </div>
                {selectedRole === "RED" && (
                  <span className="bg-[#FF2E55] text-white font-black text-[9px] uppercase px-2 py-0.5 border border-black shadow-[1px_1px_0px_0px_#000000]">
                    ACTIVE
                  </span>
                )}
              </div>
              <p
                className={`text-xs leading-relaxed font-bold ${selectedRole === "RED" ? "text-zinc-200" : "text-zinc-400"}`}
              >
                Interactive hands-on offensive assault. Execute exploit sequences step-by-step via
                CLI terminal commands (<code className="bg-black text-[#FF2E55] px-1">nmap</code>,{" "}
                <code className="bg-black text-[#FF2E55] px-1">modbus-cli</code>,{" "}
                <code className="bg-black text-[#FF2E55] px-1">iec104-inject</code>) to drive attack
                progression.
              </p>
            </div>
          </div>
        </div>

        {/* HIGH-CONTRAST TAB NAVIGATION */}
        <div className="flex flex-wrap gap-2 border-b-2 border-zinc-800 pb-3">
          {[
            { id: "briefing", label: "01 // MISSION BRIEFING", icon: ShieldCheck },
            {
              id: "infrastructure",
              label: `02 // INFRASTRUCTURE NODES (${briefing.infrastructure.length})`,
              icon: Cpu,
            },
            {
              id: "mitre",
              label: `03 // MITRE ATT&CK (${briefing.mitreOverview.length})`,
              icon: Layers,
            },
            {
              id: "commands",
              label: `04 // CLI COMMAND REF (${briefing.commandExplanations.length})`,
              icon: Terminal,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2.5 font-mono text-xs font-black uppercase border-2 transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-[#BFFF2E] text-black border-[#BFFF2E] shadow-[3px_3px_0px_0px_#000000] translate-y-[-2px]"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
                }`}
              >
                <Icon className="size-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: BRIEFING OVERVIEW */}
        {activeTab === "briefing" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Dossier Sections (8 Cols) */}
            <div className="lg:col-span-8 space-y-5">
              {/* Section 1: Scenario Overview */}
              <div className="bg-[#14161D] border-2 border-zinc-800 p-5 space-y-3 shadow-[4px_4px_0px_0px_#000000]">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="bg-zinc-900 text-[#BFFF2E] font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 border border-[#BFFF2E]/40">
                    01 // SCENARIO OVERVIEW & NARRATIVE
                  </span>
                  <ShieldCheck className="size-3.5 text-[#BFFF2E]" />
                </div>
                <p className="font-serif italic text-base text-zinc-200 leading-relaxed bg-black/60 p-4 border border-zinc-800">
                  "{briefing.overview.summary}"
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-bold">
                  <div className="bg-black/60 p-3 border border-zinc-800">
                    <span className="block text-[9px] font-black text-zinc-400 uppercase">
                      TARGET INFRASTRUCTURE
                    </span>
                    <span className="text-[#00F0FF] font-extrabold">
                      {briefing.overview.targetInfrastructure}
                    </span>
                  </div>
                  <div className="bg-black/60 p-3 border border-zinc-800">
                    <span className="block text-[9px] font-black text-zinc-400 uppercase">
                      ATTRIBUTED THREAT ACTOR
                    </span>
                    <span className="text-[#FF2E55] font-extrabold">
                      {briefing.overview.threatActor}
                    </span>
                  </div>
                  <div className="sm:col-span-2 bg-red-950/40 p-3 border border-red-500/40">
                    <span className="block text-[9px] font-black text-red-400 uppercase">
                      ESTIMATED BUSINESS & KINETIC IMPACT
                    </span>
                    <span className="text-red-300 font-extrabold">
                      {briefing.overview.businessImpact}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Learning Objectives */}
              <div className="bg-[#14161D] border-2 border-zinc-800 p-5 space-y-3 shadow-[4px_4px_0px_0px_#000000]">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="bg-zinc-900 text-[#BFFF2E] font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 border border-[#BFFF2E]/40">
                    02 // OPERATIONAL LEARNING OBJECTIVES
                  </span>
                  <ListChecks className="size-3.5 text-[#BFFF2E]" />
                </div>
                <ul className="space-y-2 font-mono text-xs">
                  {briefing.learningObjectives.map((obj, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 bg-black/60 p-3 border border-zinc-800 font-bold"
                    >
                      <span className="bg-[#BFFF2E] text-black font-black text-[10px] px-1.5 py-0.5 shrink-0 border border-black">
                        0{i + 1}
                      </span>
                      <span className="text-zinc-200">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 3: Scope */}
              <div className="bg-[#14161D] border-2 border-zinc-800 p-5 space-y-3 shadow-[4px_4px_0px_0px_#000000]">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="bg-zinc-900 text-[#BFFF2E] font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 border border-[#BFFF2E]/40">
                    03 // EXERCISE SCOPE & BOUNDARIES
                  </span>
                  <ShieldCheck className="size-3.5 text-[#BFFF2E]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                  <div className="bg-emerald-950/30 border border-emerald-500/40 p-3 space-y-1">
                    <span className="block font-black text-[10px] text-emerald-400 uppercase">
                      ✓ INCLUDED IN RANGE ENVIRONMENT
                    </span>
                    <ul className="space-y-1 text-emerald-200 font-bold">
                      {briefing.scope.included.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-black/60 border border-zinc-800 p-3 space-y-1">
                    <span className="block font-black text-[10px] text-zinc-500 uppercase">
                      ✕ EXCLUDED FROM SIMULATION
                    </span>
                    <ul className="space-y-1 text-zinc-400 font-bold">
                      {briefing.scope.excluded.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 4: Attack Intent */}
              <div className="bg-[#14161D] border-2 border-zinc-800 p-5 space-y-3 shadow-[4px_4px_0px_0px_#000000]">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="bg-zinc-900 text-[#BFFF2E] font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 border border-[#BFFF2E]/40">
                    04 // ADVERSARY KILLCHAIN & INTENT
                  </span>
                  <ShieldAlert className="size-3.5 text-[#BFFF2E]" />
                </div>
                <p className="font-serif italic text-sm text-zinc-300 bg-black/60 p-3 border border-zinc-800">
                  "{briefing.attackIntent.narrative}"
                </p>
                <div className="space-y-1.5 pt-1">
                  <span className="block font-black text-[10px] text-zinc-400 uppercase">
                    STEP-BY-STEP ADVERSARY GOALS:
                  </span>
                  <ol className="space-y-1.5 text-xs font-extrabold text-white">
                    {briefing.attackIntent.attackerGoals.map((goal, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 bg-black/60 px-3 py-2 border border-zinc-800"
                      >
                        <span className="size-2 bg-[#FF2E55] shrink-0 rounded-full" />
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            {/* Right Column: Controls & Execution Setup (4 Cols) */}
            <div className="lg:col-span-4 space-y-5">
              {/* Walkthrough Mode Selection */}
              <div className="bg-[#14161D] border-2 border-zinc-800 p-5 space-y-3 shadow-[4px_4px_0px_0px_#000000]">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="bg-zinc-900 text-[#BFFF2E] font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 border border-[#BFFF2E]/40">
                    WALKTHROUGH ASSIST MODE
                  </span>
                  <Sparkles className="size-3.5 text-[#BFFF2E]" />
                </div>

                <div className="space-y-2.5 text-xs font-bold">
                  <label
                    className={`flex items-start gap-2.5 p-3 border-2 cursor-pointer transition-all ${
                      guidedMode
                        ? "bg-[#090b0e] text-white border-[#BFFF2E] shadow-[3px_3px_0px_0px_#000000]"
                        : "bg-black/60 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      checked={guidedMode}
                      onChange={() => setGuidedMode(true)}
                      className="mt-0.5 accent-[#BFFF2E]"
                    />
                    <div>
                      <span className="block font-black uppercase text-[11px] text-[#BFFF2E]">
                        GUIDED MODE (RECOMMENDED)
                      </span>
                      <span className="text-[10px] font-bold opacity-90 block mt-0.5">
                        Contextual popup hints and step-by-step AI guidance appear automatically.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 border-2 cursor-pointer transition-all ${
                      !guidedMode
                        ? "bg-[#090b0e] text-white border-[#BFFF2E] shadow-[3px_3px_0px_0px_#000000]"
                        : "bg-black/60 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      checked={!guidedMode}
                      onChange={() => setGuidedMode(false)}
                      className="mt-0.5 accent-[#BFFF2E]"
                    />
                    <div>
                      <span className="block font-black uppercase text-[11px] text-[#BFFF2E]">
                        EXPERT / ADVANCED MODE
                      </span>
                      <span className="text-[10px] font-bold opacity-90 block mt-0.5">
                        No automatic popups. Run the simulation silently at your own pace.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Mission Success Criteria */}
              <div className="bg-black text-white border-2 border-[#BFFF2E] p-5 space-y-3 shadow-[4px_4px_0px_0px_#000000]">
                <span className="bg-[#BFFF2E] text-black font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 border border-black inline-block">
                  MISSION SUCCESS CRITERIA
                </span>
                <ul className="space-y-1.5 text-xs font-black">
                  {briefing.successCriteria.map((crit, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 shrink-0 text-[#BFFF2E] fill-[#BFFF2E]/20" />
                      <span>{crit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* PRIMARY START SIMULATION CTA BUTTON */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onStartSimulation(guidedMode, selectedRole)}
                  className={`w-full border-2 border-black py-4 font-mono text-xs font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_#000000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-0 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    selectedRole === "RED"
                      ? "bg-[#FF2E55] text-white hover:bg-red-600"
                      : "bg-[#BFFF2E] text-black hover:bg-lime-400"
                  }`}
                >
                  <Zap className="size-4 fill-current" />
                  <span>START {selectedRole} CELL SIMULATION →</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INFRASTRUCTURE OVERVIEW */}
        {activeTab === "infrastructure" && (
          <div className="space-y-4">
            <div className="bg-[#14161D] border-2 border-zinc-800 p-4 space-y-1 shadow-[4px_4px_0px_0px_#000000]">
              <span className="bg-zinc-900 text-[#BFFF2E] font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 border border-[#BFFF2E]/40 inline-block">
                05 // INFRASTRUCTURE & PURDUE MODEL ARCHITECTURE
              </span>
              <p className="text-xs font-bold text-zinc-300 pt-1">
                Select any OT node to view Purdue Model classification, vulnerability exposure, and
                containment recommendations.
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
                    className={`border-2 p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#090b0e] text-white border-[#BFFF2E] shadow-[6px_6px_0px_0px_#000000] translate-x-[-2px] translate-y-[-2px]"
                        : "bg-[#14161D] text-zinc-300 border-zinc-800 hover:border-zinc-700 shadow-[3px_3px_0px_0px_#000000]"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2 border-b border-zinc-800 pb-2">
                      <span
                        className={`font-black text-base ${isSelected ? "text-[#BFFF2E]" : "text-white"}`}
                      >
                        {asset.assetName}
                      </span>
                      <span className="bg-[#BFFF2E] text-black font-black text-[9px] px-2 py-0.5 border border-black uppercase">
                        {asset.purdueLevel}
                      </span>
                    </div>
                    <p
                      className={`font-serif italic text-xs mb-2 font-bold ${isSelected ? "text-zinc-200" : "text-zinc-400"}`}
                    >
                      {asset.role}
                    </p>

                    {nodeExp ? (
                      <div className="mt-2 pt-2 border-t border-zinc-800 text-xs space-y-1.5 font-bold">
                        <p className={isSelected ? "text-zinc-200" : "text-zinc-400"}>
                          {nodeExp.securityImpact}
                        </p>
                        {isSelected && (
                          <div className="pt-1 space-y-1 text-[#BFFF2E]">
                            <span className="font-black text-[10px] uppercase block">
                              RECOMMENDED CONTAINER ACTION:
                            </span>
                            {nodeExp.defensiveRecommendations.map((rec, rIdx) => (
                              <p key={rIdx} className="text-[11px]">
                                • {rec}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-[#BFFF2E] block pt-1">
                        Click to view details →
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: MITRE ATT&CK MATRIX */}
        {activeTab === "mitre" && (
          <div className="space-y-4">
            <div className="bg-[#14161D] border-2 border-zinc-800 p-4 space-y-1 shadow-[4px_4px_0px_0px_#000000]">
              <span className="bg-zinc-900 text-[#BFFF2E] font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 border border-[#BFFF2E]/40 inline-block">
                06 // MITRE ATT&CK FOR ICS MATRIX MAPPING
              </span>
              <p className="text-xs font-bold text-zinc-300 pt-1">
                Sequential mapping of adversary tactics, techniques, and procedures (TTPs) across
                the attack lifecycle.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {briefing.mitreOverview.map((tactic) => (
                <div
                  key={tactic.id}
                  className="bg-[#14161D] border-2 border-zinc-800 p-4 space-y-2 shadow-[4px_4px_0px_0px_#000000]"
                >
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                    <span className="bg-black text-[#BFFF2E] font-black text-[10px] px-2 py-0.5 border border-[#BFFF2E]/40">
                      STAGE {tactic.sequenceOrder}
                    </span>
                    <span className="font-black text-xs text-red-400 bg-red-950/40 px-2 py-0.5 border border-red-500/40">
                      {tactic.techniqueId}
                    </span>
                  </div>
                  <h4 className="font-black text-base text-white">{tactic.name}</h4>
                  <span className="bg-black text-[#00F0FF] font-black text-[10px] px-2 py-0.5 border border-[#00F0FF]/40 block w-fit">
                    {tactic.techniqueName}
                  </span>
                  <p className="font-serif italic text-xs text-zinc-300 leading-relaxed pt-1">
                    {tactic.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CLI COMMAND EXPLANATIONS */}
        {activeTab === "commands" && (
          <div className="space-y-4">
            <div className="bg-[#14161D] border-2 border-zinc-800 p-4 space-y-1 shadow-[4px_4px_0px_0px_#000000]">
              <span className="bg-zinc-900 text-[#BFFF2E] font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 border border-[#BFFF2E]/40 inline-block">
                07 // CYBER RANGE CLI COMMAND EXPLANATIONS
              </span>
              <p className="text-xs font-bold text-zinc-300 pt-1">
                Click any CLI command for detailed syntax rules, parameter definitions, and
                operational safety boundaries.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {briefing.commandExplanations.map((cmd, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedCommand(cmd)}
                  className="bg-[#14161D] border-2 border-zinc-800 p-4 space-y-2 shadow-[4px_4px_0px_0px_#000000] hover:border-[#BFFF2E] cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="bg-black text-[#BFFF2E] font-black text-xs px-2.5 py-0.5 border border-[#BFFF2E]/40">
                      {cmd.command}
                    </span>
                    <span className="text-[10px] font-black text-[#BFFF2E] uppercase">
                      CLICK FOR SYNTAX →
                    </span>
                  </div>
                  <p className="text-xs font-bold text-zinc-200">{cmd.purpose}</p>
                  <div className="bg-black/60 p-2.5 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-300">
                    SYNTAX: {cmd.syntax}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Command Explanation Modal */}
        {selectedCommand && (
          <CommandExplanationModal
            commandExp={selectedCommand}
            onClose={() => setSelectedCommand(null)}
          />
        )}

        {/* Footer */}
        <footer className="flex items-center justify-between border-t-2 border-zinc-800 pt-4 font-mono text-[10px] text-zinc-400 font-bold">
          <button
            type="button"
            onClick={onBackToSelection}
            className="hover:text-[#BFFF2E] uppercase tracking-wider transition-colors font-black flex items-center gap-1 cursor-pointer"
          >
            ← RETURN TO SCENARIO SELECTION
          </button>
          <span className="bg-black text-[#BFFF2E] px-2.5 py-0.5 border border-[#BFFF2E]/40 font-black">
            TWINSEC v1 // CLASSIFIED BRIEFING
          </span>
        </footer>
      </main>
    </div>
  );
};
