import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, lazy, Suspense } from "react";
import { useGsapReveal } from "@/hooks/use-gsap-reveal";
import { handleSmartBack } from "@/lib/nav-stack";

const HaiReplayPanel = lazy(() =>
  import("@/components/simulation/HaiReplayPanel").then((m) => ({ default: m.HaiReplayPanel })),
);
const MitreIcsExplorerPanel = lazy(() =>
  import("@/components/simulation/MitreIcsExplorerPanel").then((m) => ({
    default: m.MitreIcsExplorerPanel,
  })),
);
const OtcadBrowserPanel = lazy(() =>
  import("@/components/simulation/OtcadBrowserPanel").then((m) => ({
    default: m.OtcadBrowserPanel,
  })),
);

function PanelFallback({ label }: { label: string }) {
  return (
    <div className="w-full min-h-[420px] border-2 border-rule bg-card flex flex-col items-center justify-center p-8 font-mono shadow-comic space-y-3">
      <div className="flex items-center gap-2 text-accent">
        <span className="size-2.5 bg-accent animate-ping" />
        <span className="text-xs font-bold uppercase tracking-wider">
          LOADING TACTICAL INTEL: [{label}]
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
        INITIALIZING DATASET STREAM · PURDUE RANGE
      </p>
    </div>
  );
}

export const Route = createFileRoute("/threat-intel")({
  head: () => ({
    meta: [
      { title: "Threat Intel & Digital Twin Range Lab — TwinSec" },
      {
        name: "description",
        content:
          "Industrial Cyber-Physical Range Threat Intelligence: HAI continuous telemetry replay, MITRE ATT&CK for ICS matrix, and OTCAD historical incident dossiers.",
      },
      { property: "og:title", content: "TwinSec — Threat Intelligence Lab" },
    ],
  }),
  component: ThreatIntelPage,
});

