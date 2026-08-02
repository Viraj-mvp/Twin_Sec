import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CASE_FILES, CaseFile } from "@/data/case-files";
import type { SectorId } from "@/data/scenarios";
import { useGsapReveal } from "@/hooks/use-gsap-reveal";
import { handleSmartBack } from "@/lib/nav-stack";

export const Route = createFileRoute("/case-files/")({
  head: () => ({
    meta: [
      { title: "Historical Case Files — TwinSec Research Grounding" },
      {
        name: "description",
        content:
          "Declassified case files of historical ICS/OT cyberattacks mapped to MITRE ATT&CK and academic literature.",
      },
      { property: "og:title", content: "TwinSec — Historical Case Files" },
      {
        property: "og:description",
        content:
          "Declassified case files of historical ICS/OT cyberattacks mapped to MITRE ATT&CK.",
      },
    ],
  }),
  component: CaseFilesIndex,
});

function Fig({ k, v }: { k: string; v: string }) {
  return (
    <div className="mono-label">
      <span className="block opacity-60 text-[10px]">{k}</span>
      <span className="display text-2xl lg:text-3xl mt-0.5">{v}</span>
    </div>
  );
}

function CaseFilesIndex() {
  const rootRef = useGsapReveal<HTMLElement>();
  const [expandedId, setExpandedId] = useState<string | null>(CASE_FILES[0].id);

  return (
    <main
      ref={rootRef}
      className="min-h-screen bg-background text-foreground flex flex-col relative select-none"
    >
      <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />
      <div className="absolute inset-0 scanline opacity-40 pointer-events-none" />

      {/* Editorial Header Strip (Clean, un-cluttered) */}
      <header className="border-b border-rule z-10 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-5 flex flex-wrap justify-between items-baseline gap-4 mono-label">
          <button
            type="button"
            onClick={(e) => handleSmartBack(e)}
            className="hover:text-accent cursor-pointer bg-transparent border-0 p-0 text-left flex items-center gap-2"
          >
            ← RETURN
          </button>
          <span className="text-accent font-bold">TWINSEC HISTORICAL CASE FILES · VOL. III</span>
          <Link to="/threat-profiles" className="hover:text-accent">
            MINDHUNTER BAU →
          </Link>
        </div>
      </header>

      {/* Poster Hero Header */}
      <section className="relative border-b border-rule overflow-hidden">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-16 lg:py-28 grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-8" data-reveal>
            <p className="mono-label text-accent tracking-widest uppercase">
              SECTION 03 — HISTORICAL INCIDENTS
            </p>
            <h1 className="display text-[14vw] md:text-[10vw] lg:text-[140px] leading-[0.84] mt-6 tracking-tight">
              Past attacks.
              <br />
              <span className="text-accent">Reconstructed.</span>
              <br />
              <span className="italic font-serif normal-case">In code.</span>
            </h1>
          </div>
          <div
            className="col-span-12 md:col-span-4 border-l border-rule pl-8 flex flex-col justify-end"
            data-reveal
          >
            <p className="font-serif text-xl italic leading-snug text-foreground/80">
              "Those who do not study past attacks will defend against future attacks poorly."
              Declassified case files of historical ICS/OT cyberattacks mapped to MITRE ATT&CK for
              ICS.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-rule pt-6">
              <Fig k="CASES" v="12" />
              <Fig k="ATT&CK" v="48" />
              <Fig k="SECTORS" v="6" />
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Case Files Ledger */}
      <section className="max-w-[1600px] mx-auto w-full px-6 lg:px-10 py-12 flex-1">
        <div className="mono-label text-foreground/50 px-4 py-3 border-b border-rule grid grid-cols-12 gap-4 text-xs">
          <span className="col-span-2">INCIDENT DATE · ID</span>
          <span className="col-span-2">TARGET SECTOR</span>
          <span className="col-span-6">INCIDENT TITLE</span>
          <span className="col-span-2 text-right">MITRE MAPPED</span>
        </div>

        <div className="divide-y divide-rule border-b border-rule">
          {CASE_FILES.map((c: CaseFile) => {
            const open = expandedId === c.id;
            return (
              <article key={c.id} className="transition-colors" data-reveal>
                <button
                  onClick={() => setExpandedId(open ? null : c.id)}
                  aria-expanded={open}
                  className="w-full text-left grid grid-cols-12 items-baseline gap-4 px-4 py-6 hover:bg-accent/5 group focus:outline-none"
                >
                  <span className="col-span-2 mono-label text-xs">
                    {c.incidentDate} · <span className="text-accent">{c.id.toUpperCase()}</span>
                  </span>
                  <span className="col-span-2 mono-label text-xs uppercase text-foreground/70">
                    {c.sector}
                  </span>
                  <span className="col-span-6 display text-2xl md:text-3xl group-hover:text-accent transition-colors leading-none">
                    {c.title}
                  </span>
                  <span className="col-span-2 mono-label text-xs text-right text-accent font-bold">
                    {c.mitreMapping.length} TECHNIQUES →
                  </span>
                </button>

                {open && (
                  <div className="px-6 pb-8 pt-2 grid grid-cols-12 gap-8 bg-card/40 border-t border-rule/40">
                    <div className="col-span-12 md:col-span-4 space-y-4">
                      <div>
                        <span className="mono-label text-[10px] text-accent">
                          KNOWN ATTRIBUTION
                        </span>
                        <p className="font-mono text-sm font-bold text-foreground mt-1">
                          {c.attributedTo}
                        </p>
                      </div>
                      <div>
                        <span className="mono-label text-[10px] text-foreground/50">
                          PHYSICAL IMPACT
                        </span>
                        <p className="font-serif italic text-base text-foreground/90 mt-1">
                          {c.impact}
                        </p>
                      </div>
                      <div>
                        <span className="mono-label text-[10px] text-foreground/50">
                          TARGET FACILITY
                        </span>
                        <p className="font-mono text-xs text-foreground/80 mt-1">{c.target}</p>
                      </div>
                    </div>

                    <div className="col-span-12 md:col-span-8 space-y-6">
                      <div>
                        <span className="mono-label text-[10px] text-accent">
                          EXECUTIVE OVERVIEW
                        </span>
                        <p className="font-serif text-lg text-foreground/90 leading-relaxed mt-2">
                          {c.story.overview}
                        </p>
                      </div>

                      <div className="border-t border-rule/50 pt-4">
                        <span className="mono-label text-[10px] text-foreground/50 mb-3 block">
                          MITRE ATT&amp;CK FOR ICS TECHNIQUES
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {c.mitreMapping.map((t) => (
                            <span
                              key={t.techniqueId}
                              className="mono-label text-[10px] px-2.5 py-1 border border-rule bg-background text-foreground/90"
                            >
                              <strong className="text-accent">{t.techniqueId}:</strong> {t.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 pt-4 border-t border-rule/50">
                        <Link
                          to="/case-files/$id"
                          params={{ id: c.id }}
                          className="bg-accent text-accent-foreground font-mono text-xs font-bold px-6 py-3 uppercase tracking-wider hover:opacity-90 transition-opacity"
                        >
                          FULL INCIDENT DOSSIER &amp; ANALYSIS →
                        </Link>
                        <Link
                          to="/simulation"
                          search={{ sector: c.scenarioId as SectorId }}
                          className="border border-rule font-mono text-xs px-6 py-3 uppercase hover:border-accent hover:text-accent transition-colors"
                        >
                          REPLAY IN SIMULATION ▶
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
