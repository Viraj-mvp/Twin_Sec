import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useGsapReveal } from "@/hooks/use-gsap-reveal";

export const Route = createFileRoute("/s4-talk")({
  head: () => ({
    meta: [
      { title: "S4 Talk — TwinSec at S4x26 Miami" },
      {
        name: "description",
        content:
          "TwinSec's S4x26 Miami talk: silent interlock bypass, refinery reflex loss, and what SIL-3 owes an operator.",
      },
      { property: "og:title", content: "TwinSec — S4 Talk" },
      {
        property: "og:description",
        content: "Silent interlock bypass in SIL-3 safety systems. Miami, February 2027.",
      },
    ],
  }),
  component: S4Talk,
});

const SEGMENTS = [
  {
    n: "01",
    t: "00:00",
    title: "The reflex is the point.",
    note: "Why safety is a control loop, not a checklist.",
  },
  {
    n: "02",
    t: "07:20",
    title: "Anatomy of a silent bypass.",
    note: "Live disarm of a SIL-3 solver. No alarm. No trip. No trace.",
  },
  {
    n: "03",
    t: "18:40",
    title: "The compressor kept climbing.",
    note: "Twin replay of Delta-12. Twenty-two minutes to overpressure, told twice.",
  },
  {
    n: "04",
    t: "31:15",
    title: "Runtime attestation for reflex code.",
    note: "Our proposal. Cycle-time overhead measured across four vendors.",
  },
  {
    n: "05",
    t: "42:00",
    title: "Q&A — the operator answers.",
    note: "Live audience Q&A with a working refinery operator.",
  },
];

