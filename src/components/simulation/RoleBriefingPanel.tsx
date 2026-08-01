import React, { useEffect, useMemo, useState } from "react";
import type { SectorId } from "@/data/scenarios";
import { EXERCISES } from "@/data/scenarios";
import { generateRoleBriefing } from "@/lib/api/role-briefing.functions";
import type { OperationalRole, RoleBriefing } from "@/lib/briefing-types";
import { staticRoleBriefing } from "@/lib/static-briefings";
import { useOperatorSession } from "@/lib/auth-store";

interface RoleBriefingPanelProps {
  sector: SectorId;
  role: OperationalRole;
  scenarioCode?: string;
  threatActor?: string;
  trainingRunId?: string;
  isGuest?: boolean;
  onBeginPhase?: (nextPhase?: string) => void;
  onRoleChange?: (role: OperationalRole) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SOPH_BAR = (s: number): string => "█".repeat(Math.min(5, s)) + "░".repeat(Math.max(0, 5 - s));

const PRIORITY_BADGE: Record<string, string> = {
  PRIMARY: "bg-red-500/15 text-red-400 border-red-500/40",
  SECONDARY: "bg-amber-500/15 text-amber-400 border-amber-500/40",
  OPPORTUNISTIC: "bg-foreground/10 text-foreground/70 border-foreground/30",
};

export const RoleBriefingPanel: React.FC<RoleBriefingPanelProps> = ({
  sector,
  role,
  onBeginPhase,
  onRoleChange,
  collapsed = false,
  onToggleCollapse,
}) => {
  const { session } = useOperatorSession();
  const [briefing, setBriefing] = useState<RoleBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ex = EXERCISES[sector];

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await generateRoleBriefing({
          data: {
            sector,
            role,
            scenarioCode: ex.code,
            threatActor: ex.adversary,
          },
        });
        if (!cancelled) setBriefing(res.briefing);
      } catch {
        if (!cancelled) {
          setBriefing(staticRoleBriefing(sector, role));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [sector, role, ex.code, ex.adversary]);

  const roleColor = useMemo(() => (role === "RED" ? "red" : "blue"), [role]);

  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className={`w-full border border-rule bg-card/90 px-4 py-3 flex items-center justify-between hover:border-${roleColor}-500/60 transition-colors font-mono text-[11px]`}
      >
        <span className={`font-bold tracking-wider uppercase text-${roleColor}-500`}>
          {role} CELL · {sector.toUpperCase()} · {ex.code} BRIEFING
        </span>
        <span className="text-foreground/60">▸</span>
      </button>
    );
  }

  return (
    <aside className="w-full border border-rule bg-card/95 shadow-2xl font-mono text-xs text-foreground/90">
      {/* Header strip */}
      <div
        className={`bg-${roleColor}-500/10 border-b border-${roleColor}-500/30 px-4 py-3 flex items-center justify-between`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`text-[10px] px-2 py-0.5 border uppercase tracking-widest font-bold text-${roleColor}-500 border-${roleColor}-500/40`}
          >
            {role} CELL
          </span>
          <div>
            <div className="font-bold text-sm tracking-wide text-foreground">
              {ex.code.toUpperCase()} · BRIEFING DOCKET
            </div>
            <div className="text-[10px] text-foreground/50">
              {ex.site.toUpperCase()} · GENERATED: {briefing?.generatedAt ?? "—"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onRoleChange && (
            <div className="flex border border-rule text-[10px]">
              <button
                className={`px-2 py-1 ${role === "RED" ? "bg-red-500 text-white" : "hover:bg-red-500/10 hover:text-red-500"}`}
                onClick={() => onRoleChange("RED")}
              >
                RED
              </button>
              <button
                className={`px-2 py-1 ${role === "BLUE" ? "bg-blue-500 text-white" : "hover:bg-blue-500/10 hover:text-blue-500"}`}
                onClick={() => onRoleChange("BLUE")}
              >
                BLUE
              </button>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="text-foreground/50 hover:text-foreground px-2"
            aria-label="Collapse briefing"
          >
            ▾
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-5">
        {loading && (
          <div className="py-10 text-center text-foreground/50 space-y-3">
            <div className="animate-pulse text-[10px] tracking-widest uppercase">
              ▌ COMPILING OPERATIONS DOSSIER...
            </div>
            <div className="h-2 bg-foreground/5 overflow-hidden">
              <div className="h-full bg-accent/70 w-2/3 animate-[pulse_1.4s_ease-in-out_infinite]" />
            </div>
            <div className="text-[10px] text-foreground/40">
              Context: MITRE ATT&CK · ICS-ATT&CK · {sector.toUpperCase()} sector topology · physics
              timeline
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="border border-red-500/40 bg-red-500/5 p-3 text-red-400 text-[11px]">
            [ERR] Briefing service — {error}
          </div>
        )}

        {!loading && !error && briefing && (
          <>
            {/* Threat actor card */}
            <section className="border border-foreground/10 bg-black/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-foreground/50 tracking-widest uppercase">
                  ⚫ THREAT ACTOR PROFILE
                </div>
                <div className="text-[10px] text-foreground/60 font-bold">
                  SOPH {SOPH_BAR(briefing.threatActor.sophistication)} · {briefing.threatActor.type}
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <div className={`display text-2xl text-${roleColor}-400 tracking-wider`}>
                  {briefing.threatActor.handle}
                </div>
                <div className="text-[10px] text-foreground/50">
                  {briefing.threatActor.sectorAffinity}
                </div>
              </div>
              <p className="text-[11px] text-foreground/80 italic leading-relaxed">
                “{briefing.threatActor.typicalMotive}”
              </p>
              <ul className="pt-2 border-t border-foreground/10 space-y-1 text-[10px] text-foreground/70">
                {briefing.threatActor.historicalTTPs.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className={`text-${roleColor}-500`}>•</span>
                    {t}
                  </li>
                ))}
              </ul>
            </section>

            {/* Objectives */}
            <section className="space-y-2">
              <div className="text-[10px] text-foreground/50 tracking-widest uppercase">
                🎯 PRIMARY OBJECTIVES
              </div>
              <div className="space-y-2">
                {briefing.objectives.map((o) => (
                  <div key={o.id} className="border-l-2 border-foreground/30 pl-3 py-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 border uppercase font-bold ${PRIORITY_BADGE[o.priority]}`}
                      >
                        {o.priority}
                      </span>
                      <span className="text-[10px] text-foreground/50">{o.mitreTactic}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-foreground/90">
                      {o.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* TTPs */}
            <section className="space-y-2">
              <div className="text-[10px] text-foreground/50 tracking-widest uppercase">
                ⛓ OBSERVED TTPS ({briefing.ttps.length} MAPPED)
              </div>
              <div className="border border-foreground/10 divide-y divide-foreground/10 max-h-48 overflow-y-auto">
                {briefing.ttps.map((t) => (
                  <div key={t.id} className="px-3 py-2 hover:bg-foreground/5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold text-${roleColor}-500`}>{t.id}</span>
                      <span className="text-[10px] text-foreground/60 uppercase">{t.tactic}</span>
                      <span className="ml-auto text-[9px] text-foreground/40">
                        on {t.observedIn.join(", ")}
                      </span>
                    </div>
                    <div className="text-[11px] mt-0.5">{t.title}</div>
                    <div className="text-[10px] text-foreground/60 mt-0.5">{t.sectorContext}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Impact */}
            <section className="border border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5">
              <div className="text-[10px] text-amber-500 tracking-widest uppercase font-bold">
                ⚠️ IMPACT ASSESSMENT · T+{briefing.impact.timeToImpactSec}s
              </div>
              <div className="text-[12px] font-bold text-amber-200">
                {briefing.impact.primaryImpact}
              </div>
              <div className="text-[10px] text-foreground/70">
                <span className="text-amber-500/80 font-bold">HUMAN:</span>{" "}
                {briefing.impact.humanFactor}
              </div>
              <div className="pt-1 flex flex-wrap gap-1">
                {briefing.impact.regulatory.map((r, i) => (
                  <span
                    key={i}
                    className="text-[9px] px-1.5 py-0.5 border border-foreground/20 text-foreground/70"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </section>

            {/* Role frame */}
            {(briefing.redFrame || briefing.blueFrame) && (
              <section
                className={`border-l-4 border-${roleColor}-500 bg-${roleColor}-500/5 p-3 text-[11px] text-foreground/90 italic leading-relaxed`}
              >
                <span
                  className={`text-[9px] uppercase tracking-widest font-bold text-${roleColor}-500 mr-2`}
                >
                  👁 YOUR ASSIGNMENT:
                </span>
                {briefing.redFrame ?? briefing.blueFrame}
              </section>
            )}

            {/* Prerequisites */}
            <section className="space-y-2">
              <div className="text-[10px] text-foreground/50 tracking-widest uppercase">
                📋 PRE-EXECUTION CHECKLIST
              </div>
              <ol className="space-y-1.5">
                {briefing.prerequisites.map((p, i) => (
                  <li key={i} className="flex gap-2 text-[11px]">
                    <span className={`text-${roleColor}-500 font-bold w-5 text-right`}>
                      {i + 1}.
                    </span>
                    <span className="flex-1">{p}</span>
                  </li>
                ))}
              </ol>
            </section>

            {!session.loggedIn && (
              <div className="text-[9px] text-foreground/50 italic border-t border-foreground/10 pt-2">
                GUEST MODE: All debriefs watermarked. Sign in to persist runs to the training
                ledger.
              </div>
            )}

            {onBeginPhase && (
              <button
                onClick={() => onBeginPhase()}
                className={`w-full bg-${roleColor}-500 text-white py-3 text-[11px] uppercase tracking-widest font-bold hover:bg-${roleColor}-400 transition-colors`}
              >
                ► BEGIN PHASE 1
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  );
};

export default RoleBriefingPanel;
