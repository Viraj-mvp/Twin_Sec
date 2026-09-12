import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Activity, ShieldCheck, Zap, ArrowUpRight } from "lucide-react";

interface TrajectoryPoint {
  label: string;
  drillName: string;
  score: number;
  mwProtected: number;
}

interface SectorReadiness {
  sector: string;
  simSector: string;
  readiness: number;
  isPrimary: boolean;
}

const TRAJECTORY_DATA: TrajectoryPoint[] = [
  { label: "D-01", drillName: "Substation-07 Baseline", score: 65, mwProtected: 420 },
  { label: "D-02", drillName: "Industroyer2 Emulation", score: 72, mwProtected: 680 },
  { label: "D-03", drillName: "Basin-3 Pump Overpressure", score: 68, mwProtected: 510 },
  { label: "D-04", drillName: "Maroochy Replay Injection", score: 78, mwProtected: 820 },
  { label: "D-05", drillName: "Seventh Breath SIS Intercept", score: 82, mwProtected: 940 },
  { label: "D-06", drillName: "TRITON Safety Kill-Chain", score: 85, mwProtected: 1100 },
  { label: "D-07", drillName: "Depot-4 Assembly Stuxnet", score: 89, mwProtected: 1250 },
  { label: "D-08", drillName: "Crane Array GPS Spoofing", score: 87, mwProtected: 1180 },
  { label: "D-09", drillName: "HVAC Core BACnet Pivot", score: 91, mwProtected: 1320 },
  { label: "D-10", drillName: "Feeder Loop LoRaWAN Flood", score: 94, mwProtected: 1420 },
  { label: "D-11", drillName: "BlackEnergy Microgrid SCRAM", score: 96, mwProtected: 1560 },
  { label: "D-12", drillName: "Multi-Subnet Coordinated Siege", score: 98, mwProtected: 1680 },
];

const SECTOR_READINESS: SectorReadiness[] = [
  { sector: "POWER", simSector: "power", readiness: 96, isPrimary: true },
  { sector: "WATER", simSector: "water", readiness: 88, isPrimary: false },
  { sector: "GAS", simSector: "oil-gas", readiness: 92, isPrimary: true },
  { sector: "FACTORY", simSector: "manufacturing", readiness: 84, isPrimary: false },
  { sector: "PORT", simSector: "port", readiness: 90, isPrimary: true },
  { sector: "BLDG", simSector: "smart-building", readiness: 78, isPrimary: false },
  { sector: "CITY", simSector: "smart-city", readiness: 86, isPrimary: true },
];

