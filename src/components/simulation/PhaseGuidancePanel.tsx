import React, { useEffect, useMemo, useState } from "react";
import type { SectorId } from "@/data/scenarios";
import { generatePhaseGuidance } from "@/lib/api/role-briefing.functions";
import type {
  GuidancePhase,
  OperationalRole,
  PhaseGuidance,
  RedPhase,
  BluePhase,
} from "@/lib/briefing-types";
import {
  GUIDANCE_PHASES_RED as RED_PHASES,
  GUIDANCE_PHASES_BLUE as BLUE_PHASES,
} from "@/lib/briefing-types";

interface PhaseGuidancePanelProps {
  sector: SectorId;
  role: OperationalRole;
  currentPhase: GuidancePhase;
  eventTagsSeen?: string[];
  lastDecisionId?: string;
  onAdvancePhase?: (next: GuidancePhase) => void;
  onRunCommand?: (cmd: string) => void;
}

const PHASE_TITLE_RED: Record<RedPhase, string> = {
  RECON: "PHASE 01 · RECONNAISSANCE",
  WEAPON: "PHASE 02 · WEAPONIZATION",
  DELIVER: "PHASE 03 · DELIVERY",
  EXPLOIT: "PHASE 04 · EXPLOITATION",
  INSTALL: "PHASE 05 · INSTALLATION",
  C2: "PHASE 06 · COMMAND & CONTROL",
  AOO: "PHASE 07 · ACTIONS ON OBJECTIVES",
};

const PHASE_TITLE_BLUE: Record<BluePhase, string> = {
  PREPARATION: "PHASE 01 · PREPARATION",
  IDENTIFICATION: "PHASE 02 · IDENTIFICATION",
  CONTAINMENT: "PHASE 03 · CONTAINMENT",
  ERADICATION: "PHASE 04 · ERADICATION",
  RECOVERY: "PHASE 05 · RECOVERY",
  POST_INCIDENT: "PHASE 06 · POST-INCIDENT ACTIVITY",
};

