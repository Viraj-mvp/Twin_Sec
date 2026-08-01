import { Link } from "@tanstack/react-router";
import { CaseFile } from "@/data/case-files";
import { ShieldAlert, Terminal, Cpu, ExternalLink, Activity } from "lucide-react";

interface CaseFileCardProps {
  caseFile: CaseFile;
}

export function CaseFileCard({ caseFile: c }: CaseFileCardProps) {
  return (
    <div className="border-3 border-black bg-[#121214] text-[#F5F3E7] p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 hover:shadow-[8px_8px_0px_0px_#BFFF2E] hover:-translate-x-1 hover:-translate-y-1 group">
      <div className="space-y-4 font-mono">
        <div className="flex flex-wrap justify-between items-start gap-2">
          <span className="bg-[#BFFF2E] text-black font-black text-[10px] px-2.5 py-0.5 border border-black shadow-[2px_2px_0px_0px_#000000] uppercase tracking-wider">
            {c.classification}
          </span>
          <span className="text-xs text-muted-foreground font-bold tabular-nums bg-[#18181B] px-2 py-0.5 border border-black">
            {c.incidentDate}
          </span>
        </div>

        <div>
          <h2 className="display text-3xl sm:text-4xl mt-2 text-[#F5F3E7] group-hover:text-[#BFFF2E] transition-colors leading-tight">
            {c.title}
          </h2>
          <p className="text-xs text-muted-foreground font-bold uppercase mt-1">{c.subtitle}</p>
        </div>

        <p className="font-serif italic text-base text-zinc-300 leading-snug border-l-2 border-[#BFFF2E] pl-3 py-0.5">
          "{c.story.overview}"
        </p>

        <div className="border-t-2 border-black pt-4 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-bold text-[10px] uppercase">
              TARGET FACILITY:
            </span>
            <span className="font-bold text-[#F5F3E7]">{c.target}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-bold text-[10px] uppercase">SECTOR:</span>
            <span className="bg-black text-[#BFFF2E] text-[10px] font-black px-2 py-0.5 border border-black uppercase">
              {c.sector}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-bold text-[10px] uppercase">
              ATTRIBUTION:
            </span>
            <span className="text-amber-400 font-bold">{c.attributedTo}</span>
          </div>
        </div>
      </div>

      <div className="pt-6 mt-6 border-t-2 border-black flex flex-wrap items-center justify-between gap-3 font-mono">
        <Link
          to="/case-files/$id"
          params={{ id: c.id }}
          className="bg-[#BFFF2E] text-black font-black text-xs px-4 py-2.5 border-2 border-black shadow-[3px_3px_0px_0px_#000000] hover:bg-lime-300 transition-all uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
        >
          <span>READ DECLASSIFIED FILE →</span>
        </Link>
        <Link
          to="/simulation"
          search={{
            sector: c.scenarioId as
              | "power"
              | "water"
              | "oil-gas"
              | "manufacturing"
              | "port"
              | "smart-building"
              | "smart-city",
          }}
          className="bg-[#18181B] text-[#BFFF2E] font-bold text-xs px-3 py-2 border border-black hover:bg-black transition-colors flex items-center gap-1.5"
        >
          <Activity className="size-3.5 text-[#BFFF2E] animate-pulse" />
          <span>DRILL SCENARIO ⚡</span>
        </Link>
      </div>
    </div>
  );
}
