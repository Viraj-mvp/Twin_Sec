import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import facility from "@/assets/facility.jpg";
import schematic from "@/assets/schematic.jpg";
import breaker from "@/assets/breaker.jpg";
import mindhunterImg from "@/assets/mindhunter.png";
import { useGsapReveal } from "@/hooks/use-gsap-reveal";
import { useSplitCharReveal, useScrambleReveal, useWordReveal } from "@/hooks/use-text-anim";
import { useOperatorSession } from "@/lib/auth-store";
import { useOperator } from "@/contexts/OperatorContext";
import { logoutOperator } from "@/lib/api/auth.functions";
import { Footer } from "../components/Footer";
import FlowArt, { FlowSection } from "@/components/ui/story-scroll";
import { pushNavSection } from "@/lib/nav-stack";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TwinSec — Cyber-Physical Simulation for Industrial Systems" },
      {
        name: "description",
        content:
          "TwinSec is a cyber-physical simulation platform for industrial operators. Model attacks, propagate risk, replay incidents — before the facility does.",
      },
      { property: "og:title", content: "TwinSec — Attacks Don't Stay Digital." },
      {
        property: "og:description",
        content: "A living environment for industrial cyber risk. Simulate. Propagate. Replay.",
      },
    ],
  }),
  component: Index,
});

