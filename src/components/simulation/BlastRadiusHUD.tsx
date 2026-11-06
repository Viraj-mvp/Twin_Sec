import React from "react";
import type { BlastRadiusResult } from "@/lib/simulation/blast-radius";
import type { Node } from "@/data/scenarios";
import { ShieldAlert, ShieldCheck, AlertTriangle, X, Zap } from "lucide-react";

interface BlastRadiusHUDProps {
  result: BlastRadiusResult | null;
  nodes: readonly Node[] | Node[];
  onConfirmAirGap: (nodeId: string) => void;
  onDismiss: () => void;
}

export const BlastRadiusHUD: React.FC<BlastRadiusHUDProps> = React.memo(
  ({ result, nodes, onConfirmAirGap, onDismiss }) => {
    if (!result) return null;

    const byId = (id: string) => nodes.find((n) => n.id === id);

    const { targetNodeId, targetNodeLabel, blindedNodeIds, protectedNodeIds, metrics } = result;

    const blindedLabels = blindedNodeIds.map((id) => byId(id)?.label || id.toUpperCase());
    const protectedLabels = protectedNodeIds.map((id) => byId(id)?.label || id.toUpperCase());

    return (
      <div
        className="w-full border-2 border-rule bg-card p-4 shadow-comic space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-150"
        role="region"
        aria-label={`Air-gap blast radius evaluation for ${targetNodeLabel}`}
      >
        {/* TOP STATUS HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-rule pb-3">
          <div className="flex items-center gap-3">
            <span className="relative flex size-3 items-center justify-center shrink-0">
              <span className="absolute inline-flex size-full animate-ping bg-warn opacity-75" />
              <span className="relative inline-flex size-2 bg-warn" />
            </span>
            <span className="font-mono text-xs font-black uppercase tracking-wider text-warn">
              [SIMULATION: PRE-FLIGHT AIR-GAP BLAST RADIUS]
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
              TARGET:{" "}
              <span className="text-foreground bg-muted px-2 py-0.5 border border-rule">
                {targetNodeLabel} ({targetNodeId})
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="flex items-center gap-1 border-2 border-rule bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground font-mono text-xs uppercase px-2.5 py-1 min-h-[32px] transition-colors"
            title="Dismiss preview"
          >
            <X className="size-3.5" />
            <span>ESC / CANCEL</span>
          </button>
        </div>

        {/* METRICS SPLIT BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
          {/* 1. Telemetry Loss */}
          <div className="border-2 border-rule bg-background p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="uppercase tracking-wider flex items-center gap-1.5 text-warn font-bold">
                <AlertTriangle className="size-3.5" />
                TELEMETRY BLINDNESS
              </span>
              <span className="text-[11px] font-bold">{metrics.blindnessPercentage}%</span>
            </div>
            <div className="text-lg font-black text-foreground">
              {metrics.blindedCount} / {metrics.totalAssets} ASSETS
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1">
              Process sensors disconnected from supervisory core
            </p>
          </div>

          {/* 2. Containment Score */}
          <div className="border-2 border-rule bg-background p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="uppercase tracking-wider flex items-center gap-1.5 text-accent font-bold">
                <ShieldCheck className="size-3.5" />
                CONTAINMENT DELTA
              </span>
              <span className="text-[11px] font-bold">+{metrics.containmentScoreDelta}%</span>
            </div>
            <div className="text-lg font-black text-accent">
              {metrics.containmentScoreDelta > 0 ? "SEVERANCE EFFECTIVE" : "BASELINE STEADY"}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1">
              Lateral infection path blocked from threat foothold
            </p>
          </div>

          {/* 3. Safety Barrier State */}
          <div className="border-2 border-rule bg-background p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="uppercase tracking-wider flex items-center gap-1.5 text-cyan-400 font-bold">
                <ShieldAlert className="size-3.5" />
                SAFETY BARRIER
              </span>
              <span className="text-[11px] font-bold">L0/L1 ENCLAVE</span>
            </div>
            <div className="text-lg font-black text-foreground">
              {metrics.safetySystemsIntact ? "NOMINAL / INTACT" : "EXPOSURE RISK"}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1">
              Emergency trip loops & fire systems status
            </p>
          </div>
        </div>

        {/* PARTITIONS LEDGER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          {/* Blinded Zone */}
          <div className="border border-rule p-2.5 bg-background/50 space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-warn flex items-center gap-1.5">
              <span>⚠ COLLATERAL BLINDED ASSETS ({blindedLabels.length}):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {blindedLabels.length > 0 ? (
                blindedLabels.map((lbl, idx) => (
                  <span
                    key={idx}
                    className="border border-warn/60 bg-warn/10 text-warn px-2 py-0.5 text-[11px] font-bold"
                  >
                    {lbl}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground text-[11px] italic">
                  Zero assets blinded. Alternate redundant telemetry paths intact.
                </span>
              )}
            </div>
          </div>

          {/* Containment Shield */}
          <div className="border border-rule p-2.5 bg-background/50 space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
              <span>✓ SHIELDED ASSETS ({protectedLabels.length}):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {protectedLabels.length > 0 ? (
                protectedLabels.map((lbl, idx) => (
                  <span
                    key={idx}
                    className="border border-accent/60 bg-accent/10 text-accent px-2 py-0.5 text-[11px] font-bold"
                  >
                    {lbl}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground text-[11px] italic">
                  No uncompromised assets directly on this threat link.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ACTION TRIGGER FOOTER */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="text-[11px] font-mono text-muted-foreground uppercase">
            [TIP]: Air-gapping severs all physical traffic. Supervisory controls will flatline for
            blinded nodes.
          </div>

          <button
            type="button"
            onClick={() => onConfirmAirGap(targetNodeId)}
            className="flex items-center gap-2 border-2 border-black bg-accent hover:bg-accent/90 text-black font-mono font-black text-xs uppercase tracking-wider px-4 py-2.5 shadow-comic min-h-[44px] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <Zap className="size-4" />
            <span>EXECUTE AIR-GAP: isolate {targetNodeLabel}</span>
          </button>
        </div>
      </div>
    );
  },
);
