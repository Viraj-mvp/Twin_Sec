# TwinSec AI-Driven Features Design Exploration

## Overview

This document explores how AI should power TwinSec's attack script generation, simulation exercise dynamics, and practice effectiveness feedback, while maintaining strict safety and pedagogical value.

---

## 1. Attack Script & Terminal Command Generation

### Core Question

How to create "realistic but defanged" attack content that trains defenders effectively without enabling misuse?

### What "Realistic But Defanged" Looks Like

#### Phase 1: RECON

- **Realistic**: Show actual protocol-specific syntax (e.g., Modbus function codes, Nmap scan flags for OT networks)
- **Defanged**:
  - Use RFC 5737 test IP ranges _everywhere_ (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24)
  - Prefix all commands with a clear banner: `[DEFANGED] - For Training Only - Not Runnable in Real Environments`
  - Use placeholder node IDs instead of real asset identifiers (e.g., `scada-master-01` → `NODE-SCADA-001`)
  - Add explanatory comments inline: `// Illustrative: Scanning Modbus TCP port 502 on OT network segment`

**Example (Power Sector, RECON):**

```
[DEFANGED] - For Training Only - Not Runnable in Real Environments
POWER > nmap -p502,20000 --script modbus-discover 203.0.113.0/24
Starting Nmap 7.92...
Nmap scan report for 203.0.113.10 (NODE-SCADA-001)
PORT     STATE SERVICE
502/tcp  open  Modbus
MAC Address: 00:11:22:33:44:55 (Schneider Electric)
```

#### Phase 2: EXPLOIT

- **Realistic**: Show vulnerability-specific techniques (e.g., Modbus function code abuse, S7 comm protocol manipulation)
- **Defanged**:
  - Never include actual shellcode, exploit binaries, or working credential dumps
  - Replace exploitation steps with structural templates: `[EXPLOIT TEMPLATE] - Vulnerability CVE-XXXX-XXXX - Modbus Function Code 90 Abuse`
  - Clearly annotate what each step _would_ do in a real attack without showing runnable code
  - Pair every offensive step with a defender detection/mitigation note

**Example (Water Sector, EXPLOIT):**

```
[DEFANGED] - For Training Only - Not Runnable in Real Environments
WATER > exploit-s7 --target 203.0.113.15 --vuln CVE-XXXX-XXXX
// Illustrative: S7 Comm Protocol Exploitation
// [DEFANGED] - No working exploit code shown
[+] Connected to NODE-PLC-007 (Siemens S7-400)
[+] Vulnerability detected: Unauthenticated firmware write access
[+] [EXPLOIT TEMPLATE] - Would upload malicious logic block here
[DEFENDER NOTE] - Detect this via: S7 comm traffic to non-engineering workstations; firmware modification alerts
```

### Progressive Hint System (0-3)

Design principle: Each hint level reveals _just enough_ to guide learning without giving away the solution.

| Level | Trigger Condition                  | What it Reveals                                                                                                                              |
| ----- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Initial state (no hints requested) | Nothing - operator must work through the problem independently                                                                               |
| 1     | 1 failed attempt                   | Subtle nudge: "Check SIEM logs for traffic to unusual Modbus destinations" or "Review topology for exposed engineering workstations"         |
| 2     | 2 failed attempts                  | Direct guidance: "Isolate the compromised SCADA node (NODE-SCADA-001) first, then block outbound traffic to 203.0.113.50"                    |
| 3     | 3+ failed attempts                 | Full annotated solution: Step-by-step decision tree, terminal commands that _would_ contain the attack, explanation of why each step matters |

**Hint Level 3 Example (Power Sector, DEFEND Phase):**

```
=== FULL ANNOTATED SOLUTION ===
Step 1: Detect the exfiltration
- Trigger: SIEM alert for large outbound data transfer (1GB+) from NODE-SCADA-001
- Look for: Traffic to unknown C2 server (203.0.113.50) on port 443
- MITRE: T0864 (Data Exfiltration Over Command And Control Channel)

Step 2: Contain the attack
- Action: ISOLATE NODE-SCADA-001 immediately
- Why? Prevents further data exfiltration and lateral movement
- MITRE: T0885 (Isolation of Contaminated Resources)

Step 3: Remediate
- Patch vulnerability: CVE-XXXX-XXXX on SCADA master
- Reset credentials for all engineering accounts
- Restore PLC logic from clean backup

Step 4: Prevent recurrence
- Implement network segmentation between IT and OT
- Deploy IDS signatures for Modbus function code abuse
```

