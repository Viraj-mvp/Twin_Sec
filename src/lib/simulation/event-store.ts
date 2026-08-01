/**
 * event-store.ts
 *
 * Immutable event store for the TwinSec Cyber-Physical Digital-Twin Engine.
 * All simulation state changes are recorded as append-only immutable event records,
 * enabling frame-accurate replay, time-travel, forensic auditing, and branching timelines.
 */

export type SimEventType =
  | "RECON_SCAN"
  | "EXPLOIT_PAYLOAD"
  | "SETPOINT_CHANGE"
  | "TELEMETRY_ANOMALY"
  | "DEFENSE_INTERVENTION"
  | "PHYSICAL_CASCADE"
  | "SIS_TRIP";

export interface SimEventRecord {
  eventId: string;
  timestamp: number; // Simulation time t (seconds)
  type: SimEventType;
  sourceAssetId: string;
  targetAssetId?: string;
  parentEventId?: string; // Causal link chain tracking predecessor event
  severity: "INFO" | "WARN" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  data: Record<string, unknown>;
  branchId?: string; // Timeline branch identifier (default: "main")
}

export interface TimelineBranch {
  branchId: string;
  parentBranchId?: string;
  forkTimestamp: number;
  label: string;
}

export class EventStore {
  private events: SimEventRecord[] = [];
  private branches: Map<string, TimelineBranch> = new Map();

  constructor() {
    this.branches.set("main", {
      branchId: "main",
      forkTimestamp: 0,
      label: "Main Incident Timeline",
    });
  }

  /**
   * Append an immutable event record to the log
   */
  public append(event: Omit<SimEventRecord, "eventId">): SimEventRecord {
    const newEvent: SimEventRecord = {
      ...event,
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      branchId: event.branchId ?? "main",
    };
    this.events.push(newEvent);
    return newEvent;
  }

  /**
   * Get all events in chronological order up to timestamp `maxTime`
   */
  public getEvents(maxTime?: number, branchId: string = "main"): SimEventRecord[] {
    return this.events
      .filter(
        (e) =>
          (e.branchId ?? "main") === branchId && (maxTime === undefined || e.timestamp <= maxTime),
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get all events for a specific target or source asset
   */
  public getEventsForAsset(assetId: string): SimEventRecord[] {
    return this.events.filter((e) => e.sourceAssetId === assetId || e.targetAssetId === assetId);
  }

  /**
   * Trace causal predecessor chain for a given event ID
   */
  public traceCausalChain(eventId: string): SimEventRecord[] {
    const chain: SimEventRecord[] = [];
    let currentId: string | undefined = eventId;

    while (currentId) {
      const event = this.events.find((e) => e.eventId === currentId);
      if (!event) break;
      chain.unshift(event);
      currentId = event.parentEventId;
    }

    return chain;
  }

  /**
   * Fork a new "What-If" timeline branch from timestamp `forkTime`
   */
  public forkBranch(
    forkTime: number,
    branchLabel: string,
    parentBranchId: string = "main",
  ): string {
    const newBranchId = `branch_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    this.branches.set(newBranchId, {
      branchId: newBranchId,
      parentBranchId,
      forkTimestamp: forkTime,
      label: branchLabel,
    });

    // Copy historical events up to forkTime into the new branch
    const historicEvents = this.getEvents(forkTime, parentBranchId);
    historicEvents.forEach((ev) => {
      this.events.push({
        ...ev,
        eventId: `evt_fork_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        branchId: newBranchId,
      });
    });

    return newBranchId;
  }

  /**
   * Clear or reset event store
   */
  public clear(): void {
    this.events = [];
    this.branches.clear();
    this.branches.set("main", {
      branchId: "main",
      forkTimestamp: 0,
      label: "Main Incident Timeline",
    });
  }
}

export const globalEventStore = new EventStore();
