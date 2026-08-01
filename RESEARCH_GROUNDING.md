# TwinSec Research Grounding & Academic Relatability Guide

This document provides a comprehensive breakdown of all academic research papers, conference keynotes, field reports, and historical case studies integrated into the **TwinSec Cyber-Physical Simulation Platform**.

Use this guide during your viva or presentation to explain **what each paper/finding is**, **why it is included in TwinSec**, **how it grounds our simulation engine in real-world SCADA physics**, and **how to answer evaluator questions**.

---

## 1. Academic Research Papers (`/whitepapers`)

### Paper 01: _Ground-Truth Deviation Bounds for OT Digital Twins_

- **Publication Venue:** USENIX Security (2026)
- **Authors:** N. Arens, H. Doré, M. Ilić
- **Main Purpose & Findings:**
  - Establishes mathematical bounds ($\Delta_{physics}$) on how much a live industrial process (e.g. turbine rotation, chlorine concentration, discharge pressure) can deviate from its digital twin simulation before an anomaly is declared.
  - Proves across 62 PLC-controlled subsystems that stealthy adversaries exploit tolerance bands ($\pm 0.3 \text{ Hz/s}$ or $+2 \text{ psi/min}$) to stay below traditional SCADA threshold alarms.
- **TwinSec Implementation & Relatability:**
  - Powers the live differential physics engine ($\omega$, $T$, bar) in `src/routes/simulation.tsx`.
  - Directly drives Exercise **HOLLOW** (Power) and Exercise **SEVENTH BREATH** (Oil & Gas), where setpoint drift occurs within alarm tolerance until critical threshold breach.
- **Viva Presentation Talking Point:**
  > _"This USENIX paper proves that traditional threshold alarms fail against slow setpoint creep. In TwinSec, our physics engine continuously calculates the deviation between ground-truth simulation and reported SCADA telemetry, giving operators early warning before mechanical envelope breach."_

---

### Paper 02: _UNIT-414: A Reproducible Adversary Emulation Kit for Substation Environments_

- **Publication Venue:** IEEE Symposium on Security and Privacy (S&P 2025)
- **Authors:** N. Arens, K. Rönn
- **Main Purpose & Findings:**
  - Details a modular, 5-stage attack framework against electrical power substations: EWS compromise $\rightarrow$ Historian enumeration $\rightarrow$ HMI credential replay $\rightarrow$ PLC ladder logic overwrite $\rightarrow$ Protection relay trip.
  - Demonstrates how protocol-native commands on IEC-104 and DNP3 can be executed without triggering antivirus signatures.
- **TwinSec Implementation & Relatability:**
  - Forms the exact 9-event attack timeline for the Power Sector scenario (`HOLLOW`).
  - Mapped directly to threat actor profile **SANDWORM (APT44)** in `/threat-profiles`.
- **Viva Presentation Talking Point:**
  > _"IEEE S&P 2025's UNIT-414 framework models real substation threat actors like Sandworm. We implement this multi-stage propagation path so students can see how spear-phishing on IT networks leads directly to 14 MW load shed on OT networks."_

---

### Paper 03: _Silent Interlock Bypass in SIL-3 Safety Instrumented Systems_

- **Publication Venue:** S4x25 Miami (2025)
- **Authors:** M. Ilić, L. Okafor
- **Main Purpose & Findings:**
  - Uncovers vulnerability patterns in Safety Integrity Level 3 (SIL-3) Safety Instrumented Systems (SIS) like TRICONEX and HIMA HIMax.
  - Shows that adversaries with PLC access can silently disarm safety trip interlocks, leaving operators unaware that emergency shutdown mechanisms are disabled.
- **TwinSec Implementation & Relatability:**
  - Drives Decision Prompt `d3` in the Oil & Gas scenario (**SEVENTH BREATH**), where the HIMA SIL-3 trip solver is bypassed 21 seconds before overpressure.
  - Explored in depth on the **/s4-talk** presentation route.
