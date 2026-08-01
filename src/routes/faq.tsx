import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useGsapReveal } from "@/hooks/use-gsap-reveal";
import { TwinSecLogo } from "@/components/TwinSecLogo";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "TwinSec — FAQ & Platform Differentiation" },
      {
        name: "description",
        content:
          "Frequently asked questions about TwinSec's cyber-physical simulation platform, AI features, security architecture, and what makes it unique in the OT/ICS training market.",
      },
    ],
  }),
  component: FAQPage,
});

/* ------------------------------------------------------------------ */
/*  ACCORDION ITEM                                                     */
/* ------------------------------------------------------------------ */

function AccordionItem({
  question,
  children,
  defaultOpen = false,
}: {
  question: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-rule group">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left hover:text-accent transition-colors"
        aria-expanded={open}
      >
        <span className="font-mono text-sm sm:text-base font-bold tracking-wide text-foreground group-hover:text-accent transition-colors">
          {question}
        </span>
        <span
          className={`mono-label text-accent text-lg flex-shrink-0 transition-transform duration-300 ${open ? "rotate-45" : ""}`}
        >
          +
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? "max-h-[2000px] opacity-100 pb-6" : "max-h-0 opacity-0"}`}
      >
        <div className="font-serif text-base sm:text-lg text-foreground/80 leading-relaxed space-y-4 pl-0 md:pl-4">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION HEADER                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({ number, label, title }: { number: string; label: string; title: string }) {
  return (
    <div className="mb-8 pt-16 first:pt-0" data-reveal>
      <div className="flex items-center gap-4 mono-label mb-4">
        <span className="text-accent">{number}</span>
        <span className="text-foreground/40">—</span>
        <span>{label}</span>
      </div>
      <h2 className="display text-4xl sm:text-5xl lg:text-6xl">{title}</h2>
      <div className="hairline mt-6" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  USP CARD                                                           */
/* ------------------------------------------------------------------ */

function USPCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="border border-rule p-6 sm:p-8 hover:border-accent transition-colors group"
      data-reveal
    >
      <div className="flex items-baseline justify-between mb-4">
        <span className="mono-label text-accent">{number}</span>
        <span className="size-2 bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <h3 className="display text-2xl sm:text-3xl mb-4 group-hover:text-accent transition-colors">
        {title}
      </h3>
      <p className="font-serif text-base sm:text-lg text-foreground/70 leading-relaxed italic">
        {description}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STAT BLOCK                                                         */
/* ------------------------------------------------------------------ */

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border border-rule p-6 text-center" data-reveal>
      <p className="display text-5xl sm:text-6xl text-accent">{value}</p>
      <p className="mono-label mt-3 text-foreground/60">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN PAGE                                                          */
/* ------------------------------------------------------------------ */

function FAQPage() {
  const rootRef = useGsapReveal<HTMLElement>();

  return (
    <main ref={rootRef} className="min-h-screen bg-background text-foreground">
      {/* ── HERO ── */}
      <section className="border-b border-rule relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute inset-0 scanline pointer-events-none opacity-50" />
        <div className="relative mx-auto max-w-[1600px] px-6 lg:px-10 py-20 lg:py-32">
          <div className="flex items-center justify-between mono-label mb-8" data-reveal>
            <div className="flex items-center gap-3">
              <TwinSecLogo className="size-5" />
              <Link to="/" className="hover:text-accent transition-colors">
                TWINSEC
              </Link>
            </div>
            <span>FIELD MANUAL · REV 3.1</span>
          </div>
          <h1
            className="display text-[14vw] md:text-[10vw] lg:text-[140px] leading-[0.82]"
            data-reveal
          >
            FREQUENTLY
            <br />
            ASKED
            <br />
            <span className="text-accent">QUESTIONS.</span>
          </h1>
          <p
            className="font-serif italic text-xl sm:text-2xl text-foreground/70 mt-10 max-w-2xl leading-relaxed"
            data-reveal
          >
            Everything operators, analysts, and instructors need to know about the platform — from
            simulation mechanics to AI safety architecture.
          </p>
        </div>
      </section>

      {/* ── FAQ SECTIONS ── */}
      <div className="mx-auto max-w-[1600px] px-6 lg:px-10">
        {/* ABOUT */}
        <section className="py-12 lg:py-20">
          <SectionHeader number="01" label="ABOUT TWINSEC" title="THE PLATFORM" />

          <AccordionItem question="What is TwinSec?" defaultOpen>
            <p>
              TwinSec is a cyber-physical simulation platform for industrial control system (ICS/OT)
              defenders. It creates digital twins — virtual replicas — of critical infrastructure
              like power grids, water treatment plants, and oil refineries, then simulates realistic
              nation-state cyberattacks against them so defenders can train safely.
            </p>
          </AccordionItem>

          <AccordionItem question="Who is TwinSec built for?">
            <ul className="list-none space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5">▪</span>
                <span>OT/ICS Security Analysts and SOC teams defending industrial networks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5">▪</span>
                <span>
                  Plant operators and engineers who need to understand the cyber consequences of
                  physical decisions
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5">▪</span>
                <span>
                  Security students and researchers studying critical infrastructure threats
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5">▪</span>
                <span>Incident responders preparing for ICS-specific scenarios</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5">▪</span>
                <span>
                  CISOs running executive tabletop exercises without needing a physical cyber range
                </span>
              </li>
            </ul>
          </AccordionItem>

          <AccordionItem question="Is TwinSec a real-world attack tool?">
            <p>
              No. Every terminal command, attack script, and technique output is defanged through a
              multi-layer safety pipeline. All IP addresses use RFC 5737 documentation ranges
              (203.0.113.x). No runnable exploit code is ever generated. TwinSec teaches the pattern
              and consequence of attacks — not how to execute them on real systems.
            </p>
            <p className="text-foreground/60">
              Think of it as a flight simulator: you learn to fly, but you can't crash a real plane.
            </p>
          </AccordionItem>

          <AccordionItem question="Is TwinSec free?">
            <p>
              Yes. The core platform is free for individuals, students, and small teams. There are
              no paywalls on the simulation, espionage engine, or debrief tools.
            </p>
          </AccordionItem>
        </section>

        <div className="hairline" />

        {/* SIMULATION */}
        <section className="py-12 lg:py-20">
          <SectionHeader number="02" label="THE SIMULATION" title="HOW IT WORKS" />

          <AccordionItem question="What happens during a simulation?" defaultOpen>
            <p>A simulation runs across 4 tactical phases:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 not-italic font-mono text-sm">
              <div className="border border-rule p-4 bg-muted/20">
                <span className="text-accent font-bold">01 · RECON</span>
                <p className="mt-2 text-foreground/70">
                  The adversary discovers assets and vulnerabilities in your virtual infrastructure
                </p>
              </div>
              <div className="border border-rule p-4 bg-muted/20">
                <span className="text-accent font-bold">02 · EXPLOIT</span>
                <p className="mt-2 text-foreground/70">
                  The attack chain is executed, compromising nodes and establishing lateral movement
                </p>
              </div>
              <div className="border border-rule p-4 bg-muted/20">
                <span className="text-accent font-bold">03 · DEFEND</span>
                <p className="mt-2 text-foreground/70">
                  You make containment decisions: Isolate, Patch, or Trip breakers
                </p>
              </div>
              <div className="border border-rule p-4 bg-muted/20">
                <span className="text-accent font-bold">04 · REVIEW</span>
                <p className="mt-2 text-foreground/70">
                  Your decisions are scored and debriefed with MITRE ATT&CK mapping
                </p>
              </div>
            </div>
          </AccordionItem>

          <AccordionItem question="What sectors are available?">
            <p>Seven critical infrastructure sectors:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 not-italic font-mono text-xs">
              {[
                { code: "HOLLOW", sector: "Power Grid" },
                { code: "BASIN", sector: "Water Treatment" },
                { code: "SEVENTH BREATH", sector: "Oil & Gas" },
                { code: "MISFIRE", sector: "Manufacturing" },
                { code: "MANIFEST", sector: "Port Terminal" },
                { code: "STILL-AIR", sector: "Smart Building" },
                { code: "GRIDLOCK", sector: "Smart City" },
              ].map((s) => (
                <div
                  key={s.code}
                  className="border border-rule px-3 py-2 flex justify-between items-center"
                >
                  <span className="text-foreground/60">{s.sector}</span>
                  <span className="text-accent font-bold">{s.code}</span>
                </div>
              ))}
            </div>
          </AccordionItem>

          <AccordionItem question="What are the decision options?">
            <p>In each scenario you face 2–3 critical decision points:</p>
            <ul className="list-none space-y-3 mt-3 not-italic">
              <li className="flex items-start gap-3 font-mono text-sm">
                <span className="text-accent font-bold min-w-[3rem]">ACT</span>
                <span className="text-foreground/70">
                  Immediate defensive response. Costs operational time, prevents damage spread.
                </span>
              </li>
              <li className="flex items-start gap-3 font-mono text-sm">
                <span className="text-warn font-bold min-w-[3rem]">DEFER</span>
                <span className="text-foreground/70">
                  Monitor and gather intelligence. Moderate risk, sometimes tactically correct.
                </span>
              </li>
              <li className="flex items-start gap-3 font-mono text-sm">
                <span className="text-danger font-bold min-w-[3rem]">MISS</span>
                <span className="text-foreground/70">
                  You don't respond in time. Consequences cascade. Score decreases.
                </span>
              </li>
            </ul>
          </AccordionItem>

          <AccordionItem question="What does my score mean?">
            <p>
              Your score (0–100) is calculated from: detection speed (MTTD), response effectiveness
              (MTTR), damage prevented (MW shed or equivalent), proactive defensive actions, and
              hint usage penalties. An 80+ score indicates SOC-analyst-level performance.
            </p>
          </AccordionItem>

          <AccordionItem question="Can I replay a simulation?">
            <p>
              Yes. At the end of every run, a shareable replay link is generated. Anyone with the
              link can watch your exact sequence of decisions and their consequences. Useful for
              instructor review and post-incident analysis.
            </p>
          </AccordionItem>

          <AccordionItem question="What if I get stuck?">
            <p>TwinSec has a progressive hint system (levels 0–3):</p>
            <div className="mt-3 not-italic font-mono text-sm space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-accent font-bold">LVL 1</span>
                <span className="text-foreground/70">Subtle directional nudge</span>
                <span className="text-foreground/30 ml-auto">−5 pts</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-warn font-bold">LVL 2</span>
                <span className="text-foreground/70">
                  Direct guidance naming the correct action
                </span>
                <span className="text-foreground/30 ml-auto">−5 pts</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-danger font-bold">LVL 3</span>
                <span className="text-foreground/70">
                  Full annotated solution with step-by-step reasoning
                </span>
                <span className="text-foreground/30 ml-auto">−5 pts</span>
              </div>
            </div>
          </AccordionItem>
        </section>

        <div className="hairline" />

        {/* AI FEATURES */}
        <section className="py-12 lg:py-20">
          <SectionHeader number="03" label="AI FEATURES" title="INTELLIGENCE ENGINE" />

          <AccordionItem question="How does the RAVEN Espionage Engine work?">
            <p>
              RAVEN generates AI-powered nation-state threat briefings based on your selected
              sector, adversary profile, intensity level, and attack chain. It uses Google Gemini to
              generate MITRE ATT&CK for ICS-mapped threat intelligence in the style of a classified
              dossier. All output is scrubbed for safety before display.
            </p>
          </AccordionItem>

          <AccordionItem question="Why does TwinSec use multiple AI providers?">
            <p>Different tasks have different requirements:</p>
            <div className="mt-3 not-italic font-mono text-sm space-y-2">
              <div className="border-l-2 border-accent pl-3">
                <span className="font-bold text-accent">Groq</span>
                <span className="text-foreground/50"> · llama-3.3-70b</span>
                <p className="text-foreground/70 mt-1">
                  Terminal commands and hints — responds in &lt;200ms
                </p>
              </div>
              <div className="border-l-2 border-warn pl-3">
                <span className="font-bold text-warn">Cerebras</span>
                <span className="text-foreground/50"> · llama3.1-70b</span>
                <p className="text-foreground/70 mt-1">
                  Debrief scoring — fast structured reasoning
                </p>
              </div>
              <div className="border-l-2 border-foreground/40 pl-3">
                <span className="font-bold">Google Gemini</span>
                <p className="text-foreground/70 mt-1">
                  Espionage briefings — large context and rich language
                </p>
              </div>
            </div>
            <p className="mt-3 text-foreground/60">
              Using multiple providers also means that if one hits a rate limit, another takes over
              automatically. Zero downtime.
            </p>
          </AccordionItem>

          <AccordionItem question="Can the AI generate real attack tools?">
            <p>
              No. The AI is instructed by a system prompt with non-negotiable safety rules. IP
              addresses are replaced post-generation. Shellcode patterns are redacted. Code blocks
              are annotated as non-runnable. The pipeline has 5 independent safety layers, not just
              one.
            </p>
          </AccordionItem>
        </section>

        <div className="hairline" />

        {/* TECHNICAL & SECURITY */}
        <section className="py-12 lg:py-20">
          <SectionHeader number="04" label="TECHNICAL & SECURITY" title="ARCHITECTURE" />

          <AccordionItem question="Does TwinSec store my simulation data?">
            <p>
              <strong>Registered operators:</strong> yes — your training runs are stored to build
              your performance history and enable replay links. <strong>Guest users:</strong> no
              data is stored.
            </p>
          </AccordionItem>

          <AccordionItem question="What is MITRE ATT&CK for ICS?">
            <p>
              MITRE ATT&CK for ICS is a knowledge base of adversary tactics and techniques
              specifically for industrial control systems. It maps how real attackers operate in OT
              environments — different from the standard enterprise ATT&CK matrix. TwinSec tags
              every attack event and detection rule with the correct ICS technique ID (e.g., T0836:
              Modify Parameter, T0846: Remote System Discovery).
            </p>
          </AccordionItem>

          <AccordionItem question="What is a Sigma rule?">
            <p>
              Sigma is an open standard for detection rules. A Sigma rule describes what suspicious
              activity looks like in log data, and can be converted to work with any SIEM (Splunk,
              Microsoft Sentinel, Elastic, QRadar). TwinSec generates Sigma rules from the detection
              gaps in your simulation — the attacks you missed become rules that would have caught
              them.
            </p>
          </AccordionItem>

          <AccordionItem question="Can I use TwinSec for compliance training?">
            <p>
              Yes. Simulation scenarios map to NERC CIP, IEC 62443, and NIST CSF controls. The
              debrief scorecard shows which compliance requirements were satisfied or failed during
              your exercise.
            </p>
          </AccordionItem>
        </section>

        <div className="hairline" />

        {/* ACCOUNT */}
        <section className="py-12 lg:py-20">
          <SectionHeader number="05" label="ACCOUNT & ACCESS" title="OPERATOR IDENTITY" />

          <AccordionItem question="Do I need an account to use TwinSec?">
            <p>
              No. You can explore all sectors, read the espionage briefings, and browse field
              reports as a guest. An account is required to run the live simulation (to save your
              scores and enable replay links).
            </p>
          </AccordionItem>

          <AccordionItem question="How do I register?">
            <p>
              Click "REGISTER" on the login screen, or on any simulation launch gate. You need a
              callsign (your operator identifier), email, and password. No credit card. No email
              verification in beta.
            </p>
          </AccordionItem>

          <AccordionItem question="What is a callsign?">
            <p>
              Your operator identifier on TwinSec — shown on the leaderboard and in your training
              records. 3–20 characters, alphanumeric, hyphens and underscores allowed. Choose
              wisely. You can't change it.
            </p>
          </AccordionItem>

          <AccordionItem question="Is my password secure?">
            <p>
              Passwords are hashed with bcrypt (12 rounds) and never stored in plain text. Sessions
              use cryptographic tokens stored in HttpOnly, SameSite=Strict cookies — inaccessible to
              JavaScript and resistant to XSS and CSRF attacks.
            </p>
          </AccordionItem>
        </section>
      </div>

      {/* ── USP DIFFERENTIATION ── */}
      <section className="border-t border-rule bg-black/50 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative mx-auto max-w-[1600px] px-6 lg:px-10 py-20 lg:py-32">
          <div className="mono-label mb-4 text-accent" data-reveal>
            PART B · COMPETITIVE DIFFERENTIATION
          </div>
          <h2 className="display text-5xl sm:text-7xl lg:text-[100px] leading-[0.85]" data-reveal>
            WHAT TWINSEC
            <br />
            DOES THAT
            <br />
            <span className="text-accent">NOBODY ELSE DOES.</span>
          </h2>

          {/* Market Gap */}
          <div className="mt-16 grid grid-cols-12 gap-8" data-reveal>
            <div className="col-span-12 md:col-span-4">
              <div className="border border-rule p-6 h-full">
                <span className="mono-label text-danger">TOO CHEAP BUT SHALLOW</span>
                <p className="font-serif italic text-base text-foreground/70 mt-4 leading-relaxed">
                  TryHackMe, Hack The Box, SANS NetWars — IT security platforms. They don't simulate
                  Modbus, DNP3, or BACnet. They don't model physical consequences. They don't touch
                  MITRE ATT&CK for ICS.
                </p>
              </div>
            </div>
            <div className="col-span-12 md:col-span-4">
              <div className="border border-accent p-6 h-full bg-accent/5">
                <span className="mono-label text-accent">TWINSEC · THE GAP</span>
                <p className="font-serif italic text-base text-foreground/90 mt-4 leading-relaxed">
                  OT-specific fidelity. Zero cost. Browser-based. Instant access. AI-powered. No
                  hardware. No enterprise contract. No onboarding delay.
                </p>
              </div>
            </div>
            <div className="col-span-12 md:col-span-4">
              <div className="border border-rule p-6 h-full">
                <span className="mono-label text-warn">DEEP BUT INACCESSIBLE</span>
                <p className="font-serif italic text-base text-foreground/70 mt-4 leading-relaxed">
                  Cyberbit Range ($200–500K), SimSpace ($100K+), INL cyber range (government only).
                  Real OT fidelity but requires enterprise contracts, dedicated hardware, and months
                  of onboarding.
                </p>
              </div>
            </div>
          </div>

          {/* 7 USPs */}
          <div className="mt-20">
            <div className="mono-label mb-8" data-reveal>
              7 UNIQUE SELLING PROPOSITIONS
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <USPCard
                number="01"
                title="PHYSICAL CONSEQUENCE MODELING"
                description="Every attack results in a measurable physical outcome: megawatts shed, chlorine level drift, pipeline pressure spike. Not just 'server compromised' — but '14MW deloaded' and 'boil-water advisory issued.'"
              />
              <USPCard
                number="02"
                title="AI-ADAPTIVE TERMINAL"
                description="Type 'exploit plc-relay-01' and get Modbus-protocol-accurate terminal output — function codes, register addresses, timing — in under 200ms. Realistic enough to teach, impossible to weaponize."
              />
              <USPCard
                number="03"
                title="LIVE KILL CHAIN VISUALIZATION"
                description="The attack path builds visually as events trigger — node by node, edge by edge. Not a static diagram revealed at the end, but a graph that grows as the attack progresses."
              />
              <USPCard
                number="04"
                title="SIGMA RULE EXPORT FROM GAPS"
                description="You missed the lateral movement event. TwinSec generates a Sigma detection rule specifically for what you missed — ready to load into your real SIEM. The training session produces a deployable artifact."
              />
              <USPCard
                number="05"
                title="CVE-ANCHORED SCENARIOS"
                description="Every vulnerable node maps to a real CVE advisory from CISA ICS-CERT. The Siemens S7-400 PLC that gets exploited? That's CVE-2023-28489, CVSS 9.8, publicly documented."
              />
              <USPCard
                number="06"
                title="CISA LIVE THREAT INTELLIGENCE"
                description="TwinSec pulls current ICS advisories from CISA's public feed and tells you which sector is under active threat this week. Training responds to real-world intelligence, not a static curriculum."
              />
              <USPCard
                number="07"
                title="CRYPTOGRAPHIC REPLAY LINKS"
                description="A base64-encoded state link captures every decision, isolation, terminal command, and timestamp. Share it with your instructor. They see exactly what you saw, in the exact order."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── REAL-WORLD PROBLEM STATS ── */}
      <section className="border-t border-rule">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-20 lg:py-32">
          <div className="mono-label mb-4 text-accent" data-reveal>
            THE PROBLEM IN NUMBERS
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Stat value="197" label="DAYS AVG OT BREACH DETECTION (IBM X-FORCE 2024)" />
            <Stat value="$4.8M" label="AVG COST OF AN ICS SECURITY INCIDENT" />
            <Stat value="65%" label="ICS ENVIRONMENTS WITH KNOWN UNPATCHED CVES" />
            <Stat value="0" label="FREE BROWSER-BASED OT CYBER RANGES AVAILABLE" />
          </div>

          <div className="mt-16 grid grid-cols-12 gap-8" data-reveal>
            <div className="col-span-12 md:col-span-8 md:col-start-3">
              <p className="display text-3xl sm:text-4xl lg:text-5xl leading-[0.9] text-center">
                TwinSec removes the hardware.
                <br />
                Removes the cost.
                <br />
                Keeps the fidelity.
                <br />
                <span className="text-accent">Adds AI. Ships in a browser.</span>
              </p>
              <p className="font-serif italic text-lg sm:text-xl text-foreground/60 text-center mt-10 leading-relaxed max-w-3xl mx-auto">
                The OT security skills gap currently kills people when attacks succeed. TwinSec
                exists so that a water utility with no budget, a student with no lab, and a SOC
                analyst with no range can all train at the same fidelity as a Fortune 500 company.
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-12" data-reveal>
            <Link
              to="/simulation"
              search={{ sector: "power" }}
              className="bg-accent text-accent-foreground px-8 py-4 mono-label hover:bg-foreground hover:text-background transition-colors"
            >
              ENTER THE RANGE →
            </Link>
            <Link
              to="/"
              className="border border-rule px-8 py-4 mono-label hover:border-accent hover:text-accent transition-colors"
            >
              ← BACK TO HOME
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-rule">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 mono-label text-xs">
          <span>© 2026 TWINSEC SYSTEMS</span>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-accent transition-colors">
              PRIVACY POLICY
            </Link>
            <Link to="/terms" className="hover:text-accent transition-colors">
              TERMS OF SERVICE
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
