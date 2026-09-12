import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { usePreferences, type SectorId } from "@/lib/auth-store";
import { useOperator } from "@/contexts/OperatorContext";
import { useEffect, useState } from "react";
import { exportOperatorData, deleteOperatorAccount } from "@/lib/api/auth.functions";
import { getTrainingRuns, type TrainingRun } from "@/lib/api/training.functions";
import { log } from "@/lib/logger";
import { NeoStatCards } from "@/components/dashboard/NeoStatCards";
import { NeoDashboardCharts } from "@/components/dashboard/NeoDashboardCharts";
import { SubnetThreatMatrixDeck } from "@/components/dashboard/SubnetThreatMatrixDeck";
import {
  Zap,
  Shield,
  Download,
  Trash2,
  CheckCircle,
  ArrowRight,
  Sliders,
  FileSpreadsheet,
  Search,
  LogOut,
  Terminal,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "TwinSec — Operator Cyber Range Command Deck" },
      {
        name: "description",
        content:
          "Operator Command Center, real-time ICS/SCADA analytics, drill ledger, and OT telemetry controls.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { operator, loading, logout } = useOperator();
  const [prefs, updatePrefs] = usePreferences();
  const [runs, setRuns] = useState<TrainingRun[]>([]);
  const [runsLoading, setRunsLoading] = useState(true);
  const [filterSector, setFilterSector] = useState<string>("ALL");
  const [currentTab, setCurrentTab] = useState<string>("ledger");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (!loading && (!operator || !operator.loggedIn)) {
      navigate({ to: "/login", search: { from: "/dashboard" } });
    }
  }, [operator, loading, navigate]);

  useEffect(() => {
    if (operator?.loggedIn) {
      setRunsLoading(true);
      getTrainingRuns()
        .then((data) => setRuns(data))
        .catch((err) => log.error("Failed to load operator training runs:", err))
        .finally(() => setRunsLoading(false));
    }
  }, [operator]);

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login", search: { from: undefined } });
  };

  if (loading || !operator || !operator.loggedIn) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono text-xs select-none">
        <div className="flex flex-col items-center gap-3 p-8 border-2 border-black bg-[#18181B] shadow-[8px_8px_0px_0px_#BFFF2E]">
          <div className="size-6 border-3 border-accent border-t-transparent animate-spin" />
          <span className="mono-label text-accent font-black tracking-widest animate-pulse">
            AUTHENTICATING OPERATOR CLEARANCE...
          </span>
        </div>
      </div>
    );
  }

  // Filtered runs based on sector and search query
  const filteredRuns = runs.filter((r) => {
    const matchesSector = filterSector === "ALL" || r.sector === filterSector;
    const matchesSearch =
      !searchQuery.trim() ||
      r.adversary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.branch.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSector && matchesSearch;
  });

  const totalRunsCount = runs.length;
  const avgScore =
    runs.length > 0
      ? Math.round(runs.reduce((acc, r) => acc + (r.score || 0), 0) / runs.length)
      : 92;
  const totalMwProtected =
    runs.length > 0 ? runs.reduce((acc, r) => acc + (r.mwShed || 0), 0) : 1420;

  return (
    <main className="min-h-screen bg-background text-foreground select-none antialiased py-8 px-4 sm:px-6 lg:px-10 relative">
      {/* Blueprint Grid background */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute inset-0 scanline pointer-events-none opacity-30" />

      <div className="max-w-[1600px] mx-auto space-y-8 relative z-10">
        {/* ── 1. TOP OPERATOR CLEARANCE HEADER ── */}
        <div className="border-2 border-rule bg-[#18181B] text-foreground p-6 shadow-[6px_6px_0px_0px_#000000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Callsign Badge */}
            <div className="size-14 bg-black text-accent border-2 border-rule flex items-center justify-center font-mono font-black text-xl shadow-[3px_3px_0px_#000000]">
              {operator.callsign?.slice(0, 2).toUpperCase() || "OP"}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="mono-label text-accent uppercase font-black">
                  AUTHENTICATED OPERATOR TTY
                </span>
                <span className="px-2.5 py-0.5 border border-accent bg-accent/20 text-accent font-mono text-xs font-black uppercase">
                  {operator.clearance || "CLEARANCE: LVL-4"}
                </span>
              </div>
              <h1 className="display text-4xl sm:text-6xl font-black uppercase tracking-tight text-foreground leading-none mt-1">
                OPERATOR CALLSIGN: {operator.callsign}
              </h1>
              <p className="font-serif italic text-sm text-foreground/80 mt-1">
                Badge Serial:{" "}
                <strong className="text-foreground font-mono">#{operator.badgeId}</strong> ·
                Security Zone: <strong className="text-foreground">PRIMARY ICS/SCADA RANGE</strong>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <Link
              to="/simulation"
              search={{ sector: prefs.defaultSector }}
              className="h-11 px-6 bg-accent text-accent-foreground border-2 border-black font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000000] hover:bg-lime-300 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Terminal className="size-4 stroke-[2.5]" />
              <span>LAUNCH SIMULATION</span>
            </Link>

            <button
              onClick={handleLogout}
              className="h-11 px-4 bg-black text-foreground/80 border-2 border-rule font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_#000000] hover:border-red-500 hover:text-red-400 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="size-4 stroke-[2.5]" />
              <span>LOGOUT</span>
            </button>
          </div>
        </div>

        {/* ── 2. REAL-TIME STATS DECK (4 CARDS) ── */}
        <NeoStatCards
          totalRuns={totalRunsCount}
          avgScore={avgScore}
          totalMwShed={totalMwProtected}
          uptime="99.99%"
        />

        {/* ── 3. VISUAL ANALYTICS (STEPPED INCIDENT TRAJECTORY + SECTOR READINESS) ── */}
        <NeoDashboardCharts />

        {/* ── 4. INTERACTIVE OT SUBNET THREAT MATRIX DECK ── */}
        <SubnetThreatMatrixDeck />

        {/* ── 5. TABBED CONTROLS (TRAINING LEDGER / RADAR CONFIG / CREDENTIALS) ── */}
        <div className="space-y-6 pt-2">
          {/* Tab Selection Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-rule pb-3">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "ledger", label: "TRAINING DRILLS LEDGER" },
                { id: "preferences", label: "RADAR & SYSTEM PREFERENCES" },
                { id: "dossier", label: "SECURITY DOSSIER & CLEARANCE" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`h-11 px-6 rounded-none border-2 font-mono text-xs font-black uppercase transition-all cursor-pointer ${
                    currentTab === tab.id
                      ? "border-black bg-accent text-accent-foreground shadow-[4px_4px_0px_#000000] -translate-y-0.5"
                      : "border-rule bg-[#18181B] text-foreground shadow-[3px_3px_0px_#000000] hover:border-accent"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sector filter & search (for ledger tab) */}
            {currentTab === "ledger" && (
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="SEARCH DRILLS..."
                    className="w-48 sm:w-60 h-10 pl-8 pr-3 rounded-none border-2 border-rule bg-black font-mono text-xs text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-accent shadow-[2px_2px_0px_#000000]"
                  />
                  <Search className="size-3.5 text-foreground/50 absolute left-2.5 pointer-events-none" />
                </div>

                {/* Sector Pills */}
                <div className="flex flex-wrap items-center gap-1 font-mono text-xs">
                  {["ALL", "power", "water", "oil-gas", "manufacturing", "port"].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setFilterSector(sec)}
                      className={`px-3 py-1.5 font-black uppercase border-2 transition-all cursor-pointer ${
                        filterSector === sec
                          ? "bg-accent text-accent-foreground border-black shadow-[2px_2px_0px_#000000]"
                          : "border-rule bg-[#18181B] text-foreground/80 hover:text-foreground hover:border-accent"
                      }`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── TAB 1: IMMUTABLE DRILL HISTORY LEDGER ── */}
          {currentTab === "ledger" && (
            <div className="rounded-none border-2 border-rule bg-[#18181B] shadow-[6px_6px_0px_0px_#000000] overflow-hidden">
              <div className="p-4 bg-black text-foreground flex items-center justify-between border-b-2 border-rule">
                <span className="mono-label !text-foreground font-black flex items-center gap-2">
                  <FileSpreadsheet className="size-4 text-accent" />
                  VERIFIED OPERATOR DRILL AUDIT LEDGER
                </span>
                <span className="mono-label !text-accent font-black">
                  {filteredRuns.length} RECORDED DRILLS
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-rule bg-black/60 text-foreground/80 uppercase text-[11px] tracking-wider font-black">
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Subnet Sector</th>
                      <th className="p-4">Adversary Vector</th>
                      <th className="p-4 text-right">MW Load Shed</th>
                      <th className="p-4">Score</th>
                      <th className="p-4">Branch Resolution</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule/60">
                    {runsLoading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-8 text-center text-foreground/60 italic font-mono"
                        >
                          LOADING TRAINING RUNS...
                        </td>
                      </tr>
                    ) : filteredRuns.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-12 text-center text-foreground/80 font-mono space-y-4"
                        >
                          <p className="font-black text-base text-foreground">
                            NO DRILLS RECORDED YET IN THIS SECTOR.
                          </p>
                          <Link
                            to="/simulation"
                            search={{
                              sector:
                                filterSector !== "ALL"
                                  ? (filterSector as SectorId)
                                  : prefs.defaultSector,
                            }}
                            className="inline-flex items-center gap-2 h-11 px-6 bg-accent text-accent-foreground border-2 border-black font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000000] hover:bg-lime-300"
                          >
                            <Zap className="size-4 stroke-[2.5]" />
                            RECORD YOUR FIRST DRILL →
                          </Link>
                        </td>
                      </tr>
                    ) : (
                      filteredRuns.map((r) => (
                        <tr key={r.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 whitespace-nowrap text-foreground font-medium">
                            {new Date(r.createdAt || r.timestamp).toLocaleString()}
                          </td>
                          <td className="p-4 uppercase font-black">
                            <span className="px-2.5 py-1 border border-accent bg-accent/15 text-accent text-xs">
                              {r.sector.replace("-", " ")}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-foreground">{r.adversary}</td>
                          <td className="p-4 text-right font-black tabular-nums text-foreground">
                            {r.mwShed} MW
                          </td>
                          <td className="p-4 font-black tabular-nums">
                            <span
                              className={`px-2.5 py-1 border text-xs font-black ${
                                r.score >= 80
                                  ? "border-accent bg-accent text-accent-foreground"
                                  : "border-rule bg-black text-foreground"
                              }`}
                            >
                              {r.score}%
                            </span>
                          </td>
                          <td className="p-4 text-foreground/80 max-w-xs truncate">{r.branch}</td>
                          <td className="p-4 text-center">
                            <a
                              href={r.shareUrl}
                              className="h-8 px-3 bg-black border-2 border-rule text-foreground font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#000000] hover:border-accent hover:text-accent transition-all inline-flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5"
                            >
                              REPLAY <ArrowRight className="size-3" />
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB 2: SYSTEM & RADAR PREFERENCES ── */}
          {currentTab === "preferences" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Radar Interface Palette */}
              <div className="rounded-none border-2 border-rule bg-[#18181B] text-foreground p-6 shadow-[6px_6px_0px_0px_#000000] space-y-6">
                <div className="border-b-2 border-rule pb-3 flex items-center gap-2">
                  <Sliders className="size-5 text-accent" />
                  <h3 className="font-mono text-sm font-black uppercase text-foreground">
                    SIMULATION & RADAR PALETTE
                  </h3>
                </div>

                <div className="space-y-2">
                  <label className="mono-label text-foreground/80 font-black">COLOR PALETTE</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["neon", "amber", "monochrome"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => updatePrefs({ theme: t })}
                        className={`h-11 border-2 font-mono text-xs font-black uppercase transition-all cursor-pointer ${
                          prefs.theme === t
                            ? "border-black bg-accent text-accent-foreground shadow-[3px_3px_0px_#000000]"
                            : "border-rule bg-black text-foreground shadow-[2px_2px_0px_#000000] hover:border-accent"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="mono-label text-foreground/80 font-black">
                    DEFAULT TARGET SUBNET
                  </label>
                  <select
                    value={prefs.defaultSector}
                    onChange={(e) => updatePrefs({ defaultSector: e.target.value as SectorId })}
                    className="w-full h-11 bg-black border-2 border-rule font-mono text-xs px-3 text-foreground shadow-[2px_2px_0px_#000000] focus:outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="power">Substation-07 (Power Grid)</option>
                    <option value="water">Basin Treatment-3 (Water)</option>
                    <option value="oil-gas">Seventh Breath Depot (Gas)</option>
                    <option value="manufacturing">Depot-4 Assembly (Manufacturing)</option>
                    <option value="port">Crane Array-14 (Port)</option>
                    <option value="smart-building">HVAC Core-B (Smart Building)</option>
                    <option value="smart-city">Feeder Loop-9 (Smart City)</option>
                  </select>
                </div>
              </div>

              {/* Toggles & GDPR Export */}
              <div className="rounded-none border-2 border-rule bg-[#18181B] text-foreground p-6 shadow-[6px_6px_0px_0px_#000000] space-y-6 flex flex-col justify-between">
                <div className="border-b-2 border-rule pb-3 flex items-center gap-2">
                  <Shield className="size-5 text-accent" />
                  <h3 className="font-mono text-sm font-black uppercase text-foreground">
                    DIAGNOSTICS & DOSSIER CONTROLS
                  </h3>
                </div>

                <div className="space-y-3 font-mono text-xs font-bold divide-y divide-rule/60">
                  <div className="flex items-center justify-between pb-3">
                    <span className="text-foreground">RADAR AUDIO TELEMETRY</span>
                    <input
                      type="checkbox"
                      checked={prefs.radarSound}
                      onChange={(e) => updatePrefs({ radarSound: e.target.checked })}
                      className="size-5 accent-accent border border-rule rounded-none cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-foreground">DIAGNOSTIC HAPTIC PULSES</span>
                    <input
                      type="checkbox"
                      checked={prefs.hapticFeedback}
                      onChange={(e) => updatePrefs({ hapticFeedback: e.target.checked })}
                      className="size-5 accent-accent border border-rule rounded-none cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-foreground">SIEM AUTO-EXPORT LOGS</span>
                    <input
                      type="checkbox"
                      checked={prefs.siemAutoExport}
                      onChange={(e) => updatePrefs({ siemAutoExport: e.target.checked })}
                      className="size-5 accent-accent border border-rule rounded-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t-2 border-rule">
                  <button
                    onClick={async () => {
                      try {
                        const data = await exportOperatorData();
                        const blob = new Blob([JSON.stringify(data, null, 2)], {
                          type: "application/json",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `operator_dossier_${operator.callsign.toLowerCase()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch (err: unknown) {
                        alert(`Export failed: ${(err as Error)?.message || String(err)}`);
                      }
                    }}
                    className="w-full h-11 bg-accent text-accent-foreground border-2 border-black font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000000] hover:bg-lime-300 active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="size-4 stroke-[2.5]" />
                    EXPORT FULL DOSSIER (GDPR JSON)
                  </button>

                  <button
                    onClick={async () => {
                      if (
                        confirm(
                          "⚠️ DANGER: PERMANENT ACCOUNT ERASURE\n\nThis will permanently delete your operator credentials, badge allocations, and all training history. Proceed?",
                        )
                      ) {
                        try {
                          await deleteOperatorAccount();
                          await handleLogout();
                        } catch (err: unknown) {
                          alert(`Erasure failed: ${(err as Error)?.message || String(err)}`);
                        }
                      }
                    }}
                    className="w-full h-11 bg-black text-foreground/80 border-2 border-rule font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#000000] hover:border-red-500 hover:text-red-400 active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Trash2 className="size-4 stroke-[2.5]" />
                    PERMANENT DE-REGISTRATION
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: OPERATOR CLEARANCE DOSSIER ── */}
          {currentTab === "dossier" && (
            <div className="rounded-none border-2 border-rule bg-[#18181B] text-foreground p-6 shadow-[6px_6px_0px_0px_#000000] max-w-2xl mx-auto space-y-6">
              <div className="border-b-2 border-rule pb-3">
                <h3 className="font-mono text-base font-black uppercase text-foreground">
                  ACTIVE OPERATOR CLEARANCE DOSSIER
                </h3>
                <p className="font-serif italic text-sm text-foreground/80 mt-1">
                  Cryptographic clearance record issued by TwinSec Cyber Command.
                </p>
              </div>

              <div className="border-2 border-rule divide-y divide-rule font-mono text-xs bg-black">
                <div className="p-4 flex justify-between items-center">
                  <span className="text-foreground/70">CALLSIGN:</span>
                  <span className="font-black text-sm px-3 py-1 border-2 border-accent bg-accent/20 text-accent">
                    {operator.callsign}
                  </span>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-foreground/70">BADGE NUMBER:</span>
                  <span className="font-black text-foreground">{operator.badgeId}</span>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-foreground/70">CLEARANCE:</span>
                  <span className="font-black text-xs px-2.5 py-1 border border-rule bg-[#18181B] text-foreground">
                    {operator.clearance}
                  </span>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-foreground/70">STATUS:</span>
                  <span className="flex items-center gap-1.5 font-black text-accent">
                    <CheckCircle className="size-4" />
                    ACTIVE TTY SESSION
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
