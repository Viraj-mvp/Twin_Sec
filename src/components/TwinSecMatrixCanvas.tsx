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

    const sectorGroups = [cyberdeckGroup, powerGroup, waterGroup, mfgGroup, oilGroup];

    // F. Orbital SCADA Node Ring with UNIQUE Node Geometries
    const nodeRingGroup = new THREE.Group();
    const ringRadius = 3.6;

    // Node 0: PLC Microchip with Pin Headers
    const plcChipGroup = new THREE.Group();
    plcChipGroup.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.25, 0.7),
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
      ),
    );
    for (let p = -0.25; p <= 0.25; p += 0.25) {
      const pinL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
      );
      pinL.position.set(-0.4, 0, p);
      plcChipGroup.add(pinL);
      const pinR = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
      );
      pinR.position.set(0.4, 0, p);
      plcChipGroup.add(pinR);
    }

    // Node 1: EWS Terminal Screen
    const ewsGroup = new THREE.Group();
    ewsGroup.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.6, 0.18),
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
      ),
    );

    // Node 2: SIL-3 Safety Shield Octahedron
    const sisMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.48),
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
    );

    // Node 3: SCADA Historian Cylinder Stack
    const histGroup = new THREE.Group();
    const c1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.24, 14),
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
    );
    c1.position.y = 0.18;
    const c2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.24, 14),
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
    );
    c2.position.y = -0.18;
    histGroup.add(c1);
    histGroup.add(c2);

    // Node 4: Flow Valve Wheel
    const valveMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.1, 10, 20),
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
    );

    // Outer SCADA Physical Bus Ring removed per user directive

    const uniqueNodes = [plcChipGroup, ewsGroup, sisMesh, histGroup, valveMesh];

    uniqueNodes.forEach((nodeObj, i) => {
      const angle = (i / uniqueNodes.length) * Math.PI * 2;
      const x = Math.cos(angle) * ringRadius;
      const z = Math.sin(angle) * ringRadius;

      nodeObj.position.set(x, 0, z);
      nodeRingGroup.add(nodeObj);

      const linePoints = [new THREE.Vector3(x, 0, z), new THREE.Vector3(0, 0, 0)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.55,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      nodeRingGroup.add(line);
    });

    twinGroup.add(nodeRingGroup);

    // Kinetic Attack Particles
    const particleCount = 26;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const pAngle = Math.random() * Math.PI * 2;
      const pRad = Math.random() * ringRadius;
      particlePositions[i * 3] = Math.cos(pAngle) * pRad;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 3.0;
      particlePositions[i * 3 + 2] = Math.sin(pAngle) * pRad;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleSystem = new THREE.Points(
      particleGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.18 }),
    );
    twinGroup.add(particleSystem);

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

        uniqueNodes.forEach((nodeObj) => {
          nodeObj.rotation.x += 0.02;
          nodeObj.rotation.y += 0.02;
        });
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
