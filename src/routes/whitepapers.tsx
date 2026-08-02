import { createFileRoute, Link } from "@tanstack/react-router";
import { useGsapReveal } from "@/hooks/use-gsap-reveal";
import { handleSmartBack } from "@/lib/nav-stack";

export const Route = createFileRoute("/whitepapers")({
  head: () => ({
    meta: [
      { title: "Whitepapers — TwinSec Research" },
      {
        name: "description",
        content:
          "TwinSec research papers on cyber-physical simulation, adversary emulation, and industrial digital twins.",
      },
      { property: "og:title", content: "TwinSec — Whitepapers" },
      {
        property: "og:description",
        content: "Peer-reviewed and industry research from the TwinSec Twin Engine.",
      },
    ],
  }),
  component: Whitepapers,
});

const PAPERS = [
  {
    n: "01",
    cat: "PHYSICS",
    title: "Ground-Truth Deviation Bounds for OT Digital Twins",
    authors: ["N. Arens", "H. Doré", "M. Ilić"],
    venue: "USENIX Security · 2026",
    pages: 18,
    doi: "10.48550/twinsec.2026.01",
    url: "https://www.usenix.org/conferences/by-topic/security",
    abstract:
      "We define and bound the observable deviation between a live industrial process and its digital twin under adversarial input, and show empirical bounds across 62 PLC-controlled subsystems.",
  },
  {
    n: "02",
    cat: "ADVERSARY",
    title: "UNIT-414: A Reproducible Adversary Emulation Kit for Substation Environments",
    authors: ["N. Arens", "K. Rönn"],
    venue: "IEEE S&P · 2025",
    pages: 22,
    doi: "10.48550/twinsec.2025.11",
    url: "https://ieeexplore.ieee.org/Xplore/home.jsp",
    abstract:
      "A modular, reproducible substation-focused adversary emulation kit spanning EWS compromise, protection-relay manipulation, and safe reversibility.",
  },
  {
    n: "03",
    cat: "SAFETY",
    title: "Silent Interlock Bypass in SIL-3 Safety Instrumented Systems",
    authors: ["M. Ilić", "L. Okafor"],
    venue: "S4x25 Miami",
    pages: 14,
    doi: "10.48550/twinsec.2025.08",
    url: "https://s4events.com",
    abstract:
      "We demonstrate a class of silent interlock-bypass attacks on SIL-3 SIS deployments and propose a runtime attestation layer with negligible cycle-time cost.",
  },
  {
    n: "04",
    cat: "SIMULATION",
    title: "The Twin Engine: Frame-Consistent Replay of Cyber-Physical Incidents",
    authors: ["N. Arens", "H. Doré", "T. Sato"],
    venue: "ACM CCS · 2024",
    pages: 26,
    doi: "10.48550/twinsec.2024.19",
    url: "https://dl.acm.org/conference/ccs",
    abstract:
      "We introduce a frame-consistent replay architecture supporting deterministic operator scrubbing, branch-outcome dossiers, and cross-facility dependency tracing.",
  },
  {
    n: "05",
    cat: "WATER",
    title: "Sensor Clamp Attacks Against Municipal Water Treatment SCADA",
    authors: ["H. Doré"],
    venue: "DEF CON 33 · ICS Village",
    pages: 12,
    doi: "10.48550/twinsec.2025.04",
    url: "https://defcon.org",
    abstract:
      "A field-driven study of turbidity- and chlorine-sensor clamp attacks, with an empirical detection technique using PLC-side statistical audit.",
  },
];

