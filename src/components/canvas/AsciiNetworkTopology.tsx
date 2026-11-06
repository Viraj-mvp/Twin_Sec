import { useEffect, useRef } from "react";

// ============================================================================
// TwinSec Dual-Mode ASCII Engine: Network Topology & Global Attack World Map
// 84 cols x 26 rows, 24 FPS, 100% transparent background.
// Cycles automatically every 5 seconds between Topology Mesh & Live Attack World Map.
// Pure TypeScript · Zero external scripts · Zero Three.js · Zero layout shifts.
// ============================================================================

const COLS = 84;
const ROWS = 26;
const CYCLE_SECONDS = 5.0; // Changes every 5 seconds

// TwinSec Industrial / ASCII Magic Palette
const PALETTE_HEX = [
  "#E6EDF3", // 0: Bone White
  "#8B949E", // 1: Muted Rule / Slate
  "#30363D", // 2: Dark Charcoal
  "#00F0FF", // 3: TwinSec Cyan (Air-gap / active node)
  "#BFFF2E", // 4: TwinSec Acid Lime (Primary accent packets)
  "#FFA657", // 5: Industrial Amber (Warning packets)
  "#F778BA", // 6: Signal Pink (Drift packets)
  "#D2A8FF", // 7: Signal Violet
  "#FFFFFF", // 8: Bright White (Packet collision / router hit)
  "#484F58", // 9: Dark Rule (Inactive links / continents)
  "#56D4DD", // 10 ('a'): High-vis Cyan
];

const COLOR_MAP: Record<string, string> = {
  "0": PALETTE_HEX[0],
  "1": PALETTE_HEX[1],
  "2": PALETTE_HEX[2],
  "3": PALETTE_HEX[3],
  "4": PALETTE_HEX[4],
  "5": PALETTE_HEX[5],
  "6": PALETTE_HEX[6],
  "7": PALETTE_HEX[7],
  "8": PALETTE_HEX[8],
  "9": PALETTE_HEX[9],
  a: PALETTE_HEX[10],
  A: PALETTE_HEX[10],
};

class AsciiGrid {
  cols: number;
  rows: number;
  chars: string[];
  colors: string[];

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this.chars = new Array(cols * rows).fill(" ");
    this.colors = new Array(cols * rows).fill("1");
  }

  clear() {
    this.chars.fill(" ");
    this.colors.fill("1");
  }

  set(x: number, y: number, ch: string, co: string) {
    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
      const idx = y * this.cols + x;
      this.chars[idx] = ch;
      this.colors[idx] = co;
    }
  }

  text(x: number, y: number, str: string, co: string) {
    for (let i = 0; i < str.length; i++) {
      this.set(x + i, y, str[i], co);
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, ch: string, co: string) {
    let rx0 = Math.round(x0);
    let ry0 = Math.round(y0);
    const rx1 = Math.round(x1);
    const ry1 = Math.round(y1);
    const dx = Math.abs(rx1 - rx0);
    const dy = Math.abs(ry1 - ry0);
    const sx = rx0 < rx1 ? 1 : -1;
    const sy = ry0 < ry1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      this.set(rx0, ry0, ch, co);
      if (rx0 === rx1 && ry0 === ry1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        rx0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        ry0 += sy;
      }
    }
  }
}

// ----------------------------------------------------------------------------
// MODE 1: NETWORK TOPOLOGY MESH ENGINE
// ----------------------------------------------------------------------------
const TOPOLOGY_NODES: [string, number, number][] = [
  ["gw", 6, 12],
  ["r1", 20, 4],
  ["r2", 22, 20],
  ["r3", 38, 11],
  ["r4", 46, 3],
  ["r5", 50, 21],
  ["r6", 62, 11],
  ["db", 77, 4],
  ["s1", 78, 13],
  ["s2", 74, 22],
];

const TOPOLOGY_LINKS: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [1, 4],
  [3, 4],
  [3, 5],
  [2, 5],
  [4, 6],
  [3, 6],
  [5, 6],
  [6, 7],
  [6, 8],
  [5, 9],
  [6, 9],
  [4, 7],
];

const PACKET_COLS = "3456a7";

