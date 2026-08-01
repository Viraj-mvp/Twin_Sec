import React, { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  pulse: number;
  pulseSpeed: number;
  color: string;
  isThreat?: boolean;
}

interface Packet {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  color: string;
}

interface ScanWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  active: boolean;
}

export function CyberNetworkCanvas({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const setCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    setCanvasSize();

    // Node configuration
    const nodeCount = Math.min(Math.floor((width * height) / 26000), 30);
    const nodes: Node[] = [];
    const packets: Packet[] = [];
    const colors = [
      "rgba(191, 255, 46, ", // Accent Green
      "rgba(0, 240, 255, ", // Cyan
      "rgba(255, 51, 102, ", // Threat Red
      "rgba(148, 163, 184, ", // Slate Muted
    ];

    for (let i = 0; i < nodeCount; i++) {
      const isThreat = Math.random() < 0.12;
      const colorPrefix = isThreat ? colors[2] : colors[Math.floor(Math.random() * 2)];
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (prefersReducedMotion ? 0.1 : 0.45),
        vy: (Math.random() - 0.5) * (prefersReducedMotion ? 0.1 : 0.45),
        radius: Math.random() * 2.5 + 2,
        baseRadius: Math.random() * 2.5 + 2,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        color: colorPrefix,
        isThreat,
      });
    }

    // Scan wave state
    const scanWave: ScanWave = {
      x: width * 0.5,
      y: height * 0.5,
      radius: 0,
      maxRadius: Math.hypot(width, height) * 0.8,
      speed: prefersReducedMotion ? 1.5 : 3.5,
      active: true,
    };

    // Packet spawner timer
    let lastPacketSpawn = 0;
    const spawnPacket = (now: number) => {
      if (now - lastPacketSpawn < 400 || prefersReducedMotion) return;
      lastPacketSpawn = now;

      if (nodes.length < 2) return;
      const from = Math.floor(Math.random() * nodes.length);
      // Find a nearby node with fast bounding box check
      const targetCandidates: number[] = [];
      for (let i = 0; i < nodes.length; i++) {
        if (i === from) continue;
        const dx = nodes[i].x - nodes[from].x;
        if (Math.abs(dx) > 180) continue;
        const dy = nodes[i].y - nodes[from].y;
        if (Math.abs(dy) > 180) continue;
        const dist = Math.hypot(dx, dy);
        if (dist < 180) {
          targetCandidates.push(i);
        }
      }

      if (targetCandidates.length > 0) {
        const to = targetCandidates[Math.floor(Math.random() * targetCandidates.length)];
        const isRed = nodes[from].isThreat || nodes[to].isThreat;
        packets.push({
          fromNode: from,
          toNode: to,
          progress: 0,
          speed: 0.01 + Math.random() * 0.015,
          color: isRed ? "rgba(255, 51, 102, 0.9)" : "rgba(191, 255, 46, 0.9)",
        });
      }
    };

    // Main Render Loop
    const render = (timestamp: number) => {
      ctx.clearRect(0, 0, width, height);

      // Spawn packets periodically
      spawnPacket(timestamp);

      // 1. Update and draw scan wave
      if (scanWave.active) {
        scanWave.radius += scanWave.speed;
        if (scanWave.radius > scanWave.maxRadius) {
          scanWave.radius = 0;
          scanWave.x = Math.random() * width;
          scanWave.y = Math.random() * height;
        }

        ctx.beginPath();
        ctx.arc(scanWave.x, scanWave.y, scanWave.radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(191, 255, 46, 0.06)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(scanWave.x, scanWave.y, Math.max(0, scanWave.radius - 20), 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 240, 255, 0.03)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 2. Update node positions & draw connections
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (!prefersReducedMotion) {
          n.x += n.vx;
          n.y += n.vy;

          if (n.x < 0 || n.x > width) n.vx *= -1;
          if (n.y < 0 || n.y > height) n.vy *= -1;
        }

        n.pulse += n.pulseSpeed;
        const currentRadius = n.baseRadius + Math.sin(n.pulse) * 0.8;

        // Check proximity to scan wave for glow burst
        const distToScan = Math.abs(
          Math.hypot(n.x - scanWave.x, n.y - scanWave.y) - scanWave.radius,
        );
        const isNearWave = distToScan < 30;

        // Draw node connections with fast bounding box skip
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n2.x - n.x;
          if (Math.abs(dx) > 160) continue;
          const dy = n2.y - n.y;
          if (Math.abs(dy) > 160) continue;
          const dist = Math.hypot(dx, dy);

          const maxDist = 160;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.22 * (isNearWave ? 1.8 : 1);
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle =
              n.isThreat || n2.isThreat
                ? `rgba(255, 51, 102, ${alpha * 0.8})`
                : `rgba(191, 255, 46, ${alpha})`;
            ctx.lineWidth = isNearWave ? 1.2 : 0.7;
            ctx.stroke();
          }
        }

        // Draw node body & glow
        ctx.beginPath();
        ctx.arc(n.x, n.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = n.color + (isNearWave ? "0.95)" : "0.7)");
        ctx.fill();

        // Node outer ring glow
        ctx.beginPath();
        ctx.arc(n.x, n.y, currentRadius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = n.color + (isNearWave ? "0.4)" : "0.15)");
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 3. Render animated signal packets
      for (let pIdx = packets.length - 1; pIdx >= 0; pIdx--) {
        const p = packets[pIdx];
        p.progress += p.speed;

        if (p.progress >= 1) {
          packets.splice(pIdx, 1);
          continue;
        }

        const nFrom = nodes[p.fromNode];
        const nTo = nodes[p.toNode];
        if (!nFrom || !nTo) continue;

        const currX = nFrom.x + (nTo.x - nFrom.x) * p.progress;
        const currY = nFrom.y + (nTo.y - nFrom.y) * p.progress;

        ctx.beginPath();
        ctx.arc(currX, currY, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Packet tail trail
        ctx.beginPath();
        const prevX = nFrom.x + (nTo.x - nFrom.x) * Math.max(0, p.progress - 0.06);
        const prevY = nFrom.y + (nTo.y - nFrom.y) * Math.max(0, p.progress - 0.06);
        ctx.moveTo(currX, currY);
        ctx.lineTo(prevX, prevY);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    let isVisible = true;
    let isTabVisible = !document.hidden;

    const startLoop = () => {
      if (!animationFrameId && isVisible && isTabVisible) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const stopLoop = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }
    };

    // IntersectionObserver to pause loop when canvas is off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && isTabVisible) {
            startLoop();
          } else {
            stopLoop();
          }
        });
      },
      { threshold: 0.05 },
    );

    if (canvas) observer.observe(canvas);

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isVisible && isTabVisible) {
        startLoop();
      } else {
        stopLoop();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Defer initial animation loop start
    const initTimer = setTimeout(() => {
      startLoop();
    }, 60);

    const handleResize = () => {
      setCanvasSize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(initTimer);
      stopLoop();
      if (canvas) observer.unobserve(canvas);
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-0 ${className}`}
      aria-hidden="true"
    />
  );
}
