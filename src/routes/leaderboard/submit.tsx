import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useOperator } from "@/contexts/OperatorContext";
import { useEffect, useState, useCallback } from "react";
import { TwinSecLogo } from "@/components/branding/TwinSecLogo";
import {
  getTrainingRuns,
  submitToLeaderboard,
  getLeaderboardEntries,
  type TrainingRun,
} from "@/lib/api/training.functions";
import { log } from "@/lib/logger";
import { Trophy, ShieldCheck, Zap, ArrowRight, CheckCircle2, Award, LogIn } from "lucide-react";

export const Route = createFileRoute("/leaderboard/submit")({
  head: () => ({
    meta: [
      { title: "TwinSec — Global Cyber Range Leaderboard & Submission" },
      {
        name: "description",
        content:
          "Submit verified drill telemetry to the public range leaderboard and view global defender rankings.",
      },
    ],
  }),
  component: LeaderboardSubmitPage,
});

interface LeaderboardRecord {
  id: string;
  callsign: string;
  sector: string;
  adversary: string;
  score: number;
  mwShed: number;
  mttd: string;
  mttr: string;
  verified: boolean;
  createdAt: string;
}

function LeaderboardSubmitPage() {
  const navigate = useNavigate();
  const { operator, loading } = useOperator();

  const [runs, setRuns] = useState<TrainingRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardRecord[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");

  const loadRuns = useCallback(() => {
    if (operator?.loggedIn) {
      getTrainingRuns()
        .then((data) => {
          setRuns(data);
          setSelectedRunId((curr) => (curr ? curr : data[0]?.id || ""));
        })
        .catch((err) => {
          log.error("Failed to load operator training runs:", err);
        });
    }
  }, [operator?.loggedIn]);

  const loadLeaderboard = useCallback(() => {
    setLeaderboardLoading(true);
    getLeaderboardEntries({ data: { sector: sectorFilter } })
      .then((entries) => setLeaderboard(entries as LeaderboardRecord[]))
      .catch((err) => {
        log.error("Failed to load leaderboard entries:", err);
      })
      .finally(() => setLeaderboardLoading(false));
  }, [sectorFilter]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const handleSubmit = async () => {
    const run = runs.find((r) => r.id === selectedRunId);
    if (!run) return;

    setSubmitting(true);
    try {
      const res = await submitToLeaderboard({
        data: {
          trainingRunId: run.id,
          sector: run.sector,
          score: run.score,
          mwShed: run.mwShed,
          mttd: parseInt(run.mttd || "30") || 30,
          mttr: parseInt(run.mttr || "120") || 120,
          adversary: run.adversary,
        },
      });

      if (res.success) {
        setSubmittedId(res.id);
        loadLeaderboard();
      }
    } catch (err) {
      console.error("Leaderboard submission failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !operator || !operator.loggedIn) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono text-xs select-none">
        <div className="flex flex-col items-center gap-2">
          <div className="size-4 border-2 border-accent border-t-transparent animate-spin" />
          <span className="text-accent tracking-widest animate-pulse">
            VERIFYING OPERATOR CLEARANCE...
          </span>
        </div>
      </div>
    );
  }

  const selectedRun = runs.find((r) => r.id === selectedRunId);

  return (
    <main className="min-h-screen bg-background text-foreground select-none antialiased py-10 px-4 sm:px-6 lg:px-10 relative">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute inset-0 scanline pointer-events-none opacity-30" />

      <div className="max-w-[1400px] mx-auto space-y-10 relative z-10">
        {/* Top Header */}
        <div className="border-2 border-rule bg-[#18181B] p-6 shadow-[6px_6px_0px_0px_#000000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <TwinSecLogo className="size-12" />
            <div>
              <div className="flex items-center gap-2">
                <span className="mono-label text-accent font-black">GLOBAL RANGE COMPETITION</span>
                <span className="px-2 py-0.5 border border-accent bg-accent/20 text-accent font-mono text-xs font-bold uppercase">
                  VERIFIED AUDIT LOGS
                </span>
              </div>
              <h1 className="display text-4xl sm:text-5xl font-black tracking-tight text-foreground mt-1">
                DEFENDER LEADERBOARD & SUBMISSION
              </h1>
              <p className="font-serif italic text-sm text-foreground/80">
                Operating Call-Sign:{" "}
                <strong className="text-accent font-mono">
                  {operator?.callsign || "GUEST OPERATOR"}
                </strong>{" "}
                · Badge Serial:{" "}
                <strong className="text-foreground font-mono">
                  #{operator?.badgeId || "OP-0000"}
                </strong>
                {!operator?.loggedIn && (
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono font-black bg-warn text-black uppercase">
                    GUEST AUDIT
                  </span>
                )}
              </p>
            </div>
          </div>

          <Link
            to="/simulation"
            search={{ sector: "power" }}
            className="h-11 px-6 bg-accent text-accent-foreground border-2 border-black font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000000] hover:bg-lime-300 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Zap className="size-4 stroke-[2.5]" />
            <span>LAUNCH SIMULATION</span>
          </Link>
        </div>

        {/* 2-Column Layout: Submission Deck (Left) + Public Rankings (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Submission Card (4 cols) */}
          <div className="lg:col-span-5 rounded-none border-2 border-rule bg-[#18181B] p-6 shadow-[6px_6px_0px_0px_#000000] space-y-6">
            <div className="border-b-2 border-rule pb-3 flex items-center gap-2">
              <Trophy className="size-5 text-accent" />
              <h2 className="font-mono text-sm font-black uppercase text-foreground">
                SUBMIT VERIFIED DRILL RUN
              </h2>
            </div>

            {!operator?.loggedIn ? (
              <div className="p-6 border-2 border-warn bg-black text-center font-mono text-xs space-y-4 shadow-[4px_4px_0px_#000000]">
                <div className="inline-block bg-warn text-black px-2.5 py-1 text-[10px] font-black uppercase border border-black shadow-[2px_2px_0px_#000000]">
                  OPERATOR AUTHENTICATION REQUIRED
                </div>
                <p className="text-foreground/90 leading-relaxed font-bold">
                  Official national cyber range leaderboard qualification submissions require an
                  authenticated operator dossier.
                </p>
                <Link
                  to="/login"
                  search={{ from: "/leaderboard/submit" }}
                  className="inline-flex items-center gap-2 h-11 px-5 bg-accent text-accent-foreground border-2 border-black font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000000] hover:bg-lime-300 transition-transform active:translate-x-0.5 active:translate-y-0.5"
                >
                  <LogIn className="size-4 stroke-[2.5]" />
                  <span>SIGN-IN OR INITIALIZE DOSSIER →</span>
                </Link>
              </div>
            ) : runs.length === 0 ? (
              <div className="p-8 border-2 border-rule text-center font-mono text-xs space-y-4 bg-black">
                <p className="text-foreground/80">
                  NO COMPLETED DRILLS RECORDED IN YOUR DATABASE YET.
                </p>
                <Link
                  to="/simulation"
                  search={{ sector: "power" }}
                  className="inline-flex items-center gap-1.5 h-10 px-4 bg-accent text-accent-foreground border-2 border-black font-black uppercase"
                >
                  <Zap className="size-3.5" />
                  <span>RUN DRILL IN RANGE</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4 font-mono text-xs">
                <div>
                  <label className="mono-label text-foreground/80 font-black mb-1.5 block">
                    SELECT DRILL FROM YOUR LEDGER ({runs.length} AVAILABLE)
                  </label>
                  <select
                    value={selectedRunId}
                    onChange={(e) => {
                      setSelectedRunId(e.target.value);
                      setSubmittedId(null);
                    }}
                    className="w-full h-11 px-3 border-2 border-rule bg-black text-foreground font-mono text-xs focus:outline-none focus:border-accent"
                  >
                    {runs.map((r) => (
                      <option key={r.id} value={r.id}>
                        [{r.sector.toUpperCase()}] {r.adversary.slice(0, 30)} — {r.score}% (
                        {r.mwShed}MW)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRun && (
                  <div className="p-4 border-2 border-rule bg-black space-y-3">
                    <div className="flex items-center justify-between border-b border-rule/60 pb-2">
                      <span className="mono-label text-foreground/60">SECTOR</span>
                      <span className="px-2 py-0.5 border border-accent bg-accent/20 text-accent font-black uppercase">
                        {selectedRun.sector}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-rule/60 pb-2">
                      <span className="mono-label text-foreground/60">ADVERSARY</span>
                      <span className="font-bold text-foreground truncate max-w-[200px]">
                        {selectedRun.adversary}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-rule/60 pb-2">
                      <span className="mono-label text-foreground/60">SCORE</span>
                      <span className="text-accent font-black text-lg">{selectedRun.score}%</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-rule/60 pb-2">
                      <span className="mono-label text-foreground/60">MW SHED</span>
                      <span className="font-black text-foreground">{selectedRun.mwShed} MW</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="mono-label text-foreground/60">RESOLUTION</span>
                      <span className="text-foreground/80 truncate max-w-[200px]">
                        {selectedRun.branch}
                      </span>
                    </div>
                  </div>
                )}

                {submittedId ? (
                  <div className="p-4 border-2 border-green-500 bg-green-950/40 text-green-400 font-mono text-xs space-y-1.5 shadow-[3px_3px_0px_#000000]">
                    <div className="flex items-center gap-2 font-black">
                      <CheckCircle2 className="size-4" />
                      <span>DRILL COMMITTED TO GLOBAL LEADERBOARD!</span>
                    </div>
                    <p className="text-[11px] text-green-300/80">
                      Audit Ref: <strong>#{submittedId}</strong> · Callsign:{" "}
                      <strong>{operator.callsign}</strong>
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !selectedRun}
                    className="w-full h-12 bg-accent text-accent-foreground border-2 border-black font-mono text-xs font-black uppercase shadow-[4px_4px_0px_#000000] hover:bg-lime-300 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <Award className="size-4 stroke-[2.5]" />
                    <span>
                      {submitting ? "VERIFYING & COMMITTING..." : "COMMIT DRILL TO LEADERBOARD"}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Live Public Rankings Table (7 cols) */}
          <div className="lg:col-span-7 rounded-none border-2 border-rule bg-[#18181B] shadow-[6px_6px_0px_0px_#000000] overflow-hidden flex flex-col justify-between">
            <div className="p-4 bg-black text-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-rule">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-accent" />
                <span className="mono-label !text-foreground font-black">
                  LIVE GLOBAL DEFENDER RANKINGS
                </span>
              </div>

              {/* Sector Filter Pills */}
              <div className="flex flex-wrap items-center gap-1 font-mono text-xs">
                {["ALL", "power", "water", "oil-gas", "manufacturing", "port"].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setSectorFilter(sec)}
                    className={`px-2.5 py-1 font-black uppercase border transition-all cursor-pointer ${
                      sectorFilter === sec
                        ? "bg-accent text-accent-foreground border-black shadow-[2px_2px_0px_#000000]"
                        : "border-rule bg-[#18181B] text-foreground/80 hover:text-foreground"
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-rule bg-black/60 text-foreground/80 uppercase text-[11px] font-black">
                    <th className="p-4 w-12 text-center">Rank</th>
                    <th className="p-4">Operator</th>
                    <th className="p-4">Subnet</th>
                    <th className="p-4">Adversary</th>
                    <th className="p-4 text-right">MW Shed</th>
                    <th className="p-4 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule/60">
                  {leaderboardLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-foreground/60 italic font-mono"
                      >
                        FETCHING GLOBAL STANDINGS...
                      </td>
                    </tr>
                  ) : leaderboard.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-foreground/80 font-mono space-y-2"
                      >
                        <p className="font-bold">NO SUBMISSIONS YET IN THIS CATEGORY.</p>
                        <p className="text-xs text-foreground/60">
                          Be the first to submit your drill score above!
                        </p>
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((entry, idx) => (
                      <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 text-center font-black">
                          {idx === 0 ? (
                            <span className="text-amber-400">#1 🏆</span>
                          ) : idx === 1 ? (
                            <span className="text-slate-300">#2 🥈</span>
                          ) : idx === 2 ? (
                            <span className="text-amber-600">#3 🥉</span>
                          ) : (
                            <span className="text-foreground/60">#{idx + 1}</span>
                          )}
                        </td>
                        <td className="p-4 font-black text-foreground">
                          <span className="text-accent">{entry.callsign}</span>
                        </td>
                        <td className="p-4 uppercase font-bold text-xs">
                          <span className="px-2 py-0.5 border border-rule bg-black">
                            {entry.sector}
                          </span>
                        </td>
                        <td className="p-4 text-foreground/90 truncate max-w-[160px]">
                          {entry.adversary}
                        </td>
                        <td className="p-4 text-right tabular-nums font-bold text-foreground">
                          {entry.mwShed} MW
                        </td>
                        <td className="p-4 text-right tabular-nums font-black">
                          <span
                            className={`px-2 py-0.5 border text-xs font-black ${
                              entry.score >= 90
                                ? "border-accent bg-accent text-accent-foreground"
                                : "border-rule bg-black text-foreground"
                            }`}
                          >
                            {entry.score}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-black/60 border-t-2 border-rule flex items-center justify-between text-xs font-mono">
              <span className="text-foreground/60">
                Live SQLite Telemetry Layer · Cryptographically Signed
              </span>
              <Link
                to="/training-ledger"
                className="text-accent hover:underline flex items-center gap-1 font-bold"
              >
                <span>VIEW FULL AUDIT LEDGER</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