export function NeoDashboardCharts() {
  const [hoveredPoint, setHoveredPoint] = useState<TrajectoryPoint | null>(null);
  const [hoveredSector, setHoveredSector] = useState<SectorReadiness | null>(null);

  // SVG dimensions for Stepped Trajectory Chart
  const svgWidth = 640;
  const svgHeight = 240;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;
  const maxScore = 100;

  const stepWidth = chartWidth / (TRAJECTORY_DATA.length - 1);
  const points = TRAJECTORY_DATA.map((d, i) => {
    const x = paddingLeft + i * stepWidth;
    const y = paddingTop + chartHeight - (d.score / maxScore) * chartHeight;
    return { x, y, ...d };
  });

  // Build stepped path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const nextPoint = points[i + 1];
    pathD += ` H ${nextPoint.x} V ${nextPoint.y}`;
  }
  const areaD = `${pathD} V ${paddingTop + chartHeight} H ${points[0].x} Z`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* ── LEFT: STEPPED CYBER DEFENSE TRAJECTORY ── */}
      <div className="lg:col-span-8 rounded-none border-2 border-rule bg-[#18181B] text-foreground p-6 shadow-[6px_6px_0px_0px_#000000] flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b-2 border-rule pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 bg-accent animate-pulse-dot" />
              <h3 className="font-mono text-base font-black uppercase text-foreground tracking-wider">
                THREAT DEFENSE & MITIGATION TRAJECTORY
              </h3>
            </div>
            <p className="font-serif italic text-sm text-foreground/80 mt-1">
              Operator score evolution across recent cyber-physical scenario drills
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="mono-label border-2 border-rule px-3 py-1 bg-black font-bold !text-foreground shadow-[2px_2px_0px_#000000]">
              12 RECENT DRILLS
            </span>
          </div>
        </div>

        {/* Stepped SVG Chart */}
        <div className="w-full overflow-x-auto relative">
          {hoveredPoint && (
            <div className="absolute top-2 right-4 bg-black text-foreground px-4 py-2 border-2 border-accent font-mono text-xs font-bold shadow-[4px_4px_0px_#000000] pointer-events-none z-10 space-y-1">
              <p className="text-accent font-black uppercase tracking-wider">
                {hoveredPoint.drillName}
              </p>
              <p className="text-foreground">
                Score: <strong className="text-accent">{hoveredPoint.score}%</strong> · Protected:{" "}
                <strong>{hoveredPoint.mwProtected} MW</strong>
              </p>
            </div>
          )}

          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[520px] select-none"
          >
            {/* Grid Lines and Y-Axis Ticks */}
            {[100, 75, 50, 25, 0].map((val) => {
              const y = paddingTop + chartHeight - (val / maxScore) * chartHeight;
              return (
                <g key={val}>
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="font-mono text-[11px] font-bold fill-foreground/70"
                  >
                    {val}%
                  </text>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#2E2E33"
                    strokeDasharray="4 4"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}

            {/* Stepped Area Fill - Acid Lime Tint */}
            <path
              d={areaD}
              fill="oklch(0.86 0.24 125)"
              fillOpacity="0.22"
              className="transition-all"
            />

            {/* Stepped Main Lime Stroke */}
            <path
              d={pathD}
              fill="none"
              stroke="oklch(0.86 0.24 125)"
              strokeWidth="3"
              strokeLinecap="square"
            />

            {/* Step Points */}
            {points.map((p) => (
              <g
                key={p.label}
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoveredPoint?.label === p.label ? 6 : 4}
                  fill={hoveredPoint?.label === p.label ? "oklch(0.86 0.24 125)" : "#FFFFFF"}
                  stroke="#000000"
                  strokeWidth="2"
                />
                <text
                  x={p.x}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  className={`font-mono text-[11px] uppercase transition-colors ${
                    hoveredPoint?.label === p.label
                      ? "fill-accent font-black"
                      : "fill-foreground/80 font-bold"
                  }`}
                >
                  {p.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* ── RIGHT: SECTOR DEFENSE READINESS ── */}
      <div className="lg:col-span-4 rounded-none border-2 border-rule bg-[#18181B] text-foreground p-6 shadow-[6px_6px_0px_0px_#000000] flex flex-col justify-between">
        <div className="flex items-start justify-between border-b-2 border-rule pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 bg-accent" />
              <h3 className="font-mono text-base font-black uppercase text-foreground tracking-wider">
                SECTOR READINESS
              </h3>
            </div>
            <p className="font-serif italic text-sm text-foreground/80 mt-1">
              Readiness index across 7 subnets
            </p>
          </div>

          <span className="mono-label border-2 border-rule px-2.5 py-1 bg-black text-accent font-bold shadow-[2px_2px_0px_#000000]">
            OT MATRIX
          </span>
        </div>

        {/* Bars Container */}
        <div className="w-full relative pt-2">
          {hoveredSector && (
            <div className="absolute top-0 right-2 bg-black text-foreground px-3 py-1.5 border-2 border-accent font-mono text-xs font-bold shadow-[3px_3px_0px_#000000] pointer-events-none z-10">
              {hoveredSector.sector}:{" "}
              <span className="text-accent font-black">{hoveredSector.readiness}% READINESS</span>
            </div>
          )}

          <div className="h-52 flex items-end justify-between gap-2 border-b-2 border-rule pb-2 px-1">
            {SECTOR_READINESS.map((item) => {
              const heightPercent = item.readiness;
              const isHovered = hoveredSector?.sector === item.sector;
              const barBg = item.isPrimary ? "bg-accent" : "bg-white";

              return (
                <div
                  key={item.sector}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  onMouseEnter={() => setHoveredSector(item)}
                  onMouseLeave={() => setHoveredSector(null)}
                >
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full ${barBg} border-2 border-black shadow-[3px_3px_0px_#000000] transition-all duration-150 ${
                      isHovered
                        ? "translate-y-[-4px] shadow-[5px_5px_0px_#000000] opacity-100"
                        : "group-hover:translate-y-[-2px]"
                    }`}
                  />
                  <span
                    className={`font-mono text-[10px] mt-2 font-bold uppercase ${
                      isHovered ? "text-accent font-black" : "text-foreground/90"
                    }`}
                  >
                    {item.sector}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Launch CTA */}
        <div className="mt-4 pt-3 border-t-2 border-rule flex items-center justify-between">
          <span className="mono-label !text-foreground/80 font-bold">
            Facility Shield: <strong className="text-accent text-sm">87.7%</strong>
          </span>
          <Link
            to="/twin-engine"
            className="mono-label text-accent hover:underline flex items-center gap-1 font-bold"
          >
            ALL FACILITIES →
          </Link>
        </div>
      </div>
    </div>
  );
}
