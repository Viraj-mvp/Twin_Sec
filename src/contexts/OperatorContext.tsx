import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getOperatorSession, logoutOperator, type OperatorSession } from "@/lib/api/auth.functions";
import { savePreferences, type UserPreferences } from "@/lib/auth-store";
import { getGuestRuns } from "@/lib/guest-store";
import { log } from "@/lib/logger";

interface OperatorContextType {
  operator: OperatorSession | null;
  loading: boolean;
  isGuest: boolean;
  guestRunsCount: number;
  refresh: () => void;
  logout: () => Promise<void>;
}

const OperatorContext = createContext<OperatorContextType>({
  operator: null,
  loading: true,
  isGuest: true,
  guestRunsCount: 0,
  refresh: () => {},
  logout: async () => {},
});

export function OperatorProvider({ children }: { children: ReactNode }) {
  const [operator, setOperator] = useState<OperatorSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestRunsCount, setGuestRunsCount] = useState(0);

  const updateGuestCount = useCallback(() => {
    setGuestRunsCount(getGuestRuns().length);
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    updateGuestCount();
    getOperatorSession()
      .then((op) => {
        setOperator(op);
        if (op.loggedIn && op.preferences) {
          savePreferences(op.preferences as unknown as UserPreferences);
        }
      })
      .catch((err) => {
        log.error("Failed to fetch operator session:", err);
        setOperator({
          callsign: "GUEST OPERATOR",
          badgeId: "OP-0000",
          clearance: "UNCLASSIFIED · GUEST AUDIT",
          role: "guest",
          loggedIn: false,
        });
      })
      .finally(() => setLoading(false));
  }, [updateGuestCount]);

  useEffect(() => {
    refresh();

    const handleUpdate = () => {
      refresh();
    };
    const handleGuestUpdate = () => {
      updateGuestCount();
    };

    window.addEventListener("twinsec-session-updated", handleUpdate);
    window.addEventListener("twinsec-guest-updated", handleGuestUpdate);
    return () => {
      window.removeEventListener("twinsec-session-updated", handleUpdate);
      window.removeEventListener("twinsec-guest-updated", handleGuestUpdate);
    };
  }, [refresh, updateGuestCount]);

  const handleLogout = useCallback(async () => {
    setOperator({
      callsign: "GUEST OPERATOR",
      badgeId: "OP-0000",
      clearance: "UNCLASSIFIED · GUEST AUDIT",
      role: "guest",
      loggedIn: false,
    });
    try {
      await logoutOperator();
      window.dispatchEvent(new Event("twinsec-session-updated"));
    } catch (err) {
      log.error("Logout failed:", err);
    }
  }, []);

  const isGuest = !operator || !operator.loggedIn;

  return (
    <OperatorContext.Provider
      value={{
        operator,
        loading,
        isGuest,
        guestRunsCount,
        refresh,
        logout: handleLogout,
      }}
    >
      {children}
    </OperatorContext.Provider>
  );
}

export const useOperator = () => useContext(OperatorContext);
