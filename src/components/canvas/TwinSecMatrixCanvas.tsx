/**
 * TwinSecMatrixCanvas.tsx
 *
 * High-Definition 3D ASCII Cyber-Physical Industrial Simulation Twin Canvas.
 * Spans vertically from top to bottom of the main Hero title block ("ATTACKS" to "DIGITAL.").
 * Features 5 morphing 3D models including the Cyberdeck RPI-Dev Laptop, Substation Turbine Core,
 * Water Dosing Tank, Manufacturing Centrifuge, and Oil & Gas Pipeline.
 *
 * Renders on a 100% transparent background with crisp phosphor white & acid lime ASCII characters.
 */

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface TwinSecMatrixCanvasProps {
  className?: string;
  autoRotate?: boolean;
}

// High-definition ASCII character density ramp
const ASCII_RAMP = " .:-=+*#%@";

const SECTORS = [
  { id: "cyberdeck", name: "CYBERDECK RPI-DEV // HARDWARE NODE" },
  { id: "globe", name: "GLOBAL KINETIC THREAT MATRIX // NORAD ARCS" },
  { id: "power", name: "POWER GRID // SUBSTATION IEC-104 & DNP3" },
  { id: "water", name: "MUNICIPAL WATER // MODBUS-TCP REFINERY" },
  { id: "manufacturing", name: "MANUFACTURING // SIEMENS S7-300 CENTRIFUGE" },
  { id: "oil-gas", name: "OIL & GAS // PIPELINE TRITON SIS TRICONEX" },
] as const;

