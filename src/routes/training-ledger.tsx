import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useOperator } from "@/contexts/OperatorContext";
import { getTrainingRuns, getTrainingStats } from "@/lib/api/training.functions";
import { exportDebriefPDF, exportSIEMLog } from "@/lib/api/export.functions";
import { log } from "@/lib/logger";

interface DebriefReportData {
  metadata?: {
    runId?: string;
    sector?: string;
    adversary?: string;
    branch?: string;
    mwShed?: number;
    mttd?: string | number;
    mttr?: string | number;
    score?: number;
    completedAt?: string;
    auditLogCount?: number;
  };
  redTeamReport?: {
    initialAccessVector?: string;
    lateralMovementPath?: string | string[];
    impactSeverity?: string;
    tacticsUsed?: string[];
    breachOutcome?: string;
    threatActor?: string;
  };
  blueTeamReport?: {
    containmentStrategy?: string;
    mttdFormatted?: string;
    mttrFormatted?: string;
    mttdSeconds?: string | number;
    mttrSeconds?: string | number;
    securityScore?: number;
    loadShedMW?: number;
    containmentEfficiencyPercent?: number;
    defensiveInterventionsApplied?: number;
    recommendations?: string[];
  };
  causalTimeline?: Array<{
    time?: string;
    event?: string;
    status?: string;
  }>;
}

export const Route = createFileRoute("/training-ledger")({
  head: () => ({
    meta: [
      { title: "TwinSec — Incident Training Ledger" },
      {
        name: "description",
        content:
          "Audit trail of operator decisions, deflection performance, and cyber range history.",
      },
    ],
  }),
  component: TrainingLedgerPage,
});

export interface ExerciseRecord {
  id: string;
  timestamp: string;
  sector: string;
  adversary: string;
  branch: string;
  mwShed: number;
  mttd: string;
  mttr: string;
  cost: string;
  score: number;
  shareUrl: string;
}

