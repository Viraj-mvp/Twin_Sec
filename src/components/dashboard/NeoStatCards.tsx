import React from "react";
import { Zap, ShieldCheck, Activity, Server, ArrowUpRight, CheckCircle2 } from "lucide-react";

interface NeoStatCardsProps {
  totalRuns?: number;
  avgScore?: number;
  totalMwShed?: number;
  uptime?: string;
}

export function NeoStatCards({
  totalRuns = 0,
  avgScore = 92,
  totalMwShed = 1420,
  uptime = "99.99%",
}: NeoStatCardsProps) {
  const displayRuns = totalRuns > 0 ? totalRuns : 18;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
      {/* ── CARD 1: HERO ACID LIME (#BFFF2E) CARD ── */}
      <div className="relative overflow-hidden rounded-none border-2 border-black bg-accent text-accent-foreground p-6 shadow-[6px_6px_0px_0px_#000000] flex flex-col justify-between min-h-[185px] group transition-transform hover:-translate-y-0.5">
        <Zap className="absolute -right-3 -bottom-3 size-28 text-black/15 stroke-1 pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div className="size-11 bg-black text-accent flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_#000000]">
            <Zap className="size-6 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-1 bg-black border-2 border-black px-2.5 py-1 text-xs font-mono font-black text-accent shadow-[2px_2px_0px_#000000]">
            <ArrowUpRight className="size-3.5 stroke-[3]" />
            <span>+14.2%</span>
          </div>
        </div>

        <div className="mt-4 relative z-10">
          <p className="font-mono text-xs font-black uppercase tracking-wider text-black">
            TOTAL DRILLS COMPLETED
          </p>
          <p className="display text-4xl sm:text-5xl font-black tracking-tight text-black mt-0.5">
            {displayRuns.toLocaleString()}{" "}
            <span className="font-mono text-sm font-bold opacity-80">RUNS</span>
          </p>
        </div>
      </div>

      {/* ── CARD 2: AVG DEFENSE SCORE ── */}
      <div className="relative overflow-hidden rounded-none border-2 border-rule bg-[#18181B] text-foreground p-6 shadow-[6px_6px_0px_0px_#000000] flex flex-col justify-between min-h-[185px] group transition-transform hover:-translate-y-0.5">
        <ShieldCheck className="absolute -right-3 -bottom-3 size-28 text-white/5 stroke-1 pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div className="size-11 bg-black text-accent flex items-center justify-center border-2 border-rule shadow-[2px_2px_0px_#000000]">
            <ShieldCheck className="size-6 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-1 bg-black border border-rule px-2.5 py-1 text-xs font-mono font-bold text-accent shadow-[2px_2px_0px_#000000]">
            <span>TIER-1 DEFENDER</span>
          </div>
        </div>

        <div className="mt-4 relative z-10">
          <p className="mono-label text-foreground/70">AVG MITIGATION SCORE</p>
          <p className="display text-4xl sm:text-5xl font-black text-foreground tracking-tight mt-0.5">
            {avgScore}% <span className="text-accent font-mono text-sm font-bold">OPTIMAL</span>
          </p>
        </div>
      </div>

      {/* ── CARD 3: TOTAL MW PROTECTED ── */}
      <div className="relative overflow-hidden rounded-none border-2 border-rule bg-[#18181B] text-foreground p-6 shadow-[6px_6px_0px_0px_#000000] flex flex-col justify-between min-h-[185px] group transition-transform hover:-translate-y-0.5">
        <Activity className="absolute -right-3 -bottom-3 size-28 text-white/5 stroke-1 pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div className="size-11 bg-black text-accent flex items-center justify-center border-2 border-rule shadow-[2px_2px_0px_#000000]">
            <Activity className="size-6 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-1 bg-black border border-rule px-2.5 py-1 text-xs font-mono font-bold text-foreground/90 shadow-[2px_2px_0px_#000000]">
            <span>LOAD STABILIZED</span>
          </div>
        </div>

        <div className="mt-4 relative z-10">
          <p className="mono-label text-foreground/70">MW LOAD PROTECTED</p>
          <p className="display text-4xl sm:text-5xl font-black text-foreground tracking-tight mt-0.5">
            {totalMwShed.toLocaleString()}{" "}
            <span className="font-mono text-sm font-bold text-foreground/60">MW</span>
          </p>
        </div>
      </div>

      {/* ── CARD 4: SCADA DIGITAL TWIN UPTIME ── */}
      <div className="relative overflow-hidden rounded-none border-2 border-rule bg-[#18181B] text-foreground p-6 shadow-[6px_6px_0px_0px_#000000] flex flex-col justify-between min-h-[185px] group transition-transform hover:-translate-y-0.5">
        <Server className="absolute -right-3 -bottom-3 size-28 text-white/5 stroke-1 pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div className="size-11 bg-black text-accent flex items-center justify-center border-2 border-rule shadow-[2px_2px_0px_#000000]">
            <Server className="size-6 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-1 bg-accent text-accent-foreground border-2 border-black px-2.5 py-1 text-xs font-mono font-black shadow-[2px_2px_0px_#000000]">
            <CheckCircle2 className="size-3.5 stroke-[3]" />
            <span>7/7 SUBNETS LIVE</span>
          </div>
        </div>

        <div className="mt-4 relative z-10">
          <p className="mono-label text-foreground/70">DIGITAL TWIN UPTIME</p>
          <p className="display text-4xl sm:text-5xl font-black text-foreground tracking-tight mt-0.5">
            {uptime}
          </p>
        </div>
      </div>
    </div>
  );
}
