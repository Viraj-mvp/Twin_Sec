import { useState, useEffect } from "react";

const COOKIE_CONSENT_KEY = "twinsec-cookie-consent";

type ConsentState = "accepted" | "rejected" | null;

export function CookieConsent() {
  const [consent, setConsentState] = useState<ConsentState>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Load saved preference
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (saved === "accepted" || saved === "rejected") {
        setConsentState(saved);
        return;
      }
      // Show banner after a 3 second delay
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setConsentState("accepted");
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
  };

  const handleReject = () => {
    setConsentState("rejected");
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
  };

  if (consent !== null || !showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] border border-accent bg-background/95 p-6 backdrop-blur shadow-2xl max-w-md font-mono text-xs select-none space-y-4 animate-reveal">
      <div className="flex items-center gap-2 border-b border-rule pb-2">
        <span className="size-2 bg-accent animate-pulse rounded-full" />
        <span className="mono-label text-accent font-bold">TACTICAL DIRECTIVE: COOKIE CONSENT</span>
      </div>
      <p className="text-foreground/80 leading-relaxed text-[11px]">
        TwinSec uses cookies exclusively for secure session management (HttpOnly, SameSite=Strict,
        no third-party tracking). Accepting allows you to log in, save training runs, and customize
        preferences.
      </p>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleReject}
          className="flex-1 border border-accent/40 bg-accent/5 hover:bg-accent/20 text-accent font-mono text-[10px] py-2.5 text-center transition-colors font-bold"
        >
          REJECT NON-ESSENTIAL
        </button>
        <button
          onClick={handleAccept}
          className="flex-1 bg-accent text-accent-foreground hover:bg-foreground hover:text-background font-mono text-[10px] py-2.5 text-center transition-colors font-bold"
        >
          ACCEPT ALL & ENLIST
        </button>
      </div>
    </div>
  );
}
