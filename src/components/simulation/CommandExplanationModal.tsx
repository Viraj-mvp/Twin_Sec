/**
 * CommandExplanationModal.tsx
 *
 * Interactive side panel / modal that explains simulated CLI commands.
 * Educational reference detailing command purpose, syntax, output, attacker intent,
 * risk level, detection opportunities, and MITRE ATT&CK mapping.
 */

import React from "react";
import type { CommandExplanation } from "@/simulation/scenarios/types";

interface CommandExplanationModalProps {
  commandExp: CommandExplanation | null;
  onClose: () => void;
}

export const CommandExplanationModal: React.FC<CommandExplanationModalProps> = ({
  commandExp,
  onClose,
}) => {
  if (!commandExp) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-end bg-background/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl h-full bg-background border-l border-rule p-6 sm:p-8 overflow-y-auto flex flex-col gap-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-rule pb-4">
          <div>
            <p className="mono-label text-accent">COMMAND REFERENCE · EDUCATIONAL</p>
            <h3 className="display text-2xl sm:text-3xl mt-1">Command Analysis</h3>
          </div>
          <button
            onClick={onClose}
            className="mono-label px-3 py-1 border border-rule hover:bg-foreground hover:text-background transition-colors"
          >
            CLOSE [ESC]
          </button>
        </div>

        {/* Command Box */}
        <div className="bg-black/90 p-4 border border-accent/40 font-mono text-sm text-accent">
          <p className="text-xs text-foreground/50 mb-1">$ EXECUTED COMMAND</p>
          <p className="font-bold select-all break-all">{commandExp.command}</p>
        </div>

        {/* Risk Badge */}
        <div className="flex items-center gap-3">
          <span className="mono-label text-foreground/60">RISK LEVEL:</span>
          <span
            className={`mono-label px-3 py-1 text-xs border ${
              commandExp.riskLevel === "CRITICAL"
                ? "bg-red-950/60 text-red-400 border-red-500/50"
                : commandExp.riskLevel === "HIGH"
                  ? "bg-amber-950/60 text-amber-400 border-amber-500/50"
                  : "bg-sky-950/60 text-sky-400 border-sky-500/50"
            }`}
          >
            {commandExp.riskLevel}
          </span>
          <span className="mono-label text-foreground/60 ml-auto">
            MITRE: {commandExp.mitreTechnique}
          </span>
        </div>

        {/* Purpose */}
        <div className="border-b border-rule pb-4">
          <p className="mono-label text-foreground/60 mb-2">OPERATIONAL PURPOSE</p>
          <p className="font-serif text-base sm:text-lg text-foreground/90 leading-relaxed">
            {commandExp.purpose}
          </p>
        </div>

        {/* Syntax */}
        <div className="border-b border-rule pb-4">
          <p className="mono-label text-foreground/60 mb-2">SYNTAX SPECIFICATION</p>
          <div className="bg-muted/30 p-3 font-mono text-xs text-foreground/90 border border-rule">
            {commandExp.syntax}
          </div>
        </div>

        {/* Expected Output */}
        <div className="border-b border-rule pb-4">
          <p className="mono-label text-foreground/60 mb-2">EXPECTED TERMINAL OUTPUT</p>
          <div className="bg-black/80 p-3 font-mono text-xs text-emerald-400 border border-emerald-500/30 whitespace-pre-wrap">
            {commandExp.expectedOutput}
          </div>
        </div>

        {/* Attacker Intent */}
        <div className="border-b border-rule pb-4">
          <p className="mono-label text-accent mb-2">ATTACKER INTENT & RATIONALE</p>
          <p className="font-serif text-base italic text-foreground/80 leading-relaxed">
            "{commandExp.attackerIntent}"
          </p>
        </div>

        {/* Detection Opportunities */}
        <div>
          <p className="mono-label text-foreground/60 mb-2">DEFENSIVE DETECTION OPPORTUNITIES</p>
          <div className="bg-amber-950/20 p-4 border border-amber-500/40 font-mono text-xs text-amber-300">
            🛡️ {commandExp.detectionOpportunities}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-auto w-full bg-accent text-accent-foreground mono-label py-3 hover:bg-foreground hover:text-background transition-colors"
        >
          RETURN TO SIMULATION
        </button>
      </div>
    </div>
  );
};
