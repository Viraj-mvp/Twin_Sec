import React from "react";
import type { Event } from "@/data/scenarios";
import { fmt } from "@/data/scenarios";
import { PROTOCOL_MAP } from "@/data/protocol-map";

interface PacketInspectorProps {
  event: Event | null;
  t: number;
}

export const PacketInspector: React.FC<PacketInspectorProps> = ({ event, t }) => {
  const proto = event ? (PROTOCOL_MAP[event.tag] ?? PROTOCOL_MAP["LATERAL MOVEMENT"]) : null;

  if (!proto || !event) {
    return (
      <div className="border border-rule p-4 font-mono text-xs text-foreground/40 text-center">
        <p className="mb-1">PKT INSPECTOR IDLE</p>
        <p>Advance the timeline to capture a live frame.</p>
      </div>
    );
  }

  return (
    <div className="border border-rule font-mono text-xs flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-rule bg-muted/30 flex justify-between items-center">
        <span className="text-accent font-bold">{event.tag}</span>
        <span className="text-foreground/50">T+{fmt(t)}</span>
      </div>
      <div className="px-3 py-2 border-b border-rule text-foreground/60">
        <span className="text-foreground/40">PROTO · </span>
        <span className="text-foreground">{proto.proto}</span>
      </div>
      {/* Hex dump */}
      <div className="p-3 bg-black/60 space-y-1 leading-relaxed">
        {proto.hex.map((row, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-foreground/30 select-none">
              {(i * 8).toString(16).padStart(4, "0")}:
            </span>
            <span className="text-[#bfff2e] tracking-wider">{row}</span>
          </div>
        ))}
      </div>
      {/* Protocol field decode */}
      <div className="border-t border-rule p-3 space-y-1">
        <p className="text-foreground/40 mb-2 tracking-widest uppercase text-[10px]">
          Field Decode
        </p>
        {proto.fields.map((f, i) => (
          <div key={i} className="grid grid-cols-[5rem_1fr_1fr] gap-2 text-[10px]">
            <span className="text-foreground/40">{f.label}</span>
            <span className="text-foreground/60">{f.bytes}</span>
            <span className="text-[#bfff2e]">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
