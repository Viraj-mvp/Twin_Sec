import { useState, useCallback, useEffect, useRef } from "react";

// ponytail: types were in deleted Simulation3D — inlined here
export type NodeState = "inactive" | "scanning" | "exploited" | "defended";
export type EdgeState = "idle" | "scanning" | "exploiting" | "defending";

type SimulationPhase = "recon" | "exploit" | "defend" | "review";

type SimulationNode = {
  id: string;
  label: string;
  kind: string;
  position: [number, number, number];
  state: NodeState;
};

type SimulationEdge = {
  from: string;
  to: string;
  state: EdgeState;
};

export function useAttackSimulation(
  initialNodes: SimulationNode[],
  initialEdges: SimulationEdge[],
) {
  const [nodes, setNodes] = useState<SimulationNode[]>(initialNodes);
  const [edges, setEdges] = useState<SimulationEdge[]>(initialEdges);
  const [phase, setPhase] = useState<SimulationPhase>("recon");
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset simulation
  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setNodes(
      initialNodes.map((n) => ({
        ...n,
        state: "inactive" as NodeState,
      })),
    );
    setEdges(
      initialEdges.map((e) => ({
        ...e,
        state: "idle" as EdgeState,
      })),
    );
    setPhase("recon");
    setIsPlaying(false);
  }, [initialNodes, initialEdges]);

  // Step through simulation
  const step = useCallback(() => {
    setNodes((prev) => {
      const newNodes = [...prev];
      const firstInactive = newNodes.findIndex((n) => n.state === "inactive");
      if (firstInactive !== -1) {
        newNodes[firstInactive] = {
          ...newNodes[firstInactive],
          state: phase === "recon" ? "scanning" : phase === "exploit" ? "exploited" : "defended",
        };
      }
      return newNodes;
    });

    setEdges((prev) => {
      const newEdges = [...prev];
      const firstIdle = newEdges.findIndex((e) => e.state === "idle");
      if (firstIdle !== -1) {
        newEdges[firstIdle] = {
          ...newEdges[firstIdle],
          state: phase === "recon" ? "scanning" : phase === "exploit" ? "exploiting" : "defending",
        };
      }
      return newEdges;
    });
  }, [phase]);

  // Play/Pause simulation
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        step();
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, step]);

  return {
    nodes,
    edges,
    phase,
    setPhase,
    isPlaying,
    setIsPlaying,
    reset,
    step,
  };
}
