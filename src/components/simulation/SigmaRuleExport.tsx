import React, { useState } from "react";
import { generateSigmaRule, downloadSigmaRuleYml } from "@/lib/sigma-generator";

interface SigmaRuleExportProps {
  sector: string;
  unmitigatedEvents: Array<{
    nodeId: string;
    nodeLabel: string;
    tactic: string;
    mitreId: string;
    vendor: string;
  }>;
}

export const SigmaRuleExport: React.FC<SigmaRuleExportProps> = ({ sector, unmitigatedEvents }) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  if (!unmitigatedEvents || unmitigatedEvents.length === 0) {
    return (
      <div className="p-3 border border-rule bg-card/40 font-mono text-xs text-muted-foreground">
        <span className="text-accent font-bold">// SIGMA RULE DETECTION EXPORTER</span>
        <p className="text-[11px] mt-1 text-foreground/70">
          No unmitigated threat events detected during this run. All attack vectors were
          successfully contained.
        </p>
      </div>
    );
  }

  const current = unmitigatedEvents[selectedIdx] || unmitigatedEvents[0];
  const yamlContent = generateSigmaRule({
    sector,
    mitreId: current.mitreId || "T0855",
    mitreTactic: current.tactic || "Execution",
    nodeId: current.nodeId,
    nodeLabel: current.nodeLabel,
    vendor: current.vendor || "Siemens",
    eventType: current.tactic.toUpperCase(),
  });

  const handleDownload = () => {
    const filename = `twinsec_sigma_${sector}_${current.mitreId || "T0855"}.yml`;
    downloadSigmaRuleYml(filename, yamlContent);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 border-2 border-rule/80 bg-black/95 font-mono text-xs space-y-3 shadow-comic-dark rounded-lg">
      <div className="flex items-center justify-between border-b border-rule pb-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="font-bold text-accent text-xs tracking-wider">
            // AUTOMATED SIGMA RULE GENERATOR ({unmitigatedEvents.length} DETECTED)
          </span>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          className="px-2.5 py-1 bg-accent text-black font-bold text-[10px] hover:opacity-90 cursor-pointer shadow-brutal"
        >
          DOWNLOAD .YML RULE ↓
        </button>
      </div>

      {/* Target Event Selector */}
      {unmitigatedEvents.length > 1 && (
        <div className="flex gap-1 overflow-x-auto py-1">
          {unmitigatedEvents.map((evt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`px-2 py-1 text-[10px] border whitespace-nowrap cursor-pointer ${
                selectedIdx === idx
                  ? "bg-accent/20 border-accent text-accent font-bold"
                  : "border-rule text-muted-foreground hover:text-foreground"
              }`}
            >
              [{evt.mitreId}] {evt.nodeLabel}
            </button>
          ))}
        </div>
      )}

      {/* YAML Output Block */}
      <div className="relative">
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-0.5 border border-rule bg-background text-[10px] text-accent hover:border-accent"
          >
            {copied ? "COPIED ✅" : "COPY YAML"}
          </button>
        </div>
        <pre className="p-3 bg-black border border-rule text-[10px] text-foreground/90 overflow-x-auto max-h-48 leading-relaxed scrollbar-none font-mono">
          {yamlContent}
        </pre>
      </div>
    </div>
  );
};
