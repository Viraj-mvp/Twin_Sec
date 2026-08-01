# HOLLOW 3D Attack Visualization Specification

## Animation Blueprint for TwinSec Cyber Range

### 1. Core Visual Style

- **Background**: #0a0f1a (dark navy)
- **Accent Color**: #bfff2e (acid lime green)
- **Secondary Colors**: #f59e0b (amber, warning), #dc2626 (red, critical)
- **Typography**: JetBrains Mono (labels), Bebas Neue (headings)
- **Animations**: GSAP with @gsap/react, useGsapReveal
- **CRT Overlay**: Always active, 60Hz scanlines, 0.12 opacity

### 2. Visual Behavior Matrix

| Node State       | Animation Treatment                                                           |
| ---------------- | ----------------------------------------------------------------------------- |
| INACTIVE         | Dark gray (#334155) wireframe box, no glow, static rotation (5° y)            |
| SCANNING (RECON) | Subtle lime outline pulse (1Hz, 0.3 opacity), 10°/s y-rotation                |
| TARGETED         | Rapid scale pulse (0.9x → 1.1x, 300ms, Back.easeInOut), direction arrow beam  |
| EXPLOITED        | Solid lime fill, 3x scale aura, 15°/s rotation, random flicker (0.05s on/off) |
| DEFENDED         | Blue (#3b82f6) border, slow 2°/s rotation, pulsing shield aura                |
| EXFILTRATING     | Orange (#f97316) pulse, particle stream, quick rotation (30°/s)               |
| ISOLATED         | Dimmed (#1e293b), red border, no rotation, "X" overlay                        |

### 3. Animation Curve Reference

| Curve Name | GSAP Equivalent | Use Case               |
| ---------- | --------------- | ---------------------- |
| PROBE      | Power2.easeOut  | RECON scanning pulses  |
| STRIKE     | Back.easeInOut  | EXPLOIT directed beams |
| CONTAIN    | Expo.easeOut    | DEFEND shield auras    |
| PULSE      | Sine.easeInOut  | Status indicators      |
| SCANLINE   | Linear.easeNone | CRT overlay sweep      |

### 4. Attack Propagation Timeline

| Phase   | Visual Treatment                                                                |
| ------- | ------------------------------------------------------------------------------- |
| RECON   | Slow, subtle particle beams (lime, 0.2 opacity), 100ms node-to-node stagger     |
| EXPLOIT | Fast, bright lime beams (1.0 opacity), 50ms stagger, impact particles on target |
| DEFEND  | Blue "containment" rings expanding from defended nodes, 800ms duration          |

### 5. Edge Case Handling

- Rapid state changes: Use animation queue cancellation via GSAP .kill()
- Component unmounting: Clean up all GSAP timelines and event listeners
- Performance throttling: Reduce particle count on low-end devices (check navigator.hardwareConcurrency)
