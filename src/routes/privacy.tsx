import { createFileRoute, Link } from "@tanstack/react-router";
import { useOperatorSession } from "@/lib/auth-store";
import { TwinSecLogo } from "@/components/TwinSecLogo";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "TwinSec — Classified Privacy Policy & Compliance Directive" },
      {
        name: "description",
        content:
          "Data protection protocols, subject rights, and statutory compliance declarations for the TwinSec Cyber Range.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { session } = useOperatorSession();

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col relative select-none">
      {/* Background blueprint details */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute inset-0 scanline pointer-events-none opacity-45" />

      {/* Header bar */}
      <header className="sticky top-0 z-50 border-b border-rule bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <TwinSecLogo className="size-6" />
            <Link
              to="/"
              className="display text-xl tracking-wide hover:text-accent transition-colors"
            >
              TwinSec
            </Link>
            <span className="mono-label hidden md:inline pl-3">COMPLIANCE HUB</span>
          </div>
          <div className="flex items-center gap-6 mono-label text-xs">
            <Link to="/" className="hover:text-accent transition-colors">
              HOME
            </Link>
            <Link
              to="/simulation"
              search={{ sector: "power" }}
              className="hover:text-accent transition-colors"
            >
              CYBER RANGE
            </Link>
            {session.loggedIn ? (
              <Link to="/dashboard" className="hover:text-accent transition-colors">
                DASHBOARD
              </Link>
            ) : (
              <Link
                to="/login"
                search={{ from: undefined }}
                className="hover:text-accent transition-colors"
              >
                LOGIN
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <section className="flex-1 max-w-[1000px] mx-auto w-full px-6 py-12 relative z-10 font-mono">
        <div className="border border-rule bg-background/95 p-6 sm:p-10 backdrop-blur space-y-8">
          <div>
            <p className="mono-label text-accent text-xs">CLASSIFIED DIRECTIVE // PRIV-07</p>
            <h1 className="display text-4xl sm:text-5xl mt-2 leading-none">PRIVACY POLICY</h1>
            <p className="text-[10px] text-foreground/40 mt-2">
              LAST MODIFIED: 2026-07-10 09:00 UTC | SECURITY CLASSIFICATION: PUBLIC / COMPLIANCE
            </p>
          </div>

          <div className="space-y-6 text-xs text-foreground/80 leading-relaxed border-t border-rule pt-6">
            <div className="space-y-2">
              <h2 className="text-accent font-bold text-sm">1. OVERVIEW & PROTOCOL DECLARATION</h2>
              <p>
                This privacy policy describes how TwinSec ("we", "us", or "our") manages operator
                telemetry, badge identifiers, and simulation histories. By accessing the TwinSec
                Tactical Range simulator, you consent to the data collection and processing
                architectures defined herein.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-accent font-bold text-sm">
                2. DATA MINIMIZATION (WHAT WE COLLECT)
              </h2>
              <p>
                In compliance with international data minimization mandates, we collect only the
                necessary markers required for session security and range operational tracking:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong className="text-foreground">Operator Callsign:</strong> Used as your
                  unique account moniker.
                </li>
                <li>
                  <strong className="text-foreground">Badge ID:</strong> For clearance authorization
                  levels.
                </li>
                <li>
                  <strong className="text-foreground">Salted & Hashed Passwords:</strong> Generated
                  using client/server bcrypt controls.
                </li>
                <li>
                  <strong className="text-foreground">Simulation History:</strong> Timestamps, MTTD
                  (Mean Time to Detect), MTTR (Mean Time to React), MW Shed, and isolated nodes.
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-accent font-bold text-sm">
                3. STATUTORY COMPLIANCE DECLARATIONS
              </h2>

              <div className="border border-rule p-4 space-y-3 bg-muted/10">
                <p className="font-bold text-foreground">
                  A. GDPR (European Union General Data Protection Regulation)
                </p>
                <p className="text-[11px]">
                  Under GDPR Articles 13, 15, 17, and 20, operators are granted the right to access,
                  rectify, port, and delete their dossiers. You can perform real-time extraction
                  (JSON data portability) or request total account de-registration (right to
                  erasure/forgotten) directly inside the Operator Settings console.
                </p>
              </div>

              <div className="border border-rule p-4 space-y-3 bg-muted/10">
                <p className="font-bold text-foreground">
                  B. DPDP Act, 2023 (India Digital Personal Data Protection)
                </p>
                <p className="text-[11px]">
                  Operators are notified that personal data processing is conducted solely under
                  clear, explicit consent for training purposes. Consent can be revoked at any time
                  by executing account de-registration, triggering automatic deletion of operator
                  identities and linked simulation histories from our database logs.
                </p>
              </div>

              <div className="border border-rule p-4 space-y-3 bg-muted/10">
                <p className="font-bold text-foreground">
                  C. CCPA / CPRA (California Consumer Privacy Act, USA)
                </p>
                <p className="text-[11px]">
                  California consumers have the right to know about collected data, right to
                  correction, and right to delete. **TwinSec explicitly declares that we do NOT sell
                  or share personal information with third parties for commercial gain.**
                </p>
              </div>

              <div className="border border-rule p-4 space-y-3 bg-muted/10">
                <p className="font-bold text-foreground">
                  D. LGPD (Brazil Lei Geral de Proteção de Dados)
                </p>
                <p className="text-[11px]">
                  In accordance with LGPD Article 18, Brazilian operators have the right to
                  confirmation of processing, access, correction, anonymization, and erasure. All
                  requests can be executed directly via the operator settings.
                </p>
              </div>

              <div className="border border-rule p-4 space-y-3 bg-muted/10">
                <p className="font-bold text-foreground">
                  E. PIPEDA (Canada Personal Information Protection Act)
                </p>
                <p className="text-[11px]">
                  Canadian users are assured that all data collected is safeguarded using advanced
                  encryption, bcrypt password hashes, and HttpOnly cookie protections, with full
                  access rights available under principle 4.9.
                </p>
              </div>

              <div className="border border-rule p-4 space-y-3 bg-muted/10">
                <p className="font-bold text-foreground">
                  F. APPI (Japan Act on the Protection of Personal Information)
                </p>
                <p className="text-[11px]">
                  Japanese operators can request disclosure, correction, or deletion of retained
                  personal data. All processing is strictly confined to the defined training
                  simulation ledger.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-accent font-bold text-sm">
                4. COOKIE TRANSPORT SECURITY (CSFA & CIS)
              </h2>
              <p>
                In compliance with cyber security framework guidelines, TwinSec uses cookies solely
                for state preservation and authentication:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Cookies are flag-marked as <code className="text-accent">HttpOnly</code>,{" "}
                  <code className="text-accent">Secure</code>, and{" "}
                  <code className="text-accent">SameSite=Strict</code>.
                </li>
                <li>
                  This configuration prevents Cross-Site Scripting (XSS) extraction and mitigates
                  CSRF vectors.
                </li>
                <li>
                  Operators can manage third-party analytics consent in the preference console.
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-4 border-t border-rule">
              <p className="text-foreground/60 text-[10px] text-center">
                For administrative compliance queries, coordinate with the TwinSec DPO / Range
                Controller.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
