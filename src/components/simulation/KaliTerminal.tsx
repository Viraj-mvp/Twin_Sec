/**
 * KaliTerminal.tsx
 *
 * Minimalist Brutalist Cyber Range CLI Terminal component.
 * Event-driven CLI interface with real-time operational task tracker,
 * SCADA topology status, and instant command execution.
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
}) => {
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const [eventLogs, setEventLogs] = useState<string[]>([]);
  const [showTasks, setShowTasks] = useState(false);

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

  useEffect(() => {
    if (terminalOpen) {
      consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayLogs, terminalOpen]);

  if (!terminalOpen) return null;

  return (
    <div
      style={
        terminalMaximized
          ? { left: 0, top: 0, width: "100vw", height: "100vh" }
          : { right: `${terminalPos.x}px`, bottom: `${terminalPos.y}px` }
      }
      className={`fixed z-50 bg-[#090b0e]/95 backdrop-blur-md border border-[#bfff2e]/30 shadow-[0_0_30px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col font-mono select-none ${
        terminalMaximized
          ? "w-screen h-screen rounded-none border-none"
          : "w-[620px] h-[450px] max-w-[95vw] max-h-[85vh]"
      } transition-[width,height,left,top] duration-200`}
    >
      {/* Brutalist Window Header */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onDoubleClick={() => setTerminalMaximized(!terminalMaximized)}
        className={`bg-[#0c0f14] border-b border-rule px-3.5 py-2 flex items-center justify-between cursor-move select-none ${
          isDragging ? "bg-[#141922]" : ""
        }`}
      >
        <div className="flex items-center gap-2 text-xs">
          <span className="size-2 bg-[#bfff2e] rounded-full animate-pulse" />
          <span className="text-[#bfff2e] font-bold tracking-wider">root@twinsec-cli:~#</span>
          <span className="text-foreground/40 text-[10px]">|</span>
          <span className="text-[10px] font-bold text-foreground/70 uppercase">
            OPERATOR TERMINAL
          </span>
        </div>

        {/* Window control buttons */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setShowTasks(!showTasks)}
            className={`border px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
              showTasks
                ? "bg-[#bfff2e] text-black border-[#bfff2e]"
                : "text-[#bfff2e] border-[#bfff2e]/40 hover:bg-[#bfff2e]/20"
            }`}
            title="Toggle Exercise Operational Tasks"
          >
            📋 TASKS
          </button>

          <button
            onClick={() => setTerminalMaximized(!terminalMaximized)}
            className="text-foreground/60 hover:text-accent border border-rule px-1.5 py-0.5 text-[10px] font-bold transition-colors cursor-pointer"
            title={terminalMaximized ? "Restore Window" : "Maximize Window"}
          >
            {terminalMaximized ? "🗗" : "⛶"}
          </button>
          <button
            onClick={() => setTerminalOpen(false)}
            className="text-danger hover:bg-danger/20 border border-danger/40 px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer"
            title="Close Terminal"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Operational Task HUD & Topology Status Bar */}
      <div className="bg-[#0f131a] border-b border-rule px-3.5 py-1.5 flex items-center justify-between gap-2 font-mono text-[10.5px]">
        <div className="flex items-center gap-3">
          <span className="text-accent font-bold uppercase">TOPOLOGY HUD:</span>
          <span className="text-foreground/80">🟢 Nominal</span>
          <span className={compromisedCount > 0 ? "text-danger font-bold animate-pulse" : ""}>
            🔴 {compromisedCount} Compromised
          </span>
          <span className="text-[#00f0ff]">🛡️ {isolatedCount} Isolated</span>
          <span className="text-[#73daca]">🔧 {patchedCount} Patched</span>
        </div>
        <span className="text-foreground/50 hidden sm:inline text-[9.5px]">CLI ACTIVE</span>
      </div>

      {/* Interactive Operational Task Objectives Dropdown Panel */}
      {showTasks && (
        <div className="bg-[#0b0e13] border-b border-[#bfff2e]/30 p-3 space-y-1.5 font-mono text-[11px] text-foreground/90 animate-fade-in">
          <p className="text-[#bfff2e] font-bold text-[10px] uppercase tracking-wider mb-1">
            EXERCISE TASKS & CONTAINMENT OBJECTIVES:
          </p>
          <div className="grid grid-cols-1 gap-1 text-[10.5px]">
            <div className="flex items-center justify-between border-b border-rule/40 pb-1">
              <span>[1] Execute 'scan' to map SCADA nodes</span>
              <button
                type="button"
                onClick={() => {
                  setTerminalInput("scan");
                  const fakeForm = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
                  setTimeout(() => handleTerminalSubmit(fakeForm), 40);
                }}
                className="text-[#bfff2e] hover:underline text-[9.5px] cursor-pointer"
              >
                RUN 'scan' →
              </button>
            </div>
            <div className="flex items-center justify-between border-b border-rule/40 pb-1">
              <span>[2] Isolate compromised PLC-3 via air-gap</span>
              <button
                type="button"
                onClick={() => {
                  setTerminalInput("isolate plc-3");
                  const fakeForm = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
                  setTimeout(() => handleTerminalSubmit(fakeForm), 40);
                }}
                className="text-[#bfff2e] hover:underline text-[9.5px] cursor-pointer"
              >
                RUN 'isolate plc-3' →
              </button>
            </div>
            <div className="flex items-center justify-between border-b border-rule/40 pb-1">
              <span>[3] Apply firmware cryptographic patch to PLC-3</span>
              <button
                type="button"
                onClick={() => {
                  setTerminalInput("patch plc-3");
                  const fakeForm = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
                  setTimeout(() => handleTerminalSubmit(fakeForm), 40);
                }}
                className="text-[#bfff2e] hover:underline text-[9.5px] cursor-pointer"
              >
                RUN 'patch plc-3' →
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span>[4] Query live telemetry state & containment</span>
              <button
                type="button"
                onClick={() => {
                  setTerminalInput("status");
                  const fakeForm = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
                  setTimeout(() => handleTerminalSubmit(fakeForm), 40);
                }}
                className="text-[#bfff2e] hover:underline text-[9.5px] cursor-pointer"
              >
                RUN 'status' →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Console Output Area with CodeRain Canvas */}
      <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-1 text-xs relative bg-[#090b0e] overflow-hidden font-mono">
        <CodeRainCanvas />

        {/* Contrast overlay */}
        <div className="absolute inset-0 bg-[#090b0e]/85 backdrop-blur-[0.5px] pointer-events-none z-0" />

        <div className="flex-1 space-y-1 relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          {displayLogs.map((line, i) => {
            const isErr =
              line.startsWith("ERROR") || line.includes("ERR") || line.startsWith("[!]");
            const isOk =
              line.startsWith("OK") ||
              line.startsWith("[+]") ||
              line.startsWith("RECON") ||
              line.startsWith("EXPLOIT") ||
              line.startsWith("DEFEND") ||
              line.includes("✓");
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
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-rule z-10 text-[10px]">
          <span className="text-[#bfff2e] font-bold uppercase mr-1">COMMANDS:</span>
          {[
            { label: "⚡ SCAN", cmd: "scan" },
            { label: "🛡️ ISOLATE PLC-3", cmd: "isolate plc-3" },
            { label: "🔧 PATCH PLC-3", cmd: "patch plc-3" },
            { label: "⚡ OVERRIDE PLC-7", cmd: "override plc-7" },
            { label: "📊 STATUS", cmd: "status" },
            { label: "❓ HELP", cmd: "help" },
            { label: "🧹 CLEAR", cmd: "clear" },
          ].map((action) => (
            <button
              key={action.cmd}
              type="button"
              onClick={() => {
                setTerminalInput(action.cmd);
                const fakeForm = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
                setTimeout(() => handleTerminalSubmit(fakeForm), 40);
              }}
              className="bg-[#12161f] hover:bg-[#bfff2e] hover:text-black text-[#bfff2e] border border-[#bfff2e]/40 px-2 py-0.5 font-mono font-bold transition-colors cursor-pointer"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Streamlined Minimalist Input Bar */}
      <form
        onSubmit={handleTerminalSubmit}
        className="bg-[#0c0f14] border-t border-rule px-3.5 py-2 flex items-center gap-2 z-10 font-mono text-xs"
      >
        <span className="text-[#bfff2e] font-bold shrink-0">root@twinsec:~#</span>
        <input
          type="text"
          value={terminalInput}
          onChange={(e) => setTerminalInput(e.target.value)}
          placeholder="scan / isolate <node> / patch <node> / override <node> / status / help"
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
      onClick={onToggle}
      className={`fixed bottom-6 right-6 z-50 size-14 rounded-full bg-black border-2 border-accent text-accent shadow-[4px_4px_0px_0px_rgba(191,255,46,0.6)] flex items-center justify-center transition-all hover:scale-110 hover:shadow-[6px_6px_0px_0px_rgba(191,255,46,1)] cursor-pointer ${
        isOpen ? "ring-2 ring-accent" : ""
      }`}
      title={isOpen ? "Close Cyber Range CLI Terminal" : "Open Cyber Range CLI Terminal"}
    >
      <span className="font-mono font-bold text-sm">{isOpen ? "✕" : ">_"}</span>
    </button>
  );
};
