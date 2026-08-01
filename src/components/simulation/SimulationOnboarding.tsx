import React, { useState, useEffect } from "react";
import { Crosshair, ShieldAlert, Cpu, FileCheck, X, ChevronRight, HelpCircle } from "lucide-react";

interface SimulationOnboardingProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

const STEPS = [
  {
    title: "OPERATIONAL CYBER RANGE",
    icon: Crosshair,
    badge: "STEP 1 OF 5",
    heading: "Welcome to TwinSec Industrial Twin",
    description:
      "This range simulates high-fidelity cyber-physical attacks against critical infrastructure across 7 industrial sectors (Power Grid, Water Works, Oil & Gas Refinery, Smart Factory, Maritime Port, Smart Building, Metro City).",
    tip: "You can operate in RED CELL (Attacker) or BLUE CELL (Defender) mode.",
  },
  {
    title: "PHASE 1: RECONNAISSANCE",
    icon: Cpu,
    badge: "STEP 2 OF 5",
    heading: "Target Discovery & Vulnerability Scan",
    description:
      "Select nodes on the industrial topology grid (Engineering Workstations, Historian, HMIs, PLCs). Launch discovery scans to uncover open OT ports, firmwares, and CVE exposure.",
    tip: "Scanning 3+ assets unlocks the Red Team Exploitation phase.",
  },
  {
    title: "PHASE 2: EXPLOITATION",
    icon: ShieldAlert,
    badge: "STEP 3 OF 5",
    heading: "Chain Vulnerabilities & Stage Attack",
    description:
      "Compile and execute exploit chains from initial entry points down to physical safety systems (SIS logic solvers and circuit breakers). Watch breach indicators propagate live across the topology.",
    tip: "Once your attack chain is staged, hit 'LAUNCH SIMULATED ATTACK 🚨' to run the timeline.",
  },
  {
    title: "PHASE 3: THREAT CONTAINMENT",
    icon: ShieldAlert,
    badge: "STEP 4 OF 5",
    heading: "Real-Time Incident Mitigation",
    description:
      "When the timeline propagates during DEFEND phase, apply containment playbooks: ISOLATE NETWORK to sever C2, DEPLOY INTEGRITY PATCH to remediate rungs, or FAILSAFE MANUAL TRIP to protect physical assets.",
    tip: "Use the built-in Kali Console or response prompts to issue tactical commands.",
  },
  {
    title: "PHASE 4: DEBRIEF & SIEM EXPORT",
    icon: FileCheck,
    badge: "STEP 5 OF 5",
    heading: "Post-Mortem Scorecard & Artifacts",
    description:
      "After cascade timeline completes, review your containment outcome (Baseline, Degraded, Reduced, or Contained). Download SIEM logs in CSV, export SIGMA detection rules, or generate an encrypted PDF Debrief Dossier.",
    tip: "All training runs are logged to your operator audit ledger.",
  },
];

export const SimulationOnboarding: React.FC<SimulationOnboardingProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setStepIndex(0);
      return;
    }
    const seen = localStorage.getItem("twinsec_sim_onboarding_dismissed");
    if (!seen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem("twinsec_sim_onboarding_dismissed", "true");
    }
    setIsOpen(false);
    onClose?.();
  };

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setStepIndex(0);
          setIsOpen(true);
        }}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 bg-black/90 border border-accent/40 text-accent hover:bg-accent hover:text-accent-foreground px-3 py-1.5 rounded-none font-mono text-[11px] backdrop-blur transition-all duration-200 cursor-pointer shadow-lg"
        title="Open Simulation Guide"
      >
        <HelpCircle className="size-3.5 animate-pulse" />
        <span>GUIDE & TUTORIAL</span>
      </button>
    );
  }

  const current = STEPS[stepIndex];
  const IconComponent = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-xl bg-card border-2 border-rule rounded-none shadow-2xl overflow-hidden flex flex-col font-mono text-foreground">
        {/* Header */}
        <div className="bg-muted/40 border-b border-rule px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <IconComponent className="size-5 text-accent animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-accent uppercase">
              {current.title}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-accent/15 text-accent border border-accent/30 px-2 py-0.5 font-bold rounded-none">
              {current.badge}
            </span>
            <button
              onClick={handleDismiss}
              className="text-foreground/50 hover:text-foreground text-xs font-bold transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-4">
          <h2 className="display text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
            {current.heading}
          </h2>
          <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-sans">
            {current.description}
          </p>

          {/* Tactical tip box */}
          <div className="mt-4 border-l-2 border-accent bg-accent/10 p-3 text-[11px] text-accent-foreground font-mono">
            <span className="font-bold text-accent">PRO TIP: </span>
            {current.tip}
          </div>
        </div>

        {/* Step Indicators & Actions */}
        <div className="bg-muted/40 border-t border-rule px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStepIndex(i)}
                className={`h-1.5 transition-all rounded-none cursor-pointer ${
                  i === stepIndex
                    ? "w-6 bg-accent"
                    : "w-1.5 bg-foreground/20 hover:bg-foreground/40"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-[10px] text-foreground/60 cursor-pointer">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="accent-accent cursor-pointer"
              />
              Don't show again
            </label>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 bg-accent text-accent-foreground px-5 py-2 font-mono font-bold text-xs hover:bg-foreground hover:text-background transition-colors cursor-pointer rounded-none"
            >
              <span>{stepIndex === STEPS.length - 1 ? "FINISH TUTORIAL" : "NEXT STEP"}</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
