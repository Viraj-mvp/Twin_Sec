/**
 * historical-attacks.ts
 *
 * Empirical historical ICS/OT cyber-physical attack records.
 * Rigorously models distinct sector hardware:
 * - POWER: Protective Relays (IEDs), Substation RTUs, SF6 Circuit Breakers, PMUs, AGC (NO generic PLCs).
 * - WATER: PLCs, Chemical Dosing Pumps, Online Analytical Instruments (AIT), Differential Pressure Transmitters (HAICon tags).
 *
 * Each attack features its own unique event sequence, decision tree, MITRE techniques, and physical telemetry drift.
 */

import type { SectorId, Event, Decision, Node } from "./scenarios";

export interface HistoricalAttack {
  id: string;
  code: string;
  name: string;
  year: number;
  sector: SectorId;
  targetFacility: string;
  threatActor: string;
  classification: string;
  attackVector: string;
  exploitedProtocols: string[];
  targetedHardware: {
    category: string;
    model: string;
    role: string;
  }[];
  mitreTtpList: {
    id: string;
    name: string;
    desc: string;
  }[];
  physicsImpact: {
    metric: string;
    baseline: string;
    consequence: string;
    datasetCorrelation?: string;
  };
  summary: string;
  tacticalObjectives: string[];
  terminalCommands: {
    cmd: string;
    desc: string;
  }[];
  events: Event[];
  decisions: Decision[];
  nodeOverrides?: Record<string, Partial<Node>>;
}

