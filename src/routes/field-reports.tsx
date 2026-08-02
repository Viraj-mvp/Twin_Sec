import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useGsapReveal } from "@/hooks/use-gsap-reveal";
import { handleSmartBack } from "@/lib/nav-stack";

export const Route = createFileRoute("/field-reports")({
  head: () => ({
    meta: [
      { title: "Field Reports — TwinSec" },
      {
        name: "description",
        content:
          "Declassified incident narratives from live TwinSec exercises. Names redacted. Physics preserved.",
      },
      { property: "og:title", content: "TwinSec — Field Reports" },
      {
        property: "og:description",
        content: "Declassified incident narratives from live exercises.",
      },
    ],
  }),
  component: FieldReports,
});

type Report = {
  id: string;
  date: string;
  sector: string;
  site: string;
  title: string;
  classification: "UNCLASSIFIED" | "TLP:AMBER" | "TLP:RED";
  wc: number;
  author: string;
  lede: string;
  pull: string;
};

const REPORTS: Report[] = [
  {
    id: "FR-2026-018",
    date: "2026 · 06 · 11",
    sector: "POWER",
    site: "Substation-07 · Sector 9",
    title: "Fourteen Megawatts, Nine Minutes, No Alarms",
    classification: "TLP:AMBER",
    wc: 4820,
    author: "N. Arens",
    lede: "The relay did exactly what it was told. The problem was who told it.",
    pull: "It took the operator four minutes to notice a load bank had disappeared. The generator side never knew.",
  },
  {
    id: "FR-2026-014",
    date: "2026 · 05 · 22",
    sector: "WATER",
    site: "Basin-3 · Municipal Works",
    title: "The Sensors Lied for Six Hours",
    classification: "TLP:RED",
    wc: 6110,
    author: "H. Doré",
    lede: "A turbidity clamp. A silent chlorine walk. Two districts drank a rounding error.",
    pull: "Nothing about the SCADA display suggested anything was wrong. Nothing at all.",
  },
  {
    id: "FR-2026-011",
    date: "2026 · 04 · 30",
    sector: "OIL & GAS",
    site: "Delta-12 · Tower T-A",
    title: "The Reflex That Wasn't There",
    classification: "TLP:AMBER",
    wc: 5240,
    author: "M. Ilić",
    lede: "The safety solver disarmed itself in the middle of a shift change. Nobody read the audit log.",
    pull: "The compressor kept climbing. The trip never fired. The tower held — barely.",
  },
  {
    id: "FR-2026-007",
    date: "2026 · 03 · 14",
    sector: "MANUFACTURING",
    site: "Line-A · Assembly Cell 4",
    title: "A Model That Learned to Approve",
    classification: "UNCLASSIFIED",
    wc: 3980,
    author: "K. Rönn",
    lede: "Someone swapped the vision model at 03:04 on a Tuesday. Yield went up. Then a recall assembled itself on the pallet.",
    pull: "The line was proud of itself. Every part passed. Every part was wrong.",
  },
  {
    id: "FR-2026-003",
    date: "2026 · 02 · 02",
    sector: "PORT",
    site: "Berth 11 · Terminal Ω",
    title: "The Manifest Was the Weapon",
    classification: "TLP:RED",
    wc: 7120,
    author: "L. Okafor",
    lede: "The TOS is the terminal. Whoever writes rows writes reality.",
    pull: "A container of insulin routed to a dry stack in July. The reefers were fine. The database was not.",
  },
];