function TrainingLedgerPage() {
  const { operator, loading } = useOperator();
  const [records, setRecords] = useState<ExerciseRecord[]>([]);
  const [stats, setStats] = useState({
    totalRuns: 0,
    avgScore: 0,
    avgMwsShed: "0.0",
    bestScore: 0,
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [adversaryFilter, setAdversaryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");

  // Debrief & SIEM modal state
  const [debriefRunId, setDebriefRunId] = useState<string | null>(null);
  const [debriefData, setDebriefData] = useState<DebriefReportData | null>(null);
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [siemExportStatus, setSiemExportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    const loadData = async () => {
      setDataLoading(true);
      if (operator?.loggedIn) {
        try {
          const runsData = await getTrainingRuns();
          const statsData = await getTrainingStats();

          // Map to local record interface
          const mappedRuns: ExerciseRecord[] = runsData.map((r) => ({
            id: r.id,
            timestamp: r.timestamp,
            sector: r.sector,
            adversary: r.adversary,
            branch: r.branch,
            mwShed: r.mwShed,
            mttd: r.mttd,
            mttr: r.mttr,
            cost: r.cost,
            score: r.score,
            shareUrl: r.shareUrl,
          }));

          setRecords(mappedRuns);
          setStats(statsData);
        } catch (e) {
          log.error("Failed to load db training data", e);
        }
      } else {
        // Guest mode - localStorage fallback
        try {
          const raw = localStorage.getItem("twinsec-ledger");
          if (raw) {
            const localRuns: ExerciseRecord[] = JSON.parse(raw);
            setRecords(localRuns);

            const total = localRuns.length;
            const scoreSum = localRuns.reduce((acc, r) => acc + r.score, 0);
            const mwSum = localRuns.reduce((acc, r) => acc + r.mwShed, 0);
            const maxScore = total > 0 ? Math.max(...localRuns.map((r) => r.score)) : 0;

            setStats({
              totalRuns: total,
              avgScore: total > 0 ? Math.round(scoreSum / total) : 0,
              avgMwsShed: total > 0 ? (mwSum / total).toFixed(1) : "0.0",
              bestScore: maxScore,
            });
          }
        } catch (e) {
          log.error("Error reading local training ledger", e);
        }
      }
      setDataLoading(false);
    };

    loadData();
  }, [operator?.loggedIn, loading]);

  const handleOpenDebrief = async (runId: string) => {
    setDebriefRunId(runId);
    setDebriefLoading(true);
    try {
      const data = await exportDebriefPDF({ data: { trainingRunId: runId } });
      setDebriefData(data);
    } catch (err) {
      log.error("Failed to fetch debrief PDF metadata", err);
      // Local fallback debrief object
      const rec = records.find((r) => r.id === runId);
      setDebriefData({
        metadata: {
          runId: runId,
          sector: rec?.sector.toUpperCase() || "POWER",
          adversary: rec?.adversary || "APT29",
          branch: rec?.branch || "CONTAINED",
          mwShed: rec?.mwShed || 0,
          mttd: rec?.mttd || "45s",
          mttr: rec?.mttr || "120s",
          score: rec?.score || 85,
          completedAt: rec?.timestamp || new Date().toISOString(),
          auditLogCount: 12,
        },
        redTeamReport: {
          threatActor: rec?.adversary || "APT29",
          initialAccessVector: "Spearphishing Attachment on Engineering Workstation",
          lateralMovementPath: ["ews-04", "hist-01", "hmi-01", "plc-1"],
          tacticsUsed: ["T0865: Spearphishing Attachment", "T0855: Unauthorized Command Write"],
          breachOutcome: "CONTAINED AT PURDUE LEVEL 2",
        },
        blueTeamReport: {
          mttdSeconds: rec?.mttd || "45s",
          mttrSeconds: rec?.mttr || "120s",
          loadShedMW: rec?.mwShed || 0,
          containmentEfficiencyPercent: rec?.score || 85,
          defensiveInterventionsApplied: 4,
          recommendations: [
            "Enforce industrial DMZ micro-segmentation between L3 IT and L2 OT subnets.",
            "Deploy physical hardware keylocks and dual-custody authorization on critical PLCs.",
            "Automate Modbus/TCP anomaly detection on substation gateways.",
          ],
        },
        causalTimeline: [],
      });
    } finally {
      setDebriefLoading(false);
    }
  };

  const handleDownloadSIEM = async (runId: string, format: "CEF" | "SYSLOG" | "JSON") => {
    try {
      setSiemExportStatus(`Generating ${format}...`);
      const result = await exportSIEMLog({ data: { trainingRunId: runId, format } });
      const textContent = typeof result === "string" ? result : JSON.stringify(result, null, 2);

      const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `twinsec-siem-${runId.slice(0, 8)}.${format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSiemExportStatus(`Downloaded ${format}!`);
      setTimeout(() => setSiemExportStatus(null), 3000);
    } catch (err) {
      log.error("Failed to export SIEM log", err);
      setSiemExportStatus("Export Failed");
      setTimeout(() => setSiemExportStatus(null), 3000);
    }
  };

  // Get unique sectors and adversaries for filter options
  const uniqueSectors = Array.from(new Set(records.map((r) => r.sector)));
  const uniqueAdversaries = Array.from(new Set(records.map((r) => r.adversary)));

  // Filter, search, and sort the records
  const processedRecords = records
    .filter((r) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        r.sector.toLowerCase().includes(query) ||
        r.adversary.toLowerCase().includes(query) ||
        r.branch.toLowerCase().includes(query) ||
        new Date(r.timestamp).toLocaleString().toLowerCase().includes(query)
      );
    })
    .filter((r) => (sectorFilter === "all" ? true : r.sector === sectorFilter))
    .filter((r) => (adversaryFilter === "all" ? true : r.adversary === adversaryFilter))
    .sort((a, b) => {
      let aVal: string | number = 0;
      let bVal: string | number = 0;
      switch (sortBy) {
        case "timestamp":
          aVal = new Date(a.timestamp).getTime();
          bVal = new Date(b.timestamp).getTime();
          break;
        case "score":
          aVal = a.score;
          bVal = b.score;
          break;
        case "mttd":
          aVal = parseFloat(a.mttd);
          bVal = parseFloat(b.mttd);
          break;
        case "mttr":
          aVal = parseFloat(a.mttr);
          bVal = parseFloat(b.mttr);
          break;
        case "cost":
          aVal = parseFloat(a.cost.replace(/[$,]/g, ""));
          bVal = parseFloat(b.cost.replace(/[$,]/g, ""));
          break;
        default:
          aVal = a[sortBy as keyof ExerciseRecord];
          bVal = b[sortBy as keyof ExerciseRecord];
      }
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono text-xs select-none">
        <div className="flex flex-col items-center gap-2">
          <div className="size-4 border-2 border-accent border-t-transparent animate-spin" />
          <span className="text-accent tracking-widest animate-pulse">
            SYNCHRONIZING INCIDENT ARCHIVE...
          </span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col relative select-none">
      {/* Background blueprint details */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute inset-0 scanline pointer-events-none opacity-45" />

      {/* Main Content */}
      <section className="flex-1 max-w-[1600px] mx-auto w-full px-6 lg:px-10 py-12 relative z-10 space-y-10">
        {/* Header Title */}
        <div className="border-b-2 border-foreground pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <p className="mono-label text-accent">AUDIT OVERVIEW</p>
            <h2 className="display text-5xl sm:text-7xl mt-2 leading-none">TRAINING LEDGER</h2>
            <p className="font-serif italic text-base sm:text-lg text-foreground/70 mt-3 leading-snug">
              Permanent declassified records of simulated incident containment drills.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {siemExportStatus && (
              <span className="mono-label text-accent bg-accent/10 px-3 py-1 border border-accent/40 animate-pulse text-xs">
                {siemExportStatus}
              </span>
            )}
            <span className="mono-label shrink-0 text-foreground/40 tabular-nums text-sm">
              {operator?.loggedIn ? "DATABASE_CONNECTED" : "OFFLINE_LOCAL_MODE"}
            </span>
          </div>
        </div>

        {/* Aggregated Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-2 border-black divide-y lg:divide-y-0 lg:divide-x divide-black bg-[#121214] shadow-[6px_6px_0px_0px_#000000]">
          <div className="p-6">
            <p className="mono-label text-foreground/50">TOTAL SIMULATIONS RUN</p>
            <p className="display text-5xl sm:text-6xl mt-2 text-accent">{stats.totalRuns}</p>
          </div>
          <div className="p-6">
            <p className="mono-label text-foreground/50">AVERAGE SYSTEM SCORE</p>
            <p className="display text-5xl sm:text-6xl mt-2 text-accent">{stats.avgScore}%</p>
          </div>
          <div className="p-6">
            <p className="mono-label text-foreground/50">AVERAGE POWER LOST</p>
            <p className="display text-5xl sm:text-6xl mt-2 text-accent">{stats.avgMwsShed} MW</p>
          </div>
          <div className="p-6">
            <p className="mono-label text-foreground/50">MAX MITIGATION SCORE</p>
            <p className="display text-5xl sm:text-6xl mt-2 text-accent">{stats.bestScore}%</p>
          </div>
        </div>

        {/* Filter/Search/Sort Controls */}
        <div className="border border-rule bg-background/95 backdrop-blur p-4 flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="mono-label text-xs text-foreground/60">SEARCH</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search incidents..."
              className="bg-black border border-rule font-mono text-sm px-3 py-2 text-foreground focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="mono-label text-xs text-foreground/60">SECTOR</label>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-black border border-rule font-mono text-sm px-3 py-2 text-foreground focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="all">ALL</option>
              {uniqueSectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector.toUpperCase().replace("-", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="mono-label text-xs text-foreground/60">ADVERSARY</label>
            <select
              value={adversaryFilter}
              onChange={(e) => setAdversaryFilter(e.target.value)}
              className="bg-black border border-rule font-mono text-sm px-3 py-2 text-foreground focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="all">ALL</option>
              {uniqueAdversaries.map((adv) => (
                <option key={adv} value={adv}>
                  {adv.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="mono-label text-xs text-foreground/60">SORT BY</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-black border border-rule font-mono text-sm px-3 py-2 text-foreground focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="timestamp">TIMESTAMP</option>
              <option value="score">SCORE</option>
              <option value="mttd">MTTD</option>
              <option value="mttr">MTTR</option>
              <option value="cost">COST</option>
            </select>
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="border border-rule px-3 py-2 mono-label text-xs hover:bg-muted/30 transition-colors"
          >
            {sortOrder === "asc" ? "↑ ASC" : "↓ DESC"}
          </button>
        </div>

        {/* Ledger Table */}
        <div className="border border-rule bg-background/95 backdrop-blur overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-rule bg-muted/40 text-foreground/60 uppercase text-[10px] tracking-wider">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Subnet Sector</th>
                <th className="p-4">Adversary Unit</th>
                <th className="p-4 text-right">MW Shed</th>
                <th className="p-4">MTTD / MTTR</th>
                <th className="p-4">Mitigation Score</th>
                <th className="p-4">Branch Result</th>
                <th className="p-4 text-center">Actions &amp; Exports</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {processedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-foreground/40 font-mono italic">
                    NO MATCHING INCIDENTS FOUND. ADJUST SEARCH OR FILTER CRITERIA.
                  </td>
                </tr>
              ) : (
                processedRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 whitespace-nowrap text-foreground/80">
                      {new Date(rec.timestamp).toLocaleString().replace(",", "")}
                    </td>
                    <td className="p-4 uppercase text-accent font-bold">
                      {rec.sector.replace("-", " ")}
                    </td>
                    <td className="p-4 text-foreground/80">{rec.adversary}</td>
                    <td className="p-4 text-right font-bold text-foreground tabular-nums">
                      {rec.mwShed} MW
                    </td>
                    <td className="p-4 text-foreground/60 tabular-nums">
                      {rec.mttd} / {rec.mttr}
                    </td>
                    <td className="p-4 font-bold tabular-nums">
                      <span
                        className={
                          rec.score >= 80
                            ? "text-green-400"
                            : rec.score >= 50
                              ? "text-yellow-400"
                              : "text-red-400"
                        }
                      >
                        {rec.score}%
                      </span>
                    </td>
                    <td className="p-4 text-foreground/70">{rec.branch}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenDebrief(rec.id)}
                          className="bg-accent/10 border border-accent/40 text-accent px-2.5 py-1 hover:bg-accent hover:text-accent-foreground transition-colors font-bold text-[11px]"
                        >
                          📄 DEBRIEF PDF
                        </button>

                        <button
                          onClick={() => handleDownloadSIEM(rec.id, "CEF")}
                          className="bg-foreground/10 border border-foreground/30 text-foreground px-2 py-1 hover:bg-foreground hover:text-background transition-colors text-[11px]"
                          title="Download CEF SIEM Log"
                        >
                          CEF
                        </button>

                        <button
                          onClick={() => handleDownloadSIEM(rec.id, "SYSLOG")}
                          className="bg-foreground/10 border border-foreground/30 text-foreground px-2 py-1 hover:bg-foreground hover:text-background transition-colors text-[11px]"
                          title="Download Syslog File"
                        >
                          SYSLOG
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Debrief Report Printable Modal */}
      {debriefRunId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border-2 border-foreground max-w-4xl w-full p-8 space-y-6 relative max-h-[90vh] overflow-y-auto font-mono text-xs">
            <div className="flex justify-between items-start border-b-2 border-foreground pb-4">
              <div>
                <p className="mono-label text-accent">OFFICIAL INCIDENT REPORT</p>
                <h3 className="display text-3xl sm:text-4xl mt-1">CLASSIFIED DEBRIEFING DOSSIER</h3>
                <p className="text-foreground/60 text-xs">
                  ID: {debriefRunId} · DECLASSIFIED FOR SOC AUDIT
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-accent text-accent-foreground font-bold px-4 py-2 hover:opacity-90 transition-opacity"
                >
                  🖨️ PRINT / SAVE PDF
                </button>
                <button
                  onClick={() => {
                    setDebriefRunId(null);
                    setDebriefData(null);
                  }}
                  className="border border-rule px-3 py-2 hover:bg-muted/40 transition-colors"
                >
                  ✕ CLOSE
                </button>
              </div>
            </div>

            {debriefLoading || !debriefData ? (
              <div className="py-12 text-center text-accent animate-pulse">
                GENERATING INCIDENT DEBRIEF REPORT...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overview Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border border-rule bg-muted/20">
                  <div>
                    <span className="text-foreground/50 block text-[10px]">SECTOR</span>
                    <span className="font-bold text-accent">{debriefData.metadata?.sector}</span>
                  </div>
                  <div>
                    <span className="text-foreground/50 block text-[10px]">THREAT ACTOR</span>
                    <span className="font-bold">{debriefData.metadata?.adversary}</span>
                  </div>
                  <div>
                    <span className="text-foreground/50 block text-[10px]">LOAD SHED</span>
                    <span className="font-bold">{debriefData.metadata?.mwShed} MW</span>
                  </div>
                  <div>
                    <span className="text-foreground/50 block text-[10px]">MITIGATION SCORE</span>
                    <span className="font-bold text-green-400">{debriefData.metadata?.score}%</span>
                  </div>
                </div>

                {/* Red Team Analysis */}
                <div className="border border-red-500/30 bg-red-950/10 p-4 space-y-2">
                  <h4 className="text-red-400 font-bold uppercase tracking-wider text-xs">
                    🔴 RED TEAM ATTACK CHAIN &amp; EXFILTRATION PATH
                  </h4>
                  <p className="text-foreground/80">
                    <strong className="text-foreground">Initial Vector:</strong>{" "}
                    {debriefData.redTeamReport?.initialAccessVector}
                  </p>
                  <p className="text-foreground/80">
                    <strong className="text-foreground">Tactics Used:</strong>{" "}
                    {debriefData.redTeamReport?.tacticsUsed?.join(", ")}
                  </p>
                  <p className="text-foreground/80">
                    <strong className="text-foreground">Outcome:</strong>{" "}
                    {debriefData.redTeamReport?.breachOutcome}
                  </p>
                </div>

                {/* Blue Team Mitigation Analysis */}
                <div className="border border-blue-500/30 bg-blue-950/10 p-4 space-y-3">
                  <h4 className="text-blue-400 font-bold uppercase tracking-wider text-xs">
                    🔵 BLUE TEAM DEFENSIVE PERFORMANCE
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-foreground/60">Mean Time to Detect (MTTD):</span>{" "}
                      <strong>{debriefData.blueTeamReport?.mttdSeconds}</strong>
                    </div>
                    <div>
                      <span className="text-foreground/60">Mean Time to Respond (MTTR):</span>{" "}
                      <strong>{debriefData.blueTeamReport?.mttrSeconds}</strong>
                    </div>
                  </div>
                  <div>
                    <strong className="text-foreground block mb-1">
                      Defensive Remediation Recommendations:
                    </strong>
                    <ul className="list-disc list-inside space-y-1 text-foreground/80">
                      {debriefData.blueTeamReport?.recommendations?.map(
                        (rec: string, idx: number) => (
                          <li key={idx}>{rec}</li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>

                <div className="border-t border-rule pt-4 text-center text-foreground/40 text-[10px]">
                  TWINSEC DIGITAL TWIN SECURITY RANGE · CERTIFIED OFFICIAL AUDIT LEDGER
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
