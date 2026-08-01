import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useOperatorSession } from "@/lib/auth-store";
import { getTrainingRuns, getTrainingStats } from "@/lib/api/training.functions";
import { TwinSecLogo } from "@/components/TwinSecLogo";
import { log } from "@/lib/logger";

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
  const { session, loading } = useOperatorSession();
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

  useEffect(() => {
    if (loading) return;

    const loadData = async () => {
      setDataLoading(true);
      if (session.loggedIn) {
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
  }, [session.loggedIn, loading]);

  // Get unique sectors and adversaries for filter options
  const uniqueSectors = Array.from(new Set(records.map((r) => r.sector)));
  const uniqueAdversaries = Array.from(new Set(records.map((r) => r.adversary)));

  // Filter, search, and sort the records
  const processedRecords = records
    // Search
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
    // Sector filter
    .filter((r) => (sectorFilter === "all" ? true : r.sector === sectorFilter))
    // Adversary filter
    .filter((r) => (adversaryFilter === "all" ? true : r.adversary === adversaryFilter))
    // Sort
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
          // Extract seconds from "Xs" format
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

      {/* Header bar */}
      <header className="sticky top-0 z-50 border-b border-rule bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <TwinSecLogo className="size-6" />
            <Link
              to="/"
              className="display text-xl tracking-wide hover:text-accent transition-colors"
            >
              TwinSec
            </Link>
            <span className="mono-label hidden md:inline pl-3">TRAINING LEDGER</span>
          </div>
          <div className="flex items-center gap-6 mono-label text-xs">
            <Link
              to="/simulation"
              search={{ sector: "power" }}
              className="hover:text-accent transition-colors"
            >
              CYBER RANGE
            </Link>
            <Link to="/dashboard" className="hover:text-accent transition-colors">
              DASHBOARD
            </Link>
            {session.loggedIn && (
              <span className="text-accent border border-accent/30 bg-accent/10 px-3 py-1">
                {session.callsign}
              </span>
            )}
          </div>
        </div>
      </header>

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
          <span className="mono-label shrink-0 text-foreground/40 tabular-nums text-sm">
            {session.loggedIn ? "DATABASE_CONNECTED" : "OFFLINE_LOCAL_MODE"}
          </span>
        </div>

        {/* Aggregated Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border border-rule divide-y lg:divide-y-0 lg:divide-x divide-rule bg-background/95 backdrop-blur">
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
                <th className="p-4 text-center">Actions</th>
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
                      <a
                        href={rec.shareUrl}
                        className="bg-accent/10 border border-accent/30 text-accent px-3 py-1 hover:bg-accent hover:text-accent-foreground transition-colors font-bold inline-block"
                      >
                        REPLAY TRACE →
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