export const PhaseGuidancePanel: React.FC<PhaseGuidancePanelProps> = ({
  sector,
  role,
  currentPhase,
  eventTagsSeen = [],
  lastDecisionId,
  onAdvancePhase,
  onRunCommand,
}) => {
  const [guidance, setGuidance] = useState<PhaseGuidance | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"purpose" | "activities" | "decisions" | "toolbox" | "check">(
    "purpose",
  );

  const phases = useMemo(() => (role === "RED" ? RED_PHASES : BLUE_PHASES), [role]);
  const phaseIndex = phases.indexOf(currentPhase as never);
  const title =
    role === "RED"
      ? (PHASE_TITLE_RED[currentPhase as RedPhase] ?? "PHASE")
      : (PHASE_TITLE_BLUE[currentPhase as BluePhase] ?? "PHASE");
  const roleColor = role === "RED" ? "red" : "blue";

  const eventTagsKey = eventTagsSeen.join(",");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const res = await generatePhaseGuidance({
          data: {
            sector,
            role,
            phase: currentPhase,
            eventTagsSeen,
            lastDecisionId,
          },
        });
        if (!cancelled) setGuidance(res.guidance);
      } catch {
        if (!cancelled) setGuidance(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [sector, role, currentPhase, eventTagsSeen, eventTagsKey, lastDecisionId]);

  const nextPhase =
    phaseIndex >= 0 && phaseIndex < phases.length - 1
      ? (phases[phaseIndex + 1] as GuidancePhase)
      : null;

  return (
    <aside className="w-full border border-rule bg-card/95 font-mono text-xs text-foreground/90">
      {/* Phase indicator header */}
      <div
        className={`bg-${roleColor}-500/10 border-b border-${roleColor}-500/30 px-3 py-2 space-y-2`}
      >
        <div className="flex items-center justify-between">
          <div className={`text-[10px] uppercase tracking-widest font-bold text-${roleColor}-500`}>
            {role} CELL · LIFECYCLE
          </div>
          <div className="text-[10px] text-foreground/50">
            {phaseIndex + 1} / {phases.length}
          </div>
        </div>
        <div className="h-1 bg-foreground/10 flex">
          {phases.map((_, i) => (
            <div
              key={i}
              className={`h-full flex-1 border-r border-black/20 last:border-0 ${
                i < phaseIndex
                  ? `bg-${roleColor}-500`
                  : i === phaseIndex
                    ? `bg-${roleColor}-400 animate-pulse`
                    : "bg-transparent"
              }`}
            />
          ))}
        </div>
        <div className="font-bold tracking-wide text-[12px]">{title}</div>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-rule text-[10px]">
        {(
          [
            ["purpose", "PURPOSE"],
            ["activities", "ACTIVITIES"],
            ["decisions", "DECISIONS"],
            ["toolbox", "TOOLBOX"],
            ["check", "QUIZ"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 py-2 transition-colors border-r border-rule last:border-0 ${
              tab === k
                ? `bg-${roleColor}-500/10 text-${roleColor}-400 border-b-2 border-b-${roleColor}-500`
                : "text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-3 space-y-3 min-h-[220px]">
        {loading && (
          <div className="py-6 text-center text-[10px] text-foreground/50 animate-pulse">
            ▌ SYNTHESIZING PHASE PLAYBOOK...
          </div>
        )}

        {!loading && !guidance && (
          <div className="text-[11px] text-foreground/60 py-6">
            Offline phase guidance unavailable. Open the briefing panel for current sector context.
          </div>
        )}

        {!loading && guidance && tab === "purpose" && (
          <section className="space-y-2">
            <div className="text-[10px] text-foreground/50 uppercase tracking-widest">Purpose</div>
            <p className="text-[11.5px] leading-relaxed text-foreground/90 whitespace-pre-line">
              {guidance.purpose}
            </p>
            <div className="pt-2 mt-2 border-t border-rule space-y-1.5">
              <div className="flex gap-2 text-[10.5px]">
                <span className="text-foreground/50 w-24 shrink-0">PROGRESS:</span>
                <span>{guidance.progressHint}</span>
              </div>
              <div className="flex gap-2 text-[10.5px]">
                <span className="text-foreground/50 w-24 shrink-0">NEXT TRIGGER:</span>
                <span className={`text-${roleColor}-400`}>{guidance.nextPhaseTrigger}</span>
              </div>
            </div>
          </section>
        )}

        {!loading && guidance && tab === "activities" && (
          <section className="space-y-1.5">
            <div className="text-[10px] text-foreground/50 uppercase tracking-widest mb-2">
              Common Activities
            </div>
            <ol className="space-y-1.5">
              {guidance.commonActivities.map((a, i) => (
                <li key={i} className="flex gap-2 text-[11px]">
                  <span className={`text-${roleColor}-500 font-bold w-5 shrink-0`}>{i + 1}.</span>
                  <span className="flex-1 leading-snug">{a}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {!loading && guidance && tab === "decisions" && (
          <section className="space-y-3">
            <div className="text-[10px] text-foreground/50 uppercase tracking-widest">
              Required Decisions ({guidance.requiredDecisions.length})
            </div>
            {guidance.requiredDecisions.length === 0 && (
              <div className="text-[10.5px] italic text-foreground/50 py-3">
                No decisions active this phase — observe the timeline and prepare.
              </div>
            )}
            {guidance.requiredDecisions.map((d, i) => (
              <div
                key={i}
                className={`border border-${roleColor}-500/20 bg-${roleColor}-500/5 p-2.5 space-y-1.5`}
              >
                <div className="text-[10px] text-foreground/60 uppercase tracking-wide">
                  ▶ trigger: {d.triggerId}
                </div>
                <div className="text-[11.5px] font-bold leading-relaxed">{d.questionPreview}</div>
                {(role === "RED" ? d.redPitfall : d.bluePitfall) && (
                  <div className="text-[10.5px] text-amber-400/90 bg-black/30 p-1.5 border-l-2 border-amber-500/70 leading-snug">
                    <span className="font-bold mr-1">⚠ PITFALL:</span>
                    {role === "RED" ? d.redPitfall : d.bluePitfall}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {!loading && guidance && tab === "toolbox" && (
          <section className="space-y-2">
            <div className="text-[10px] text-foreground/50 uppercase tracking-widest">Toolbox</div>
            {guidance.toolbox.length === 0 && (
              <div className="text-[10.5px] italic text-foreground/50 py-3">
                No tools available yet — advance the phase.
              </div>
            )}
            <div className="space-y-2">
              {guidance.toolbox.map((t, i) => (
                <div
                  key={i}
                  className="border border-foreground/15 p-2 space-y-1.5 hover:bg-foreground/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold">{t.name}</div>
                    <div className="text-[9px] text-foreground/50">
                      {t.applicableNodes.join(" / ")}
                    </div>
                  </div>
                  <div className="text-[10.5px] text-foreground/75 leading-snug">{t.usedFor}</div>
                  {t.terminalCommand && onRunCommand && (
                    <button
                      onClick={() => onRunCommand(t.terminalCommand ?? "")}
                      className="mt-1 w-full text-left text-[10px] bg-black/50 text-accent border border-accent/40 px-2 py-1.5 hover:bg-accent/10 whitespace-pre-wrap font-mono"
                    >
                      {t.terminalCommand}
                    </button>
                  )}
                  {t.terminalCommand && !onRunCommand && (
                    <pre className="mt-1 text-[10px] bg-black/50 text-accent border border-accent/30 p-1.5 whitespace-pre-wrap">
                      {t.terminalCommand}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && guidance && tab === "check" && (
          <section className="space-y-2">
            <div className="text-[10px] text-foreground/50 uppercase tracking-widest">
              Check Your Understanding
            </div>
            <ol className="space-y-2">
              {guidance.checkYourUnderstanding.map((q, i) => (
                <li
                  key={i}
                  className="border-l-2 border-foreground/30 pl-3 py-1 text-[11.5px] text-foreground/90 leading-relaxed"
                >
                  <span className="text-foreground/50 font-bold mr-1">Q{i + 1}:</span>
                  {q}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      {/* Footer: advance */}
      {nextPhase && onAdvancePhase && (
        <div className="border-t border-rule px-3 py-2 flex items-center justify-between">
          <div className="text-[10px] text-foreground/50">
            NEXT: <span className={`text-${roleColor}-400 font-bold`}>{nextPhase}</span>
          </div>
          <button
            onClick={() => onAdvancePhase(nextPhase)}
            className={`text-[10px] px-2.5 py-1 bg-${roleColor}-500/10 border border-${roleColor}-500/40 text-${roleColor}-400 hover:bg-${roleColor}-500 hover:text-white transition-colors font-bold uppercase tracking-wider`}
          >
            MANUAL ADVANCE ▸
          </button>
        </div>
      )}
    </aside>
  );
};

export default PhaseGuidancePanel;

export type { GuidancePhase, OperationalRole, RedPhase, BluePhase };

export { RED_PHASES, BLUE_PHASES };
