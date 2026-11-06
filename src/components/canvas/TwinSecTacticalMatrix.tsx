import { useEffect, useRef, useState, useMemo, useCallback } from "react";

// ============================================================================
// TYPES & SECTOR DEFINITIONS
// ============================================================================

export type MatrixMode =
  | "laptop"
  | "globe"
  | "power"
  | "water"
  | "oil-gas"
  | "manufacturing"
  | "port"
  | "smart-building"
  | "smart-city";

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface CountryNode {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

interface AttackArc {
  id: string;
  source: CountryNode;
  target: CountryNode;
  progress: number;
  speed: number;
  color: string;
}

interface SectorMetadata {
  id: MatrixMode;
  label: string;
  telemetryA: string;
  telemetryB: string;
}

const ALL_SECTORS: SectorMetadata[] = [
  {
    id: "laptop",
    label: "EWS-04 FIELD OPERATOR WORKSTATION",
    telemetryA: "AIR-GAP: ARMED [BFS-OK]",
    telemetryB: "REACHABILITY: <0.08 ms",
  },
  {
    id: "globe",
    label: "GLOBAL KINETIC THREAT MATRIX",
    telemetryA: "T0814 [PLC OVERDRIVE]",
    telemetryB: "WAR ROOM FEED: ACTIVE",
  },
  {
    id: "power",
    label: "SECTOR 01: POWER GRID SUBSTATION",
    telemetryA: "SUB-07 ROTOR: 60.02 Hz [NOMINAL]",
    telemetryB: "GRID FREQ STABILITY: 99.8%",
  },
  {
    id: "water",
    label: "SECTOR 02: MUNICIPAL WATER REFINERY",
    telemetryA: "DOSING REACTOR P3: 1.48 PPM",
    telemetryB: "FLOW PUMP: 1,450 RPM",
  },
  {
    id: "oil-gas",
    label: "SECTOR 03: OIL & GAS PIPELINE",
    telemetryA: "PIPELINE-09: 64.2 BAR",
    telemetryB: "TRITON SIS TRIP: READY",
  },
  {
    id: "manufacturing",
    label: "SECTOR 04: INDUSTRIAL MANUFACTURING",
    telemetryA: "CENTRIFUGE S7: 4,800 RPM",
    telemetryB: "ROBOTIC CELL-A: SYNCED",
  },
  {
    id: "port",
    label: "SECTOR 05: MARITIME CONTAINER PORT",
    telemetryA: "STS CRANE-04: HOIST ACTIVE",
    telemetryB: "BERTH 07 SCADA: ENCRYPTED",
  },
  {
    id: "smart-building",
    label: "SECTOR 06: SMART FACILITY HVAC",
    telemetryA: "HVAC CHILLER-02: 6.8°C",
    telemetryB: "VAV AIRFLOW: 2,400 CFM",
  },
  {
    id: "smart-city",
    label: "SECTOR 07: SMART CITY METRO GRID",
    telemetryA: "TRACTION BUS: 750V DC",
    telemetryB: "CBTC SIGNALLING: LOCKED",
  },
];

const COUNTRY_NODES: CountryNode[] = [
  { id: "USA", name: "UNITED STATES", lat: 38.9, lon: -77.0 },
  { id: "GBR", name: "UNITED KINGDOM", lat: 51.5, lon: -0.1 },
  { id: "DEU", name: "GERMANY", lat: 52.5, lon: 13.4 },
  { id: "UKR", name: "UKRAINE", lat: 50.4, lon: 30.5 },
  { id: "IRN", name: "IRAN", lat: 35.7, lon: 51.4 },
  { id: "TWN", name: "TAIWAN", lat: 25.0, lon: 121.5 },
  { id: "JPN", name: "JAPAN", lat: 35.7, lon: 139.7 },
  { id: "SGP", name: "SINGAPORE", lat: 1.3, lon: 103.8 },
  { id: "BRA", name: "BRAZIL", lat: -23.5, lon: -46.6 },
  { id: "AUS", name: "AUSTRALIA", lat: -33.8, lon: 151.2 },
];

const ATTACK_POOL = [
  { src: "UKR", tgt: "GBR", color: "#bfff2e" },
  { src: "IRN", tgt: "USA", color: "#ff3e3e" },
  { src: "USA", tgt: "IRN", color: "#00f0ff" },
  { src: "UKR", tgt: "DEU", color: "#bfff2e" },
  { src: "JPN", tgt: "TWN", color: "#00f0ff" },
  { src: "DEU", tgt: "USA", color: "#ff3e3e" },
  { src: "AUS", tgt: "SGP", color: "#bfff2e" },
];

const ASCII_RAMP = " .:-=+*#%@";

function latLonToPoint3D(lat: number, lon: number, radius: number): Point3D {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return {
    x: -(radius * Math.sin(phi) * Math.cos(theta)),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

function rotatePoint(p: Point3D, rotX: number, rotY: number): Point3D {
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const x1 = p.x * cosY + p.z * sinY;
  const y1 = p.y;
  const z1 = -p.x * sinY + p.z * cosY;

  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const x2 = x1;
  const y2 = y1 * cosX - z1 * sinX;
  const z2 = y1 * sinX + z1 * cosX;

  return { x: x2, y: y2, z: z2 };
}

// ============================================================================
// MAIN COMPONENT — Pure Borderless Floating 3D ASCII Canvas
// ============================================================================

export function TwinSecTacticalMatrix({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Active sector mode
  const [mode, setMode] = useState<MatrixMode>("laptop");

  // Trackball rotation angles
  const rotationRef = useRef<{ x: number; y: number }>({
    x: 0.24,
    y: -0.35,
  });

  const mouseStateRef = useRef<{ isDown: boolean; lastX: number; lastY: number }>({
    isDown: false,
    lastX: 0,
    lastY: 0,
  });

  const dragDistanceRef = useRef(0);
  const activeAttacksRef = useRef<AttackArc[]>([]);

  // Initialize attack arcs for globe
  useEffect(() => {
    const getNode = (id: string) => COUNTRY_NODES.find((n) => n.id === id) || COUNTRY_NODES[0];
    activeAttacksRef.current = [
      {
        id: "arc-1",
        source: getNode("UKR"),
        target: getNode("GBR"),
        progress: 0.2,
        speed: 0.008,
        color: "#bfff2e",
      },
      {
        id: "arc-2",
        source: getNode("IRN"),
        target: getNode("USA"),
        progress: 0.65,
        speed: 0.01,
        color: "#ff3e3e",
      },
      {
        id: "arc-3",
        source: getNode("DEU"),
        target: getNode("UKR"),
        progress: 0.45,
        speed: 0.007,
        color: "#00f0ff",
      },
    ];
  }, []);

  // 10-Second Auto-Cycle through all 7 sectors + laptop + globe
  useEffect(() => {
    const interval = setInterval(() => {
      if (mouseStateRef.current.isDown) return;
      setMode((prev) => {
        const idx = ALL_SECTORS.findIndex((s) => s.id === prev);
        const nextIdx = (idx + 1) % ALL_SECTORS.length;
        return ALL_SECTORS[nextIdx].id;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // --------------------------------------------------------------------------
  // MODEL 1: Globe Point Cloud & Coordinate Rings
  // --------------------------------------------------------------------------
  const globePoints = useMemo(() => {
    const points: Point3D[] = [];
    const radius = 145;

    for (let lat = -70; lat <= 70; lat += 25) {
      const step = Math.max(14, Math.floor(40 * Math.cos((lat * Math.PI) / 180)));
      for (let i = 0; i < step; i++) {
        const lon = (i / step) * 360 - 180;
        points.push(latLonToPoint3D(lat, lon, radius));
      }
    }

    for (let lon = -180; lon < 180; lon += 36) {
      for (let lat = -80; lat <= 80; lat += 12) {
        points.push(latLonToPoint3D(lat, lon, radius));
      }
    }

    const continents = [
      { lat: 42, lon: -98, count: 48, spread: 22 },
      { lat: -14, lon: -58, count: 36, spread: 18 },
      { lat: 52, lon: 16, count: 52, spread: 16 },
      { lat: 8, lon: 24, count: 42, spread: 22 },
      { lat: 46, lon: 98, count: 68, spread: 30 },
      { lat: -24, lon: 134, count: 28, spread: 16 },
    ];

    continents.forEach((c) => {
      for (let i = 0; i < c.count; i++) {
        const latOffset = (Math.random() - 0.5) * c.spread * 2;
        const lonOffset = (Math.random() - 0.5) * c.spread * 2;
        points.push(latLonToPoint3D(c.lat + latOffset, c.lon + lonOffset, radius));
      }
    });

    return points;
  }, []);

  // --------------------------------------------------------------------------
  // MODEL 2: Tactical EWS Operator Laptop (Cyberdeck)
  // --------------------------------------------------------------------------
  const laptopModel = useMemo(() => {
    const lines: [Point3D, Point3D][] = [];
    const screenGlyphs: { p: Point3D; char: string; color: string }[] = [];

    const bw = 95;
    const bh = 8;
    const bd = 72;
    const yBase = 28;

    const b0: Point3D = { x: -bw, y: yBase, z: -bd };
    const b1: Point3D = { x: bw, y: yBase, z: -bd };
    const b2: Point3D = { x: bw, y: yBase, z: bd };
    const b3: Point3D = { x: -bw, y: yBase, z: bd };

    const b0t: Point3D = { x: -bw, y: yBase - bh, z: -bd };
    const b1t: Point3D = { x: bw, y: yBase - bh, z: -bd };
    const b2t: Point3D = { x: bw, y: yBase - bh, z: bd };
    const b3t: Point3D = { x: -bw, y: yBase - bh, z: bd };

    lines.push([b0, b1], [b1, b2], [b2, b3], [b3, b0]);
    lines.push([b0t, b1t], [b1t, b2t], [b2t, b3t], [b3t, b0t]);
    lines.push([b0, b0t], [b1, b1t], [b2, b2t], [b3, b3t]);

    // Trackpad
    const tw = 28;
    const td1 = 34;
    const td2 = 62;
    lines.push(
      [
        { x: -tw, y: yBase - bh, z: td1 },
        { x: tw, y: yBase - bh, z: td1 },
      ],
      [
        { x: tw, y: yBase - bh, z: td1 },
        { x: tw, y: yBase - bh, z: td2 },
      ],
      [
        { x: tw, y: yBase - bh, z: td2 },
        { x: -tw, y: yBase - bh, z: td2 },
      ],
      [
        { x: -tw, y: yBase - bh, z: td2 },
        { x: -tw, y: yBase - bh, z: td1 },
      ],
    );

    // Keyboard Keycap Rows
    for (let row = -bd + 16; row <= 18; row += 11) {
      lines.push([
        { x: -bw + 14, y: yBase - bh, z: row },
        { x: bw - 14, y: yBase - bh, z: row },
      ]);
    }
    for (let col = -bw + 14; col <= bw - 14; col += 20) {
      lines.push([
        { x: col, y: yBase - bh, z: -bd + 16 },
        { x: col, y: yBase - bh, z: 18 },
      ]);
    }

    // Angled Lid Screen
    const screenTilt = 0.36;
    const screenHeight = 105;
    const sw = 95;

    const s0: Point3D = { x: -sw, y: yBase - bh, z: -bd };
    const s1: Point3D = { x: sw, y: yBase - bh, z: -bd };
    const s2: Point3D = {
      x: sw,
      y: yBase - bh - Math.cos(screenTilt) * screenHeight,
      z: -bd - Math.sin(screenTilt) * screenHeight,
    };
    const s3: Point3D = {
      x: -sw,
      y: yBase - bh - Math.cos(screenTilt) * screenHeight,
      z: -bd - Math.sin(screenTilt) * screenHeight,
    };

    lines.push([s0, s1], [s1, s2], [s2, s3], [s3, s0]);

    // Inner Display Screen Bezel
    const margin = 10;
    const is0: Point3D = {
      x: -sw + margin,
      y: yBase - bh - margin,
      z: -bd - margin * Math.sin(screenTilt),
    };
    const is1: Point3D = {
      x: sw - margin,
      y: yBase - bh - margin,
      z: -bd - margin * Math.sin(screenTilt),
    };
    const is2: Point3D = {
      x: sw - margin,
      y: yBase - bh - Math.cos(screenTilt) * (screenHeight - margin),
      z: -bd - Math.sin(screenTilt) * (screenHeight - margin),
    };
    const is3: Point3D = {
      x: -sw + margin,
      y: yBase - bh - Math.cos(screenTilt) * (screenHeight - margin),
      z: -bd - Math.sin(screenTilt) * (screenHeight - margin),
    };

    lines.push([is0, is1], [is1, is2], [is2, is3], [is3, is0]);

    // Terminal Code Lines
    const terminalLines = [
      "TWINSEC EWS-04 // LIVE",
      "L1: 60.02 Hz NOMINAL",
      "AIR-GAP: ARMED [BFS-OK]",
      "root@twinsec:~# _",
    ];

    terminalLines.forEach((text, lineIdx) => {
      const lineYProg = 0.22 + lineIdx * 0.19;
      const targetY = yBase - bh - Math.cos(screenTilt) * (screenHeight * (1 - lineYProg));
      const targetZ = -bd - Math.sin(screenTilt) * (screenHeight * (1 - lineYProg));
      const startX = -sw + 20;

      for (let c = 0; c < text.length; c++) {
        screenGlyphs.push({
          p: { x: startX + c * 8.2, y: targetY, z: targetZ + 1 },
          char: text[c],
          color: lineIdx === 0 ? "#bfff2e" : lineIdx === 3 ? "#00f0ff" : "#ffffff",
        });
      }
    });

    return { lines, screenGlyphs };
  }, []);

  // --------------------------------------------------------------------------
  // MODEL 3: Sector 1 — Power Grid Substation HV Transformer
  // Realistic silhouette: Oil-filled rectangular tank, radiator cooling fins,
  // HV porcelain bushings, 3-phase busbar connections, ground conductor.
  // --------------------------------------------------------------------------
  const powerModel = useMemo(() => {
    const lines: [Point3D, Point3D][] = [];

    // Oil tank body (rectangular box)
    const tw = 60,
      th = 70,
      td = 45;
    const ty = 10; // vertical center offset
    // Bottom rectangle
    lines.push(
      [
        { x: -tw, y: ty + th / 2, z: -td },
        { x: tw, y: ty + th / 2, z: -td },
      ],
      [
        { x: tw, y: ty + th / 2, z: -td },
        { x: tw, y: ty + th / 2, z: td },
      ],
      [
        { x: tw, y: ty + th / 2, z: td },
        { x: -tw, y: ty + th / 2, z: td },
      ],
      [
        { x: -tw, y: ty + th / 2, z: td },
        { x: -tw, y: ty + th / 2, z: -td },
      ],
    );
    // Top rectangle
    lines.push(
      [
        { x: -tw, y: ty - th / 2, z: -td },
        { x: tw, y: ty - th / 2, z: -td },
      ],
      [
        { x: tw, y: ty - th / 2, z: -td },
        { x: tw, y: ty - th / 2, z: td },
      ],
      [
        { x: tw, y: ty - th / 2, z: td },
        { x: -tw, y: ty - th / 2, z: td },
      ],
      [
        { x: -tw, y: ty - th / 2, z: td },
        { x: -tw, y: ty - th / 2, z: -td },
      ],
    );
    // Vertical edges
    lines.push(
      [
        { x: -tw, y: ty + th / 2, z: -td },
        { x: -tw, y: ty - th / 2, z: -td },
      ],
      [
        { x: tw, y: ty + th / 2, z: -td },
        { x: tw, y: ty - th / 2, z: -td },
      ],
      [
        { x: tw, y: ty + th / 2, z: td },
        { x: tw, y: ty - th / 2, z: td },
      ],
      [
        { x: -tw, y: ty + th / 2, z: td },
        { x: -tw, y: ty - th / 2, z: td },
      ],
    );

    // Radiator cooling fins (zigzag plates on both sides)
    for (let f = -30; f <= 30; f += 15) {
      const finX = tw + 14;
      lines.push(
        [
          { x: finX, y: ty + th / 2 - 8, z: f },
          { x: finX + 10, y: ty, z: f },
        ],
        [
          { x: finX + 10, y: ty, z: f },
          { x: finX, y: ty - th / 2 + 8, z: f },
        ],
      );
      lines.push(
        [
          { x: -finX, y: ty + th / 2 - 8, z: f },
          { x: -finX - 10, y: ty, z: f },
        ],
        [
          { x: -finX - 10, y: ty, z: f },
          { x: -finX, y: ty - th / 2 + 8, z: f },
        ],
      );
    }

    // HV Porcelain bushings (3-phase: three tall insulators on top)
    const bushingY = ty - th / 2;
    for (const bx of [-30, 0, 30]) {
      // Insulator stack (3 disc segments)
      lines.push([
        { x: bx, y: bushingY, z: 0 },
        { x: bx, y: bushingY - 50, z: 0 },
      ]);
      for (let disc = 1; disc <= 3; disc++) {
        const dy = bushingY - disc * 12;
        lines.push([
          { x: bx - 8, y: dy, z: 0 },
          { x: bx + 8, y: dy, z: 0 },
        ]);
      }
      // Conductor tip
      lines.push([
        { x: bx - 5, y: bushingY - 50, z: 0 },
        { x: bx + 5, y: bushingY - 50, z: 0 },
      ]);
    }

    // 3-Phase overhead busbar connection
    const busY = bushingY - 55;
    lines.push([
      { x: -40, y: busY, z: 0 },
      { x: 40, y: busY, z: 0 },
    ]);

    // Ground conductor (bottom-right corner to earth stake)
    lines.push(
      [
        { x: tw, y: ty + th / 2, z: td },
        { x: tw + 20, y: ty + th / 2 + 25, z: td },
      ],
      [
        { x: tw + 14, y: ty + th / 2 + 25, z: td },
        { x: tw + 26, y: ty + th / 2 + 25, z: td },
      ],
      [
        { x: tw + 16, y: ty + th / 2 + 29, z: td },
        { x: tw + 24, y: ty + th / 2 + 29, z: td },
      ],
      [
        { x: tw + 18, y: ty + th / 2 + 33, z: td },
        { x: tw + 22, y: ty + th / 2 + 33, z: td },
      ],
    );

    return lines;
  }, []);

  // --------------------------------------------------------------------------
  // MODEL 4: Sector 2 — Municipal Water Treatment Clarifier & Dosing Reactor
  // Realistic: Cylindrical clarifier tank, central scraper shaft, chemical
  // dosing injector pipe with valve handwheel, effluent weir, inlet/outlet.
  // --------------------------------------------------------------------------
  const waterModel = useMemo(() => {
    const lines: [Point3D, Point3D][] = [];
    const segs = 16;

    // Main clarifier tank cylinder
    const tankR = 65,
      tankH = 55;
    for (let i = 0; i < segs; i++) {
      const a1 = (i / segs) * Math.PI * 2;
      const a2 = ((i + 1) / segs) * Math.PI * 2;
      // Top rim
      lines.push([
        { x: Math.cos(a1) * tankR, y: -tankH / 2, z: Math.sin(a1) * tankR },
        { x: Math.cos(a2) * tankR, y: -tankH / 2, z: Math.sin(a2) * tankR },
      ]);
      // Bottom rim
      lines.push([
        { x: Math.cos(a1) * tankR, y: tankH / 2, z: Math.sin(a1) * tankR },
        { x: Math.cos(a2) * tankR, y: tankH / 2, z: Math.sin(a2) * tankR },
      ]);
      // Vertical staves (every other)
      if (i % 2 === 0) {
        lines.push([
          { x: Math.cos(a1) * tankR, y: -tankH / 2, z: Math.sin(a1) * tankR },
          { x: Math.cos(a1) * tankR, y: tankH / 2, z: Math.sin(a1) * tankR },
        ]);
      }
    }

    // Conical sludge hopper bottom
    const hopperR = 18;
    const hopperY = tankH / 2 + 30;
    for (let i = 0; i < segs; i += 2) {
      const a1 = (i / segs) * Math.PI * 2;
      lines.push([
        { x: Math.cos(a1) * tankR, y: tankH / 2, z: Math.sin(a1) * tankR },
        { x: Math.cos(a1) * hopperR, y: hopperY, z: Math.sin(a1) * hopperR },
      ]);
    }
    // Hopper drain pipe
    lines.push(
      [
        { x: 0, y: hopperY, z: 0 },
        { x: 0, y: hopperY + 18, z: 0 },
      ],
      [
        { x: -6, y: hopperY + 18, z: 0 },
        { x: 6, y: hopperY + 18, z: 0 },
      ],
    );

    // Central scraper shaft & drive motor
    lines.push([
      { x: 0, y: -tankH / 2 - 22, z: 0 },
      { x: 0, y: tankH / 2, z: 0 },
    ]);
    // Motor housing on top
    lines.push(
      [
        { x: -10, y: -tankH / 2 - 22, z: -10 },
        { x: 10, y: -tankH / 2 - 22, z: -10 },
      ],
      [
        { x: 10, y: -tankH / 2 - 22, z: -10 },
        { x: 10, y: -tankH / 2 - 22, z: 10 },
      ],
      [
        { x: 10, y: -tankH / 2 - 22, z: 10 },
        { x: -10, y: -tankH / 2 - 22, z: 10 },
      ],
      [
        { x: -10, y: -tankH / 2 - 22, z: 10 },
        { x: -10, y: -tankH / 2 - 22, z: -10 },
      ],
      [
        { x: -10, y: -tankH / 2 - 32, z: -10 },
        { x: 10, y: -tankH / 2 - 32, z: -10 },
      ],
      [
        { x: 10, y: -tankH / 2 - 32, z: -10 },
        { x: 10, y: -tankH / 2 - 32, z: 10 },
      ],
      [
        { x: 10, y: -tankH / 2 - 32, z: 10 },
        { x: -10, y: -tankH / 2 - 32, z: 10 },
      ],
      [
        { x: -10, y: -tankH / 2 - 32, z: 10 },
        { x: -10, y: -tankH / 2 - 32, z: -10 },
      ],
    );

    // Chemical dosing injector pipe (from side)
    lines.push(
      [
        { x: -tankR - 35, y: 0, z: 0 },
        { x: -tankR, y: 0, z: 0 },
      ],
      [
        { x: -tankR - 35, y: 0, z: 0 },
        { x: -tankR - 35, y: -20, z: 0 },
      ],
    );
    // Valve handwheel on dosing pipe
    const vx = -tankR - 18;
    const valveR = 10;
    for (let i = 0; i < 8; i++) {
      const a1 = (i / 8) * Math.PI * 2;
      const a2 = ((i + 1) / 8) * Math.PI * 2;
      lines.push([
        { x: vx, y: Math.cos(a1) * valveR, z: Math.sin(a1) * valveR },
        { x: vx, y: Math.cos(a2) * valveR, z: Math.sin(a2) * valveR },
      ]);
    }
    // Valve crossbar spokes
    lines.push(
      [
        { x: vx, y: -valveR, z: 0 },
        { x: vx, y: valveR, z: 0 },
      ],
      [
        { x: vx, y: 0, z: -valveR },
        { x: vx, y: 0, z: valveR },
      ],
    );

    // Effluent overflow weir & outlet pipe (right side)
    lines.push(
      [
        { x: tankR, y: -tankH / 2 + 6, z: 0 },
        { x: tankR + 30, y: -tankH / 2 + 6, z: 0 },
      ],
      [
        { x: tankR + 30, y: -tankH / 2 + 6, z: 0 },
        { x: tankR + 30, y: 10, z: 0 },
      ],
    );

    return lines;
  }, []);

  // --------------------------------------------------------------------------
  // MODEL 5: Sector 3 — Oil & Gas Refinery Distillation Column & Flare Stack
  // Realistic: Tall cylindrical distillation column with tray levels,
  // horizontal pipe rack, flare stack with flame tip & guy wires.
  // --------------------------------------------------------------------------
  const oilGasModel = useMemo(() => {
    const lines: [Point3D, Point3D][] = [];
    const segs = 14;

    // Distillation column (tall cylinder, left side)
    const colR = 22,
      colH = 130;
    const colX = -35;
    for (let i = 0; i < segs; i++) {
      const a1 = (i / segs) * Math.PI * 2;
      const a2 = ((i + 1) / segs) * Math.PI * 2;
      lines.push(
        [
          { x: colX + Math.cos(a1) * colR, y: -colH / 2, z: Math.sin(a1) * colR },
          { x: colX + Math.cos(a2) * colR, y: -colH / 2, z: Math.sin(a2) * colR },
        ],
        [
          { x: colX + Math.cos(a1) * colR, y: colH / 2, z: Math.sin(a1) * colR },
          { x: colX + Math.cos(a2) * colR, y: colH / 2, z: Math.sin(a2) * colR },
        ],
      );
      if (i % 3 === 0) {
        lines.push([
          { x: colX + Math.cos(a1) * colR, y: -colH / 2, z: Math.sin(a1) * colR },
          { x: colX + Math.cos(a1) * colR, y: colH / 2, z: Math.sin(a1) * colR },
        ]);
      }
    }
    // Distillation tray levels
    for (let tray = -colH / 2 + 20; tray < colH / 2; tray += 22) {
      lines.push([
        { x: colX - colR, y: tray, z: 0 },
        { x: colX + colR, y: tray, z: 0 },
      ]);
    }
    // Dome top
    lines.push(
      [
        { x: colX - colR * 0.6, y: -colH / 2 - 10, z: 0 },
        { x: colX + colR * 0.6, y: -colH / 2 - 10, z: 0 },
      ],
      [
        { x: colX - colR, y: -colH / 2, z: 0 },
        { x: colX - colR * 0.6, y: -colH / 2 - 10, z: 0 },
      ],
      [
        { x: colX + colR, y: -colH / 2, z: 0 },
        { x: colX + colR * 0.6, y: -colH / 2 - 10, z: 0 },
      ],
    );

    // Horizontal pipe rack (connects column to flare)
    for (let p = 0; p < 3; p++) {
      const py = 10 + p * 18;
      lines.push([
        { x: colX + colR, y: py, z: 0 },
        { x: 30, y: py, z: 0 },
      ]);
    }
    // Pipe rack supports
    lines.push(
      [
        { x: 0, y: colH / 2, z: 0 },
        { x: 0, y: 10, z: 0 },
      ],
      [
        { x: 20, y: colH / 2, z: 0 },
        { x: 20, y: 10, z: 0 },
      ],
    );

    // Flare stack (right side) — tapered tower with cross-bracing & flame
    const fX = 55;
    const fBase = colH / 2;
    const fTop = -colH / 2 - 5;
    lines.push(
      [
        { x: fX - 8, y: fBase, z: -8 },
        { x: fX - 3, y: fTop, z: -3 },
      ],
      [
        { x: fX + 8, y: fBase, z: -8 },
        { x: fX + 3, y: fTop, z: -3 },
      ],
      [
        { x: fX - 8, y: fBase, z: 8 },
        { x: fX - 3, y: fTop, z: 3 },
      ],
      [
        { x: fX + 8, y: fBase, z: 8 },
        { x: fX + 3, y: fTop, z: 3 },
      ],
    );
    // Cross braces
    for (let b = fBase - 20; b > fTop + 15; b -= 25) {
      lines.push(
        [
          { x: fX - 7, y: b, z: 0 },
          { x: fX + 7, y: b, z: 0 },
        ],
        [
          { x: fX, y: b, z: -7 },
          { x: fX, y: b, z: 7 },
        ],
      );
    }
    // Flame tip
    lines.push(
      [
        { x: fX, y: fTop, z: 0 },
        { x: fX - 6, y: fTop - 20, z: 0 },
      ],
      [
        { x: fX, y: fTop, z: 0 },
        { x: fX + 6, y: fTop - 20, z: 0 },
      ],
      [
        { x: fX, y: fTop, z: 0 },
        { x: fX, y: fTop - 28, z: 0 },
      ],
    );

    return lines;
  }, []);

  // --------------------------------------------------------------------------
  // MODEL 6: Sector 4 — Industrial Manufacturing CNC Lathe & Conveyor Line
  // Realistic: CNC lathe headstock/tailstock/bed, conveyor belt with rollers,
  // 6-DOF articulated robotic arm with gripper.
  // --------------------------------------------------------------------------
  const mfgModel = useMemo(() => {
    const lines: [Point3D, Point3D][] = [];

    // CNC Lathe bed (long rectangular box)
    const lw = 80,
      lh = 20,
      ld = 35;
    const ly = 20;
    // Bed outline
    lines.push(
      [
        { x: -lw, y: ly, z: -ld },
        { x: lw, y: ly, z: -ld },
      ],
      [
        { x: lw, y: ly, z: -ld },
        { x: lw, y: ly, z: ld },
      ],
      [
        { x: lw, y: ly, z: ld },
        { x: -lw, y: ly, z: ld },
      ],
      [
        { x: -lw, y: ly, z: ld },
        { x: -lw, y: ly, z: -ld },
      ],
      [
        { x: -lw, y: ly - lh, z: -ld },
        { x: lw, y: ly - lh, z: -ld },
      ],
      [
        { x: -lw, y: ly, z: -ld },
        { x: -lw, y: ly - lh, z: -ld },
      ],
      [
        { x: lw, y: ly, z: -ld },
        { x: lw, y: ly - lh, z: -ld },
      ],
    );
    // Headstock (left box)
    lines.push(
      [
        { x: -lw, y: ly - lh, z: -ld },
        { x: -lw, y: ly - lh - 35, z: -ld },
      ],
      [
        { x: -lw + 25, y: ly - lh, z: -ld },
        { x: -lw + 25, y: ly - lh - 35, z: -ld },
      ],
      [
        { x: -lw, y: ly - lh - 35, z: -ld },
        { x: -lw + 25, y: ly - lh - 35, z: -ld },
      ],
    );
    // Chuck (circle on headstock face)
    const chuckR = 14;
    for (let i = 0; i < 10; i++) {
      const a1 = (i / 10) * Math.PI * 2;
      const a2 = ((i + 1) / 10) * Math.PI * 2;
      lines.push([
        { x: -lw + 12, y: ly - lh - 18 + Math.cos(a1) * chuckR, z: Math.sin(a1) * chuckR },
        { x: -lw + 12, y: ly - lh - 18 + Math.cos(a2) * chuckR, z: Math.sin(a2) * chuckR },
      ]);
    }
    // Tailstock (right box)
    lines.push(
      [
        { x: lw - 18, y: ly - lh, z: -ld },
        { x: lw - 18, y: ly - lh - 25, z: -ld },
      ],
      [
        { x: lw, y: ly - lh, z: -ld },
        { x: lw, y: ly - lh - 25, z: -ld },
      ],
      [
        { x: lw - 18, y: ly - lh - 25, z: -ld },
        { x: lw, y: ly - lh - 25, z: -ld },
      ],
    );
    // Workpiece rod between headstock and tailstock
    lines.push([
      { x: -lw + 25, y: ly - lh - 18, z: -ld + 1 },
      { x: lw - 18, y: ly - lh - 18, z: -ld + 1 },
    ]);

    // Conveyor belt with rollers (below lathe)
    const convY = ly + 25;
    lines.push(
      [
        { x: -70, y: convY, z: 40 },
        { x: 70, y: convY, z: 40 },
      ],
      [
        { x: -70, y: convY, z: 55 },
        { x: 70, y: convY, z: 55 },
      ],
    );
    // Rollers
    for (let rx = -60; rx <= 60; rx += 20) {
      lines.push([
        { x: rx, y: convY, z: 40 },
        { x: rx, y: convY, z: 55 },
      ]);
    }
    // Conveyor legs
    lines.push(
      [
        { x: -60, y: convY, z: 47 },
        { x: -60, y: convY + 30, z: 47 },
      ],
      [
        { x: 60, y: convY, z: 47 },
        { x: 60, y: convY + 30, z: 47 },
      ],
    );

    // 6-DOF Robotic Arm (right side, near conveyor end)
    const armBase = { x: 65, y: convY, z: 25 };
    lines.push(
      [armBase, { x: 65, y: convY - 20, z: 25 }], // Base post
      [
        { x: 65, y: convY - 20, z: 25 },
        { x: 50, y: convY - 50, z: 20 },
      ], // Upper arm
      [
        { x: 50, y: convY - 50, z: 20 },
        { x: 35, y: convY - 35, z: 15 },
      ], // Forearm
      [
        { x: 35, y: convY - 35, z: 15 },
        { x: 30, y: convY - 42, z: 12 },
      ], // Gripper A
      [
        { x: 35, y: convY - 35, z: 15 },
        { x: 30, y: convY - 28, z: 12 },
      ], // Gripper B
    );

    return lines;
  }, []);

  // --------------------------------------------------------------------------
  // MODEL 7: Sector 5 — Maritime Port Ship-to-Shore (STS) Gantry Crane
  // Realistic: Portal frame gantry on rail, cantilever boom with backstay,
  // trolley hoist, spreader bar, suspended ISO container, wharf rail line.
  // --------------------------------------------------------------------------
  const portModel = useMemo(() => {
    const lines: [Point3D, Point3D][] = [];

    // Portal frame gantry legs (4 corners)
    const legW = 50,
      legD = 28;
    const btmY = 65,
      topY = -45;
    // Front legs
    lines.push(
      [
        { x: -legW, y: btmY, z: -legD },
        { x: -legW, y: topY, z: -legD },
      ],
      [
        { x: legW, y: btmY, z: -legD },
        { x: legW, y: topY, z: -legD },
      ],
    );
    // Rear legs (slightly splayed)
    lines.push(
      [
        { x: -legW - 8, y: btmY, z: legD },
        { x: -legW, y: topY, z: legD },
      ],
      [
        { x: legW + 8, y: btmY, z: legD },
        { x: legW, y: topY, z: legD },
      ],
    );
    // Top frame (4 edges)
    lines.push(
      [
        { x: -legW, y: topY, z: -legD },
        { x: legW, y: topY, z: -legD },
      ],
      [
        { x: legW, y: topY, z: -legD },
        { x: legW, y: topY, z: legD },
      ],
      [
        { x: legW, y: topY, z: legD },
        { x: -legW, y: topY, z: legD },
      ],
      [
        { x: -legW, y: topY, z: legD },
        { x: -legW, y: topY, z: -legD },
      ],
    );
    // Bottom rail sill beam
    lines.push(
      [
        { x: -legW - 12, y: btmY, z: -legD },
        { x: legW + 12, y: btmY, z: -legD },
      ],
      [
        { x: -legW - 12, y: btmY, z: legD },
        { x: legW + 12, y: btmY, z: legD },
      ],
    );

    // Cantilever boom (extends waterside)
    const boomEnd = -90;
    const boomBackEnd = 55;
    lines.push(
      [
        { x: boomEnd, y: topY - 5, z: 0 },
        { x: boomBackEnd, y: topY - 5, z: 0 },
      ],
      [
        { x: boomEnd, y: topY - 18, z: 0 },
        { x: boomBackEnd, y: topY - 18, z: 0 },
      ],
      [
        { x: boomEnd, y: topY - 5, z: 0 },
        { x: boomEnd, y: topY - 18, z: 0 },
      ],
      [
        { x: boomBackEnd, y: topY - 5, z: 0 },
        { x: boomBackEnd, y: topY - 18, z: 0 },
      ],
    );
    // Boom truss diagonals
    for (let tx = boomEnd + 15; tx < boomBackEnd; tx += 25) {
      lines.push([
        { x: tx, y: topY - 5, z: 0 },
        { x: tx + 12, y: topY - 18, z: 0 },
      ]);
    }
    // Backstay cable (from boom tip to forestay mast)
    lines.push(
      [
        { x: 0, y: topY - 30, z: 0 },
        { x: boomEnd + 5, y: topY - 5, z: 0 },
      ],
      [
        { x: 0, y: topY - 30, z: 0 },
        { x: boomBackEnd - 5, y: topY - 5, z: 0 },
      ],
      [
        { x: 0, y: topY, z: 0 },
        { x: 0, y: topY - 30, z: 0 },
      ],
    );

    // Hoist trolley & cables
    const trolleyX = -30;
    lines.push([
      { x: trolleyX - 6, y: topY - 18, z: 0 },
      { x: trolleyX + 6, y: topY - 18, z: 0 },
    ]);
    // Hoist cables to spreader
    const spreaderY = 20;
    lines.push(
      [
        { x: trolleyX - 4, y: topY - 18, z: 0 },
        { x: trolleyX - 10, y: spreaderY, z: 0 },
      ],
      [
        { x: trolleyX + 4, y: topY - 18, z: 0 },
        { x: trolleyX + 10, y: spreaderY, z: 0 },
      ],
    );
    // Spreader bar
    lines.push([
      { x: trolleyX - 16, y: spreaderY, z: 0 },
      { x: trolleyX + 16, y: spreaderY, z: 0 },
    ]);
    // ISO container box (3D)
    const bx = trolleyX,
      bw = 16,
      bh = 12,
      bd = 10;
    lines.push(
      [
        { x: bx - bw, y: spreaderY + 2, z: -bd },
        { x: bx + bw, y: spreaderY + 2, z: -bd },
      ],
      [
        { x: bx + bw, y: spreaderY + 2, z: -bd },
        { x: bx + bw, y: spreaderY + 2 + bh, z: -bd },
      ],
      [
        { x: bx + bw, y: spreaderY + 2 + bh, z: -bd },
        { x: bx - bw, y: spreaderY + 2 + bh, z: -bd },
      ],
      [
        { x: bx - bw, y: spreaderY + 2 + bh, z: -bd },
        { x: bx - bw, y: spreaderY + 2, z: -bd },
      ],
      [
        { x: bx - bw, y: spreaderY + 2, z: bd },
        { x: bx + bw, y: spreaderY + 2, z: bd },
      ],
      [
        { x: bx + bw, y: spreaderY + 2, z: bd },
        { x: bx + bw, y: spreaderY + 2 + bh, z: bd },
      ],
      [
        { x: bx - bw, y: spreaderY + 2, z: -bd },
        { x: bx - bw, y: spreaderY + 2, z: bd },
      ],
      [
        { x: bx + bw, y: spreaderY + 2, z: -bd },
        { x: bx + bw, y: spreaderY + 2, z: bd },
      ],
    );

    return lines;
  }, []);

  // --------------------------------------------------------------------------
  // MODEL 8: Sector 6 — Smart Facility BMS & Rooftop Chiller Plant
  // Realistic: Multi-story building with window grid, penthouse mechanical room,
  // rooftop chiller unit with condenser coils, cooling tower, ductwork.
  // --------------------------------------------------------------------------
  const buildingModel = useMemo(() => {
    const lines: [Point3D, Point3D][] = [];

    const w = 50,
      h = 110,
      d = 45;
    const baseY = 60;

    // Building wireframe box
    // 4 vertical columns
    lines.push(
      [
        { x: -w, y: baseY, z: -d },
        { x: -w, y: baseY - h, z: -d },
      ],
      [
        { x: w, y: baseY, z: -d },
        { x: w, y: baseY - h, z: -d },
      ],
      [
        { x: w, y: baseY, z: d },
        { x: w, y: baseY - h, z: d },
      ],
      [
        { x: -w, y: baseY, z: d },
        { x: -w, y: baseY - h, z: d },
      ],
    );
    // Floor slabs (every 22px)
    for (let f = baseY; f >= baseY - h; f -= 22) {
      lines.push(
        [
          { x: -w, y: f, z: -d },
          { x: w, y: f, z: -d },
        ],
        [
          { x: w, y: f, z: -d },
          { x: w, y: f, z: d },
        ],
        [
          { x: w, y: f, z: d },
          { x: -w, y: f, z: d },
        ],
        [
          { x: -w, y: f, z: d },
          { x: -w, y: f, z: -d },
        ],
      );
    }
    // Window mullions (vertical lines on front face)
    for (let wx = -w + 20; wx < w; wx += 20) {
      lines.push([
        { x: wx, y: baseY, z: -d },
        { x: wx, y: baseY - h, z: -d },
      ]);
    }

    // Penthouse mechanical room (small box on roof)
    const roofY = baseY - h;
    const pw = 25,
      ph = 16,
      pd = 20;
    lines.push(
      [
        { x: -pw, y: roofY, z: -pd },
        { x: pw, y: roofY, z: -pd },
      ],
      [
        { x: pw, y: roofY, z: -pd },
        { x: pw, y: roofY - ph, z: -pd },
      ],
      [
        { x: pw, y: roofY - ph, z: -pd },
        { x: -pw, y: roofY - ph, z: -pd },
      ],
      [
        { x: -pw, y: roofY - ph, z: -pd },
        { x: -pw, y: roofY, z: -pd },
      ],
      [
        { x: -pw, y: roofY, z: pd },
        { x: pw, y: roofY, z: pd },
      ],
      [
        { x: pw, y: roofY, z: pd },
        { x: pw, y: roofY - ph, z: pd },
      ],
      [
        { x: -pw, y: roofY, z: -pd },
        { x: -pw, y: roofY, z: pd },
      ],
      [
        { x: pw, y: roofY, z: -pd },
        { x: pw, y: roofY, z: pd },
      ],
      [
        { x: -pw, y: roofY - ph, z: -pd },
        { x: -pw, y: roofY - ph, z: pd },
      ],
      [
        { x: pw, y: roofY - ph, z: -pd },
        { x: pw, y: roofY - ph, z: pd },
      ],
    );

    // Rooftop cooling tower (cylindrical, offset right)
    const ctX = 35,
      ctR = 14;
    for (let i = 0; i < 10; i++) {
      const a1 = (i / 10) * Math.PI * 2;
      const a2 = ((i + 1) / 10) * Math.PI * 2;
      lines.push(
        [
          { x: ctX + Math.cos(a1) * ctR, y: roofY, z: Math.sin(a1) * ctR },
          { x: ctX + Math.cos(a2) * ctR, y: roofY, z: Math.sin(a2) * ctR },
        ],
        [
          { x: ctX + Math.cos(a1) * ctR, y: roofY - 20, z: Math.sin(a1) * ctR },
          { x: ctX + Math.cos(a2) * ctR, y: roofY - 20, z: Math.sin(a2) * ctR },
        ],
      );
      if (i % 2 === 0) {
        lines.push([
          { x: ctX + Math.cos(a1) * ctR, y: roofY, z: Math.sin(a1) * ctR },
          { x: ctX + Math.cos(a1) * ctR, y: roofY - 20, z: Math.sin(a1) * ctR },
        ]);
      }
    }
    // Fan on top of cooling tower
    lines.push(
      [
        { x: ctX - ctR, y: roofY - 20, z: 0 },
        { x: ctX + ctR, y: roofY - 20, z: 0 },
      ],
      [
        { x: ctX, y: roofY - 20, z: -ctR },
        { x: ctX, y: roofY - 20, z: ctR },
      ],
    );

    // Ductwork from penthouse to cooling tower
    lines.push([
      { x: pw, y: roofY - ph / 2, z: 0 },
      { x: ctX - ctR, y: roofY - 10, z: 0 },
    ]);

    return lines;
  }, []);

  // --------------------------------------------------------------------------
  // MODEL 9: Sector 7 — Smart City Power Distribution Pylon & Catenary
  // Realistic: High-voltage lattice transmission tower (A-frame with cross arms),
  // catenary wires stretching to smaller distribution poles, transformer on pole.
  // --------------------------------------------------------------------------
  const cityModel = useMemo(() => {
    const lines: [Point3D, Point3D][] = [];

    // Main HV lattice tower (center) — A-frame silhouette
    const tBase = 50;
    const tTop = -80;
    // Four legs tapering inward
    lines.push(
      [
        { x: -22, y: tBase, z: -22 },
        { x: -6, y: tTop, z: -6 },
      ],
      [
        { x: 22, y: tBase, z: -22 },
        { x: 6, y: tTop, z: -6 },
      ],
      [
        { x: -22, y: tBase, z: 22 },
        { x: -6, y: tTop, z: 6 },
      ],
      [
        { x: 22, y: tBase, z: 22 },
        { x: 6, y: tTop, z: 6 },
      ],
    );
    // Horizontal lattice braces
    for (let b = tBase - 18; b > tTop + 10; b -= 22) {
      const t = (tBase - b) / (tBase - tTop);
      const bw = 22 - t * 16;
      lines.push(
        [
          { x: -bw, y: b, z: -bw },
          { x: bw, y: b, z: -bw },
        ],
        [
          { x: bw, y: b, z: -bw },
          { x: bw, y: b, z: bw },
        ],
        [
          { x: bw, y: b, z: bw },
          { x: -bw, y: b, z: bw },
        ],
        [
          { x: -bw, y: b, z: bw },
          { x: -bw, y: b, z: -bw },
        ],
      );
    }
    // Top cross-arms (3 tiers for 3 phase)
    for (const armY of [tTop, tTop + 16, tTop + 32]) {
      const armLen = armY === tTop ? 45 : armY === tTop + 16 ? 38 : 30;
      lines.push([
        { x: -armLen, y: armY, z: 0 },
        { x: armLen, y: armY, z: 0 },
      ]);
      // Insulator strings at arm tips
      lines.push(
        [
          { x: -armLen, y: armY, z: 0 },
          { x: -armLen, y: armY + 8, z: 0 },
        ],
        [
          { x: armLen, y: armY, z: 0 },
          { x: armLen, y: armY + 8, z: 0 },
        ],
      );
    }
    // Peak finial
    lines.push([
      { x: 0, y: tTop, z: 0 },
      { x: 0, y: tTop - 12, z: 0 },
    ]);

    // Distribution pole (right, smaller)
    const poleX = 80;
    lines.push(
      [
        { x: poleX, y: tBase, z: 0 },
        { x: poleX, y: tTop + 30, z: 0 },
      ],
      [
        { x: poleX - 20, y: tTop + 30, z: 0 },
        { x: poleX + 20, y: tTop + 30, z: 0 },
      ],
      [
        { x: poleX - 15, y: tTop + 42, z: 0 },
        { x: poleX + 15, y: tTop + 42, z: 0 },
      ],
    );
    // Distribution pole (left, smaller)
    const pole2X = -80;
    lines.push(
      [
        { x: pole2X, y: tBase, z: 0 },
        { x: pole2X, y: tTop + 30, z: 0 },
      ],
      [
        { x: pole2X - 20, y: tTop + 30, z: 0 },
        { x: pole2X + 20, y: tTop + 30, z: 0 },
      ],
      [
        { x: pole2X - 15, y: tTop + 42, z: 0 },
        { x: pole2X + 15, y: tTop + 42, z: 0 },
      ],
    );

    // Catenary wires (sag between tower and poles)
    for (const wireY of [tTop + 8, tTop + 24]) {
      // Right catenary
      const sagR = 12;
      lines.push(
        [
          { x: 45, y: wireY, z: 0 },
          { x: 62, y: wireY + sagR, z: 0 },
        ],
        [
          { x: 62, y: wireY + sagR, z: 0 },
          { x: poleX, y: wireY + 2, z: 0 },
        ],
      );
      // Left catenary
      lines.push(
        [
          { x: -45, y: wireY, z: 0 },
          { x: -62, y: wireY + sagR, z: 0 },
        ],
        [
          { x: -62, y: wireY + sagR, z: 0 },
          { x: pole2X, y: wireY + 2, z: 0 },
        ],
      );
    }

    // Pole-mount transformer (barrel on right pole)
    lines.push(
      [
        { x: poleX - 6, y: tTop + 48, z: -5 },
        { x: poleX + 6, y: tTop + 48, z: -5 },
      ],
      [
        { x: poleX + 6, y: tTop + 48, z: -5 },
        { x: poleX + 6, y: tTop + 60, z: -5 },
      ],
      [
        { x: poleX + 6, y: tTop + 60, z: -5 },
        { x: poleX - 6, y: tTop + 60, z: -5 },
      ],
      [
        { x: poleX - 6, y: tTop + 60, z: -5 },
        { x: poleX - 6, y: tTop + 48, z: -5 },
      ],
    );

    return lines;
  }, []);

  // Mouse & Touch Drag Trackball Handlers (ZERO hover overhead)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseStateRef.current = {
      isDown: true,
      lastX: e.clientX,
      lastY: e.clientY,
    };
    dragDistanceRef.current = 0;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!mouseStateRef.current.isDown) return;
    const deltaX = e.clientX - mouseStateRef.current.lastX;
    const deltaY = e.clientY - mouseStateRef.current.lastY;
    dragDistanceRef.current += Math.hypot(deltaX, deltaY);

    rotationRef.current.y += deltaX * 0.008;
    rotationRef.current.x += deltaY * 0.008;

    mouseStateRef.current.lastX = e.clientX;
    mouseStateRef.current.lastY = e.clientY;
  }, []);

  const handleMouseUp = useCallback(() => {
    mouseStateRef.current.isDown = false;
  }, []);

  // React on clean click: immediately switch to next sector with rotational impulse
  const handleClick = useCallback(() => {
    if (dragDistanceRef.current < 6) {
      setMode((prev) => {
        const idx = ALL_SECTORS.findIndex((s) => s.id === prev);
        const nextIdx = (idx + 1) % ALL_SECTORS.length;
        return ALL_SECTORS[nextIdx].id;
      });
      rotationRef.current.y += 0.35;
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      mouseStateRef.current = {
        isDown: true,
        lastX: e.touches[0].clientX,
        lastY: e.touches[0].clientY,
      };
      dragDistanceRef.current = 0;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!mouseStateRef.current.isDown || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - mouseStateRef.current.lastX;
    const deltaY = e.touches[0].clientY - mouseStateRef.current.lastY;
    dragDistanceRef.current += Math.hypot(deltaX, deltaY);

    rotationRef.current.y += deltaX * 0.008;
    rotationRef.current.x += deltaY * 0.008;

    mouseStateRef.current.lastX = e.touches[0].clientX;
    mouseStateRef.current.lastY = e.touches[0].clientY;
  }, []);

  // --------------------------------------------------------------------------
  // Main Canvas Render Loop (60 FPS, High Contrast & Colorful Characters)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const render = (now: number) => {
      animId = requestAnimationFrame(render);

      const dt = now - lastTime;
      if (dt < 22) return;
      lastTime = now;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Gentle auto-orbiting when user is not dragging
      if (!mouseStateRef.current.isDown) {
        rotationRef.current.y += mode === "laptop" ? 0.004 : 0.006;
      }

      const rotX = rotationRef.current.x;
      const rotY = rotationRef.current.y;

      // Clear Canvas (100% transparent blend with background)
      ctx.clearRect(0, 0, width, height);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const currentMeta = ALL_SECTORS.find((s) => s.id === mode) || ALL_SECTORS[0];

      // ======================================================================
      // 1. RENDER GLOBE
      // ======================================================================
      if (mode === "globe") {
        ctx.font = '11px "JetBrains Mono", monospace';

        globePoints.forEach((p) => {
          const r = rotatePoint(p, rotX, rotY);
          const scale = 400 / (400 + r.z);
          const screenX = centerX + r.x * scale;
          const screenY = centerY + r.y * scale;

          if (r.z > 0) {
            ctx.fillStyle = "rgba(100, 116, 139, 0.35)";
            ctx.fillText("·", screenX, screenY);
          } else {
            const normZ = -r.z / 145;
            const charIdx = Math.min(
              ASCII_RAMP.length - 1,
              Math.floor(normZ * (ASCII_RAMP.length - 1)),
            );
            const char = ASCII_RAMP[charIdx] || "+";

            if (normZ > 0.72) {
              ctx.fillStyle = "#bfff2e";
            } else if (normZ > 0.42) {
              ctx.fillStyle = "#ffffff";
            } else {
              ctx.fillStyle = "rgba(148, 163, 184, 0.65)";
            }
            ctx.fillText(char, screenX, screenY);
          }
        });

        // Country target nodes
        const radius = 145;
        COUNTRY_NODES.forEach((node) => {
          const p = latLonToPoint3D(node.lat, node.lon, radius);
          const r = rotatePoint(p, rotX, rotY);

          if (r.z < 25) {
            const scale = 400 / (400 + r.z);
            const sx = centerX + r.x * scale;
            const sy = centerY + r.y * scale;

            ctx.fillStyle = "#bfff2e";
            ctx.fillText("■", sx, sy);

            ctx.font = '9px "JetBrains Mono", monospace';
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.fillText(node.id, sx + 14, sy - 2);
            ctx.font = '11px "JetBrains Mono", monospace';
          }
        });

        // Ballistic attack arcs
        activeAttacksRef.current.forEach((arc) => {
          arc.progress += arc.speed;
          if (arc.progress > 1) {
            arc.progress = 0;
            const next = ATTACK_POOL[Math.floor(Math.random() * ATTACK_POOL.length)];
            const getSrc = COUNTRY_NODES.find((n) => n.id === next.src) || COUNTRY_NODES[0];
            const getTgt = COUNTRY_NODES.find((n) => n.id === next.tgt) || COUNTRY_NODES[1];
            arc.source = getSrc;
            arc.target = getTgt;
            arc.color = next.color;
          }

          const p1 = latLonToPoint3D(arc.source.lat, arc.source.lon, radius);
          const p2 = latLonToPoint3D(arc.target.lat, arc.target.lon, radius);

          const arcSteps = 16;
          for (let step = 0; step <= arcSteps; step++) {
            const t = step / arcSteps;
            const ix = p1.x * (1 - t) + p2.x * t;
            const iy = p1.y * (1 - t) + p2.y * t;
            const iz = p1.z * (1 - t) + p2.z * t;
            const len = Math.sqrt(ix * ix + iy * iy + iz * iz) || 1;

            const apexLift = Math.sin(t * Math.PI) * 60;
            const arcR = radius + apexLift;

            const pt: Point3D = {
              x: (ix / len) * arcR,
              y: (iy / len) * arcR,
              z: (iz / len) * arcR,
            };

            const rPt = rotatePoint(pt, rotX, rotY);
            if (rPt.z < 65) {
              const scale = 400 / (400 + rPt.z);
              const sx = centerX + rPt.x * scale;
              const sy = centerY + rPt.y * scale;

              const isPulse = Math.abs(t - arc.progress) < 0.1;
              if (isPulse) {
                ctx.fillStyle = arc.color;
                ctx.fillText("@", sx, sy);
              } else if (t < arc.progress) {
                ctx.fillStyle = "rgba(191, 255, 46, 0.55)";
                ctx.fillText("=", sx, sy);
              } else {
                ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
                ctx.fillText("-", sx, sy);
              }
            }
          }

          if (arc.progress > 0.85) {
            const rTgt = rotatePoint(p2, rotX, rotY);
            if (rTgt.z < 40) {
              const scale = 400 / (400 + rTgt.z);
              const sx = centerX + rTgt.x * scale;
              const sy = centerY + rTgt.y * scale;
              const ringR = (arc.progress - 0.85) * 85;

              ctx.strokeStyle = arc.color;
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.arc(sx, sy, ringR, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        });
      }

      // ======================================================================
      // 2. RENDER LAPTOP
      // ======================================================================
      else if (mode === "laptop") {
        ctx.font = '11px "JetBrains Mono", monospace';
        const laptopScale = 1.25;

        laptopModel.lines.forEach(([p1, p2]) => {
          const r1 = rotatePoint(
            { x: p1.x * laptopScale, y: p1.y * laptopScale, z: p1.z * laptopScale },
            rotX,
            rotY,
          );
          const r2 = rotatePoint(
            { x: p2.x * laptopScale, y: p2.y * laptopScale, z: p2.z * laptopScale },
            rotX,
            rotY,
          );

          const scale1 = 450 / (450 + r1.z);
          const scale2 = 450 / (450 + r2.z);

          const x1 = centerX + r1.x * scale1;
          const y1 = centerY + r1.y * scale1;
          const x2 = centerX + r2.x * scale2;
          const y2 = centerY + r2.y * scale2;

          ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          const dist = Math.hypot(x2 - x1, y2 - y1);
          const steps = Math.max(3, Math.floor(dist / 14));
          for (let s = 0; s <= steps; s++) {
            const px = x1 + ((x2 - x1) * s) / steps;
            const py = y1 + ((y2 - y1) * s) / steps;
            ctx.fillStyle = s % 2 === 0 ? "#bfff2e" : "#ffffff";
            ctx.fillText(s % 2 === 0 ? "#" : "+", px, py);
          }
        });

        laptopModel.screenGlyphs.forEach((sg) => {
          const r = rotatePoint(
            { x: sg.p.x * laptopScale, y: sg.p.y * laptopScale, z: sg.p.z * laptopScale },
            rotX,
            rotY,
          );

          if (r.z < 85) {
            const scale = 450 / (450 + r.z);
            const sx = centerX + r.x * scale;
            const sy = centerY + r.y * scale;

            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillStyle = sg.color;
            ctx.fillText(sg.char, sx, sy);
          }
        });
      }

      // ======================================================================
      // 3. RENDER ALL SECTORS
      // ======================================================================
      else {
        ctx.font = '11px "JetBrains Mono", monospace';
        const sectorScale = 1.35;

        let activeLines: [Point3D, Point3D][] = powerModel;
        let strokeColor = "rgba(191, 255, 46, 0.55)";
        let primaryChar = "O";
        let secondaryChar = "*";

        if (mode === "water") {
          activeLines = waterModel;
          strokeColor = "rgba(0, 240, 255, 0.55)";
          primaryChar = "#";
          secondaryChar = "+";
        } else if (mode === "oil-gas") {
          activeLines = oilGasModel;
          strokeColor = "rgba(255, 165, 0, 0.55)";
          primaryChar = "=";
          secondaryChar = "#";
        } else if (mode === "manufacturing") {
          activeLines = mfgModel;
          strokeColor = "rgba(191, 255, 46, 0.55)";
          primaryChar = "@";
          secondaryChar = "*";
        } else if (mode === "port") {
          activeLines = portModel;
          strokeColor = "rgba(0, 240, 255, 0.55)";
          primaryChar = "[";
          secondaryChar = "]";
        } else if (mode === "smart-building") {
          activeLines = buildingModel;
          strokeColor = "rgba(255, 255, 255, 0.55)";
          primaryChar = "#";
          secondaryChar = "+";
        } else if (mode === "smart-city") {
          activeLines = cityModel;
          strokeColor = "rgba(191, 255, 46, 0.55)";
          primaryChar = "O";
          secondaryChar = "=";
        }

        activeLines.forEach(([p1, p2]) => {
          const r1 = rotatePoint(
            { x: p1.x * sectorScale, y: p1.y * sectorScale, z: p1.z * sectorScale },
            rotX,
            rotY,
          );
          const r2 = rotatePoint(
            { x: p2.x * sectorScale, y: p2.y * sectorScale, z: p2.z * sectorScale },
            rotX,
            rotY,
          );

          const scale1 = 450 / (450 + r1.z);
          const scale2 = 450 / (450 + r2.z);

          const x1 = centerX + r1.x * scale1;
          const y1 = centerY + r1.y * scale1;
          const x2 = centerX + r2.x * scale2;
          const y2 = centerY + r2.y * scale2;

          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          const dist = Math.hypot(x2 - x1, y2 - y1);
          const steps = Math.max(3, Math.floor(dist / 16));
          for (let s = 0; s <= steps; s++) {
            const px = x1 + ((x2 - x1) * s) / steps;
            const py = y1 + ((y2 - y1) * s) / steps;
            ctx.fillStyle = s % 3 === 0 ? "#bfff2e" : "#ffffff";
            ctx.fillText(s % 3 === 0 ? primaryChar : secondaryChar, px, py);
          }
        });
      }

      // Dynamic floating telemetry labels (Bigger & more prominent)
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillStyle = "#bfff2e";
      ctx.fillText(currentMeta.label, centerX, centerY - 150);
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fillText(`${currentMeta.telemetryA} · ${currentMeta.telemetryB}`, centerX, centerY + 155);
    };

    animId = requestAnimationFrame(render);

    const handleResize = () => {
      const container = containerRef.current;
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [
    mode,
    globePoints,
    laptopModel,
    powerModel,
    waterModel,
    oilGasModel,
    mfgModel,
    portModel,
    buildingModel,
    cityModel,
  ]);

  // Pure Borderless Floating 3D ASCII Canvas (Matching exact place and size of Image 1)
  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[420px] sm:h-[480px] lg:h-[540px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-hidden ${className}`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* 100% Transparent High-Definition 3D ASCII Canvas (NO borders, NO boxes, NO cards) */}
      <canvas ref={canvasRef} className="w-full h-full object-contain pointer-events-auto" />
    </div>
  );
}
