import { createFileRoute, Link } from "@tanstack/react-router";
import { THREAT_ACTORS } from "@/data/threat-actors";
import { TwinSecLogo } from "@/components/TwinSecLogo";

export const Route = createFileRoute("/threat-profiles/")({
  head: () => ({
    meta: [
      { title: "TwinSec — The Mindhunter Module · Threat Actor Psychology" },
      {
        name: "description",
        content:
          "Behavioral Analysis Unit dossier & post-capture interrogation interface for ICS threat actors.",
      },
    ],
  }),
  component: ThreatProfilesIndex,
});

function ThreatProfilesIndex() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col relative select-none">
      <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />
      <div className="absolute inset-0 scanline opacity-40 pointer-events-none" />

      {/* Header */}
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
            <span className="mono-label hidden md:inline pl-3 text-red-500 font-bold">
              ● THE MINDHUNTER MODULE
            </span>
          </div>
          <div className="flex items-center gap-6 mono-label text-xs">
            <Link to="/case-files" className="hover:text-accent transition-colors">
              CASE FILES
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

      {/* Hero Header */}
      <section className="max-w-[1600px] mx-auto w-full px-6 lg:px-10 pt-12 pb-8 border-b border-rule">
        <p className="mono-label text-red-500 tracking-widest uppercase">
          FBI BEHAVIORAL ANALYSIS UNIT MODEL // ICS THREAT PSYCHOLOGY
        </p>
        <h1 className="display text-5xl sm:text-7xl mt-3 leading-none">THE MINDHUNTER MODULE</h1>
        <p className="font-serif italic text-xl text-foreground/80 max-w-3xl mt-4 leading-relaxed">
          "Before you can understand the answer, you have to understand the question."
          <span className="block not-italic font-mono text-xs text-foreground/40 mt-1">
            — Bill Tench, Behavioral Science Unit
          </span>
        </p>
      </section>

      {/* Grid of Threat Profiles */}
      <section className="max-w-[1600px] mx-auto w-full px-6 lg:px-10 py-12 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {THREAT_ACTORS.map((actor) => (
            <div
              key={actor.id}
              className="border-2 border-rule bg-card hover:border-danger shadow-comic-dark hover:shadow-comic-accent p-6 sm:p-8 flex flex-col justify-between transition-all group"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="mono-label text-[10px] text-danger font-bold px-2 py-0.5 border-2 border-danger/40 bg-danger/10 uppercase">
                      {actor.classification.toUpperCase()}
                    </span>
                    <h2 className="display text-3xl sm:text-4xl mt-3 group-hover:text-danger transition-colors">
                      {actor.name}
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{actor.origin}</span>
                </div>

                <p className="font-serif italic text-base text-foreground/80 leading-snug">
                  {actor.primaryMotive}
                </p>

                <div className="border-t-2 border-rule pt-4 space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ALIASES:</span>
                    <span className="text-foreground">{actor.aliases.join(" · ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ACTIVE SINCE:</span>
                    <span className="text-foreground">{actor.activeSince}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">KEY TARGETS:</span>
                    <span className="text-accent font-bold">
                      {actor.preferredTargets.map((t) => t.sector).join(", ")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t-2 border-rule flex items-center justify-between">
                <Link
                  to="/threat-profiles/$id"
                  params={{ id: actor.id }}
                  className="bg-danger/10 border-2 border-danger/50 text-danger hover:bg-danger hover:text-white px-5 py-2.5 font-mono text-xs font-bold transition-all uppercase tracking-wider shadow-comic-sm"
                >
                  OPEN BAU DOSSIER & INTERROGATION →
                </Link>
                <Link
                  to="/simulation"
                  search={{
                    sector: actor.scenarioId as
                      | "power"
                      | "water"
                      | "oil-gas"
                      | "manufacturing"
                      | "port"
                      | "smart-building"
                      | "smart-city",
                  }}
                  className="mono-label text-xs hover:text-accent transition-colors"
                >
                  DRILL RANGE ⚡
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