function createTopologyEngine() {
  const grid = new AsciiGrid(COLS, ROWS);
  const adj: [number, number][][] = TOPOLOGY_NODES.map(() => []);
  TOPOLOGY_LINKS.forEach(([a, b], i) => {
    adj[a].push([b, i]);
    adj[b].push([a, i]);
  });

  const bfs = (s: number, d: number): number[] => {
    const prev = new Array(TOPOLOGY_NODES.length).fill(-1);
    const q = [s];
    prev[s] = s;
    while (q.length) {
      const u = q.shift()!;
      for (const [v] of adj[u]) {
        if (prev[v] < 0) {
          prev[v] = u;
          q.push(v);
        }
      }
    }
    const path = [d];
    while (path[0] !== s) {
      path.unshift(prev[path[0]]);
    }
    return path;
  };

  const rng = (seed = 4) => {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  };

  const r = rng(4);
  const ROUTES: [number, number[], string][] = [];
  for (let i = 0; i < 40; i++) {
    const a = r() < 0.5 ? 0 : Math.floor(r() * TOPOLOGY_NODES.length);
    let b = 7 + Math.floor(r() * 3);
    if (r() < 0.3) b = Math.floor(r() * 7);
    if (a === b) b = (b + 4) % TOPOLOGY_NODES.length;
    ROUTES.push([i * 0.33, bfs(a, b), PACKET_COLS[i % PACKET_COLS.length]]);
  }

  const HOP = 0.55;
  const LOOP = 40 * 0.33;
  const linkOf = (a: number, b: number) =>
    TOPOLOGY_LINKS.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const lit = new Float32Array(TOPOLOGY_LINKS.length);
  const litCo = new Array(TOPOLOGY_LINKS.length).fill("9");

  return (t: number) => {
    grid.clear();
    lit.fill(0);
    const lt = t % LOOP;
    const pk: [number, number, string, boolean?][] = [];

    for (const [ts, path, co] of ROUTES) {
      for (const off of [0, LOOP]) {
        const age = lt + off - ts;
        const dur = (path.length - 1) * HOP;
        if (age < 0 || age > dur + 0.4) continue;
        const h = Math.min(path.length - 2, Math.floor(age / HOP));
        const f = Math.min(1, (age - h * HOP) / HOP);
        const a = TOPOLOGY_NODES[path[h]];
        const b = TOPOLOGY_NODES[path[h + 1]];
        if (age <= dur) {
          pk.push([a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, co]);
          const li = linkOf(path[h], path[h + 1]);
          if (li >= 0) {
            lit[li] = 1;
            litCo[li] = co;
          }
        } else {
          pk.push([b[1], b[2], co, true]);
        }
      }
    }

    TOPOLOGY_LINKS.forEach(([a, b], i) => {
      const A = TOPOLOGY_NODES[a];
      const B = TOPOLOGY_NODES[b];
      const dx = Math.abs(B[1] - A[1]);
      const dy = Math.abs(B[2] - A[2]) * 2;
      const ch =
        dy < dx * 0.35 ? "─" : dx < dy * 0.35 ? "│" : (B[1] - A[1]) * (B[2] - A[2]) > 0 ? "╲" : "╱";
      grid.line(A[1], A[2], B[1], B[2], lit[i] ? "•" : ch, lit[i] ? litCo[i] : "9");
    });

    for (const [x, y, co, arrived] of pk) {
      if (arrived) continue;
      grid.set(Math.round(x), Math.round(y), "●", co);
    }

    TOPOLOGY_NODES.forEach(([name, x, y]) => {
      const hit = pk.some(([px, py, , arr]) => arr && px === x && py === y);
      const busy = pk.filter(([px, py]) => Math.abs(px - x) < 4 && Math.abs(py - y) < 2).length;
      const co = hit ? "8" : busy ? "3" : "1";
      grid.text(x - 2, y - 1, "╭───╮", co);
      grid.text(x - 2, y, "│", co);
      grid.text(x + 2, y, "│", co);
      grid.text(x - 1, y, name.padEnd(3), hit ? "8" : "0");
      grid.text(x - 2, y + 1, "╰───╯", co);
    });

    return grid;
  };
}

// ----------------------------------------------------------------------------
// MODE 2: GLOBAL INDUSTRIAL ATTACK WORLD MAP ENGINE
// ----------------------------------------------------------------------------
// Target SCADA/ICS critical infrastructure hubs
const WORLD_TARGETS: [string, number, number, string][] = [
  ["KYIV", 48, 8, "4"], // Ukraine Power Grid (Acid Lime)
  ["HOUSTON", 18, 11, "5"], // Texas ERCOT Grid (Amber)
  ["OLDSMAR", 22, 12, "3"], // Florida Water SCADA (Cyan)
  ["NATANZ", 55, 11, "6"], // Centrifuge SIS (Pink)
  ["TANURA", 54, 13, "5"], // Saudi Oil Refinery (Amber)
  ["FRANKFURT", 44, 8, "4"], // German Manufacturing Core (Acid Lime)
  ["SINGAPORE", 69, 16, "3"], // Malacca Maritime Port (Cyan)
  ["TOKYO", 76, 10, "4"], // Japan High-Speed Grid (Acid Lime)
  ["SAO PAULO", 30, 19, "7"], // Itaipu Hydroelectric (Violet)
];

