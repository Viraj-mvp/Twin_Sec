import React from "react";
import { Node } from "../../data/scenarios";
import { CVEIntelPanel } from "./CVEIntelPanel";

interface NodeDetailPanelProps {
  node: Node | null;
  nodeState?: string;
  onDefenseAction?: (action: "ISOLATE" | "PATCH" | "TRIP", nodeId: string) => void;
  onClose?: () => void;
}

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  node,
  nodeState = "INACTIVE",
  onDefenseAction,
  onClose,
}) => {
  if (!node) {
    return (
      <div className="border border-rule p-4 bg-muted/10 font-mono text-xs text-foreground/40 flex items-center justify-center h-full min-h-[200px]">
        Select an asset from the topology map to view telemetry, CVE advisories, and mitigation
        controls.
      </div>
    );
  }

  return (
    <div className="space-y-3 font-mono">
      <div className="border border-rule p-4 bg-black/90 text-xs space-y-4 relative">
        <div className="flex items-center justify-between border-b border-rule pb-2">
          <div className="flex items-center gap-2">
            <span className="text-accent font-bold text-sm">{node.label}</span>
            <span className="text-[10px] text-foreground/40">({node.kind})</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] px-2 py-0.5 font-bold uppercase border ${
                nodeState === "EXPLOITED"
                  ? "bg-red-500/20 text-red-400 border-red-500/40"
                  : nodeState === "TARGETED"
                    ? "bg-warn/20 text-warn border-warn/40"
                    : nodeState === "DEFENDED" || nodeState === "ISOLATED"
                      ? "bg-accent/20 text-accent border-accent/40"
                      : "bg-muted text-foreground/60 border-rule"
              }`}
            >
              {nodeState}
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-foreground/40 hover:text-accent text-[10px] px-1 border border-transparent hover:border-rule"
              >
                [CLOSE]
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div>
            <span className="text-[9px] text-foreground/40 block">VENDOR / HW</span>
            <span className="text-foreground font-bold">{node.vendor}</span>
          </div>
          <div>
            <span className="text-[9px] text-foreground/40 block">FIRMWARE</span>
            <span className="text-foreground font-bold">{node.firmware}</span>
          </div>
          <div>
            <span className="text-[9px] text-foreground/40 block">EXPOSURE ZONE</span>
            <span className="text-accent font-bold">{node.exposure}</span>
          </div>
          <div>
            <span className="text-[9px] text-foreground/40 block">AFFECTED TAGS</span>
            <span className="text-foreground/80">{node.affects.join(", ")}</span>
          </div>
        </div>

        {/* Defense Control Action Buttons */}
        <div className="pt-2 border-t border-rule/50 space-y-2">
          <span className="text-[9px] text-accent font-bold uppercase block">
            MITIGATION CONTROLS:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onDefenseAction?.("ISOLATE", node.id)}
              className="border border-rule py-1.5 text-[10px] font-bold text-foreground/80 hover:border-accent hover:text-accent transition-colors cursor-pointer"
            >
              ISOLATE [AIRGAP]
            </button>
            <button
              type="button"
              onClick={() => onDefenseAction?.("PATCH", node.id)}
              className="border border-rule py-1.5 text-[10px] font-bold text-foreground/80 hover:border-accent hover:text-accent transition-colors cursor-pointer"
            >
              PATCH [FIRMWARE]
            </button>
            <button
              type="button"
              onClick={() => onDefenseAction?.("TRIP", node.id)}
              className="border border-danger/40 py-1.5 text-[10px] font-bold text-red-400 hover:bg-danger hover:text-black transition-colors cursor-pointer"
            >
              TRIP [FAILSAFE]
            </button>
          </div>
        </div>
      </div>

      {/* CVE Intelligence Sub-Panel */}
      <CVEIntelPanel nodeId={node.id} nodeLabel={node.label} />
    </div>
  );
};