function S4Talk() {
  const rootRef = useGsapReveal<HTMLElement>();
  const [seg, setSeg] = useState(0);
  const active = SEGMENTS[seg];

  return (
    <main ref={rootRef} className="min-h-screen bg-ink text-paper">
      <header className="border-b border-paper/20">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-5 flex flex-wrap justify-between items-baseline gap-4 mono-label !text-paper/70">
          <Link to="/" className="hover:text-accent">
            ← TWINSEC
          </Link>
          <span className="text-accent">S4X26 · MIAMI · FONTAINEBLEAU · FEB 09–11 · 2027</span>
          <Link to="/def-con-brief" className="hover:text-accent">
            DEF CON BRIEF →
          </Link>
        </div>
      </header>

      {/* Cinematic hero — talk poster */}
      <section className="relative border-b border-paper/20 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative mx-auto max-w-[1600px] px-6 lg:px-10 pt-16 pb-24 lg:pt-24 lg:pb-32 grid grid-cols-12 gap-10">
          <div className="col-span-12 lg:col-span-8" data-reveal>
            <p className="mono-label text-accent">S4 STAGE-A · KEYNOTE SLOT · TUESDAY 09:45</p>
            <h1
              className="display leading-[0.82] mt-6 tracking-tight"
              style={{ fontSize: "clamp(64px, 14vw, 220px)" }}
            >
              What SIL-3
              <br />
              owes an
              <br />
              <span className="text-accent">operator.</span>
            </h1>
            <p className="font-serif italic text-2xl md:text-3xl mt-10 text-paper/80 leading-snug max-w-3xl">
              A 55-minute demonstration of silent interlock bypass in SIL-3 safety instrumented
              systems — and a proposal for runtime attestation the plant floor can actually afford.
            </p>
          </div>
          <aside
            className="col-span-12 lg:col-span-4 lg:border-l lg:border-paper/20 lg:pl-8 flex flex-col justify-end gap-6"
            data-reveal
          >
            <div className="border-2 border-paper p-6 shadow-brutal bg-ink">
              <p className="mono-label !text-paper/60">SPEAKER</p>
              <p className="display text-4xl mt-2">M. ILIĆ</p>
              <p className="font-mono text-xs uppercase text-paper/60 mt-2">
                TwinSec · Safety Simulation Lead
              </p>
              <div className="hairline my-5 !border-paper/30" />
              <p className="font-serif italic text-base text-paper/80 leading-snug">
                Twelve years designing trip logic. Two years breaking it, on purpose, inside a twin.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button className="bg-accent text-accent-foreground mono-label px-5 py-3 hover:bg-paper hover:text-ink transition-colors">
                RSVP · STAGE A
              </button>
              <Link
                to="/simulation"
                search={{ sector: "oil-gas" }}
                className="border-2 border-paper mono-label px-5 py-3 text-center hover:bg-paper hover:text-ink transition-colors"
              >
                REHEARSE SEVENTH BREATH →
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* Segment player */}
      <section className="border-b border-paper/20">
        <div className="mx-auto max-w-[1600px] grid grid-cols-12">
          <ol className="col-span-12 lg:col-span-5 border-b lg:border-b-0 lg:border-r border-paper/20">
            <li className="px-6 lg:px-10 py-5 border-b border-paper/20 mono-label !text-paper/60">
              TALK SEGMENTS · 55 MIN
            </li>
            {SEGMENTS.map((s, i) => {
              const isA = i === seg;
              return (
                <li key={s.n}>
                  <button
                    onClick={() => setSeg(i)}
                    aria-pressed={isA}
                    className={`w-full text-left grid grid-cols-[3rem_4rem_minmax(0,1fr)] items-center gap-4 px-6 lg:px-10 py-6 border-b border-paper/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset ${
                      isA ? "bg-accent text-accent-foreground" : "hover:bg-paper/5"
                    }`}
                  >
                    <span className="mono-label tabular-nums">{s.n}</span>
                    <span className="font-mono text-xs tabular-nums opacity-70">{s.t}</span>
                    <span className="display text-2xl md:text-3xl leading-none">{s.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div
            className="col-span-12 lg:col-span-7 p-8 lg:p-16 flex flex-col justify-between min-h-[520px]"
            data-reveal
          >
            <div>
              <p className="mono-label text-accent">
                SEGMENT {active.n} · {active.t}
              </p>
              <p className="display text-5xl md:text-6xl lg:text-7xl mt-6 leading-[0.9]">
                {active.title}
              </p>
              <p className="font-serif italic text-xl md:text-2xl mt-8 text-paper/80 leading-snug max-w-2xl">
                {active.note}
              </p>
            </div>
            <div className="border-t border-paper/20 pt-6 flex flex-wrap gap-3">
              <button className="bg-paper text-ink mono-label px-5 py-3 hover:bg-accent hover:text-accent-foreground transition-colors">
                ▶ PLAY SEGMENT
              </button>
              <a
                href="https://s4events.com"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-paper/40 mono-label px-5 py-3 hover:border-accent hover:text-accent transition-colors block"
              >
                S4 EVENT DETAILS ↗
              </a>
              <Link
                to="/whitepapers"
                className="border border-paper/40 mono-label px-5 py-3 hover:border-accent hover:text-accent transition-colors"
              >
                READ THE PAPER →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pull quotes */}
      <section className="border-b border-paper/20">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-24 grid md:grid-cols-2 gap-16">
          {[
            {
              q: "The bypass leaves no trace because there was nothing to trace. That is the entire attack.",
              a: "M. ILIĆ · TWINSEC",
            },
            {
              q: "The twin doesn't care what the SIS reports. It knows what the process is actually doing.",
              a: "N. ARENS · TWINSEC",
            },
          ].map((p, i) => (
            <blockquote key={i} data-reveal className="border-l-4 border-accent pl-8">
              <p className="font-serif italic text-3xl md:text-4xl leading-tight">"{p.q}"</p>
              <p className="mono-label !text-paper/60 mt-6">— {p.a}</p>
            </blockquote>
          ))}
        </div>
      </section>

      <footer className="border-t border-paper/20">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-8 flex flex-wrap justify-between mono-label !text-paper/70 gap-3">
          <span>S4X26 · TWINSEC · STAGE A · TUE 09:45</span>
          <Link to="/" className="hover:text-accent">
            ← RETURN TO BRIEFING
          </Link>
        </div>
      </footer>
    </main>
  );
}
