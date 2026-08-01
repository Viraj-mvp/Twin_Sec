import React from "react";
import { fmt } from "@/data/scenarios";

interface StatusBarProps {
  t: number;
  playing: boolean;
  compromised: number;
  totalNodes: number;
  speed: number;
  adversary: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  t,
  playing,
  compromised,
  totalNodes,
  speed,
  adversary,
}) => {
  return (
    <header className="border-b border-rule bg-paper text-ink">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-6 lg:px-10 py-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mono-label text-ink/70! gap-2 sm:gap-3">
        <span className="truncate">
          STATE · <span className="text-ink">{playing ? "RUNNING" : "HOLD"}</span>
        </span>
        <span className="truncate">
          CLOCK · <span className="text-ink tabular-nums">T+{fmt(t)}</span>
        </span>
        <span className="truncate">
          NODES ·{" "}
          <span className="text-ink tabular-nums">
            {compromised} / {totalNodes}
          </span>
        </span>
        <span className="truncate hidden sm:inline">
          SPEED · <span className="text-ink tabular-nums">{Math.round(speed)}×</span>
        </span>
        <span className="truncate hidden md:inline text-right">
          ADVERSARY · <span className="text-ink font-bold">{adversary}</span>
        </span>
      </div>
    </header>
  );
};