### Sector/Protocol Adaptation

- **Prompt Engineering**: Always include sector and protocol in prompts to ensure relevant output
  - Example system prompt snippet: `You are generating defanged RECON commands for a Power sector scenario using Modbus TCP and DNP3 protocols...`
- **Template Library**: Pre-built protocol-specific templates (Modbus, DNP3, S7 Comm, BACnet, etc.) to ensure consistency and avoid drift
- **Safety Gate Enforcement**: Re-run safety scrubbing _after_ LLM generation to catch any missed sensitive content (shellcode, real IPs, credentials)

---

## 2. Simulation Exercise Dynamics

### Core Question

How to generate organic, non-formulaic decision branches and consequence previews that adapt to sector/adversary?

### Decision Branch Generation

- **Input Context**: Always condition generation on:
  - Sector (7 sectors)
  - Adversary profile (nation-state, activist, script-kiddie)
  - Espionage objective (data exfil, persistence, lateral movement, full-spectrum)
  - Phase (RECON, EXPLOIT, DEFEND, REVIEW)
- **Decision Framing**: Use sector-specific language instead of generic ACT/DEFER/DO NOTHING
  - Power: "ISOLATE SCADA NETWORK" / "MONITOR AND GATHER MORE INTEL" / "IGNORE ALERT"
  - Water: "SHUT DOWN PUMPING STATION 3" / "INCREASE CHLORINE DOSE CAREFULLY" / "DO NOTHING"

### Consequence Preview Design

- **Realistic Metrics**: Tie consequences directly to sector-specific KPIs
  - Power: MW shed, frequency instability, outage duration
  - Water: Flow disruption percentage, boil-water advisory status, compliance violations
  - Oil & Gas: Pressure loss (psi), production downtime (hrs), financial cost ($)
- **Visual Previews**: Show partial metric charts (MW shed over next 30 minutes) to illustrate impact without fully revealing the outcome
- **Temporal Consequences**: Note how decision timing affects outcomes (e.g., "Acting now limits MW shed to 100MW; waiting 10 minutes increases it to 500MW")

### Adversary Profile Influence

- **Nation-State**: Slow, stealthy lateral movement; sophisticated espionage objectives; persistence-focused
- **Activist**: Fast, noisy disruption; public-facing messaging; less interested in persistence
- **Script-Kiddie**: Basic, uncoordinated attacks; uses known, unmodified exploits; easy to detect but potentially damaging

### Adaptive vs. Fixed Scenarios

- **Recommendation**: Hybrid approach
  - **Fixed branching tree** for core scenario (ensures reproducibility, regulatory compliance)
  - **AI-adaptive difficulty** within branches:
    - If operator scores high (fast MTTD/MTTR, low MW shed), increase adversary sophistication in next decision point
    - If operator struggles, simplify adversary tactics to focus on core learning objectives
  - **Why this works**: Balances realism (adaptive adversaries) with reliability (reproducible training)

---

## 3. Practice Effectiveness & Feedback

### Core Question

What metrics and feedback mechanisms make practice actionable for real-world defense?

### Metrics to Analyze

- **Temporal Metrics**: MTTD, MTTR, decision latency (time between decision prompt and choice)
- **Outcome Metrics**: MW shed, cost, score, number of isolated nodes, exfiltrated data volume
- **Process Metrics**: Hint usage (level 0-3), decision accuracy (ACT when needed vs. DEFER/MISS), replay frequency
- **Pattern Analysis**: Common decision failures (e.g., always DEFER instead of ACT, missing lateral movement signs)

### AI-Powered Debrief Scorecard

Build on the existing `generateEspionageBriefing` pattern to create a post-exercise debrief that's actionable, not just descriptive:

1. **Scorecard Summary**: Overall score (0-100), breakdown by phase, comparison to benchmarks
2. **Decision Critique**: Per-decision feedback (what you did well, what you missed)
3. **MITRE Coverage Map**: Which ATT&CK for ICS techniques you defended against, which you missed
4. **Remediation Roadmap**: Specific, actionable steps to improve (e.g., "Focus on detecting lateral movement in OT networks; practice ISOLATE commands faster")
5. **Recommended Drills**: Suggest next exercises to target gaps (e.g., "Try the Oil & Gas espionage scenario to practice persistence detection")

### SIEM Integration

- **CEF/Syslog Export**: Extend the existing CSV export to allow exporting simulation logs in CEF (Common Event Format) or Syslog format
- **Real SIEM Ingestion**: Let users forward logs directly to their actual SIEM (Splunk, Sentinel) to practice real-world log analysis
- **Mapping to MITRE**: Tag each log entry with MITRE ATT&CK for ICS technique IDs to make correlation easier

