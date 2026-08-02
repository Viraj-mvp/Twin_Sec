import { Link } from "@tanstack/react-router";
import { LivingInfrastructureLogo } from "./LivingInfrastructureLogo";

export function Footer() {
  return (
    <footer className="border-t border-rule bg-background text-foreground py-16 px-6 lg:px-10 z-10 relative">
      <div className="mx-auto max-w-[1600px] grid grid-cols-12 gap-10">
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <div className="max-w-[280px]">
            <LivingInfrastructureLogo />
          </div>
          <p className="font-serif italic text-base text-foreground/80 max-w-md leading-relaxed">
            "Software does not stop at the screen. Concrete moves. Turbines spin out of tolerance.
            Breakers latch. Cities lose pressure."
          </p>
          <div className="mono-label text-xs text-foreground/50">
            TWINSEC CYBER-PHYSICAL PLATFORM · SECTOR 9 GROUND TRUTH
          </div>
        </div>

        <div className="col-span-12 sm:col-span-4 lg:col-span-2 space-y-4">
          <p className="mono-label text-accent font-bold">INTELLIGENCE</p>
          <ul className="space-y-2.5 font-mono text-xs text-foreground/80">
            <li>
              <Link to="/field-reports" className="hover:text-accent transition-colors">
                FIELD REPORTS
              </Link>
            </li>
            <li>
              <Link to="/whitepapers" className="hover:text-accent transition-colors">
                WHITEPAPERS
              </Link>
            </li>
            <li>
              <Link to="/def-con-brief" className="hover:text-accent transition-colors">
                DEF CON BRIEF
              </Link>
            </li>
            <li>
              <Link to="/s4-talk" className="hover:text-accent transition-colors">
                S4 TALK
              </Link>
            </li>
          </ul>
        </div>

        <div className="col-span-12 sm:col-span-4 lg:col-span-2 space-y-4">
          <p className="mono-label text-accent font-bold">OPERATOR HUB</p>
          <ul className="space-y-2.5 font-mono text-xs text-foreground/80">
            <li>
              <Link to="/case-files" className="hover:text-accent transition-colors">
                CASE FILES
              </Link>
            </li>
            <li>
              <Link to="/threat-profiles" className="hover:text-accent transition-colors">
                MINDHUNTER BAU
              </Link>
            </li>
            <li>
              <Link to="/twin-engine" className="hover:text-accent transition-colors">
                TWIN ENGINE
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-accent transition-colors">
                DASHBOARD
              </Link>
            </li>
          </ul>
        </div>

        <div className="col-span-12 sm:col-span-4 lg:col-span-3 space-y-4">
          <p className="mono-label text-accent font-bold">SECTORS</p>
          <div className="flex flex-wrap gap-2 font-mono text-[10px]">
            {["POWER", "WATER", "OIL & GAS", "MANUFACTURING", "PORT", "SMART CITY"].map((s) => (
              <span key={s} className="px-2 py-1 border border-rule bg-card text-foreground/70">
                {s}
              </span>
            ))}
          </div>
          <div className="pt-4 border-t border-rule/50 flex flex-col gap-2 font-mono text-xs text-foreground/50">
            <span>DEF CON 33 · S4X26 · USENIX SECURITY</span>
            <span>© 2026 TWINSEC INC. ALL RIGHTS RESERVED.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
