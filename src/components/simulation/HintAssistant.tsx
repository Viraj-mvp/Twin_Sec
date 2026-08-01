import React, { useCallback, useEffect, useRef, useState } from "react";
import type { SectorId } from "@/data/scenarios";
import { generateContextHint } from "@/lib/api/role-briefing.functions";
import type { GuidancePhase, OperationalRole } from "@/lib/briefing-types";

export interface HintAssistantPopoverEvent {
  kind: "popover";
  nodeId: string;
  title?: string;
  hintText: string;
}

interface HintAssistantProps {
  sector: SectorId;
  role: OperationalRole;
  phase: GuidancePhase;
  trainingRunId?: string;
  currentHintLevel?: number;
  lastHintHash?: string;
  stuckNodeId?: string;
  lastDecisionTrigger?: string;
  lastTerminalCommand?: string;
  stuckTimerSeconds?: number;
  onPopover?: (ev: HintAssistantPopoverEvent | null) => void;
  onHintLevelChange?: (next: number) => void;
  autoTrigger?: "stuck-timer" | "dead-end" | "manual";
}

const LEVEL_LABEL: Record<number, string> = {
  0: "LEVEL 0 · DIAGNOSTIC QUESTIONS",
  1: "LEVEL 1 · CONTEXTUAL HINT",
  2: "LEVEL 2 · TARGETED SUGGESTION",
  3: "LEVEL 3 · FULL WALKTHROUGH",
};

const LEVEL_COLOR: Record<number, string> = {
  0: "green",
  1: "amber",
  2: "orange",
  3: "red",
};

