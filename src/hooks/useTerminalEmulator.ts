import { useState, useRef, useCallback } from "react";

export interface UseTerminalEmulatorOptions {
  addLog?: (msg: string) => void;
  startScanNode?: (id: string) => void;
  exploitNode?: (id: string) => void;
  handleIsolate?: (id: string) => void;
  handlePatch?: (id: string) => void;
  handleTrip?: (id: string) => void;
}

export function useTerminalEmulator(options: UseTerminalEmulatorOptions = {}) {
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalMaximized, setTerminalMaximized] = useState(false);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "┌──(kali㏌twinsec)-[~/cyber-range]",
    "└─$ twinsec-cli --version",
    "TwinSec Cyber Range Terminal v3.4.0 [x86_64-linux-gnu]",
    "Type 'help' or 'commands' for available tactical commands.",
    "--------------------------------------------------",
  ]);

  // Terminal drag state (fixed position offset from bottom-right)
  const [terminalPos, setTerminalPos] = useState({ x: 24, y: 24 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    isDraggingRef.current = true;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = { x: clientX, y: clientY };

    const handleMouseMove = (ev: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const cX =
        "touches" in ev ? (ev as TouchEvent).touches[0].clientX : (ev as MouseEvent).clientX;
      const cY =
        "touches" in ev ? (ev as TouchEvent).touches[0].clientY : (ev as MouseEvent).clientY;
      const deltaX = dragStartRef.current.x - cX;
      const deltaY = dragStartRef.current.y - cY;
      dragStartRef.current = { x: cX, y: cY };
      setTerminalPos((prev) => ({
        x: Math.max(10, Math.min(window.innerWidth - 100, prev.x + deltaX)),
        y: Math.max(10, Math.min(window.innerHeight - 100, prev.y + deltaY)),
      }));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleMouseMove);
    window.addEventListener("touchend", handleMouseUp);
  }, []);

  const addTerminalLine = useCallback((line: string) => {
    setTerminalLogs((prev) => [...prev, line]);
  }, []);

  const handleTerminalSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const raw = terminalInput.trim();
      if (!raw) return;

      addTerminalLine(`> ${raw}`);
      setTerminalInput("");

      const parts = raw.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const target = parts[1]?.toLowerCase();

      switch (cmd) {
        case "help":
        case "commands":
          addTerminalLine("AVAILABLE COMMANDS:");
          addTerminalLine("  scan <node>      - Launch port/vulnerability scan on node");
          addTerminalLine("  exploit <node>   - Execute exploit sequence against scanned node");
          addTerminalLine("  isolate <node>   - Quarantine asset on network boundary");
          addTerminalLine("  patch <node>     - Deploy integrity patch to firmware/rung");
          addTerminalLine("  trip <node>      - Manual failsafe trip (SIS/Breaker)");
          addTerminalLine("  clear            - Clear terminal output buffer");
          addTerminalLine("  status           - View active range status");
          break;

        case "clear":
          setTerminalLogs([
            "┌──(kali㏌twinsec)-[~/cyber-range]",
            "└─$ twinsec-cli --version",
            "TwinSec Cyber Range Terminal v3.4.0 [x86_64-linux-gnu]",
          ]);
          break;

        case "scan":
          if (!target) {
            addTerminalLine("ERROR: Usage: scan <node_id> (e.g. scan ews-04)");
          } else {
            addTerminalLine(`[RECON] Initiating discovery scan against ${target.toUpperCase()}...`);
            options.startScanNode?.(target);
            options.addLog?.(`[CLI] Initiated scan against target node ${target.toUpperCase()}`);
          }
          break;

        case "exploit":
          if (!target) {
            addTerminalLine("ERROR: Usage: exploit <node_id> (e.g. exploit plc-3)");
          } else {
            addTerminalLine(
              `[EXPLOIT] Executing exploit payload against ${target.toUpperCase()}...`,
            );
            options.exploitNode?.(target);
            options.addLog?.(
              `[CLI] Executed exploit sequence against node ${target.toUpperCase()}`,
            );
          }
          break;

        case "isolate":
          if (!target) {
            addTerminalLine("ERROR: Usage: isolate <node_id> (e.g. isolate switch-a)");
          } else {
            addTerminalLine(
              `[DEFEND] Quarantining network boundary for ${target.toUpperCase()}...`,
            );
            options.handleIsolate?.(target);
            options.addLog?.(
              `[CLI] Applied network isolation mitigation to ${target.toUpperCase()}`,
            );
          }
          break;

        case "patch":
          if (!target) {
            addTerminalLine("ERROR: Usage: patch <node_id> (e.g. patch plc-3)");
          } else {
            addTerminalLine(`[DEFEND] Pushing integrity patch to ${target.toUpperCase()}...`);
            options.handlePatch?.(target);
            options.addLog?.(`[CLI] Applied integrity patch mitigation to ${target.toUpperCase()}`);
          }
          break;

        case "trip":
          if (!target) {
            addTerminalLine("ERROR: Usage: trip <node_id> (e.g. trip sis)");
          } else {
            addTerminalLine(
              `[DEFEND] Executing manual failsafe trip on ${target.toUpperCase()}...`,
            );
            options.handleTrip?.(target);
            options.addLog?.(`[CLI] Executed failsafe manual trip on ${target.toUpperCase()}`);
          }
          break;

        case "status":
          addTerminalLine("SYSTEM STATUS: ONLINE");
          addTerminalLine("KALI RANGE AGENT: ACTIVE");
          addTerminalLine("AUDIT LOG ENCRYPTION: AES-256 GCM");
          break;

        default:
          addTerminalLine(`ERROR: Unknown command '${cmd}'. Type 'help' for available commands.`);
      }
    },
    [terminalInput, addTerminalLine, options],
  );

  return {
    terminalOpen,
    setTerminalOpen,
    terminalMaximized,
    setTerminalMaximized,
    terminalPos,
    isDragging: isDraggingRef.current,
    handleDragStart,
    terminalLogs,
    addTerminalLine,
    terminalInput,
    setTerminalInput,
    handleTerminalSubmit,
  };
}
