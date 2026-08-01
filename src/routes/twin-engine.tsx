import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import facility from "@/assets/facility.jpg";
import powerImg from "@/assets/power.jpg";
import waterImg from "@/assets/water.jpg";
import oilGasImg from "@/assets/oil-gas.jpg";
import manufacturingImg from "@/assets/manufacturing.jpg";
import portImg from "@/assets/port.jpg";
import smartBuildingImg from "@/assets/smart-building.jpg";
import smartCityImg from "@/assets/smart-city.jpg";
import { useGsapReveal, gsap } from "@/hooks/use-gsap-reveal";

export const FACILITY_IMAGES: Record<string, string> = {
  power: powerImg,
  water: waterImg,
  "oil-gas": oilGasImg,
  manufacturing: manufacturingImg,
  port: portImg,
  "smart-building": smartBuildingImg,
  "smart-city": smartCityImg,
};

export const Route = createFileRoute("/twin-engine")({
  head: () => ({
    meta: [
      { title: "Twin Engine — TwinSec · Industrial Simulation Launcher" },
      {
        name: "description",
        content:
          "The TwinSec Twin Engine. Enter living digital twins of power plants, water systems, refineries, factories, ports, smart buildings, and entire cities.",
      },
      { property: "og:title", content: "TwinSec — Twin Engine" },
      {
        property: "og:description",
        content: "A launcher for industrial digital twins. Each facility is a world.",
      },
    ],
  }),
  component: TwinEngine,
});

export type FacilityId =
  "power" | "water" | "oil-gas" | "manufacturing" | "port" | "smart-building" | "smart-city";

export const FACILITIES: Array<{
  id: FacilityId;
  no: string;
  name: string;
  sector: string;
  status: "LIVE" | "WARM" | "STANDBY" | "DRILL";
  facets: string[];
  brief: string;
  metric: { k: string; v: string }[];
  built?: boolean;
}> = [
  {
    id: "power",
    no: "01",
    name: "GENERATION · NORTH-9",
    sector: "POWER",
    status: "LIVE",
    facets: ["TURBINES", "TRANSFORMERS", "SUBSTATIONS", "PROTECTION RELAYS"],
    brief:
      "A 1.4 GW combined-cycle plant with a four-substation distribution yard. Energy visibly flows from rotor to feeder to load bank.",
    metric: [
      { k: "BUSES", v: "47" },
      { k: "RELAYS", v: "118" },
      { k: "MW", v: "1,400" },
    ],
    built: true,
  },
  {
    id: "water",
    no: "02",
    name: "MUNICIPAL WORKS · BASIN-3",
    sector: "WATER",
    status: "WARM",
    facets: ["INTAKE", "PUMPS", "VALVES", "CHEMICAL DOSING", "SCADA"],
    brief:
      "Raw-water intake to potable distribution. Tanks fill. Valves cycle. PLCs hold setpoints — until they don't.",
    metric: [
      { k: "PLCs", v: "62" },
      { k: "ML/D", v: "420" },
      { k: "SENSORS", v: "1,108" },
    ],
    built: true,
  },
  {
    id: "oil-gas",
    no: "03",
    name: "REFINERY · DELTA-12",
    sector: "OIL & GAS",
    status: "DRILL",
    facets: ["STORAGE", "PIPELINES", "COMPRESSORS", "DISTILLATION", "SIS"],
    brief:
      "A massive downstream refinery. Crude moves through distillation towers. Pressure systems breathe. The safety solver is the last line.",
    metric: [
      { k: "ASSETS", v: "8,720" },
      { k: "KM PIPE", v: "412" },
      { k: "PSV", v: "1,940" },
    ],
    built: true,
  },
  {
    id: "manufacturing",
    no: "04",
    name: "SMART FACTORY · LINE-A",
    sector: "MANUFACTURING",
    status: "LIVE",
    facets: ["ROBOTS", "CNC", "CONVEYORS", "MES", "QC VISION"],
    brief:
      "A high-mix discrete factory. Robots pick. Conveyors carry. Quality vision rejects. The line never stops — unless a rung does.",
    metric: [
      { k: "STATIONS", v: "34" },
      { k: "ROBOTS", v: "76" },
      { k: "UPH", v: "1,260" },
    ],
    built: true,
  },
  {
    id: "smart-city",
    no: "07",
    name: "METRO · COASTLINE-EAST",
    sector: "SMART CITY",
    status: "LIVE",
    facets: ["TRAFFIC", "GRID", "WATER", "CCTV", "TRANSIT"],
    brief:
      "An interconnected metropolis. Traffic, grid, water, and transit share fiber. One outage doesn't stay local.",
    metric: [
      { k: "DISTRICTS", v: "14" },
      { k: "INTERSECTIONS", v: "1,420" },
      { k: "POP", v: "2.1M" },
    ],
    built: true,
  },
  {
    id: "port",
    no: "05",
    name: "PORT · BERTH 7–14",
    sector: "LOGISTICS",
    status: "WARM",
    facets: ["CRANES", "TOS", "GATE", "VESSEL TRAFFIC"],
    brief:
      "Container terminal with eight ship-to-shore cranes and a fully automated yard. Every TEU is a database row before it's a box.",
    metric: [
      { k: "CRANES", v: "8" },
      { k: "TEU/HR", v: "240" },
      { k: "GATES", v: "16" },
    ],
    built: true,
  },
  {
    id: "smart-building",
    no: "06",
    name: "TOWER · MIDTOWN-NORTH",
    sector: "SMART BUILDING",
    status: "STANDBY",
    facets: ["HVAC", "BMS", "ELEVATORS", "ACCESS"],
    brief:
      "A 62-story commercial tower with a unified BMS, integrated access control, and a single converged network.",
    metric: [
      { k: "FLOORS", v: "62" },
      { k: "ZONES", v: "418" },
      { k: "DEVICES", v: "3,206" },
    ],
    built: true,
  },
];

