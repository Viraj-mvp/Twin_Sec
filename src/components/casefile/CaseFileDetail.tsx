import { CaseFile } from "@/data/case-files";
import { Link } from "@tanstack/react-router";
import { MitreAttackMatrix } from "./MitreAttackMatrix";
import {
  ShieldAlert,
  ArrowLeft,
  Activity,
  FileText,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";

interface CaseFileDetailProps {
  caseFile: CaseFile;
}

export function CaseFileDetail({ caseFile: c }: CaseFileDetailProps) {
  return (
    <div className="space-y-8 font-mono text-[#F5F3E7]">
      {/* Top Navigation & Declassified Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-3 border-black pb-5">
        <Link
          to="/case-files"
          className="bg-[#18181B] text-[#BFFF2E] border-2 border-black font-black text-xs px-4 py-2 shadow-[3px_3px_0px_0px_#000000] hover:bg-black transition-all flex items-center gap-2 uppercase"
        >
          <ArrowLeft className="size-4" />
          <span>← BACK TO ALL CASE FILES</span>
        </Link>
        <span className="bg-[#BFFF2E] text-black font-black text-xs px-3 py-1 border-2 border-black shadow-[3px_3px_0px_0px_#000000] uppercase">
          ★ DECLASSIFIED INVESTIGATION DOSSIER
        </span>
      </div>

      {/* Main Dossier Banner Card */}
      <div className="bg-[#F5F3E7] text-black border-4 border-black p-6 sm:p-10 space-y-6 shadow-[10px_10px_0px_0px_#BFFF2E]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-black pb-4">
          <div>
            <span className="bg-black text-[#BFFF2E] font-black text-xs px-2.5 py-1 uppercase border border-black shadow-[2px_2px_0px_0px_#000000]">
              {c.classification}
            </span>
            <h1 className="display text-4xl sm:text-6xl mt-3 text-black leading-tight">
              {c.title}
            </h1>
            <p className="text-sm text-zinc-700 font-bold uppercase mt-1">{c.subtitle}</p>
          </div>
          <div className="text-right">
            <span className="block text-xs font-bold text-zinc-600">INCIDENT TIMEFRAME</span>
            <span className="text-sm font-black text-black bg-white px-3 py-1 border-2 border-black inline-block mt-1">
              {c.incidentDate}
            </span>
          </div>
        </div>

        {/* Narrative & Impact */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-3">
            <h3 className="font-black text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
              <FileText className="size-4" />
              EXECUTIVE SUMMARY & NARRATIVE
            </h3>
            <p className="font-serif italic text-lg text-zinc-800 leading-relaxed bg-white p-4 border-2 border-black">
              "{c.story.narrative}"
            </p>
          </div>

          <div className="lg:col-span-5 space-y-3">
            <h3 className="font-black text-xs uppercase tracking-wider text-red-700 flex items-center gap-1.5">
              <AlertTriangle className="size-4" />
              PHYSICAL IMPACT & CONSEQUENCE
            </h3>
            <div className="bg-red-500/10 border-2 border-black p-4 space-y-2">
              <p className="text-xs font-bold text-red-900 leading-relaxed">{c.impact}</p>
              <div className="border-t border-black pt-2 text-[11px] font-bold text-zinc-800 flex justify-between">
                <span>ATTRIBUTED ACTOR:</span>
                <span className="bg-black text-[#BFFF2E] px-1.5 py-0.5">{c.attributedTo}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Timeline */}
      <div className="bg-[#121214] border-3 border-black p-6 sm:p-8 space-y-6 shadow-[6px_6px_0px_0px_#000000]">
        <h3 className="font-black text-sm uppercase tracking-wider text-[#BFFF2E] flex items-center gap-2 border-b-2 border-black pb-3">
          <Clock className="size-4" />
          INCIDENT EXECUTION TIMELINE
        </h3>

        <div className="space-y-4">
          {c.story.timeline.map((step, idx) => (
            <div
              key={idx}
              className="bg-[#18181B] border-2 border-black p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[3px_3px_0px_0px_#000000]"
            >
              <div className="flex items-center gap-3">
                <span className="bg-[#BFFF2E] text-black font-black text-xs px-2.5 py-1 border border-black shrink-0">
                  {step.time}
                </span>
                <span className="font-black text-sm uppercase text-[#F5F3E7]">{step.event}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed md:max-w-xl">
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* MITRE ATT&CK Matrix Component */}
      <MitreAttackMatrix techniques={c.mitreMapping} />

      {/* Countermeasures & Lessons Learned */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#121214] border-3 border-black p-6 space-y-4 shadow-[6px_6px_0px_0px_#000000]">
          <h3 className="font-black text-sm uppercase tracking-wider text-[#BFFF2E] flex items-center gap-2 border-b-2 border-black pb-3">
            <CheckCircle2 className="size-4 text-emerald-400" />
            WHAT COULD HAVE STOPPED IT
          </h3>
          <ul className="space-y-2 text-xs">
            {c.whatCouldHaveStoppedIt.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 bg-[#18181B] border border-black p-2.5"
              >
                <span className="text-emerald-400 font-bold">✓</span>
                <span className="text-zinc-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#121214] border-3 border-black p-6 space-y-4 shadow-[6px_6px_0px_0px_#000000]">
          <h3 className="font-black text-sm uppercase tracking-wider text-amber-400 flex items-center gap-2 border-b-2 border-black pb-3">
            <BookOpen className="size-4 text-amber-400" />
            KEY LESSONS LEARNED
          </h3>
          <div className="bg-[#18181B] border border-black p-4 font-serif italic text-sm text-zinc-300 leading-relaxed">
            "{c.lessonsLearned}"
          </div>
        </div>
      </div>

      {/* Research References */}
      <div className="bg-[#121214] border-3 border-black p-6 space-y-4 shadow-[6px_6px_0px_0px_#000000]">
        <h3 className="font-black text-sm uppercase tracking-wider text-[#F5F3E7] flex items-center gap-2 border-b-2 border-black pb-3">
          <BookOpen className="size-4 text-[#BFFF2E]" />
          ACADEMIC & VENDOR RESEARCH REFERENCES
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {c.researchReferences.map((ref, idx) => (
            <div
              key={idx}
              className="bg-[#18181B] border-2 border-black p-4 space-y-2 shadow-[3px_3px_0px_0px_#000000]"
            >
              <div className="flex justify-between items-start gap-2">
                <span className="bg-[#27272A] text-[#BFFF2E] font-black text-[10px] px-2 py-0.5 border border-black uppercase">
                  {ref.type}
                </span>
                <span className="text-xs text-muted-foreground">{ref.year}</span>
              </div>
              <h4 className="font-black text-sm text-[#F5F3E7]">{ref.title}</h4>
              <p className="text-[11px] text-muted-foreground">
                {ref.authors} • {ref.publisher}
              </p>
              <p className="text-xs text-zinc-300 font-serif italic border-l border-[#BFFF2E] pl-2 py-0.5">
                "{ref.keyInsight}"
              </p>
              {ref.url && (
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#BFFF2E] hover:underline inline-flex items-center gap-1 font-bold pt-1"
                >
                  <span>VIEW EXTERNAL PAPER / REPORT</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