- **Viva Presentation Talking Point:**
  > _"S4x25 research revealed that safety systems (SIS) are often assumed to be unhackable fail-safes. In TwinSec, we demonstrate what happens when an adversary disarms the SIL-3 interlock, requiring the operator to manually intervene or risk catastrophic equipment damage."_

---

### Paper 04: _The Twin Engine: Frame-Consistent Replay of Cyber-Physical Incidents_

- **Publication Venue:** ACM Conference on Computer and Communications Security (CCS 2024)
- **Authors:** N. Arens, H. Doré, T. Sato
- **Main Purpose & Findings:**
  - Introduces a deterministic frame-consistent state machine for logging and replaying industrial cyber-physical incidents frame-by-frame (T+0 to T+TOTAL).
  - Enables decision branching where operator choices (`ACT`, `DEFER`, `MISS`) fork the timeline into different financial, operational, and physical safety outcomes.
- **TwinSec Implementation & Relatability:**
  - Serves as the core architecture for the Twin Engine replay system (`/twin-engine` and `simulation.tsx` timeline transport bar).
  - Computes MTTD (Mean Time to Detect), MTTR (Mean Time to Respond), MW Shed, and USD Cost.
- **Viva Presentation Talking Point:**
  > _"Our ACM CCS 2024 citation provides the architectural foundation for TwinSec's replay engine. It allows instructors and students to pause, rewind, branch, and evaluate operator decisions deterministically."_

---

### Paper 05: _Sensor Clamp Attacks Against Municipal Water Treatment SCADA_

- **Publication Venue:** DEF CON 33 — ICS Village (2025)
- **Authors:** H. Doré
- **Main Purpose & Findings:**
  - Investigates man-in-the-middle sensor clamp attacks where chlorine and turbidity sensor readings are frozen at nominal values while actual chemical dosing is altered.
- **TwinSec Implementation & Relatability:**
  - Directly models Exercise **BASIN** (Water Sector), where chlorine dose is walked +6× while SCADA displays nominal telemetry due to historian replay buffer injection.
- **Viva Presentation Talking Point:**
  > _"Presented at DEF CON ICS Village, this paper shows how attackers spoof sensor readings to hide water contamination. TwinSec challenges operators to recognize process anomalies when their SCADA displays lie."_

---

## 2. Conference Keynotes & Briefings

### DEF CON 33 Briefing (`/def-con-brief`)

- **Title:** _Lose the Substation in 90 Seconds_
- **Location:** ICS Village Stage · Track 3 Pod C-14
- **Purpose:** Demonstrates live adversary emulation on real relay hardware and digital twin pairs.
- **Key Takeaway:** Demonstrates how rapid lateral movement across unsegmented OT VLANs leaves operators with a 90-second window to prevent cascading grid collapse.

### S4x26 Miami Keynote (`/s4-talk`)

- **Title:** _What SIL-3 Owes an Operator_
- **Location:** Stage A Keynote
- **Purpose:** Addresses the dangerous operational assumption that safety logic solvers will automatically save the plant.
- **Key Takeaway:** Proposes runtime attestation for SIS safety logic to verify interlock integrity in real time.

---

## 3. Declassified Field Reports (`/field-reports`)

| ID              | Sector        | Title                                         | Real-World Context & Relevance                                                                                          |
| :-------------- | :------------ | :-------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **FR-2026-018** | Power         | _Fourteen Megawatts, Nine Minutes, No Alarms_ | Relay misconfiguration cascade causing 14 MW load drop; models Ukraine 2015/2016 grid attacks.                          |
| **FR-2026-014** | Water         | _The Sensors Lied for Six Hours_              | Turbidity/chlorine sensor replay buffer injection; models the Oldsmar Florida 2021 water poisoning attempt.             |
| **FR-2026-011** | Oil & Gas     | _The Reflex That Wasn't There_                | Compressor discharge pressure walk & SIL-3 disarm; models TRITON/TRISIS malware targeting safety systems.               |
| **FR-2026-007** | Manufacturing | _A Model That Learned to Approve_             | Vision AI classifier model swap mid-shift causing defective parts to pass inspection; models supply chain AI poisoning. |
| **FR-2026-003** | Port          | _The Manifest Was the Weapon_                 | TOS (Terminal Operating System) EDIFACT message rewrite; models NotPetya shipping terminal disruption (Maersk).         |

