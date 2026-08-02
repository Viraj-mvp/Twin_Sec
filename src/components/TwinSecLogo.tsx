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
  const filterId = useId();
  const numericSize = typeof size === "number" ? size : parseInt(size as string, 10) || 36;
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
          viewBox="0 0 100 100"
          width={numericSize}
          height={numericSize}
          className="w-full h-full overflow-visible"
          {...props}
        >
          <defs>
            {/* High-intensity Glow Filter with Unique Instance ID */}
            <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Octagon Frame */}
          <polygon
            points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30"
            fill="#09090B"
            stroke="#BFFF2E"
            strokeWidth="3.5"
          />

          {/* Outer Radar Reticle Ring */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#F5F3E7"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            opacity="0.5"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 50 50"
              to="360 50 50"
              dur="40s"
              repeatCount="indefinite"
            />
          </circle>

          {/* CYBER TWIN SHIELD 1 (Acid Lime Left Polygon) */}
          <polygon
            points="50,15 20,38 20,68 50,85"
            fill="#BFFF2E"
            stroke="#000000"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* PHYSICAL SCADA SHIELD 2 (Technical Cream Right Polygon) */}
          <polygon
            points="50,15 80,38 80,68 50,85"
            fill="#F5F3E7"
            stroke="#000000"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Central Interlocking Twin Core Line */}
          <line x1="50" y1="15" x2="50" y2="85" stroke="#000000" strokeWidth="4" />

          {/* Tactical Crosshair Axes */}
          <line x1="12" y1="50" x2="88" y2="50" stroke="#000000" strokeWidth="2.5" opacity="0.8" />
          <line x1="50" y1="12" x2="50" y2="88" stroke="#000000" strokeWidth="2.5" opacity="0.8" />

          {/* Core Pulsing Threat / Signal Node */}
          <circle cx="50" cy="50" r="8" fill="#000000" stroke="#BFFF2E" strokeWidth="2.5" />
          <circle cx="50" cy="50" r="4" fill="#BFFF2E" filter={`url(#${filterId})`}>
            <animate attributeName="r" values="3;5;3" dur="1.8s" repeatCount="indefinite" />
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
              v1
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