function FieldReports() {
  const rootRef = useGsapReveal<HTMLElement>();
  const [expanded, setExpanded] = useState<string | null>(REPORTS[0].id);

  return (
    <main ref={rootRef} className="min-h-screen bg-paper text-ink">
      <header className="border-b-2 border-ink">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-6 flex flex-wrap justify-between items-baseline gap-4 mono-label !text-ink">
          <button
            type="button"
            onClick={(e) => handleSmartBack(e)}
            className="hover:text-accent cursor-pointer bg-transparent border-0 p-0 text-left"
          >
            ← RETURN
          </button>
          <Link to="/case-files" className="text-accent font-bold animate-pulse">
            ★ EXPLORE INTERACTIVE CASE FILES →
          </Link>
          <span>VOL. VII · ISSUE 03 · 2026</span>
          <Link to="/twin-engine" className="hover:text-accent">
            TWIN ENGINE →
          </Link>
        </div>
      </header>

      <section className="border-b-2 border-ink">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-16 pb-24">
          <p className="mono-label !text-ink/60" data-reveal>
            FIELD REPORTS
          </p>
          <h1
            className="display text-[16vw] md:text-[12vw] lg:text-[180px] leading-[0.82] mt-6 tracking-tight"
            data-reveal
          >
            What actually
            <br />
            <span className="italic font-serif normal-case">happened.</span>
          </h1>
          <div className="grid grid-cols-12 mt-14 gap-8" data-reveal>
            <p className="col-span-12 md:col-span-6 md:col-start-2 font-serif text-2xl italic leading-snug text-ink/80">
              Every entry below is a real incident, run inside a TwinSec twin. Names redacted.
              Physics preserved. The debrief runs long on purpose — the point is not the compromise,
              it is the ninety minutes that followed.
            </p>
            <div className="col-span-12 md:col-span-3 md:col-start-9 border-l border-ink/30 pl-6 grid grid-cols-2 gap-4">
              <Fig k="ENTRIES" v="187" />
              <Fig k="THIS YEAR" v="42" />
              <Fig k="SECTORS" v="7" />
              <Fig k="AVG WC" v="5.1K" />
            </div>
          </div>
        </div>
      </section>

      {/* Editorial ledger */}
      <section>
        <div className="mx-auto max-w-[1400px] border-b-2 border-ink">
          <div className="grid grid-cols-12 mono-label !text-ink/60 px-6 lg:px-10 py-4 border-b border-ink/30">
            <span className="col-span-2">DATE</span>
            <span className="col-span-2">ID · SECTOR</span>
            <span className="col-span-6">TITLE</span>
            <span className="col-span-1">WC</span>
            <span className="col-span-1 text-right">TLP</span>
          </div>
          <ol>
            {REPORTS.map((r) => {
              const open = expanded === r.id;
              return (
                <li key={r.id} className="border-b border-ink/20" data-reveal>
                  <button
                    onClick={() => setExpanded(open ? null : r.id)}
                    aria-expanded={open}
                    className="w-full text-left grid grid-cols-12 items-baseline gap-x-4 px-6 lg:px-10 py-6 hover:bg-ink hover:text-paper transition-colors focus:outline-none focus-visible:bg-ink focus-visible:text-paper"
                  >
                    <span className="col-span-2 font-mono text-xs tabular-nums">{r.date}</span>
                    <span className="col-span-2 mono-label">
                      {r.id}
                      <br />
                      <span className="opacity-60">{r.sector}</span>
                    </span>
                    <span className="col-span-6 display text-3xl md:text-4xl leading-none">
                      {r.title}
                    </span>
                    <span className="col-span-1 font-mono text-xs tabular-nums">
                      {r.wc.toLocaleString()}w
                    </span>
                    <span
                      className={`col-span-1 mono-label text-right ${r.classification === "TLP:RED" ? "text-danger" : r.classification === "TLP:AMBER" ? "text-warn" : ""}`}
                    >
                      {r.classification}
                    </span>
                  </button>
                  {open && (
                    <div className="grid grid-cols-12 gap-8 px-6 lg:px-10 pb-12 pt-2">
                      <p className="col-span-12 md:col-span-2 mono-label !text-ink/60">
                        {r.site}
                        <br />
                        BY {r.author.toUpperCase()}
                      </p>
                      <div className="col-span-12 md:col-span-10">
                        <p className="font-serif text-3xl md:text-4xl leading-tight italic text-ink">
                          "{r.lede}"
                        </p>
                        <div className="mt-8 grid md:grid-cols-2 gap-8">
                          <p className="font-serif text-lg leading-relaxed text-ink/85">
                            The debrief opens with a wall-clock timeline reconstructed from the
                            twin's own telemetry — every write, every setpoint, every packet. The
                            operator's console is replayed on the left. The adversary's view is
                            replayed on the right. They see the same values. They do not see the
                            same reality.
                          </p>
                          <div className="border-l-2 border-ink pl-6">
                            <p className="mono-label !text-ink/60">PULL QUOTE</p>
                            <p className="font-serif text-2xl italic leading-snug mt-3">
                              "{r.pull}"
                            </p>
                          </div>
                        </div>
                        <div className="mt-8 flex flex-wrap gap-4">
                          <Link
                            to="/simulation"
                            search={{
                              sector: r.sector
                                .toLowerCase()
                                .replace(" & ", "-")
                                .replace(/ /g, "-") as never,
                            }}
                            className="bg-ink text-paper mono-label px-5 py-3 hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            REPLAY THIS INCIDENT →
                          </Link>
                          <Link
                            to="/case-files"
                            className="border border-ink mono-label px-5 py-3 hover:bg-ink hover:text-paper transition-colors block"
                          >
                            VIEW INCIDENT RESEARCH DOSSIER →
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <footer className="border-t-2 border-ink mt-24">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-8 flex flex-wrap justify-between mono-label !text-ink/70 gap-3">
          <span>TWINSEC FIELD REPORTS · 2026</span>
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
      <p className="mono-label !text-ink/60">{k}</p>
      <p className="display text-3xl mt-1 leading-none">{v}</p>
    </div>
  );
}
