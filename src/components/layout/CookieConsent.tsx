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
    <div className="fixed bottom-6 right-6 z-[9999] border-2 border-accent bg-[#121214] p-6 shadow-[6px_6px_0px_0px_#000000] max-w-md font-mono text-xs select-none space-y-4 animate-reveal">
      <div className="flex items-center gap-2 border-b-2 border-rule pb-2">
        <span className="size-2 bg-accent animate-pulse" />
        <span className="mono-label text-accent font-bold">TACTICAL DIRECTIVE: COOKIE CONSENT</span>
      </div>
      <p className="text-foreground/80 leading-relaxed text-[11px]">
        TwinSec uses cookies exclusively for secure session management (HttpOnly, SameSite=Strict,
        no third-party tracking). Accepting allows you to log in, save training runs, and customize
        preferences.
      </p>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleReject}
          className="flex-1 border-2 border-accent/60 bg-accent/5 hover:bg-accent/20 text-accent font-mono text-xs py-2.5 min-h-[44px] flex items-center justify-center transition-colors font-bold cursor-pointer"
        >
          REJECT NON-ESSENTIAL
        </button>
        <button
          type="button"
          onClick={handleAccept}
          className="flex-1 bg-accent text-accent-foreground border-2 border-black hover:bg-foreground hover:text-background font-mono text-xs py-2.5 min-h-[44px] flex items-center justify-center transition-colors font-bold shadow-[2px_2px_0px_#000000] cursor-pointer"
        >
          ACCEPT ALL & ENLIST
        </button>
      </div>
    </div>
  );
}
