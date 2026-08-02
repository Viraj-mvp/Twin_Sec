/**
 * event-bus.ts
 *
 * Centralized, lightweight event bus for the TwinSec event-driven attack engine.
 * Decouples attack scenario simulation events from UI rendering components.
 */

export type AttackEventType =
  | "attack.start"
  | "attack.pause"
  | "attack.resume"
  | "attack.complete"
  | "attack.state_change"
  | "terminal.command"
  | "terminal.output"
  | "network.node"
  | "network.edge"
  | "graph.highlight"
  | "metric.update"
  | "log.add"
  | "alert.create"
  | "popup.show"
  | "hint.show"
  | "timeline.marker"
  | "ai.explanation"
  | "recommendation.show"
  | "node.compromised"
  | "node.isolated"
  | "node.patched"
  | "node.recovered";

export interface AttackEvent<T = unknown> {
  id: string;
  time: number; // T+ seconds in simulation clock
  type: AttackEventType;
  payload: T;
  source?: string;
  timestamp?: number;
}

export type EventCallback<T = unknown> = (event: AttackEvent<T>) => void;

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private globalListeners: Set<EventCallback> = new Set();
  private eventHistory: AttackEvent[] = [];

  /**
   * Subscribe to a specific attack event type.
   */
  public subscribe<T = unknown>(
    eventType: AttackEventType,
    callback: EventCallback<T>,
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    const set = this.listeners.get(eventType)!;
    set.add(callback as EventCallback);

    return () => {
      set.delete(callback as EventCallback);
      if (set.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  }

  /**
   * Subscribe to all attack events.
   */
  public subscribeAll(callback: EventCallback): () => void {
    this.globalListeners.add(callback);
    return () => {
      this.globalListeners.delete(callback);
    };
  }

  /**
   * Publish an attack event to subscribers.
   */
  public publish<T = unknown>(event: AttackEvent<T>): void {
    const fullEvent: AttackEvent<T> = {
      ...event,
      timestamp: event.timestamp || Date.now(),
    };

    this.eventHistory.push(fullEvent);
    if (this.eventHistory.length > 500) {
      this.eventHistory.shift();
    }

    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      typeListeners.forEach((cb) => {
        try {
          cb(fullEvent);
        } catch (err) {
          console.error(`Error in event listener for ${event.type}:`, err);
        }
      });
    }

    this.globalListeners.forEach((cb) => {
      try {
        cb(fullEvent);
      } catch (err) {
        console.error("Error in global event listener:", err);
      }
    });
  }

  /**
   * Clear event history and all subscribers (useful for resets/restarts).
   */
  public clear(): void {
    this.eventHistory = [];
    this.listeners.clear();
    this.globalListeners.clear();
  }

  /**
   * Get history of published events.
   */
  public getHistory(): readonly AttackEvent[] {
    return this.eventHistory;
  }
}

export const attackEventBus = new EventBus();