function ThreatIntelPage() {
  const [activeTab, setActiveTab] = useState<"hai" | "mitre" | "otcad">("hai");
  const containerRef = useGsapReveal();

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground font-mono">
      {/* Top Tactical Command Header */}
      <header className="border-b-2 border-rule bg-card/60 sticky top-0 z-30 backdrop-blur-none">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSmartBack(undefined, "/briefings")}
              className="px-2.5 py-1 text-[11px] border-2 border-rule hover:border-accent text-muted-foreground hover:text-accent font-bold"
            >
              ← [BACK]
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2 bg-accent inline-block animate-ping" />
                <span className="text-[10px] tracking-widest text-accent uppercase font-bold">
                  CYBER-PHYSICAL THREAT LAB // DUAL-USE INTELLIGENCE
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-display uppercase tracking-wider font-bold text-foreground">
                DATASET INTEGRATION & THREAT INTELLIGENCE CENTER
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/simulation"
              search={{ sector: "water" as const }}
              className="px-3 py-1.5 bg-accent text-black font-bold text-xs border-2 border-accent btn-neo-push hover:bg-white"
            >
              ▶ LAUNCH DIGITAL TWIN SIMULATION
            </Link>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 flex gap-2 border-t border-rule/60 pt-2 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("hai")}
            className={`px-4 py-2 text-xs font-bold border-2 transition-all cursor-pointer ${
              activeTab === "hai"
                ? "bg-accent text-black border-accent shadow-comic"
                : "bg-card text-muted-foreground border-rule hover:border-accent hover:text-foreground"
            }`}
          >
            [1] HAI CONTINUOUS TELEMETRY REPLAY & ML LAB
          </button>
          <button
            onClick={() => setActiveTab("mitre")}
            className={`px-4 py-2 text-xs font-bold border-2 transition-all cursor-pointer ${
              activeTab === "mitre"
                ? "bg-accent text-black border-accent shadow-comic"
                : "bg-card text-muted-foreground border-rule hover:border-accent hover:text-foreground"
            }`}
          >
            [2] MITRE ATT&CK FOR ICS STIX 2.1 MATRIX
          </button>
          <button
            onClick={() => setActiveTab("otcad")}
            className={`px-4 py-2 text-xs font-bold border-2 transition-all cursor-pointer ${
              activeTab === "otcad"
                ? "bg-accent text-black border-accent shadow-comic"
                : "bg-card text-muted-foreground border-rule hover:border-accent hover:text-foreground"
            }`}
          >
            [3] OTCAD HISTORICAL CYBERATTACK DOSSIERS
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Selected Intel Panel (9 cols on large screen) */}
          <div className="col-span-12 lg:col-span-8 flex justify-center">
            <Suspense fallback={<PanelFallback label={activeTab.toUpperCase()} />}>
              {activeTab === "hai" && <HaiReplayPanel />}
              {activeTab === "mitre" && <MitreIcsExplorerPanel />}
              {activeTab === "otcad" && <OtcadBrowserPanel />}
            </Suspense>
          </div>

          {/* Side Context & Tactical Range Integration (4 cols) */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="p-4 border-2 border-rule bg-card font-mono text-xs space-y-3 shadow-comic">
              <div className="flex items-center gap-2 text-accent border-b border-rule pb-2">
                <span className="size-2 bg-accent inline-block" />
                <span className="font-bold tracking-wider uppercase text-[11px]">
                  ACTIVE RANGE INTEGRATION STATUS
                </span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between border-b border-rule/50 pb-1.5">
                  <span className="text-muted-foreground">HAI ICS TELEMETRY</span>
                  <span className="text-accent font-bold">14 ATTACK SCENARIOS</span>
                </div>
                <div className="flex justify-between border-b border-rule/50 pb-1.5">
                  <span className="text-muted-foreground">MITRE ATT&CK FOR ICS</span>
                  <span className="text-accent font-bold">118 TECHNIQUES (STIX 2.1)</span>
                </div>
                <div className="flex justify-between border-b border-rule/50 pb-1.5">
                  <span className="text-muted-foreground">OTCAD HISTORICAL ARCHIVE</span>
                  <span className="text-accent font-bold">127 INCIDENTS (1988–2020)</span>
                </div>
                <div className="flex justify-between border-b border-rule/50 pb-1.5">
                  <span className="text-muted-foreground">GROUND-TRUTH LABELS</span>
                  <span className="text-accent font-bold">54,000 SYNCHRONIZED ROWS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ANOMALY EVALUATION</span>
                  <span className="text-warn font-bold">TP / FP / FN / F1-SCORE</span>
                </div>
              </div>

              <div className="p-2.5 bg-black/40 border border-rule text-[11px] text-muted-foreground space-y-1">
                <strong className="text-foreground block">SECURITY ARCHITECT NOTE:</strong>
                All three datasets now function as unified live pipelines within TwinSec. Anomalies
                detected in continuous telemetry stream directly into MITRE ATT&CK technique mapping
                and historical OTCAD precedents.
              </div>
            </div>

            {/* Quick sector scenarios */}
            <div className="p-4 border-2 border-rule bg-card font-mono text-xs space-y-3 shadow-comic">
              <span className="text-accent font-bold uppercase text-[11px] block">
                // TARGET SCENARIOS READY FOR DRILL
              </span>
              <div className="space-y-2">
                {(
                  [
                    {
                      sector: "power",
                      name: "Substation-07 Power Grid Cascade",
                      adversary: "Sandworm",
                    },
                    {
                      sector: "water",
                      name: "Operation Waterfall Dosing Overdose",
                      adversary: "Volt Typhoon",
                    },
                    {
                      sector: "manufacturing",
                      name: "Centrifuge Resonance Drift",
                      adversary: "Stuxnet APT",
                    },
                    {
                      sector: "oil-gas",
                      name: "Blackout Pipeline Compressor Surge",
                      adversary: "DarkSide",
                    },
                  ] as const
                ).map((s) => (
                  <Link
                    key={s.sector}
                    to="/simulation"
                    search={{ sector: s.sector }}
                    className="p-2 border border-rule hover:border-accent bg-[#121215] flex items-center justify-between group transition-colors block"
                  >
                    <div>
                      <div className="font-bold text-foreground group-hover:text-accent">
                        {s.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        Sector: {s.sector} · Adversary: {s.adversary}
                      </div>
                    </div>
                    <span className="text-accent font-bold text-sm">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
