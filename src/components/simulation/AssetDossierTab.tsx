import React from "react";
import type { Node } from "@/data/scenarios";
import { Shield, Zap, ExternalLink, X, Cpu, Activity, Network } from "lucide-react";

export interface AssetDossierTabProps {
  node: Node;
  sector?: string;
  isCompromised?: boolean;
  isIsolated?: boolean;
  isShielded?: boolean;
  isPatched?: boolean;
  onOpenFullDossier: () => void;
  onEvaluateBlastRadius: () => void;
  onClose: () => void;
  className?: string;
}

export const AssetDossierTab: React.FC<AssetDossierTabProps> = React.memo(
  ({
    node,
    sector = "power",
    isCompromised = false,
    isIsolated = false,
    isShielded = false,
    isPatched = false,
    onOpenFullDossier,
    onEvaluateBlastRadius,
    onClose,
    className = "",
  }) => {
    // Infer vendor / protocol / IP based on sector and ring
    const vendor = node.vendor || (node.ring <= 1 ? "Siemens S7-1500" : "SEL / Cisco Rugged");
    const ip = `192.168.${node.ring * 10}.${Math.abs(node.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 250) + 2}`;
    const protocol =
      node.ring === 0
        ? "4-20mA / HARDWIRED"
        : node.ring === 1
          ? "MODBUS/TCP · IEC 61850"
          : node.ring === 2
            ? "DNP3 · PROFINET"
            : "ETHERNET/IP · OPC-UA";

    const statusLabel = isIsolated
      ? "AIR-GAPPED"
      : isPatched
        ? "FIRMWARE ATTESTED"
        : isCompromised
          ? "BREACHED / TAMPERED"
          : isShielded
            ? "AIR-GAP SHIELDED"
            : "NOMINAL";

    const statusBadgeClass = isIsolated
      ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
      : isPatched
        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
        : isCompromised
          ? "bg-danger/20 text-danger border-danger/40 animate-pulse"
          : isShielded
            ? "bg-sky-500/20 text-sky-400 border-sky-500/40"
            : "bg-accent/20 text-accent border-accent/40";

    return (
      <div
        className={`w-80 sm:w-96 max-w-[calc(100vw-2rem)] border-2 border-rule bg-card/95 backdrop-blur-md p-4 shadow-comic animate-in fade-in zoom-in-95 duration-150 select-none ${className}`}
        role="region"
        aria-label={`Asset dossier preview for ${node.label}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP HEADER: BADGE + CLOSE */}
        <div className="flex items-center justify-between border-b-2 border-rule pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="size-2 bg-accent inline-block" />
            <span className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              ASSET DOSSIER · L{node.ring}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center size-6 border border-rule hover:border-accent hover:text-accent font-mono text-xs transition-colors cursor-pointer"
            aria-label="Close dossier preview"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* ASSET TITLE & STATUS */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-2xl tracking-tight text-foreground truncate">
              {node.label}
            </h3>
            <span
              className={`font-mono text-[10px] font-bold px-2 py-0.5 border uppercase tracking-wider shrink-0 ${statusBadgeClass}`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="font-mono text-xs text-foreground/60 uppercase tracking-wider truncate">
            {node.kind} · SECTOR {sector.toUpperCase()}
          </p>
        </div>

        {/* METRICS & SPECS GRID */}
        <div className="grid grid-cols-2 gap-2 font-mono text-[11px] mb-3.5">
          <div className="border border-rule bg-background/50 p-2 space-y-0.5">
            <div className="text-muted-foreground text-[10px] uppercase flex items-center gap-1">
              <Cpu className="size-3 text-accent" />
              <span>HARDWARE / PLC</span>
            </div>
            <div className="font-bold text-foreground truncate" title={vendor}>
              {vendor}
            </div>
          </div>

          <div className="border border-rule bg-background/50 p-2 space-y-0.5">
            <div className="text-muted-foreground text-[10px] uppercase flex items-center gap-1">
              <Network className="size-3 text-cyan-400" />
              <span>OT BUS IP</span>
            </div>
            <div className="font-bold text-foreground truncate">{ip}</div>
          </div>

          <div className="col-span-2 border border-rule bg-background/50 p-2 space-y-0.5">
            <div className="text-muted-foreground text-[10px] uppercase flex items-center gap-1">
              <Activity className="size-3 text-warn" />
              <span>SUPERVISORY PROTOCOL</span>
            </div>
            <div className="font-bold text-foreground text-[10px] truncate">{protocol}</div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
          <button
            type="button"
            onClick={onEvaluateBlastRadius}
            className="flex items-center justify-center gap-1.5 border-2 border-rule bg-muted/60 hover:bg-muted text-foreground font-bold py-2 px-2.5 transition-colors cursor-pointer text-center text-[11px] active:translate-x-0.5 active:translate-y-0.5"
            title="Pre-flight air-gap blast radius simulation"
          >
            <Zap className="size-3.5 text-warn shrink-0" />
            <span className="truncate">BLAST RADIUS</span>
          </button>

          <button
            type="button"
            onClick={onOpenFullDossier}
            className="flex items-center justify-center gap-1.5 border-2 border-black bg-accent hover:bg-white text-black font-black py-2 px-2.5 shadow-comic transition-colors cursor-pointer text-center text-[11px] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            title="Open comprehensive asset dossier and SIGMA rules"
          >
            <span className="truncate">FULL DOSSIER</span>
            <ExternalLink className="size-3.5 shrink-0" />
          </button>
        </div>
      </div>
    );
  },
);

export default AssetDossierTab;