function Whitepapers() {
  const rootRef = useGsapReveal<HTMLElement>();
  return (
    <main ref={rootRef} className="min-h-screen bg-background text-foreground">
      <header className="border-b border-rule">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-5 flex flex-wrap justify-between items-baseline gap-4 mono-label">
          <button
            type="button"
            onClick={(e) => handleSmartBack(e)}
            className="hover:text-accent cursor-pointer bg-transparent border-0 p-0 text-left"
          >
            ← RETURN
          </button>
          <span>TWINSEC RESEARCH · WHITEPAPERS · 2026</span>
          <Link to="/field-reports" className="hover:text-accent">
            FIELD REPORTS →
          </Link>
        </div>
      </header>

      <section className="relative border-b border-rule overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative mx-auto max-w-[1600px] px-6 lg:px-10 py-24 lg:py-36 grid grid-cols-12 gap-10">
          <div className="col-span-12 md:col-span-7" data-reveal>
            <p className="mono-label">SECTION 00 — RESEARCH</p>
            <h1 className="display text-6xl md:text-8xl lg:text-[140px] leading-[0.85] mt-6">
              Signed.
              <br />
              <span className="text-accent">Reviewed.</span>
              <br />
              <span className="italic font-serif normal-case">Reproducible.</span>
            </h1>
          </div>
          <div
            className="col-span-12 md:col-span-4 md:col-start-9 border-l border-rule pl-8 flex flex-col justify-end"
            data-reveal
          >
            <p className="font-serif text-xl italic leading-snug text-foreground/80">
              Every paper below ships with a Twin Engine world you can rerun in your browser. The
              abstract is the trailer. The world is the film.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              <Fig k="PAPERS" v="24" />
              <Fig k="VENUES" v="9" />
              <Fig k="CITES" v="1.4K" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[1600px]">
          {PAPERS.map((p, i) => (
            <article
              key={p.n}
              className="grid grid-cols-12 gap-x-8 border-b border-rule px-6 lg:px-10 py-14 lg:py-20 group"
              data-reveal
            >
              <div className="col-span-12 md:col-span-2">
                <p className="display text-7xl md:text-8xl leading-none text-foreground/30 group-hover:text-accent transition-colors">
                  {p.n}
                </p>
                <p className="mono-label mt-4 text-accent">{p.cat}</p>
              </div>
              <div className="col-span-12 md:col-span-7 mt-6 md:mt-0">
                <h2 className="display text-3xl md:text-5xl leading-[0.95]">{p.title}</h2>
                <p className="font-mono text-xs uppercase text-foreground/60 mt-4">
                  {p.authors.join(" · ")} — <span className="text-accent">{p.venue}</span>
                </p>
                <p className="font-serif italic text-lg text-foreground/80 mt-6 leading-snug max-w-[62ch]">
                  {p.abstract}
                </p>
              </div>
              <div className="col-span-12 md:col-span-3 mt-6 md:mt-0 md:border-l md:border-rule md:pl-8 flex flex-col justify-between gap-6">
                <div>
                  <p className="mono-label">PAGES</p>
                  <p className="display text-4xl mt-1">{p.pages}</p>
                  <p className="mono-label mt-6">DOI</p>
                  <p className="font-mono text-xs mt-2 break-all text-foreground/70">{p.doi}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-accent text-accent-foreground mono-label py-2.5 text-center hover:bg-foreground hover:text-background transition-colors font-bold block"
                  >
                    VIEW AT PUBLISHER (PDF) ↗
                  </a>
                  <Link
                    to="/twin-engine"
                    className="border border-rule mono-label py-2.5 text-center hover:border-accent hover:text-accent transition-colors"
                  >
                    RUN THE WORLD →
                  </Link>
                </div>
              </div>
              {i === 0 && (
                <p className="col-span-12 mono-label text-accent mt-8">
                  ★ FEATURED · CURRENT COVER
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-rule">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-8 flex flex-wrap justify-between mono-label gap-3">
          <span>TWINSEC RESEARCH · 2026</span>
          <button
            type="button"
            onClick={(e) => handleSmartBack(e)}
            className="hover:text-accent cursor-pointer bg-transparent border-0 p-0 text-left"
          >
            ← RETURN
          </button>
        </div>
      </footer>
    </main>
  );
}

function Fig({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="mono-label">{k}</p>
      <p className="display text-2xl mt-1 leading-none">{v}</p>
    </div>
  );
}
