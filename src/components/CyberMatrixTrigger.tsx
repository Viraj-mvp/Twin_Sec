import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface CyberMatrixTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isOpen: boolean;
  callsign?: string;
  badgeId?: string;
  className?: string;
  label?: string;
}

export const CyberMatrixTrigger = React.forwardRef<HTMLButtonElement, CyberMatrixTriggerProps>(
  ({ isOpen, callsign, badgeId, className, label = "TACTICAL MENU", ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <button
        ref={ref}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={props.onClick}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close tactical system menu" : "Open tactical system menu"}
        className={cn(
          "group relative flex items-center gap-2.5 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider",
          "bg-[#09090B] text-[#F5F3E7] transition-all duration-150 select-none cursor-pointer border-2 border-black",
          "shadow-[3px_3px_0px_0px_#BFFF2E] hover:shadow-[4px_4px_0px_0px_#BFFF2E] hover:border-black hover:text-[#BFFF2E]",
          "active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#BFFF2E]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF2E]",
          isOpen &&
            "bg-[#BFFF2E] text-black border-2 border-black font-extrabold shadow-[3px_3px_0px_0px_#000000] hover:text-black hover:bg-[#b5f524]",
          className,
        )}
        {...props}
      >
        {/* Pulsing CTF Beacon LED */}
        <span className="relative flex size-2.5 items-center justify-center shrink-0">
          <span
            className={cn(
              "absolute inline-flex size-full rounded-full opacity-75 animate-ping",
              isOpen ? "bg-black" : "bg-[#BFFF2E]",
            )}
          />
          <span
            className={cn(
              "relative inline-flex size-2 rounded-full",
              isOpen ? "bg-black" : "bg-[#BFFF2E]",
            )}
          />
        </span>

        {/* Dynamic Label & Callsign Chip */}
        <span className="truncate text-[11px] font-bold">{isOpen ? "CLOSE MENU" : label}</span>

        {callsign ? (
          <span
            className={cn(
              "text-[9.5px] font-bold px-1.5 py-0.5 border text-black font-mono shrink-0 ml-0.5",
              isOpen
                ? "bg-black text-[#BFFF2E] border-black"
                : "bg-[#BFFF2E] text-black border-black",
            )}
          >
            OP: {callsign.toUpperCase()}
          </span>
        ) : (
          <span
            className={cn(
              "text-[9px] font-bold px-1.5 py-0.5 border shrink-0 ml-0.5 uppercase tracking-widest",
              isOpen
                ? "border-black text-black bg-black/10"
                : "border-[#27272A] bg-[#18181B] text-[#BFFF2E]",
            )}
          >
            CTF // SIGN-IN
          </span>
        )}

        {/* Cross / Toggle Icon */}
        <span className="size-3.5 flex items-center justify-center shrink-0 ml-0.5">
          <svg
            className={cn(
              "size-3.5 transition-transform duration-200",
              isOpen ? "rotate-90 text-black" : "group-hover:rotate-90 text-[#BFFF2E]",
            )}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            {isOpen ? (
              <path d="M4 4L12 12M12 4L4 12" strokeLinecap="square" />
            ) : (
              <path d="M8 2V14M2 8H14" strokeLinecap="square" />
            )}
          </svg>
        </span>
      </button>
    );
  },
);

CyberMatrixTrigger.displayName = "CyberMatrixTrigger";