function Marquee() {
  const items = [
    "TURBINE-04 OVER-SPEED ALERT",
    "PLC RUNG REWRITE DETECTED",
    "RELAY 33B TRIPPED",
    "MODBUS/TCP — 14 ANOMALIES",
    "FACILITY HANDSHAKE OK",
    "TWIN ENGINE 2026.06.11",
    "ADVERSARY UNIT-414 ARMED",
  ];
  const all = [...items, ...items];
  return (
    <div className="border-y border-rule bg-background overflow-hidden">
      <div className="flex whitespace-nowrap animate-ticker py-3">
        {all.map((t, i) => (
          <div key={i} className="mono-label flex items-center gap-6 px-6">
            <span className="size-1.5 bg-accent animate-pulse-dot" />
            <span className="text-foreground/80">{t}</span>
            <span className="text-rule">/</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TwinEngine() {
  const [active, setActive] = useState<FacilityId>("oil-gas");
  const sel = FACILITIES.find((f) => f.id === active)!;
  const activeIdx = FACILITIES.findIndex((f) => f.id === active);
  const listRef = useRef<HTMLOListElement>(null);
  const rootRef = useGsapReveal<HTMLElement>();
  const previewImgRef = useRef<HTMLImageElement>(null);
  const heroImg = FACILITY_IMAGES[sel.id] ?? facility;

  useEffect(() => {
    const btn = listRef.current?.querySelector<HTMLButtonElement>(
      `button[data-facility="${active}"]`,
    );
    if (btn && document.activeElement?.closest("[data-facility-list]")) {
      btn.focus();
    }
  }, [active]);

  useEffect(() => {
    if (!previewImgRef.current) return;
    gsap.fromTo(
      previewImgRef.current,
      { opacity: 0, scale: 1.08, filter: "blur(10px)" },
      { opacity: 0.6, scale: 1, filter: "blur(0px)", duration: 0.9, ease: "power2.out" },
    );
  }, [heroImg]);

  const handleKeyNav = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      setActive(FACILITIES[(activeIdx + 1) % FACILITIES.length].id);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      setActive(FACILITIES[(activeIdx - 1 + FACILITIES.length) % FACILITIES.length].id);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(FACILITIES[0].id);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(FACILITIES[FACILITIES.length - 1].id);
    }
  };

  return (
    <main ref={rootRef} className="min-h-screen bg-background text-foreground">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {sel.name}, sector {sel.sector}. Status {sel.status}.{" "}
        {sel.built ? "Simulation preview ready. Press Enter to launch." : "World build queued."}
      </div>

      <a
        href="#facility-index"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-accent focus:text-accent-foreground focus:mono-label focus:px-3 focus:py-2"
      >
        SKIP TO FACILITY INDEX
      </a>

      <Marquee />

      {/* HEADER */}
      <section className="relative border-b border-rule overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <img
          src={facility}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        <div className="absolute inset-0 scanline pointer-events-none" />
        <div className="relative mx-auto max-w-[1600px] px-6 lg:px-10 pt-14 pb-16 lg:pt-20 lg:pb-24">
          <div
            className="flex flex-wrap items-baseline justify-between gap-6 mono-label"
            data-reveal
          >
            <span>TWIN ENGINE · v1.0 · BUILD 2026.06.11</span>
            <span className="text-accent">7 FACILITIES · 32 PROTOCOLS · LIVE</span>
            <div className="flex gap-4">
              <Link
                to="/simulation"
                search={{ sector: "power" }}
                className="hover:text-accent font-bold"
              >
                LIVE SIMULATOR DRILLS →
              </Link>
              <Link to="/" className="hover:text-accent">
                ← BRIEFING
              </Link>
            </div>
          </div>
          <h1
            className="display text-[14vw] md:text-[10vw] lg:text-[140px] leading-[0.84] mt-10"
            data-reveal
          >
            CHOOSE A<br />
            <span className="text-accent">FACILITY.</span>
          </h1>
          <div className="grid grid-cols-12 mt-12 gap-8" data-reveal>
            <p className="col-span-12 md:col-span-5 md:col-start-2 font-serif italic text-2xl text-foreground/80 leading-snug">
              Each twin is a living world. Power that flows. Water that fills. Pressure that
              breathes. Adversary that adapts.
            </p>
            <div className="col-span-12 md:col-span-4 md:col-start-8 md:border-l md:border-rule md:pl-8 grid grid-cols-3 gap-4">
              <Stat k="TWINS" v="7" />
              <Stat k="ADVERSARIES" v="14" />
              <Stat k="REPLAYS" v="11K+" />
            </div>
          </div>
        </div>
      </section>

      {/* SELECTOR INDEX */}
      <section id="facility-index" className="border-b border-rule">
        <div className="grid grid-cols-12">
          <div className="col-span-12 lg:col-span-7 border-b lg:border-b-0 lg:border-r border-rule">
            <div className="px-6 lg:px-10 py-5 border-b border-rule flex justify-between mono-label">
              <span>FACILITY INDEX · 7</span>
              <span className="text-foreground/60">↑↓ NAVIGATE · ENTER LAUNCH</span>
            </div>
            <ol
              ref={listRef}
              data-facility-list
              role="listbox"
              aria-label="Facility selector. Use arrow keys to navigate, Enter to launch."
              aria-activedescendant={`facility-opt-${active}`}
              onKeyDown={handleKeyNav}
            >
              {FACILITIES.map((f) => {
                const isActive = f.id === active;
                return (
                  <li key={f.id} role="option" id={`facility-opt-${f.id}`} aria-selected={isActive}>
                    <button
                      data-facility={f.id}
                      onClick={() => setActive(f.id)}
                      onFocus={() => setActive(f.id)}
                      onMouseEnter={() => setActive(f.id)}
                      onKeyDown={(e) => {
                        if ((e.key === "Enter" || e.key === " ") && f.built) {
                          e.preventDefault();
                          (
                            e.currentTarget.querySelector(
                              "a[data-launch]",
                            ) as HTMLAnchorElement | null
                          )?.click();
                        }
                      }}
                      tabIndex={isActive ? 0 : -1}
                      aria-label={`Facility ${f.no}, ${f.name}, sector ${f.sector}, status ${f.status}`}
                      className={`relative w-full text-left grid grid-cols-[4rem_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-4 px-6 lg:px-10 py-7 border-b border-rule transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset ${
                        isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted/30"
                      }`}
                    >
                      <span className="mono-label tabular-nums">{f.no}</span>
                      <span className="display text-3xl md:text-4xl leading-none truncate">
                        {f.name}
                      </span>
                      <span className="font-mono text-xs uppercase opacity-70 truncate">
                        {f.facets.join(" · ")}
                      </span>
                      <span
                        className={`mono-label shrink-0 ${isActive ? "" : f.status === "LIVE" ? "text-accent" : "text-foreground/60"}`}
                      >
                        {f.status}
                      </span>
                      {f.built && (
                        <Link
                          data-launch
                          to="/facility/$id"
                          params={{ id: f.id }}
                          tabIndex={-1}
                          aria-hidden
                          className="sr-only"
                        >
                          launch
                        </Link>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* PREVIEW */}
          <aside
            className="col-span-12 lg:col-span-5 relative min-h-[640px] flex flex-col"
            aria-label="Facility preview"
          >
            <div className="relative flex-1 overflow-hidden">
              <img
                ref={previewImgRef}
                key={heroImg}
                src={heroImg}
                alt={`${sel.name} — ${sel.sector} facility`}
                loading="lazy"
                width={1600}
                height={1024}
                className="absolute inset-0 h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 grid-bg opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/10" />
              <div className="absolute inset-0 scanline pointer-events-none opacity-30" />
              <div className="absolute top-5 left-6 right-6 flex justify-between mono-label">
                <span>FACILITY {sel.no} · PREVIEW</span>
                <span className="text-accent flex items-center gap-2">
                  <span className="size-1.5 bg-accent animate-pulse-dot" /> {sel.status}
                </span>
              </div>
              <div className="absolute inset-0 flex items-end p-6 lg:p-10">
                <div>
                  <p className="mono-label">{sel.sector}</p>
                  <p className="display text-5xl md:text-6xl mt-3 leading-[0.9]">{sel.name}</p>
                  <p className="font-serif italic text-lg md:text-xl mt-4 max-w-md text-foreground/85 leading-snug">
                    {sel.brief}
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-rule grid grid-cols-3">
              {sel.metric.map((m) => (
                <div key={m.k} className="px-5 py-5 border-r border-rule last:border-r-0">
                  <p className="mono-label">{m.k}</p>
                  <p className="display text-3xl mt-2 leading-none">{m.v}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-rule p-6 flex flex-wrap gap-3">
              {sel.built ? (
                <Link
                  to="/facility/$id"
                  params={{ id: sel.id }}
                  className="flex-1 bg-accent text-accent-foreground mono-label py-3 text-center hover:bg-foreground hover:text-background transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  ENTER {sel.sector} →
                </Link>
              ) : (
                <span className="flex-1 border border-rule mono-label py-3 text-center text-foreground/60">
                  WORLD BUILD QUEUED
                </span>
              )}
              <Link
                to="/simulation"
                search={{ sector: sel.id }}
                className="border border-rule mono-label px-5 py-3 hover:border-accent hover:text-accent transition-colors"
              >
                LAUNCH EXERCISE ▶
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* DEPENDENCY MAP */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-20 lg:py-28">
          <div className="grid grid-cols-12 gap-8 mb-12">
            <p className="col-span-12 md:col-span-3 mono-label">
              FIG. 02 — FACILITY DEPENDENCY MAP
            </p>
            <h2 className="col-span-12 md:col-span-9 display text-5xl md:text-7xl leading-[0.9]">
              No twin lives
              <br />
              <span className="italic font-serif normal-case tracking-tight text-foreground/60">
                alone.
              </span>
            </h2>
          </div>
          <div className="border border-rule relative aspect-[16/7] overflow-hidden bg-background">
            <div className="absolute inset-0 grid-bg opacity-40" />
            <DependencyGraph active={active} onSelect={setActive} />
          </div>
        </div>
      </section>

      {/* ACTIVITY STREAM */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-20 lg:py-28 grid grid-cols-12 gap-10">
          <div className="col-span-12 md:col-span-4">
            <p className="mono-label">FIG. 03 — ACTIVITY STREAM</p>
            <h3 className="display text-4xl md:text-5xl mt-4 leading-[0.95]">
              Live signals across the fleet.
            </h3>
            <p className="font-serif italic text-lg mt-6 text-foreground/70 leading-snug">
              Every twin reports up. Operators see consequences before the facility does.
            </p>
          </div>
          <ol className="col-span-12 md:col-span-8">
            {[
              {
                t: "00:14:22",
                f: "DELTA-12",
                sev: "CRITICAL",
                a: "PRESSURE SET-POINT DRIFT detected on COMP-04. SIS unaware.",
              },
              {
                t: "00:08:11",
                f: "NORTH-9",
                sev: "HIGH",
                a: "Relay 33-B trip simulated. Sector 9 reroute in 4.2s.",
              },
              {
                t: "00:02:55",
                f: "BASIN-3",
                sev: "MEDIUM",
                a: "Chemical dosing setpoint walked +1.4%. Within tolerance.",
              },
              {
                t: "00:00:48",
                f: "LINE-A",
                sev: "LOW",
                a: "QC vision retrained. Throughput steady at 1,260 UPH.",
              },
              {
                t: "00:00:09",
                f: "COASTLINE-EAST",
                sev: "HIGH",
                a: "Traffic phase corrupted at intersection 1142. Rolled back.",
              },
            ].map((e, i) => (
              <li
                key={i}
                className="grid grid-cols-[5rem_8rem_minmax(0,1fr)_auto] gap-4 items-baseline py-5 border-b border-rule"
              >
                <span className="font-mono text-xs text-foreground/60">T-{e.t}</span>
                <span className="mono-label">{e.f}</span>
                <span className="font-serif text-lg leading-snug">{e.a}</span>
                <span
                  className={`mono-label ${e.sev === "CRITICAL" ? "text-danger" : e.sev === "HIGH" ? "text-warn" : "text-accent"}`}
                >
                  {e.sev}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="border-t border-rule">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-8 flex flex-wrap justify-between mono-label gap-3">
          <span>TWIN ENGINE · TWINSEC SYSTEMS · 2026</span>
          <Link to="/" className="hover:text-accent">
            ← RETURN TO BRIEFING
          </Link>
        </div>
      </footer>
    </main>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="mono-label">{k}</p>
      <p className="display text-4xl mt-2 leading-none">{v}</p>
    </div>
  );
}

function DependencyGraph({
  active,
  onSelect,
}: {
  active: FacilityId;
  onSelect: (id: FacilityId) => void;
}) {
  const positions: Record<FacilityId, { x: number; y: number; alignRight?: boolean }> = {
    power: { x: 10, y: 50 },
    water: { x: 30, y: 20 },
    "oil-gas": { x: 30, y: 80 },
    manufacturing: { x: 54, y: 30 },
    port: { x: 60, y: 76 },
    "smart-building": { x: 76, y: 35 },
    "smart-city": { x: 74, y: 68, alignRight: true }, // align to left of node so text never clips right edge
  };

  const edges: [FacilityId, FacilityId][] = [
    ["power", "water"],
    ["power", "oil-gas"],
    ["power", "manufacturing"],
    ["power", "smart-city"],
    ["water", "smart-city"],
    ["oil-gas", "manufacturing"],
    ["oil-gas", "port"],
    ["manufacturing", "smart-building"],
    ["smart-building", "smart-city"],
    ["port", "smart-city"],
  ];

  return (
    <svg
      viewBox="0 0 100 50"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full select-none"
      aria-hidden="true"
    >
      {/* Animated Gradient Definitions */}
      <defs>
        <linearGradient id="livePulse" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#BFFF2E" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#BFFF2E" stopOpacity="1" />
          <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Render Connecting Lines with Animated Data Flow Packets */}
      {edges.map(([a, b], i) => {
        const pa = positions[a];
        const pb = positions[b];
        const isLive = a === active || b === active;
        const midX = (pa.x + pb.x) / 2;
        const midY = (pa.y * 0.5 + pb.y * 0.5) / 2;

        return (
          <g key={i}>
            {/* Base Connection Line */}
            <line
              x1={pa.x}
              y1={pa.y * 0.5}
              x2={pb.x}
              y2={pb.y * 0.5}
              stroke={isLive ? "#BFFF2E" : "#27272A"}
              strokeWidth={isLive ? 0.35 : 0.15}
              opacity={isLive ? 0.9 : 0.4}
              vectorEffect="non-scaling-stroke"
            />

            {/* Live Data Packet Arrow/Dot Stream */}
            <line
              x1={pa.x}
              y1={pa.y * 0.5}
              x2={pb.x}
              y2={pb.y * 0.5}
              stroke={isLive ? "#BFFF2E" : "#3F3F46"}
              strokeWidth={isLive ? 0.6 : 0.25}
              strokeDasharray="0.8 3"
              vectorEffect="non-scaling-stroke"
              opacity={isLive ? 1 : 0.5}
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-20"
                dur={isLive ? "1.5s" : "3s"}
                repeatCount="indefinite"
              />
            </line>

            {/* Directional Flow Indicator Node on Active Edges */}
            {isLive && (
              <circle r="0.6" fill="#BFFF2E" opacity="0.9">
                <animateMotion
                  path={`M ${pa.x} ${pa.y * 0.5} L ${pb.x} ${pb.y * 0.5}`}
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
          </g>
        );
      })}

      {/* Render Facility Nodes & Crisp Labels */}
      {FACILITIES.map((f) => {
        const p = positions[f.id];
        const isA = f.id === active;
        const isRightAligned = p.alignRight;
        const textX = isRightAligned ? p.x - 3.2 : p.x + 3.2;
        const textAnchor = isRightAligned ? "end" : "start";

        return (
          <g
            key={f.id}
            className="cursor-pointer group"
            role="button"
            tabIndex={0}
            aria-label={`${f.name}, ${f.sector}`}
            onClick={() => onSelect(f.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(f.id);
              }
            }}
          >
            {/* Outer Glow Halo for Active Node */}
            {isA && (
              <rect
                x={p.x - 2.2}
                y={p.y * 0.5 - 2.2}
                width={4.4}
                height={4.4}
                fill="none"
                stroke="#BFFF2E"
                strokeWidth="0.3"
                opacity="0.6"
              >
                <animate
                  attributeName="transform"
                  type="scale"
                  values="1; 1.15; 1"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </rect>
            )}

            {/* Node Box */}
            <rect
              x={p.x - 1.4}
              y={p.y * 0.5 - 1.4}
              width={2.8}
              height={2.8}
              fill={isA ? "#BFFF2E" : "#18181B"}
              stroke={isA ? "#000000" : "#3F3F46"}
              strokeWidth={isA ? 0.35 : 0.2}
              vectorEffect="non-scaling-stroke"
            />

            {/* Node Center Dot */}
            <circle cx={p.x} cy={p.y * 0.5} r={0.4} fill={isA ? "#000000" : "#BFFF2E"} />

            {/* Clean Non-Overlapping Monospace Label */}
            <g transform={`translate(${textX}, ${p.y * 0.5 + 0.4})`}>
              {/* Background badge for label readability */}
              <rect
                x={isRightAligned ? -18 : 0}
                y={-1.8}
                width={18}
                height={2.6}
                fill={isA ? "#000000" : "#09090B"}
                stroke={isA ? "#BFFF2E" : "#27272A"}
                strokeWidth={isA ? 0.25 : 0.1}
                rx="0.3"
                opacity={isA ? 0.95 : 0.85}
              />
              <text
                x={isRightAligned ? -0.8 : 0.8}
                y={0}
                fill={isA ? "#BFFF2E" : "#F5F3E7"}
                fontSize="1.4"
                fontFamily="monospace"
                fontWeight={isA ? "bold" : "normal"}
                textAnchor={textAnchor}
              >
                {f.no} {f.sector}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
