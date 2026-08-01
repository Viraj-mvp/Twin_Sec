import { useState, useEffect } from "react";
import { getOperatorSession, logoutOperator } from "./api/auth.functions";
import { log } from "@/lib/logger";

export type SectorId =
  "power" | "water" | "oil-gas" | "manufacturing" | "port" | "smart-building" | "smart-city";

export interface UserPreferences {
  theme: "neon" | "amber" | "monochrome";
  radarSound: boolean;
  hapticFeedback: boolean;
  defaultSector: SectorId;
  siemAutoExport: boolean;
}

export interface OperatorSession {
  id?: string;
  callsign: string;
  badgeId: string;
  clearance: string;
  role?: string;
  loggedIn: boolean;
}

const DEFAULT_PREFS: UserPreferences = {
  theme: "neon",
  radarSound: true,
  hapticFeedback: true,
  defaultSector: "power",
  siemAutoExport: false,
};

const DEFAULT_SESSION: OperatorSession = {
  callsign: "GUEST OPERATOR",
  badgeId: "OP-0000",
  clearance: "UNCLASSIFIED",
  loggedIn: false,
};

const SESSION_STORAGE_KEY = "twinsec-session";

export function getLocalSession(): OperatorSession {
  if (typeof window === "undefined") return DEFAULT_SESSION;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_SESSION;
  } catch {
    return DEFAULT_SESSION;
  }
}

export function saveLocalSession(session: OperatorSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("twinsec-session-updated"));
}

export function removeLocalSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
  window.dispatchEvent(new Event("twinsec-session-updated"));
}

export function getPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem("twinsec-prefs");
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePreferences(prefs: UserPreferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem("twinsec-prefs", JSON.stringify(prefs));
  window.dispatchEvent(new Event("twinsec-prefs-updated"));
}

// React hooks to reactively read state
export function usePreferences() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS);

  useEffect(() => {
    // Safely load on client side after mount to prevent SSR hydration mismatch
    setPrefs(getPreferences());
    const handleUpdate = () => setPrefs(getPreferences());
    window.addEventListener("twinsec-prefs-updated", handleUpdate);
    return () => window.removeEventListener("twinsec-prefs-updated", handleUpdate);
  }, []);

  const updatePrefs = (newPrefs: Partial<UserPreferences>) => {
    const next = { ...prefs, ...newPrefs };
    savePreferences(next);
  };

  return [prefs, updatePrefs] as const;
}

export function useOperatorSession() {
  const [session, setSession] = useState<OperatorSession>(DEFAULT_SESSION);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await getOperatorSession();
      if (res && res.loggedIn) {
        setSession(res);
        saveLocalSession(res);
      } else {
        removeLocalSession();
        setSession(DEFAULT_SESSION);
      }
    } catch {
      removeLocalSession();
      setSession(DEFAULT_SESSION);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();

    // Listen for custom trigger to update sessions reactively
    const handleUpdate = () => {
      const local = getLocalSession();
      setSession(local);
    };
    window.addEventListener("twinsec-session-updated", handleUpdate);
    return () => window.removeEventListener("twinsec-session-updated", handleUpdate);
  }, []);

  const triggerUpdate = () => {
    window.dispatchEvent(new Event("twinsec-session-updated"));
  };

  const logout = async () => {
    setSession(DEFAULT_SESSION);
    removeLocalSession();
    try {
      await logoutOperator();
      triggerUpdate();
    } catch (err) {
      log.error("Logout failed", err);
    }
  };

  return { session, loading, logout, refresh: fetchSession };
}
