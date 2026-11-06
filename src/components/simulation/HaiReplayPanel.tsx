import React, { useState, useEffect, useRef, useMemo } from "react";
import { evaluateHaiAttackWindowFn, getHaiAttackPeriodsFn } from "@/lib/api/hai.functions";
import type { HaiAttackPeriod, HaiEvaluationResult, HaiTelemetryRow } from "@/lib/data/hai/types";
import type { CorrelationAdvisory } from "@/lib/engines/correlation-engine";
import {
  Play,
  Pause,
  RotateCcw,
  Activity,
  ShieldAlert,
  Cpu,
  Database,
  ChevronRight,
} from "lucide-react";

interface HaiReplayPanelProps {
  onClose?: () => void;
  onApplyAdvisory?: (advisory: CorrelationAdvisory) => void;
}

type MetricKey =
  | "p1_pressure"
  | "p1_temperature"
  | "p1_flow"
  | "p1_level"
  | "p2_speed"
  | "p2_vibration"
  | "p3_flow"
  | "p3_level"
  | "p4_steam_pressure"
  | "p4_steam_temperature";

interface MetricConfig {
  key: MetricKey;
  label: string;
  sensorTag: string;
  unit: string;
  process: string;
}

const METRIC_CONFIGS: MetricConfig[] = [
  {
    key: "p1_pressure",
    label: "Boiler Pressure",
    sensorTag: "P1_PIT01",
    unit: "bar",
    process: "Boiler (P1)",
  },
  {
    key: "p1_temperature",
    label: "Boiler Temp",
    sensorTag: "P1_TIT01",
    unit: "°C",
    process: "Boiler (P1)",
  },
  {
    key: "p1_level",
    label: "Boiler Drum Level",
    sensorTag: "P1_LIT01",
    unit: "%",
    process: "Boiler (P1)",
  },
  {
    key: "p2_speed",
    label: "Turbine Rotor Speed",
    sensorTag: "P2_SIT01",
    unit: "RPM",
    process: "Turbine (P2)",
  },
  {
    key: "p2_vibration",
    label: "Bearing Vibration",
    sensorTag: "P2_VIBTR01",
    unit: "mm/s",
    process: "Turbine (P2)",
  },
  {
    key: "p3_flow",
    label: "Water Dosing Flow",
    sensorTag: "P3_FIT01",
    unit: "L/h",
    process: "Water Treatment (P3)",
  },
  {
    key: "p3_level",
    label: "Reservoir Level",
    sensorTag: "P3_LIT01",
    unit: "%",
    process: "Water Treatment (P3)",
  },
  {
    key: "p4_steam_temperature",
    label: "Steam Temp",
    sensorTag: "P4_ST_TT01",
    unit: "°C",
    process: "Thermal Power (P4)",
  },
];

