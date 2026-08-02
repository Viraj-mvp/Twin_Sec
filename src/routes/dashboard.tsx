import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { usePreferences, type SectorId } from "@/lib/auth-store";
import { useOperator } from "@/contexts/OperatorContext";
import { useEffect, useState } from "react";
import { exportOperatorData, deleteOperatorAccount } from "@/lib/api/auth.functions";
import { getTrainingRuns, type TrainingRun } from "@/lib/api/training.functions";
import { TwinSecLogo } from "@/components/TwinSecLogo";
import { log } from "@/lib/logger";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "TwinSec — Operator Dashboard & History" },
      {
        name: "description",
        content: "Personal training history, operator clearance records, and interface controls.",
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
        <div className="flex flex-col items-center gap-2">
          <div className="size-4 border-2 border-accent border-t-transparent animate-spin" />
          <span className="text-accent tracking-widest animate-pulse">
            AUTHENTICATING OPERATOR DASHBOARD...
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

      {/* Main Container */}
      <section className="flex-1 max-w-[1600px] mx-auto w-full px-6 lg:px-10 py-10 space-y-10 relative z-10">
        {/* Top Info Banner */}
        <div className="border-b-2 border-foreground pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <p className="mono-label text-accent uppercase">AUTHENTICATED OPERATOR TTY</p>
            <h1 className="display text-4xl sm:text-6xl mt-2 leading-none">
              CALLSIGN: {operator.callsign}
            </h1>
            <p className="font-serif italic text-base text-foreground/70 mt-2">
              Classified clearance level: {operator.clearance} · Serial Badge: {operator.badgeId}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="mono-label border border-red-500/50 hover:bg-red-500 hover:text-white text-red-400 px-4 py-2 text-xs transition-colors"
          >
            TERMINATE SESSION
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-12 gap-8 lg:gap-12">
          {/* Left column: Operator Record & Settings */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
            <div className="border border-rule bg-background/95 p-6 backdrop-blur flex flex-col gap-4">
              <p className="mono-label text-accent">CREDENTIALS</p>
              <div className="border border-rule font-mono text-xs divide-y divide-rule">
                <div className="p-3 flex justify-between">
                  <span className="text-foreground/40">CALLSIGN:</span>
                  <span className="font-bold text-accent">{operator.callsign}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-foreground/40">BADGE NO:</span>
                  <span className="text-foreground">{operator.badgeId}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-foreground/40">CLEARANCE:</span>
                  <span className="text-accent">{operator.clearance}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-foreground/40">STATUS:</span>
                  <span className="text-green-400 font-bold flex items-center gap-1.5">
                    <span className="size-1.5 bg-green-400 animate-pulse rounded-full" /> ACTIVE
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-rule bg-background/95 p-6 backdrop-blur flex flex-col gap-6">
              <p className="mono-label text-accent">SYSTEM PREFERENCES</p>

              {/* Theme */}
              <div className="flex flex-col gap-2">
                <label className="mono-label text-xs">RADAR PALETTE</label>
                <div className="grid grid-cols-3 border border-rule divide-x divide-rule">
                  {(["neon", "amber", "monochrome"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => updatePrefs({ theme: t })}
                      className={`py-2 font-mono text-xs font-bold transition-all ${
                        prefs.theme === t ? "bg-accent text-accent-foreground" : "hover:bg-muted/40"
                      }`}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Sector */}
              <div className="flex flex-col gap-2">
                <label className="mono-label text-xs">DEFAULT TARGET SUBNET</label>
                <select
                  value={prefs.defaultSector}
                  onChange={(e) => updatePrefs({ defaultSector: e.target.value as SectorId })}
                  className="bg-black border border-rule font-mono text-xs px-3 py-2 text-foreground focus:outline-none focus:border-accent cursor-pointer"
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

              {/* Toggles */}
              <div className="space-y-3 pt-2 text-xs font-mono">
                <div className="flex items-center justify-between border-b border-rule pb-2">
                  <span>RADAR SOUNDS</span>
                  <input
                    type="checkbox"
                    checked={prefs.radarSound}
                    onChange={(e) => updatePrefs({ radarSound: e.target.checked })}
                    className="accent-accent"
                  />
                </div>
                <div className="flex items-center justify-between border-b border-rule pb-2">
                  <span>DIAGNOSTIC HAPTICS</span>
                  <input
                    type="checkbox"
                    checked={prefs.hapticFeedback}
                    onChange={(e) => updatePrefs({ hapticFeedback: e.target.checked })}
                    className="accent-accent"
                  />
                </div>
                <div className="flex items-center justify-between border-b border-rule pb-2">
                  <span>SIEM DOSSIER BUNDLE</span>
                  <input
                    type="checkbox"
                    checked={prefs.siemAutoExport}
                    onChange={(e) => updatePrefs({ siemAutoExport: e.target.checked })}
                    className="accent-accent"
                  />
                </div>
              </div>

              {/* Export Data & Account deletion */}
              <div className="pt-4 border-t border-rule flex flex-col gap-2">
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
                  className="w-full border border-accent/40 bg-accent/5 hover:bg-accent hover:text-accent-foreground text-accent font-mono text-[10px] py-2.5 text-center transition-colors"
                >
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
                  className="w-full border border-red-500/50 hover:bg-red-600 hover:text-white text-red-400 font-mono text-[10px] py-2.5 text-center transition-colors"
                >
                  PERMANENT DE-REGISTRATION
                </button>
              </div>
            </div>
          </div>

          {/* Right column: Personal Training History */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            <div className="border border-rule bg-background/95 p-6 backdrop-blur flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="mono-label text-accent">PERSONAL DRILLS LEDGER</p>
                <h2 className="display text-3xl mt-1">TRAINING HISTORY RECORD</h2>
              </div>
              <div className="flex flex-wrap gap-2 font-mono text-[10px]">
                {["ALL", "power", "water", "oil-gas", "manufacturing", "port"].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setFilterSector(sec)}
                    className={`px-3 py-1 font-bold uppercase border transition-all ${
                      filterSector === sec
                        ? "bg-accent text-accent-foreground border-accent"
                        : "border-rule text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-rule bg-background/95 backdrop-blur overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-rule bg-muted/40 text-foreground/60 uppercase text-[10px] tracking-wider">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Subnet Sector</th>
                    <th className="p-4">Adversary</th>
                    <th className="p-4 text-right">MW Shed</th>
                    <th className="p-4">Score</th>
                    <th className="p-4">Branch Result</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {runsLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-foreground/40 italic">
                        LOADING PERSONAL TRAINING RUNS...
                      </td>
                    </tr>
                  ) : runs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-foreground/40 italic">
                        NO RECORDED DRILLS FOUND. LAUNCH A SIMULATION TO RECORD YOUR RUN.
                      </td>
                    </tr>
                  ) : (
                    runs
                      .filter((r) => filterSector === "ALL" || r.sector === filterSector)
                      .map((r) => (
                        <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-4 whitespace-nowrap text-foreground/80">
                            {new Date(r.createdAt || r.timestamp).toLocaleString()}
                          </td>
                          <td className="p-4 uppercase text-accent font-bold">
                            {r.sector.replace("-", " ")}
                          </td>
                          <td className="p-4 text-foreground/80">{r.adversary}</td>
                          <td className="p-4 text-right font-bold tabular-nums">{r.mwShed} MW</td>
                          <td className="p-4 font-bold tabular-nums">
                            <span
                              className={
                                r.score >= 80
                                  ? "text-green-400"
                                  : r.score >= 50
                                    ? "text-yellow-400"
                                    : "text-red-400"
                              }
                            >
                              {r.score}%
                            </span>
                          </td>
                          <td className="p-4 text-foreground/70">{r.branch}</td>
                          <td className="p-4 text-center">
                            <a
                              href={r.shareUrl}
                              className="bg-accent/10 border border-accent/30 text-accent px-3 py-1 hover:bg-accent hover:text-accent-foreground transition-colors font-bold inline-block"
                            >
                              REPLAY →
                            </a>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
