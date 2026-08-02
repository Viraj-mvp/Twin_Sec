/**
 * EventStoreContext.tsx
 *
 * React state context providing components with access to the immutable event log,
 * active playhead timestamp t, time-travel controls, and timeline branch forks.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { EventStore, SimEventRecord, globalEventStore } from "../lib/simulation/event-store";
import { propagateCausalCascade } from "../lib/simulation/causal-engine";

interface EventStoreContextValue {
  eventStore: EventStore;
  currentTime: number;
  activeBranchId: string;
  events: SimEventRecord[];
  activeEvents: SimEventRecord[];
  setCurrentTime: (t: number) => void;
  recordEvent: (event: Omit<SimEventRecord, "eventId">, sector?: string) => SimEventRecord;
  forkTimeline: (forkTime: number, label: string) => string;
  switchBranch: (branchId: string) => void;
  resetTimeline: () => void;
}

const EventStoreContext = createContext<EventStoreContextValue | undefined>(undefined);

export function EventStoreProvider({ children }: { children: React.ReactNode }) {
  const [eventStore] = useState<EventStore>(globalEventStore);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeBranchId, setActiveBranchId] = useState<string>("main");
  const [logRevision, setLogRevision] = useState<number>(0);

  const events = useMemo(() => {
    void logRevision;
    return eventStore.getEvents(undefined, activeBranchId);
  }, [eventStore, activeBranchId, logRevision]);

  const activeEvents = useMemo(() => {
    void logRevision;
    return eventStore.getEvents(currentTime, activeBranchId);
  }, [eventStore, activeBranchId, currentTime, logRevision]);

  const recordEvent = useCallback(
    (event: Omit<SimEventRecord, "eventId">, sector: string = "power") => {
      const recorded = eventStore.append({ ...event, branchId: activeBranchId });

      // Auto-propagate causal cascade downstream if event is high severity
      if (event.severity === "HIGH" || event.severity === "CRITICAL") {
        const cascade = propagateCausalCascade(sector, recorded);
        cascade.propagatedEvents.forEach((pe) => {
          eventStore.append({ ...pe, branchId: activeBranchId });
        });
      }

      setLogRevision((r) => r + 1);
      return recorded;
    },
    [eventStore, activeBranchId],
  );

  const forkTimeline = useCallback(
    (forkTime: number, label: string) => {
      const newBranch = eventStore.forkBranch(forkTime, label, activeBranchId);
      setActiveBranchId(newBranch);
      setLogRevision((r) => r + 1);
      return newBranch;
    },
    [eventStore, activeBranchId],
  );

  const switchBranch = useCallback((branchId: string) => {
    setActiveBranchId(branchId);
    setLogRevision((r) => r + 1);
  }, []);

  const resetTimeline = useCallback(() => {
    eventStore.clear();
    setCurrentTime(0);
    setActiveBranchId("main");
    setLogRevision((r) => r + 1);
  }, [eventStore]);

  const value = useMemo(
    () => ({
      eventStore,
      currentTime,
      activeBranchId,
      events,
      activeEvents,
      setCurrentTime,
      recordEvent,
      forkTimeline,
      switchBranch,
      resetTimeline,
    }),
    [
      eventStore,
      currentTime,
      activeBranchId,
      events,
      activeEvents,
      recordEvent,
      forkTimeline,
      switchBranch,
      resetTimeline,
    ],
  );

  return <EventStoreContext.Provider value={value}>{children}</EventStoreContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEventStore() {
  const ctx = useContext(EventStoreContext);
  if (!ctx) {
    throw new Error("useEventStore must be used within an EventStoreProvider");
  }
  return ctx;
}
