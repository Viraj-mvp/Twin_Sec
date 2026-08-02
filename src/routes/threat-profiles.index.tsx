import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { THREAT_ACTORS, ThreatActorProfile } from "@/data/threat-actors";
import type { SectorId } from "@/data/scenarios";
import { useGsapReveal } from "@/hooks/use-gsap-reveal";
import { handleSmartBack } from "@/lib/nav-stack";

export const Route = createFileRoute("/threat-profiles/")({
  head: () => ({
    meta: [
      { title: "Mindhunter BAU — Threat Actor Psychology Dossiers" },
      {
        name: "description",
        content:
          "Behavioral Analysis Unit dossiers & post-capture interrogation interface for ICS threat actors.",
      },
      { property: "og:title", content: "TwinSec — The Mindhunter Module" },
      {
        property: "og:description",
        content: "Behavioral Science Unit dossiers & post-capture interrogation interface.",
      },
    ],
  }),
  component: ThreatProfilesIndex,
});

function Fig({ k, v }: { k: string; v: string }) {
  return (
    <div className="mono-label">
      <span className="block opacity-60 text-[10px]">{k}</span>
      <span className="display text-2xl lg:text-3xl mt-0.5">{v}</span>
    </div>
  );
}

function ThreatProfilesIndex() {
  const rootRef = useGsapReveal<HTMLElement>();
  const [expandedId, setExpandedId] = useState<string | null>(THREAT_ACTORS[0].id);

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
          <span className="text-danger font-bold uppercase">
            ● FBI BEHAVIORAL ANALYSIS UNIT (BAU-4) DOSSIERS
          </span>
          <Link to="/case-files" className="hover:text-accent">
            CASE FILES →
          </Link>
        </div>
      </header>

      {/* Poster Hero Header */}
      <section className="relative border-b border-rule overflow-hidden">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-16 lg:py-28 grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-8" data-reveal>
            <p className="mono-label text-danger font-bold tracking-widest uppercase">
              SECTION 04 — THREAT PSYCHOLOGY &amp; BEHAVIORAL ANALYSIS
            </p>
            <h1 className="display text-[14vw] md:text-[10vw] lg:text-[140px] leading-[0.84] mt-6 tracking-tight">
              The Mindhunter
              <br />
              <span className="text-danger">Module.</span>
              <br />
              <span className="italic font-serif normal-case text-foreground/80">
                ICS Threat Psychology
              </span>
            </h1>
          </div>
          <div
            className="col-span-12 md:col-span-4 border-l border-rule pl-8 flex flex-col justify-end"
            data-reveal
          >
            <p className="font-serif text-xl italic leading-snug text-foreground/80">
              "Before you can understand the answer, you have to understand the question."
              Behavioral Science Unit dossiers &amp; post-capture interrogation interface for
              nation-state and criminal threat actors.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-rule pt-6">
              <Fig k="ACTORS" v="8" />
              <Fig k="INTERROG" v="LIVE" />
              <Fig k="BAU" v="v2.4" />
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Threat Dossier Ledger */}
      <section className="max-w-[1600px] mx-auto w-full px-6 lg:px-10 py-12 flex-1">
        <div className="mono-label text-foreground/50 px-4 py-3 border-b border-rule grid grid-cols-12 gap-4 text-xs">
          <span className="col-span-2">CLASSIFICATION</span>
          <span className="col-span-3">ADVERSARY GROUP</span>
          <span className="col-span-4">TARGET SECTORS</span>
          <span className="col-span-3 text-right">ORIGIN · STATUS</span>
        </div>

        <div className="divide-y divide-rule border-b border-rule">
          {THREAT_ACTORS.map((actor: ThreatActorProfile) => {
            const open = expandedId === actor.id;
            return (
              <article key={actor.id} className="transition-colors" data-reveal>
                <button
                  onClick={() => setExpandedId(open ? null : actor.id)}
                  aria-expanded={open}
                  className="w-full text-left grid grid-cols-12 items-baseline gap-4 px-4 py-6 hover:bg-danger/5 group focus:outline-none"
                >
                  <span className="col-span-2 mono-label text-xs">
                    <span className="text-danger font-bold px-2 py-0.5 border border-danger/40 bg-danger/10 uppercase">
                      {actor.classification}
                    </span>
                  </span>
                  <span className="col-span-3 display text-2xl md:text-4xl group-hover:text-danger transition-colors leading-none">
                    {actor.name}
                  </span>
                  <span className="col-span-4 mono-label text-xs uppercase text-foreground/70">
                    {actor.preferredTargets.map((t) => t.sector).join(" · ")}
                  </span>
                  <span className="col-span-3 mono-label text-xs text-right text-foreground/60">
                    {actor.origin} · {actor.activeSince}
                  </span>
                </button>

                {open && (
                  <div className="px-6 pb-8 pt-2 grid grid-cols-12 gap-8 bg-card/40 border-t border-rule/40">
                    <div className="col-span-12 md:col-span-4 space-y-4">
                      <div>
                        <span className="mono-label text-[10px] text-danger">
                          ALIASES &amp; CODENAMES
                        </span>
                        <p className="font-mono text-sm font-bold text-foreground mt-1">
                          {actor.aliases.join(" · ")}
                        </p>
                      </div>
                      <div>
                        <span className="mono-label text-[10px] text-foreground/50">
                          PRIMARY MOTIVATION
                        </span>
                        <p className="font-serif italic text-base text-foreground/90 mt-1">
                          {actor.primaryMotive}
                        </p>
                      </div>
                      <div>
                        <span className="mono-label text-[10px] text-foreground/50">
                          SIGNATURE BEHAVIORS
                        </span>
                        <ul className="list-disc list-inside space-y-1 mt-2 font-mono text-xs text-foreground/80">
                          {actor.signatureBehaviors.map((b, idx) => (
                            <li key={idx}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="col-span-12 md:col-span-8 space-y-6">
                      <div>
                        <span className="mono-label text-[10px] text-danger">
                          BAU PSYCHOLOGICAL KEY INSIGHT
                        </span>
                        <p className="font-serif text-lg text-foreground/90 leading-relaxed mt-2">
                          {actor.psychologicalProfile.keyInsight}
                        </p>
                      </div>

                      <div className="border-t border-rule/50 pt-4">
                        <span className="mono-label text-[10px] text-foreground/50 mb-3 block">
                          KNOWN OPERATIONS
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {actor.knownOperations.map((op) => (
                            <span
                              key={op.name}
                              className="mono-label text-[10px] px-2.5 py-1 border border-rule bg-background text-foreground/90"
                            >
                              <strong className="text-danger">{op.year}:</strong> {op.name} (
                              {op.impact})
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 pt-4 border-t border-rule/50">
                        <Link
                          to="/threat-profiles/$id"
                          params={{ id: actor.id }}
                          className="bg-danger text-white font-mono text-xs font-bold px-6 py-3 uppercase tracking-wider hover:bg-danger/90 transition-colors"
                        >
                          OPEN BAU DOSSIER &amp; LIVE INTERROGATION →
                        </Link>
                        <Link
                          to="/simulation"
                          search={{ sector: actor.scenarioId as SectorId }}
                          className="border border-rule font-mono text-xs px-6 py-3 uppercase hover:border-danger hover:text-danger transition-colors"
                        >
                          SIMULATE THREAT ACTOR ▶
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