export const TwinSecMatrixCanvas: React.FC<TwinSecMatrixCanvasProps> = ({
  className = "",
  autoRotate = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setCurrentSectorIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 750;

    // Optimized cell size for crisp ASCII detail with fast rendering performance
    const cellSize = 6.5;
    const cameraZ = 12.0;

    // 1. Offscreen 3D Three.js Scene (Transparent Background)
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0.4, cameraZ);

    const webglRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    webglRenderer.setClearColor(0x000000, 0); // 100% Transparent background

    const offCols = Math.floor(width / cellSize);
    const offRows = Math.floor(height / cellSize);
    webglRenderer.setSize(offCols, offRows);

    // Lighting Setup for High Contrast Shading
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
    keyLight.position.set(7, 14, 9);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbfff2e, 2.8);
    fillLight.position.set(-7, -4, -7);
    scene.add(fillLight);

    // 2. Build 3D Cyber-Physical Simulation Twin Group
    const twinGroup = new THREE.Group();

    // A. Sector 0: CYBERDECK RPI-DEV LAPTOP MODEL
    const cyberdeckGroup = new THREE.Group();

    // Laptop Base Chassis
    const baseGeo = new THREE.BoxGeometry(4.2, 0.3, 3.0);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    cyberdeckGroup.add(baseMesh);

    // Keyboard Keycaps
    const keyGeo = new THREE.BoxGeometry(0.24, 0.09, 0.24);
    const keyMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    for (let r = -0.9; r <= 0.7; r += 0.32) {
      for (let c = -1.7; c <= 1.7; c += 0.32) {
        const k = new THREE.Mesh(keyGeo, keyMat);
        k.position.set(c, 0.18, r);
        cyberdeckGroup.add(k);
      }
    }

    // Trackpad
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.02, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa }),
    );
    pad.position.set(0, 0.16, 1.1);
    cyberdeckGroup.add(pad);

    // Angled Lid Screen
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 0.15, -1.45);
    const screenFrame = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 2.8, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }),
    );
    screenFrame.position.set(0, 1.4, 0);
    lidGroup.add(screenFrame);

    const displayGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(3.8, 2.4),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    displayGlass.position.set(0, 1.4, 0.1);
    lidGroup.add(displayGlass);

    lidGroup.rotation.x = -THREE.MathUtils.degToRad(22);
    cyberdeckGroup.add(lidGroup);
    twinGroup.add(cyberdeckGroup);

    // B. Sector 1: POWER GRID TURBINE CORE MODEL
    const powerGroup = new THREE.Group();
    const towerGeo = new THREE.CylinderGeometry(1.8, 2.4, 3.8, 18, 1, true);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true });
    const towerMesh = new THREE.Mesh(towerGeo, towerMat);
    powerGroup.add(towerMesh);

    const rotorGeo = new THREE.TorusGeometry(1.5, 0.25, 14, 28);
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const rotorMesh1 = new THREE.Mesh(rotorGeo, rotorMat);
    rotorMesh1.rotation.x = Math.PI / 2;
    rotorMesh1.position.y = 0.5;
    powerGroup.add(rotorMesh1);

    const genMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.0, 2),
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
    );
    powerGroup.add(genMesh);
    powerGroup.visible = false;
    twinGroup.add(powerGroup);

    // C. Sector 2: WATER REFINERY DOSING TANK MODEL
    const waterGroup = new THREE.Group();
    const tankMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 3.6, 20),
      new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true }),
    );
    waterGroup.add(tankMesh);

    const pipeMesh = new THREE.Mesh(
      new THREE.TorusGeometry(1.8, 0.22, 14, 28),
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
    );
    pipeMesh.position.y = 0.3;
    waterGroup.add(pipeMesh);
    waterGroup.visible = false;
    twinGroup.add(waterGroup);

    // D. Sector 3: MANUFACTURING CENTRIFUGE MODEL
    const mfgGroup = new THREE.Group();
    const centMesh = new THREE.Mesh(
      new THREE.ConeGeometry(2.1, 3.8, 14, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true }),
    );
    centMesh.rotation.x = Math.PI;
    mfgGroup.add(centMesh);

    const discMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 0.35, 18),
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
    );
    discMesh.position.y = 0.6;
    mfgGroup.add(discMesh);
    mfgGroup.visible = false;
    twinGroup.add(mfgGroup);

    // E. Sector 4: OIL & GAS PIPELINE ASSEMBLY MODEL
    const oilGroup = new THREE.Group();
    const mainPipeMesh = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.4, 16, 36),
      new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true }),
    );
    oilGroup.add(mainPipeMesh);

    const flareMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 1.1, 3.0, 14),
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
    );
    oilGroup.add(flareMesh);
    oilGroup.visible = false;
    twinGroup.add(oilGroup);

    // F. Sector 5: GLOBAL KINETIC THREAT MATRIX MODEL (Movie-style Attack Globe)
    const globeGroup = new THREE.Group();
    const globeGeo = new THREE.SphereGeometry(2.3, 18, 14);
    const globeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      wireframe: true,
      roughness: 0.4,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    [-1.2, 0, 1.2].forEach((y) => {
      const r = Math.sqrt(Math.max(0.1, 2.3 * 2.3 - y * y));
      const ringGeo = new THREE.TorusGeometry(r, 0.05, 8, 32);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      globeGroup.add(ring);
    });

    const targets = [
      { lat: 0.7, lon: -1.3 }, // US
      { lat: 0.9, lon: 0.1 }, // UK/EU
      { lat: 0.9, lon: 0.6 }, // UKR
      { lat: 0.6, lon: 1.0 }, // IRN
      { lat: 0.4, lon: 2.1 }, // ASIA/TWN
      { lat: -0.6, lon: 2.6 }, // AUS
    ];
    const targetPoints = targets.map((t) => {
      const r = 2.3;
      const x = r * Math.cos(t.lat) * Math.sin(t.lon);
      const y = r * Math.sin(t.lat);
      const z = r * Math.cos(t.lat) * Math.cos(t.lon);
      const nodeMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.24, 0.24),
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
      );
      nodeMesh.position.set(x, y, z);
      globeGroup.add(nodeMesh);
      return new THREE.Vector3(x, y, z);
    });

    const arcPairs = [
      [targetPoints[2], targetPoints[1]], // UKR -> UK
      [targetPoints[3], targetPoints[0]], // IRN -> US
      [targetPoints[4], targetPoints[0]], // ASIA -> US
      [targetPoints[1], targetPoints[2]], // UK -> UKR
    ];
    arcPairs.forEach(([p1, p2]) => {
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      if (mid.length() > 0.01) {
        mid.normalize().multiplyScalar(3.4);
      }
      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.06, 6, false);
      const tubeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const arcMesh = new THREE.Mesh(tubeGeo, tubeMat);
      globeGroup.add(arcMesh);
    });

    globeGroup.visible = false;
    twinGroup.add(globeGroup);

    const sectorGroups = [cyberdeckGroup, globeGroup, powerGroup, waterGroup, mfgGroup, oilGroup];

    twinGroup.position.set(0, -0.2, 0);
    twinGroup.scale.set(1.0, 1.0, 1.0);
    twinGroup.rotation.x = THREE.MathUtils.degToRad(18);
    twinGroup.rotation.y = THREE.MathUtils.degToRad(20);
    scene.add(twinGroup);

    // 3. Setup Main 2D Canvas Context (100% Transparent)
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Mouse Drag Trackball State
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;

      twinGroup.rotation.y += deltaX * 0.008;
      twinGroup.rotation.x += deltaY * 0.008;

      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // 6-Second Sector Morphing Timer (Pauses during user interaction)
    let sectorIdx = 0;
    const sectorInterval = setInterval(() => {
      if (isDragging) return; // Pause morphing while user is actively interacting

      sectorIdx = (sectorIdx + 1) % SECTORS.length;
      setCurrentSectorIndex(sectorIdx);

      sectorGroups.forEach((g, idx) => {
        g.visible = idx === sectorIdx;
      });
    }, 6000);

    // Offscreen Pixel Reader Buffer (reusable array to avoid GC allocations)
    const offCanvas = webglRenderer.domElement;
    const glCtx = offCanvas.getContext("webgl2") || offCanvas.getContext("webgl");
    const pixels = new Uint8Array(offCols * offRows * 4);
    let animId: number;
    let time = 0;
    let lastRenderTime = 0;

    // Render Animation Loop
    const render = (now: number) => {
      animId = requestAnimationFrame(render);

      // Skip background rendering if tab is hidden or throttled to ~30fps for CPU efficiency
      if (document.hidden || now - lastRenderTime < 30) return;
      lastRenderTime = now;

      time += 0.018;

      if (autoRotate && !isDragging) {
        twinGroup.rotation.y += 0.005;
        genMesh.rotation.y -= 0.015;
        twinGroup.position.y = -0.1 + Math.sin(time * 1.4) * 0.14;

        if (globeGroup.visible) {
          globeGroup.rotation.y += 0.008;
        }
      }

      webglRenderer.render(scene, camera);

      if (glCtx) {
        (glCtx as WebGLRenderingContext).readPixels(
          0,
          0,
          offCols,
          offRows,
          glCtx.RGBA,
          glCtx.UNSIGNED_BYTE,
          pixels,
        );
      }

      // Clear main 2D canvas with transparency (no black box!)
      ctx.clearRect(0, 0, width, height);
      ctx.font = `${cellSize * 1.12}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const numChars = ASCII_RAMP.length;
      const cellW = width / offCols;
      const cellH = height / offRows;

      for (let r = 0; r < offRows; r++) {
        for (let c = 0; c < offCols; c++) {
          const yIndex = offRows - 1 - r;
          const pixelIndex = (yIndex * offCols + c) * 4;

          const rVal = pixels[pixelIndex];
          const gVal = pixels[pixelIndex + 1];
          const bVal = pixels[pixelIndex + 2];
          const alphaVal = pixels[pixelIndex + 3];

          if (alphaVal < 10) continue;

          let brightness = (0.299 * rVal + 0.587 * gVal + 0.114 * bVal) / 255;
          brightness = Math.max(0, Math.min(1, brightness));

          if (brightness > 0.05) {
            const charIdx = Math.floor(brightness * (numChars - 1));
            const char = ASCII_RAMP[charIdx];
            const posX = c * cellW + cellW / 2;
            const posY = r * cellH + cellH / 2;

            if (brightness > 0.72) {
              ctx.fillStyle = "#BFFF2E"; // Acid Lime peaks
            } else {
              ctx.fillStyle = "#FFFFFF"; // Crisp Phosphor White
            }

            ctx.fillText(char, posX, posY);
          }
        }
      }
    };

    animId = requestAnimationFrame(render);

    const handleResize = () => {
      const newW = container.clientWidth || 600;
      const newH = container.clientHeight || 750;

      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();

      const newCols = Math.floor(newW / cellSize);
      const newRows = Math.floor(newH / cellSize);
      webglRenderer.setSize(newCols, newRows);

      canvas.width = newW;
      canvas.height = newH;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(sectorInterval);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", handleResize);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });

      webglRenderer.dispose();
    };
  }, [autoRotate]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[420px] sm:h-[480px] lg:h-[540px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-hidden ${className}`}
    >
      {/* Pure 100% Transparent High-Definition 3D ASCII Canvas */}
      <canvas ref={canvasRef} className="w-full h-full object-contain pointer-events-auto" />
    </div>
  );
};