export const POWER_HISTORICAL_ATTACKS: HistoricalAttack[] = [
  {
    id: "industroyer",
    code: "INC-P01",
    name: "Industroyer / CRASHOVERRIDE",
    year: 2016,
    sector: "power",
    targetFacility: "Pivnichna 330kV Transmission Substation, Kyiv",
    threatActor: "Sandworm (Russian GRU Unit 74455 / Electrum)",
    classification: "NATION-STATE · PROTOCOL WEAPON · GRID BLACKOUT",
    attackVector:
      "Direct industrial protocol telecontrol injection. Delivered custom IEC 60870-5-104 and IEC 61850 payloads directly to substation RTUs. Concurrently executed a denial-of-service attack against Siemens SIPROTEC protective relays (CVE-2015-5374).",
    exploitedProtocols: ["IEC 60870-5-104", "IEC 61850 (GOOSE)", "OPC DA"],
    targetedHardware: [
      {
        category: "Substation RTU",
        model: "ABB RTU560 Telecontrol Gateway",
        role: "Aggregates station telemetry and dispatches telecontrol breaker commands.",
      },
      {
        category: "Protective Relay / IED",
        model: "Siemens SIPROTEC 4 7SJ62",
        role: "Microsecond line overcurrent & distance protection; blinded via memory corruption DoS.",
      },
      {
        category: "High-Voltage Circuit Breaker",
        model: "330kV SF6 Gas Circuit Breaker",
        role: "Transmission bus interrupter; forced OPEN under live 200MW power flow.",
      },
    ],
    mitreTtpList: [
      {
        id: "T0855",
        name: "Unauthorized Command Message",
        desc: "IEC-104 APDUs issued directly to substation RTUs to force breaker open states.",
      },
      {
        id: "T0814",
        name: "Denial of Service",
        desc: "UDP packet flood crashing Siemens SIPROTEC protective relay firmware.",
      },
      {
        id: "T0858",
        name: "Change Operating Mode",
        desc: "Substation RTU forced into test/diagnostic state to ignore central SCADA supervisory commands.",
      },
    ],
    physicsImpact: {
      metric: "Grid Frequency & Transmission Bus Power",
      baseline: "50.00 Hz nominal · 1,184 MW transmission throughput",
      consequence: "200 MW dropped instantaneously; transmission busbar de-energized; 20% of Kyiv in total blackout.",
      datasetCorrelation: "Tennessee / Eastern Interconnect Frequency Transient Replay",
    },
    summary:
      "First malware purpose-built to speak native electric grid telecontrol protocols (IEC 60870-5-104 and IEC 61850). Successfully disconnected the Pivnichna 330kV substation without touching corporate IT.",
    tacticalObjectives: [
      "Isolate substation RTU telecontrol gateway to sever unauthorized IEC-104 commands",
      "Verify SIPROTEC protective relay watchdog health and recover from UDP DoS flood",
      "Manually synchronize generator governor and close 330kV transmission bus breakers",
    ],
    terminalCommands: [
      { cmd: "iec104-apdu --target rtu-330 --type C_SC_NA_1 --ioa 1001 --val OPEN", desc: "IEC-104 breaker open command" },
      { cmd: "airgap sever --from switch-a --to rtu-330", desc: "Sever substation telecontrol line" },
      { cmd: "relay-recover --target siprotec-9 --reset-firmware", desc: "Restore tripped protective relay" },
    ],
    events: [
      {
        t: 0,
        tag: "INITIAL ACCESS",
        node: "ews-04",
        title: "Substation jump-host breached",
        desc: "Adversary gained initial foothold on engineering jump-host via compromised credentials.",
        sev: "MEDIUM",
        mitreId: "T0859",
      },
      {
        t: 900,
        tag: "DISCOVERY",
        node: "hist",
        title: "IEC-104 IOA telecontrol mapping",
        desc: "Single-line diagrams and Information Object Addresses enumerated over substation LAN.",
        sev: "HIGH",
        mitreId: "T0846",
      },
      {
        t: 2400,
        tag: "DENIAL OF SERVICE",
        node: "plc-7",
        title: "Siemens SIPROTEC relay DoS",
        desc: "Protective relay memory corruption exploit (CVE-2015-5374) sent over UDP port 50000.",
        sev: "CRITICAL",
        mitreId: "T0814",
      },
      {
        t: 5400,
        tag: "PROTOCOL ATTACK",
        node: "plc-3",
        title: "IEC-104 ASDU 45 command injected",
        desc: "Rogue telecontrol command sent to ABB RTU560 commanding transmission breaker OPEN.",
        sev: "CRITICAL",
        mitreId: "T0855",
      },
      {
        t: 7800,
        tag: "IMPACT",
        node: "brk",
        title: "330kV SF6 circuit breaker forced OPEN",
        desc: "Transmission bus breaker trips under 200MW active power flow. Station bus de-energized.",
        sev: "CRITICAL",
        mitreId: "T0831",
      },
      {
        t: 9120,
        tag: "CONSEQUENCE",
        node: "cent",
        title: "200 MW dropped — Kyiv blackout",
        desc: "Pivnichna 330kV transmission corridor severed. Grid frequency dips to 48.20 Hz.",
        sev: "CRITICAL",
        mitreId: "T0818",
      },
    ],
    decisions: [
      {
        id: "d1",
        t: 2400,
        trigger: "Siemens SIPROTEC relay DoS",
        question: "SIPROTEC relay watchdog offline. Sever station telecontrol link or trust autonomous trips?",
        context: "UDP flood blinded overcurrent relay. Severing telecontrol isolates RTU-330 but prevents remote restoration.",
        options: [
          {
            id: "ACT",
            label: "SEVER RTU LINK",
            consequence: "Telecontrol link severed. Breaker commands blocked. 0 MW shed.",
          },
          {
            id: "DEFER",
            label: "RESTART RELAY",
            consequence: "Relay reboots in 8 minutes. Adversary commands RTU in the interim.",
          },
          {
            id: "MISS",
            label: "IGNORE WATCHDOG",
            consequence: "Full breaker trip executes. Pivnichna substation de-energized.",
          },
        ],
      },
      {
        id: "d2",
        t: 5400,
        trigger: "IEC-104 ASDU 45 command injected",
        question: "Anomalous ASDU 45 packet detected on RTU port 2404. Force RTU into local manual mode?",
        context: "ASDU 45 instructs single command breaker trip. Local mode blocks all remote network commands.",
        options: [
          {
            id: "ACT",
            label: "FORCE LOCAL MODE",
            consequence: "Breaker trip command rejected at RTU. Grid remains stable.",
          },
          {
            id: "DEFER",
            label: "PACKET INSPECT",
            consequence: "Inspection takes 4 minutes; breaker contacts open before filter applies.",
          },
          {
            id: "MISS",
            label: "ALLOW APDU",
            consequence: "200 MW dropped. Total northern Kyiv blackout.",
          },
        ],
      },
    ],
  },
  {
    id: "ukraine-2015",
    code: "INC-P02",
    name: "Ukraine Power Grid (BlackEnergy 3)",
    year: 2015,
    sector: "power",
    targetFacility: "Kyivoblenergo & Prykarpattyaoblenergo Distribution Control Centers",
    threatActor: "Sandworm (Russian State-Sponsored)",
    classification: "NATION-STATE · SCADA GUI HIJACK · WIPER SABOTAGE",
    attackVector:
      "Spear-phishing with malicious Excel macros delivering BlackEnergy 3. Intruders pivoted into SCADA LAN via VPN, seized control of operator workstations, clicked open 30+ substation circuit breakers, deployed KillDisk wiper, and overwrote firmware on serial-to-Ethernet converters.",
    exploitedProtocols: ["RDP / Remote SCADA GUI", "DNP3", "Serial-to-Ethernet Gateway Modbus"],
    targetedHardware: [
      {
        category: "SCADA Operator Console",
        model: "ABB MicroSCADA Pro Workstation",
        role: "Central supervisory control displaying substation single-line diagrams.",
      },
      {
        category: "Serial-to-Ethernet Gateway",
        model: "Moxa NPort 5000 Series",
        role: "Bridges Ethernet SCADA network to serial RTU communication links; bricked via firmware rewrite.",
      },
      {
        category: "Substation Breakers",
        model: "110kV / 35kV Substation Vacuum Breakers",
        role: "Feeder distribution breakers feeding 135 substations.",
      },
      {
        category: "Uninterruptible Power Supply (UPS)",
        model: "APC Smart-UPS 5000VA",
        role: "Substation battery backup; blinded to cut power to dispatch center during blackout.",
      },
    ],
    mitreTtpList: [
      {
        id: "T0859",
        name: "Valid Accounts",
        desc: "Stolen VPN credentials used to penetrate SCADA management network.",
      },
      {
        id: "T0831",
        name: "Manipulation of Control",
        desc: "Adversaries took direct remote mouse control of operator dispatch consoles to click open breakers.",
      },
      {
        id: "T0857",
        name: "System Firmware",
        desc: "Malicious firmware flashed into serial-to-Ethernet converters to permanently sever remote control.",
      },
      {
        id: "T0818",
        name: "Damage to Property",
        desc: "KillDisk wiper destroyed master boot records on SCADA servers and field dispatch systems.",
      },
    ],
    physicsImpact: {
      metric: "Distribution Feeder Load & Customer Power Delivery",
      baseline: "135 substations online · 225,000 customers powered",
      consequence: "30+ substations disconnected simultaneously; 225,000 customers plunged into sub-zero freezing darkness.",
      datasetCorrelation: "Substation Feeder Breaker Trip Sequencing Telemetry",
    },
    summary:
      "Historic first acknowledged cyber-attack resulting in power outages. Operators watched helplessly as their mouse cursors moved autonomously to disconnect substation after substation.",
    tacticalObjectives: [
      "Terminate unauthorized remote administrative RDP/VPN sessions to SCADA consoles",
      "Isolate Moxa serial-to-Ethernet gateways before destructive firmware overwrite",
      "Dispatch field crews to substations for manual mechanical breaker reclosure",
    ],
    terminalCommands: [
      { cmd: "session kill --user operator-vpn --force", desc: "Revoke rogue VPN/RDP sessions" },
      { cmd: "gateway-lock --target moxa-gw --block-firmware-update", desc: "Prevent serial bridge firmware destruction" },
      { cmd: "manual-reclose --substation sub-9 --breaker brk-110", desc: "Emergency manual breaker engagement" },
    ],
    events: [
      {
        t: 0,
        tag: "INITIAL ACCESS",
        node: "ews-04",
        title: "Spear-phish macro executed",
        desc: "BlackEnergy 3 delivered via Word document. VPN tunnel bridged corporate LAN to SCADA.",
        sev: "MEDIUM",
        mitreId: "T0865",
      },
      {
        t: 1100,
        tag: "DISCOVERY",
        node: "hist",
        title: "Distribution network mapped",
        desc: "Topology of 135 substations mapped via supervisory historian and single-line diagrams.",
        sev: "HIGH",
        mitreId: "T0846",
      },
      {
        t: 2200,
        tag: "LATERAL",
        node: "hmi-11",
        title: "Dispatcher mouse cursor seized",
        desc: "Operators locked out of workstation as mouse cursors visibly moved to open breakers.",
        sev: "HIGH",
        mitreId: "T0859",
      },
      {
        t: 4500,
        tag: "IMPACT",
        node: "plc-3",
        title: "30+ substation breakers systematically opened",
        desc: "Feeder distribution breakers opened across 7 regional substations. 225,000 without power.",
        sev: "CRITICAL",
        mitreId: "T0831",
      },
      {
        t: 7200,
        tag: "SABOTAGE",
        node: "plc-7",
        title: "Moxa serial gateway firmware overwritten",
        desc: "Corrupt firmware written to serial bridges to permanently sever remote telemetry.",
        sev: "CRITICAL",
        mitreId: "T0857",
      },
      {
        t: 8900,
        tag: "CONSEQUENCE",
        node: "brk",
        title: "KillDisk deployed — Total blackout",
        desc: "Master boot records wiped on dispatch servers. UPS backup power blinded.",
        sev: "CRITICAL",
        mitreId: "T0818",
      },
    ],
    decisions: [
      {
        id: "d1",
        t: 2200,
        trigger: "Dispatcher mouse cursor seized",
        question: "Dispatcher workstation cursor moving without operator input. Pull main SCADA LAN uplink?",
        context: "Adversary is currently clicking substation breaker controls. Pulling uplink drops remote visibility.",
        options: [
          {
            id: "ACT",
            label: "PULL SCADA UPLINK",
            consequence: "Remote adversary disconnected. Breaker sweep halted after 2 substations.",
          },
          {
            id: "DEFER",
            label: "KILL RDP SESSION",
            consequence: "Adversary reconnects via secondary VPN tunnel and continues sweep.",
          },
          {
            id: "MISS",
            label: "WATCH CURSOR",
            consequence: "All 30+ substations disconnected. 225,000 customers in freezing dark.",
          },
        ],
      },
      {
        id: "d2",
        t: 7200,
        trigger: "Moxa serial gateway firmware overwritten",
        question: "Moxa serial bridges reporting firmware rewrite. Disconnect serial lines physically?",
        context: "Firmware overwrite permanently bricks converters, forcing manual truck rollouts for weeks.",
        options: [
          {
            id: "ACT",
            label: "UNPLUG SERIAL BRIDGES",
            consequence: "Gateways preserved. Remote telemetry can be restored once network sanitized.",
          },
          {
            id: "DEFER",
            label: "REBOOT BRIDGES",
            consequence: "Corrupt bootloader takes hold. Gateways permanently bricked.",
          },
          {
            id: "MISS",
            label: "DO NOTHING",
            consequence: "Field crews forced to spend 2 months manually inspecting substations.",
          },
        ],
      },
    ],
  },
  {
    id: "industroyer2",
    code: "INC-P03",
    name: "Industroyer2 Transmission Strike",
    year: 2022,
    sector: "power",
    targetFacility: "Ukrainian Regional High-Voltage Transmission Substations (CERT-UA#4435)",
    threatActor: "Sandworm",
    classification: "NATION-STATE · TARGETED APDU · CADDYWIPER COMBO",
    attackVector:
      "Direct standalone executable compiled specifically with hardcoded IEC 60870-5-104 configuration parameters, IP addresses, and Information Object Addresses (IOAs) for 9 electrical substations, paired with CaddyWiper and OrcShred.",
    exploitedProtocols: ["IEC 60870-5-104 Telecontrol"],
    targetedHardware: [
      {
        category: "Substation RTU Gateway",
        model: "Schneider Electric / ABB IEC-104 Substation RTU",
        role: "Direct target of hardcoded IEC-104 ASDU Type 45 commands.",
      },
      {
        category: "High-Voltage Bus Switchgear",
        model: "110kV / 330kV Transmission Busbar Interrupters",
        role: "Targeted for coordinated de-energization across 9 transmission nodes.",
      },
    ],
    mitreTtpList: [
      {
        id: "T0855",
        name: "Unauthorized Command Message",
        desc: "Hardcoded IEC-104 single-command messages (ASDU 45) sent directly to RTUs.",
      },
      {
        id: "T0807",
        name: "Command-Line Interface",
        desc: "Compiled standalone binary executing direct network socket commands.",
      },
    ],
    physicsImpact: {
      metric: "Regional Transmission Grid Stability",
      baseline: "Synchronized transmission ring across 9 regional substations",
      consequence: "Attempted cascading blackout; intercepted by defenders before breaker disconnect commands traversed RTUs.",
      datasetCorrelation: "Multi-Substation IEC-104 Command Log Stream",
    },
    summary:
      "A streamlined, highly targeted evolution of Industroyer designed to rapidly sever transmission substations using a dedicated lightweight binary.",
    tacticalObjectives: [
      "Inspect IEC-104 ASDU traffic for anomalous Information Object Addresses",
      "Deploy host-level air-gap to isolate substation gateways from upstream Linux jump-hosts",
      "Halt CaddyWiper execution before storage controller wiping",
    ],
    terminalCommands: [
      { cmd: "pcap-filter --proto iec104 --drop-asdu 45", desc: "Filter unauthorized IEC-104 single commands" },
      { cmd: "airgap isolate --target sub-gw-9", desc: "Emergency physical severance of substation gateway" },
    ],
    events: [
      {
        t: 0,
        tag: "INITIAL ACCESS",
        node: "ews-04",
        title: "Linux jump-host staged with binary",
        desc: "Industroyer2 standalone ELF binary uploaded to substation jump-host.",
        sev: "MEDIUM",
        mitreId: "T0807",
      },
      {
        t: 1200,
        tag: "DISCOVERY",
        node: "hist",
        title: "Target IOA configuration verified",
        desc: "Hardcoded IEC-104 Information Object Addresses matched against substation RTUs.",
        sev: "HIGH",
        mitreId: "T0846",
      },
      {
        t: 4200,
        tag: "PROTOCOL ATTACK",
        node: "plc-3",
        title: "Automated ASDU 45 batch transmission",
        desc: "Socket storm issuing IEC-104 single commands to 9 high-voltage substations.",
        sev: "CRITICAL",
        mitreId: "T0855",
      },
      {
        t: 7500,
        tag: "SABOTAGE",
        node: "plc-7",
        title: "CaddyWiper payload executed",
        desc: "CaddyWiper deployed to destroy partition tables and evidence.",
        sev: "CRITICAL",
        mitreId: "T0818",
      },
      {
        t: 8800,
        tag: "CONSEQUENCE",
        node: "brk",
        title: "Defenders intercept breaker commands",
        desc: "Rapid response team severed substation gateways; high-voltage blackout thwarted.",
        sev: "HIGH",
        mitreId: "T0818",
      },
    ],
    decisions: [
      {
        id: "d1",
        t: 4200,
        trigger: "Automated ASDU 45 batch transmission",
        question: "Incoming ASDU 45 storm detected on port 2404. Trigger emergency firewall air-gap rule?",
        context: "Air-gapping port 2404 blocks malicious breaker commands across all 9 substations.",
        options: [
          {
            id: "ACT",
            label: "AIR-GAP PORT 2404",
            consequence: "Malicious ASDU packets dropped. Transmission grid remains stable.",
          },
          {
            id: "DEFER",
            label: "FILTER IP LIST",
            consequence: "Adversary rotates jump-host IP and fires secondary batch.",
          },
          {
            id: "MISS",
            label: "ALLOW TRANSMISSION",
            consequence: "Breakers open simultaneously across 9 substations. Widespread grid collapse.",
          },
        ],
      },
    ],
  },
  {
    id: "davis-besse",
    code: "INC-P04",
    name: "Davis-Besse Slammer Worm Infection",
    year: 2003,
    sector: "power",
    targetFacility: "Davis-Besse Nuclear Power Station, Ohio",
    threatActor: "SQL Slammer Worm (Untargeted Cascading Worm)",
    classification: "INFRASTRUCTURE INCIDENT · PERIMETER BYPASS · SAFETY MONITOR LOSS",
    attackVector:
      "A contractor connected an infected laptop via an unmonitored external T1 line, completely bypassing the corporate firewall. The SQL Slammer worm generated massive UDP port 1434 packet floods that choked the plant's internal process control network.",
    exploitedProtocols: ["UDP Port 1434 (MS SQL Monitor)", "Internal Process Network"],
    targetedHardware: [
      {
        category: "Plant Process Computer (PPC)",
        model: "Process Supervisory Computer",
        role: "Maintains real-time thermal margin calculations and core telemetry.",
      },
      {
        category: "Safety Parameter Display System (SPDS)",
        model: "Nuclear Safety Console",
        role: "Critical safety console providing operators with continuous core cooling & coolant level data.",
      },
    ],
    mitreTtpList: [
      {
        id: "T0814",
        name: "Denial of Service",
        desc: "Network bandwidth exhaustion disabling Safety Parameter Display System.",
      },
      {
        id: "T0886",
        name: "Remote Services",
        desc: "Unfiltered contractor T1 line bridging external corporate network directly into SCADA LAN.",
      },
    ],
    physicsImpact: {
      metric: "Plant Safety Parameter Visibility",
      baseline: "Continuous digital core parameter telemetry",
      consequence: "SPDS knocked offline for 4 hours and 50 minutes; operators forced to rely on analog backup gauges.",
      datasetCorrelation: "Network Traffic Bandwidth vs SPDS Latency",
    },
    summary:
      "Demonstrated how an untargeted internet worm can leap across unmanaged contractor bridges and blind nuclear operators to core safety parameters for hours.",
    tacticalObjectives: [
      "Sever unmonitored T1 contractor bridge into plant process network",
      "Rate-limit UDP broadcast packets across internal supervisory switches",
      "Reboot and verify Safety Parameter Display System process monitors",
    ],
    terminalCommands: [
      { cmd: "firewall-drop --port 1434 --proto udp", desc: "Block Slammer propagation flood" },
      { cmd: "airgap sever --from ews-04 --to t1-bridge", desc: "Cut contractor T1 bridge" },
    ],
    events: [
      {
        t: 0,
        tag: "INITIAL ACCESS",
        node: "ews-04",
        title: "Contractor T1 line connected",
        desc: "Contractor laptop plugged into unmonitored T1 line, bypassing plant firewalls.",
        sev: "MEDIUM",
        mitreId: "T0886",
      },
      {
        t: 800,
        tag: "PROPAGATION",
        node: "hist",
        title: "SQL Slammer UDP port 1434 flood",
        desc: "Worm generates 55 million packets/second across internal supervisory switches.",
        sev: "HIGH",
        mitreId: "T0814",
      },
      {
        t: 2600,
        tag: "DENIAL OF SERVICE",
        node: "plc-3",
        title: "Process computer traffic choked",
        desc: "Network bandwidth completely consumed. Switch buffer overruns cause 98% packet loss.",
        sev: "HIGH",
        mitreId: "T0814",
      },
      {
        t: 5800,
        tag: "IMPACT",
        node: "plc-7",
        title: "Safety Parameter Display System crashes",
        desc: "SPDS screen freezes; digital reactor core coolant and margin displays fail.",
        sev: "CRITICAL",
        mitreId: "T0814",
      },
      {
        t: 8800,
        tag: "CONSEQUENCE",
        node: "brk",
        title: "Operators shift to analog dials",
        desc: "SPDS remains offline for 4 hours 50 minutes. Safety monitoring maintained via manual dials.",
        sev: "CRITICAL",
        mitreId: "T0818",
      },
    ],
    decisions: [
      {
        id: "d1",
        t: 800,
        trigger: "SQL Slammer UDP port 1434 flood",
        question: "Port 1434 UDP broadcast spike detected. Physically pull contractor T1 bridge cable?",
        context: "Slammer packet flood is choking control network bandwidth at 55 million packets/s.",
        options: [
          {
            id: "ACT",
            label: "PULL T1 CABLE",
            consequence: "Infection vector severed. Supervisory network stabilizes. SPDS preserved.",
          },
          {
            id: "DEFER",
            label: "RATE LIMIT SWITCH",
            consequence: "Buffer overruns crash switches before rate limiting takes effect.",
          },
          {
            id: "MISS",
            label: "WAIT FOR IT",
            consequence: "SPDS knocked offline for 4.8 hours. Operators blinded.",
          },
        ],
      },
    ],
  },
];

