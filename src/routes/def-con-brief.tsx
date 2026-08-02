import { createFileRoute, Link } from "@tanstack/react-router";
import { useGsapReveal } from "@/hooks/use-gsap-reveal";
import { handleSmartBack } from "@/lib/nav-stack";

export const Route = createFileRoute("/def-con-brief")({
  head: () => ({
    meta: [
      { title: "DEF CON Brief — TwinSec at the ICS Village" },
      {
        name: "description",
        content:
          "TwinSec's DEF CON 33 briefing: live twin engine, adversary UNIT-414, and a substation you can lose in ninety seconds.",
      },
      { property: "og:title", content: "TwinSec — DEF CON Brief" },
      {
        property: "og:description",
        content: "Live twin engine · adversary emulation · ICS Village stage.",
      },
    ],
  }),
  component: DefconBrief,
});

const SCHEDULE = [
  {
    t: "10:00",
    tag: "TALK",
    title: "Opening — Why a Substation Is a Novel",
    room: "ICS VILLAGE STAGE",
  },
  {
    t: "11:30",
    tag: "DEMO",
    title: "Live Run · Exercise HOLLOW · Substation-07",
    room: "TWIN ENGINE POD",
  },
  {
    t: "13:00",
    tag: "WORKSHOP",
    title: "Adversary UNIT-414: Bring Your Own Substation",
    room: "WORKSHOP HALL 3",
  },
  { t: "15:00", tag: "PANEL", title: "Recalls Written by Vision Models", room: "MAIN STAGE" },
  {
    t: "17:00",
    tag: "DEMO",
    title: "Refinery Delta-12 · Exercise SEVENTH BREATH",
    room: "TWIN ENGINE POD",
  },
  { t: "19:00", tag: "PARTY", title: "The Cabana · Invite Only", room: "TBD" },
];

