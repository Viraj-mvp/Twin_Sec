import React from "react";

interface MetricSparklineProps {
  label: string;
  unit: string;
  value: number;
  history: number[];
  min?: number;
  max?: number;
  crit?: number;
  invert?: boolean;
}

export const MetricSparkline: React.FC<MetricSparklineProps> = ({
  label,
  unit,
  value,
  history,
  min,
  max,
  crit,
  invert = false,
}) => {
  const points = history.length > 0 ? history.slice(-20) : [value];
  const computedMin = min ?? Math.min(...points, value) * 0.95;
  const computedMax = max ?? Math.max(...points, value) * 1.05 + 0.001;
  const critVal = crit ?? (invert ? computedMin * 1.02 : computedMax * 0.95);
  const isDanger = invert ? value <= critVal : value >= critVal;

  const svgWidth = 120;
  const svgHeight = 28;

  const polylinePoints = points
    .map((val, idx) => {
      const x = (idx / Math.max(1, points.length - 1)) * svgWidth;
      const range = Math.max(0.001, computedMax - computedMin);
      const normalizedY = Math.max(0, Math.min(1, (val - computedMin) / range));
      const y = svgHeight - normalizedY * svgHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="border border-rule p-3 bg-muted/10 font-mono flex items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-foreground/50 tracking-wider uppercase">{label}</span>
          {isDanger && (
            <span className="text-[9px] bg-red-500/20 text-red-400 px-1 font-bold animate-pulse">
              ALARM
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span
            className={`text-lg font-bold tabular-nums ${
              isDanger ? "text-red-400" : "text-foreground"
            }`}
          >
            {value.toFixed(1)}
          </span>
          <span className="text-[10px] text-foreground/40">{unit}</span>
        </div>
      </div>

      {/* SVG Sparkline */}
      <div className="w-[120px] h-[28px] border-b border-rule/50 relative overflow-hidden">
        <svg
          width={svgWidth}
          height={svgHeight}
          className="overflow-visible"
          role="img"
          aria-label={`${label} trend`}
        >
          <polyline
            fill="none"
            stroke={isDanger ? "#f87171" : "#bfff2e"}
            strokeWidth="1.5"
            points={polylinePoints}
          />
        </svg>
      </div>
    </div>
  );
};
