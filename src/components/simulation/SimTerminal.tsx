import React, { useEffect, useRef, useState } from "react";

export type TerminalLine = {
  kind: "in" | "out" | "ok" | "err";
  text: string;
};

interface SimTerminalProps {
  lines: TerminalLine[];
  onCommand: (cmd: string) => void;
  hint?: string;
  className?: string;
}

export const SimTerminal: React.FC<SimTerminalProps> = ({
  lines,
  onCommand,
  hint,
  className = "",
}) => {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;
    setHistory((prev) => [...prev, cmd]);
    setHistIdx(-1);
    setInput("");
    onCommand(cmd);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(nextIdx);
      setInput(history[nextIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx === -1) return;
      const nextIdx = histIdx + 1;
      if (nextIdx >= history.length) {
        setHistIdx(-1);
        setInput("");
      } else {
        setHistIdx(nextIdx);
        setInput(history[nextIdx]);
      }
    }
  };

  const lineClass = (kind: TerminalLine["kind"]) => {
    switch (kind) {
      case "ok":
        return "text-[#bfff2e] font-semibold";
      case "err":
        return "text-danger font-semibold";
      case "in":
        return "text-warn font-semibold";
      case "out":
      default:
        return "text-foreground/80";
    }
  };

  const quickCmds = ["help", "status", "ai-explain", "surfaces", "pera", "trip", "reset"];

  return (
    <div
      className={`border-2 border-rule bg-[#07070a] text-foreground flex flex-col font-mono text-xs shadow-comic ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b-2 border-rule px-4 py-2 bg-card/40 select-none">
        <div className="flex items-center gap-2">
          <span className="size-2 bg-accent animate-pulse-dot" />
          <span className="mono-label text-[10px] text-foreground/70">
            TWINSEC CYBER-PHYSICAL RANGE CLI // 2.4-STABLE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="mono-label text-[10px] text-foreground/50 hidden sm:inline">
            BUFFER: {lines.length} LINES
          </span>
        </div>
      </div>

      {/* Quick Action Pills */}
      <div className="flex flex-wrap gap-1.5 p-2.5 border-b border-rule bg-card/10 select-none">
        <span className="mono-label text-[9px] text-foreground/40 self-center mr-1">QUICK:</span>
        {quickCmds.map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCommand(cmd);
            }}
            className="px-2 py-0.5 border border-rule hover:border-accent hover:text-accent transition-colors text-[10px] mono-label"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Output Stream */}
      <div className="h-64 sm:h-72 lg:h-80 overflow-y-auto p-3.5 space-y-1 select-text scrollbar-thin">
        {lines.map((l, i) => (
          <div key={i} className={`leading-relaxed break-words ${lineClass(l.kind)}`}>
            {l.kind === "in" ? "> " : ""}
            {l.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input Prompt Form */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center border-t-2 border-rule bg-card/30 p-2.5"
      >
        <span className="text-accent font-bold mr-2 select-none">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="type a command (e.g. scan ews-04, isolate plc-3, help, ai-explain)..."
          className="flex-1 bg-transparent text-foreground placeholder:text-foreground/30 focus:outline-none font-mono text-xs"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <button
          type="submit"
          className="mono-label border border-rule px-3 py-1 text-[10px] hover:border-accent hover:text-accent transition-colors ml-2 shrink-0"
        >
          EXECUTE ↵
        </button>
      </form>

      {/* Hint Footer */}
      {hint && (
        <div className="px-3 py-1.5 border-t border-rule bg-card/20 text-[10px] text-foreground/60 flex items-center justify-between">
          <span className="truncate">HINT: {hint}</span>
          <span className="mono-label text-[9px] text-accent shrink-0 ml-2">PRESS TAB / ENTER</span>
        </div>
      )}
    </div>
  );
};
