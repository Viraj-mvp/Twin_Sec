import React, { useId } from "react";
import { cn } from "@/lib/utils";

interface TwinSecLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  showWordmark?: boolean;
  variant?: "dark" | "light";
  className?: string;
}

export function TwinSecLogo({
  size = 36,
  showWordmark = false,
  variant = "light",
  className,
  ...props
}: TwinSecLogoProps) {
  const rawId = useId();
  const filterId = `twin_glow_${rawId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const patternId = `twin_pat_${rawId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  let numericSize = typeof size === "number" ? size : parseInt(size as string, 10) || 36;
  const sizeMatch = className?.match(/\bsize-(\d+)\b/);
  if (sizeMatch && size === 36) {
    numericSize = Math.max(16, parseInt(sizeMatch[1], 10) * 4);
  }
  const isLight = variant === "light";

  // Filter out size-X classes from outer wrapper so emblem size is respected
  const wrapperClassName = className
    ?.split(" ")
    .filter((c) => !/^size-\d+$/.test(c) && !/^w-\d+$/.test(c) && !/^h-\d+$/.test(c))
    .join(" ");

  return (
    <div className={cn("inline-flex items-center gap-3 select-none shrink-0", wrapperClassName)}>
      {/* Bold Neo-Brutalist Emblem Badge */}
      <div
        className="relative shrink-0 flex items-center justify-center bg-black border-2 border-black p-1 shadow-[2px_2px_0px_0px_#BFFF2E]"
        style={{ width: numericSize + 8, height: numericSize + 8 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          width={numericSize}
          height={numericSize}
          className="w-full h-full overflow-visible"
          {...props}
        >
          <defs>
            {/* Neon Glow Filter with Unique Scoped Instance ID */}
            <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Hazard Stripes for Physical Block */}
            <pattern
              id={patternId}
              width="3"
              height="3"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="1.2" height="3" fill="#bfff2e" opacity="0.35" />
              <rect x="1.2" width="1.8" height="3" fill="none" />
            </pattern>
          </defs>

          {/* Radar Grid Target rings (Subtle background details) */}
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke="#bfff2e"
            strokeWidth="0.5"
            opacity="0.18"
            strokeDasharray="1 2"
          />
          <circle
            cx="16"
            cy="16"
            r="10"
            fill="none"
            stroke="#bfff2e"
            strokeWidth="0.5"
            opacity="0.12"
          />

          {/* Tactical Reticle Ticks */}
          <path
            d="M16 1 L16 3 M16 29 L16 31 M1 16 L3 16 M29 16 L31 16"
            stroke="#bfff2e"
            strokeWidth="0.75"
            opacity="0.4"
            strokeLinecap="round"
          />

          {/* CUBE 2: PHYSICAL FACILITY (Solid Block - Bottom-Right) */}
          <g opacity="0.9">
            {/* Left Face */}
            <path
              d="M 13.8 15 L 19 18 L 19 24 L 13.8 21 Z"
              fill="#181c12"
              stroke="#bfff2e"
              strokeWidth="0.5"
              opacity="0.9"
            />
            {/* Right Face */}
            <path
              d="M 19 18 L 24.2 15 L 24.2 21 L 19 24 Z"
              fill="#1e2417"
              stroke="#bfff2e"
              strokeWidth="0.5"
              opacity="0.9"
            />
            {/* Top Face */}
            <path
              d="M 19 12 L 24.2 15 L 19 18 L 13.8 15 Z"
              fill="#14180f"
              stroke="#bfff2e"
              strokeWidth="0.5"
            />
            <path d="M 19 12 L 24.2 15 L 19 18 L 13.8 15 Z" fill={`url(#${patternId})`} />
          </g>

          {/* Cyber-Physical Interlocking Link */}
          <path
            d="M 13 14 L 19 18"
            stroke="#bfff2e"
            strokeWidth="0.75"
            strokeDasharray="1 1.5"
            opacity="0.65"
          />

          {/* CUBE 1: DIGITAL TWIN (Wireframe Block - Top-Left) */}
          <g stroke="#bfff2e" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round">
            {/* Vertical Edges */}
            <line x1="13" y1="8" x2="13" y2="14" />
            <line x1="7.8" y1="11" x2="7.8" y2="17" />
            <line x1="18.2" y1="11" x2="18.2" y2="17" />
            <line x1="13" y1="14" x2="13" y2="20" />

            {/* Top Face Edges */}
            <line x1="13" y1="8" x2="7.8" y2="11" />
            <line x1="13" y1="8" x2="18.2" y2="11" />
            <line x1="7.8" y1="11" x2="13" y2="14" />
            <line x1="18.2" y1="11" x2="13" y2="14" />

            {/* Bottom Face Edges */}
            <line x1="13" y1="14" x2="7.8" y2="17" />
            <line x1="13" y1="14" x2="18.2" y2="17" />
            <line x1="7.8" y1="17" x2="13" y2="20" />
            <line x1="18.2" y1="17" x2="13" y2="20" />
          </g>

          {/* Digital Twin Node Dots */}
          <circle cx="13" cy="8" r="0.6" fill="#bfff2e" />
          <circle cx="7.8" cy="11" r="0.6" fill="#bfff2e" />
          <circle cx="18.2" cy="11" r="0.6" fill="#bfff2e" />
          <circle cx="7.8" cy="17" r="0.6" fill="#bfff2e" />
          <circle cx="18.2" cy="17" r="0.6" fill="#bfff2e" />
          <circle cx="13" cy="20" r="0.6" fill="#bfff2e" />

          {/* Compromised Target Central Node (Pulsing Glow) */}
          <circle cx="13" cy="14" r="2.2" fill="#bfff2e" filter={`url(#${filterId})`}>
            <animate attributeName="r" values="1.8;2.6;1.8" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      {/* Optional Monospace Bold Wordmark */}
      {showWordmark && (
        <div className="flex flex-col font-mono leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "font-black text-lg sm:text-xl tracking-wider uppercase",
                isLight ? "text-black" : "text-[#F5F3E7]",
              )}
            >
              TWIN
              <span className={isLight ? "bg-black text-[#BFFF2E] px-1 ml-0.5" : "text-[#BFFF2E]"}>
                SEC
              </span>
            </span>
            <span className="bg-[#BFFF2E] text-black text-[9px] font-black px-1.5 py-0.2 border border-black uppercase tracking-widest shadow-[1px_1px_0px_0px_#000000]">
              v1.0.0
            </span>
          </div>
          <span
            className={cn(
              "text-[9px] font-bold uppercase tracking-widest mt-0.5",
              isLight ? "text-zinc-800" : "text-muted-foreground",
            )}
          >
            CYBER-PHYSICAL SIMULATION RANGE
          </span>
        </div>
      )}
    </div>
  );
}
