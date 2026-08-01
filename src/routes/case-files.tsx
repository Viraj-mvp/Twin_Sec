import { createFileRoute, Link } from "@tanstack/react-router";
import { CASE_FILES } from "@features/case-files";
import { TwinSecLogo } from "@shared";
import { CaseFileCard } from "@/components/casefile";

export const Route = createFileRoute("/case-files")({
  head: () => ({
    meta: [
      { title: "TwinSec — Real ICS Attacks: Case Studies & Research Grounding" },
      {
        name: "description",
        content:
          "Declassified case files of historical ICS/OT cyberattacks mapped to MITRE ATT&CK and academic literature.",
      },
    ],
  }),
  component: CaseFilesIndex,
});

function CaseFilesIndex() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col relative select-none font-sans">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute inset-0 scanline opacity-45 pointer-events-none" />

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
            <span className="mono-label hidden md:inline pl-3 text-accent">
              ● CASE FILES & RESEARCH
            </span>
          </div>
          <div className="flex items-center gap-6 mono-label text-xs pr-36 sm:pr-44">
            <Link
              to="/threat-profiles"
              className="hover:text-accent transition-colors hidden sm:inline"
            >
              MINDHUNTER MODULE
            </Link>
            <Link
              to="/simulation"
              search={{ sector: "power" }}
              className="hover:text-accent transition-colors"
            >
              CYBER RANGE
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[1600px] mx-auto w-full px-6 lg:px-10 pt-12 pb-8 border-b border-rule">
        <p className="mono-label text-accent tracking-widest uppercase">
          HISTORICAL INCIDENTS // MITRE ATT&CK FOR ICS MAPPED
        </p>
        <h1 className="display text-5xl sm:text-7xl mt-3 leading-none">HISTORICAL CASE FILES</h1>
        <p className="font-serif italic text-xl text-foreground/80 max-w-3xl mt-4 leading-relaxed">
          "Those who do not study past attacks will defend against future attacks poorly."
          <span className="block not-italic font-mono text-xs text-foreground/40 mt-1">
            Real historical incidents reconstructed for hands-on simulation training.
          </span>
        </p>
      </section>

      {/* Modular Case Files Grid */}
      <section className="max-w-[1600px] mx-auto w-full px-6 lg:px-10 py-12 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {CASE_FILES.map((c) => (
            <CaseFileCard key={c.id} caseFile={c} />
          ))}
        </div>
      </section>
    </main>
  );
}
