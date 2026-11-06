import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { usePreferences, type SectorId } from "@/lib/auth-store";
import { useOperator } from "@/contexts/OperatorContext";
import { useEffect, useState, useCallback } from "react";
import { exportOperatorData, deleteOperatorAccount } from "@/lib/api/auth.functions";
import {
  getTrainingRuns,
  reseedBenchmarkDrills,
  type TrainingRun,
} from "@/lib/api/training.functions";
import { getGuestRuns } from "@/lib/guest-store";
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
  LogIn,
  Terminal,
  FileDown,
  RotateCcw,
  Eye,
  X,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "TwinSec — Operator Cyber Range Command Deck" },
      {
        name: "description",
        content:
          "Live telemetry, MITRE kill chain analysis, and historical drill logs for industrial cyber range operators.",
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
  const [selectedDrill, setSelectedDrill] = useState<TrainingRun | null>(null);
  const [reseedLoading, setReseedLoading] = useState(false);

  const loadRuns = useCallback(() => {
    setRunsLoading(true);
    getTrainingRuns()
      .then((data) => {
        const dbRuns = data || [];
        if (!operator?.loggedIn) {
          const guestRuns = getGuestRuns() as unknown as TrainingRun[];
          setRuns([...guestRuns, ...dbRuns]);
        } else {
          setRuns(dbRuns);
        }
      })
      .catch((err) => {
        log.error("Failed to load operator training runs:", err);
        if (!operator?.loggedIn) {
          setRuns(getGuestRuns() as unknown as TrainingRun[]);
        } else {
          setRuns([]);
        }
      })
      .finally(() => setRunsLoading(false));
  }, [operator?.loggedIn]);

  useEffect(() => {
    loadRuns();
    const handleGuestUpdate = () => loadRuns();
    window.addEventListener("twinsec-guest-updated", handleGuestUpdate);
    return () => window.removeEventListener("twinsec-guest-updated", handleGuestUpdate);
  }, [loadRuns]);

  const handleReseed = async () => {
    setReseedLoading(true);
    try {
      await reseedBenchmarkDrills();
      loadRuns();
    } catch (err) {
      log.error("Failed to reseed drills:", err);
    } finally {
      setReseedLoading(false);
    }
  };

  const exportCsv = () => {
    if (!activeOp.loggedIn) {
      navigate({ to: "/login", search: { from: "/dashboard" } });
      return;
    }
    if (filteredRuns.length === 0) return;
    // SECURITY: Sanitize CSV fields to prevent formula injection in spreadsheet applications
    const sanitizeCsvField = (val: string | number): string => {
      const s = String(val);
      if (/^[=+\-@\t\r]/.test(s)) return `'${s}`;
      return s;
    };
    const headers = [
      "Drill ID",
      "Timestamp",
      "Sector",
      "Adversary Vector",
      "MW Load Shed",
      "Mitigation Score",
      "Branch Resolution",
      "MTTD",
      "MTTR",
      "Cost Impact",
    ];
    const rows = filteredRuns.map((r) => [
      sanitizeCsvField(r.id),
      sanitizeCsvField(r.createdAt || r.timestamp || new Date().toISOString()),
      sanitizeCsvField(r.sector || "power"),
      `"${sanitizeCsvField((r.adversary || "APT Vector").replace(/"/g, '""'))}"`,
      sanitizeCsvField(r.mwShed ?? 0),
      `${sanitizeCsvField(r.score ?? 0)}%`,
      `"${sanitizeCsvField((r.branch || "Contained").replace(/"/g, '""'))}"`,
      sanitizeCsvField(r.mttd || "30s"),
      sanitizeCsvField(r.mttr || "120s"),
      sanitizeCsvField(r.cost || "$100k"),
    ]);
    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `twinsec_drill_audit_ledger_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login", search: { from: undefined } });
  };

  if (loading && !operator) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono text-xs select-none">
        <div className="flex flex-col items-center gap-3 p-8 border-2 border-black bg-[#18181B] shadow-[8px_8px_0px_0px_#BFFF2E]">
          <div className="size-6 border-3 border-accent border-t-transparent animate-spin" />
          <span className="mono-label text-accent font-black tracking-widest animate-pulse">
            SYNCHRONIZING TACTICAL TELEMETRY...
          </span>
        </div>
      </div>
    );
  }

  const activeOp = operator ?? {
    callsign: "GUEST OPERATOR",
    badgeId: "OP-0000",
    clearance: "UNCLASSIFIED · GUEST AUDIT",
    role: "guest",
    loggedIn: false,
  };

  const SECTOR_OPTIONS = [
    { id: "ALL", label: "ALL" },
    { id: "power", label: "POWER" },
    { id: "water", label: "WATER" },
    { id: "oil-gas", label: "OIL & GAS" },
    { id: "manufacturing", label: "FACTORY" },
    { id: "port", label: "PORT" },
    { id: "smart-building", label: "BLDG" },
    { id: "smart-city", label: "CITY" },
  ];

  const getSectorCount = (secId: string) => {
    if (secId === "ALL") return runs.length;
    return runs.filter((r) => r.sector === secId).length;
  };

  // Filtered runs based on sector and search query with null safety
  const filteredRuns = runs.filter((r) => {
    const matchesSector = filterSector === "ALL" || r.sector === filterSector;
    const adversaryText = (r.adversary || "").toLowerCase();
    const sectorText = (r.sector || "").toLowerCase();
    const branchText = (r.branch || "").toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q || adversaryText.includes(q) || sectorText.includes(q) || branchText.includes(q);
    return matchesSector && matchesSearch;
  });

  const totalRunsCount = runs.length;
  const avgScore =
    runs.length > 0
      ? Math.round(runs.reduce((acc, r) => acc + (r.score || 0), 0) / runs.length)
      : 0;
  const totalMwProtected = runs.length > 0 ? runs.reduce((acc, r) => acc + (r.mwShed || 0), 0) : 0;

  return (
    <main className="min-h-screen bg-background text-foreground select-none antialiased py-8 px-4 sm:px-6 lg:px-10 relative">
      {/* Blueprint Grid background */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute inset-0 scanline pointer-events-none opacity-30" />

      <div className="max-w-[1600px] mx-auto space-y-8 relative z-10">
        {/* ── GUEST MODE NOTIFICATION BANNER ── */}
        {!activeOp.loggedIn && (
          <div className="border-2 border-warn bg-[#18181B] text-foreground p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[4px_4px_0px_#000000]">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-warn text-black font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000]">
                GUEST AUDIT SESSION
              </span>
              <p className="font-mono text-xs text-foreground/90">
                Displaying live OT telemetry and verified benchmark qualification drills.
                {getGuestRuns().length > 0 ? (
                  <span className="text-accent font-bold ml-1">
                    [You have {getGuestRuns().length} un-synced guest drill
                    {getGuestRuns().length > 1 ? "s" : ""}]
                  </span>
                ) : (
                  " Authenticate to save personal runs to the permanent cloud ledger."
                )}
              </p>
            </div>
            <Link
              to="/login"
              search={{ from: "/dashboard" }}
              className="h-9 px-4 bg-accent text-accent-foreground border-2 border-black font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] hover:bg-lime-300 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>{getGuestRuns().length > 0 ? "CLAIM & SYNC RUNS →" : "OPERATOR SIGN-IN"}</span>
              <ArrowRight className="size-3.5 stroke-[2.5]" />
            </Link>
          </div>
        )}

        {/* ── 1. TOP OPERATOR CLEARANCE HEADER ── */}
        <div className="border-2 border-rule bg-[#18181B] text-foreground p-6 shadow-[6px_6px_0px_0px_#000000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Callsign Badge */}
            <div className="size-14 bg-black text-accent border-2 border-rule flex items-center justify-center font-mono font-black text-xl shadow-[3px_3px_0px_#000000]">
              {activeOp.callsign?.slice(0, 2).toUpperCase() || "OP"}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="mono-label text-accent uppercase font-black">
                  {activeOp.loggedIn ? "AUTHENTICATED OPERATOR TTY" : "GUEST OPERATOR TTY"}
                </span>
                <span className="px-2.5 py-0.5 border border-accent bg-accent/20 text-accent font-mono text-xs font-black uppercase">
                  {activeOp.clearance || "CLEARANCE: LVL-4"}
                </span>
              </div>
              <h1 className="display text-4xl sm:text-6xl font-black uppercase tracking-tight text-foreground leading-none mt-1">
                OPERATOR CALLSIGN: {activeOp.callsign}
              </h1>
              <p className="font-serif italic text-sm text-foreground/80 mt-1">
                Badge Serial:{" "}
                <strong className="text-foreground font-mono">#{activeOp.badgeId}</strong> ·
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

            {activeOp.loggedIn ? (
              <button
                onClick={handleLogout}
                className="h-11 px-4 bg-black text-foreground/80 border-2 border-rule font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_#000000] hover:border-red-500 hover:text-red-400 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="size-4 stroke-[2.5]" />
                <span>LOGOUT</span>
              </button>
            ) : (
              <Link
                to="/login"
                search={{ from: "/dashboard" }}
                className="h-11 px-4 bg-black text-foreground/80 border-2 border-rule font-mono text-xs font-bold uppercase shadow-[3px_3px_0px_#000000] hover:border-accent hover:text-accent active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="size-4 stroke-[2.5]" />
                <span>SIGN IN</span>
              </Link>
            )}
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

                {/* Sector Pills with Live Counts */}
                <div className="flex flex-wrap items-center gap-1 font-mono text-xs">
                  {SECTOR_OPTIONS.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => setFilterSector(sec.id)}
                      className={`px-3 py-1.5 font-black uppercase border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                        filterSector === sec.id
                          ? "bg-accent text-accent-foreground border-black shadow-[2px_2px_0px_#000000]"
                          : "border-rule bg-[#18181B] text-foreground/80 hover:text-foreground hover:border-accent"
                      }`}
                    >
                      <span>{sec.label}</span>
                      <span
                        className={`px-1 text-[10px] font-mono font-bold ${
                          filterSector === sec.id
                            ? "bg-black text-accent"
                            : "bg-white/10 text-foreground/70"
                        }`}
                      >
                        {getSectorCount(sec.id)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── TAB 1: IMMUTABLE DRILL HISTORY LEDGER ── */}
          {currentTab === "ledger" && (
            <div className="rounded-none border-2 border-rule bg-[#18181B] shadow-[6px_6px_0px_0px_#000000] overflow-hidden">
              <div className="p-4 bg-black text-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-rule">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileSpreadsheet className="size-4 text-accent" />
                  <span className="mono-label !text-foreground font-black">
                    VERIFIED OPERATOR DRILL AUDIT LEDGER
                  </span>
                  <span className="px-2 py-0.5 border border-accent bg-accent/20 text-accent font-mono text-[11px] font-black">
                    {filteredRuns.length} RECORDED DRILLS
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={exportCsv}
                    disabled={filteredRuns.length === 0}
                    className="h-9 px-3 bg-[#18181B] border-2 border-rule font-mono text-xs font-bold uppercase text-foreground hover:border-accent hover:text-accent disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_#000000] cursor-pointer"
                    title="Export verified audit log to CSV for SIEM / compliance reporting"
                  >
                    <FileDown className="size-3.5 stroke-[2.5]" />
                    <span>EXPORT CSV</span>
                  </button>

                  <button
                    onClick={handleReseed}
                    disabled={reseedLoading}
                    className="h-9 px-3 bg-[#18181B] border-2 border-rule font-mono text-xs font-bold uppercase text-foreground hover:border-accent hover:text-accent disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_#000000] cursor-pointer"
                    title="Re-seed 18 benchmark drills"
                  >
                    <RotateCcw
                      className={`size-3.5 stroke-[2.5] ${reseedLoading ? "animate-spin" : ""}`}
                    />
                    <span>{reseedLoading ? "SEEDING..." : "RE-SEED BENCHMARKS"}</span>
                  </button>
                </div>
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
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={handleReseed}
                              className="inline-flex items-center gap-2 h-11 px-5 bg-black text-foreground border-2 border-rule font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000000] hover:border-accent hover:text-accent cursor-pointer"
                            >
                              <RotateCcw className="size-4 stroke-[2.5]" />
                              <span>LOAD 18 BENCHMARK DRILLS</span>
                            </button>
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
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRuns.map((r) => (
                        <tr key={r.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 whitespace-nowrap text-foreground font-medium">
                            <div className="flex items-center gap-2">
                              {r.id.startsWith("TR-GUEST") && (
                                <span className="px-1.5 py-0.5 text-[9px] font-black bg-warn text-black border border-black uppercase shadow-[1px_1px_0px_#000000]">
                                  LOCAL GUEST
                                </span>
                              )}
                              <span>{new Date(r.createdAt || r.timestamp).toLocaleString()}</span>
                            </div>
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
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setSelectedDrill(r)}
                                className="h-8 px-2.5 bg-black border-2 border-rule text-foreground font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#000000] hover:border-accent hover:text-accent transition-all inline-flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                                title="Inspect drill telemetry"
                              >
                                <Eye className="size-3" />
                                <span className="hidden sm:inline">INSPECT</span>
                              </button>
                              <a
                                href={r.shareUrl}
                                className="h-8 px-2.5 bg-black border-2 border-rule text-foreground font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#000000] hover:border-accent hover:text-accent transition-all inline-flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5"
                              >
                                REPLAY <ArrowRight className="size-3" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── DRILL INSPECTION MODAL (NEO-BRUTALIST TACTICAL OVERLAY) ── */}
          {selectedDrill && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="border-3 border-black bg-[#18181B] text-foreground w-full max-w-2xl shadow-[8px_8px_0px_0px_#BFFF2E] overflow-hidden">
                {/* Modal Header */}
                <div className="p-4 bg-black border-b-2 border-rule flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-3 bg-accent" />
                    <span className="mono-label !text-accent font-black">
                      DRILL TELEMETRY AUDIT · {selectedDrill.id}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedDrill(null)}
                    className="p-1 border border-rule hover:border-accent text-foreground/80 hover:text-accent cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                  <div className="border-b border-rule pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 border border-accent bg-accent/20 text-accent font-mono text-xs font-black uppercase">
                        {selectedDrill.sector.toUpperCase()} SECTOR
                      </span>
                      <span className="mono-label text-foreground/60">
                        {new Date(
                          selectedDrill.createdAt || selectedDrill.timestamp,
                        ).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="display text-2xl sm:text-3xl font-black uppercase text-foreground">
                      {selectedDrill.adversary}
                    </h3>
                    <p className="font-mono text-xs text-accent mt-1">
                      {selectedDrill.attackChain || "ICS/SCADA Cyber-Physical Intrusion Drill"}
                    </p>
                  </div>

                  {/* 4 Metric Blocks */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 border-2 border-rule bg-black">
                      <p className="mono-label text-[10px] text-foreground/60">SCORE</p>
                      <p className="font-mono text-2xl font-black text-accent mt-0.5">
                        {selectedDrill.score}%
                      </p>
                    </div>
                    <div className="p-3 border-2 border-rule bg-black">
                      <p className="mono-label text-[10px] text-foreground/60">MW SHED</p>
                      <p className="font-mono text-2xl font-black text-foreground mt-0.5">
                        {selectedDrill.mwShed} MW
                      </p>
                    </div>
                    <div className="p-3 border-2 border-rule bg-black">
                      <p className="mono-label text-[10px] text-foreground/60">MTTD</p>
                      <p className="font-mono text-2xl font-black text-foreground mt-0.5">
                        {selectedDrill.mttd || "30s"}
                      </p>
                    </div>
                    <div className="p-3 border-2 border-rule bg-black">
                      <p className="mono-label text-[10px] text-foreground/60">MTTR</p>
                      <p className="font-mono text-2xl font-black text-foreground mt-0.5">
                        {selectedDrill.mttr || "120s"}
                      </p>
                    </div>
                  </div>

                  {/* Resolution Summary */}
                  <div className="p-4 border-2 border-rule bg-black/40 space-y-2">
                    <span className="mono-label text-accent font-black">BRANCH RESOLUTION</span>
                    <p className="font-mono text-sm text-foreground font-bold">
                      {selectedDrill.branch}
                    </p>
                    <p className="font-mono text-xs text-foreground/70">
                      Estimated Financial Cost Impact:{" "}
                      <strong>{selectedDrill.cost || "$100k"}</strong>
                    </p>
                  </div>

                  {/* Isolated Nodes */}
                  {selectedDrill.isolatedNodes && selectedDrill.isolatedNodes.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="mono-label text-foreground/60">
                        AIR-GAPPED / ISOLATED NODES:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedDrill.isolatedNodes.map((node) => (
                          <span
                            key={node}
                            className="px-2 py-0.5 border border-red-500/60 bg-red-950/40 text-red-400 font-mono text-xs font-bold"
                          >
                            {node} [AIR-GAPPED]
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-black border-t-2 border-rule flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedDrill(null)}
                    className="h-10 px-4 bg-[#18181B] border-2 border-rule font-mono text-xs font-bold uppercase text-foreground hover:border-foreground cursor-pointer"
                  >
                    CLOSE
                  </button>
                  <a
                    href={selectedDrill.shareUrl}
                    className="h-10 px-6 bg-accent text-accent-foreground border-2 border-black font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000000] hover:bg-lime-300 flex items-center gap-2 cursor-pointer"
                  >
                    <span>LAUNCH REPLAY IN RANGE</span>
                    <ArrowRight className="size-3.5 stroke-[2.5]" />
                  </a>
                </div>
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
                        a.download = `operator_dossier_${activeOp.callsign.toLowerCase()}.json`;
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
                    {activeOp.callsign}
                  </span>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-foreground/70">BADGE NUMBER:</span>
                  <span className="font-black text-foreground">{activeOp.badgeId}</span>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-foreground/70">CLEARANCE:</span>
                  <span className="font-black text-xs px-2.5 py-1 border border-rule bg-[#18181B] text-foreground">
                    {activeOp.clearance}
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
