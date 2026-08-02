import { createFileRoute, Link } from "@tanstack/react-router";
import { useOperatorSession } from "@/lib/auth-store";
import { TwinSecLogo } from "@/components/TwinSecLogo";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "TwinSec — Terms of Service & Range Operations Manual" },
      {
        name: "description",
        content:
          "Operational directives, simulator integrity, and user terms for the TwinSec Cyber Range.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { session } = useOperatorSession();

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col relative select-none">
      {/* Background blueprint details */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute inset-0 scanline pointer-events-none opacity-45" />

      {/* Main Content Container */}
      <section className="flex-1 max-w-[1000px] mx-auto w-full px-6 py-12 relative z-10 font-mono">
        <div className="border border-rule bg-background/95 p-6 sm:p-10 backdrop-blur space-y-8">
          <div>
            <p className="mono-label text-accent text-xs">TACTICAL DIRECTIVE // TERM-09</p>
            <h1 className="display text-4xl sm:text-5xl mt-2 leading-none">TERMS OF SERVICE</h1>
            <p className="text-[10px] text-foreground/40 mt-2">
              LAST MODIFIED: 2026-07-10 09:00 UTC | CLASSIFICATION: SECURITY COMPLIANCE & RULES
            </p>
          </div>

          <div className="space-y-6 text-xs text-foreground/80 leading-relaxed border-t border-rule pt-6">
            <div className="space-y-2">
              <h2 className="text-accent font-bold text-sm">1. ACCEPTANCE OF SIMULATION TERMS</h2>
              <p>
                By enrolling as an Operator on the TwinSec Cyber Range, you agree to adhere to the
                tactical procedures, security protocols, and operational safety directives defined
                in this manual. Unauthorized testing or simulation of live critical infrastructure
                is strictly prohibited.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-accent font-bold text-sm">
                2. INTELLECTUAL PROPERTY & SIMULATION ENGINE
              </h2>
              <p>
                The digital twin simulation topologies, adversary models, defense engines, and
                training scores are the exclusive property of TwinSec. Users are granted a limited,
                non-transferable, and revocable academic license to execute drills, generate
                training dossiers, and review security response procedures.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-accent font-bold text-sm">
                3. RESPONSIBLE RESEARCH & SIMULATION BOUNDARIES
              </h2>
              <p>
                TwinSec is an isolated cyber range simulator designed for educational, research, and
                infrastructure defense training:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Operators must not attempt to use the Kali Linux draggable console or simulator
                  features for real-world exploits or attacks against external systems.
                </li>
                <li>
                  Any simulated adversarial methods used in the range are purely for testing
                  cybersecurity detection and incident response capabilities.
                </li>
                <li>
                  Operators must keep their badge allocations and credentials secure. Sharing badges
                  or account access is a violation of range protocol.
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="text-accent font-bold text-sm">
                4. STATUTORY LIMITATIONS OF LIABILITY
              </h2>
              <p>
                TwinSec simulations are mathematical approximations of OT/ICS critical
                infrastructure attacks and defense outcomes. They do not constitute certified
                engineering advice. Under all applicable international laws, TwinSec is provided "AS
                IS", and we disclaim all warranties and liabilities resulting from simulation score
                interpretations.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-rule">
              <p className="text-foreground/60 text-[10px] text-center">
                For legal inquiries or operational audits, reach out to the TwinSec Legal
                department.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