// Active attack trajectories: [sourceX, sourceY, targetIndex, speed]
const ATTACK_VECTORS: [number, number, number, number][] = [
  [12, 6, 0, 1.2], // Atlantic -> Kyiv
  [40, 4, 1, 1.4], // Europe -> Houston
  [38, 5, 2, 1.1], // Relay -> Oldsmar
  [58, 7, 3, 1.5], // Staging -> Natanz
  [46, 10, 4, 1.3], // Med -> Tanura
  [16, 10, 5, 1.6], // US East -> Frankfurt
  [52, 12, 6, 1.2], // Indian Ocean -> Singapore
  [65, 8, 7, 1.7], // East Asia -> Tokyo
  [22, 13, 8, 1.3], // Gulf -> Sao Paulo
];

// Continental coastline points (dot-density raster)
const CONTINENT_POINTS: [number, number][] = [
  // North America
  [14, 5],
  [16, 5],
  [18, 5],
  [20, 5],
  [22, 5],
  [12, 6],
  [14, 6],
  [16, 6],
  [18, 6],
  [20, 6],
  [24, 6],
  [26, 6],
  [10, 7],
  [12, 7],
  [14, 7],
  [16, 7],
  [18, 7],
  [20, 7],
  [22, 7],
  [24, 7],
  [12, 8],
  [14, 8],
  [16, 8],
  [18, 8],
  [20, 8],
  [22, 8],
  [24, 8],
  [14, 9],
  [16, 9],
  [18, 9],
  [20, 9],
  [22, 9],
  [24, 9],
  [16, 10],
  [18, 10],
  [20, 10],
  [22, 10],
  [18, 11],
  [20, 11],
  [22, 11],
  [24, 11],
  [18, 12],
  [20, 12],
  [22, 12],
  [20, 13],
  [22, 13],
  [24, 14],
  // South America
  [26, 15],
  [28, 15],
  [30, 15],
  [26, 16],
  [28, 16],
  [30, 16],
  [32, 16],
  [26, 17],
  [28, 17],
  [30, 17],
  [32, 17],
  [34, 17],
  [28, 18],
  [30, 18],
  [32, 18],
  [34, 18],
  [28, 19],
  [30, 19],
  [32, 19],
  [28, 20],
  [30, 20],
  [28, 21],
  [30, 21],
  [28, 22],
  // Europe
  [42, 6],
  [44, 6],
  [46, 6],
  [48, 6],
  [42, 7],
  [44, 7],
  [46, 7],
  [48, 7],
  [50, 7],
  [42, 8],
  [44, 8],
  [46, 8],
  [48, 8],
  [50, 8],
  [44, 9],
  [46, 9],
  [48, 9],
  // Africa
  [42, 11],
  [44, 11],
  [46, 11],
  [48, 11],
  [50, 11],
  [42, 12],
  [44, 12],
  [46, 12],
  [48, 12],
  [50, 12],
  [52, 12],
  [44, 13],
  [46, 13],
  [48, 13],
  [50, 13],
  [52, 13],
  [44, 14],
  [46, 14],
  [48, 14],
  [50, 14],
  [46, 15],
  [48, 15],
  [50, 15],
  [46, 16],
  [48, 16],
  [48, 17],
  [48, 18],
  [48, 19],
  // Asia
  [52, 5],
  [54, 5],
  [56, 5],
  [58, 5],
  [60, 5],
  [62, 5],
  [64, 5],
  [66, 5],
  [68, 5],
  [70, 5],
  [52, 6],
  [54, 6],
  [56, 6],
  [58, 6],
  [60, 6],
  [62, 6],
  [64, 6],
  [66, 6],
  [68, 6],
  [70, 6],
  [72, 6],
  [52, 7],
  [54, 7],
  [56, 7],
  [58, 7],
  [60, 7],
  [62, 7],
  [64, 7],
  [66, 7],
  [68, 7],
  [70, 7],
  [72, 7],
  [52, 8],
  [54, 8],
  [56, 8],
  [58, 8],
  [60, 8],
  [62, 8],
  [64, 8],
  [66, 8],
  [68, 8],
  [70, 8],
  [72, 8],
  [74, 8],
  [54, 9],
  [56, 9],
  [58, 9],
  [60, 9],
  [62, 9],
  [64, 9],
  [66, 9],
  [68, 9],
  [70, 9],
  [72, 9],
  [74, 9],
  [54, 10],
  [56, 10],
  [58, 10],
  [60, 10],
  [62, 10],
  [64, 10],
  [66, 10],
  [68, 10],
  [70, 10],
  [72, 10],
  [76, 10],
  [56, 11],
  [58, 11],
  [60, 11],
  [62, 11],
  [64, 11],
  [66, 11],
  [68, 11],
  [70, 11],
  [60, 12],
  [62, 12],
  [64, 12],
  [66, 12],
  [68, 12],
  [62, 13],
  [64, 13],
  [66, 13],
  [68, 14],
  [70, 15],
  [69, 16],
  // Australia
  [72, 18],
  [74, 18],
  [76, 18],
  [78, 18],
  [72, 19],
  [74, 19],
  [76, 19],
  [78, 19],
  [80, 19],
  [72, 20],
  [74, 20],
  [76, 20],
  [78, 20],
  [80, 20],
  [74, 21],
  [76, 21],
  [78, 21],
];

