import React, { useRef, useEffect } from "react";

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
}) => {
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalOpen) {
      consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs, terminalOpen]);

  if (!terminalOpen) return null;

  return (
    <div
      style={
        terminalMaximized
          ? { left: 0, top: 0, width: "100vw", height: "100vh" }
          : { right: `${terminalPos.x}px`, bottom: `${terminalPos.y}px` }
      }
      className={`fixed z-50 bg-[#0f1419]/95 backdrop-blur-md border border-[#1f2335] shadow-2xl rounded-lg overflow-hidden flex flex-col font-mono select-none ${
        terminalMaximized
          ? "w-screen h-screen rounded-none"
          : "w-[560px] h-[380px] max-w-[94vw] max-h-[82vh]"
      } transition-[width,height,left,top] duration-200`}
    >
      {/* Kali Header / Window Title Bar */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onDoubleClick={() => setTerminalMaximized(!terminalMaximized)}
        className={`bg-[#14191f] border-b border-[#222831] px-4 py-2 flex items-center justify-between cursor-move select-none ${
          isDragging ? "bg-[#1f2530]" : ""
        }`}
      >
        <div className="flex items-center gap-2 text-xs">
          <svg className="size-3 text-[#00f0ff] fill-current animate-pulse" viewBox="0 0 100 100">
            <path d="M50 10 L80 40 L65 50 L85 80 L50 90 L15 80 L35 50 L20 40 Z" />
          </svg>
          <span className="text-[#c0caf5] font-bold">┌──(kali㏌twinsec)-[~/cyber-range]</span>
        </div>

        {/* Window control buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTerminalOpen(false)}
            className="text-[#9699a6] hover:text-[#f7768e] text-xs font-bold transition-colors w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-500/10 cursor-pointer"
            title="Close"
          >
            ✕
          </button>
          <button
            onClick={() => setTerminalMaximized(!terminalMaximized)}
            className="text-[#9699a6] hover:text-[#73daca] text-[9px] font-bold transition-colors w-4 h-4 flex items-center justify-center rounded-full hover:bg-green-500/10 cursor-pointer"
            title={terminalMaximized ? "Restore" : "Maximize"}
          >
            ⛶
          </button>
          <button
            onClick={() => setTerminalOpen(false)}
            className="text-[#9699a6] hover:text-[#e0af68] text-xs font-bold transition-colors w-4 h-4 flex items-center justify-center rounded-full hover:bg-yellow-500/10 cursor-pointer"
            title="Minimize"
          >
            —
          </button>
        </div>
      </div>

      {/* Console Output Area */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-1 text-[11px] relative bg-black/40">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
          <svg className="size-48 fill-current text-white" viewBox="0 0 100 100" aria-hidden="true">
            <path d="M50 5 C30 25 15 45 15 65 C15 80 30 95 50 95 C70 95 85 80 85 65 C85 45 70 25 50 15 M50 35 L70 55 L60 60 L75 75 L50 82 L25 75 L40 60 L30 55 Z" />
          </svg>
        </div>

        <div className="flex-1 space-y-1 z-10">
          {terminalLogs.map((line, i) => {
            const isErr = line.startsWith("ERROR") || line.includes("ERR");
            const isOk =
              line.startsWith("OK") ||
              line.startsWith("RECON") ||
              line.startsWith("EXPLOIT") ||
              line.startsWith("DEFEND") ||
              line.includes("✓");
            const isCommandInput = line.startsWith("> ");
            return (
              <div
                key={i}
                className={`leading-relaxed whitespace-pre-wrap ${
                  isCommandInput
                    ? "text-[#73daca] font-bold"
                    : isErr
                      ? "text-[#f7768e] font-semibold"
                      : isOk
                        ? "text-[#9ece6a]"
                        : "text-[#c0caf5]/80"
                }`}
              >
                {line}
              </div>
            );
          })}
          <div ref={consoleEndRef} />
        </div>

        {/* Quick Guided Command Pills for Node Manipulation */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#1f2530] z-10 text-[9.5px]">
          <span className="text-[#9699a6] font-bold uppercase mr-1">⚡ GUIDED ACTIONS:</span>
          {[
            "scan ews-04",
            "exploit ews-04",
            "scan hist",
            "exploit hist",
            "patch plc-3",
            "isolate switch-a",
            "trip sis",
            "guide",
          ].map((cmd) => (
            <button
              key={cmd}
              type="button"
              onClick={() => {
                setTerminalInput(cmd);
                const fakeForm = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
                setTimeout(() => handleTerminalSubmit(fakeForm), 50);
              }}
              className="bg-[#192330] hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 px-2 py-0.5 rounded-none font-mono font-bold transition-colors cursor-pointer"
            >
              ▶ {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Kali-style CLI input bar */}
      <form
        onSubmit={handleTerminalSubmit}
        className="bg-[#0f1419] border-t border-[#222831] px-4 py-2.5 flex items-center gap-2 z-10"
      >
        <div className="flex flex-col text-[10px] select-none leading-none">
          <span className="text-[#73daca]">┌──(kali㏌twinsec)-[~/cyber-range]</span>
          <span className="text-[#f7768e] flex items-center gap-1">
            └─<span className="text-[#00f0ff] font-bold">$</span>
          </span>
        </div>
        <input
          type="text"
          value={terminalInput}
          onChange={(e) => setTerminalInput(e.target.value)}
          placeholder="scan <node> / exploit <node> / patch <node> / isolate <node> / trip <node> / help"
          className="flex-1 bg-transparent border-none text-[#c0caf5] font-mono text-xs focus:outline-none placeholder-[#9699a6]/30"
          autoFocus
        />
        <button
          type="submit"
          className="mono-label border border-accent/30 text-accent px-3 py-1 text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
        >
          EXEC
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
      aria-label="Toggle Cyber Range CLI Terminal"
    >
      <div className="relative flex items-center justify-center">
        <span className="font-mono font-bold text-sm text-accent">CLI</span>
        <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-accent animate-ping" />
        <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-accent" />
      </div>
    </button>
  );
};