function Marquee() {
  const items = [
    "ICS-CERT BULLETIN 24-118",
    "TURBINE-04 OVER-SPEED ALERT",
    "PLC RUNG REWRITE DETECTED",
    "RELAY 33B TRIPPED",
    "SCADA HISTORIAN — REPLAY READY",
    "BLACK START PROCEDURE LOADED",
    "MODBUS/TCP — 14 ANOMALIES",
    "SIMULATION CLOCK +00:14:22",
  ];
  const all = [...items, ...items];
  return (
    <div className="border-y border-rule bg-background overflow-hidden">
      <div className="flex whitespace-nowrap animate-ticker py-3">
        {all.map((t, i) => (
          <div key={i} className="mono-label flex items-center gap-6 px-6 !text-foreground">
            <span className="size-2 bg-accent rounded-full animate-pulse-dot" />
            <span className="text-foreground font-bold tracking-wider">{t}</span>
            <span className="text-accent font-bold">/</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  const heroRef = useSplitCharReveal<HTMLHeadingElement>();
  const leadRef = useWordReveal<HTMLParagraphElement>();
  return (
    <section className="relative border-b border-rule overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute inset-0">
        <img
          src={facility}
          alt="Industrial facility at dusk"
          width={1920}
          height={1080}
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 scanline pointer-events-none" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-6 lg:px-10 pt-20 pb-32 lg:pt-32 lg:pb-44">
        <div className="flex items-center justify-between mb-12 mono-label text-xs font-mono tracking-widest uppercase animate-reveal">
          <span className="text-foreground/90 font-medium">ISSUE 001 · VOL. III</span>
          <span className="hidden md:inline text-accent font-bold tracking-[0.2em]">
            FIELD REPORT · SECTOR 9 · TURBINE HALL
          </span>
          <span className="text-foreground/90 font-medium">17 JUN 2026 · 04:17 UTC</span>
        </div>

        <h1
          ref={heroRef}
          className="display text-[18vw] md:text-[14vw] lg:text-[200px] leading-[0.82] overflow-hidden"
        >
          ATTACKS
          <br />
          DON&apos;T STAY
          <br />
          <span className="text-accent">DIGITAL.</span>
        </h1>

        <div
          className="mt-16 grid grid-cols-12 gap-6 animate-reveal"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="col-span-12 md:col-span-5 md:col-start-2">
            <p className="mono-label mb-4">A FIELD MANUAL</p>
            <p
              ref={leadRef}
              className="font-serif text-2xl md:text-3xl leading-[1.15] text-foreground/90 italic"
            >
              When a packet crosses the air-gap, concrete moves. Turbines spin out of tolerance.
              Breakers latch. Cities lose pressure. TwinSec lets you watch consequences unfold
              before they reach the facility.
            </p>
          </div>
          <div className="col-span-12 md:col-span-4 md:col-start-8 md:border-l md:border-rule md:pl-8 space-y-6">
            <div>
              <p className="mono-label">CURRENT EXERCISE</p>
              <p className="text-xl mt-2">Substation-7 / SCENARIO &ldquo;HOLLOW&rdquo;</p>
            </div>
            <div className="hairline" />
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="mono-label">NODES</p>
                <p className="display text-5xl mt-1">2,481</p>
              </div>
              <div>
                <p className="mono-label">PROPAGATION</p>
                <p className="display text-5xl mt-1 text-accent">
                  14<span className="text-foreground/40 text-2xl">/s</span>
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Link
                to="/twin-engine"
                className="flex-1 bg-foreground text-background mono-label py-3 text-center hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                ENTER TWIN ENGINE →
              </Link>
              <Link
                to="/simulation"
                search={{ sector: "power" }}
                className="border border-foreground/40 mono-label px-4 py-3 hover:border-accent hover:text-accent transition-colors"
                aria-label="Launch simulation"
              >
                ▶
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Manifesto() {
  const scrambleRef = useScrambleReveal<HTMLParagraphElement>();
  return (
    <section className="border-b border-rule">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-24 lg:py-40 grid grid-cols-12 gap-8">
        <div className="col-span-12 md:col-span-3 mono-label space-y-2">
          <p>SECTION 01</p>
          <p ref={scrambleRef} className="text-accent">
            — THE FACILITY IS ALIVE.
          </p>
        </div>
        <div className="col-span-12 md:col-span-9">
          <p className="display text-5xl md:text-7xl lg:text-[110px] leading-[0.9]" data-reveal>
            Software does not
            <br />
            stop at the screen.
            <br />
            <span className="text-foreground/40">It rotates shafts.</span>
            <br />
            It lifts pressure.
            <br />
            <span className="text-foreground/40">It opens valves.</span>
          </p>
          <div className="mt-16 grid md:grid-cols-3 gap-10 md:gap-16">
            <p className="font-serif text-xl leading-snug">
              For thirty years, IT and OT were governed as separate continents. The packets crossed
              anyway.
            </p>
            <p className="font-serif text-xl leading-snug text-foreground/70">
              Operators inherited the consequences without inheriting the controls. Adversaries
              learned faster than the standards body.
            </p>
            <p className="font-serif text-xl leading-snug text-foreground/70">
              TwinSec is a place to rehearse the next incident — at full physics, with full blame,
              with no spilled coolant.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function BriefingHub() {
  const scrambleRef = useScrambleReveal<HTMLParagraphElement>();
  const hubs = [
    {
      title: "DEF CON 33 BRIEF",
      sub: "ICS VILLAGE STAGE",
      desc: "Live twin engine & relay manipulation in 90 seconds.",
      to: "/def-con-brief",
      badge: "KEYNOTE DEMO",
    },
    {
      title: "S4X26 MIAMI TALK",
      sub: "STAGE A KEYNOTE",
      desc: "Silent interlock bypass in SIL-3 safety systems.",
      to: "/s4-talk",
      badge: "SAFETY RESEARCH",
    },
    {
      title: "RESEARCH WHITEPAPERS",
      sub: "USENIX · IEEE S&P · ACM CCS",
      desc: "Peer-reviewed deviation bounds & twin engine architectures.",
      to: "/whitepapers",
      badge: "PUBLICATIONS",
    },
    {
      title: "DECLASSIFIED FIELD REPORTS",
      sub: "VOL. VII · 2026",
      desc: "Incident timelines reconstructed from live twin runs.",
      to: "/field-reports",
      badge: "INCIDENT LOGS",
    },
    {
      title: "HISTORICAL CASE FILES",
      sub: "MITRE ATT&CK ICS MAPPED",
      desc: "Declassified breakdowns of Stuxnet, Industroyer, & Colonial.",
      to: "/case-files",
      badge: "HISTORICAL INTEL",
    },
    {
      title: "MINDHUNTER BAU DOSSIERS",
      sub: "FBI BEHAVIORAL ANALYSIS",
      desc: "Threat psychology profiles for Sandworm, DarkSide & Volt Typhoon.",
      to: "/threat-profiles",
      badge: "PSYCHOLOGY",
    },
  ];

  return (
    <section id="briefing-hub" className="border-b border-rule bg-background w-full">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-20 space-y-10">
        <div className="grid grid-cols-12 gap-8 border-b border-rule pb-8">
          <div className="col-span-12 md:col-span-3 mono-label space-y-2">
            <p>SECTION 02</p>
            <p ref={scrambleRef} className="text-accent">
              — BRIEFINGS &amp; RESEARCH
            </p>
          </div>
          <div className="col-span-12 md:col-span-9 flex flex-col lg:flex-row justify-between lg:items-end gap-4">
            <h2 className="display text-4xl sm:text-6xl lg:text-7xl leading-none">
              INTELLIGENCE &amp; <span className="text-accent">RESEARCH HUB</span>
            </h2>
            <p className="font-serif italic text-lg text-foreground/80 max-w-md">
              Direct access to conference talks, peer-reviewed papers, field reports, and threat
              dossiers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hubs.map((h) => (
            <Link
              key={h.to}
              to={h.to as "/def-con-brief"}
              onClick={() => pushNavSection("briefing-hub")}
              className="border-2 border-rule bg-card hover:border-accent hover:shadow-comic-accent p-6 flex flex-col justify-between transition-all group min-h-[220px]"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start mono-label text-[10px]">
                  <span className="text-accent font-bold px-2 py-0.5 border border-accent/40 bg-accent/10">
                    {h.badge}
                  </span>
                  <span className="text-foreground/50">{h.sub}</span>
                </div>
                <h3 className="display text-3xl group-hover:text-accent transition-colors leading-none mt-2">
                  {h.title}
                </h3>
                <p className="font-serif italic text-base text-foreground/80 leading-snug">
                  {h.desc}
                </p>
              </div>
              <div className="pt-4 border-t border-rule/50 flex justify-between items-center mono-label text-xs group-hover:text-accent font-bold">
                <span>EXPLORE BRIEFING</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function AttackSurface() {
  const scrambleRef = useScrambleReveal<HTMLParagraphElement>();
  const [selectedId, setSelectedId] = useState("T-002");
  const rows: Array<{
    id: string;
    sector:
      "power" | "water" | "oil-gas" | "manufacturing" | "port" | "smart-building" | "smart-city";
    vector: string;
    asset: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM";
    drift: string;
    color: string;
    firstSeen: string;
    family: string;
    mttr: string;
    physics: string;
    quote: string;
  }> = [
    {
      id: "T-001",
      sector: "power",
      vector: "Relay trip threshold alteration",
      asset: "Relay 33-B / Bus A",
      severity: "CRITICAL",
      drift: "+14 MW",
      color: "bg-danger",
      firstSeen: "2016 · UKRAINE SUBSTATION",
      family: "PROTECTION RELAY TAMPERING",
      mttr: "12 — 18 H",
      physics: "VOLTAGE COLLAPSE",
      quote:
        "“Adversary altered Relay 33-B's overcurrent threshold by 4%. 14 MW load dropped. Hospital ring on generators before ops notice.”",
    },
    {
      id: "T-002",
      sector: "water",
      vector: "PLC ladder-logic silent rewrite",
      asset: "Siemens S7-1500",
      severity: "CRITICAL",
      drift: "+71%",
      color: "bg-danger",
      firstSeen: "2009 · NATANZ",
      family: "PLC RUNG OVERWRITE",
      mttr: "48 — 96 H",
      physics: "ROTATIONAL RESONANCE",
      quote:
        "“Adversary rewrote three rungs of ladder logic. Centrifuge entered resonance band within 96 seconds. Operator did not know.”",
    },
    {
      id: "T-003",
      sector: "oil-gas",
      vector: "HMI credential replay",
      asset: "Operator Console 11",
      severity: "HIGH",
      drift: "+12%",
      color: "bg-warn",
      firstSeen: "2021 · COLONIAL PIPELINE",
      family: "CREDENTIAL REPLAY",
      mttr: "6 — 12 H",
      physics: "VALVE POSITION DRIFT",
      quote:
        "“Adversary replayed captured HMI session. Set valve positions to unsafe operating range over 37 minutes.”",
    },
    {
      id: "T-004",
      sector: "power",
      vector: "Historian poisoning",
      asset: "OSIsoft PI Node",
      severity: "HIGH",
      drift: "+09%",
      color: "bg-warn",
      firstSeen: "2015 · UKRAINE POWER GRID",
      family: "HISTORIAN TAMPERING",
      mttr: "24 — 48 H",
      physics: "FREQUENCY INSTABILITY",
      quote:
        "“Adversary altered historian readings to mask under-frequency conditions. Protection relays failed to trip.”",
    },
    {
      id: "T-005",
      sector: "manufacturing",
      vector: "Engineering-station beachhead",
      asset: "EWS-04",
      severity: "MEDIUM",
      drift: "+04%",
      color: "bg-accent",
      firstSeen: "2019 · MIDDLE EAST REFINERY",
      family: "BEACHHEAD ESTABLISHMENT",
      mttr: "4 — 8 H",
      physics: "N/A",
      quote:
        "“Adversary gained access to engineering workstation via phishing. Project files exposed.”",
    },
    {
      id: "T-006",
      sector: "oil-gas",
      vector: "Safety-instrumented bypass",
      asset: "SIS Logic Solver",
      severity: "CRITICAL",
      drift: "+44%",
      color: "bg-danger",
      firstSeen: "2017 · SAUDI ARAMCO",
      family: "SIS BYPASS",
      mttr: "72 — 120 H",
      physics: "TEMPERATURE RUNAWAY",
      quote:
        "“Adversary bypassed SIS interlocks. Reactor temperature exceeded safe limits by 180°C before manual shutdown.”",
    },
  ];

  const selected = rows.find((r) => r.id === selectedId) || rows[1];

  return (
    <section id="attack" className="border-b border-rule bg-paper text-ink">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-24 lg:py-32">
        <div className="flex flex-wrap items-end justify-between gap-8 border-b-2 border-ink pb-8">
          <div>
            <p ref={scrambleRef} className="mono-label text-ink/60!">
              SECTION 03 — ATTACK SURFACE DOSSIER
            </p>
            <h2 className="display text-6xl md:text-8xl lg:text-[140px] mt-4">
              Watch{" "}
              <span className="italic font-serif normal-case tracking-tight text-ink/70">
                consequences
              </span>
              <br />
              unfold.
            </h2>
          </div>
          <div className="max-w-sm font-serif text-lg text-ink/80">
            Each vector is rehearsed against a digital twin of your facility — instrumentation,
            tolerances, interlocks, and all. Filter by severity. Replay frame by frame.
          </div>
        </div>

        <div className="mt-16 grid grid-cols-12 gap-6 md:gap-10">
          <div className="col-span-12 lg:col-span-8">
            <div className="grid grid-cols-12 mono-label text-ink/60! border-b border-ink/30 pb-3">
              <div className="col-span-1">ID</div>
              <div className="col-span-5">VECTOR</div>
              <div className="col-span-3">ASSET</div>
              <div className="col-span-2">SEVERITY</div>
              <div className="col-span-1 text-right">Δ</div>
            </div>
            {rows.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={`grid grid-cols-12 items-center py-5 border-b border-ink/15 transition-colors cursor-pointer ${selectedId === r.id ? "bg-ink text-paper" : "hover:bg-ink hover:text-paper"}`}
              >
                <div
                  className={`col-span-1 mono-label ${selectedId === r.id ? "!text-paper/70" : "!text-ink/70 group-hover:!text-paper/70"}`}
                >
                  {r.id}
                </div>
                <div className="col-span-5 text-lg md:text-xl">{r.vector}</div>
                <div className="col-span-3 font-mono text-sm">{r.asset}</div>
                <div className="col-span-2 flex items-center gap-2">
                  <span className={`size-2 ${r.color}`} />
                  <span
                    className={`mono-label ${selectedId === r.id ? "!text-paper" : "!text-ink group-hover:!text-paper"}`}
                  >
                    {r.severity}
                  </span>
                </div>
                <div className="col-span-1 text-right font-mono text-sm">{r.drift}</div>
              </div>
            ))}
          </div>

          <aside className="col-span-12 lg:col-span-4">
            <div className="border-2 border-ink p-8 sticky top-28 shadow-brutal-ink" data-reveal>
              <p className="mono-label !text-ink/60">SELECTED</p>
              <p className="display text-4xl mt-2 leading-none">{selected.id}</p>
              <p className="font-serif italic text-xl mt-4 leading-snug">{selected.quote}</p>
              <div className="hairline !bg-ink/30 my-6" />
              <dl className="grid grid-cols-2 gap-y-4 text-sm">
                <dt className="mono-label !text-ink/60">FIRST SEEN</dt>
                <dd className="font-mono">{selected.firstSeen}</dd>
                <dt className="mono-label !text-ink/60">FAMILY</dt>
                <dd className="font-mono">{selected.family}</dd>
                <dt className="mono-label !text-ink/60">MTTR</dt>
                <dd className="font-mono">{selected.mttr}</dd>
                <dt className="mono-label !text-ink/60">PHYSICS</dt>
                <dd className="font-mono">{selected.physics}</dd>
              </dl>
              <Link
                to="/simulation"
                search={{ sector: selected.sector }}
                className="mt-8 w-full bg-ink text-paper mono-label py-3 hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-center"
              >
                REPLAY INCIDENT →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Spread() {
  const scrambleRef = useScrambleReveal<HTMLParagraphElement>();
  return (
    <section id="facility" className="border-b border-rule">
      <div className="grid grid-cols-12">
        <div className="col-span-12 lg:col-span-7 relative min-h-[70vh] border-r border-rule">
          <img
            src={schematic}
            alt="Substation propagation schematic"
            loading="lazy"
            width={1600}
            height={1200}
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/30 via-transparent to-background/60" />
          <div className="absolute top-6 left-6 mono-label">
            FIG. 02 — PROPAGATION GRAPH · SUBSTATION-07
          </div>
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-6">
            <p className="font-serif italic text-2xl max-w-md">
              A single rewritten coil at 04:17 reaches the relay yard before the night-shift
              engineer finishes her coffee.
            </p>
            <div className="mono-label text-right shrink-0">
              <p>NODE-1471</p>
              <p className="text-accent">→ CASCADE INITIATED</p>
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-5 bg-paper text-ink p-10 lg:p-16 flex flex-col justify-between gap-12">
          <div>
            <p ref={scrambleRef} className="mono-label !text-ink/60">
              SECTION 05 — EVERY CABLE, EVERY RELAY.
            </p>
            <h3 className="display text-5xl md:text-7xl leading-[0.9] mt-3">
              Every cable.
              <br />
              Every relay.
              <br />
              <span className="italic font-serif normal-case tracking-tight">
                Every consequence.
              </span>
            </h3>
            <p className="font-serif text-lg mt-8 leading-snug text-ink/80">
              Import your P&amp;ID. Bind to your historian. TwinSec builds a physics-faithful twin
              and runs ten thousand adversaries against it before breakfast.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-4 border-t-2 border-ink pt-8">
            {[
              { k: "TWINS DEPLOYED", v: "147" },
              { k: "PROTOCOLS", v: "32" },
              { k: "INCIDENTS REPLAYED", v: "11,402" },
            ].map((s) => (
              <div key={s.k}>
                <dt className="mono-label !text-ink/60">{s.k}</dt>
                <dd className="display text-4xl md:text-5xl mt-2">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function Replay() {
  const scrambleRef = useScrambleReveal<HTMLParagraphElement>();
  const events = [
    {
      t: "00:00:00",
      a: "Phishing payload accepted at engineering workstation EWS-04.",
      tag: "INITIAL ACCESS",
    },
    {
      t: "00:14:22",
      a: "Lateral movement through unsegmented OT VLAN. Historian fingerprinted.",
      tag: "DISCOVERY",
    },
    { t: "01:02:11", a: "Engineering software opened. Project file checked out.", tag: "STAGING" },
    {
      t: "01:48:09",
      a: "Ladder logic rungs 14–16 silently overwritten. Checksum spoofed.",
      tag: "IMPACT",
    },
    {
      t: "02:33:40",
      a: "Centrifuge enters resonance band. Bearing temperature +84°C.",
      tag: "PHYSICS",
    },
    {
      t: "02:39:01",
      a: "Mechanical failure. Safety interlock bypassed at logic solver.",
      tag: "CONSEQUENCE",
    },
  ];
  return (
    <section id="replay" className="border-b border-rule">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-24 lg:py-36">
        <div className="grid grid-cols-12 gap-8 mb-16">
          <div className="col-span-12 md:col-span-4 mono-label">
            <p ref={scrambleRef} className="text-foreground/60">
              SECTION 06 — TIMELINE & EXERCISE &ldquo;HOLLOW&rdquo;
            </p>
          </div>
          <div className="col-span-12 md:col-span-8">
            <h3 className="display text-6xl md:text-8xl lg:text-[120px] leading-[0.85]">
              Rewind the <span className="text-accent">incident.</span>
              <br />
              Audit the{" "}
              <span className="italic font-serif normal-case tracking-tight">decision.</span>
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 lg:gap-16">
          <ol className="col-span-12 lg:col-span-8 relative">
            <div className="absolute left-[7.5rem] top-2 bottom-2 w-px bg-rule hidden md:block" />
            {events.map((e, i) => (
              <li
                key={i}
                className="grid grid-cols-[7rem_1fr] md:grid-cols-[7rem_2rem_1fr] items-start gap-4 py-8 border-b border-rule"
              >
                <div className="font-mono text-foreground/60 text-sm pt-1">T+{e.t}</div>
                <div className="hidden md:flex justify-center pt-2">
                  <span className="size-3 bg-accent ring-4 ring-background" />
                </div>
                <div>
                  <p className="mono-label text-accent">{e.tag}</p>
                  <p className="font-serif text-2xl mt-2 leading-snug">{e.a}</p>
                </div>
              </li>
            ))}
          </ol>

          <aside className="col-span-12 lg:col-span-4">
            <div className="relative border border-rule overflow-hidden sticky top-28">
              <img
                src={breaker}
                alt="Industrial breaker"
                loading="lazy"
                width={1200}
                height={1500}
                className="w-full object-cover aspect-[3/4]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              <div className="absolute top-4 left-4 right-4 flex justify-between mono-label">
                <span>EVIDENCE</span>
                <span className="text-accent flex items-center gap-2">
                  <span className="size-1.5 bg-accent animate-pulse-dot" /> LIVE
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="mono-label">PHYSICAL ARTIFACT</p>
                <p className="display text-3xl mt-2 leading-none">BREAKER 33-B</p>
                <p className="font-mono text-xs mt-3 text-foreground/70">
                  SERIAL 4471-Δ · LATCHED 02:39:14
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Quote() {
  return (
    <section className="border-b border-rule bg-paper text-ink">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-32 lg:py-44 text-center">
        <p className="mono-label !text-ink/60">CITATION 01</p>
        <blockquote className="font-serif italic text-3xl md:text-5xl lg:text-6xl leading-[1.1] mt-8">
          &ldquo;We ran TwinSec against our refinery the week before the audit. It found a path no
          one had imagined for sixteen years —
          <span className="not-italic font-display normal-case tracking-tight">
            {" "}
            in eleven minutes.
          </span>
          &rdquo;
        </blockquote>
        <p className="mono-label !text-ink/60 mt-10">
          M. ARENS · DEPUTY CISO · A NORTH-SEA OPERATOR
        </p>
      </div>
    </section>
  );
}

function Dossier() {
  const scrambleRef = useScrambleReveal<HTMLParagraphElement>();
  const items = [
    {
      n: "01",
      k: "Twin",
      t: "Physics-faithful digital twin of every PLC, RTU, breaker, valve.",
      m: "ENGINE",
    },
    {
      n: "02",
      k: "Propagate",
      t: "Adversary playbooks rehearsed against your live topology.",
      m: "ADVERSARY",
    },
    {
      n: "03",
      k: "Replay",
      t: "Frame-by-frame incident replay with full operator decisions.",
      m: "FORENSICS",
    },
    {
      n: "04",
      k: "Brief",
      t: "Executive dossier generated for the regulator within the hour.",
      m: "REPORT",
    },
  ];
  return (
    <section id="dossier" className="border-b border-rule">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-24 lg:py-36">
        <div className="grid grid-cols-12 gap-8 border-b border-rule pb-10">
          <p ref={scrambleRef} className="col-span-12 md:col-span-3 mono-label">
            SECTION 07 — CAPABILITY
          </p>
          <h3 className="col-span-12 md:col-span-9 display text-5xl md:text-7xl lg:text-[100px] leading-[0.88]">
            Four instruments.
            <br />
            <span className="text-foreground/40">One control room.</span>
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <article
              key={it.n}
              className={`p-8 lg:p-10 border-rule ${i < 3 ? "border-b md:border-b-0 md:border-r" : ""} ${i === 1 ? "md:border-b lg:border-b-0" : ""} ${i === 0 ? "md:border-b lg:border-b-0" : ""} group hover:bg-accent hover:text-accent-foreground transition-colors min-h-[24rem] flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between mono-label">
                <span>{it.n}</span>
                <span className="group-hover:!text-accent-foreground">{it.m}</span>
              </div>
              <div>
                <h4 className="display text-6xl">{it.k}</h4>
                <p className="font-serif text-lg mt-4 leading-snug text-foreground/80 group-hover:text-accent-foreground">
                  {it.t}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Closing() {
  const scrambleRef = useScrambleReveal<HTMLParagraphElement>();
  return (
    <section className="relative overflow-hidden border-b border-rule">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative mx-auto max-w-[1600px] px-6 lg:px-10 py-32 lg:py-48">
        <p ref={scrambleRef} className="mono-label">
          SECTION 08 — INVITATION
        </p>
        <h2 className="display text-[18vw] md:text-[14vw] lg:text-[220px] leading-[0.82] mt-6">
          REHEARSE
          <br />
          THE NEXT
          <br />
          <span className="text-accent">INCIDENT.</span>
        </h2>
        <div className="grid grid-cols-12 mt-16 gap-8">
          <p className="col-span-12 md:col-span-5 md:col-start-2 font-serif text-2xl italic leading-snug">
            We brief operators, regulators, and the C-suite — once a quarter, in person, at the
            facility. Bring your P&amp;ID. We&apos;ll bring the adversary.
          </p>
          <div className="col-span-12 md:col-span-4 md:col-start-8 md:border-l md:border-rule md:pl-8">
            <p className="mono-label">REQUEST AN EXERCISE</p>
            <form className="mt-6 flex border border-foreground/40">
              <input
                type="email"
                placeholder="operations@facility.com"
                className="flex-1 bg-transparent px-4 py-4 font-mono text-sm placeholder:text-foreground/40 focus:outline-none"
              />
              <button className="bg-accent text-accent-foreground mono-label px-6 hover:bg-foreground hover:text-background transition-colors">
                BRIEF →
              </button>
            </form>
            <p className="mono-label mt-4 text-foreground/50">REPLIES WITHIN 24H · CONFIDENTIAL</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MindhunterShowcase() {
  const scrambleRef = useScrambleReveal<HTMLParagraphElement>();
  const actors = [
    {
      n: "01",
      id: "sandworm",
      name: "SANDWORM",
      sub: "APT44 · GRU UNIT 74455",
      target: "POWER GRID & SUBSTATIONS",
      class: "NATION-STATE",
      insight: "Attacks timed to coldest winter weeks for maximum physical destruction.",
    },
    {
      n: "02",
      id: "darkside",
      name: "DARKSIDE",
      sub: "CRIMINAL RaaS SYNDICATE",
      target: "OIL & GAS PIPELINES",
      class: "CRIMINAL RaaS",
      insight: "Commercialized double-extortion with PR & moral licensing.",
    },
    {
      n: "03",
      id: "insider-threat",
      name: "INSIDER",
      sub: "MALICIOUS OPERATOR / CONTRACTOR",
      target: "WATER & MUNICIPAL SCADA",
      class: "INSIDER THREAT",
      insight: "Legitimate credentials used out-of-shift following personnel grievances.",
    },
    {
      n: "04",
      id: "volt-typhoon",
      name: "VOLT TYPHOON",
      sub: "PEOPLE'S LIBERATION ARMY",
      target: "PORTS & TELECOM GRID",
      class: "NATION-STATE",
      insight: "Living-off-the-land stealth pre-positioning for future geopolitical conflict.",
    },
  ];

  return (
    <section id="mindhunter" className="border-b border-rule w-full">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-20 lg:py-28 space-y-12">
        {/* Section Header matching Section 01 / 02 */}
        <div className="grid grid-cols-12 gap-8 border-b border-rule pb-10">
          <div className="col-span-12 md:col-span-3 mono-label space-y-2">
            <p>SECTION 04</p>
            <p ref={scrambleRef} className="text-accent">
              — THREAT PSYCHOLOGY
            </p>
          </div>
          <div className="col-span-12 md:col-span-9 flex flex-col lg:flex-row justify-between lg:items-end gap-6">
            <h3 className="display text-5xl md:text-7xl lg:text-[90px] leading-[0.88]">
              Four adversaries.
              <br />
              <span className="text-foreground/40">One control room.</span>
            </h3>
            <blockquote className="font-serif italic text-lg text-foreground/80 max-w-md border-l-2 border-accent pl-4 py-1">
              &ldquo;Before you can understand the answer, you have to understand the
              question.&rdquo;
              <span className="block not-italic font-mono text-xs text-foreground/40 mt-1">
                — FBI Behavioral Analysis Unit (BAU-4)
              </span>
            </blockquote>
          </div>
        </div>

        {/* 4-Column Capability Grid (Exact match to Section 05 Dossier structure & hover effect) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-rule">
          {actors.map((actor, i) => (
            <article
              key={actor.id}
              className={`p-8 lg:p-10 border-rule ${i < 3 ? "border-b md:border-b-0 md:border-r" : ""} ${i === 1 ? "md:border-b lg:border-b-0" : ""} ${i === 0 ? "md:border-b lg:border-b-0" : ""} group hover:bg-accent hover:text-accent-foreground transition-colors min-h-[26rem] flex flex-col justify-between`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between mono-label">
                  <span>{actor.n}</span>
                  <span className="group-hover:!text-accent-foreground font-bold">
                    {actor.class}
                  </span>
                </div>
                <div>
                  <h4 className="display text-5xl group-hover:text-black">{actor.name}</h4>
                  <p className="font-mono text-[10px] text-accent group-hover:text-black/80 uppercase font-bold mt-1">
                    {actor.target}
                  </p>
                </div>
                <p className="font-serif text-lg leading-snug text-foreground/80 group-hover:text-accent-foreground">
                  &ldquo;{actor.insight}&rdquo;
                </p>
              </div>

              <div className="pt-6 border-t border-rule/60 group-hover:border-black/30 flex items-center justify-between">
                <Link
                  to="/threat-profiles/$id"
                  params={{ id: actor.id }}
                  className="mono-label text-xs font-bold group-hover:text-black flex items-center gap-2 hover:underline"
                >
                  <span>OPEN DOSSIER</span>
                  <span>→</span>
                </Link>
                <span className="font-mono text-[10px] text-foreground/40 group-hover:text-black/60">
                  {actor.sub}
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* Unique Feature Visual Media Banner (Matching Spread schematic & Replay breaker artifact) */}
        <div className="border border-rule relative overflow-hidden bg-background group">
          <div className="grid grid-cols-12 items-center">
            <div className="col-span-12 lg:col-span-7 relative min-h-[320px] lg:min-h-[400px] border-b lg:border-b-0 lg:border-r border-rule overflow-hidden">
              <img
                src={mindhunterImg}
                alt="FBI BAU Interrogation Surveillance Artifact"
                loading="lazy"
                width={1600}
                height={900}
                className="absolute inset-0 h-full w-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
              <div className="absolute inset-0 scanline pointer-events-none opacity-40" />
              <div className="absolute top-4 left-4 mono-label bg-background/80 backdrop-blur px-3 py-1 border border-rule">
                FIG. 03 — BAU SURVEILLANCE ARTIFACT // TACTICAL MONITOR
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <span className="mono-label text-accent font-bold flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1 border border-rule">
                  <span className="size-2 bg-accent animate-pulse" /> RECORDING INTERROGATION LOGS
                </span>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-5 p-8 lg:p-12 flex flex-col justify-between space-y-6">
              <div>
                <span className="mono-label text-danger font-bold">MINDHUNTER BAU ARCHIVE</span>
                <h4 className="display text-4xl lg:text-5xl mt-2 leading-none">
                  POST-CAPTURE INTERROGATION INTELLIGENCE
                </h4>
                <p className="font-serif italic text-lg mt-4 text-foreground/80 leading-snug">
                  Access raw transcripts, behavioral psych profiles, and tactical playbook
                  indicators for all 4 threat families.
                </p>
              </div>
              <div className="pt-4 flex items-center gap-4">
                <Link
                  to="/threat-profiles"
                  className="bg-accent text-accent-foreground px-6 py-3.5 mono-label hover:bg-foreground hover:text-background transition-colors flex-1 text-center font-bold"
                >
                  EXPLORE ALL THREAT PROFILES →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Index() {
  const rootRef = useGsapReveal<HTMLDivElement>();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      const el = document.getElementById(hash);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 200);
      }
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, []);

  return (
    <div ref={rootRef} className="min-h-screen bg-background text-foreground select-none">
      <Marquee />
      <FlowArt aria-label="TwinSec Cyber-Physical Platform Story Scroll">
        <FlowSection
          aria-label="Hero — Attacks Don't Stay Digital"
          style={{ backgroundColor: "var(--color-background)" }}
        >
          <Hero />
        </FlowSection>

        <FlowSection
          aria-label="Manifesto — Software Does Not Stop At The Screen"
          style={{ backgroundColor: "var(--color-background)" }}
        >
          <Manifesto />
        </FlowSection>

        <FlowSection
          id="briefings"
          aria-label="Intelligence & Research Hub"
          style={{ backgroundColor: "var(--color-background)" }}
        >
          <BriefingHub />
        </FlowSection>

        <FlowSection
          id="attack"
          aria-label="Dossier — Watch Consequences Unfold"
          style={{ backgroundColor: "var(--color-paper)", color: "var(--color-ink)" }}
        >
          <AttackSurface />
        </FlowSection>

        <FlowSection
          aria-label="Mindhunter Threat Intelligence"
          style={{ backgroundColor: "var(--color-background)" }}
        >
          <MindhunterShowcase />
        </FlowSection>

        <FlowSection
          id="facility"
          aria-label="Propagation Schematic"
          style={{ backgroundColor: "var(--color-background)" }}
        >
          <Spread />
        </FlowSection>

        <FlowSection
          id="replay"
          aria-label="Timeline — Rewind The Incident"
          style={{ backgroundColor: "var(--color-background)" }}
        >
          <Replay />
        </FlowSection>

        <FlowSection
          aria-label="Citation — Refinery Audit"
          style={{ backgroundColor: "var(--color-paper)", color: "var(--color-ink)" }}
        >
          <Quote />
        </FlowSection>

        <FlowSection
          id="dossier"
          aria-label="Capability Instruments"
          style={{ backgroundColor: "var(--color-background)" }}
        >
          <Dossier />
        </FlowSection>

        <FlowSection
          aria-label="Closing — Rehearse The Next Incident"
          style={{ backgroundColor: "var(--color-background)" }}
        >
          <Closing />
        </FlowSection>
      </FlowArt>
      <Footer />
    </div>
  );
}
