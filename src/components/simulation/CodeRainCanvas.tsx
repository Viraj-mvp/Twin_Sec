/**
 * CodeRainCanvas.tsx
 *
 * Canvas2D Reimplementation of the 21st.dev "Code Rain" ASCII-Art Matrix Effect.
 * Render pipeline:
 * 1. Cell-grid sampling (14px cells) with binary/matrix character set.
 * 2. Falling digital code streams with glowing heads and flickering body glyphs.
 * 3. Color adjustments: Matrix green tint (#00ff66 at 45% opacity), contrast (115%).
 * 4. Post-processing effects:
 *    - Scanlines (28% intensity horizontal raster lines)
 *    - Vignette (38% intensity radial edge darkening)
 *    - Bloom (25% soft radial head glow)
 *    - Film Grain (40% animated noise overlay)
 *    - Glitch (20% horizontal slice offset displacement)
 */

import React, { useEffect, useRef } from "react";

interface CodeRainCanvasProps {
  className?: string;
}

const CHAR_SET =
  "010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101";

export const CodeRainCanvas: React.FC<CodeRainCanvasProps> = ({ className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 560);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 380);

    const cellSize = 14;
    let columns = Math.ceil(width / cellSize);
    let rows = Math.ceil(height / cellSize);

    // Stream state per column
    interface ColumnStream {
      y: number; // Current row head position
      speed: number; // Fall speed in rows per frame
      length: number; // Stream tail length in cells
      chars: string[]; // Glyphs in this column
      flickers: number[]; // Per-cell flicker factors
    }

    const initStreams = (): ColumnStream[] => {
      const streams: ColumnStream[] = [];
      for (let i = 0; i < columns; i++) {
        const streamLength = Math.floor(8 + Math.random() * 16);
        const chars: string[] = [];
        const flickers: number[] = [];
        for (let r = 0; r < rows + 30; r++) {
          chars.push(CHAR_SET[Math.floor(Math.random() * CHAR_SET.length)]);
          flickers.push(Math.random());
        }
        streams.push({
          y: -Math.floor(Math.random() * rows),
          speed: 0.25 + Math.random() * 0.45,
          length: streamLength,
          chars,
          flickers,
        });
      }
      return streams;
    };

    let streams = initStreams();

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
      columns = Math.ceil(width / cellSize);
      rows = Math.ceil(height / cellSize);
      streams = initStreams();
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    let frameCount = 0;

    const render = () => {
      frameCount++;

      // 1. Background Fill (Solid #0f1419 with 90% opacity as per spec)
      ctx.fillStyle = "rgba(15, 20, 25, 0.9)";
      ctx.fillRect(0, 0, width, height);

      // 2. Render Code Rain Grid
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Apply Glitch Slice Displacement (20% intensity)
      const isGlitchFrame = Math.random() < 0.08;
      const glitchSliceY = isGlitchFrame ? Math.floor(Math.random() * rows) : -1;
      const glitchOffsetX = isGlitchFrame ? (Math.random() - 0.5) * 16 : 0;

      for (let c = 0; c < columns; c++) {
        const stream = streams[c];
        stream.y += stream.speed;

        // Reset column when tail moves past viewport
        if (stream.y - stream.length > rows) {
          stream.y = -Math.floor(Math.random() * 15);
          stream.speed = 0.25 + Math.random() * 0.45;
          stream.length = Math.floor(8 + Math.random() * 16);
        }

        const headY = Math.floor(stream.y);

        for (let r = 0; r < rows; r++) {
          const distFromHead = headY - r;

          // Only draw if inside the active stream tail
          if (distFromHead >= 0 && distFromHead < stream.length) {
            let x = c * cellSize + cellSize / 2;
            const y = r * cellSize + cellSize / 2;

            // Apply Glitch shift to selected row slice
            if (r === glitchSliceY) {
              x += glitchOffsetX;
            }

            // Flicker logic (animIntensity 60)
            if (Math.random() < 0.06) {
              stream.chars[r] = CHAR_SET[Math.floor(Math.random() * CHAR_SET.length)];
              stream.flickers[r] = Math.random();
            }

            const char = stream.chars[r] || "1";
            const alphaFactor = 1 - distFromHead / stream.length;

            if (distFromHead === 0) {
              // 3. Leading Head Character (Glowing bright white-green with Bloom 25)
              ctx.shadowColor = "#00ff66";
              ctx.shadowBlur = 10;
              ctx.fillStyle = "#ffffff";
              ctx.fillText(char, x, y);
              ctx.shadowBlur = 0;
            } else {
              // Body Characters (Matrix Green #00ff66 with 45% tint overlay blend)
              const greenIntensity = Math.floor(180 + stream.flickers[r] * 75);
              const opacity = (0.25 + alphaFactor * 0.65) * 0.85;

              ctx.shadowBlur = 0;
              ctx.fillStyle = `rgba(0, ${greenIntensity}, 102, ${opacity})`;
              ctx.fillText(char, x, y);
            }
          }
        }
      }

      // 4. Post-processing Layer: Scanlines (28% intensity)
      ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      for (let y = 0; y < height; y += 3) {
        ctx.fillRect(0, y, width, 1);
      }

      // 5. Post-processing Layer: Vignette (38% intensity radial edge darkening)
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.35,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75,
      );
      grad.addColorStop(0, "rgba(0, 0, 0, 0)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0.65)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 6. Post-processing Layer: Animated Film Grain Noise (40% intensity)
      const grainImgData = ctx.getImageData(0, 0, width, height);
      const data = grainImgData.data;
      const grainAmount = 18; // Noise amplitude

      for (let i = 0; i < data.length; i += 16) {
        const noise = (Math.random() - 0.5) * grainAmount;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(grainImgData, 0, 0);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none z-0 ${className}`}
    />
  );
};
