import React, { useState, useEffect } from "react";
import { searchMitreTechniquesFn, getMitreSummaryFn } from "@/lib/api/mitre.functions";
import type { MitreTechnique, MitreCatalogSummary } from "@/lib/data/mitre/types";
import { Search, Shield, Filter, ExternalLink, Terminal } from "lucide-react";

interface MitreIcsExplorerPanelProps {
  onClose?: () => void;
  onSelectTechnique?: (technique: MitreTechnique) => void;
  initialTechniqueId?: string;
}

export const MitreIcsExplorerPanel: React.FC<MitreIcsExplorerPanelProps> = ({
  onClose,
  onSelectTechnique,
  initialTechniqueId,
}) => {
  const [summary, setSummary] = useState<MitreCatalogSummary | null>(null);
  const [techniques, setTechniques] = useState<MitreTechnique[]>([]);
  const [selectedTechnique, setSelectedTechnique] = useState<MitreTechnique | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTactic, setSelectedTactic] = useState<string>("ALL");
  const [includeRevoked, setIncludeRevoked] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load summary on mount
  useEffect(() => {
    getMitreSummaryFn()
      .then((res) => {
        if (res) setSummary(res);
      })
      .catch((err) => console.error("Failed to load MITRE summary:", err));
  }, []);

  // Search/Filter techniques
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    searchMitreTechniquesFn({
      data: {
        query: searchQuery,
        tactic: selectedTactic === "ALL" ? undefined : selectedTactic,
        includeRevoked,
      },
    })
      .then((res) => {
        if (mounted && res) {
          setTechniques(res.techniques);
          setIsLoading(false);
          // Auto-select first or initial technique
          if (initialTechniqueId) {
            const found = res.techniques.find(
              (t) =>
                t.externalId.toLowerCase() === initialTechniqueId.toLowerCase() ||
                t.id === initialTechniqueId,
            );
            if (found) setSelectedTechnique(found);
            else if (res.techniques.length > 0) {
              setSelectedTechnique((prev) => prev || res.techniques[0]);
            }
          } else if (res.techniques.length > 0) {
            setSelectedTechnique((prev) => prev || res.techniques[0]);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to search MITRE techniques:", err);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [searchQuery, selectedTactic, includeRevoked, initialTechniqueId]);

  return (
    <div className="w-full border-2 border-rule bg-[#09090B] text-foreground font-mono text-xs shadow-comic p-4 sm:p-6 space-y-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between border-b-2 border-rule pb-3 gap-3">
        <div className="flex items-center gap-2.5">
          <span className="size-3 bg-accent inline-block" />
          <div>
            <h3 className="font-display font-bold uppercase tracking-wider text-accent text-base sm:text-lg">
              [03 // MITRE ATT&CK FOR ICS // STIX 2.1 KNOWLEDGE BASE]
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Official catalog of adversary Tactics, Techniques, and Procedures (TTPs) targeting OT
              control loops
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {summary && (
            <span className="px-2.5 py-1 bg-card border-2 border-rule text-[10px] text-accent font-bold uppercase">
              {summary.totalTechniques} ACTIVE TECHNIQUES · {summary.totalMitigations} MITIGATIONS
            </span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="px-2.5 py-1 border-2 border-rule hover:border-danger text-muted-foreground hover:text-danger font-bold cursor-pointer"
            >
              [CLOSE]
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="space-y-2.5 bg-[#111114] border-2 border-rule p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search technique ID (e.g. T0855, T0831, T0814), name, or industrial keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181c] border-2 border-rule pl-9 pr-3 py-2 text-xs text-foreground font-mono focus:border-accent outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none bg-[#18181c] border-2 border-rule px-3 py-2">
            <input
              type="checkbox"
              checked={includeRevoked}
              onChange={(e) => setIncludeRevoked(e.target.checked)}
              className="accent-[#bfff2e] size-3.5"
            />
            <span className="text-[11px] font-bold uppercase">Include Superseded TTPs</span>
          </label>
        </div>

        {/* Tactics buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-muted-foreground uppercase font-bold mr-1 flex items-center gap-1">
            <Filter className="size-3" /> TACTIC:
          </span>
          {[
            "ALL",
            "Initial Access",
            "Execution",
            "Persistence",
            "Evasion",
            "Discovery",
            "Lateral Movement",
            "Collection",
            "Impair Process Control",
            "Inhibit Response Function",
            "Impact",
          ].map((tac) => (
            <button
              key={tac}
              type="button"
              onClick={() => setSelectedTactic(tac)}
              className={`px-2 py-1 text-[10px] border uppercase transition-colors cursor-pointer ${
                selectedTactic === tac
                  ? "border-black bg-accent text-black font-bold shadow-comic-sm"
                  : "border-rule bg-[#18181c] text-muted-foreground hover:text-foreground hover:border-accent"
              }`}
            >
              {tac}
            </button>
          ))}
        </div>
      </div>

      {/* Main Expansive 2-Column Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Techniques Tabular List (lg:col-span-6) */}
        <div className="lg:col-span-6 border-2 border-rule bg-[#050508] flex flex-col h-[520px]">
          <div className="border-b-2 border-rule bg-[#121216] px-3 py-2 flex items-center justify-between text-[11px] font-bold text-accent uppercase">
            <span>ICS TECHNIQUE REPOSITORY ({techniques.length} ENTRIES)</span>
            <span className="text-muted-foreground text-[10px]">SELECT TO ANALYZE</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-rule/60">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-xs animate-pulse">
                [QUERYING STIX 2.1 CATALOG...]
              </div>
            ) : techniques.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                [NO MATCHING ICS TECHNIQUES FOUND]
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#16161b] text-[10px] text-muted-foreground uppercase border-b-2 border-rule">
                  <tr>
                    <th className="py-2 px-3">TTP ID</th>
                    <th className="py-2 px-3">TECHNIQUE NAME</th>
                    <th className="py-2 px-3">PRIMARY TACTIC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule/40 font-mono text-xs">
                  {techniques.map((tech) => {
                    const isSelected = selectedTechnique?.id === tech.id;
                    return (
                      <tr
                        key={tech.id}
                        onClick={() => setSelectedTechnique(tech)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-accent/15 text-foreground font-bold"
                            : "hover:bg-white/5 text-foreground/80"
                        }`}
                      >
                        <td className="py-2.5 px-3 text-accent font-bold tabular-nums whitespace-nowrap">
                          {tech.externalId || "T0800"}
                          {tech.isRevoked && (
                            <span className="ml-1.5 px-1 py-0.2 bg-warn/20 text-warn text-[8px] border border-warn/40 uppercase">
                              LEGACY
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold">
                          <div className="truncate max-w-[240px] text-foreground">{tech.name}</div>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground text-[11px] whitespace-nowrap">
                          {tech.tactics[0] || "ICS Impact"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Technical Inspector & Countermeasures (lg:col-span-6) */}
        <div className="lg:col-span-6 border-2 border-rule bg-[#111114] p-4 sm:p-5 flex flex-col justify-between h-[520px] overflow-y-auto space-y-4">
          {selectedTechnique ? (
            <>
              <div className="space-y-3">
                <div className="flex items-start justify-between border-b-2 border-rule pb-3 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-accent text-sm sm:text-base font-mono">
                        {selectedTechnique.externalId}
                      </span>
                      {selectedTechnique.isRevoked && (
                        <span className="px-2 py-0.5 bg-warn text-black font-bold text-[9px] uppercase border border-black">
                          REVOKED / SUPERSEDED
                        </span>
                      )}
                    </div>
                    <h4 className="font-display font-bold text-base sm:text-lg text-foreground uppercase mt-0.5">
                      {selectedTechnique.name}
                    </h4>
                  </div>

                  {onSelectTechnique && (
                    <button
                      onClick={() => onSelectTechnique(selectedTechnique)}
                      className="px-3 py-1.5 bg-accent text-black font-bold text-xs uppercase border-2 border-black shadow-comic-sm hover:bg-white transition-all cursor-pointer whitespace-nowrap btn-neo-push"
                    >
                      APPLY TTP →
                    </button>
                  )}
                </div>

                {selectedTechnique.isRevoked && selectedTechnique.revokedBy && (
                  <div className="p-2.5 border-2 border-warn/40 bg-warn/10 text-warn text-xs">
                    <strong>SUPERSEDED NOTE:</strong> This technique was restructured in the ICS
                    matrix and replaced by{" "}
                    <button
                      type="button"
                      onClick={() => {
                        const rep = techniques.find(
                          (t) => t.externalId === selectedTechnique.revokedBy,
                        );
                        if (rep) setSelectedTechnique(rep);
                        else setSearchQuery(selectedTechnique.revokedBy || "");
                      }}
                      className="underline font-bold text-accent cursor-pointer"
                    >
                      {selectedTechnique.revokedBy}
                    </button>
                    .
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs border-b border-rule pb-3 font-mono">
                  <div className="bg-black/40 p-2 border border-rule">
                    <span className="text-[9px] text-muted-foreground uppercase block font-bold">
                      PURDUE TACTIC
                    </span>
                    <span className="text-foreground font-semibold">
                      {selectedTechnique.tactics.join(", ")}
                    </span>
                  </div>
                  <div className="bg-black/40 p-2 border border-rule">
                    <span className="text-[9px] text-muted-foreground uppercase block font-bold">
                      TARGET PLATFORMS
                    </span>
                    <span className="text-accent font-semibold">
                      {selectedTechnique.platforms.join(", ") || "Control Server, Field Controller"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-accent uppercase font-bold tracking-wider block">
                    [TECHNICAL EXPLOIT MECHANICS]:
                  </span>
                  <p className="text-xs text-foreground/90 leading-relaxed bg-black/50 p-3 border-2 border-rule">
                    {selectedTechnique.description}
                  </p>
                </div>

                {/* Mitigations */}
                <div className="space-y-2 pt-1 border-t border-rule">
                  <span className="text-[10px] text-accent uppercase font-bold tracking-wider block">
                    [STIX DEFENSIVE COURSES OF ACTION / MITIGATIONS]:
                  </span>
                  {selectedTechnique.mitigations && selectedTechnique.mitigations.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTechnique.mitigations.map((mit, i) => (
                        <div key={i} className="p-2.5 border-2 border-rule bg-black/40 text-xs">
                          <div className="font-bold text-accent flex items-center gap-1.5">
                            <Shield className="size-3" />
                            {mit.name}
                          </div>
                          <p className="text-foreground/80 text-[11px] leading-relaxed mt-1">
                            {mit.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2.5 border border-rule bg-black/30 text-xs text-muted-foreground">
                      Network air-gapping, controller firmware cryptographic signing, and strict
                      Modbus/DNP3 protocol firewalls apply.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="m-auto text-center text-muted-foreground text-xs">
              [SELECT A MITRE ATT&CK TECHNIQUE TO INSPECT DETAILS]
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
