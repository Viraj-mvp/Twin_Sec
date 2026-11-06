import React from "react";
import { cn } from "@/lib/utils";

export interface CyberMatrixTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isOpen: boolean;
  callsign?: string;
  badgeId?: string;
  className?: string;
  label?: string;
}

/**
 * CyberMatrixTrigger (Tactical Breaker Latch Control)
 *
 * Industrial Neo-Brutalist global tactical menu trigger modeled after a SCADA /
 * substation high-voltage breaker latch switch.
 * Features concentric LED status beacon, hazard striping rail, stacked callsign typography,
 * and a mechanical switch lever handle with tactile latching feedback.
 */
export const CyberMatrixTrigger = React.forwardRef<HTMLButtonElement, CyberMatrixTriggerProps>(
  ({ isOpen, callsign, badgeId, className, label = "TACTICAL MENU", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={props.onClick}
        aria-expanded={isOpen}
        aria-label={
          isOpen
            ? "Disengage breaker: Close tactical system menu"
            : "Engage breaker: Open tactical system menu"
        }
        className={cn(
          "group relative inline-flex items-center min-h-[44px] h-11 border-2 select-none cursor-pointer transition-all duration-150 font-mono rounded-none",
          // Closed State: High-contrast Dark Plate + Bone Text + Acid Lime Comic Shadow
          !isOpen &&
            "bg-[#09090B] text-[#F5F3E7] border-black shadow-[3px_3px_0px_0px_#BFFF2E] hover:shadow-[4px_4px_0px_0px_#BFFF2E] hover:border-black hover:text-[#BFFF2E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF2E]",
          // Open State: High-contrast Acid Lime Plate + Black Text + Hard Black Comic Shadow
          isOpen &&
            "bg-[#BFFF2E] text-black border-2 border-black font-extrabold shadow-[3px_3px_0px_0px_#000000] hover:bg-[#b5f524] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black",
          className,
        )}
        {...props}
      >
        {/* Tactical Hazard Striping Rail (Left Flange) */}
        <div
          className={cn(
            "w-2 self-stretch border-r-2 flex flex-col justify-around py-1 shrink-0 overflow-hidden",
            isOpen ? "bg-black/15 border-black" : "bg-black border-rule",
          )}
          aria-hidden="true"
        >
          <div className={cn("w-full h-0.5", isOpen ? "bg-black" : "bg-[#BFFF2E]")} />
          <div className={cn("w-full h-0.5", isOpen ? "bg-black" : "bg-[#BFFF2E]")} />
          <div className={cn("w-full h-0.5", isOpen ? "bg-black" : "bg-[#BFFF2E]")} />
        </div>

        <div className="flex items-center gap-2.5 px-3 py-1">
          {/* Concentric Breaker Status LED Beacon */}
          <span
            className="relative flex size-2.5 items-center justify-center shrink-0"
            aria-hidden="true"
          >
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

          {/* Central Stacked Typography: Action + Operator Identification */}
          <div className="flex flex-col items-start text-left leading-tight shrink-0">
            <span className="text-[11px] font-black tracking-wider uppercase">
              {isOpen ? "DISENGAGE // CLOSE" : label}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={cn(
                  "text-[8.5px] font-bold tracking-widest uppercase",
                  isOpen ? "text-black/85" : "text-muted-foreground",
                )}
              >
                {callsign ? `OP: ${callsign.toUpperCase()}` : "OPERATOR PORTAL"}
              </span>
              {badgeId && (
                <span
                  className={cn(
                    "text-[8px] font-bold px-1 py-0 border hidden sm:inline-block",
                    isOpen
                      ? "border-black bg-black text-[#BFFF2E]"
                      : "border-rule bg-[#18181B] text-foreground/80",
                  )}
                >
                  {badgeId}
                </span>
              )}
            </div>
          </div>

          {/* Right Mechanical Breaker Latch Lever (CSS/HTML Industrial Switchgear) */}
          <div className="flex items-center pl-1 shrink-0" aria-hidden="true">
            <div
              className={cn(
                "relative w-6 h-7 border-2 flex items-center justify-center p-0.5 transition-colors",
                isOpen
                  ? "bg-black border-black text-[#BFFF2E]"
                  : "bg-[#18181B] border-rule text-[#BFFF2E]",
              )}
            >
              {/* Mechanical Switch Lever Handle with Vertical Throw */}
              <div
                className={cn(
                  "w-3.5 h-3 transition-transform duration-200 border flex items-center justify-center text-[7.5px] font-black select-none",
                  isOpen
                    ? "translate-y-1.5 bg-[#BFFF2E] text-black border-black"
                    : "-translate-y-1 bg-[#BFFF2E] text-black border-black",
                )}
              >
                {isOpen ? "▼" : "▲"}
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  },
);

CyberMatrixTrigger.displayName = "CyberMatrixTrigger";