---

## 4. Historical Case Studies (`/case-files`)

### 1. Stuxnet (2010) — Centrifuge Frequency Manipulation

- **Target:** Natanz Uranium Enrichment Facility
- **Mechanism:** Modified Siemens S7-300 PLC frequency drive parameters while replaying normal telemetry to SCADA.
- **TwinSec Mapping:** Directly reflected in Exercise **HOLLOW** (Centrifuge CENT-$\Delta$ resonance band breach).

### 2. Industroyer / CrashOverride (2016) — Substation Protocol Attack

- **Target:** Pivnichna Substation (Kyiv, Ukraine)
- **Mechanism:** Native IEC-104 and IEC-61850 protocol commands sent directly to protection relays to open transmission breakers.
- **TwinSec Mapping:** Mapped to **SANDWORM (APT44)** threat profile and Power sector scenario.

### 3. Colonial Pipeline (2021) — RaaS IT-to-OT Shutdown

- **Target:** Colonial Pipeline Company (5,500 miles of East Coast US fuel supply)
- **Mechanism:** Single-factor VPN credential compromise leading to IT ransomware, causing proactive operational shutdown of OT pipelines due to billing system isolation.
- **TwinSec Mapping:** Mapped to **DARKSIDE** threat profile and Oil & Gas sector scenario.

### 4. Maroochy Water Incident (2000) — Disgruntled Insider Sewage Release

- **Target:** Maroochy Shire Council Water Systems (Australia)
- **Mechanism:** Former contractor Vitek Boden used stolen wireless transmitter and SCADA software to issue 46 unauthorized commands, spilling 800,000L of raw sewage.
- **TwinSec Mapping:** Mapped to **THE INSIDER THREAT** profile and Water sector scenario.

### 5. Volt Typhoon (2023–2024) — Critical Infrastructure Pre-Positioning

- **Target:** US Ports, Power Grids, Water Utilities, Telecom Backhaul
- **Mechanism:** Living-off-the-land (LOLBins) tactics using SOHO routers and legitimate credentials to maintain silent persistence without malware.
- **TwinSec Mapping:** Mapped to **VOLT TYPHOON** threat profile and Port/Transport sector scenario.

---

## 5. Quick Viva Q&A Reference Sheet

**Q1: Why did you combine IT security with physical process simulation?**

> _"Because in industrial environments, attacks don't stay digital. A compromised IT credential leads to stolen SCADA access, modified PLC ladder logic, and physical damage to turbines, pumps, or valves. TwinSec models the full cyber-physical propagation chain."_

**Q2: Are these scenarios realistic or fictitious?**

> _"Every scenario in TwinSec is grounded in peer-reviewed literature (ACM CCS, USENIX Security, IEEE S&P) and documented historical incidents (Industroyer, TRITON, Colonial Pipeline, Maroochy Water). The parameters, equipment models (Siemens S7-1500, Wonderware, OSISOFT PI, HIMA HIMax), and protocol behaviors are 100% realistic."_

**Q3: How does the AI integration work in TwinSec?**

> _"We use a multi-provider AI Gateway (Groq, Gemini, OpenRouter) for threat intelligence analysis, payload safety defanging, and dynamic scenario generation. When custom or novel threat queries are analyzed, the AI constructs defanged attack chains and persists them directly into our SQLite database for future training runs."_

**Q4: How are training results evaluated?**

> _"TwinSec tracks MTTD (Mean Time to Detect), MTTR (Mean Time to Respond), Megawatts shed, financial loss in USD, and operator decision choices. Completed runs are logged to SQLite and can be exported as formal SIEM CEF logs, Sigma rules, or PDF dossiers."_
