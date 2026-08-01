import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useOperator } from "@/contexts/OperatorContext";
import { useEffect } from "react";
import { TwinSecLogo } from "@/components/TwinSecLogo";

export const Route = createFileRoute("/leaderboard/submit")({
  head: () => ({
    meta: [
      { title: "TwinSec — Leaderboard Score Submission" },
      { name: "description", content: "Submit training score run to public leaderboard." },
    ],
  }),
  component: LeaderboardSubmitPage,
});

function LeaderboardSubmitPage() {
  const navigate = useNavigate();
  const { operator, loading } = useOperator();

  useEffect(() => {
    if (!loading && (!operator || !operator.loggedIn)) {
      navigate({ to: "/login", search: { from: "/leaderboard/submit" } });
    }
  }, [operator, loading, navigate]);

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

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative select-none">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute inset-0 scanline pointer-events-none opacity-45" />

      <div className="border border-rule bg-background/95 p-8 max-w-md w-full backdrop-blur relative z-10 space-y-6 text-center">
        <div className="flex justify-center">
          <TwinSecLogo className="size-10" />
        </div>

        <div>
          <p className="mono-label text-accent uppercase">PROTECTED ROUTE</p>
          <h1 className="display text-3xl mt-1">LEADERBOARD SUBMIT</h1>
          <p className="font-serif italic text-sm text-foreground/70 mt-3">
            Authenticated operator:{" "}
            <span className="text-accent font-bold font-mono">{operator.callsign}</span>
          </p>
        </div>

        <div className="border border-rule p-4 font-mono text-xs text-foreground/80 bg-black/40">
          <p className="text-green-400 font-bold">OPERATOR VERIFIED ✓</p>
          <p className="mt-2 text-foreground/60">
            Training runs completed during simulation exercises are automatically signed and
            committed to the encrypted database.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            to="/training-ledger"
            className="flex-1 bg-accent text-accent-foreground py-3 mono-label text-xs hover:opacity-90 transition-opacity"
          >
            VIEW LEDGER →
          </Link>
          <Link
            to="/simulation"
            search={{ sector: "power" }}
            className="flex-1 border border-rule py-3 mono-label text-xs hover:border-accent hover:text-accent transition-colors"
          >
            LAUNCH DRILL
          </Link>
        </div>
      </div>
    </main>
  );
}
