export interface ResearchReference {
  title: string;
  authors: string;
  year: number;
  publisher: string;
  type: "academic" | "incident-report" | "cisa-advisory" | "book" | "vendor-report";
  url?: string;
  keyInsight: string;
  accessLevel: "free" | "requires-purchase" | "gov-only";
}

export interface CaseFile {
  id: string;
  title: string;
  subtitle: string;
  classification: string;
  incidentDate: string;
  target: string;
  sector: string;
  attributedTo: string;
  impact: string;
  story: {
    overview: string;
    narrative: string;
    timeline: { time: string; event: string; detail: string }[];
  };
  mitreMapping: { techniqueId: string; name: string; description: string }[];
  whatCouldHaveStoppedIt: string[];
  lessonsLearned: string;
  scenarioId: string;
  threatActorId: string;
  researchReferences: ResearchReference[];
}

export const CASE_FILES: CaseFile[] = [
  {
    id: "stuxnet",
    title: "CASE 01 · STUXNET (2010)",
    subtitle: "The First Digital Weapon",
    classification: "NATION-STATE · SABOTAGE · ZERO-DAY WEAPON",
    incidentDate: "2009 – 2010",
    target: "Natanz Uranium Enrichment Facility, Iran",
    sector: "Manufacturing / Critical Infrastructure",
    attributedTo: "United States & Israel (Attributed — Olympic Games)",
    impact: "~1,000 centrifuges physically destroyed. Iran's enrichment delayed 2 years.",
    story: {
      overview:
        "Stuxnet was a 500KB computer worm that infected Siemens S7-315 and S7-417 PLCs to destroy nuclear centrifuges while tricking operators with spoofed normal sensor readings.",
      narrative:
        "In 2009, Iranian technicians noticed centrifuges failing at extraordinary rates. Gauges showed normal operating pressure (50 Hz), but the rotors were secretly accelerated to 1,410 Hz then decelerated to 2 Hz, tearing the aluminum tubes apart via physical resonance fatigue.",
      timeline: [
        {
          time: "2007-2008",
          event: "Development Phase",
          detail: "Four zero-day exploits compiled into a single modular framework.",
        },
        {
          time: "2009-06",
          event: "Initial USB Infection",
          detail: "Delivered to Natanz via 5 target contractor companies.",
        },
        {
          time: "2010-06",
          event: "Discovery",
          detail: "VirusBlokAda in Belarus isolates the sample after a reboot loop error.",
        },
        {
          time: "2010-09",
          event: "Symantec Analysis",
          detail: "Reverse engineers confirm the PLC rootkit targeting frequency drives.",
        },
      ],
    },
    mitreMapping: [
      {
        techniqueId: "T0865",
        name: "Spearphishing Attachment",
        description: "USB thumb drive initial delivery.",
      },
      {
        techniqueId: "T0862",
        name: "Supply Chain Compromise",
        description: "Infected contractor engineering laptops.",
      },
      {
        techniqueId: "T0857",
        name: "System Firmware",
        description: "Rootkit injected directly into Siemens S7 PLC block memory.",
      },
      {
        techniqueId: "T0836",
        name: "Modify Parameter",
        description: "Frequency converter setpoint manipulation.",
      },
      {
        techniqueId: "T0849",
        name: "Masquerading",
        description: "Replayed 21 seconds of normal SCADA telemetry to hide destruction.",
      },
    ],
    whatCouldHaveStoppedIt: [
      "Strict USB hardware whitelisting and air-gap kiosk scanning",
      "Cryptographic code-signing verification on Siemens PLC ladder logic downloads",
      "Out-of-band physical vibration sensors independent of SCADA PLC network",
      "Behavioral monitoring of Siemens Step 7 engineering workstation software",
    ],
    lessonsLearned:
      "Physical air-gaps can be bridged by human contractors. Software malware can cause irreversible kinetic physical destruction.",
    scenarioId: "manufacturing",
    threatActorId: "sandworm",
    researchReferences: [
      {
        title: "Stuxnet: Dissecting a Cyberwarfare Weapon",
        authors: "Ralph Langner",
        year: 2011,
        publisher: "IEEE Security & Privacy",
        type: "academic",
        keyInsight:
          "First detailed analysis proving Stuxnet contained two distinct payloads: a high-frequency rotor attack and a pressure control valve attack.",
        accessLevel: "free",
        url: "https://www.langner.com/stuxnet/",
      },
      {
        title: "W32.Stuxnet Dossier",
        authors: "Nicolas Falliere, Liam O Murchu, Eric Chien",
        year: 2011,
        publisher: "Symantec Security Response",
        type: "vendor-report",
        keyInsight:
          "Definitive reverse-engineering whitepaper outlining the 4 zero-days, Siemens PLC memory layout override, and man-in-the-middle sensor spoofing.",
        accessLevel: "free",
        url: "https://www.symantec.com/content/en/us/enterprise/media/security_response/whitepapers/w32_stuxnet_dossier.pdf",
      },
      {
        title: "Countdown to Zero Day",
        authors: "Kim Zetter",
        year: 2014,
        publisher: "Crown Publishing",
        type: "book",
        keyInsight:
          "Investigative narrative of Operation Olympic Games and the geopolitical origins of physical cyberweapons.",
        accessLevel: "requires-purchase",
      },
    ],
  },
  {
    id: "ukraine-grid",
    title: "CASE 02 · UKRAINE POWER GRID (2015/2016)",
    subtitle: "Lights Out in Winter",
    classification: "NATION-STATE · POWER DISRUPTION",
    incidentDate: "December 23, 2015 & December 17, 2016",
    target: "Prykarpattya Oblenergo & Kyiv Substations",
    sector: "Power Grid",
    attributedTo: "Sandworm (Russian GRU Unit 74455)",
    impact: "230,000 customers plunged into darkness at -10°C for 6 hours.",
    story: {
      overview:
        "The first confirmed cyber-induced power grid blackout in history, executed via stolen VPN credentials, remote HMI takeover, and KillDisk wipers.",
      narrative:
        "At 3:35 PM on Dec 23, operators watched mice cursors move on their own as attackers opened 30 substations. The attackers then rewrote serial-to-Ethernet bridge firmware and flooded emergency call centers.",
      timeline: [
        {
          time: "2015-05",
          event: "Initial Access",
          detail: "Spearphishing macro attachment installs BlackEnergy 3.",
        },
        {
          time: "2015-10",
          event: "Lateral Pivot",
          detail: "Attackers harvest VPN credentials to bridge IT to SCADA OT.",
        },
        {
          time: "2015-12-23",
          event: "Blackout Execution",
          detail: "Remote desktop control used to trip 27 substations in 30 minutes.",
        },
        {
          time: "2016-12-17",
          event: "Industroyer Attack",
          detail: "Automated IEC-104 protocol attack on Pivnichna 330kV substation.",
        },
      ],
    },
    mitreMapping: [
      {
        techniqueId: "T0865",
        name: "Spearphishing Attachment",
        description: "Macro-enabled XLS documents delivering BlackEnergy.",
      },
      {
        techniqueId: "T0859",
        name: "Valid Accounts",
        description: "Single-factor VPN access using stolen domain admin credentials.",
      },
      {
        techniqueId: "T0855",
        name: "Unauthorized Command",
        description: "Opening distribution breakers across 30 substations.",
      },
      {
        techniqueId: "T0803",
        name: "Block Serial COM",
        description: "Firmware wipe on Moxa serial-to-Ethernet gateways.",
      },
    ],
    whatCouldHaveStoppedIt: [
      "Mandatory Multi-Factor Authentication (MFA) on corporate VPN gateways",
      "Network isolation preventing IT domain users from accessing OT HMI jump boxes",
      "Telephony rate-limiting to prevent PBX Denial of Service during crisis",
      "Offline firmware verification for serial communications gateways",
    ],
    lessonsLearned:
      "Legacy manual override capability saved Ukraine. Operators physically drove to substations and closed breakers by hand.",
    scenarioId: "power",
    threatActorId: "sandworm",
    researchReferences: [
      {
        title: "Analysis of the Cyber Attack on the Ukrainian Power Grid",
        authors: "Robert M. Lee, Michael Assante, Tim Conway",
        year: 2016,
        publisher: "SANS Institute & E-ISAC",
        type: "incident-report",
        keyInsight:
          "Comprehensive breakdown of the 6-stage kill chain from BlackEnergy spearphishing to TDM phone flooding.",
        accessLevel: "free",
        url: "https://www.sans.org/white-papers/36702/",
      },
      {
        title: "WIN32/INDUSTROYER: A new threat for industrial control systems",
        authors: "Anton Cherepanov",
        year: 2017,
        publisher: "ESET Research",
        type: "vendor-report",
        keyInsight:
          "Technical breakdown of CrashOverride — the first malware designed to natively speak IEC 101, IEC 104, and IEC 61850 grid protocols.",
        accessLevel: "free",
      },
    ],
  },
  {
    id: "triton",
    title: "CASE 03 · TRITON / TRISIS (2017)",
    subtitle: "Targeting Safety Instrumented Systems",
    classification: "NATION-STATE · SAFETY SYSTEM OVERRIDE",
    incidentDate: "August 2017",
    target: "Petro Rabigh Petrochemical Facility, Saudi Arabia",
    sector: "Oil & Gas",
    attributedTo: "TEMP.Veles (Russian Central Scientific Research Institute)",
    impact: "Emergency trip of petrochemical plant. Designed to disable safety shutdown systems.",
    story: {
      overview:
        "TRITON was the first malware family designed specifically to target Safety Instrumented Systems (SIS), putting human life directly at risk.",
      narrative:
        "Attackers compromised Triconex safety controllers via the TriStation protocol. A bug in the malware caused an unexpected logic trip, alerting operators before an explosive process event could occur.",
      timeline: [
        {
          time: "2014-2016",
          event: "Dwell & Recon",
          detail: "Attackers maintained persistent access to corporate IT network.",
        },
        {
          time: "2017-08",
          event: "SIS Reprogramming",
          detail: "TRITON payload injected into Triconex safety controller memory.",
        },
        {
          time: "2017-08-04",
          event: "Accidental Trip",
          detail: "Memory corruption bug triggers safety trip, exposing the malware.",
        },
      ],
    },
    mitreMapping: [
      {
        techniqueId: "T0857",
        name: "System Firmware",
        description: "Injecting custom shellcode into Triconex MP3008 firmware.",
      },
      {
        techniqueId: "T0836",
        name: "Modify Parameter",
        description: "Altering trip threshold logic on critical pressure release valves.",
      },
    ],
    whatCouldHaveStoppedIt: [
      "Physical keylock switch on Triconex SIS held strictly in 'RUN' mode",
      "Network isolation preventing TriStation engineering software from reaching IT",
      "Firmware checksum validation on Safety Instrumented Controllers",
    ],
    lessonsLearned:
      "Safety systems are no longer immune to attack. Disabling SIS creates catastrophic safety risks.",
    scenarioId: "oil-gas",
    threatActorId: "sandworm",
    researchReferences: [
      {
        title: "TRISIS Malware: Analysis of Safety System Targeted Malware",
        authors: "Dragos Threat Intelligence Team",
        year: 2017,
        publisher: "Dragos",
        type: "vendor-report",
        keyInsight:
          "First public analysis confirming malware designed to override physical safety interlocks.",
        accessLevel: "free",
      },
      {
        title: "MAR-17-352-01: HatMan Safety System Targeted Malware",
        authors: "CISA / ICS-CERT",
        year: 2017,
        publisher: "US Department of Homeland Security",
        type: "cisa-advisory",
        keyInsight: "Official DHS technical alert on Triconex protocol exploitation.",
        accessLevel: "free",
        url: "https://www.cisa.gov/news-events/alerts/2017/12/19/mar-17-352-01",
      },
    ],
  },
  {
    id: "oldsmar-water",
    title: "CASE 04 · OLDSMAR WATER TREATMENT (2021)",
    subtitle: "The Operator Who Was Watching",
    classification: "UNAUTHENTICATED · MUNICIPAL POISONING NEAR-MISS",
    incidentDate: "February 5, 2021",
    target: "Oldsmar Water Treatment Facility, Florida",
    sector: "Water Treatment",
    attributedTo: "Unattributed (Opportunistic remote desktop breach)",
    impact: "Lye (sodium hydroxide) setpoint raised from 111 PPM to 11,100 PPM (100x).",
    story: {
      overview:
        "An unauthorized party accessed SCADA controls via TeamViewer and raised lye dosing to toxic levels. A vigilant operator spotted the moving cursor and aborted the attack.",
      narrative:
        "At 1:30 PM, an operator watched his screen as a remote user opened sodium hydroxide dosing software and clicked setpoints up by 100x. The operator immediately intervened and restored safe settings.",
      timeline: [
        {
          time: "08:00 AM",
          event: "First Remote Access",
          detail: "Operator sees TeamViewer open, assumes supervisor access.",
        },
        {
          time: "01:30 PM",
          event: "Malicious Takeover",
          detail: "Remote user opens SCADA HMI and raises Lye levels to 11,100 PPM.",
        },
        {
          time: "01:35 PM",
          event: "Manual Override",
          detail: "Operator manually reverts setpoint before contaminated water leaves tanks.",
        },
      ],
    },
    mitreMapping: [
      {
        techniqueId: "T0859",
        name: "Valid Accounts",
        description: "Shared TeamViewer credentials without multi-factor authentication.",
      },
      {
        techniqueId: "T0836",
        name: "Modify Parameter",
        description: "Chemical dosing PPM setpoint manipulation.",
      },
    ],
    whatCouldHaveStoppedIt: [
      "Removal of unauthenticated TeamViewer remote desktop software from SCADA nodes",
      "Max physical limiters on chemical dosing pumps preventing >150 PPM input",
      "Multi-Factor Authentication on all external access",
    ],
    lessonsLearned:
      "Vigilant human operators remain an essential tier of defense. Physical setpoint limiters prevent software-driven over-dosing.",
    scenarioId: "water",
    threatActorId: "insider-threat",
    researchReferences: [
      {
        title: "AA21-042A: Compromise of U.S. Water Treatment Facility",
        authors: "CISA, FBI, EPA, MS-ISAC",
        year: 2021,
        publisher: "CISA Advisory",
        type: "cisa-advisory",
        keyInsight:
          "Joint alert highlighting outdated operating systems (Windows 7) and shared TeamViewer passwords in water sector.",
        accessLevel: "free",
        url: "https://www.cisa.gov/news-events/alerts/2021/02/11/aa21-042a-compromise-us-water-treatment-facility",
      },
    ],
  },
  {
    id: "colonial-pipeline",
    title: "CASE 05 · COLONIAL PIPELINE (2021)",
    subtitle: "87 Million People Without Fuel",
    classification: "CRIMINAL RANSOMWARE · IT-OT PROACTIVE SHUTDOWN",
    incidentDate: "May 7, 2021",
    target: "Colonial Pipeline Business IT Network",
    sector: "Oil & Gas Logistics",
    attributedTo: "DarkSide RaaS Affiliate",
    impact: "5,500 miles of fuel pipeline shutdown; $4.4M ransom paid; East Coast fuel panic.",
    story: {
      overview:
        "Ransomware encrypted IT billing networks, prompting Colonial to proactively halt OT pipeline operations for 5 days due to lack of operational visibility.",
      narrative:
        "Attackers used a single compromised legacy VPN password to breach IT networks. Fearing ransomware might pivot to OT safety controls, Colonial shut down the main pipeline.",
      timeline: [
        {
          time: "2021-04-29",
          event: "Initial Breach",
          detail: "DarkSide affiliate logs into legacy VPN using leaked password.",
        },
        {
          time: "2021-05-07",
          event: "Ransomware Deployed",
          detail: "100GB of IT billing data exfiltrated and 1,000 IT hosts encrypted.",
        },
        {
          time: "2021-05-07",
          event: "Pipeline Shutdown",
          detail: "Colonial proactively halts OT operations out of precaution.",
        },
        {
          time: "2021-06-07",
          event: "FBI Asset Recovery",
          detail: "DOJ recovers 63.7 Bitcoins ($2.3M) from DarkSide affiliate wallet.",
        },
      ],
    },
    mitreMapping: [
      {
        techniqueId: "T0859",
        name: "Valid Accounts",
        description: "Single-factor legacy VPN password from dark web leak.",
      },
      {
        techniqueId: "T0809",
        name: "Data Destruction",
        description: "DarkSide ransomware payload execution across corporate domain.",
      },
    ],
    whatCouldHaveStoppedIt: [
      "Decommissioning unused legacy VPN accounts",
      "Enforcing MFA across all remote access gateways",
      "Network segmentation allowing OT pipeline controls to run independently of IT billing",
    ],
    lessonsLearned:
      "IT ransomware can force an OT shutdown even if the OT network is untouched, due to billing or visibility dependencies.",
    scenarioId: "oil-gas",
    threatActorId: "darkside",
    researchReferences: [
      {
        title: "AA21-131A: DarkSide Ransomware",
        authors: "CISA & FBI",
        year: 2021,
        publisher: "CISA Advisory",
        type: "cisa-advisory",
        keyInsight: "Guidance on mitigating RaaS threats to critical infrastructure logistics.",
        accessLevel: "free",
        url: "https://www.cisa.gov/news-events/alerts/2021/05/11/aa21-131a-darkside-ransomware-best-practices-preventing-business-disruption",
      },
      {
        title: "Colonial Pipeline Ransom Recovery",
        authors: "Chainalysis Cybercrime Team",
        year: 2021,
        publisher: "Chainalysis Research",
        type: "vendor-report",
        keyInsight:
          "Detailed forensic tracking of the Bitcoin ransom transaction to the affiliate wallet.",
        accessLevel: "free",
      },
    ],
  },
];

export function getCaseFile(id: string): CaseFile | undefined {
  return CASE_FILES.find((c) => c.id === id);
}