function createWorldMapEngine() {
  const grid = new AsciiGrid(COLS, ROWS);

  return (t: number) => {
    grid.clear();

    // 1. Draw subtle continental landmass
    for (const [cx, cy] of CONTINENT_POINTS) {
      grid.set(cx, cy, "·", "9");
    }

    // 2. Draw live attack trajectories and packet pings
    for (let i = 0; i < ATTACK_VECTORS.length; i++) {
      const [sx, sy, targetIdx, spd] = ATTACK_VECTORS[i];
      const target = WORLD_TARGETS[targetIdx];
      const tx = target[1];
      const ty = target[2];
      const targetColor = target[3];

      // Dynamic attack cycle
      const cycleTime = (t * spd + i * 1.3) % 2.5;
      const progress = cycleTime / 2.5;

      // Draw faint trajectory path
      const dx = Math.abs(tx - sx);
      const dy = Math.abs(ty - sy) * 2;
      const ch =
        dy < dx * 0.35 ? "─" : dx < dy * 0.35 ? "│" : (tx - sx) * (ty - sy) > 0 ? "╲" : "╱";
      grid.line(sx, sy, tx, ty, ch, "2");

      // Hopping packet ping
      if (progress < 0.9) {
        const px = Math.round(sx + (tx - sx) * progress);
        const py = Math.round(sy + (ty - sy) * progress);
        grid.set(px, py, "●", targetColor);
      } else {
        // Impact beacon at target
        grid.set(tx, ty, "◎", "8");
      }
    }

    // 3. Draw Target Infrastructure Nodes with Pulsing Beacons
    for (let i = 0; i < WORLD_TARGETS.length; i++) {
      const [name, x, y, col] = WORLD_TARGETS[i];
      const pulse = Math.floor(t * 3 + i) % 2 === 0;

      // Target Reticle
      grid.set(x, y, pulse ? "◉" : "●", pulse ? "8" : col);

      // Short Industrial Node Label (3 chars)
      const label = name.slice(0, 3);
      grid.text(x + 2, y, label, pulse ? "0" : "1");
    }

    return grid;
  };
}

interface AsciiNetworkTopologyProps {
  className?: string;
  fps?: number;
}

export function AsciiNetworkTopology({ className = "", fps = 24 }: AsciiNetworkTopologyProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const tickTopology = createTopologyEngine();
    const tickWorldMap = createWorldMapEngine();

    // Sizing constants (84 cols x 26 rows)
    const cw = 8;
    const ch = 15;
    const logicalW = COLS * cw; // 672px
    const logicalH = ROWS * ch; // 390px

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = logicalW * dpr;
    canvas.height = logicalH * dpr;

    let animId = 0;
    const startTime = performance.now();
    let lastDraw = 0;
    const frameInterval = 1000 / fps;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const drawFrame = (now: number) => {
      // 100% transparent clear
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.font = "12px 'JetBrains Mono', 'Fira Code', 'Courier New', monospace";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      const elapsedSeconds = (now - startTime) / 1000;

      // Automatically cycle between Topology and World Map every 5 seconds
      const cycleIndex = Math.floor(elapsedSeconds / CYCLE_SECONDS);
      const isWorldMapMode = cycleIndex % 2 === 1;

      const grid = isWorldMapMode ? tickWorldMap(elapsedSeconds) : tickTopology(elapsedSeconds);

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const idx = y * COLS + x;
          const char = grid.chars[idx];
          if (char === " ") continue;

          const colorKey = grid.colors[idx];
          ctx.fillStyle = COLOR_MAP[colorKey] || PALETTE_HEX[1];
          ctx.fillText(char, x * cw + cw / 2, y * ch + ch / 2);
        }
      }
      ctx.restore();
    };

    if (prefersReducedMotion) {
      drawFrame(startTime + 2500);
      return;
    }

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);
      if (now - lastDraw < frameInterval) return;
      lastDraw = now - ((now - lastDraw) % frameInterval);
      drawFrame(now);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [fps]);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-transparent ${className}`}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          maxWidth: "672px",
          height: "auto",
          aspectRatio: "672 / 390",
          backgroundColor: "transparent",
        }}
        className="block bg-transparent select-none pointer-events-none drop-shadow-[0_0_12px_rgba(191,255,46,0.12)]"
      />
    </div>
  );
}

export default AsciiNetworkTopology;