function DefconBrief() {
  const rootRef = useGsapReveal<HTMLElement>();
  return (
    <main ref={rootRef} className="min-h-screen bg-background text-foreground">
      {/* Poster hero */}
      <section className="relative min-h-[92dvh] border-b border-rule overflow-hidden flex items-end">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute inset-0 scanline pointer-events-none" />
        <div className="absolute top-6 left-6 right-6 flex justify-between mono-label z-10">
          <button
            type="button"
            onClick={(e) => handleSmartBack(e)}
            className="hover:text-accent cursor-pointer bg-transparent border-0 p-0 text-left"
          >
            ← RETURN
          </button>
          <span className="text-accent">DEF CON 33 · LAS VEGAS · AUG 07–10 · 2026</span>
          <Link to="/whitepapers" className="hover:text-accent">
            WHITEPAPERS →
          </Link>
        </div>
        <div className="relative px-4 sm:px-6 lg:px-10 pb-10 lg:pb-16 w-full">
          <p className="mono-label text-accent" data-reveal>
            ICS VILLAGE · TWINSEC PRESENTS
          </p>
          <h1
            data-reveal
            className="display text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.85] mt-4 tracking-tight"
          >
            LOSE THE
            <br />
            <span className="text-accent">SUBSTATION</span>
            <br />
            <span className="italic font-serif normal-case text-4xl sm:text-6xl md:text-7xl">
              in 90 seconds.
            </span>
          </h1>
          <div className="mt-10 grid grid-cols-12 gap-6" data-reveal>
            <p className="col-span-12 md:col-span-6 font-serif italic text-2xl leading-snug text-foreground/85">
              A live-fire cyber-physical demo. Real relays. Real transformers. A twin so honest the
              operators forget it's not their day job. And an adversary that doesn't wait for you to
              load its slides.
            </p>
            <div className="col-span-12 md:col-span-3 md:col-start-8 border-l border-rule pl-6">
              <p className="mono-label">STAGE</p>
              <p className="display text-2xl mt-2">ICS VILLAGE</p>
              <p className="font-mono text-xs text-foreground/60 mt-2">Track 3 · Pod C-14</p>
            </div>
            <div className="col-span-12 md:col-span-3 border-l border-rule pl-6">
              <p className="mono-label">SLOT</p>
              <p className="display text-2xl mt-2">AUG 09 · 15:30</p>
              <p className="font-mono text-xs text-foreground/60 mt-2">55 min + Q&amp;A</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ticket / RSVP band */}
      <section className="border-b border-rule bg-accent text-accent-foreground">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-10 flex flex-wrap items-baseline justify-between gap-6">
          <p className="display text-4xl md:text-5xl leading-none">SEAT-LIMITED. NO RECORDING.</p>
          <div className="flex gap-3">
            <button className="bg-accent-foreground text-accent mono-label px-6 py-3 hover:bg-background transition-colors">
              RSVP · WAITLIST
            </button>
            <button className="border border-accent-foreground mono-label px-6 py-3 hover:bg-accent-foreground hover:text-accent transition-colors">
              ADD TO CALENDAR
            </button>
          </div>
        </div>
      </section>

      {/* Schedule strip */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-20 lg:py-28">
          <div className="grid grid-cols-12 gap-6 mb-12">
            <p className="col-span-12 md:col-span-3 mono-label">FIG. 01 — DAY-2 SCHEDULE</p>
            <h2 className="col-span-12 md:col-span-9 display text-4xl md:text-6xl leading-[0.9]">
              Every hour is a<br />
              <span className="italic font-serif normal-case text-foreground/60">
                different facility.
              </span>
            </h2>
          </div>
          <ol className="border-t border-rule">
            {SCHEDULE.map((s) => (
              <li
                key={s.t}
                className="grid grid-cols-12 items-baseline gap-x-6 border-b border-rule py-6"
                data-reveal
              >
                <span className="col-span-2 display text-4xl md:text-5xl tabular-nums leading-none">
                  {s.t}
                </span>
                <span className="col-span-2 mono-label text-accent">{s.tag}</span>
                <span className="col-span-6 font-serif text-2xl md:text-3xl leading-tight">
                  {s.title}
                </span>
                <span className="col-span-2 mono-label text-right text-foreground/60">
                  {s.room}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Presenter cards */}
      <section className="border-b border-rule bg-paper text-ink">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-20 lg:py-28">
          <p className="mono-label !text-ink/60" data-reveal>
            FIG. 02 — ON STAGE
          </p>
          <h2 className="display text-5xl md:text-7xl leading-[0.9] mt-4 max-w-3xl" data-reveal>
            The three people{" "}
            <span className="italic font-serif normal-case">holding the twin.</span>
          </h2>
          <div className="mt-14 grid md:grid-cols-3 gap-8">
            {[
              {
                name: "N. ARENS",
                role: "PRINCIPAL RESEARCHER",
                bio: "Fifteen years on protection relays. Runs UNIT-414. Believes the operator is the last honest sensor in the plant.",
              },
              {
                name: "H. DORÉ",
                role: "WATER SYSTEMS LEAD",
                bio: "Built the first turbidity clamp defense. Speaks fluent SCADA. Skeptical of every dashboard.",
              },
              {
                name: "M. ILIĆ",
                role: "SAFETY SIMULATION",
                bio: "SIS-first thinker. Writes the reflex the process depends on. Never trusts a suppressed alarm.",
              },
            ].map((p) => (
              <article
                key={p.name}
                className="border-2 border-ink p-8 shadow-brutal-ink bg-paper"
                data-reveal
              >
                <p className="mono-label !text-ink/60">{p.role}</p>
                <p className="display text-4xl mt-3">{p.name}</p>
                <p className="font-serif italic text-lg mt-6 leading-snug text-ink/80">{p.bio}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-rule">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-8 flex flex-wrap justify-between mono-label gap-3">
          <span>DEF CON 33 · TWINSEC · ICS VILLAGE</span>
          <Link to="/" className="hover:text-accent">
            ← RETURN TO BRIEFING
          </Link>
        </div>
      </footer>
    </main>
  );
}
