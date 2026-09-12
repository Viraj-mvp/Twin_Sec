/**
 * KaliTerminal.tsx
 *
 * Liquid Glass Brutalist Cyber Range CLI Terminal component.
 * Minimalist, event-driven interface with real-time operational task tracker,
 * SCADA topology status, log search & filtering, and instant command execution.
 */

import React, { useRef, useEffect, useState, useMemo } from "react";
import { attackEventBus, type AttackEvent } from "@/lib/event-bus";
import { CodeRainCanvas } from "./CodeRainCanvas";

interface KaliTerminalProps {
  terminalOpen: boolean;
  setTerminalOpen: (b: boolean) => void;
  terminalMaximized: boolean;
  setTerminalMaximized: (b: boolean) => void;
  terminalPos: { x: number; y: number };
  isDragging: boolean;
  handleDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
  terminalLogs: string[];
  terminalInput: string;
  setTerminalInput: (v: string) => void;
  handleTerminalSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  t?: number;
  compromisedCount?: number;
  isolatedCount?: number;
  patchedCount?: number;
  nodes?: Array<{ id: string; label: string; kind: string }>;
}

export const KaliTerminal: React.FC<KaliTerminalProps> = ({
  terminalOpen,
  setTerminalOpen,
  terminalMaximized,
  setTerminalMaximized,
  terminalPos,
  isDragging,
  handleDragStart,
  terminalLogs,
  terminalInput,
  setTerminalInput,
  handleTerminalSubmit,
  compromisedCount = 0,
  isolatedCount = 0,
  patchedCount = 0,
  nodes = [],
}) => {
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const [eventLogs, setEventLogs] = useState<string[]>([]);
  const [showTasks, setShowTasks] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    "ALL" | "COMMANDS" | "ALERTS" | "NODES" | "ERRORS"
  >("ALL");

  // Dynamic scenario target nodes calculation
  const targetNode1 = useMemo(() => {
    if (!nodes || nodes.length === 0) return { id: "plc-3", label: "PLC-3" };
    const n = nodes[3] || nodes[1] || nodes[0];
    return { id: n.id, label: n.label };
  }, [nodes]);

  const targetNode2 = useMemo(() => {
    if (!nodes || nodes.length === 0) return { id: "plc-7", label: "PLC-7" };
    const n = nodes[4] || nodes[2] || nodes[0];
    return { id: n.id, label: n.label };
  }, [nodes]);

  // Subscribe to Attack Event Bus for incoming command & output events
  useEffect(() => {
    const unsubCmd = attackEventBus.subscribe("terminal.command", (ev: AttackEvent) => {
      const payload = ev.payload as Record<string, string> | undefined;
      if (payload?.command) {
        setEventLogs((prev) => [...prev, `root@twinsec:~# ${payload.command}`]);
      }
    });

    const unsubOut = attackEventBus.subscribe("terminal.output", (ev: AttackEvent) => {
      const payload = ev.payload as Record<string, string> | undefined;
      if (payload?.output) {
        setEventLogs((prev) => [...prev, payload.output]);
      }
    });

    return () => {
      unsubCmd();
      unsubOut();
    };
  }, []);

  // Merge parent logs with event logs
  const displayLogs = useMemo(() => [...terminalLogs, ...eventLogs], [terminalLogs, eventLogs]);

  // Filter logs based on category and search query
  const filteredLogs = useMemo(() => {
    return displayLogs.filter((line) => {
      if (categoryFilter === "COMMANDS") {
        if (!line.startsWith("root@") && !line.startsWith("twinsec#") && !line.startsWith("┌──")) {
          return false;
        }
      } else if (categoryFilter === "ALERTS") {
        if (
          !line.includes("ALERT") &&
          !line.includes("BREACH") &&
          !line.includes("[!]") &&
          !line.includes("CRITICAL")
        ) {
          return false;
        }
      } else if (categoryFilter === "NODES") {
        const nodeMatch = nodes.some((n) => line.toLowerCase().includes(n.id.toLowerCase()));
        if (
          !nodeMatch &&
          !line.includes("plc-") &&
          !line.includes("ews-") &&
          !line.includes("hmi-")
        ) {
          return false;
        }
      } else if (categoryFilter === "ERRORS") {
        if (!line.startsWith("ERROR") && !line.includes("ERR") && !line.startsWith("[!]")) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return line.toLowerCase().includes(q);
      }

      return true;
    });
  }, [displayLogs, categoryFilter, searchQuery, nodes]);

  useEffect(() => {
    if (terminalOpen) {
      consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [filteredLogs, terminalOpen]);

  if (!terminalOpen) return null;

  return (
    <div
      style={
        terminalMaximized
          ? { left: 0, top: 0, width: "100vw", height: "100vh" }
          : { right: `${terminalPos.x}px`, bottom: `${terminalPos.y}px` }
      }
      className={`fixed z-50 bg-[#06090e]/92 backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col font-mono select-none ${
        terminalMaximized
          ? "w-screen h-screen rounded-none border-none"
          : "w-[660px] h-[480px] max-w-[95vw] max-h-[85vh]"
      } transition-[width,height,left,top] duration-200`}
    >
      {/* Liquid Glass Brutalist Window Header */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onDoubleClick={() => setTerminalMaximized(!terminalMaximized)}
        className={`bg-white/[0.04] border-b border-white/10 px-3.5 py-2 flex items-center justify-between cursor-move select-none ${
          isDragging ? "bg-white/[0.08]" : ""
        }`}
      >
        <div className="flex items-center gap-2 text-xs">
          <span className="size-2 bg-[#bfff2e] rounded-full animate-pulse" />
          <span className="text-[#bfff2e] font-bold tracking-wider">root@twinsec-cli:~#</span>
          <span className="text-foreground/30 text-[10px]">|</span>
          <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider">
            OPERATOR TERMINAL
          </span>
        </div>

        {/* Window control buttons */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            onClick={() => {
              setTerminalInput("hint");
              const fakeForm = {
                preventDefault: () => {},
              } as React.FormEvent<HTMLFormElement>;
              setTimeout(() => handleTerminalSubmit(fakeForm), 40);
            }}
            className="border border-white/20 text-foreground/80 hover:text-white hover:border-white/50 px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer"
            title="Request Tactical AI CLI Hint"
          >
            [HINT]
          </button>

          <button
            onClick={() => setShowTasks(!showTasks)}
            className={`border px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
              showTasks
                ? "bg-[#bfff2e] text-black border-[#bfff2e]"
                : "text-[#bfff2e] border-[#bfff2e]/40 hover:bg-[#bfff2e]/10"
            }`}
            title="Toggle Exercise Operational Tasks"
          >
            [TASKS]
          </button>

          <button
            onClick={() => setTerminalMaximized(!terminalMaximized)}
            className="text-foreground/60 hover:text-white border border-white/15 px-1.5 py-0.5 text-[10px] font-bold transition-colors cursor-pointer"
            title={terminalMaximized ? "Restore Window" : "Maximize Window"}
          >
            {terminalMaximized ? "[RESTORE]" : "[MAX]"}
          </button>
          <button
            onClick={() => setTerminalOpen(false)}
            className="text-danger hover:bg-danger/20 border border-danger/30 px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer"
            title="Close Terminal"
          >
            [X]
          </button>
        </div>
      </div>

      {/* Operational Task HUD & Topology Status Bar */}
      <div className="bg-white/[0.02] border-b border-white/10 px-3.5 py-1.5 flex items-center justify-between gap-2 font-mono text-[10.5px]">
        <div className="flex items-center gap-2.5">
          <span className="text-accent font-bold uppercase tracking-wider text-[10px]">
            TOPOLOGY HUD:
          </span>
          <span className="text-foreground/70 text-[10px]">[NOMINAL]</span>
          <span
            className={`text-[10px] ${
              compromisedCount > 0 ? "text-danger font-bold animate-pulse" : "text-foreground/50"
            }`}
          >
            [BREACHED: {compromisedCount}]
          </span>
          <span className="text-[#00f0ff] text-[10px]">[AIR-GAP: {isolatedCount}]</span>
          <span className="text-[#10b981] text-[10px]">[PATCHED: {patchedCount}]</span>
        </div>
        <span className="text-foreground/40 hidden sm:inline text-[9.5px]">CLI ACTIVE</span>
      </div>

      {/* Log Search & Category Filter Toolbar */}
      <div className="bg-black/40 border-b border-white/10 px-3.5 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-[#bfff2e] font-bold">[SEARCH]:</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter logs (e.g. plc-3, scan, exploit)..."
            className="flex-1 bg-white/[0.03] border border-white/15 text-[#bfff2e] px-2 py-0.5 text-[10px] focus:outline-none focus:border-[#bfff2e] placeholder-foreground/30 font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-foreground/40 hover:text-white text-[10px] px-1 cursor-pointer"
            >
              [X]
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {(["ALL", "COMMANDS", "ALERTS", "NODES", "ERRORS"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-1.5 py-0.5 text-[9.5px] font-bold border transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? "bg-[#bfff2e] text-black border-[#bfff2e]"
                  : "bg-white/[0.02] text-foreground/60 border-white/10 hover:border-white/30 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="text-foreground/40 text-[9.5px] ml-1">
            [{filteredLogs.length}/{displayLogs.length}]
          </span>
        </div>
      </div>

      {/* Interactive Operational Task Objectives Dropdown Panel */}
      {showTasks && (
        <div className="bg-[#0b0e14] border-b border-white/15 p-3 space-y-1.5 font-mono text-[11px] text-foreground/90 animate-fade-in">
          <p className="text-[#bfff2e] font-bold text-[10px] uppercase tracking-wider mb-1">
            EXERCISE TASKS & CONTAINMENT OBJECTIVES:
          </p>
          <div className="grid grid-cols-1 gap-1 text-[10.5px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <span>[1] Execute 'scan' to map SCADA nodes</span>
              <button
                type="button"
                onClick={() => {
                  setTerminalInput("scan");
                  const fakeForm = {
                    preventDefault: () => {},
                  } as React.FormEvent<HTMLFormElement>;
                  setTimeout(() => handleTerminalSubmit(fakeForm), 40);
                }}
                className="text-[#bfff2e] hover:underline text-[9.5px] cursor-pointer font-bold"
              >
                RUN 'scan' →
              </button>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <span>[2] ACT: Execute Setpoint Override on {targetNode1.label}</span>
              <button
                type="button"
                onClick={() => {
                  setTerminalInput("decide d1 act");
                  const fakeForm = {
                    preventDefault: () => {},
                  } as React.FormEvent<HTMLFormElement>;
                  setTimeout(() => handleTerminalSubmit(fakeForm), 40);
                }}
                className="text-accent hover:underline text-[9.5px] cursor-pointer font-bold"
              >
                EXECUTE ACT →
              </button>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <span>[3] DEFEND: Air-Gap & Firmware Patch {targetNode1.label}</span>
              <button
                type="button"
                onClick={() => {
                  setTerminalInput("decide d1 defend");
                  const fakeForm = {
                    preventDefault: () => {},
                  } as React.FormEvent<HTMLFormElement>;
                  setTimeout(() => handleTerminalSubmit(fakeForm), 40);
                }}
                className="text-[#00f0ff] hover:underline text-[9.5px] cursor-pointer font-bold"
              >
                EXECUTE DEFEND →
              </button>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <span>[4] Isolate compromised {targetNode1.label} via air-gap</span>
              <button
                type="button"
                onClick={() => {
                  setTerminalInput(`isolate ${targetNode1.id}`);
                  const fakeForm = {
                    preventDefault: () => {},
                  } as React.FormEvent<HTMLFormElement>;
                  setTimeout(() => handleTerminalSubmit(fakeForm), 40);
                }}
                className="text-[#bfff2e] hover:underline text-[9.5px] cursor-pointer font-bold"
              >
                RUN 'isolate {targetNode1.id}' →
              </button>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <span>[5] Apply firmware cryptographic patch to {targetNode1.label}</span>
              <button
                type="button"
                onClick={() => {
                  setTerminalInput(`patch ${targetNode1.id}`);
                  const fakeForm = {
                    preventDefault: () => {},
                  } as React.FormEvent<HTMLFormElement>;
                  setTimeout(() => handleTerminalSubmit(fakeForm), 40);
                }}
                className="text-[#bfff2e] hover:underline text-[9.5px] cursor-pointer font-bold"
              >
                RUN 'patch {targetNode1.id}' →
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span>[6] Query live telemetry state & containment</span>
              <button
                type="button"
                onClick={() => {
                  setTerminalInput("status");
                  const fakeForm = {
                    preventDefault: () => {},
                  } as React.FormEvent<HTMLFormElement>;
                  setTimeout(() => handleTerminalSubmit(fakeForm), 40);
                }}
                className="text-[#bfff2e] hover:underline text-[9.5px] cursor-pointer font-bold"
              >
                RUN 'status' →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Console Output Area with CodeRain Canvas */}
      <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-1 text-xs relative bg-[#040609]/95 overflow-hidden font-mono">
        <CodeRainCanvas />

        {/* Contrast overlay */}
        <div className="absolute inset-0 bg-[#040609]/80 backdrop-blur-[0.5px] pointer-events-none z-0" />

        <div className="flex-1 space-y-1 relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          {filteredLogs.map((line, i) => {
            const isErr =
              line.startsWith("ERROR") || line.includes("ERR") || line.startsWith("[!]");
            const isOk =
              line.startsWith("OK") ||
              line.startsWith("[+]") ||
              line.startsWith("RECON") ||
              line.startsWith("EXPLOIT") ||
              line.startsWith("DEFEND");
            const isCommandInput =
              line.startsWith("root@") || line.startsWith("twinsec#") || line.startsWith("┌──");
            return (
              <div
                key={i}
                className={`leading-relaxed whitespace-pre-wrap ${
                  isCommandInput
                    ? "text-[#bfff2e] font-bold"
                    : isErr
                      ? "text-[#f7768e] font-semibold"
                      : isOk
                        ? "text-[#73daca]"
                        : "text-foreground/80"
                }`}
              >
                {line}
              </div>
            );
          })}
          <div ref={consoleEndRef} />
        </div>

        {/* Quick Guided Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/10 z-10 text-[10px]">
          <span className="text-[#bfff2e] font-bold uppercase mr-1 text-[9.5px]">COMMANDS:</span>
          {[
            { label: "SCAN", cmd: "scan" },
            {
              label: `ATTACK ${targetNode1.label}`,
              cmd: `attack ${targetNode1.id}`,
            },
            {
              label: `ISOLATE ${targetNode1.label}`,
              cmd: `isolate ${targetNode1.id}`,
            },
            { label: `PATCH ${targetNode1.label}`, cmd: `patch ${targetNode1.id}` },
            {
              label: `OVERRIDE ${targetNode2.label}`,
              cmd: `override ${targetNode2.id}`,
            },
            { label: "AI-EXPLAIN", cmd: "ai-explain" },
            { label: "SIGMA", cmd: "sigma" },
            { label: "DRILL", cmd: "drill" },
            { label: "STATUS", cmd: "status" },
            { label: "HELP", cmd: "help" },
            { label: "CLEAR", cmd: "clear" },
          ].map((action) => (
            <button
              key={action.cmd}
              type="button"
              onClick={() => {
                setTerminalInput(action.cmd);
                const fakeForm = {
                  preventDefault: () => {},
                } as React.FormEvent<HTMLFormElement>;
                setTimeout(() => handleTerminalSubmit(fakeForm), 40);
              }}
              className="bg-white/[0.04] hover:bg-[#bfff2e] hover:text-black text-[#bfff2e] border border-[#bfff2e]/30 px-2 py-0.5 font-mono font-bold transition-colors cursor-pointer text-[9.5px]"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Streamlined Minimalist Input Bar */}
      <form
        onSubmit={handleTerminalSubmit}
        className="bg-white/[0.03] border-t border-white/10 px-3.5 py-2 flex items-center gap-2 z-10 font-mono text-xs"
      >
        <span className="text-[#bfff2e] font-bold shrink-0">root@twinsec:~#</span>
        <input
          type="text"
          value={terminalInput}
          onChange={(e) => setTerminalInput(e.target.value)}
          placeholder="attack <node> | isolate <node> | patch <node> | scan | drill | status | help"
          className="flex-1 bg-transparent border-none text-[#bfff2e] font-mono text-xs focus:outline-none placeholder-foreground/30"
          autoFocus
        />
        <button
          type="submit"
          className="border border-[#bfff2e] bg-[#bfff2e] text-black font-bold px-3 py-1 text-[10px] hover:bg-white transition-colors cursor-pointer shrink-0 uppercase tracking-wider"
        >
          EXECUTE
        </button>
      </form>
    </div>
  );
};

export const TerminalFAB: React.FC<{
  isOpen: boolean;
  onToggle: () => void;
}> = ({ isOpen, onToggle }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`fixed bottom-6 right-6 z-50 size-13 border-3 border-black flex items-center justify-center transition-all active:translate-x-[2px] active:translate-y-[2px] cursor-pointer ${
        isOpen
          ? "bg-[#EF4444] text-white shadow-[4px_4px_0px_0px_#000000] hover:bg-red-600"
          : "bg-[#BFFF2E] text-black shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] hover:bg-lime-300"
      }`}
      title={isOpen ? "Close Tactical CLI Terminal" : "Open Tactical CLI Terminal"}
      aria-label="Toggle Tactical CLI Terminal"
    >
      <span className="font-mono font-black text-sm">{isOpen ? "✕" : ">_"}</span>
    </button>
  );
};