export const HintAssistant: React.FC<HintAssistantProps> = ({
  sector,
  role,
  phase,
  trainingRunId,
  currentHintLevel = 0,
  lastHintHash,
  stuckNodeId,
  lastDecisionTrigger,
  lastTerminalCommand,
  stuckTimerSeconds = 90,
  onPopover,
  onHintLevelChange,
  autoTrigger,
}) => {
  const [level, setLevel] = useState(currentHintLevel);
  const [hash, setHash] = useState(lastHintHash ?? "");
  const [loading, setLoading] = useState(false);
  const [hintText, setHintText] = useState<string>("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [lastDelivery, setLastDelivery] = useState<"terminal" | "popover" | "diagnostic">(
    "terminal",
  );
  const autoTriggeredRef = useRef(false);
  const stuckAccum = useRef(0);

  useEffect(() => {
    setLevel(currentHintLevel);
  }, [currentHintLevel]);
  useEffect(() => {
    if (lastHintHash) setHash(lastHintHash);
  }, [lastHintHash]);

  // ── Stuck-timer auto-trigger ────────────────────────────────────
  useEffect(() => {
    stuckAccum.current = 0;
    autoTriggeredRef.current = false;
  }, [phase, lastDecisionTrigger]);

  useEffect(() => {
    if (autoTrigger !== "stuck-timer") return;
    const id = window.setInterval(() => {
      stuckAccum.current += 1;
      if (stuckAccum.current >= stuckTimerSeconds && !autoTriggeredRef.current && level === 0) {
        autoTriggeredRef.current = true;
        void requestHint(true);
      }
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTrigger, level, stuckTimerSeconds, phase, lastDecisionTrigger]);

  const resetTimer = () => {
    stuckAccum.current = 0;
    autoTriggeredRef.current = false;
  };

  const requestHint = useCallback(
    async (auto = false) => {
      if (loading) return;
      if (level >= 3 && !auto) return;
      setLoading(true);
      try {
        const res = await generateContextHint({
          data: {
            sector,
            role,
            phase,
            currentHintLevel: level,
            stuckNodeId,
            lastDecisionTrigger,
            lastTerminalCommand,
            lastHintHash: hash,
            trainingRunId,
          },
        });
        setLevel(res.nextHintLevel);
        setHash(res.hintHash);
        onHintLevelChange?.(res.nextHintLevel);
        setLastDelivery(res.delivery);
        setHintText(res.hintText ?? "");
        setQuestions(res.diagnosticQuestions ?? []);
        if (res.delivery === "popover" && res.popoverNodeId && onPopover) {
          onPopover({
            kind: "popover",
            nodeId: res.popoverNodeId,
            title: `LEVEL ${res.nextHintLevel} HINT`,
            hintText: res.hintText ?? "",
          });
        }
      } catch {
        setHintText("[Hint engine unavailable. Review the phase guidance above.]");
      } finally {
        setLoading(false);
      }
    },
    [
      loading,
      level,
      hash,
      sector,
      role,
      phase,
      stuckNodeId,
      lastDecisionTrigger,
      lastTerminalCommand,
      trainingRunId,
      onHintLevelChange,
      onPopover,
    ],
  );

  const color = LEVEL_COLOR[level] ?? "foreground";

  return (
    <div className="w-full border border-rule bg-black/90 font-mono text-xs text-foreground/90">
      {/* Header */}
      <div
        className={`bg-${color}-500/10 border-b border-${color}-500/30 px-3 py-2 flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold tracking-widest uppercase text-${color}-500`}>
            ▌ HINT ASSISTANT
          </span>
          <span className="text-[9px] text-foreground/50">[{LEVEL_LABEL[level]}]</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              resetTimer();
              onPopover?.(null);
              void requestHint(false);
            }}
            disabled={loading || level >= 3}
            className="text-[10px] px-2 py-0.5 bg-accent/10 border border-accent/40 text-accent hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-30 font-bold uppercase tracking-wider"
          >
            {loading ? "▌" : level >= 3 ? "WALKTHROUGH UNLOCKED" : `REQUEST LEVEL ${level + 1}`}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2 min-h-[120px]">
        {!hintText && questions.length === 0 && !loading && (
          <div className="text-[10.5px] text-foreground/50 italic py-4 space-y-1">
            <div>Need help? Assistance is progressive — four levels deep:</div>
            <div className="pl-3 space-y-0.5 text-[10px]">
              <div>0. Socratic diagnostic questions · think aloud</div>
              <div>1. Contextual pointer to correct node / stream</div>
              <div>2. 2–3 concrete next-step bullets</div>
              <div>3. Full Detect→Contain→Remediate walkthrough</div>
            </div>
            <div className="pt-1">
              Type <span className="text-accent">/help</span> in the terminal or press above.
            </div>
          </div>
        )}

        {loading && (
          <div className="text-[10.5px] text-foreground/50 animate-pulse py-3 text-center">
            ▌ DIAGNOSING CONTEXT...
          </div>
        )}

        {lastDelivery === "diagnostic" && questions.length > 0 && (
          <div className="space-y-1.5">
            <div className={`text-[10px] uppercase tracking-widest text-${color}-500 font-bold`}>
              ⁇ DIAGNOSTIC QUESTIONS (LEVEL 0)
            </div>
            <ol className="space-y-1">
              {questions.map((q, i) => (
                <li
                  key={i}
                  className="flex gap-2 border-l-2 border-green-500/60 pl-3 py-1 text-[11.5px] leading-relaxed"
                >
                  <span className="text-green-500 font-bold shrink-0">Q{i + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {hintText && lastDelivery === "popover" && (
          <div className={`border border-${color}-500/40 bg-${color}-500/5 p-2.5 space-y-1`}>
            <div
              className={`text-[10px] uppercase tracking-widest text-${color}-400 font-bold flex items-center gap-2`}
            >
              ⚑ POPOVER HINT (LEVEL {level})
              {stuckNodeId && <span className="opacity-60">· targeted @{stuckNodeId}</span>}
            </div>
            <div className="text-[11.5px] leading-relaxed whitespace-pre-wrap">{hintText}</div>
          </div>
        )}

        {hintText && lastDelivery === "terminal" && (
          <div className={`border border-${color}-500/40 bg-${color}-500/5 p-2.5 space-y-1`}>
            <div className={`text-[10px] uppercase tracking-widest text-${color}-400 font-bold`}>
              {level === 3 ? "⚠ LEVEL 3 · FULL WALKTHROUGH" : `▌ TERMINAL OUTPUT (LEVEL ${level})`}
            </div>
            <pre className="text-[11.5px] leading-relaxed whitespace-pre-wrap font-mono">
              {hintText}
            </pre>
            {level === 3 && (
              <div
                className={`pt-1 text-[9.5px] text-red-400/90 italic border-t border-${color}-500/20 mt-1`}
              >
                ⚠ SOLUTION MODE — Retry this scenario without the walkthrough to build operational
                intuition. Guest debriefs are watermarked.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HintAssistant;
