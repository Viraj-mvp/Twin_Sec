/**
 * ExplainableAIPanel.tsx
 *
 * Explainable AI Narrator Component for TwinSec Cyber Range.
 * Renders automated natural-language event reasoning, answers "Why" questions,
 * and highlights step-by-step causal chains across Purdue Model layers.
 */

import React, { useState, useEffect } from "react";
import { SimEventRecord } from "../../lib/simulation/event-store";
import { explainIncidentAnomaly } from "../../lib/api/adaptive-engine.functions";

interface ExplainableAIPanelProps {
  sector: string;
  activeEvent: SimEventRecord | null;
}

export function ExplainableAIPanel({ sector, activeEvent }: ExplainableAIPanelProps) {
  const [explanation, setExplanation] = useState<{
    summary: string;
    rootCauseNodeId: string;
    causalChainSteps: string[];
    recommendedAction: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeEvent) return;

    let mounted = true;
    setLoading(true);

    explainIncidentAnomaly({
      data: {
        sector,
        targetAssetId: activeEvent.sourceAssetId,
        eventTitle: activeEvent.title,
        eventDesc: activeEvent.description,
      },
    })
      .then((res) => {
        if (
          mounted &&
          res &&
          typeof res === "object" &&
          "success" in res &&
          res.success &&
          "explanation" in res
        ) {
          setExplanation(res.explanation as typeof explanation);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [sector, activeEvent]);

  return (
    <div className="w-full border border-rule/60 bg-black/60 font-mono rounded-none p-4 space-y-3 shadow-xl">
      <div className="flex items-center justify-between border-b border-rule/50 pb-2">
        <span className="mono-label text-[10px] text-accent font-bold tracking-widest uppercase flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-accent animate-pulse" />
          EXPLAINABLE AI NARRATOR // INCIDENT DIAGNOSTICS
        </span>
        <span className="text-[9px] text-foreground/40 font-bold">
          {loading ? "ANALYZING..." : "CAUSAL VERIFIED"}
        </span>
      </div>

      {!activeEvent && (
        <p className="text-xs text-foreground/50 italic py-2">
          Select an active incident event or node on the timeline to generate AI causal diagnosis.
        </p>
      )}

      {activeEvent && explanation && (
        <div className="space-y-3 text-xs">
          <div className="bg-black/50 p-3 border border-rule/40 space-y-1.5">
            <span className="text-[9px] text-accent uppercase font-bold tracking-wider">
              INCIDENT SUMMARY
            </span>
            <p className="text-foreground/90 font-serif italic text-sm leading-snug">
              &ldquo;{explanation.summary}&rdquo;
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="text-[9px] text-foreground/50 uppercase font-bold tracking-wider">
              CAUSAL PROPAGATION CHAIN
            </span>
            <div className="space-y-1 text-[10.5px]">
              {explanation.causalChainSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-black/40 border border-rule/30 px-2.5 py-1 text-foreground/80 flex items-center gap-2"
                >
                  <span className="text-accent font-bold">0{idx + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-accent/10 border border-accent/30 p-2.5 text-[10px] text-accent">
            <strong>RECOMMENDED DEFENSE:</strong> {explanation.recommendedAction}
          </div>
        </div>
      )}
    </div>
  );
}
