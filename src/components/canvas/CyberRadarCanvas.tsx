import React, { useEffect, useRef } from "react";

interface CyberRadarCanvasProps {
  className?: string;
}

interface RadarNode {
  x: number;
  y: number;
  label: string;
  angle: number;
  dist: number;
  status: "ONLINE" | "WARN" | "ALERT";
  pingTime: number;
}

export const CyberRadarCanvas: React.FC<CyberRadarCanvasProps> = ({ className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    let sweepAngle = 0;

    const setCanvasSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    setCanvasSize();

    // SCADA Tactical Nodes
    const nodeLabels = [
      "SUBSTATION-01",
      "TURBINE-04",
      "RELAY-33B",
      "PLC-RUNG-09",
      "SCADA-HISTORIAN",
      "BREAKER-12",
      "FEEDER-07",
      "ICS-GATEWAY",
    ];

    const nodes: RadarNode[] = nodeLabels.map((label, idx) => {
      const angle = (idx / nodeLabels.length) * Math.PI * 2 + (Math.random() * 0.2 - 0.1);
      const dist = 0.25 + (idx % 3) * 0.22;
      return {
        x: 0,
        y: 0,
        label,
        angle,
        dist,
        status: idx === 1 ? "WARN" : idx === 3 ? "ALERT" : "ONLINE",
        pingTime: 0,
      };
    });

    let isVisible = true;
    let isTabVisible = !document.hidden;

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(width, height) * 0.42;

      // Update radar sweep angle
      sweepAngle = (time * 0.0008) % (Math.PI * 2);

      // Draw Grid Radar Rings
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(191, 255, 46, 0.12)";
      for (let r = 0.25; r <= 1.0; r += 0.25) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius * r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw Reticle Axes & Crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX - maxRadius, centerY);
      ctx.lineTo(centerX + maxRadius, centerY);
      ctx.moveTo(centerX, centerY - maxRadius);
      ctx.lineTo(centerX, centerY + maxRadius);
      ctx.strokeStyle = "rgba(191, 255, 46, 0.15)";
      ctx.stroke();

      // Draw Rotating Radar Sweep Line & Beam Sector Gradient
      ctx.save();
      ctx.translate(centerX, centerY);

      const sweepGradient = ctx.createConicGradient(sweepAngle, 0, 0);
      sweepGradient.addColorStop(0, "rgba(191, 255, 46, 0.25)");
      sweepGradient.addColorStop(0.12, "rgba(191, 255, 46, 0.05)");
      sweepGradient.addColorStop(0.25, "rgba(191, 255, 46, 0.0)");
      sweepGradient.addColorStop(1, "rgba(191, 255, 46, 0.0)");

      ctx.beginPath();
      ctx.arc(0, 0, maxRadius, 0, Math.PI * 2);
      ctx.fillStyle = sweepGradient;
      ctx.fill();

      // Lead Sweep Radial Ray
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(sweepAngle) * maxRadius, Math.sin(sweepAngle) * maxRadius);
      ctx.strokeStyle = "rgba(191, 255, 46, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      // Render SCADA Tactical Nodes & Detect Sweep Pulse
      nodes.forEach((node) => {
        const nx = centerX + Math.cos(node.angle) * maxRadius * node.dist;
        const ny = centerY + Math.sin(node.angle) * maxRadius * node.dist;
        node.x = nx;
        node.y = ny;

        // Check angle diff between sweep and node
        let angleDiff = Math.abs(sweepAngle - node.angle);
        if (angleDiff > Math.PI * 2) angleDiff %= Math.PI * 2;
        if (angleDiff < 0.12) {
          node.pingTime = time;
        }

        const timeSincePing = time - node.pingTime;
        const isPinged = timeSincePing < 1200;
        const pingAlpha = isPinged ? Math.max(0, 1 - timeSincePing / 1200) : 0;

        // Node Ring
        ctx.beginPath();
        ctx.arc(nx, ny, isPinged ? 6 + pingAlpha * 8 : 4, 0, Math.PI * 2);
        ctx.fillStyle =
          node.status === "WARN" ? "#F59E0B" : node.status === "ALERT" ? "#EF4444" : "#BFFF2E";
        ctx.fill();

        // Ping Ripple Ring
        if (isPinged) {
          ctx.beginPath();
          ctx.arc(nx, ny, 8 + (1 - pingAlpha) * 16, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(191, 255, 46, ${pingAlpha * 0.7})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Label Tag
        ctx.font = "9px monospace";
        ctx.fillStyle = isPinged ? "#F5F3E7" : "rgba(245, 243, 231, 0.4)";
        ctx.fillText(node.label, nx + 8, ny + 3);
      });

      // Central Command Reticle Core
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#BFFF2E";
      ctx.fill();

      if (isVisible && isTabVisible) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

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

    observer.observe(canvas);

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isVisible && isTabVisible) {
        startLoop();
      } else {
        stopLoop();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

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
      observer.unobserve(canvas);
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
};
