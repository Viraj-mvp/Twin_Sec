/**
 * timeline-engine.ts
 *
 * Attack Timeline Engine that drives scenario simulation events asynchronously.
 * Manages attack state machine, playback controls (Play/Pause/Seek/Speed),
 * and dispatches structured attack events to the centralized EventBus.
 */

import { attackEventBus, type AttackEvent } from "@/lib/event-bus";
import type {
  AttackScenario,
  AttackLifecycleState,
  StructuredAttackEvent,
} from "@/simulation/scenarios/types";
import { useCallback, useEffect, useRef, useState } from "react";

export class AttackTimelineEngine {
  private scenario: AttackScenario;
  private currentTime: number = 0;
  private isPlaying: boolean = false;
  private speed: number = 60;
  private currentState: AttackLifecycleState = "Idle";
  private processedEventIds: Set<string> = new Set();
  private timerRef: number | null = null;
  private lastSystemTime: number | null = null;

  constructor(scenario: AttackScenario) {
    this.scenario = scenario;
  }

  public setScenario(scenario: AttackScenario): void {
    this.scenario = scenario;
    this.reset();
  }

  public start(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastSystemTime = performance.now();
    attackEventBus.publish({
      id: `system-start-${Date.now()}`,
      time: this.currentTime,
      type: "attack.start",
      payload: { state: this.currentState, scenarioId: this.scenario.id },
    });
  }

  public pause(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.lastSystemTime = null;
    attackEventBus.publish({
      id: `system-pause-${Date.now()}`,
      time: this.currentTime,
      type: "attack.pause",
      payload: { state: this.currentState },
    });
  }

  public resume(): void {
    this.start();
  }

  public togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.start();
    }
  }

  public reset(): void {
    this.pause();
    this.currentTime = 0;
    this.currentState = "Idle";
    this.processedEventIds.clear();
    attackEventBus.publish({
      id: `system-reset-${Date.now()}`,
      time: 0,
      type: "attack.state_change",
      payload: { state: "Idle" },
    });
  }

  public seek(targetTime: number): void {
    const clamped = Math.max(0, Math.min(this.scenario.duration, targetTime));
    const wasPlaying = this.isPlaying;
    if (wasPlaying) this.pause();

    this.currentTime = clamped;

    // Recalculate processed events up to targetTime
    this.processedEventIds.clear();
    let highestState: AttackLifecycleState = "Idle";

    this.scenario.events.forEach((ev) => {
      if (ev.time <= clamped) {
        this.processedEventIds.add(ev.id);
        if (ev.lifecycleState) highestState = ev.lifecycleState;
      }
    });

    this.currentState = highestState;

    attackEventBus.publish({
      id: `system-seek-${Date.now()}`,
      time: clamped,
      type: "timeline.marker",
      payload: { time: clamped, state: this.currentState },
    });

    if (wasPlaying) this.start();
  }

  public setSpeed(multiplier: number): void {
    this.speed = Math.max(1, Math.min(500, multiplier));
  }

  public getSpeed(): number {
    return this.speed;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentState(): AttackLifecycleState {
    return this.currentState;
  }

  /**
   * Advance simulation clock by dt seconds and publish any newly reached scenario events.
   */
  public tick(dtSeconds: number): void {
    if (!this.isPlaying) return;

    const prevTime = this.currentTime;
    this.currentTime = Math.min(this.scenario.duration, prevTime + dtSeconds * this.speed);

    // Process events crossed during this tick
    for (const ev of this.scenario.events) {
      if (ev.time <= this.currentTime && !this.processedEventIds.has(ev.id)) {
        this.processedEventIds.add(ev.id);
        this.emitStructuredEvent(ev);
      }
    }

    // Check completion
    if (this.currentTime >= this.scenario.duration && prevTime < this.scenario.duration) {
      this.isPlaying = false;
      this.currentState = "Recovery";
      attackEventBus.publish({
        id: `system-complete-${Date.now()}`,
        time: this.currentTime,
        type: "attack.complete",
        payload: { scenarioId: this.scenario.id },
      });
    }
  }

  private emitStructuredEvent(ev: StructuredAttackEvent): void {
    if (ev.lifecycleState && ev.lifecycleState !== this.currentState) {
      this.currentState = ev.lifecycleState;
      attackEventBus.publish({
        id: `state-${ev.id}`,
        time: ev.time,
        type: "attack.state_change",
        payload: { state: ev.lifecycleState },
      });
    }

    // Publish primary event
    attackEventBus.publish({
      id: ev.id,
      time: ev.time,
      type: ev.type,
      payload: ev.payload,
    });

    // Secondary sub-events for components subscribing to specific sub-channels
    if (ev.payload.command) {
      attackEventBus.publish({
        id: `cmd-${ev.id}`,
        time: ev.time,
        type: "terminal.command",
        payload: { command: ev.payload.command, node: ev.node },
      });
    }

    if (ev.payload.output) {
      attackEventBus.publish({
        id: `out-${ev.id}`,
        time: ev.time,
        type: "terminal.output",
        payload: { output: ev.payload.output, node: ev.node },
      });
    }

    if (ev.payload.logEntry) {
      attackEventBus.publish({
        id: `log-${ev.id}`,
        time: ev.time,
        type: "log.add",
        payload: ev.payload.logEntry,
      });
    }

    if (ev.payload.popupHint) {
      attackEventBus.publish({
        id: `hint-${ev.id}`,
        time: ev.time,
        type: "popup.show",
        payload: ev.payload.popupHint,
      });
    }

    if (ev.payload.aiExplanation) {
      attackEventBus.publish({
        id: `ai-${ev.id}`,
        time: ev.time,
        type: "ai.explanation",
        payload: ev.payload.aiExplanation,
      });
    }
  }
}

