/**
 * AttackAnatomyPanel.tsx
 *
 * Render 4-part Attack Profile dossier layout and 3 Architectural Attack Surfaces checklist
 * based on digital-twin-security-reference.md standards.
 */

import React, { useState } from "react";
import {
  fetchMitreTaxiiTechniques,
  fetchOtcadIncidents,
  type TaxiiPattern,
  type OtcadIncident,
} from "@/lib/api/taxii.functions";

interface AttackAnatomyPanelProps {
  sector: string;
  adversary: string;
  protocol: string;
  onClose?: () => void;
}

export const AttackAnatomyPanel: React.FC<AttackAnatomyPanelProps> = ({
  sector,
  adversary,
  protocol,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"ANATOMY" | "SURFACES" | "TAXII" | "OTCAD">("ANATOMY");
  const [patterns, setPatterns] = useState<TaxiiPattern[]>([]);
  const [incidents, setIncidents] = useState<OtcadIncident[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTaxiiData = async () => {
    setLoading(true);
    try {
      const res = await fetchMitreTaxiiTechniques();
      if (res?.patterns) setPatterns(res.patterns);
    } catch (err) {
      console.warn("Error fetching TAXII API", err);
    } finally {
      setLoading(false);
    }
  };

  const loadOtcadData = async () => {
    setLoading(true);
    try {
      const res = await fetchOtcadIncidents();
      if (res?.incidents) setIncidents(res.incidents);
    } catch (err) {
      console.warn("Error fetching OTCAD catalog", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#090c10] border border-[#bfff2e]/40 p-4 rounded-none font-mono text-xs shadow-2xl space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-rule pb-2">
        <div className="flex items-center gap-2">
          <span className="size-2.5 bg-[#bfff2e] rounded-full animate-pulse" />
          <h3 className="text-[#bfff2e] font-bold text-sm uppercase tracking-wider">
            ATTACK ANATOMY & THREAT INTEL REFERENCE ({sector.toUpperCase()} SECTOR)
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-danger hover:bg-danger/20 border border-danger/40 px-2 py-0.5 font-bold cursor-pointer"
          >
            [CLOSE]
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-rule/50 pb-2">
        <button
          onClick={() => setActiveTab("ANATOMY")}
          className={`px-3 py-1 font-bold border transition-colors cursor-pointer ${
            activeTab === "ANATOMY"
              ? "bg-[#bfff2e] text-black border-[#bfff2e]"
              : "bg-black/40 text-foreground/70 border-rule/40 hover:text-white"
          }`}
        >
          [1] ATTACK ANATOMY DOSSIER
        </button>
        <button
          onClick={() => setActiveTab("SURFACES")}
          className={`px-3 py-1 font-bold border transition-colors cursor-pointer ${
            activeTab === "SURFACES"
              ? "bg-[#bfff2e] text-black border-[#bfff2e]"
              : "bg-black/40 text-foreground/70 border-rule/40 hover:text-white"
          }`}
        >
          [2] 3 ATTACK SURFACES
        </button>
        <button
          onClick={() => {
            setActiveTab("TAXII");
            if (patterns.length === 0) loadTaxiiData();
          }}
          className={`px-3 py-1 font-bold border transition-colors cursor-pointer ${
            activeTab === "TAXII"
              ? "bg-[#bfff2e] text-black border-[#bfff2e]"
              : "bg-black/40 text-foreground/70 border-rule/40 hover:text-white"
          }`}
        >
          [3] MITRE TAXII 2.1 API
        </button>
        <button
          onClick={() => {
            setActiveTab("OTCAD");
            if (incidents.length === 0) loadOtcadData();
          }}
          className={`px-3 py-1 font-bold border transition-colors cursor-pointer ${
            activeTab === "OTCAD"
              ? "bg-[#bfff2e] text-black border-[#bfff2e]"
              : "bg-black/40 text-foreground/70 border-rule/40 hover:text-white"
          }`}
        >
          [4] OTCAD DATASET
        </button>
      </div>

      {/* TAB 1: 4-Part Attack Anatomy Dossier Table */}
      {activeTab === "ANATOMY" && (
        <div className="space-y-3">
          <p className="text-foreground/70 text-[11px]">
            Standardized pedagogical attack profile schema mapping technical entry pathways down to
            kinetic consequences and mitigations.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border border-rule/60 text-left border-collapse">
              <thead>
                <tr className="bg-[#121620] text-[#bfff2e] font-bold border-b border-rule">
                  <th className="p-2 border.r border-rule w-1/4">Profile Component</th>
                  <th className="p-2 border-r border-rule w-1/4">
                    Core Definition / Field Purpose
                  </th>
                  <th className="p-2 w-1/2">Active Scenario Mapping</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/40 text-[11px]">
                <tr>
                  <td className="p-2 font-bold text-accent border-r border-rule">Attack Vector</td>
                  <td className="p-2 border-r border-rule text-foreground/70">
                    Technical entry pathway exploited by adversary.
                  </td>
                  <td className="p-2 font-mono text-foreground/90">
                    Man-in-the-Middle (MitM) intercepting unencrypted {protocol} telemetry feeds via{" "}
                    {adversary}.
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-warning border-r border-rule">
                    Twin Component Impacted
                  </td>
                  <td className="p-2 border-r border-rule text-foreground/70">
                    Specific layer or boundary in DT architecture breached.
                  </td>
                  <td className="p-2 font-mono text-foreground/90">
                    Level 1 Direct Control / Level 3 SCADA Data Ingestion Pipeline.
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-danger border-r border-rule">
                    Physical Consequence
                  </td>
                  <td className="p-2 border-r border-rule text-foreground/70">
                    Concrete kinetic effect or physical process destruction.
                  </td>
                  <td className="p-2 font-mono text-danger font-semibold">
                    Rotor desynchronization, pressure surge overflow, or chemical dosing setpoint
                    manipulation.
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-[#00f0ff] border-r border-rule">
                    Defensive Mitigation
                  </td>
                  <td className="p-2 border-r border-rule text-foreground/70">
                    Actionable security control or architecture fix.
                  </td>
                  <td className="p-2 font-mono text-[#00f0ff]">
                    Enforce TLS 1.3 cryptographic payload signing, isolate target PLC node, deploy
                    signed attestation patch.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: 3 Architectural Attack Surfaces Check */}
      {activeTab === "SURFACES" && (
        <div className="space-y-3">
          <p className="text-foreground/70 text-[11px]">
            Comprehensive audit of the 3 major interface junctions vulnerability design checklist:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#0e121a] border border-rule p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-accent font-bold">
                <span>[1]</span>
                <span>PHYSICAL-TO-VIRTUAL FEED</span>
              </div>
              <p className="text-foreground/70 text-[10.5px]">
                Susceptible to Data Poisoning, packet dropping, or signal spoofing to trick the
                digital twin's predictive logic.
              </p>
              <div className="text-[10px] text-[#bfff2e] bg-black/50 p-1.5 border border-rule/50">
                STATUS: TELEMETRY DRIFT MONITORED
              </div>
            </div>

            <div className="bg-[#0e121a] border border-rule p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-warning font-bold">
                <span>[2]</span>
                <span>TWIN CORE LAYER</span>
              </div>
              <p className="text-foreground/70 text-[10.5px]">
                Vulnerable to Reverse Engineering, malicious AI model manipulation, and Intellectual
                Property exfiltration.
              </p>
              <div className="text-[10px] text-warning bg-black/50 p-1.5 border border-rule/50">
                STATUS: MODEL INTEGRITY AUDITED
              </div>
            </div>

            <div className="bg-[#0e121a] border border-rule p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-danger font-bold">
                <span>[3]</span>
                <span>VIRTUAL-TO-PHYSICAL PATH</span>
              </div>
              <p className="text-foreground/70 text-[10.5px]">
                Vulnerable to unauthorized reverse command injection, enabling adversaries to
                manipulate physical machinery.
              </p>
              <div className="text-[10px] text-danger bg-black/50 p-1.5 border border-rule/50">
                STATUS: REVERSE COMMANDS FILTERED
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MITRE ATT&CK for ICS TAXII 2.1 API */}
      {activeTab === "TAXII" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[#bfff2e] font-bold">
              TAXII 2.1 STIX SERVER FEED (`https://cti-taxii.mitre.org/taxii/`)
            </span>
            <button
              onClick={loadTaxiiData}
              className="border border-[#bfff2e] text-[#bfff2e] px-2 py-0.5 text-[10px] hover:bg-[#bfff2e] hover:text-black font-bold cursor-pointer"
            >
              {loading ? "SYNCING..." : "RE-SYNC TAXII API"}
            </button>
          </div>

          <div className="space-y-2">
            {patterns.map((p) => (
              <div key={p.id} className="bg-[#0d1017] border border-rule/60 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[#bfff2e] font-bold">
                  <span>
                    {p.external_id} — {p.name}
                  </span>
                  <span className="text-foreground/50 text-[10px]">[{p.tactics.join(", ")}]</span>
                </div>
                <p className="text-foreground/80 text-[11px]">{p.description}</p>
                <div className="text-[9.5px] text-foreground/50">
                  Target Platforms: {p.platforms.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: OTCAD Historical Dataset Catalog */}
      {activeTab === "OTCAD" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[#bfff2e] font-bold">
              OT CAD DATABASE (`https://github.com/bvcyber/OTCAD`)
            </span>
            <button
              onClick={loadOtcadData}
              className="border border-[#bfff2e] text-[#bfff2e] px-2 py-0.5 text-[10px] hover:bg-[#bfff2e] hover:text-black font-bold cursor-pointer"
            >
              {loading ? "FETCHING..." : "RE-FETCH OTCAD"}
            </button>
          </div>

          <div className="space-y-2">
            {incidents.map((inc) => (
              <div key={inc.id} className="bg-[#0d1017] border border-rule/60 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-warning font-bold">
                  <span>
                    [{inc.year}] {inc.incidentName}
                  </span>
                  <span className="text-[#00f0ff] text-[10px]">{inc.sector} Sector</span>
                </div>
                <p className="text-foreground/80 text-[11px]">
                  <strong>Target:</strong> {inc.targetComponent} | <strong>Tactic:</strong>{" "}
                  {inc.mitreTactic}
                </p>
                <p className="text-danger text-[10.5px]">
                  <strong>Consequence:</strong> {inc.consequence}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
