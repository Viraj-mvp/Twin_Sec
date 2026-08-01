import React from "react";

export const ImpactTick: React.FC = () => {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-60 animate-[impactFlash_420ms_ease-out_forwards] opacity-0"
      style={{
        background:
          "radial-gradient(ellipse at center, color-mix(in oklab, var(--accent) 18%, transparent) 0%, transparent 55%)",
      }}
    >
      <style>{`
        @keyframes impactFlash {
          0% { opacity: 0; }
          15% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      <div className="absolute inset-x-0 top-0 h-px bg-accent animate-[impactBar_420ms_ease-out_forwards]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-accent animate-[impactBar_420ms_ease-out_forwards]" />
      <style>{`
        @keyframes impactBar {
          0% { transform: scaleX(0); transform-origin: left; opacity: 1; }
          100% { transform: scaleX(1); transform-origin: left; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
