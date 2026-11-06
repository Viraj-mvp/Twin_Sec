/**
 * Guest Mode Store & Policy Engine
 * Manages client-side storage of training runs, PDF trial downloads,
 * and guest state isolation in TwinSec.
 */

export interface GuestTrainingRun {
  id: string;
  timestamp: string;
  createdAt: string;
  sector: string;
  adversary: string;
  branch: string;
  mwShed: number;
  score: number;
  shareUrl: string;
  mttd: string;
  mttr: string;
  cost: string;
  isolatedNodes: string[];
  attackType: string;
  adversaryProfile: string;
  attackChain: string;
  isGuestRun: true;
}

const GUEST_RUNS_KEY = "twinsec-guest-ledger";
const GUEST_PDF_DOWNLOAD_KEY = "twinsec-guest-pdf-downloaded";

/**
 * Get all guest training runs saved in localStorage
 */
export function getGuestRuns(): GuestTrainingRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_RUNS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save a new drill run to guest localStorage (capped at 25 runs)
 */
export function saveGuestRun(run: Omit<GuestTrainingRun, "isGuestRun">): GuestTrainingRun {
  if (typeof window === "undefined") {
    return { ...run, isGuestRun: true };
  }
  const fullRun: GuestTrainingRun = {
    ...run,
    isGuestRun: true,
  };
  try {
    const existing = getGuestRuns();
    // Keep most recent first, max 25 runs
    const updated = [fullRun, ...existing.filter((r) => r.id !== run.id)].slice(0, 25);
    localStorage.setItem(GUEST_RUNS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("twinsec-guest-updated"));
  } catch (e) {
    console.error("Failed to save guest run to localStorage:", e);
  }
  return fullRun;
}

/**
 * Delete a specific guest run from localStorage
 */
export function removeGuestRun(runId: string) {
  if (typeof window === "undefined") return;
  try {
    const existing = getGuestRuns();
    const updated = existing.filter((r) => r.id !== runId);
    localStorage.setItem(GUEST_RUNS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("twinsec-guest-updated"));
  } catch (e) {
    console.error("Failed to remove guest run:", e);
  }
}

/**
 * Clear all guest runs (e.g. after successful migration to operator account)
 */
export function clearGuestRuns() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GUEST_RUNS_KEY);
    window.dispatchEvent(new Event("twinsec-guest-updated"));
  } catch (e) {
    console.error("Failed to clear guest runs:", e);
  }
}

/**
 * Check if the guest has already used their 1-time sample PDF download
 */
export function canGuestDownloadPdf(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const count = parseInt(localStorage.getItem(GUEST_PDF_DOWNLOAD_KEY) || "0", 10);
    return count < 1;
  } catch {
    return true;
  }
}

/**
 * Get current guest PDF download count
 */
export function getGuestPdfDownloadCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(localStorage.getItem(GUEST_PDF_DOWNLOAD_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

/**
 * Record that a guest used their sample PDF download
 */
export function recordGuestPdfDownload() {
  if (typeof window === "undefined") return;
  try {
    const current = getGuestPdfDownloadCount();
    localStorage.setItem(GUEST_PDF_DOWNLOAD_KEY, (current + 1).toString());
    window.dispatchEvent(new Event("twinsec-guest-updated"));
  } catch (e) {
    console.error("Failed to record guest PDF download:", e);
  }
}

/**
 * Reset guest download counts (e.g. for testing or on logout)
 */
export function resetGuestDownloadQuota() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GUEST_PDF_DOWNLOAD_KEY);
    window.dispatchEvent(new Event("twinsec-guest-updated"));
  } catch (e) {
    console.error("Failed to reset guest download quota:", e);
  }
}
