import React, { useId } from "react";

interface LivingInfrastructureLogoProps {
  className?: string;
  maxW?: string;
}

export function LivingInfrastructureLogo({
  className = "",
  maxW = "max-w-md",
}: LivingInfrastructureLogoProps) {
  const scopeId = useId().replace(/:/g, "");

  return (
    <div className={`relative w-full ${maxW} overflow-hidden select-none ${className}`}>
      <style>{`
        .${scopeId} {
          --bg: #0A0A0A;
          --ink: #F5F5F0;
          --ink-dim: rgba(245, 245, 240, 0.42);
          --ink-faint: rgba(245, 245, 240, 0.07);
          --accent: #BFFF2E;
          --accent-dim: rgba(191, 255, 46, 0.55);
          --accent-faint: rgba(191, 255, 46, 0.22);
          --ease: cubic-bezier(0.16, 1, 0.3, 1);
          --dur: 11s;
        }

        /* ---------- static blueprint scaffold ---------- */
        .${scopeId} .grid-line { stroke: var(--ink-faint); stroke-width: 1; }
        .${scopeId} .corner-tick { stroke: var(--ink-dim); stroke-width: 1.5; fill: none; opacity: 0; animation: fadeHold_${scopeId} var(--dur) var(--ease) infinite; animation-delay: 0s; }
        .${scopeId} .frame-rect {
          fill: none; stroke: var(--ink-dim); stroke-width: 1.25;
          stroke-dasharray: 3400; stroke-dashoffset: 3400;
          animation: drawFrame_${scopeId} var(--dur) var(--ease) infinite;
        }
        .${scopeId} .label { fill: var(--ink-dim); font-family: var(--font-mono, 'JetBrains Mono', monospace); font-size: 13px; letter-spacing: 3px; opacity: 0; animation: fadeHold_${scopeId} var(--dur) var(--ease) infinite; }

        /* ---------- wordmark ---------- */
        .${scopeId} .word-shadow {
          font-family: var(--font-sans, 'Anton', sans-serif);
          font-size: 158px;
          font-weight: 900;
          fill: #000;
          opacity: 0;
          transform: translate(4px, 6px);
          animation: wordShadowIn_${scopeId} var(--dur) var(--ease) infinite;
        }
        .${scopeId} .word-main {
          font-family: var(--font-sans, 'Anton', sans-serif);
          font-size: 158px;
          font-weight: 900;
          fill: var(--ink);
          stroke: var(--accent-dim);
          stroke-width: 1;
          opacity: 0;
          animation: wordIn_${scopeId} var(--dur) var(--ease) infinite;
        }
        .${scopeId} .tagline {
          font-family: var(--font-mono, 'JetBrains Mono', monospace);
          font-size: 16px;
          letter-spacing: 6px;
          fill: var(--ink-dim);
          opacity: 0;
          animation: fadeHold_${scopeId} var(--dur) var(--ease) infinite;
          animation-delay: 0.4s;
        }

        /* ---------- infrastructure ---------- */
        .${scopeId} .trunk { fill: none; stroke: var(--accent); stroke-width: 2; stroke-linecap: round; }
        .${scopeId} .trunk-top { stroke-dasharray: 760; stroke-dashoffset: 760; opacity: 0; animation: drawTrunkTop_${scopeId} var(--dur) var(--ease) infinite; }
        .${scopeId} .trunk-bottom { stroke-dasharray: 820; stroke-dashoffset: 820; opacity: 0; animation: drawTrunkBottom_${scopeId} var(--dur) var(--ease) infinite; }

        .${scopeId} .stub { stroke: var(--accent-dim); stroke-width: 1.5; stroke-linecap: round;
          stroke-dasharray: 70; stroke-dashoffset: 70; opacity: 0;
          animation: drawStub_${scopeId} var(--dur) var(--ease) infinite; }

        .${scopeId} .node { fill: var(--bg); stroke: var(--accent); stroke-width: 2; opacity: 0;
          transform-box: fill-box; transform-origin: center;
          animation: nodeIn_${scopeId} var(--dur) var(--ease) infinite; }

        .${scopeId} .hub { fill: var(--bg); stroke: var(--accent); stroke-width: 2; opacity: 0;
          transform-box: fill-box; transform-origin: center;
          animation: hubIn_${scopeId} var(--dur) var(--ease) infinite; }

        .${scopeId} .dependency { fill: none; stroke: var(--ink-dim); stroke-width: 1; stroke-dasharray: 5 6;
          opacity: 0; animation: fadeHold_${scopeId} var(--dur) var(--ease) infinite; animation-delay: 0.5s; }

        .${scopeId} .pulse-layer { opacity: 0; animation: pulseWindow_${scopeId} var(--dur) var(--ease) infinite; }
        .${scopeId} .pulse { fill: var(--accent); }

        .${scopeId} .n0 { animation-delay: 0s; }   .${scopeId} .n1 { animation-delay: 0.06s; }
        .${scopeId} .n2 { animation-delay: 0.12s; } .${scopeId} .n3 { animation-delay: 0.18s; }
        .${scopeId} .n4 { animation-delay: 0.24s; } .${scopeId} .n5 { animation-delay: 0.30s; }
        .${scopeId} .n6 { animation-delay: 0.36s; }

        @keyframes wordIn_${scopeId} {
          0%,4%   { opacity: 0; transform: translateY(10px); }
          13%     { opacity: 1; transform: translateY(0); }
          88%     { opacity: 1; transform: translateY(0); }
          96%,100%{ opacity: 0; transform: translateY(-6px); }
        }
        @keyframes wordShadowIn_${scopeId} {
          0%,4%   { opacity: 0; transform: translate(4px, 16px); }
          13%     { opacity: 1; transform: translate(4px, 6px); }
          88%     { opacity: 1; transform: translate(4px, 6px); }
          96%,100%{ opacity: 0; transform: translate(4px, 0px); }
        }
        @keyframes fadeHold_${scopeId} {
          0%,18%  { opacity: 0; }
          26%     { opacity: 1; }
          88%     { opacity: 1; }
          95%,100%{ opacity: 0; }
        }
        @keyframes drawFrame_${scopeId} {
          0%,32%  { stroke-dashoffset: 3400; opacity: 0; }
          36%     { opacity: 1; }
          52%     { stroke-dashoffset: 0; opacity: 1; }
          88%     { stroke-dashoffset: 0; opacity: 1; }
          95%,100%{ opacity: 0; stroke-dashoffset: 3400; }
        }
        @keyframes drawTrunkTop_${scopeId} {
          0%,16%  { stroke-dashoffset: 760; opacity: 0; }
          20%     { opacity: 1; }
          32%     { stroke-dashoffset: 0; opacity: 1; }
          88%     { stroke-dashoffset: 0; opacity: 1; }
          95%,100%{ opacity: 0; stroke-dashoffset: 760; }
        }
        @keyframes drawTrunkBottom_${scopeId} {
          0%,18%  { stroke-dashoffset: 820; opacity: 0; }
          22%     { opacity: 1; }
          35%     { stroke-dashoffset: 0; opacity: 1; }
          88%     { stroke-dashoffset: 0; opacity: 1; }
          95%,100%{ opacity: 0; stroke-dashoffset: 820; }
        }
        @keyframes drawStub_${scopeId} {
          0%,20%  { stroke-dashoffset: 70; opacity: 0; }
          24%     { opacity: 1; }
          34%     { stroke-dashoffset: 0; opacity: 1; }
          88%     { stroke-dashoffset: 0; opacity: 1; }
          95%,100%{ opacity: 0; stroke-dashoffset: 70; }
        }
        @keyframes nodeIn_${scopeId} {
          0%,17%  { opacity: 0; transform: scale(0.3); }
          26%     { opacity: 1; transform: scale(1); }
          88%     { opacity: 1; transform: scale(1); }
          95%,100%{ opacity: 0; transform: scale(0.3); }
        }
        @keyframes hubIn_${scopeId} {
          0%,30%  { opacity: 0; transform: scale(0.5); }
          40%     { opacity: 1; transform: scale(1); }
          70%     { opacity: 1; transform: scale(1); }
          78%     { opacity: 1; transform: scale(1.16); }
          86%     { opacity: 1; transform: scale(1); }
          95%,100%{ opacity: 0; transform: scale(0.5); }
        }
        @keyframes pulseWindow_${scopeId} {
          0%,34%  { opacity: 0; }
          38%     { opacity: 1; }
          88%     { opacity: 1; }
          94%,100%{ opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce){
          .${scopeId} *{ animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
          .${scopeId} .word-main, .${scopeId} .word-shadow, .${scopeId} .tagline, .${scopeId} .node, .${scopeId} .hub, .${scopeId} .trunk-top, .${scopeId} .trunk-bottom, .${scopeId} .stub,
          .${scopeId} .frame-rect, .${scopeId} .corner-tick, .${scopeId} .label, .${scopeId} .dependency, .${scopeId} .pulse-layer {
            opacity: 1 !important; transform: none !important; stroke-dashoffset: 0 !important;
          }
        }
      `}</style>

      <svg
        viewBox="0 0 1200 700"
        xmlns="http://www.w3.org/2000/svg"
        className={`${scopeId} w-full h-auto block`}
      >
        {/* corner registration ticks */}
        <g className="corner-tick">
          <path d="M60,84 V60 H84" />
          <path d="M1140,84 V60 H1116" />
          <path d="M60,616 V640 H84" />
          <path d="M1140,616 V640 H1116" />
        </g>

        <text className="label" x="82" y="608">
          TWINSEC · DIGITAL TWIN
        </text>
        <text className="label" x="1118" y="608" textAnchor="end">
          STATUS · SYNCHRONIZED
        </text>

        {/* dependency lines from hubs into the infrastructure */}
        <path className="dependency" d="M150,110 L230,230" />
        <path className="dependency" d="M1050,590 L930,450" />

        {/* hubs */}
        <circle className="hub" cx="150" cy="110" r="15" />
        <circle className="hub" cx="1050" cy="590" r="15" />

        {/* top trunk (straight bar — quiet T reference) */}
        <path className="trunk trunk-top" d="M230,230 L970,230" />

        {/* bottom trunk (soft double curve — quiet S reference) */}
        <path
          className="trunk trunk-bottom"
          d="M230,450 C 380,410 380,490 600,450 C 820,410 820,490 970,450"
        />

        {/* top stubs + nodes (one per letter) */}
        <g>
          <line className="stub n0" x1="270" y1="230" x2="270" y2="266" />
          <line className="stub n1" x1="380" y1="230" x2="380" y2="266" />
          <line className="stub n2" x1="490" y1="230" x2="490" y2="266" />
          <line className="stub n3" x1="600" y1="230" x2="600" y2="266" />
          <line className="stub n4" x1="710" y1="230" x2="710" y2="266" />
          <line className="stub n5" x1="820" y1="230" x2="820" y2="266" />
          <line className="stub n6" x1="930" y1="230" x2="930" y2="266" />
        </g>
        <g>
          <circle className="node n0" cx="270" cy="266" r="5.5" />
          <circle className="node n1" cx="380" cy="266" r="5.5" />
          <circle className="node n2" cx="490" cy="266" r="5.5" />
          <circle className="node n3" cx="600" cy="266" r="5.5" />
          <circle className="node n4" cx="710" cy="266" r="5.5" />
          <circle className="node n5" cx="820" cy="266" r="5.5" />
          <circle className="node n6" cx="930" cy="266" r="5.5" />
        </g>

        {/* bottom stubs + nodes */}
        <g>
          <line className="stub n0" x1="270" y1="450" x2="270" y2="416" />
          <line className="stub n1" x1="380" y1="428" x2="380" y2="416" />
          <line className="stub n2" x1="490" y1="460" x2="490" y2="416" />
          <line className="stub n3" x1="600" y1="450" x2="600" y2="416" />
          <line className="stub n4" x1="710" y1="438" x2="710" y2="416" />
          <line className="stub n5" x1="820" y1="472" x2="820" y2="416" />
          <line className="stub n6" x1="930" y1="450" x2="930" y2="416" />
        </g>
        <g>
          <circle className="node n0" cx="270" cy="450" r="5.5" />
          <circle className="node n1" cx="380" cy="428" r="5.5" />
          <circle className="node n2" cx="490" cy="460" r="5.5" />
          <circle className="node n3" cx="600" cy="450" r="5.5" />
          <circle className="node n4" cx="710" cy="438" r="5.5" />
          <circle className="node n5" cx="820" cy="472" r="5.5" />
          <circle className="node n6" cx="930" cy="450" r="5.5" />
        </g>

        {/* traveling signal pulses (continuous inner loop) */}
        <g className="pulse-layer">
          <circle className="pulse" r="3.2">
            <animateMotion dur="2.6s" repeatCount="indefinite" path="M230,230 L970,230" />
          </circle>
          <circle className="pulse" r="3.2">
            <animateMotion
              dur="3.1s"
              repeatCount="indefinite"
              begin="-1.2s"
              path="M970,230 L230,230"
            />
          </circle>
          <circle className="pulse" r="3" fill="var(--accent)">
            <animateMotion
              dur="3.4s"
              repeatCount="indefinite"
              path="M230,450 C 380,410 380,490 600,450 C 820,410 820,490 970,450"
            />
          </circle>
          <circle className="pulse" r="3" fill="var(--accent)">
            <animateMotion
              dur="2.9s"
              repeatCount="indefinite"
              begin="-1.6s"
              path="M970,450 C 820,490 820,410 600,450 C 380,490 380,410 230,450"
            />
          </circle>
        </g>

        {/* wordmark */}
        <text className="word-shadow" x="600" y="400" textAnchor="middle" letterSpacing="2">
          TWINSEC
        </text>
        <text className="word-main" x="600" y="400" textAnchor="middle" letterSpacing="2">
          TWINSEC
        </text>

        <text className="tagline" x="600" y="555" textAnchor="middle">
          INDUSTRIAL CYBER OPERATIONS SIMULATOR
        </text>
      </svg>
    </div>
  );
}