export const WATER_HISTORICAL_ATTACKS: HistoricalAttack[] = [
  {
    id: "oldsmar",
    code: "INC-W01",
    name: "Oldsmar Water Treatment Chemical Dosing",
    year: 2021,
    sector: "water",
    targetFacility: "City of Oldsmar Water Treatment Facility, Florida",
    threatActor: "Unauthenticated Remote Intruder",
    classification: "MUNICIPAL INTRUSION · REMOTE ACCESS · CHEMICAL OVERDOSE",
    attackVector:
      "Dormant TeamViewer remote desktop software running on an operator console was accessed using shared credentials. The intruder took live mouse control in front of the on-duty operator, navigated Wonderware InTouch SCADA, and increased the Sodium Hydroxide (Lye) dosing setpoint from 100 PPM to 11,100 PPM (+111× spike).",
    exploitedProtocols: ["TeamViewer Remote Protocol", "EtherNet/IP (CIP)", "Modbus/TCP"],
    targetedHardware: [
      {
        category: "SCADA Operator Console",
        model: "Wonderware InTouch HMI Workstation",
        role: "Displays water disinfection process and dosing setpoints.",
      },
      {
        category: "Water Treatment PLC",
        model: "Allen-Bradley CompactLogix 1769-L33ER",
        role: "Executes PID control loop for chemical dosing injection.",
      },
      {
        category: "Chemical Dosing Pump",
        model: "Grundfos DDA Digital Diaphragm Metering Pump",
        role: "Injects concentrated Sodium Hydroxide (NaOH / Lye) into clearwell basin.",
      },
      {
        category: "Analytical Instrument (AIT)",
        model: "Yokogawa FLXA21 Online pH / Conductivity Analyzer",
        role: "Monitors treated water pH; normal operating envelope 7.2–7.8 pH.",
      },
    ],
    mitreTtpList: [
      {
        id: "T0859",
        name: "Valid Accounts",
        desc: "Reused TeamViewer credentials without multi-factor authentication.",
      },
      {
        id: "T0836",
        name: "Modify Parameter",
        desc: "Direct manipulation of chemical dosing setpoint from 100 PPM to 11,100 PPM.",
      },
      {
        id: "T0886",
        name: "Remote Services",
        desc: "Unmanaged remote desktop tool installed directly on plant SCADA console.",
      },
      {
        id: "T0849",
        name: "Masquerading",
        desc: "Adversary utilized legitimate operator HMI screens to conceal unauthorized modification.",
      },
    ],
    physicsImpact: {
      metric: "Sodium Hydroxide (Lye) Concentration & Water pH",
      baseline: "100 PPM NaOH · 7.4 pH nominal potable water",
      consequence: "11,100 PPM commanded (+111× spike); water pH surges toward 12.0+ (caustic chemical hazard); intercepted by operator before entering distribution mains.",
      datasetCorrelation: "HAICon Process Basin Telemetry (P3_PIT01 & Chemical Residuals)",
    },
    summary:
      "A wake-up call for municipal water systems worldwide. The attacker attempted to turn safe drinking water into a caustic poison by walking chemical setpoints by +111×.",
    tacticalObjectives: [
      "Terminate unauthorized TeamViewer remote session on operator console",
      "Force PLC chemical dosing pump setpoint back to baseline (100 PPM)",
      "Activate manual isolation valve on clearwell effluent line to protect distribution mains",
    ],
    terminalCommands: [
      { cmd: "session kill --process teamviewer.exe --force", desc: "Kill rogue remote desktop process" },
      { cmd: "cip-write --plc plc-dose --tag NaOH_Dose_SP --val 100", desc: "Restore chemical dosing setpoint to 100 PPM" },
      { cmd: "valve-isolate --valve vlv-effluent --state CLOSED", desc: "Isolate clearwell effluent from municipal mains" },
    ],
    events: [
      {
        t: 0,
        tag: "INITIAL ACCESS",
        node: "ews-04",
        title: "TeamViewer remote access breached",
        desc: "Shared credentials used to access dormant TeamViewer installation on plant console.",
        sev: "MEDIUM",
        mitreId: "T0886",
      },
      {
        t: 820,
        tag: "DISCOVERY",
        node: "hist",
        title: "Disinfection trends enumerated",
        desc: "Intruder observed Wonderware InTouch water treatment disinfection trends.",
        sev: "HIGH",
        mitreId: "T0846",
      },
      {
        t: 1420,
        tag: "LATERAL",
        node: "hmi-11",
        title: "Remote mouse cursor seized visibly",
        desc: "Mouse moved across operator display; on-duty operator observed cursor control.",
        sev: "HIGH",
        mitreId: "T0859",
      },
      {
        t: 6200,
        tag: "IMPACT",
        node: "plc-3",
        title: "NaOH dosing setpoint jumped +111×",
        desc: "Sodium Hydroxide dosing setpoint walked from 100 PPM to 11,100 PPM (+111× spike).",
        sev: "CRITICAL",
        mitreId: "T0836",
      },
      {
        t: 7900,
        tag: "IMPACT",
        node: "cent",
        title: "Lye metering pump forced to 100% duty",
        desc: "Grundfos DDA metering pump stroke rate maxed out. Caustic alkaline surge begins.",
        sev: "CRITICAL",
        mitreId: "T0831",
      },
      {
        t: 9020,
        tag: "CONSEQUENCE",
        node: "brk",
        title: "Operator cancels setpoint manually",
        desc: "Vigilant operator immediately restored 100 PPM setpoint; zero contaminated water reached mains.",
        sev: "HIGH",
        mitreId: "T0818",
      },
    ],
    decisions: [
      {
        id: "d1",
        t: 1420,
        trigger: "Remote mouse cursor seized visibly",
        question: "Rogue mouse cursor moving on Wonderware console. Kill remote desktop process immediately?",
        context: "TeamViewer process running without active work order. Terminating process drops remote intruder.",
        options: [
          {
            id: "ACT",
            label: "KILL TEAMVIEWER",
            consequence: "Intruder disconnected before chemical setpoints touched. 0 PPM drift.",
          },
          {
            id: "DEFER",
            label: "OBSERVE CURSOR",
            consequence: "Intruder opens dosing setpoint window and modifies chemical parameters.",
          },
          {
            id: "MISS",
            label: "IGNORE CURSOR",
            consequence: "Attacker executes +111x chemical overdose.",
          },
        ],
      },
      {
        id: "d2",
        t: 6200,
        trigger: "NaOH dosing setpoint jumped +111×",
        question: "NaOH setpoint walked to 11,100 PPM. Force dosing pump to manual and isolate effluent valve?",
        context: "Clearwell buffer holds 60 minutes of volume. Effluent isolation prevents caustic distribution.",
        options: [
          {
            id: "ACT",
            label: "FORCE MANUAL & ISOLATE",
            consequence: "Pump reverted to 100 PPM. Caustic surge contained in clearwell basin.",
          },
          {
            id: "DEFER",
            label: "REQUEST LAB GRAB",
            consequence: "Lab sample takes 30 minutes; 11,100 PPM water enters distribution pipe network.",
          },
          {
            id: "MISS",
            label: "TRUST AUTO INTERLOCK",
            consequence: "11,100 PPM water reaches homes, causing chemical burns and pipe corrosion.",
          },
        ],
      },
    ],
  },
  {
    id: "aliquippa",
    code: "INC-W02",
    name: "Aliquippa Water Authority Booster Station Takeover",
    year: 2023,
    sector: "water",
    targetFacility: "Municipal Water Authority of Aliquippa, Pennsylvania",
    threatActor: "CyberAv3ngers (IRGC-Affiliated Threat Actor)",
    classification: "CRITICAL INFRASTRUCTURE · DEFAULT CREDENTIALS · DEFACEMENT SABOTAGE",
    attackVector:
      "A Unitronics Vision-series programmable controller monitoring and regulating water pressure at a remote booster station was directly accessible over the public Internet. The device was configured with the factory-default administrative password ('1111'). The attackers logged in, defaced the display screen with anti-Israel messaging, and disabled automatic pressure pump control.",
    exploitedProtocols: ["Modbus/TCP (Port 502)", "Unitronics PCOM (Port 20256)", "HTTP"],
    targetedHardware: [
      {
        category: "Programmable Logic Controller / HMI",
        model: "Unitronics Vision V570 PLC+HMI",
        role: "Monitors inlet/outlet water pressure and regulates booster pump cycle.",
      },
      {
        category: "Water Booster Pump",
        model: "Goulds 50HP Vertical Multistage Pump",
        role: "Maintains distribution line pressure across Raccoon and Potter townships.",
      },
      {
        category: "Pressure Transmitter",
        model: "Rosemount 3051S Pressure Transmitter (HAI P3_PIT01)",
        role: "Monitors distribution pipe pressure in bar/psi to prevent water hammer.",
      },
    ],
    mitreTtpList: [
      {
        id: "T0812",
        name: "Default Credentials",
        desc: "Exploitation of factory-default PIN ('1111') on internet-accessible PLC.",
      },
      {
        id: "T0883",
        name: "Internet Accessible Device",
        desc: "Direct cellular modem connection exposing PLC management port to public IP space.",
      },
      {
        id: "T0814",
        name: "Denial of Service",
        desc: "Booster pump control loop disabled, preventing automatic pressure stabilization.",
      },
    ],
    physicsImpact: {
      metric: "Booster Station Line Pressure (P3_PIT01)",
      baseline: "4.8 bar (70 psi) continuous distribution head",
      consequence: "Automatic regulation lost; line pressure sagged to 1.2 bar; operators immediately switched to manual physical pump controls.",
      datasetCorrelation: "HAICon Pressure Transmitter P3_PIT01 / P3_FIT01",
    },
    summary:
      "Iranian-backed threat actors exploited default credentials on an internet-exposed Unitronics PLC to seize control of drinking water booster pumps.",
    tacticalObjectives: [
      "Disconnect public cellular modem interface on Unitronics PLC",
      "Update default administrative PIN and disable remote PCOM port 20256",
      "Verify booster pump manifold pressure manually and restore automated setpoints",
    ],
    terminalCommands: [
      { cmd: "plc-auth --target plc-booster --set-pin 849204", desc: "Reset default factory PIN" },
      { cmd: "airgap isolate --target cellular-modem", desc: "Sever public internet link from booster PLC" },
      { cmd: "pump-override --target pump-boost-1 --duty 60", desc: "Set manual stable pump duty cycle" },
    ],
    events: [
      {
        t: 0,
        tag: "INITIAL ACCESS",
        node: "ews-04",
        title: "Unitronics default PIN 1111 exploited",
        desc: "Internet-exposed Unitronics Vision V570 PLC breached via public cellular IP address.",
        sev: "MEDIUM",
        mitreId: "T0812",
      },
      {
        t: 900,
        tag: "DISCOVERY",
        node: "hist",
        title: "Booster pressure tags enumerated",
        desc: "Automated booster cycling registers and manifold pressure tags mapped.",
        sev: "HIGH",
        mitreId: "T0883",
      },
      {
        t: 1800,
        tag: "TAMPERING",
        node: "plc-7",
        title: "Unitronics display screen defaced",
        desc: "CyberAv3ngers political message written to on-device graphic screen.",
        sev: "HIGH",
        mitreId: "T0849",
      },
      {
        t: 4800,
        tag: "DENIAL OF SERVICE",
        node: "plc-3",
        title: "Automatic pump control halted",
        desc: "Automated PID pressure stabilization loop disabled. Booster pump ceases cycling.",
        sev: "CRITICAL",
        mitreId: "T0814",
      },
      {
        t: 7200,
        tag: "PHYSICS",
        node: "cent",
        title: "Line pressure sags to 1.2 bar (P3_PIT01)",
        desc: "Distribution pressure drops below minimum threshold for Raccoon and Potter townships.",
        sev: "CRITICAL",
        mitreId: "T0818",
      },
      {
        t: 8500,
        tag: "CONSEQUENCE",
        node: "brk",
        title: "Manual mechanical pump bypass engaged",
        desc: "Operators dispatched to booster station to physically engage manual pump starter.",
        sev: "HIGH",
        mitreId: "T0818",
      },
    ],
    decisions: [
      {
        id: "d1",
        t: 1800,
        trigger: "Unitronics display screen defaced",
        question: "Unitronics display defaced. Air-gap cellular modem or attempt remote restart?",
        context: "The device is exposed directly to the internet. Air-gapping severs attacker PCOM sessions.",
        options: [
          {
            id: "ACT",
            label: "SEVER CELLULAR MODEM",
            consequence: "Attacker locked out. Booster pump stays in current state. Pressure preserved.",
          },
          {
            id: "DEFER",
            label: "REMOTE RESTART",
            consequence: "Reboot fails; attacker disables automatic regulation before device re-initializes.",
          },
          {
            id: "MISS",
            label: "DO NOTHING",
            consequence: "Booster regulation halted. Water pressure lost across two townships.",
          },
        ],
      },
      {
        id: "d2",
        t: 4800,
        trigger: "Automatic pump control halted",
        question: "Line pressure dropping below 2.0 bar. Switch booster pump to manual local override?",
        context: "Manual override maintains continuous pressure but requires 24/7 on-site operator presence.",
        options: [
          {
            id: "ACT",
            label: "MANUAL OVERRIDE",
            consequence: "Pressure stabilized at 4.5 bar. Distribution uninterrupted.",
          },
          {
            id: "DEFER",
            label: "WAIT FOR TECH",
            consequence: "Pressure sags to 1.2 bar; water hammer warnings trigger downstream.",
          },
          {
            id: "MISS",
            label: "LEAVE IDLE",
            consequence: "Complete water outage for 8,000 residents.",
          },
        ],
      },
    ],
  },
  {
    id: "maroochy",
    code: "INC-W03",
    name: "Maroochy Shire Sewage Pumping Spill",
    year: 2000,
    sector: "water",
    targetFacility: "Maroochy Shire Wastewater Collection Network, Queensland, Australia",
    threatActor: "Vitek Boden (Disgruntled Ex-Contractor Employee)",
    classification: "INSIDER THREAT · RF SPOOFING · PHYSICAL ENVIRONMENTAL DISASTER",
    attackVector:
      "A former contractor for Hunter Watertech used a stolen PDS engineering laptop and commercial two-way VHF radio transmitter. Over a 3-month period, he drove around the shire injecting forged digital RF telemetry packets, altered station addresses, disabled alarms, and locked pumps, causing raw effluent overflows.",
    exploitedProtocols: ["Proprietary 450 MHz VHF Radio SCADA Protocol"],
    targetedHardware: [
      {
        category: "Remote Terminal Unit (RTU)",
        model: "PDS Compact RTU",
        role: "Located at each of 142 sewage pumping stations to control pump start/stop and alarms.",
      },
      {
        category: "VHF Radio Transceiver",
        model: "Tait 450MHz Data Radio",
        role: "Transmits telecontrol commands across remote terrain; completely unencrypted.",
      },
      {
        category: "Submersible Wastewater Pump",
        model: "Flygt 75kW Submersible Effluent Pump",
        role: "Moves sewage from residential lift stations toward central treatment plant.",
      },
    ],
    mitreTtpList: [
      {
        id: "T0855",
        name: "Unauthorized Command Message",
        desc: "Rogue radio commands sent to RTUs commanding pumps to lock in the OFF position.",
      },
      {
        id: "T0858",
        name: "Change Operating Mode",
        desc: "Station addresses reassigned so the central SCADA master could not contact field RTUs.",
      },
      {
        id: "T0882",
        name: "Wireless Compromise",
        desc: "Unencrypted VHF radio frequencies spoofed using commercial radio transmitter.",
      },
    ],
    physicsImpact: {
      metric: "Wastewater Sump Level & Environmental Effluent Discharge",
      baseline: "Sump level kept below 2.5m; zero raw overflow",
      consequence: "Over 800,000 liters of raw sewage overflowed into public waterways, canals, and Hyatt Regency grounds; river marine life died.",
      datasetCorrelation: "Wastewater Lift Station Sump Level Drift Telemetry",
    },
    summary:
      "The classic insider cyber-physical attack. Demonstrates how rogue wireless packets can disable safety interlocks across 142 remote pumping stations and release 800,000 liters of raw sewage.",
    tacticalObjectives: [
      "Identify rogue RF transmitter frequency and isolate vulnerable 450MHz repeater",
      "Re-flash RTU station IDs to regain SCADA central supervisory polling",
      "Manually engage overflow diversion gates to protect public waterways",
    ],
    terminalCommands: [
      { cmd: "rf-scan --freq 452.125MHz --detect-rogue-station", desc: "Triangulate rogue VHF transmitter" },
      { cmd: "rtu-rekey --all-stations --radio-id 0x4B", desc: "Regain ownership of hijacked pumping station RTUs" },
    ],
    events: [
      {
        t: 0,
        tag: "INITIAL ACCESS",
        node: "ews-04",
        title: "Rogue 450MHz VHF transmitter active",
        desc: "Attacker parked in vehicle with stolen PDS laptop and high-gain radio antenna.",
        sev: "MEDIUM",
        mitreId: "T0882",
      },
      {
        t: 1200,
        tag: "SPOOFING",
        node: "hist",
        title: "Pumping station addresses overwritten",
        desc: "Rogue RF commands alter station addresses; central SCADA fails to poll 142 stations.",
        sev: "HIGH",
        mitreId: "T0858",
      },
      {
        t: 3800,
        tag: "PROTOCOL ATTACK",
        node: "plc-3",
        title: "Rogue pump LOCK-OFF command issued",
        desc: "Wastewater lift pumps commanded to lock OFF regardless of sump water level.",
        sev: "CRITICAL",
        mitreId: "T0855",
      },
      {
        t: 6400,
        tag: "PHYSICS",
        node: "cent",
        title: "Lift station sump level reaches overflow",
        desc: "Sump water level exceeds 2.5m capacity. Alarms suppressed by forged RF packets.",
        sev: "CRITICAL",
        mitreId: "T0818",
      },
      {
        t: 8800,
        tag: "CONSEQUENCE",
        node: "brk",
        title: "800,000 L raw sewage spilled into waterways",
        desc: "Untreated effluent inundates local parks, hotel grounds, and marine estuaries.",
        sev: "CRITICAL",
        mitreId: "T0818",
      },
    ],
    decisions: [
      {
        id: "d1",
        t: 1200,
        trigger: "Pumping station addresses overwritten",
        question: "Stations failing to poll central SCADA. Re-key 450MHz repeater frequencies immediately?",
        context: "Re-keying locks out the rogue transmitter but requires 15 minutes of downtime across all lift stations.",
        options: [
          {
            id: "ACT",
            label: "RE-KEY RF REPEATER",
            consequence: "Rogue transmitter locked out. Supervisory control regained before overflow.",
          },
          {
            id: "DEFER",
            label: "POLL REPEATEDLY",
            consequence: "Attacker continues spoofing packets; lift station pumps remain locked OFF.",
          },
          {
            id: "MISS",
            label: "ASSUME GLITCH",
            consequence: "800,000 liters of raw sewage spills into public parks and canals.",
          },
        ],
      },
    ],
  },
  {
    id: "kemuri",
    code: "INC-W04",
    name: "Kemuri Water District Chemical Alteration",
    year: 2016,
    sector: "water",
    targetFacility: "Undisclosed Municipal Water District (Verizon Security Report)",
    threatActor: "External Hacktivists / Cybercrime Actors",
    classification: "SUPPLY CHAIN / WEB PIVOT · SCADA TAMPERING · VALVE MANIPULATION",
    attackVector:
      "Attackers breached an internet-facing payment web application via SQL injection, accessed credentials, and pivoted directly through an unsegmented administrative router into the SCADA network. They altered chemical water treatment setpoints and valve flow schedules hundreds of times.",
    exploitedProtocols: ["HTTP / SQL", "Modbus/TCP", "SCADA LAN Routing"],
    targetedHardware: [
      {
        category: "SCADA Core Router",
        model: "Cellular / VPN Perimeter Router",
        role: "Lacked OT/IT air-gap segmentation between billing servers and treatment PLCs.",
      },
      {
        category: "Chemical Treatment PLC",
        model: "Water Treatment Automation Controller",
        role: "Governed chlorine residual metering and water distribution valve positions.",
      },
      {
        category: "Flow Control Valve Actuator",
        model: "Rotork Electric Flow Control Valve",
        role: "Regulates raw water intake and treated water discharge.",
      },
    ],
    mitreTtpList: [
      {
        id: "T0819",
        name: "Exploit Public-Facing Application",
        desc: "SQL injection on web payment portal leveraged to pivot into SCADA control LAN.",
      },
      {
        id: "T0836",
        name: "Modify Parameter",
        desc: "Chemical treatment setpoints modified repeatedly without operational justification.",
      },
    ],
    physicsImpact: {
      metric: "Chlorine Dosing Rate & Pipe Line Flow Rate",
      baseline: "1.2 PPM chlorine residual · 412 ML/D throughput",
      consequence: "Chemical setpoints shifted repeatedly; caught by operators comparing chemical inventory to SCADA logs before off-spec water entered public supply.",
      datasetCorrelation: "HAICon P3 Flow & Chemical Dosing Trend",
    },
    summary:
      "A classic IT-to-OT lateral movement incident where an unsegmented billing server enabled external hackers to repeatedly manipulate water treatment chemicals and valves.",
    tacticalObjectives: [
      "Sever IT/OT network bridge between web application server and SCADA router",
      "Audit chemical dosing PLC registers and lock setpoint writing privileges",
      "Re-calibrate chlorine residual flow analyzers against lab bench standards",
    ],
    terminalCommands: [
      { cmd: "network-isolate --vlan 30 --block-from billing-web", desc: "Enforce strict IT/OT perimeter segmentation" },
      { cmd: "plc-lock-registers --target plc-chem --mode READ_ONLY", desc: "Lock chemical dosing setpoint modifications" },
    ],
    events: [
      {
        t: 0,
        tag: "INITIAL ACCESS",
        node: "ews-04",
        title: "Web payment portal SQL injection",
        desc: "External attackers leveraged SQL injection on customer portal to harvest OT router creds.",
        sev: "MEDIUM",
        mitreId: "T0819",
      },
      {
        t: 1000,
        tag: "LATERAL",
        node: "hist",
        title: "Unsegmented administrative router crossed",
        desc: "Attacker pivoted from web server directly into treatment plant SCADA LAN.",
        sev: "HIGH",
        mitreId: "T0886",
      },
      {
        t: 3600,
        tag: "TAMPERING",
        node: "plc-3",
        title: "Chemical dosing rate modified repeatedly",
        desc: "Chlorine and fluoride setpoints manipulated hundreds of times over several weeks.",
        sev: "CRITICAL",
        mitreId: "T0836",
      },
      {
        t: 6800,
        tag: "IMPACT",
        node: "cent",
        title: "Distribution valve timing schedules altered",
        desc: "Rotork electric valve actuation timers modified to disrupt pipeline water pressure.",
        sev: "CRITICAL",
        mitreId: "T0831",
      },
      {
        t: 9000,
        tag: "CONSEQUENCE",
        node: "brk",
        title: "Operator inventory audit caught deviation",
        desc: "Operators detected chemical inventory discrepancies before off-spec water reached mains.",
        sev: "HIGH",
        mitreId: "T0818",
      },
    ],
    decisions: [
      {
        id: "d1",
        t: 1000,
        trigger: "Unsegmented administrative router crossed",
        question: "Unauthorized session from billing DMZ detected on SCADA router. Sever DMZ bridge?",
        context: "The billing server shares an unsegmented VLAN with the chemical treatment controller.",
        options: [
          {
            id: "ACT",
            label: "SEVER DMZ BRIDGE",
            consequence: "IT/OT bridge severed. Attacker loses pivot. Dosing setpoints remain intact.",
          },
          {
            id: "DEFER",
            label: "RESET ROUTER PASS",
            consequence: "Attacker maintains persistent shell on chemical controller.",
          },
          {
            id: "MISS",
            label: "IGNORE LOG",
            consequence: "Chemical dosing setpoints manipulated repeatedly over weeks.",
          },
        ],
      },
    ],
  },
];

export function getHistoricalAttacks(sector: SectorId): HistoricalAttack[] {
  if (sector === "power") return POWER_HISTORICAL_ATTACKS;
  if (sector === "water") return WATER_HISTORICAL_ATTACKS;
  return [];
}

export function getHistoricalAttackById(sector: SectorId, attackId: string): HistoricalAttack | undefined {
  const attacks = getHistoricalAttacks(sector);
  return attacks.find((a) => a.id.toLowerCase() === attackId.toLowerCase() || a.code.toLowerCase() === attackId.toLowerCase());
}
