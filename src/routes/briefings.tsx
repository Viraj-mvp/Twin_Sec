import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useTransition } from "react";
import { useGsapReveal } from "@/hooks/use-gsap-reveal";
import { TwinSecLogo } from "@/components/branding/TwinSecLogo";
import briefingsHero from "@/assets/briefings-hero.jpg";
import briefingsLab from "@/assets/briefings-lab.jpg";
import {
  ArrowUpRight,
  ShieldAlert,
  Cpu,
  Terminal,
  FileText,
  Activity,
  AlertTriangle,
  BookOpen,
  Radio,
  Binary,
  ExternalLink,
  ChevronRight,
  Fingerprint,
} from "lucide-react";

export const Route = createFileRoute("/briefings")({
  head: () => ({
    meta: [
      { title: "TwinSec — Intelligence & Research Hub | Field Dossiers" },
      {
        name: "description",
        content:
          "Central intelligence archive and technical briefings: DEF CON keynotes, S4 conference talks, peer-reviewed physics whitepapers, declassified field reports, and FBI BAU threat psychology profiles.",
      },
    ],
  }),
  component: BriefingsPage,
});

type CategoryFilter = "ALL" | "KEYNOTE" | "RESEARCH" | "INCIDENT" | "PSYCHOLOGY";

interface DossierCard {
  id: string;
  title: string;
  subtitle: string;
  category: CategoryFilter;
  categoryLabel: string;
  locationTrack: string;
  abstract: string;
  ttpCode: string;
  physicsIndicator: string;
  to: string;
  accentBorder?: boolean;
}

const DOSSIERS: DossierCard[] = [
  {
    id: "defcon-33",
    title: "DEF CON 33 BRIEF",
    subtitle: "ICS VILLAGE DEMO",
    category: "KEYNOTE",
    categoryLabel: "KEYNOTE DEMO",
    locationTrack: "ICS VILLAGE STAGE · LAS VEGAS",
    abstract:
      "Live twin engine demonstration: intercepting unauthenticated Modbus TCP coil commands and forcing mechanical overspeed on high-voltage generation turbines in under 90 seconds.",
    ttpCode: "T0814 · T0855 · T0831",
    physicsIndicator: "FREQUENCY DRIFT: 63.8 Hz (TRIP)",
    to: "/def-con-brief",
    accentBorder: true,
  },
  {
    id: "s4-miami",
    title: "S4X26 MIAMI TALK",
    subtitle: "STAGE A KEYNOTE",
    category: "KEYNOTE",
    categoryLabel: "SAFETY RESEARCH",
    locationTrack: "STAGE A AUDITORIUM · MIAMI SOUTH BEACH",
    abstract:
      "Silent interlock bypass in Safety Instrumented Systems (SIS). Mathematical breakdown of Triconex firmware overrides and blindspot injection prior to emergency pneumatic vents.",
    ttpCode: "T0858 · T0887 · T0839",
    physicsIndicator: "PRESSURE SURGE: +18.4 bar/min",
    to: "/s4-talk",
  },
  {
    id: "whitepapers",
    title: "RESEARCH WHITEPAPERS",
    subtitle: "ACADEMIC PEER-REVIEWED",
    category: "RESEARCH",
    categoryLabel: "PUBLICATIONS",
    locationTrack: "USENIX SECURITY · IEEE S&P · ACM CCS",
    abstract:
      "Formal deviation bounds and state estimation bounds for physics-consistent digital twins. Proofs of stealth attack detectability limits against optimal linear Kalman filters in discrete OT plants.",
    ttpCode: "T0884 · T0806 · T0836",
    physicsIndicator: "KALMAN RESIDUAL: ||e|| > 0.042",
    to: "/whitepapers",
  },
  {
    id: "field-reports",
    title: "DECLASSIFIED FIELD REPORTS",
    subtitle: "TACTICAL OT LOGS",
    category: "INCIDENT",
    categoryLabel: "INCIDENT TIMELINES",
    locationTrack: "VOL. VII · CRITICAL INFRASTRUCTURE DEFENSE",
    abstract:
      "Substation breaker tripping, caustic soda dosing drift, and container crane lockout. Telemetry timelines reconstructed second-by-second from live twin sensor traces.",
    ttpCode: "T0807 · T0832 · T0816",
    physicsIndicator: "THERMAL LOAD: 118°C (RUNAWAY)",
    to: "/field-reports",
  },
  {
    id: "case-files",
    title: "HISTORICAL CASE FILES",
    subtitle: "FORENSIC ARCHIVE",
    category: "INCIDENT",
    categoryLabel: "HISTORICAL INTEL",
    locationTrack: "MITRE ATT&CK FOR ICS ARCHIVE",
    abstract:
      "Exhaustive post-mortem dossiers covering Stuxnet (2010), Industroyer / CrashOverride (2016), Triton / Trisis (2017), and the Colonial Pipeline IT/OT isolation cascade.",
    ttpCode: "T0812 · T0835 · T0802",
    physicsIndicator: "CENTRIFUGE HARMONIC FAILURE",
    to: "/case-files",
  },
  {
    id: "threat-profiles",
    title: "MINDHUNTER BAU DOSSIERS",
    subtitle: "BEHAVIORAL THREAT PSYCHOLOGY",
    category: "PSYCHOLOGY",
    categoryLabel: "PSYCHOLOGICAL PROFILES",
    locationTrack: "FBI BAU-4 / INDUSTRIAL CYBER CRIME",
    abstract:
      "Psychological profiles, operational tempo, escalation triggers, and victim selection patterns of Sandworm (GRU), DarkSide, Volt Typhoon, and rogue internal operators.",
    ttpCode: "T0869 · T0888 · T0883",
    physicsIndicator: "STEALTH RESIDENCE: 247 DAYS",
    to: "/threat-profiles",
    accentBorder: true,
  },
];

