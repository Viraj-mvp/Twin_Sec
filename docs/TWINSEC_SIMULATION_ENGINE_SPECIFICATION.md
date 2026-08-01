# TwinSec Enhanced Simulation Engine Specification

## Table of Contents

1. [Overview](#overview)
2. [Sector-Specific C.L.E.A.R. Prompts](#sector-specific-clear-prompts)
3. [Database Schema Extensions](#database-schema-extensions)
4. [API Contract Extensions](#api-contract-extensions)
5. [Attack Vectors & Decision Trees](#attack-vectors--decision-trees)
6. [Terminal-Style Presentation Strategy](#terminal-style-presentation-strategy)
7. [Progressive Hint & Solution System](#progressive-hint--solution-system)
8. [Backend Safety & Validation](#backend-safety--validation)
9. [Test Coverage Strategy](#test-coverage-strategy)

---

## Overview

This specification defines the enhanced backend simulation engine for TwinSec, adding sector-distinct simulation logic, integrated espionage attack types, and robust backend infrastructure for the cyber-physical range platform.

### Core Objectives

- Enable 7 sector-specific simulation engines with tailored attack vectors
- Integrate espionage as a first-class attack type into all phases
- Provide terminal-style interaction with progressive hints
- Ensure robust safety, validation, and audit logging
- Extend database schema for new features

---

## Sector-Specific C.L.E.A.R. Prompts

### 1. Power Sector (HOLLOW Scenario)

#### Context

- **Topology**: Generation plants (gas/coal/nuclear), transmission substations, distribution feeders, SCADA/EMS systems, RTUs, PMUs
- **Protocols**: DNP3, Modbus TCP/RTU, IEC 61850, ICCP
- **Adversaries**: Nation-state (APT), cyber activists, script kiddies
- **Outcome Metrics**: MW shed, frequency instability duration, restoration time

#### Logic

- **Vulnerabilities**: Unpatched RTUs, default credentials, unencrypted DNP3, weak network segmentation
- **Decision Tree**: Recon → Initial Access → Privilege Escalation → Lateral Movement → Impact
- **Propagation Model**: Cascade from IT→OT→field devices; breaker trips cause islanding

#### Examples

**Attack Chain 1: Supply Chain Compromise**

1. Compromise vendor update server for SCADA workstations
2. Deploy backdoored firmware update to RTUs
3. Use backdoor to issue tripping commands to breakers
4. Outcome: 500MW shed, 2hr restoration time

**Attack Chain 2: Physical-First**

1. Gain physical access to substation via compromised contractor badge
2. Plug rogue device into maintenance port
3. Scan RTU network and exploit Modbus buffer overflow
4. Outcome: 200MW shed, 1hr restoration

#### Artifacts

- Metrics: MW shed over time, frequency graph, restoration timeline
- Visualizations: Topology heatmap of compromised nodes
- Export: PDF with decision log, terminal commands, and impact analysis

#### Reasoning

- Power sector has strict NERC/CIP compliance; simulation must reflect real regulatory constraints
- Espionage objectives focus on grid topology data and control system schematics
- Decision points must emphasize rapid detection and containment to prevent cascading failures

---

### 2. Water Sector (BASIN Scenario)

#### Context

- **Topology**: Treatment plants, pumping stations, reservoirs, distribution networks, SCADA systems, PLCs
- **Protocols**: Modbus, DNP3, Siemens S7, Ethernet/IP
- **Adversaries**: Nation-state, hacktivists, ransomware gangs
- **Outcome Metrics**: Flow disruption (%), water quality incidents, boil-water advisories

#### Logic

- **Vulnerabilities**: Unsecured PLCs, missing access controls, unencrypted telemetry
- **Decision Tree**: Recon → Initial Access → Collection → Exfiltration → Disruption
- **Propagation Model**: Spread from plant SCADA to pumping stations; chemical dosage manipulation

#### Examples

**Attack Chain 1: Data Exfiltration Espionage**

1. Phish water utility IT staff to gain initial access
2. Lateral move to SCADA network
3. Exfiltrate reservoir level data and chemical inventory
4. Outcome: Data breach, no immediate physical impact

**Attack Chain 2: Ransomware with Physical Impact**

1. Deploy ransomware to IT and OT networks
2. Lock SCADA workstations
3. Manipulate chlorination levels as pressure tactic
4. Outcome: Flow disruption 80%, boil-water advisory issued

#### Artifacts

- Metrics: Flow rate graph, water quality timeline, advisory status
- Visualizations: Distribution network map, chlorine level graph
- Export: PDF with incident timeline, decision log, and recovery steps

#### Reasoning

- Water sector has public health implications; simulation must balance realism with safety
- Espionage objectives include customer data, infrastructure schematics, and chemical inventories
- Decision points must prioritize public safety over technical perfection

---

### 3. Oil & Gas Sector (SEVENTH BREATH Scenario)

#### Context

- **Topology**: Refineries, pipelines, wellheads, offshore platforms, DCS systems, PLCs
- **Protocols**: Modbus, OPC UA, Foundation Fieldbus, HART
- **Adversaries**: Nation-state, cybercriminals, industrial espionage
- **Outcome Metrics**: Pressure loss (psi), production downtime (hrs), financial impact ($)

#### Logic

- **Vulnerabilities**: Unpatched DCS, weak OPC UA security, missing network segmentation
- **Decision Tree**: Recon → Initial Access → Persistence → Lateral Movement → Impact
- **Propagation Model**: Spread from platform DCS to pipeline control; valve manipulation

#### Examples

**Attack Chain 1: Espionage with Persistence**

1. Spear phish refinery engineer to gain initial access
2. Deploy persistent backdoor to DCS
3. Exfiltrate production data and pipeline schematics over 30 days
4. Outcome: Data breach, no immediate physical impact

**Attack Chain 2: Physical Disruption**

1. Compromise offshore platform DCS via spear phish
2. Manipulate wellhead pressure valves
3. Trigger emergency shutdown (ESD)
4. Outcome: Production downtime 72hrs, $5M financial impact

#### Artifacts

- Metrics: Pressure graph, production downtime, financial impact
- Visualizations: Pipeline topology, wellhead status map
- Export: PDF with incident timeline, decision log, and cost analysis

#### Reasoning

- Oil & gas sector has high financial impact and safety risks; simulation must reflect that
- Espionage objectives include production data, reserve estimates, and infrastructure schematics
- Decision points must emphasize ESD procedures and containment

---

### 4. Manufacturing Sector (MISFIRE Scenario)

#### Context

- **Topology**: Assembly lines, CNC machines, robots, MES/ERP systems, PLCs
- **Protocols**: Ethernet/IP, Profibus, Modbus, OPC UA
- **Adversaries**: Nation-state, ransomware, corporate espionage
- **Outcome Metrics**: Production downtime (hrs), scrap rate (%), financial impact ($)

#### Logic

- **Vulnerabilities**: Unsecured CNC machines, missing patch management, weak network segmentation
- **Decision Tree**: Recon → Initial Access → Lateral Movement → Impact
- **Propagation Model**: Spread from ERP to MES to PLCs; robot program manipulation

#### Examples

**Attack Chain 1: Ransomware on Manufacturing Floor**

1. Phish accounting staff to gain IT network access
2. Lateral move to MES network
3. Deploy ransomware that locks MES and PLCs
4. Outcome: Production downtime 48hrs, $2M financial impact

**Attack Chain 2: Industrial Espionage**

1. Compromise engineering workstation via USB drop
2. Exfiltrate CNC machine programs and product designs
3. Maintain persistence for future access
4. Outcome: IP theft, no immediate production impact

#### Artifacts

- Metrics: Production rate graph, scrap rate, downtime
- Visualizations: Assembly line topology, robot status map
- Export: PDF with incident timeline, decision log, and cost analysis

#### Reasoning

- Manufacturing sector has high IP value and production downtime costs
- Espionage objectives include product designs, process data, and customer lists
- Decision points must prioritize production continuity and IP protection

---

### 5. Port Sector (MANIFEST Scenario)

#### Context

- **Topology**: Container terminals, cranes, ships, TOS (Terminal Operating System), IoT sensors
- **Protocols**: Modbus, OPC UA, industrial Ethernet, maritime protocols
- **Adversaries**: Nation-state, ransomware, organized crime
- **Outcome Metrics**: Cargo disruption (TEUs), port downtime (hrs), financial impact ($)

#### Logic

- **Vulnerabilities**: Unsecured IoT sensors, missing access controls, weak TOS security
- **Decision Tree**: Recon → Initial Access → Collection → Disruption
- **Propagation Model**: Spread from TOS to crane controls; container tracking manipulation

#### Examples

**Attack Chain 1: Cargo Ransomware**

1. Compromise TOS via phish
2. Lock crane controls and container tracking
3. Demand ransom in cryptocurrency
4. Outcome: Port downtime 24hrs, 10,000 TEUs disrupted

**Attack Chain 2: Espionage with Cargo Manipulation**

1. Gain access to TOS via compromised vendor account
2. Exfiltrate cargo manifest data for high-value shipments
3. Manipulate container routing to divert shipments
4. Outcome: Data breach, cargo diversion

#### Artifacts

- Metrics: TEU throughput graph, downtime, diverted containers
- Visualizations: Terminal map, crane status
- Export: PDF with incident timeline, decision log, and cost analysis

#### Reasoning

- Port sector is critical for global supply chains; disruption has wide-reaching impact
- Espionage objectives include cargo manifests, customer data, and port schematics
- Decision points must prioritize supply chain continuity and cargo security

---

### 6. Smart Building Sector (STILL-AIR Scenario)

#### Context

- **Topology**: HVAC systems, lighting, security cameras, access control, BMS (Building Management System)
- **Protocols**: BACnet, Modbus, KNX, LonWorks
- **Adversaries**: Nation-state, cyber activists, corporate espionage
- **Outcome Metrics**: Occupancy safety incidents, downtime (hrs), financial impact ($)

#### Logic

- **Vulnerabilities**: Unsecured BACnet devices, default credentials, missing network segmentation
- **Decision Tree**: Recon → Initial Access → Persistence → Impact
- **Propagation Model**: Spread from BMS to HVAC to access control; temperature manipulation

#### Examples

**Attack Chain 1: Espionage via Security Cameras**

1. Compromise security camera DVR via default credentials
2. Exfiltrate camera feeds to monitor employee activity
3. Lateral move to BMS for persistent access
4. Outcome: Privacy breach, no immediate physical impact

**Attack Chain 2: HVAC Manipulation**

1. Compromise BMS via phish
2. Manipulate HVAC temperatures to cause equipment damage
3. Lock access control to trap employees
4. Outcome: Equipment damage, safety incident

#### Artifacts

- Metrics: Temperature graph, occupancy status, downtime
- Visualizations: Building floor plan, device status map
- Export: PDF with incident timeline, decision log, and safety analysis

#### Reasoning

- Smart building sector has safety and privacy implications
- Espionage objectives include employee activity, building schematics, and tenant data
- Decision points must prioritize occupant safety and privacy

---

### 7. Smart City Sector (GRIDLOCK Scenario)

#### Context

- **Topology**: Traffic lights, smart grids, public transit, surveillance cameras, IoT sensors
- **Protocols**: MQTT, CoAP, Modbus, BACnet
- **Adversaries**: Nation-state, cyber activists, organized crime
- **Outcome Metrics**: Traffic disruption (%), transit downtime (hrs), public safety incidents

#### Logic

- **Vulnerabilities**: Unsecured IoT sensors, weak MQTT security, missing access controls
- **Decision Tree**: Recon → Initial Access → Lateral Movement → Impact
- **Propagation Model**: Spread from traffic light controllers to smart grid; traffic manipulation

#### Examples

**Attack Chain 1: Traffic Gridlock**

1. Compromise traffic light controller via default credentials
2. Manipulate light timing to cause gridlock
3. Spread to other controllers for city-wide impact
4. Outcome: Traffic disruption 90%, 8hr downtime

**Attack Chain 2: Espionage via Surveillance**

1. Compromise city surveillance system via phish
2. Exfiltrate camera feeds and license plate data
3. Maintain persistence for future access
4. Outcome: Privacy breach, no immediate physical impact

#### Artifacts

- Metrics: Traffic flow graph, transit status, safety incidents
- Visualizations: City map, traffic light status
- Export: PDF with incident timeline, decision log, and public safety analysis

#### Reasoning

- Smart city sector has wide-reaching public impact and privacy concerns
- Espionage objectives include citizen data, city schematics, and critical infrastructure info
- Decision points must prioritize public safety and privacy

---

## Database Schema Extensions

### SQLite + Drizzle ORM Schema Extensions

#### 1. Extended `trainingRuns` Table

```typescript
export const trainingRuns = sqliteTable("training_runs", {
  id: text("id").primaryKey(),
  operatorId: text("operator_id")
    .notNull()
    .references(() => operators.id, { onDelete: "cascade" }),
  sector: text("sector").notNull(),
  adversary: text("adversary").notNull(),
  branch: text("branch").notNull(),
  mwShed: real("mw_shed").notNull(),
  mttd: integer("mttd").notNull(),
  mttr: integer("mttr").notNull(),
  cost: integer("cost").notNull(),
  score: integer("score").notNull(),
  shareUrl: text("share_url").notNull(),
  isolatedNodes: text("isolated_nodes"), // JSON array of node IDs

  // New fields for enhanced simulation
  attackType: text("attack_type").notNull().default("disruption"), // "disruption" | "espionage"
  adversaryProfile: text("adversary_profile").notNull().default("nation-state"), // "nation-state" | "activist" | "script-kiddie"
  attackChain: text("attack_chain").notNull().default("full-spectrum"),
  espionageObjective: text("espionage_objective"), // "data-exfiltration" | "persistence" | "lateral-movement"
  decisionHistory: text("decision_history"), // JSON array of decision objects
  terminalCommands: text("terminal_commands"), // JSON array of terminal commands
  hintLevel: integer("hint_level").notNull().default(0), // 0 = no hints, 3 = full solution
  exfiltratedData: text("exfiltrated_data"), // JSON object of exfiltrated data types
  persistenceEstablished: integer("persistence_established", { mode: "boolean" })
    .notNull()
    .default(false),

  createdAt: text("created_at").notNull(),
});
```

#### 2. New `simulationScenarios` Table

```typescript
export const simulationScenarios = sqliteTable("simulation_scenarios", {
  id: text("id").primaryKey(),
  sector: text("sector").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  attackType: text("attack_type").notNull(),
  adversaryProfile: text("adversary_profile").notNull(),
  initialNodes: text("initial_nodes").notNull(), // JSON array of node IDs
  events: text("events").notNull(), // JSON array of event objects
  decisions: text("decisions").notNull(), // JSON array of decision objects
  createdAt: text("created_at").notNull(),
});
```

#### 3. New `auditLogs` Table

```typescript
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  trainingRunId: text("training_run_id")
    .notNull()
    .references(() => trainingRuns.id, { onDelete: "cascade" }),
  timestamp: text("timestamp").notNull(),
  eventType: text("event_type").notNull(), // "decision" | "terminal-command" | "hint" | "error" | "state-change"
  details: text("details").notNull(), // JSON object of event details
});
```

---

## API Contract Extensions

### 1. Zod Schema Extensions

```typescript
// Sector enum - already exists
const SECTORS = [
  "power",
  "water",
  "oil-gas",
  "manufacturing",
  "port",
  "smart-building",
  "smart-city",
] as const;

// Attack type enum
const ATTACK_TYPES = ["disruption", "espionage"] as const;

// Adversary profile enum
const ADVERSARY_PROFILES = ["nation-state", "activist", "script-kiddie"] as const;

// Espionage objective enum
const ESPIONAGE_OBJECTIVES = [
  "data-exfiltration",
  "persistence",
  "lateral-movement",
  "full-spectrum",
] as const;

// Simulation phase enum
const SIMULATION_PHASES = ["RECON", "EXPLOIT", "DEFEND", "REVIEW"] as const;

// Decision option enum
const DECISION_OPTIONS = ["ACT", "DEFER", "DO_NOTHING"] as const;

// Extended save run input schema
const ExtendedSaveRunInput = z.object({
  sector: z.enum(SECTORS),
  adversary: z.string(),
  branch: z.string(),
  mwShed: z.number(),
  mttd: z.number(),
  mttr: z.number(),
  cost: z.number(),
  score: z.number(),
  shareUrl: z.string(),
  isolatedNodes: z.array(z.string()).optional(),

  // New fields
  attackType: z.enum(ATTACK_TYPES).default("disruption"),
  adversaryProfile: z.enum(ADVERSARY_PROFILES).default("nation-state"),
  attackChain: z.string().default("full-spectrum"),
  espionageObjective: z.enum(ESPIONAGE_OBJECTIVES).optional(),
  decisionHistory: z
    .array(
      z.object({
        timestamp: z.string(),
        phase: z.enum(SIMULATION_PHASES),
        decision: z.enum(DECISION_OPTIONS),
        consequence: z.string(),
      }),
    )
    .optional(),
  terminalCommands: z
    .array(
      z.object({
        timestamp: z.string(),
        command: z.string(),
        output: z.string(),
        success: z.boolean(),
      }),
    )
    .optional(),
  hintLevel: z.number().default(0),
  exfiltratedData: z.record(z.any()).optional(),
  persistenceEstablished: z.boolean().default(false),
});

// Generate terminal command input schema
const GenerateTerminalCommandInput = z.object({
  sector: z.enum(SECTORS),
  attackType: z.enum(ATTACK_TYPES),
  adversaryProfile: z.enum(ADVERSARY_PROFILES),
  phase: z.enum(SIMULATION_PHASES),
  nodeId: z.string().optional(),
  espionageObjective: z.enum(ESPIONAGE_OBJECTIVES).optional(),
});

// Get hint input schema
const GetHintInput = z.object({
  trainingRunId: z.string(),
  phase: z.enum(SIMULATION_PHASES),
  currentHintLevel: z.number().min(0).max(3),
});
```

### 2. Server Function Contracts

#### `generateTerminalCommand`

```typescript
export const generateTerminalCommand = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => GenerateTerminalCommandInput.parse(raw))
  .handler(async ({ data }) => {
    // Implementation:
    // 1. Validate input
    // 2. Generate sector/attack-type/phase-specific terminal command
    // 3. Scrub output for safety
    // 4. Return command and expected output
  });
```

#### `getSimulationHint`

```typescript
export const getSimulationHint = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => GetHintInput.parse(raw))
  .handler(async ({ data }) => {
    // Implementation:
    // 1. Get training run context
    // 2. Determine appropriate hint level based on currentHintLevel
    // 3. Return hint text (and solution if level 3)
  });
```

#### `extendedSaveTrainingRun`

```typescript
export const extendedSaveTrainingRun = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => ExtendedSaveRunInput.parse(raw))
  .handler(async ({ data }) => {
    // Implementation:
    // 1. Validate input
    // 2. Save extended training run data
    // 3. Create audit log entries
    // 4. Return success and run ID
  });
```

---

## Attack Vectors & Decision Trees

### Espionage Attack Type - 4-Phase Integration

#### Phase 1: RECON (Espionage Objective: Discovery)

- **Adversary Actions**: Passive network scanning, OSINT, vendor website recon
- **Terminal Commands**: Port scans, OS fingerprinting, protocol enumeration
- **User Decisions**:
  - ACT: Deploy network monitoring to detect scans
  - DEFER: Monitor passively and wait for more data
  - DO_NOTHING: Ignore scans (increases later impact)

#### Phase 2: EXPLOIT (Espionage Objective: Initial Access + Persistence)

- **Adversary Actions**: Exploit vulnerabilities, deploy backdoors, establish C2
- **Terminal Commands**: Exploit scripts, credential harvesting, backdoor installation
- **User Decisions**:
  - ACT: Isolate compromised nodes, patch vulnerabilities, reset credentials
  - DEFER: Investigate and contain slowly
  - DO_NOTHING: Allow persistence (increases exfiltration)

#### Phase 3: DEFEND (Espionage Objective: Lateral Movement + Exfiltration)

- **Adversary Actions**: Lateral movement, data collection, staging, exfiltration
- **Terminal Commands**: Lateral movement scripts, data collection tools, exfiltration
- **User Decisions**:
  - ACT: Block C2 traffic, quarantine staging servers, revoke credentials
  - DEFER: Monitor exfiltration to gather intel
  - DO_NOTHING: Allow full exfiltration

#### Phase 4: REVIEW (Espionage Objective: Post-Mortem)

- **Adversary Actions**: Cover tracks, maintain persistence for future access
- **Terminal Commands**: Log clearing, anti-forensics, persistence checks
- **User Decisions**:
  - ACT: Full forensic investigation, patch management update, enhanced monitoring
  - DEFER: Standard incident response
  - DO_NOTHING: Miss persistence (future attacks easier)

---

## Terminal-Style Presentation Strategy

### Terminal Command Format

```
[SECTOR] > [COMMAND]
[OUTPUT]
```

### Examples (Power Sector)

```
POWER > scan 192.0.2.10
Starting Nmap scan on 192.0.2.10 (SCADA Master)...
PORT     STATE SERVICE
502/tcp  open  Modbus
20000/tcp open  DNP3
MAC Address: 00:11:22:33:44:55 (Schneider Electric)

POWER > exploit modbus 192.0.2.10
// illustrative — NOT runnable — defanged for training
// Exploiting Modbus function code 90 vulnerability...
[+] Connected to Modbus device
[+] Uploading payload...
[+] Payload executed successfully
[+] Backdoor installed on port 1337
```

### Decision Point Presentation

```
=== DECISION POINT ===
Phase: DEFEND
Event: Suspicious data exfiltration detected to 203.0.113.50
Available Actions:
  [1] ACT: Block traffic to 203.0.113.50 and isolate staging server
  [2] DEFER: Monitor exfiltration to gather threat intel
  [3] DO_NOTHING: Ignore (risk full data exfiltration)
Choose an option [1-3]:
```

---

## Progressive Hint & Solution System

### Hint Levels (0-3)

- **Level 0**: No hint (user must figure it out)
- **Level 1**: Subtle hint (e.g., "Check your SIEM logs for unusual outbound traffic")
- **Level 2**: Direct hint (e.g., "Block traffic to 203.0.113.50 using your firewall")
- **Level 3**: Full annotated solution

### Solution Format (Level 3)

```
=== FULL SOLUTION ===
Step 1: Detect the exfiltration
- Check SIEM logs for large outbound transfers to unknown IPs
- Look for unusual data transfer times (off-hours)

Step 2: Contain the exfiltration
- Block traffic to 203.0.113.50 at the firewall
- Isolate the staging server (192.0.2.25) from the network

Step 3: Investigate and remediate
- Forensic analysis of staging server
- Check for persistence mechanisms
- Patch vulnerabilities used in initial access

Step 4: Prevent recurrence
- Update firewall rules
- Implement data loss prevention (DLP)
- Enhance monitoring for unusual outbound traffic
```

---

## Backend Safety & Validation

### 1. Safety Scrubbing

- **Forbidden Patterns**: Same as `espionage.functions.ts` (shellcode, private keys, AWS keys, curl pipes)
- **IP Replacement**: Replace public IPs with RFC 5737 ranges (203.0.113.X)
- **Code Block Defanging**: Force all code blocks to have "// illustrative — NOT runnable — defanged for training" prefix

### 2. Input Validation

- All inputs validated with Zod schemas
- Enum fields strictly enforced
- String length limits applied
- Numeric bounds checked

### 3. Audit Logging

- All state transitions logged
- All user decisions logged
- All terminal commands logged
- All hints/solutions logged
- All errors logged

### 4. Error Handling

- Graceful degradation when AI gateway unavailable
- Fallback to static attack scripts if dynamic generation fails
- Clear error messages for users
- Detailed error logging for debugging

---

## Test Coverage Strategy

### 1. Unit Tests

- Zod schema validation
- Safety scrubbing functions
- Hint level logic
- Audit logging functions

### 2. Integration Tests

- Server functions (generateTerminalCommand, getSimulationHint, extendedSaveTrainingRun)
- Database operations (save, read, update)
- AI gateway integration (with mocks for safety)

### 3. End-to-End Tests

- Full simulation flow for each sector
- Espionage attack type integration
- Hint system (all levels)
- Export functionality (PDF, JSON)

### 4. Security Tests

- Input fuzzing
- Safety scrubbing effectiveness
- SQL injection prevention
- XSS prevention

---

## Conclusion

This specification provides a comprehensive, production-ready blueprint for implementing the enhanced TwinSec simulation engine. All components align with existing codebase patterns (TanStack Start, Drizzle ORM, Zod, OpenRouter) and prioritize safety, realism, and educational value.