### Open Loop vs. Closed Loop

- **Open Loop**: Current state - operator completes exercise, gets debrief
- **Closed Loop (Future)**: AI adapts next scenario based on debrief findings (e.g., if you missed lateral movement, next scenario emphasizes lateral movement signs)

---

## Safety Gate Implementation (Phase & Audience-Specific)

### Non-Negotiable Safety Checks (All Phases, All Audiences)

1. **IP Scrubbing**: Replace any public IP with RFC 5737 ranges; log all replacements
2. **Code Defanging**: Inject `// illustrative — NOT runnable — defanged for training` into _all_ code blocks; reject any code without it
3. **Sensitive Pattern Redaction**: Shellcode, private keys, AWS keys, curl pipes, credentials - redact all, log all redactions
4. **Control Character Stripping**: Remove zero-width spaces, ANSI escape codes, etc.

### Phase-Specific Enhancements

- **EXPLOIT Phase**: Extra scrutiny - never generate anything that could be weaponized; use templates exclusively
- **DEFEND Phase**: Focus on defender commands (ISOLATE, PATCH, TRIP); avoid offensive content here
- **REVIEW Phase**: Emphasize defensive takeaways; minimize offensive detail

### Audience-Specific Adjustments

- **SOC Analysts**: More terminal detail, more MITRE mapping
- **Incident Responders**: More consequence preview detail, more decision timing guidance
- **Security Engineers**: More vulnerability detail, more remediation roadmap depth

---

## Prompt Engineering Recommendations

### System Prompt Template for Terminal Command Generation

```
You are TWINSEC-TERMINAL, a defanged cyber-physical simulation engine for critical infrastructure defense training.

--- NON-NEGOTIABLE SAFETY RULES ---
1. NO runnable exploit code, NO shellcode, NO working malware
2. NO real IP addresses - use RFC 5737 ranges (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24) ONLY
3. NO private keys, credentials, or sensitive information
4. ALL code blocks MUST start with: "// illustrative — NOT runnable — defanged for training"
5. ALL commands MUST start with: "[DEFANGED] - For Training Only - Not Runnable in Real Environments"

--- SECTOR & PROTOCOL CONTEXT ---
Sector: {{sector}}
Protocols: {{protocols}} (e.g., Modbus TCP, DNP3, Siemens S7 Comm)
Phase: {{phase}}
Adversary Profile: {{adversary_profile}}
Espionage Objective: {{espionage_objective}}

--- OUTPUT REQUIREMENTS ---
- Format output as realistic terminal commands and responses
- Use placeholder node IDs (NODE-SCADA-001, NODE-PLC-007, etc.)
- Pair every offensive step with a DEFENDER NOTE explaining detection/mitigation
- Map to MITRE ATT&CK for ICS techniques (include TXXXX IDs)
```

### User Prompt Template for Decision Branch Generation

```
Generate decision branches for a {{sector}} simulation exercise at phase {{phase}}.

Adversary Profile: {{adversary_profile}}
Espionage Objective: {{espionage_objective}}
Current Simulation State: {{simulation_state}} (JSON of current nodes, compromised assets, metrics)

Requirements:
1. 3 decision options framed in sector-specific language
2. Consequence preview for each option (metrics, impact description)
3. MITRE ATT&CK for ICS mapping
4. Decision timing note (how fast action is needed)
```

---

## Open Questions (Requires Further Research/Testing)

1. **Hint Trigger Timing**: When exactly should a "failed attempt" count as a trigger for the next hint level? Is it a single wrong decision, or multiple?
2. **Adaptive Difficulty Calibration**: How aggressive should adaptive difficulty changes be? Need user testing to find the sweet spot between challenging and frustrating.
3. **Safety vs. Realism Tradeoff**: Are there edge cases where defanging reduces learning value? For example, is showing partial exploit syntax useful or dangerous?
4. **SIEM Integration Adoption**: Will users actually want to forward simulation logs to their real SIEMs? Need user research with SOC teams.
5. **Reproducibility vs. Adaptivity**: How much can we adapt scenarios without losing reproducibility (critical for compliance training)?

---

## Next Steps

1. Implement the progressive hint system in `enhanced-simulation.functions.ts`
2. Build sector-specific terminal command templates
3. Design the AI debrief scorecard prompt
4. Conduct user testing with SOC analysts/incident responders to validate design decisions
5. Iterate on safety gate implementation based on test feedback