export const HaiReplayPanel: React.FC<HaiReplayPanelProps> = ({ onClose, onApplyAdvisory }) => {
  const [attackPeriods, setAttackPeriods] = useState<HaiAttackPeriod[]>([]);
  const [selectedAttackIdx, setSelectedAttackIdx] = useState<number>(1);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("p1_pressure");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [evaluation, setEvaluation] = useState<HaiEvaluationResult | null>(null);
  const [advisory, setAdvisory] = useState<CorrelationAdvisory | null>(null);
  const [telemetryRows, setTelemetryRows] = useState<HaiTelemetryRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [threshold, setThreshold] = useState<number>(2.5);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load available attack periods on mount
  useEffect(() => {
    let mounted = true;
    getHaiAttackPeriodsFn()
      .then((periods) => {
        if (mounted && periods && periods.length > 0) {
          setAttackPeriods(periods);
        }
      })
      .catch((err) => console.error("Failed to load attack periods:", err));
    return () => {
      mounted = false;
    };
  }, []);

  // When attack period changes, automatically switch to the most relevant sensor channel
  useEffect(() => {
    const period = attackPeriods.find((p) => p.index === selectedAttackIdx);
    if (!period) return;
    if (period.affectedProcess === "Turbine (P2)") {
      setSelectedMetric("p2_speed");
    } else if (period.affectedProcess === "Water Treatment (P3)") {
      setSelectedMetric("p3_flow");
    } else if (period.affectedProcess === "Thermal Power (P4)") {
      setSelectedMetric("p4_steam_temperature");
    } else {
      setSelectedMetric("p1_pressure");
    }
  }, [selectedAttackIdx, attackPeriods]);

  // Load telemetry window and ground-truth evaluation when selected attack or threshold changes
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setIsPlaying(false);
    setCurrentIndex(0);

    evaluateHaiAttackWindowFn({
      data: { attackIndex: selectedAttackIdx, threshold, limit: 300 },
    })
      .then((res) => {
        if (mounted && res) {
          setEvaluation(res.evaluation);
          setAdvisory(res.advisory);
          setTelemetryRows(res.sampleTelemetry || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to evaluate HAI attack window:", err);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedAttackIdx, threshold]);

  // Replay animation loop
  useEffect(() => {
    if (!isPlaying || telemetryRows.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.max(30, Math.floor(250 / playbackSpeed));
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= telemetryRows.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, telemetryRows.length]);

  const currentRow = telemetryRows[currentIndex] || telemetryRows[0];
  const activeAttack = attackPeriods.find((a) => a.index === selectedAttackIdx);
  const activeConfig = METRIC_CONFIGS.find((m) => m.key === selectedMetric) || METRIC_CONFIGS[0];

  // Dynamic Min/Max calibration across the active telemetry window
  const { chartMin, chartMax, midVal, currentVal } = useMemo(() => {
    if (telemetryRows.length === 0) {
      return { chartMin: 0, chartMax: 10, midVal: 5, currentVal: 0 };
    }
    const vals = telemetryRows.map((r) => r[selectedMetric] ?? 0);
    const rMin = Math.min(...vals);
    const rMax = Math.max(...vals);
    const delta = rMax - rMin;
    const pad = delta > 0.001 ? delta * 0.18 : Math.abs(rMax) * 0.1 || 1;
    const cMin = rMin - pad;
    const cMax = rMax + pad;
    const cur = currentRow ? (currentRow[selectedMetric] ?? 0) : vals[0];
    return {
      chartMin: cMin,
      chartMax: cMax,
      midVal: (cMax + cMin) / 2,
      currentVal: cur,
    };
  }, [telemetryRows, selectedMetric, currentRow]);

  // Click & scrub directly on SVG waveform
  const handleSvgInteraction = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || telemetryRows.length < 2) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newIdx = Math.round(pct * (telemetryRows.length - 1));
    setCurrentIndex(newIdx);
  };

  // Render authentic real-time progressive SVG SCADA oscilloscope
  const renderSvgWaveform = () => {
    if (telemetryRows.length < 2) {
      return (
        <div className="h-48 flex items-center justify-center border-2 border-rule bg-black/40 text-muted-foreground font-mono text-xs">
          [INITIALIZING TELEMETRY STREAM...]
        </div>
      );
    }

    const width = 960;
    const height = 180;
    const padding = 12;

    const getY = (val: number) => {
      const norm = Math.max(
        0,
        Math.min(1, (val - chartMin) / Math.max(0.0001, chartMax - chartMin)),
      );
      return height - padding - norm * (height - 2 * padding);
    };

    const getX = (idx: number) => {
      return padding + (idx / (telemetryRows.length - 1)) * (width - 2 * padding);
    };

    // Full baseline reference curve (future and past)
    const allPoints = telemetryRows.map(
      (r, i) => `${getX(i).toFixed(1)},${getY(r[selectedMetric] ?? 0).toFixed(1)}`,
    );
    const fullPathD = `M ${allPoints.join(" L ")}`;

    // Active real-time progress path (up to current index)
    const activeRows = telemetryRows.slice(0, currentIndex + 1);
    const activePoints = activeRows.map(
      (r, i) => `${getX(i).toFixed(1)},${getY(r[selectedMetric] ?? 0).toFixed(1)}`,
    );
    const activePathD = activePoints.length > 0 ? `M ${activePoints.join(" L ")}` : "";

    const currentX = getX(currentIndex);
    const currentY = getY(currentVal);
    const isUnderAttack = currentRow?.label === 1;

    return (
      <div className="relative w-full border-2 border-rule bg-[#050508] select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 sm:h-52 cursor-crosshair block"
          onClick={handleSvgInteraction}
        >
          <defs>
            <linearGradient id="activeTraceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={isUnderAttack ? "#ff3b30" : "#bfff2e"}
                stopOpacity="0.35"
              />
              <stop
                offset="100%"
                stopColor={isUnderAttack ? "#ff3b30" : "#bfff2e"}
                stopOpacity="0.0"
              />
            </linearGradient>
            <pattern
              id="hazardHatch"
              width="8"
              height="8"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke="#ff3b30" strokeWidth="2" opacity="0.3" />
            </pattern>
          </defs>

          {/* Grid rules */}
          <line
            x1={0}
            y1={padding}
            x2={width}
            y2={padding}
            stroke="#1f1f23"
            strokeDasharray="3 3"
          />
          <line
            x1={0}
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke="#1f1f23"
            strokeDasharray="3 3"
          />
          <line
            x1={0}
            y1={height - padding}
            x2={width}
            y2={height - padding}
            stroke="#1f1f23"
            strokeDasharray="3 3"
          />

          {/* Attack Window Red Shading */}
          {telemetryRows.map((r, i) => {
            if (r.label === 1) {
              const xPos = getX(i);
              const barW = Math.max(2, (width - 2 * padding) / telemetryRows.length);
              return (
                <rect
                  key={`atk-${i}`}
                  x={xPos}
                  y={padding}
                  width={barW}
                  height={height - 2 * padding}
                  fill="url(#hazardHatch)"
                />
              );
            }
            return null;
          })}

          {/* Subtle baseline curve (shows full historical trajectory) */}
          <path
            d={fullPathD}
            fill="none"
            stroke="#27272a"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />

          {/* Active progressive telemetry stream curve */}
          {activePoints.length > 1 && (
            <path
              d={activePathD}
              fill="none"
              stroke={isUnderAttack ? "#ff3b30" : "#bfff2e"}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Current Scanhead line */}
          <line
            x1={currentX}
            y1={padding}
            x2={currentX}
            y2={height - padding}
            stroke={isUnderAttack ? "#ff3b30" : "#00f0ff"}
            strokeWidth={1.5}
            strokeDasharray="2 2"
          />

          {/* Live pulsing sensor head at current position */}
          <circle
            cx={currentX}
            cy={currentY}
            r={5}
            fill={isUnderAttack ? "#ff3b30" : "#bfff2e"}
            stroke="#000"
            strokeWidth={2}
          />
          <circle
            cx={currentX}
            cy={currentY}
            r={8}
            fill="none"
            stroke={isUnderAttack ? "#ff3b30" : "#bfff2e"}
            strokeWidth={1.5}
            className="animate-ping"
          />

          {/* Y-Axis Value Labels directly on SVG */}
          <text
            x={padding + 4}
            y={padding + 12}
            fill="#71717a"
            fontSize="10"
            fontFamily="monospace"
          >
            MAX {chartMax.toFixed(2)} {activeConfig.unit}
          </text>
          <text
            x={padding + 4}
            y={height / 2 - 4}
            fill="#52525b"
            fontSize="9"
            fontFamily="monospace"
          >
            MID {midVal.toFixed(2)} {activeConfig.unit}
          </text>
          <text
            x={padding + 4}
            y={height - padding - 4}
            fill="#71717a"
            fontSize="10"
            fontFamily="monospace"
          >
            MIN {chartMin.toFixed(2)} {activeConfig.unit}
          </text>
        </svg>

        {/* Live Cursor Tooltip Badge */}
        <div className="absolute top-2 right-2 bg-black/90 border border-rule px-2.5 py-1 flex items-center gap-3 text-[11px] font-mono pointer-events-none">
          <span className="text-muted-foreground">
            SAMPLE #{currentIndex + 1} / {telemetryRows.length}
          </span>
          <span
            className={`font-bold ${isUnderAttack ? "text-danger animate-pulse" : "text-accent"}`}
          >
            {currentVal.toFixed(2)} {activeConfig.unit}
          </span>
          <span
            className={`px-1.5 py-0.2 text-[9px] uppercase font-bold ${isUnderAttack ? "bg-danger text-black" : "bg-accent/20 text-accent"}`}
          >
            {isUnderAttack ? "ATTACK INJECTED" : "NOMINAL"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full border-2 border-rule bg-[#09090B] text-foreground font-mono text-xs shadow-comic p-4 sm:p-6 space-y-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between border-b-2 border-rule pb-3 gap-3">
        <div className="flex items-center gap-2.5">
          <span className="size-3 bg-accent inline-block" />
          <div>
            <h3 className="font-display font-bold uppercase tracking-wider text-accent text-base sm:text-lg">
              [01 // HAICON TESTBED SENSOR REPLAY & REAL-TIME ML EVALUATION]
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Empirical HIL-augmented industrial dataset (HAI 23.05) · 54,000 samples · 87 SCADA
              sensor tags
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-card border-2 border-rule text-[10px] text-accent font-bold uppercase">
            HIL-AUGMENTED ICS v23.05
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="px-2.5 py-1 border-2 border-rule hover:border-danger text-muted-foreground hover:text-danger font-bold cursor-pointer"
            >
              [CLOSE]
            </button>
          )}
        </div>
      </div>

      {/* Attack period selector bar */}
      <div className="space-y-1.5 bg-[#111114] border-2 border-rule p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground uppercase font-bold flex items-center gap-1.5">
            <Activity className="size-3.5 text-accent" />
            SELECT EMPIRICAL ATTACK SCENARIO (14 DOCUMENTED TESTBED WINDOWS):
          </span>
          {activeAttack && (
            <span className="text-accent font-bold text-[11px]">
              PROCESS: {activeAttack.affectedProcess} · DURATION: {activeAttack.durationFormatted}
            </span>
          )}
        </div>
        <select
          value={selectedAttackIdx}
          onChange={(e) => setSelectedAttackIdx(Number(e.target.value))}
          className="w-full bg-[#18181c] border-2 border-rule px-3 py-2 text-xs text-foreground font-mono focus:border-accent outline-none cursor-pointer"
        >
          {attackPeriods.map((p) => (
            <option key={p.index} value={p.index}>
              [Attack #{p.index}] {p.affectedProcess} — {p.description} ({p.durationFormatted})
            </option>
          ))}
        </select>
      </div>

      {/* Main Expansive 2-Column Command Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Real-Time Oscilloscope & Controls (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-3">
          {/* Channel Selector Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">
              ACTIVE SCADA SENSOR CHANNEL:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {METRIC_CONFIGS.map((cfg) => {
                const isActive = selectedMetric === cfg.key;
                return (
                  <button
                    key={cfg.key}
                    type="button"
                    onClick={() => setSelectedMetric(cfg.key)}
                    className={`px-2 py-1 text-[10px] font-mono border transition-all cursor-pointer ${
                      isActive
                        ? "bg-accent text-accent-foreground border-black font-bold shadow-comic-sm"
                        : "bg-[#141418] text-foreground/70 border-rule hover:border-accent"
                    }`}
                  >
                    {cfg.sensorTag} ({cfg.label})
                  </button>
                );
              })}
            </div>
          </div>

          {/* SVG Real-time Telemetry Oscilloscope */}
          {renderSvgWaveform()}

          {/* Transport & Playback Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t-2 border-rule">
            {/* Play/Pause/Reset Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`min-h-[38px] px-4 font-bold border-2 flex items-center gap-2 transition-all cursor-pointer ${
                  isPlaying
                    ? "bg-warn text-black border-black shadow-comic-sm"
                    : "bg-accent text-black border-black shadow-comic-sm hover:bg-white"
                } btn-neo-push`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="size-3.5 fill-current" />
                    <span>PAUSE STREAM</span>
                  </>
                ) : (
                  <>
                    <Play className="size-3.5 fill-current" />
                    <span>PLAY REPLAY</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex((prev) => Math.min(telemetryRows.length - 1, prev + 5));
                }}
                className="min-h-[38px] px-3 border-2 border-rule hover:border-accent text-foreground font-bold text-xs cursor-pointer"
                title="Step forward +5 samples"
              >
                +5s STEP
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentIndex(0);
                }}
                className="min-h-[38px] px-3 border-2 border-rule hover:border-accent text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                title="Reset to sample #0"
              >
                <RotateCcw className="size-3" />
                <span>RESET</span>
              </button>
            </div>

            {/* Playback Speed & Anomaly Sigma Threshold */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">
                  SPEED:
                </span>
                {[1, 2, 5, 10].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2 py-1 border text-[11px] font-bold cursor-pointer ${
                      playbackSpeed === spd
                        ? "bg-accent text-black border-black shadow-comic-sm"
                        : "border-rule text-muted-foreground hover:text-foreground bg-[#141418]"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">
                  ANOMALY SIGMA:
                </span>
                <select
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="bg-[#141418] border-2 border-rule px-2 py-1 text-xs text-foreground font-mono focus:border-accent outline-none cursor-pointer"
                >
                  <option value={2.0}>2.0σ (Sensitive)</option>
                  <option value={2.5}>2.5σ (Default)</option>
                  <option value={3.0}>3.0σ (High Certainty)</option>
                  <option value={4.0}>4.0σ (Conservative)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Ground-Truth Evaluation Matrix (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Ground Truth Status Card */}
          <div
            className={`p-3.5 border-2 flex flex-col justify-between transition-colors shadow-comic-sm ${
              currentRow?.label === 1
                ? "bg-danger/10 border-danger text-danger"
                : "bg-accent/5 border-accent text-accent"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                PHYSICAL TRUTH STATUS
              </span>
              <span className="text-[10px] text-foreground/60 font-mono">
                {currentRow?.timestamp || "2022-08-12 16:00:00"}
              </span>
            </div>
            <div className="py-2">
              <div className="font-bold text-sm tracking-wider uppercase">
                {currentRow?.label === 1
                  ? "[!] GROUND TRUTH: CYBER ATTACK INJECTED"
                  : "[✓] NOMINAL PHYSICAL PROCESS"}
              </div>
              <p className="text-[11px] text-foreground/80 mt-1">
                {currentRow?.label === 1
                  ? "Adversary command manipulation or setpoint offset active in field actuator loop."
                  : "Normal process telemetry operating within calibrated empirical tolerance."}
              </p>
            </div>
            <div className="pt-2 border-t border-rule/60 flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">PRIMARY READING:</span>
              <span className="font-bold text-foreground">
                {currentVal.toFixed(2)} {activeConfig.unit}
              </span>
            </div>
          </div>

          {/* ML Detection Scorecard */}
          {evaluation && (
            <div className="border-2 border-rule p-3.5 bg-[#111114] space-y-3 shadow-comic-sm">
              <div className="flex items-center justify-between border-b-2 border-rule pb-2">
                <span className="text-[11px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="size-3.5" />
                  DETECTION ACCURACY SCORECARD
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {evaluation.evaluatedSamples} Samples
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="border-2 border-rule p-2 bg-black/50">
                  <span className="text-[9px] text-muted-foreground uppercase block font-bold">
                    PRECISION
                  </span>
                  <span className="text-lg font-bold text-accent font-display">
                    {(evaluation.precision * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="border-2 border-rule p-2 bg-black/50">
                  <span className="text-[9px] text-muted-foreground uppercase block font-bold">
                    RECALL
                  </span>
                  <span className="text-lg font-bold text-accent font-display">
                    {(evaluation.recall * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="border-2 border-rule p-2 bg-black/50">
                  <span className="text-[9px] text-muted-foreground uppercase block font-bold">
                    F1-SCORE
                  </span>
                  <span className="text-lg font-bold text-warn font-display">
                    {(evaluation.f1Score * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="border-2 border-rule p-2 bg-black/50">
                  <span className="text-[9px] text-muted-foreground uppercase block font-bold">
                    ACCURACY
                  </span>
                  <span className="text-lg font-bold text-foreground font-display">
                    {(evaluation.accuracy * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1 text-[10px] text-center pt-1 border-t border-rule font-mono">
                <div className="bg-black/30 p-1 border border-rule">
                  <span className="text-muted-foreground block text-[8px]">TP</span>
                  <strong className="text-accent">{evaluation.truePositives}</strong>
                </div>
                <div className="bg-black/30 p-1 border border-rule">
                  <span className="text-muted-foreground block text-[8px]">FP</span>
                  <strong className="text-warn">{evaluation.falsePositives}</strong>
                </div>
                <div className="bg-black/30 p-1 border border-rule">
                  <span className="text-muted-foreground block text-[8px]">FN</span>
                  <strong className="text-danger">{evaluation.falseNegatives}</strong>
                </div>
                <div className="bg-black/30 p-1 border border-rule">
                  <span className="text-muted-foreground block text-[8px]">TN</span>
                  <strong className="text-foreground">{evaluation.trueNegatives}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Correlated MITRE Advisory Footer */}
      {advisory && (
        <div className="p-3.5 border-2 border-accent/60 bg-accent/5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-[280px]">
            <div className="flex items-center gap-2">
              <span className="size-2 bg-accent inline-block animate-ping" />
              <span className="text-xs text-accent font-bold uppercase tracking-wider">
                [CORRELATED MITRE INCIDENT ADVISORY]:
              </span>
            </div>
            <p className="text-xs text-foreground/90 leading-snug">{advisory.summary}</p>
            {advisory.primaryTechnique && (
              <div className="text-[11px] text-muted-foreground">
                Mitigation:{" "}
                <strong className="text-foreground font-mono">
                  {advisory.primaryTechnique.mitigations[0]?.name || "Network Isolation"}
                </strong>
              </div>
            )}
          </div>
          {onApplyAdvisory && (
            <button
              onClick={() => onApplyAdvisory(advisory)}
              className="px-4 py-2 bg-accent text-black font-bold text-xs uppercase border-2 border-black shadow-comic-sm hover:bg-white transition-all cursor-pointer whitespace-nowrap btn-neo-push"
            >
              APPLY TO WAR ROOM →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
