/**
 * DirectorEngine.ts
 *
 * Autonomous background director engine for TwinSec Cyber Range.
 * Listens to the real-time simulation event stream and automatically orchestrates
 * GSAP camera moves (dolly-in, pan, whip-pan), node spotlights, and documentary cuts
 * without requiring manual mode controls from the user.
 */

import gsap from "gsap";
import { SimEventRecord } from "./event-store";

export interface DirectorTarget {
  nodeId: string;
  x: number;
  y: number;
  zoomLevel: number;
  reason: string;
}

export interface DirectorState {
  activeTarget: DirectorTarget | null;
  spotlightPos: { x: number; y: number };
  cameraTransform: { x: number; y: number; scale: number; rotateZ: number };
  lastCutTimestamp: number;
}

export class DirectorEngine {
  private state: DirectorState = {
    activeTarget: null,
    spotlightPos: { x: 0, y: 0 },
    cameraTransform: { x: 0, y: 0, scale: 1, rotateZ: -45 },
    lastCutTimestamp: 0,
  };

  private listeners: Array<(state: DirectorState) => void> = [];

  public subscribe(fn: (state: DirectorState) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn({ ...this.state }));
  }

  /**
   * Automatically process a new event in background and direct camera focus
   */
  public onSimulationEvent(
    event: SimEventRecord,
    nodePositions: Record<string, { x: number; y: number }>,
    containerEl?: HTMLElement | null,
  ): void {
    const nodePos = nodePositions[event.sourceAssetId];
    if (!nodePos) return;

    const target: DirectorTarget = {
      nodeId: event.sourceAssetId,
      x: nodePos.x,
      y: nodePos.y,
      zoomLevel: event.severity === "CRITICAL" ? 1.3 : event.severity === "HIGH" ? 1.15 : 1.05,
      reason: event.title,
    };

    this.state.activeTarget = target;

    // Animate spotlight position in background
    if (containerEl) {
      const rect = containerEl.getBoundingClientRect();
      const targetX = (nodePos.x / 100) * rect.width;
      const targetY = (nodePos.y / 100) * rect.height;

      gsap.to(this.state.spotlightPos, {
        x: targetX,
        y: targetY,
        duration: 0.6,
        ease: "power2.out",
        onUpdate: () => this.notify(),
      });
    }

    // Execute autonomous camera pan/dolly tween
    gsap.to(this.state.cameraTransform, {
      x: -nodePos.x * 0.3,
      y: -nodePos.y * 0.3,
      scale: target.zoomLevel,
      duration: 0.8,
      ease: "power2.inOut",
      onUpdate: () => this.notify(),
      onComplete: () => {
        // Return to establishing framing after 2.5 seconds
        gsap.to(this.state.cameraTransform, {
          x: 0,
          y: 0,
          scale: 1,
          duration: 1.2,
          delay: 2.5,
          ease: "power2.out",
          onUpdate: () => this.notify(),
        });
      },
    });

    this.notify();
  }

  /**
   * Execute establishing shot on phase change
   */
  public triggerEstablishingShot(targetEl?: HTMLElement | null): void {
    gsap.fromTo(
      this.state.cameraTransform,
      { scale: 0.85, rotateZ: -65 },
      {
        scale: 1,
        rotateZ: -45,
        x: 0,
        y: 0,
        duration: 1.4,
        ease: "power3.out",
        onUpdate: () => this.notify(),
      },
    );
  }
}

export const globalDirectorEngine = new DirectorEngine();
