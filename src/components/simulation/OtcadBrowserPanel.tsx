import React, { useState, useEffect } from "react";
import { searchOtcadIncidentsFn, getOtcadSummaryFn } from "@/lib/api/otcad.functions";
import type { OtcadAttackRecord, OtcadSummary } from "@/lib/data/otcad/types";
import { Database, Search, Shield, ExternalLink, Filter } from "lucide-react";

interface OtcadBrowserPanelProps {
  onClose?: () => void;
  onSelectIncident?: (incident: OtcadAttackRecord) => void;
  initialIndustry?: string;
}

export const OtcadBrowserPanel: React.FC<OtcadBrowserPanelProps> = ({
  onClose,
  onSelectIncident,
  initialIndustry,
}) => {
  const [summary, setSummary] = useState<OtcadSummary | null>(null);
  const [incidents, setIncidents] = useState<OtcadAttackRecord[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<OtcadAttackRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>(initialIndustry || "ALL");
  const [selectedAttackType, setSelectedAttackType] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getOtcadSummaryFn()
      .then((res) => {
        if (res) setSummary(res);
      })
      .catch((err) => console.error("Failed to load OTCAD summary:", err));
  }, []);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    searchOtcadIncidentsFn({
      data: {
        query: searchQuery,
        industry: selectedIndustry === "ALL" ? undefined : selectedIndustry,
        attackType: selectedAttackType === "ALL" ? undefined : selectedAttackType,
      },
    })
      .then((res) => {
        if (mounted && res) {
          setIncidents(res.incidents);
          setIsLoading(false);
          if (res.incidents.length > 0) {
            setSelectedIncident((prev) => prev || res.incidents[0]);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to query OTCAD incidents:", err);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [searchQuery, selectedIndustry, selectedAttackType]);

  const getSevBadge = (sev?: string) => {
    if (sev === "CRITICAL") return "bg-danger text-black border-black font-bold";
    if (sev === "HIGH") return "bg-warn text-black border-black font-bold";
    return "bg-accent text-black border-black font-bold";
  };

  return (
    <div className="w-full border-2 border-rule bg-[#09090B] text-foreground font-mono text-xs shadow-comic p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b-2 border-rule pb-3 gap-3">
        <div className="flex items-center gap-2.5">
          <span className="size-3 bg-accent inline-block" />
          <div>
            <h3 className="font-display font-bold uppercase tracking-wider text-accent text-base sm:text-lg">
              [02 // OTCAD HISTORICAL ICS/OT CYBERATTACK INCIDENT DOSSIERS]
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Peer-reviewed repository of 127 declassified industrial cyber-physical attacks
              (1982–2024)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {summary && (
            <span className="px-2.5 py-1 bg-card border-2 border-rule text-[10px] text-accent font-bold uppercase">
              {summary.totalIncidents} HISTORIC INCIDENTS ({summary.yearRange.min}–
              {summary.yearRange.max})
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

      {/* Filter and Search Bar */}
      <div className="space-y-2.5 bg-[#111114] border-2 border-rule p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search incident name, targeted PLC/RTU, adversary group, or physical consequence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181c] border-2 border-rule pl-9 pr-3 py-2 text-xs text-foreground font-mono focus:border-accent outline-none placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Industry chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-muted-foreground uppercase font-bold mr-1 flex items-center gap-1">
            <Filter className="size-3" /> SECTOR:
          </span>
          {[
            "ALL",
            "Power and Utilities",
            "Water/Waste Water",
            "Petroleum",
            "Transportation",
            "Electronic Manufacturing",
            "Chemical",
            "Automotive",
          ].map((ind) => (
            <button
              key={ind}
              type="button"
              onClick={() => setSelectedIndustry(ind)}
              className={`px-2.5 py-1 text-[10px] border uppercase transition-colors cursor-pointer ${
                selectedIndustry === ind
                  ? "border-black bg-accent text-black font-bold shadow-comic-sm"
                  : "border-rule bg-[#18181c] text-muted-foreground hover:text-foreground hover:border-accent"
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Expansive Full-Width Master-Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Tabular Incident Ledger (lg:col-span-7) */}
        <div className="lg:col-span-7 border-2 border-rule bg-[#050508] flex flex-col h-[520px]">
          <div className="border-b-2 border-rule bg-[#121216] px-3 py-2 flex items-center justify-between text-[11px] font-bold text-accent uppercase">
            <span>INCIDENT ARCHIVE ({incidents.length} MATCHES)</span>
            <span className="text-muted-foreground text-[10px]">CLICK ROW TO INSPECT DOSSIER</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-rule/60">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-xs animate-pulse">
                [LOADING OTCAD HISTORICAL RECORDS...]
              </div>
            ) : incidents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                [NO MATCHING OT CYBER INCIDENTS FOUND]
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#16161b] text-[10px] text-muted-foreground uppercase border-b-2 border-rule">
                  <tr>
                    <th className="py-2 px-3">YEAR</th>
                    <th className="py-2 px-3">SECTOR</th>
                    <th className="py-2 px-3">INCIDENT / TARGET</th>
                    <th className="py-2 px-3">SEVERITY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule/40 font-mono text-xs">
                  {incidents.map((inc) => {
                    const isSelected = selectedIncident?.guid === inc.guid;
                    return (
                      <tr
                        key={inc.guid}
                        onClick={() => setSelectedIncident(inc)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-accent/15 text-foreground font-bold"
                            : "hover:bg-white/5 text-foreground/80"
                        }`}
                      >
                        <td className="py-2.5 px-3 text-accent font-bold tabular-nums whitespace-nowrap">
                          {inc.year}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground text-[11px] whitespace-nowrap">
                          {inc.industry}
                        </td>
                        <td className="py-2.5 px-3 font-semibold">
                          <div className="truncate max-w-[260px] text-foreground">{inc.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate max-w-[260px]">
                            {inc.attackType}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 text-[9px] border uppercase ${getSevBadge(inc.severity)}`}
                          >
                            {inc.severity || "HIGH"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Technical Dossier Inspector (lg:col-span-5) */}
        <div className="lg:col-span-5 border-2 border-rule bg-[#111114] p-4 sm:p-5 flex flex-col justify-between h-[520px] overflow-y-auto space-y-4">
          {selectedIncident ? (
            <>
              <div className="space-y-3">
                <div className="flex items-start justify-between border-b-2 border-rule pb-3 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-accent text-xs">
                        {selectedIncident.year} // {selectedIncident.industry.toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[9px] border uppercase ${getSevBadge(selectedIncident.severity)}`}
                      >
                        {selectedIncident.severity || "HIGH"}
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-base sm:text-lg text-foreground uppercase mt-1">
                      {selectedIncident.name}
                    </h4>
                  </div>

                  {onSelectIncident && (
                    <button
                      onClick={() => onSelectIncident(selectedIncident)}
                      className="px-3 py-1.5 bg-accent text-black font-bold text-xs uppercase border-2 border-black shadow-comic-sm hover:bg-white transition-all cursor-pointer whitespace-nowrap btn-neo-push"
                    >
                      LOAD CASE →
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-b border-rule pb-3 font-mono">
                  <div className="bg-black/40 p-2 border border-rule">
                    <span className="text-[9px] text-muted-foreground uppercase block font-bold">
                      ATTACK VECTOR
                    </span>
                    <span className="text-foreground font-semibold">
                      {selectedIncident.attackType}
                    </span>
                  </div>
                  <div className="bg-black/40 p-2 border border-rule">
                    <span className="text-[9px] text-muted-foreground uppercase block font-bold">
                      TARGET COMPONENT
                    </span>
                    <span className="text-accent font-semibold">
                      {selectedIncident.targetComponent || "SCADA / PLC / RTU"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-accent uppercase font-bold tracking-wider block">
                    [PHYSICAL & OPERATIONAL CONSEQUENCE]:
                  </span>
                  <p className="text-xs text-foreground/90 leading-relaxed bg-black/50 p-3 border-2 border-rule">
                    {selectedIncident.consequence}
                  </p>
                </div>

                {selectedIncident.mitreTechniques &&
                  selectedIncident.mitreTechniques.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                        CORRELATED MITRE ICS TTPS:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedIncident.mitreTechniques.map((tid) => (
                          <span
                            key={tid}
                            className="px-2 py-0.5 border border-accent bg-accent/10 text-accent font-mono text-[10px] font-bold"
                          >
                            {tid}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {selectedIncident.sources && selectedIncident.sources.length > 0 && (
                <div className="pt-3 border-t border-rule text-[11px] space-y-1">
                  <span className="text-[9px] text-muted-foreground uppercase block font-bold">
                    VERIFIED RESEARCH SOURCES:
                  </span>
                  <ul className="space-y-1 text-muted-foreground font-mono">
                    {selectedIncident.sources.slice(0, 3).map((src, i) => (
                      <li key={i} className="truncate">
                        {src.startsWith("http") ? (
                          <a
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="size-3 shrink-0" />
                            <span className="truncate">{src}</span>
                          </a>
                        ) : (
                          <span>{src}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="m-auto text-center text-muted-foreground text-xs">
              [SELECT AN INCIDENT ROW TO INSPECT TECHNICAL DOSSIER]
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
