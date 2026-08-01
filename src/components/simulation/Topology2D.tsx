import React, { useRef, useState } from "react";
import type { Node, Edge } from "@/data/scenarios";

interface Topology2DProps {
  nodes: readonly Node[] | Node[];
  edges: readonly Edge[] | Edge[];
  compromised: Set<string>;
  selected: string | null;
  onSelect: (id: string, source?: "tap" | "long") => void;
  t: number;
  activeNode: string | null;
  isolatedNodes: Set<string>;
  commandActiveNode?: string | null;
  nodeOffsets?: Record<string, { dx: number; dy: number }>;
}

export const Topology2D: React.FC<Topology2DProps> = ({
  nodes,
  edges,
  compromised,
  selected,
  onSelect,
  t,
  activeNode,
  isolatedNodes,
  commandActiveNode,
  nodeOffsets = {},
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

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full touch-manipulation"
    >
      <defs>
        <marker
          id="arrow-active"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#bfff2e" />
        </marker>
        <marker
          id="arrow-nominal"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="3"
          markerHeight="3"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="oklch(0.45 0.02 240)" />
        </marker>
      </defs>

      {edges.map((e, i) => {
        const a = byId(e.from);
        const b = byId(e.to);
        if (!a || !b) return null;
        const live = compromised.has(e.from) && compromised.has(e.to);
        const activeFrom = compromised.has(e.from);
        return (
          <g key={i}>
            {/* Edge line with directional arrow marker */}
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={live ? "#bfff2e" : activeFrom ? "oklch(0.7 0.2 130)" : "oklch(0.35 0.01 240)"}
              strokeWidth={live ? 0.35 : activeFrom ? 0.25 : 0.15}
              markerEnd={live || activeFrom ? "url(#arrow-active)" : "url(#arrow-nominal)"}
              vectorEffect="non-scaling-stroke"
            />
            {live && (
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="oklch(0.97 0.005 90)"
                strokeWidth={0.6}
                strokeDasharray="0.8 3"
                strokeDashoffset={-t * 4}
                vectorEffect="non-scaling-stroke"
                opacity={0.6}
              />
            )}
          </g>
        );
      })}

      {nodes.map((n) => {
        const isC = compromised.has(n.id);
        const isS = selected === n.id;
        const isA = activeNode === n.id;
        const isP = pressed === n.id;
        const isI = isolatedNodes.has(n.id);
        const isCmdActive = commandActiveNode === n.id;
        const off = nodeOffsets[n.id] || { dx: 0, dy: 0 };
        const nx = n.x + off.dx;
        const ny = n.y + off.dy;

        return (
          <g
            key={n.id}
            className="cursor-pointer select-none focus:outline-none [&:focus-visible>rect.focus-ring]:opacity-100"
            style={{
              touchAction: "manipulation",
              transform: `translate(${off.dx}px, ${off.dy}px)`,
              transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
            role="button"
            tabIndex={0}
            aria-label={`${n.label} — ${n.kind}. ${
              isC ? "Compromised" : isI ? "Isolated" : "Nominal"
            }. Ring ${n.ring}. Press Enter or Space to open asset dossier.`}
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
            {/* Command execution active target pulse */}
            {isCmdActive && (
              <circle
                cx={n.x}
                cy={n.y}
                r={6}
                fill="none"
                stroke="#00f0ff"
                strokeWidth={0.5}
                vectorEffect="non-scaling-stroke"
                className="animate-ping"
              />
            )}
            {/* Enlarged hit target */}
            <rect x={n.x - 5} y={n.y - 5} width={10} height={10} fill="transparent" />

            {/* Keyboard focus ring */}
            <rect
              className="focus-ring"
              x={n.x - 3}
              y={n.y - 3}
              width={6}
              height={6}
              fill="none"
              stroke="oklch(0.97 0.005 90)"
              strokeWidth={0.45}
              strokeDasharray="0.8 0.6"
              vectorEffect="non-scaling-stroke"
              opacity={0}
              style={{ transition: "opacity 120ms" }}
            />

            {/* Haptic press ripple */}
            {isP && (
              <circle
                cx={n.x}
                cy={n.y}
                r={2}
                fill="none"
                stroke="oklch(0.97 0.005 90)"
                strokeWidth={0.4}
                vectorEffect="non-scaling-stroke"
                opacity={0.9}
              >
                <animate attributeName="r" from="1.5" to="7" dur="0.42s" repeatCount="indefinite" />
                <animate
                  attributeName="opacity"
                  from="1"
                  to="0"
                  dur="0.42s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {isA && (
              <circle
                cx={n.x}
                cy={n.y}
                r={4.5}
                fill="none"
                stroke="oklch(0.97 0.005 90)"
                strokeWidth={0.25}
                vectorEffect="non-scaling-stroke"
                opacity={0.9}
              >
                <animate attributeName="r" from="2" to="6" dur="1.2s" repeatCount="indefinite" />
                <animate
                  attributeName="opacity"
                  from="0.9"
                  to="0"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {isC && (
              <circle
                cx={n.x}
                cy={n.y}
                r={3}
                fill="none"
                stroke="oklch(0.86 0.24 125)"
                strokeWidth={0.2}
                opacity={0.4}
                vectorEffect="non-scaling-stroke"
              />
            )}

            {isI && (
              <circle
                cx={n.x}
                cy={n.y}
                r={3.2}
                fill="none"
                stroke="oklch(0.7 0.25 230)"
                strokeWidth={0.4}
                strokeDasharray="0.8 0.4"
                opacity={0.8}
                vectorEffect="non-scaling-stroke"
              />
            )}

            <rect
              x={n.x - 1.4}
              y={n.y - 1.4}
              width={2.8}
              height={2.8}
              fill={
                isC
                  ? "oklch(0.86 0.24 125)"
                  : isI
                    ? "oklch(0.55 0.25 230)"
                    : "oklch(0.14 0.005 240)"
              }
              stroke={
                isS
                  ? "oklch(0.97 0.005 90)"
                  : isC
                    ? "oklch(0.97 0.005 90)"
                    : isI
                      ? "oklch(0.7 0.25 230)"
                      : "oklch(0.55 0.02 240)"
              }
              strokeWidth={isS ? 0.5 : 0.2}
              vectorEffect="non-scaling-stroke"
              style={{
                transition: "transform 120ms",
                transformOrigin: `${n.x}px ${n.y}px`,
                transform: isP ? "scale(1.25)" : undefined,
              }}
            />
          </g>
        );
      })}

      {nodes.map((n: Node) => (
        <g key={n.id + "-l"}>
          <text
            x={n.x + 2.2}
            y={n.y - 1.6}
            fill="oklch(0.97 0.005 90)"
            fontSize="1.6"
            fontFamily="JetBrains Mono, monospace"
            opacity={selected === n.id || compromised.has(n.id) ? 1 : 0.55}
          >
            {n.label}
          </text>
          <text
            x={n.x + 2.2}
            y={n.y + 0.4}
            fill="oklch(0.65 0.02 240)"
            fontSize="1.1"
            fontFamily="JetBrains Mono, monospace"
          >
            {n.kind.toUpperCase()}
          </text>
        </g>
      ))}
    </svg>
  );
};
