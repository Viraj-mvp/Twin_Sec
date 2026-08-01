import React from "react";
import { CVE_DATABASE, type CveRecord } from "@/data/cve-map";

interface CVEIntelPanelProps {
  nodeId: string | null;
  nodeLabel?: string;
  onClose?: () => void;
}

export const CVEIntelPanel: React.FC<CVEIntelPanelProps> = ({ nodeId, nodeLabel, onClose }) => {
  const record: CveRecord | undefined = nodeId ? CVE_DATABASE[nodeId] : undefined;

  if (!nodeId || !record) {
    return (
      <div className="p-4 border border-rule bg-card/40 font-mono text-xs text-muted-foreground space-y-2">
        <div className="flex items-center gap-2 text-accent">
          <span className="h-2 w-2 bg-accent rounded-full animate-pulse" />
          <span className="font-bold text-[10px] tracking-widest">
            // CVE INTELLIGENCE ADVISORY
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Select any vulnerable OT/ICS node on the topology to view real-world CISA advisories, CVSS
          3.1 vector scores, affected firmware versions, and security remediation steps.
        </p>
      </div>
    );
  }

  const sevClass =
    record.severity === "CRITICAL"
      ? "bg-danger text-black font-bold"
      : record.severity === "HIGH"
        ? "bg-warn text-black font-bold"
        : "bg-accent text-black font-bold";

  return (
    <div className="p-4 border-2 border-accent/70 bg-black/95 font-mono text-xs space-y-3 shadow-comic-accent rounded-lg relative">
      <div className="flex items-center justify-between border-b border-rule pb-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-danger rounded-full animate-pulse" />
          <span className="font-bold text-accent text-xs tracking-wider">
            CVE INTEL // {record.cveId}
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close CVE Panel"
            className="px-2 py-0.5 border border-rule hover:border-accent text-muted-foreground hover:text-accent text-[10px]"
          >
            [CLOSE]
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase block">TARGET ASSET</span>
          <span className="font-bold text-foreground text-sm">
            {nodeLabel || record.id.toUpperCase()}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-muted-foreground uppercase block">
            CVSS v3.1 SEVERITY
          </span>
          <span className={`px-2 py-0.5 text-[10px] inline-block mt-0.5 ${sevClass}`}>
            {record.cvss} · {record.severity}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] text-accent uppercase font-bold block">// ADVISORY TITLE</span>
        <p className="text-xs font-bold text-foreground leading-snug">{record.title}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-rule text-[11px]">
        <div>
          <span className="text-[9px] text-muted-foreground block">VENDOR</span>
          <span className="text-foreground font-bold">{record.vendor}</span>
        </div>
        <div>
          <span className="text-[9px] text-muted-foreground block">MITRE TACTIC</span>
          <span className="text-accent font-bold">{record.mitreTactic}</span>
        </div>
      </div>

      <div className="space-y-1 pt-1 border-t border-rule">
        <span className="text-[10px] text-muted-foreground uppercase block">AFFECTED FIRMWARE</span>
        <p className="text-[11px] text-foreground/80">{record.affectedProducts}</p>
      </div>

      <div className="space-y-1.5 p-2.5 border border-accent/30 bg-accent/5">
        <span className="text-[10px] text-accent uppercase font-bold block">
          // CISA RECOMMENDED REMEDIATION
        </span>
        <p className="text-[11px] text-foreground leading-relaxed">{record.remediation}</p>
      </div>

      <div className="pt-1 text-right">
        <a
          href={record.cisaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] font-bold text-accent hover:underline border border-accent/40 px-2 py-1 bg-background"
        >
          <span>VIEW CISA ADVISORY PAGE</span>
          <span>→</span>
        </a>
      </div>
    </div>
  );
};
