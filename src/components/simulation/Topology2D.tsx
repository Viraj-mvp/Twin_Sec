import React, { useRef, useState } from "react";
import type { Node, Edge } from "@/data/scenarios";

interface Topology2DProps {
  nodes: readonly Node[] | Node[];
  edges: readonly Edge[] | Edge[];
  compromised: Set<string>;
  blockedNodes?: Set<string>;
  selected: string | null;
  onSelect: (id: string, source?: "tap" | "long") => void;
  t: number;
  activeNode: string | null;
  isolatedNodes?: Set<string>;
  commandActiveNode?: string | null;
  commandActiveAction?: string | null;
}

export const Topology2D: React.FC<Topology2DProps> = React.memo(
  ({
    nodes,
    edges,
    compromised,
    selected,
    onSelect,
    t,
    activeNode,
    isolatedNodes = new Set<string>(),
    commandActiveNode,
  }) => {
    const byId = (id: string) => nodes.find((n) => n.id === id);
    const [pressed, setPressed] = useState<string | null>(null);
    const longTimer = useRef<number | null>(null);
    const firedLong = useRef(false);

    const onPointerDown = (id: string) => {
      setPressed(id);
      firedLong.current = false;
      if (longTimer.current) window.clearTimeout(longTimer.current);
      longTimer.current = window.setTimeout(() => {
        firedLong.current = true;
        onSelect(id, "long");
        setPressed(null);
      }, 420);
    };

    const onPointerUp = (id: string) => {
      if (longTimer.current) window.clearTimeout(longTimer.current);
      longTimer.current = null;
      if (!firedLong.current) onSelect(id, "tap");
      setPressed(null);
    };

    const onPointerCancel = () => {
      if (longTimer.current) window.clearTimeout(longTimer.current);
      longTimer.current = null;
      setPressed(null);
    };

    // Responsive, un-stretched 1000 x 500 coordinate mapping
    const mapX = (x: number) => 70 + (x / 100) * 760;
    const mapY = (y: number) => 55 + (y / 100) * 380;

    return (
      <svg
        viewBox="0 0 1000 500"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full touch-manipulation select-none"
      >
        {/* EDGES / LINKS */}
        {edges.map((e, i) => {
          const a = byId(e.from);
          const b = byId(e.to);
          if (!a || !b) return null;

          const ax = mapX(a.x);
          const ay = mapY(a.y);
          const bx = mapX(b.x);
          const by = mapY(b.y);

          const isIso = isolatedNodes.has(e.from) || isolatedNodes.has(e.to);
          const isBothCompromised = !isIso && compromised.has(e.from) && compromised.has(e.to);
          const isPathCompromised = !isIso && (compromised.has(e.from) || compromised.has(e.to));
          const mx = (ax + bx) / 2;
          const my = (ay + by) / 2;

          return (
            <g key={i}>
              {/* Baseline link */}
              <line
                x1={ax}
                y1={ay}
                x2={bx}
                y2={by}
                stroke={
                  isIso
                    ? "#00f0ff"
                    : isBothCompromised
                      ? "oklch(0.65 0.25 28)"
                      : isPathCompromised
                        ? "oklch(0.82 0.2 85)"
                        : "rgba(255, 255, 255, 0.18)"
                }
                strokeWidth={isIso ? 2 : isBothCompromised ? 3 : 1.5}
                strokeDasharray={isIso ? "5 5" : undefined}
                vectorEffect="non-scaling-stroke"
                opacity={isIso ? 0.7 : 1}
              />

              {/* Dynamic Particle Telemetry Flow Lines */}
              {isBothCompromised && (
                <line
                  x1={ax}
                  y1={ay}
                  x2={bx}
                  y2={by}
                  stroke="oklch(0.65 0.25 28)"
                  strokeWidth={3}
                  strokeDasharray="8 12"
                  strokeDashoffset={-t * 16}
                  vectorEffect="non-scaling-stroke"
                  opacity={0.9}
                />
              )}

              {isPathCompromised && !isBothCompromised && (
                <line
                  x1={ax}
                  y1={ay}
                  x2={bx}
                  y2={by}
                  stroke="oklch(0.82 0.2 85)"
                  strokeWidth={2}
                  strokeDasharray="6 10"
                  strokeDashoffset={-t * 10}
                  vectorEffect="non-scaling-stroke"
                  opacity={0.75}
                />
              )}

              {!isIso && !isPathCompromised && (
                <line
                  x1={ax}
                  y1={ay}
                  x2={bx}
                  y2={by}
                  stroke="oklch(0.86 0.24 125)"
                  strokeWidth={1.5}
                  strokeDasharray="4 12"
                  strokeDashoffset={-t * 4}
                  vectorEffect="non-scaling-stroke"
                  opacity={0.35}
                />
              )}

              {/* Air-gap severed crosshatch indicator */}
              {isIso && (
                <g transform={`translate(${mx}, ${my})`}>
                  <rect
                    x={-9}
                    y={-7}
                    width={18}
                    height={14}
                    fill="#000000"
                    stroke="#00f0ff"
                    strokeWidth={1.5}
                  />
                  <text
                    x={0}
                    y={3.5}
                    textAnchor="middle"
                    fill="#00f0ff"
                    fontSize={9}
                    fontWeight="900"
                    fontFamily="monospace"
                  >
                    ✕
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* NODES */}
        {nodes.map((n) => {
          const nx = mapX(n.x);
          const ny = mapY(n.y);

          const isC = compromised.has(n.id);
          const isIso = isolatedNodes.has(n.id);
          const isS = selected === n.id;
          const isA = activeNode === n.id || commandActiveNode === n.id;
          const isP = pressed === n.id;

          return (
            <g
              key={n.id}
              className="cursor-pointer select-none focus:outline-none [&:focus-visible>rect.focus-ring]:opacity-100"
              style={{ touchAction: "manipulation" }}
              role="button"
              tabIndex={0}
              aria-label={`${n.label} — ${n.kind}. ${isIso ? "Air-gapped" : isC ? "Compromised" : "Nominal"}. Ring ${n.ring}. Press Enter or Space to open asset dossier.`}
              aria-pressed={isS}
              onPointerDown={(e) => {
                e.preventDefault();
                onPointerDown(n.id);
              }}
              onPointerUp={() => onPointerUp(n.id)}
              onPointerLeave={onPointerCancel}
              onPointerCancel={onPointerCancel}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(n.id, "tap");
                }
              }}
            >
              {/* Safe-area 44px enlarged hit target */}
              <rect x={nx - 24} y={ny - 24} width={48} height={48} fill="transparent" />

              {/* Keyboard focus ring */}
              <rect
                className="focus-ring"
                x={nx - 16}
                y={ny - 16}
                width={32}
                height={32}
                fill="none"
                stroke="oklch(0.97 0.005 90)"
                strokeWidth={2}
                strokeDasharray="4 3"
                vectorEffect="non-scaling-stroke"
                opacity={0}
                style={{ transition: "opacity 120ms" }}
              />

              {/* Press ripple */}
              {isP && (
                <circle
                  cx={nx}
                  cy={ny}
                  r={12}
                  fill="none"
                  stroke="oklch(0.97 0.005 90)"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  opacity={0.9}
                >
                  <animate
                    attributeName="r"
                    from="10"
                    to="35"
                    dur="0.42s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="1"
                    to="0"
                    dur="0.42s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Active Radar Sweep Ring */}
              {isA && (
                <circle
                  cx={nx}
                  cy={ny}
                  r={22}
                  fill="none"
                  stroke={isIso ? "oklch(0.82 0.2 85)" : "oklch(0.97 0.005 90)"}
                  strokeWidth={1.75}
                  vectorEffect="non-scaling-stroke"
                  opacity={0.9}
                >
                  <animate
                    attributeName="r"
                    from="12"
                    to="36"
                    dur="1.3s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.9"
                    to="0"
                    dur="1.3s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Compromised halo circle */}
              {isC && !isIso && (
                <circle
                  cx={nx}
                  cy={ny}
                  r={18}
                  fill="none"
                  stroke="oklch(0.86 0.24 125)"
                  strokeWidth={1.5}
                  opacity={0.45}
                  vectorEffect="non-scaling-stroke"
                />
              )}

              {/* Solid Node Square (Perfect Square, No Distortion) */}
              <rect
                x={nx - 10}
                y={ny - 10}
                width={20}
                height={20}
                fill={
                  isIso
                    ? "oklch(0.82 0.2 85)"
                    : isC
                      ? "oklch(0.86 0.24 125)"
                      : "oklch(0.14 0.005 240)"
                }
                stroke={
                  isS
                    ? "oklch(0.97 0.005 90)"
                    : isIso
                      ? "oklch(0.82 0.2 85)"
                      : isC
                        ? "oklch(0.97 0.005 90)"
                        : "oklch(0.55 0.02 240)"
                }
                strokeWidth={isS ? 2.5 : 1.5}
                vectorEffect="non-scaling-stroke"
                style={{
                  transition: "transform 120ms",
                  transformOrigin: `${nx}px ${ny}px`,
                  transform: isP ? "scale(1.25)" : undefined,
                }}
              />
            </g>
          );
        })}

        {/* LABELS & METADATA */}
        {nodes.map((n) => {
          const nx = mapX(n.x);
          const ny = mapY(n.y);
          const isC = compromised.has(n.id);
          const isIso = isolatedNodes.has(n.id);
          const isS = selected === n.id;

          // For the rightmost nodes (e.g. ring 5, x >= 90), render label with clean positioning
          const isRightEdge = n.x >= 85;

          return (
            <g key={n.id + "-l"} className="pointer-events-none select-none">
              {/* Primary Label */}
              <text
                x={isRightEdge ? nx + 14 : nx + 15}
                y={ny - 2}
                fill="oklch(0.97 0.005 90)"
                fontSize="12.5"
                fontWeight="bold"
                fontFamily="JetBrains Mono, monospace"
                opacity={isS || isC || isIso ? 1 : 0.85}
              >
                {n.label}
              </text>
              {/* Subtitle / Kind */}
              <text
                x={isRightEdge ? nx + 14 : nx + 15}
                y={ny + 12}
                fill="oklch(0.65 0.02 240)"
                fontSize="9"
                fontWeight="600"
                fontFamily="JetBrains Mono, monospace"
                letterSpacing="0.05em"
              >
                {n.kind.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
    );
  },
);
