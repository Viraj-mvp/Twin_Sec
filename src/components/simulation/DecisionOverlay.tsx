import React from "react";
import type { Decision, ChoiceId } from "@/data/scenarios";
import { fmt } from "@/data/scenarios";

interface DecisionOverlayProps {
  decision: Decision;
  onChoose: (id: ChoiceId) => void;
  onDismiss: () => void;
}

export const DecisionOverlay: React.FC<DecisionOverlayProps> = ({
  decision,
  onChoose,
  onDismiss,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-ink/80 backdrop-blur-sm p-0 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-3xl bg-paper text-ink border border-ink shadow-2xl flex flex-col max-h-screen sm:max-h-[90vh] overflow-auto">
        <div className="border-b border-ink/20 p-5 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="mono-label text-ink/60!">OPERATOR DECISION · T+{fmt(decision.t)}</p>
            <button
              onClick={onDismiss}
              className="mono-label text-ink/60! hover:text-ink! cursor-pointer"
              aria-label="Dismiss"
            >
              SKIP ✕
            </button>
          </div>
          <p className="font-serif text-2xl sm:text-4xl italic mt-3 leading-[1.05]">
            {decision.question}
          </p>
          <p className="font-mono text-xs sm:text-sm text-ink/70 mt-4 leading-relaxed">
            {decision.trigger.toUpperCase()} · {decision.context}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3">
          {decision.options.map((o) => (
            <button
              key={o.id}
              onClick={() => onChoose(o.id)}
              className="text-left p-5 sm:p-6 border-t sm:border-t-0 sm:border-l first:sm:border-l-0 border-ink/20 hover:bg-ink hover:text-paper transition-colors group cursor-pointer"
            >
              <p className="mono-label">{o.id}</p>
              <p className="display text-2xl sm:text-3xl mt-2 leading-none">{o.label}</p>
              <p className="font-serif text-sm sm:text-base italic mt-4 leading-snug opacity-80 group-hover:opacity-100">
                → {o.consequence}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
