import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getOperatorSession, logoutOperator, type OperatorSession } from "@/lib/api/auth.functions";
import { log } from "@/lib/logger";

interface OperatorContextType {
  operator: OperatorSession | null;
  loading: boolean;
  refresh: () => void;
  logout: () => Promise<void>;
}

const OperatorContext = createContext<OperatorContextType>({
  operator: null,
  loading: true,
  refresh: () => {},
  logout: async () => {},
});

export function OperatorProvider({ children }: { children: ReactNode }) {
  const [operator, setOperator] = useState<OperatorSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    getOperatorSession()
      .then((op) => setOperator(op))
      .catch((err) => {
        log.error("Failed to fetch operator session:", err);
        setOperator({
          callsign: "GUEST OPERATOR",
          badgeId: "OP-0000",
          clearance: "UNCLASSIFIED",
          role: "guest",
          loggedIn: false,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();

    const handleUpdate = () => {
      refresh();
    };
    window.addEventListener("twinsec-session-updated", handleUpdate);
    return () => window.removeEventListener("twinsec-session-updated", handleUpdate);
  }, [refresh]);

  const handleLogout = useCallback(async () => {
    setOperator({
      callsign: "GUEST OPERATOR",
      badgeId: "OP-0000",
      clearance: "UNCLASSIFIED",
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

  return (
    <OperatorContext.Provider
      value={{
        operator,
        loading,
        refresh,
        logout: handleLogout,
      }}
    >
      {children}
    </OperatorContext.Provider>
  );
}

export const useOperator = () => useContext(OperatorContext);