function BriefingsPage() {
  const rootRef = useGsapReveal<HTMLElement>();
  const [selectedFilter, setSelectedFilter] = useState<CategoryFilter>("ALL");
  const [, startTransition] = useTransition();

  const handleFilterChange = (filter: CategoryFilter) => {
    startTransition(() => {
      setSelectedFilter(filter);
    });
  };

  const filteredDossiers =
    selectedFilter === "ALL" ? DOSSIERS : DOSSIERS.filter((d) => d.category === selectedFilter);

  return (
    <main ref={rootRef} className="min-h-screen bg-background text-foreground">
      {/* ── TOP TACTICAL NAVIGATION STRIP ── */}
      <header className="border-b-2 border-rule bg-background sticky top-0 z-40">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TwinSecLogo className="size-5" />
            <Link
              to="/"
              className="font-mono text-sm tracking-wider font-bold hover:text-accent transition-colors flex items-center gap-2"
            >
              <span>TWINSEC</span>
              <span className="text-foreground/40 font-normal">/</span>
              <span className="text-accent">BRIEFINGS</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6 mono-label text-xs">
            <div className="flex items-center gap-2 text-accent">
              <span className="relative flex size-2 items-center justify-center shrink-0">
                <span className="absolute inline-flex size-full rounded-full opacity-75 animate-ping bg-accent" />
                <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
              </span>
              <span>DEFCON 2 // SYSTEM ARMED</span>
            </div>
            <span className="text-foreground/30">|</span>
            <span className="text-foreground/60">CLEARANCE: SECRET // NOFORN</span>
            <span className="text-foreground/30">|</span>
            <Link to="/faq" className="text-foreground/70 hover:text-accent transition-colors">
              FAQ MANUAL
            </Link>
            <Link
              to="/simulation"
              className="px-3 py-1 bg-accent text-accent-foreground font-bold hover:bg-foreground hover:text-background transition-colors"
            >
              LAUNCH RANGE →
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="border-b-2 border-rule relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="absolute inset-0">
          <img
            src={briefingsHero}
            alt="Tactical Defense Intelligence Briefing Center"
            width={1920}
            height={1080}
            fetchPriority="high"
            className="h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 scanline pointer-events-none opacity-50" />
        </div>

        <div className="relative mx-auto max-w-[1600px] px-6 lg:px-10 py-20 lg:py-28">
          <div
            className="flex flex-wrap items-center justify-between gap-4 mono-label mb-8"
            data-reveal
          >
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-accent/10 border border-accent/40 text-accent font-bold text-xs tracking-wider">
                CENTRAL REPOSITORY // FIELD INTEL
              </span>
              <span className="text-foreground/40 font-mono">CODE: TS-ARCHIVE-88</span>
            </div>
            <div className="text-xs text-foreground/60 font-mono">
              CLASSIFIED DOSSIERS · REV 4.2.0
            </div>
          </div>

          <h1
            className="display text-[13vw] md:text-[9vw] lg:text-[130px] leading-[0.84] uppercase tracking-tight"
            data-reveal
          >
            INTELLIGENCE &amp;
            <br />
            <span className="text-accent">RESEARCH HUB.</span>
          </h1>

          <div className="grid grid-cols-12 gap-8 mt-10 pt-10 border-t border-rule" data-reveal>
            <p className="col-span-12 lg:col-span-7 font-serif italic text-xl sm:text-2xl text-foreground/80 leading-relaxed">
              Declassified conference keynotes, peer-reviewed cyber-physical deviation bounds,
              incident replays reconstructed from live twin runs, and FBI behavioral threat
              psychology dossiers.
            </p>
            <div className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="border border-rule bg-card/60 p-4 space-y-1">
                <span className="mono-label text-[10px] text-foreground/50">ARCHIVE VOLUME</span>
                <p className="display text-3xl text-accent">06 TRACKS</p>
                <p className="mono-label text-[10px] text-foreground/70">ALL UNCLASSIFIED</p>
              </div>
              <div className="border border-rule bg-card/60 p-4 space-y-1">
                <span className="mono-label text-[10px] text-foreground/50">PHYSICS ENGINE</span>
                <p className="display text-3xl">100% FAITHFUL</p>
                <p className="mono-label text-[10px] text-accent">ZERO COMPROMISE</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTER TABS ── */}
      <section className="border-b-2 border-rule bg-card/40 sticky top-14 z-30 backdrop-blur-none">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            <span className="mono-label text-xs text-foreground/40 mr-2 shrink-0">
              FILTER DOSSIERS:
            </span>
            {(
              [
                { id: "ALL", label: "ALL DOSSIERS" },
                { id: "KEYNOTE", label: "KEYNOTE DEMOS" },
                { id: "RESEARCH", label: "PUBLICATIONS" },
                { id: "INCIDENT", label: "FIELD INCIDENTS" },
                { id: "PSYCHOLOGY", label: "THREAT PSYCHOLOGY" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleFilterChange(tab.id)}
                className={`mono-label text-xs px-3 py-1.5 border transition-all cursor-pointer select-none shrink-0 ${
                  selectedFilter === tab.id
                    ? "bg-accent text-accent-foreground border-accent font-bold shadow-comic-accent"
                    : "bg-background text-foreground/70 border-rule hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4 mono-label text-xs text-foreground/50">
            <span>
              SHOWING {filteredDossiers.length} OF {DOSSIERS.length} ITEMS
            </span>
          </div>
        </div>
      </section>

      {/* ── DOSSIER GRID SECTION ── */}
      <section className="py-16 lg:py-24 border-b-2 border-rule">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-rule pb-6">
            <div>
              <div className="flex items-center gap-3 mono-label text-xs mb-2">
                <span className="text-accent font-bold">SECTION 01</span>
                <span className="text-foreground/40">—</span>
                <span className="text-foreground/70">CURATED OPERATOR DOSSIERS</span>
              </div>
              <h2 className="display text-4xl sm:text-6xl tracking-tight">
                SELECT A <span className="text-accent">DOSSIER TRACK</span>
              </h2>
            </div>
            <p className="font-serif italic text-base text-foreground/70 max-w-md">
              Each dossier includes full physical telemetry charts, MITRE ICS techniques, and direct
              rehearsal commands for the operator terminal.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredDossiers.map((dossier, idx) => (
              <Link
                key={dossier.id}
                to={dossier.to as "/def-con-brief"}
                className={`group flex flex-col justify-between border-2 bg-card p-6 lg:p-8 transition-all duration-150 hover:-translate-y-1 hover:shadow-comic-accent relative ${
                  dossier.accentBorder
                    ? "border-accent/80 hover:border-accent"
                    : "border-rule hover:border-accent"
                }`}
                data-reveal
              >
                {/* Top Metas */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2 mono-label text-[11px]">
                    <span className="px-2 py-0.5 bg-accent/15 border border-accent/40 text-accent font-bold">
                      {dossier.categoryLabel}
                    </span>
                    <span className="text-foreground/40 font-mono">0{idx + 1} // 06</span>
                  </div>

                  <div className="pt-2">
                    <p className="mono-label text-[10px] text-foreground/50 tracking-wider">
                      {dossier.locationTrack}
                    </p>
                    <h3 className="display text-3xl sm:text-4xl group-hover:text-accent transition-colors leading-[0.95] mt-1">
                      {dossier.title}
                    </h3>
                    <p className="mono-label text-xs text-accent mt-1">{dossier.subtitle}</p>
                  </div>

                  <p className="font-serif italic text-base text-foreground/80 leading-relaxed pt-2 border-t border-rule/50">
                    {dossier.abstract}
                  </p>
                </div>

                {/* Bottom Badges & Action */}
                <div className="pt-6 mt-6 border-t border-rule space-y-3">
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-foreground/60">
                      <span>TTP CODES:</span>
                      <span className="text-foreground font-bold">{dossier.ttpCode}</span>
                    </div>
                    <div className="flex items-center justify-between text-foreground/60">
                      <span>PHYSICS DRIFT:</span>
                      <span className="text-amber-400 font-bold">{dossier.physicsIndicator}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between mono-label text-xs font-bold text-accent group-hover:text-accent">
                    <span className="group-hover:translate-x-1 transition-transform">
                      ACCESS DOSSIER
                    </span>
                    <ArrowUpRight className="size-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECHNICAL FACILITY SPOTLIGHT (SECTION 02) ── */}
      <section className="py-20 lg:py-28 border-b-2 border-rule relative overflow-hidden bg-card/20">
        <div className="absolute inset-0">
          <img
            src={briefingsLab}
            alt="Physical convergence command facility"
            width={1920}
            height={1080}
            loading="lazy"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/60" />
          <div className="absolute inset-0 scanline pointer-events-none opacity-40" />
        </div>

        <div className="relative mx-auto max-w-[1600px] px-6 lg:px-10 grid grid-cols-12 gap-8 items-center">
          <div className="col-span-12 lg:col-span-7 space-y-6" data-reveal>
            <div className="flex items-center gap-3 mono-label text-xs">
              <span className="text-accent font-bold">SECTION 02</span>
              <span className="text-foreground/40">—</span>
              <span className="text-foreground/70">LABORATORY CONVERGENCE</span>
            </div>

            <h2 className="display text-5xl sm:text-7xl lg:text-8xl leading-[0.88]">
              FROM PAPER TO <span className="text-accent">PACKET.</span>
            </h2>

            <p className="font-serif italic text-xl text-foreground/85 leading-relaxed max-w-2xl">
              Unlike theoretical slides or textbook checklists, every briefing in this repository is
              derived from live deterministic simulation runs. You can replay the identical threat
              packet sequence directly in the browser range.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="border border-rule bg-background/80 p-5 space-y-2">
                <div className="flex items-center gap-2 text-accent">
                  <Activity className="size-4" />
                  <span className="mono-label text-xs font-bold">PHYSICAL SENSOR FAITHFULNESS</span>
                </div>
                <p className="font-serif text-sm text-foreground/80 leading-normal">
                  Rotor inertia, fluid viscosity, and thermal convection recalculated every 50ms.
                </p>
              </div>

              <div className="border border-rule bg-background/80 p-5 space-y-2">
                <div className="flex items-center gap-2 text-accent">
                  <Terminal className="size-4" />
                  <span className="mono-label text-xs font-bold">LIVE OPERATOR CLI</span>
                </div>
                <p className="font-serif text-sm text-foreground/80 leading-normal">
                  Real commands: <code className="text-accent font-mono">attack -v T-002</code>,{" "}
                  <code className="text-accent font-mono">isolate PLC-01</code>,{" "}
                  <code className="text-accent font-mono">patch --airgap</code>.
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <Link
                to="/simulation"
                className="px-6 py-3.5 bg-accent text-accent-foreground font-mono text-sm font-bold tracking-wider hover:bg-foreground hover:text-background transition-colors flex items-center gap-2 border-2 border-black shadow-comic"
              >
                <span>OPEN SIMULATION RANGE</span>
                <span>→</span>
              </Link>
              <Link
                to="/threat-intel"
                className="px-6 py-3.5 bg-card text-foreground font-mono text-sm font-bold tracking-wider hover:border-accent hover:text-accent transition-colors flex items-center gap-2 border-2 border-rule"
              >
                <ShieldAlert className="size-4" />
                <span>CYBER-PHYSICAL THREAT LAB</span>
              </Link>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5" data-reveal>
            {/* Tactical Console Mock */}
            <div className="border-2 border-rule bg-black p-6 space-y-4 shadow-comic">
              <div className="flex items-center justify-between border-b border-rule pb-3 mono-label text-xs">
                <div className="flex items-center gap-2">
                  <span className="size-2 bg-red-500 rounded-none inline-block" />
                  <span className="size-2 bg-amber-400 rounded-none inline-block" />
                  <span className="size-2 bg-accent rounded-none inline-block" />
                  <span className="text-foreground/70 ml-2">root@twinsec-briefing:~#</span>
                </div>
                <span className="text-accent font-mono text-[10px]">LIVE REPLAY</span>
              </div>

              <pre className="font-mono text-xs leading-relaxed text-foreground/80 space-y-1 overflow-x-auto">
                <div className="text-accent">$ twinsec run --scenario S4-SIS-OVERRIDE</div>
                <div className="text-foreground/50">[00:00.012] Loading twin: REFINERY-BAY-4</div>
                <div className="text-foreground/50">
                  [00:00.045] Injecting Modbus coil command 0x05
                </div>
                <div className="text-amber-400">
                  [00:01.210] CAUTION: Pressure rate +18.4 bar/min
                </div>
                <div className="text-red-400">
                  [00:01.890] ALERT: SIL-3 Safety Interlock Bypassed
                </div>
                <div className="text-foreground/50">
                  [00:02.100] Graph recalculation complete: 0.08ms
                </div>
                <div className="text-accent">
                  [00:02.400] Sigma rule generated: ICS-T0858-TRIC-01.yml
                </div>
              </pre>

              <div className="border-t border-rule pt-4 flex items-center justify-between mono-label text-xs text-foreground/50">
                <span>STATUS: BUFFER FLUSHED</span>
                <span className="text-accent">DETERMINISTIC: 100%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER DIRECTORY LINK ── */}
      <footer className="border-t-2 border-rule bg-background py-16">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <TwinSecLogo className="size-5" />
              <span className="font-mono text-base font-bold">TWINSEC INDUSTRIAL DEFENSE</span>
            </div>
            <p className="mono-label text-xs text-foreground/50">
              REHEARSE AT FULL PHYSICS · ZERO SPILLED COOLANT · EST. 2026
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mono-label text-xs">
            <Link to="/" className="hover:text-accent transition-colors">
              [1] HOME
            </Link>
            <Link to="/simulation" className="hover:text-accent transition-colors">
              [2] RANGE
            </Link>
            <Link to="/threat-intel" className="hover:text-accent transition-colors">
              [3] THREAT MATRIX
            </Link>
            <Link to="/threat-profiles" className="hover:text-accent transition-colors">
              [4] MINDHUNTER
            </Link>
            <Link to="/faq" className="hover:text-accent transition-colors">
              [5] FAQ MANUAL
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