/**
 * React hook to bind AttackTimelineEngine to local component state.
 */
export function useAttackTimelineEngine(initialScenario: AttackScenario) {
  const [scenario, setScenario] = useState<AttackScenario>(initialScenario);
  const engineRef = useRef<AttackTimelineEngine | null>(null);
  const [t, setT] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(60);
  const [state, setState] = useState<AttackLifecycleState>("Idle");

  if (!engineRef.current) {
    engineRef.current = new AttackTimelineEngine(initialScenario);
  }

  const updateScenario = useCallback((nextScenario: AttackScenario) => {
    setScenario(nextScenario);
    engineRef.current?.setScenario(nextScenario);
    setT(0);
    setPlaying(false);
    setState("Idle");
  }, []);

  // Animation frame loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (engineRef.current && engineRef.current.getIsPlaying()) {
        engineRef.current.tick(dt);
        setT(engineRef.current.getCurrentTime());
        setState(engineRef.current.getCurrentState());
        setPlaying(engineRef.current.getIsPlaying());
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const play = useCallback(() => {
    engineRef.current?.start();
    setPlaying(true);
  }, []);

  const pause = useCallback(() => {
    engineRef.current?.pause();
    setPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    engineRef.current?.togglePlay();
    setPlaying(!!engineRef.current?.getIsPlaying());
  }, []);

  const seek = useCallback((targetTime: number) => {
    engineRef.current?.seek(targetTime);
    setT(engineRef.current?.getCurrentTime() ?? targetTime);
    setState(engineRef.current?.getCurrentState() ?? "Idle");
  }, []);

  const changeSpeed = useCallback((newSpeed: number) => {
    engineRef.current?.setSpeed(newSpeed);
    setSpeed(newSpeed);
  }, []);

  const restart = useCallback(() => {
    engineRef.current?.reset();
    engineRef.current?.start();
    setT(0);
    setPlaying(true);
    setState("Idle");
  }, []);

  return {
    scenario,
    updateScenario,
    t,
    playing,
    speed,
    state,
    play,
    pause,
    togglePlay,
    seek,
    changeSpeed,
    restart,
    engine: engineRef.current,
  };
}
