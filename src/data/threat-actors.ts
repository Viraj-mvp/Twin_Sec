export interface ThreatActorProfile {
  id: string;
  name: string;
  aliases: string[];
  classification: "Nation-State" | "Criminal" | "Insider" | "Unknown";
  origin: string;
  activeSince: string;
  primaryMotive: string;
  secondaryMotive: string;
  preferredTargets: { sector: string; why: string }[];
  signatureBehaviors: string[];
  psychologicalProfile: {
    patience: string;
    ego: string;
    riskTolerance: string;
    keyInsight: string;
  };
  mitreAttckIcs: { techniqueId: string; name: string; description: string }[];
  knownOperations: { name: string; year: string; impact: string }[];
  whatStopsThem: string[];
  greatestFailure: string;
  scenarioId: string;
  interviewContext: {
    characterName: string;
    personality: string;
    suggestedQuestions: string[];
  };
}

export const THREAT_ACTORS: ThreatActorProfile[] = [
  {
    id: "sandworm",
    name: "SANDWORM (APT44)",
    aliases: ["Voodoo Bear", "ELECTRUM", "Unit 74455"],
    classification: "Nation-State",
    origin: "Russia (Attributed with HIGH confidence, US DOJ indictment 2020)",
    activeSince: "2009",
    primaryMotive:
      "Strategic disruption — weaken adversary infrastructure during political tensions without crossing the threshold of open war.",
    secondaryMotive: "Demonstrate capability — the attack IS the message.",
    preferredTargets: [
      {
        sector: "Power Grid",
        why: "Darkness is visceral. It makes civilians feel the state failing.",
      },
      {
        sector: "Election & Transport",
        why: "Destabilize democratic process and supply logistics.",
      },
    ],
    signatureBehaviors: [
      "Extensive 6-12 month dwell time prior to execution",
      "Custom protocol-native ICS malware (Industroyer / CrashOverride)",
      "Destructive wiper malware (KillDisk) deployed simultaneously with breaker trips",
      "DoS attacks on telephone lines to paralyze incident response",
    ],
    psychologicalProfile: {
      patience: "Extremely high. 6-12 month dwell times before execution.",
      ego: "Moderate. Confident, military discipline, highly calculated.",
      riskTolerance: "Calibrated. They stay just below the threshold of open kinetic warfare.",
      keyInsight:
        "Sandworm does not act randomly. Every attack is timed to a political calendar. Ukraine 2015 attack: December 23rd, coldest week of winter. They want maximum human suffering, not just power loss. They think like military strategists.",
    },
    mitreAttckIcs: [
      {
        techniqueId: "T0865",
        name: "Spearphishing Attachment",
        description: "Phishing IT staff to gain initial network access.",
      },
      {
        techniqueId: "T0859",
        name: "Valid Accounts",
        description: "Reusing stolen VPN credentials to enter OT networks.",
      },
      {
        techniqueId: "T0855",
        name: "Unauthorized Command",
        description: "Issuing remote breaker open commands directly to substations.",
      },
      {
        techniqueId: "T0814",
        name: "Denial of Service",
        description: "Flooding telephone lines to prevent emergency response.",
      },
    ],
    knownOperations: [
      {
        name: "Ukraine Power Grid 2015",
        year: "2015",
        impact: "230,000 customers plunged into darkness for 6 hours in mid-winter.",
      },
      {
        name: "Ukraine Power Grid 2016 (Industroyer)",
        year: "2016",
        impact: "Fully automated IEC-104 protocol attack on Pivnichna substation.",
      },
      {
        name: "NotPetya Supply Chain Wiper",
        year: "2017",
        impact: "$10B+ global collateral damage masquerading as ransomware.",
      },
    ],
    whatStopsThem: [
      "Strict network segmentation between IT and OT",
      "Monitoring for legitimate credential abuse across VPN gateways",
      "Offline, out-of-band backups of PLC logic files",
      "Multi-factor authentication on all HMI and engineering workstations",
      "Protocol anomaly detection on IEC-104 and IEC-61850 networks",
    ],
    greatestFailure:
      "In 2022, CERT-UA detected INDUSTROYER2 before execution. Sandworm made the mistake of reusing infrastructure patterns. Pattern recognition by alert defenders stopped an attack designed to freeze 2 million people.",
    scenarioId: "power",
    interviewContext: {
      characterName: "Commander 'Voodoo' (APT44 Specialist)",
      personality:
        "Calm, cold, military precision. Speaks about power grids like a chess grandmaster analyzing piece sacrifices.",
      suggestedQuestions: [
        "Why did you choose December 23rd for the grid attack?",
        "Did you consider the civilian consequences of turning off heat in winter?",
        "What did you feel when the substations went dark?",
        "What single security control would have stopped your operation?",
      ],
    },
  },
  {
    id: "darkside",
    name: "DARKSIDE (Ransomware-as-a-Service)",
    aliases: ["BlackMatter", "ALPHV Affiliate Network"],
    classification: "Criminal",
    origin: "Eastern Europe (Likely operating out of non-extradition jurisdictions)",
    activeSince: "2020",
    primaryMotive: "Financial. Pure profit optimization structured like a corporate business.",
    secondaryMotive:
      "Reputation management — staying out of Western sanctions' crosshairs via moral licensing.",
    preferredTargets: [
      {
        sector: "Oil & Gas / Energy",
        why: "High financial impact; high urgency to pay ransom quickly.",
      },
      {
        sector: "Large Enterprises",
        why: "Deep pockets with cyber insurance policies.",
      },
    ],
    signatureBehaviors: [
      "Ransomware-as-a-Service (RaaS) model using third-party affiliates",
      "Double extortion: encrypting systems while exfiltrating sensitive internal data",
      "Public relations press releases and 'Code of Conduct' moral guidelines",
      "Proactive targeting of IT domain controllers to disable backups",
    ],
    psychologicalProfile: {
      patience: "Medium. Rapid 2-4 week intrusion-to-ransom timeline.",
      ego: "High. Maintained press contacts, customer service portals, and ethical stances.",
      riskTolerance:
        "Moderate. Avoided Soviet states and healthcare to prevent high-level government intervention.",
      keyInsight:
        "DarkSide needed moral licensing — 'We don't attack hospitals, so we aren't evil.' When their affiliate hit Colonial Pipeline and halted East Coast fuel, the resulting US federal pressure broke their ego and caused immediate brand collapse.",
    },
    mitreAttckIcs: [
      {
        techniqueId: "T0859",
        name: "Valid Accounts",
        description: "Compromised single-factor VPN credentials.",
      },
      {
        techniqueId: "T0886",
        name: "Remote Services",
        description: "Lateral movement via RDP and SMB administrative shares.",
      },
      {
        techniqueId: "T0809",
        name: "Data Destruction",
        description: "Salsa20/RSA-1024 encryption of critical enterprise volumes.",
      },
    ],
    knownOperations: [
      {
        name: "Colonial Pipeline Cyberattack",
        year: "2021",
        impact:
          "5,500 miles of fuel pipeline shutdown; $4.4M ransom paid; massive East Coast fuel panic.",
      },
      {
        name: "Brenntag Chemical Intrusion",
        year: "2021",
        impact: "Exfiltrated 150GB of sensitive chemical logistics data.",
      },
    ],
    whatStopsThem: [
      "Immutable, air-gapped offline backups",
      "Mandatory Multi-Factor Authentication (MFA) on all remote access points",
      "Strict IT/OT firewall boundaries preventing IT ransomware from reaching OT SCADA",
      "Cryptocurrency wallet tracking and rapid law enforcement collaboration",
    ],
    greatestFailure:
      "The FBI seized $2.3M of the Colonial Pipeline ransom payment by recovering the private key. The intense geopolitical heat forced DarkSide to shut down operations within one week.",
    scenarioId: "oil-gas",
    interviewContext: {
      characterName: "Operator 'Broker' (DarkSide Affiliate Negotiator)",
      personality:
        "Transactional, pragmatic, defensive. Views ransomware as an unscheduled security audit fee.",
      suggestedQuestions: [
        "Did you realize shutting down Colonial would paralyze fuel for 45% of the US East Coast?",
        "Why did your organization publish a Code of Conduct prohibiting healthcare attacks?",
        "What went through your mind when the FBI seized your cryptocurrency wallet?",
        "How did you obtain the initial VPN credentials?",
      ],
    },
  },
  {
    id: "insider-threat",
    name: "THE INSIDER THREAT (Universal Profile)",
    aliases: ["Disgruntled Operator", "Coerced Employee", "Malicious Vendor"],
    classification: "Insider",
    origin: "Internal — Present in every country and industrial enterprise",
    activeSince: "Universal",
    primaryMotive:
      "Grievance (wrongful termination, perceived disrespect) -> Ideology -> Financial distress.",
    secondaryMotive: "Ego restoration — proving 'they cannot survive without me.'",
    preferredTargets: [
      {
        sector: "Water & Municipal Works",
        why: "Familiar local infrastructure with direct community visibility.",
      },
      {
        sector: "Manufacturing & Power",
        why: "High operational dependency on specific skilled technicians.",
      },
    ],
    signatureBehaviors: [
      "Re-using legitimate authorized credentials outside shift hours",
      "Downloading SCADA configuration files or PLC ladder logic before resignation",
      "Bypassing physical security parameters via trusted employee access badges",
      "Altering valve or setpoint limits to values just outside operational tolerance",
    ],
    psychologicalProfile: {
      patience: "High. Dwell time ranges from 1 to 9 months following a trigger grievance.",
      ego: "Very High. Driven by feelings of unappreciated brilliance or unfair treatment.",
      riskTolerance: "Irrational. Blinded by emotional revenge; often fails to plan an escape.",
      keyInsight:
        "The insider threat operates on the MICE framework (Money, Ideology, Coercion, Ego). Unlike external APTs, the insider already has legitimate keys. They are caught not by firewalls, but by behavioral anomalies and peer vigilance.",
    },
    mitreAttckIcs: [
      {
        techniqueId: "T0859",
        name: "Valid Accounts",
        description: "Utilizing legitimate user credentials post-termination or out of shift.",
      },
      {
        techniqueId: "T0836",
        name: "Modify Parameter",
        description: "Directly tweaking PLC setpoints to cause environmental damage.",
      },
    ],
    knownOperations: [
      {
        name: "Maroochy Water Sewage Discharge",
        year: "2000",
        impact:
          "Disgruntled contractor Vitek Boden released 800,000 liters of raw sewage into Australian waterways 46 times.",
      },
      {
        name: "Dallas County Emergency Siren Hack",
        year: "2017",
        impact: "156 emergency weather sirens activated simultaneously for 90 minutes.",
      },
    ],
    whatStopsThem: [
      "Least-privilege access & strict separation of duties",
      "Immediate automated credential revocation upon HR termination notice",
      "User & Entity Behavior Analytics (UEBA) flagging abnormal access times",
      "Mandatory dual-custody verification for critical SCADA logic overrides",
    ],
    greatestFailure:
      "Vitek Boden was caught during a routine traffic stop with SCADA radio transmitters and stolen water authority software open on his laptop in the passenger seat.",
    scenarioId: "water",
    interviewContext: {
      characterName: "Subject 'Vitek' (Former System Integrator)",
      personality:
        "Resentful, articulate, defensive. Insists the company forced his hand by denying compensation.",
      suggestedQuestions: [
        "Why did you issue 46 separate commands to release sewage into municipal parks?",
        "What went through your mind when management ignored your grievances?",
        "Did you expect your access credentials to remain active after your contract ended?",
        "How could your supervisor have defused your actions before you acted?",
      ],
    },
  },
  {
    id: "volt-typhoon",
    name: "VOLT TYPHOON (Bronze Silhouette)",
    aliases: ["VANGUARD PANDA", "Insidious Typhoon"],
    classification: "Nation-State",
    origin: "China (Attributed with HIGH confidence by CISA, NSA, FBI 2024)",
    activeSince: "2021",
    primaryMotive:
      "PRE-POSITIONING. Establishing silent, persistent footholds inside US critical infrastructure to be activated during geopolitical conflict.",
    secondaryMotive: "Asymmetric deterrence — holding civilian utilities hostage.",
    preferredTargets: [
      {
        sector: "Ports & Transport",
        why: "Disrupt military deployment logistics during Indo-Pacific contingencies.",
      },
      {
        sector: "Power & Water Systems",
        why: "Induce domestic civilian chaos and strain crisis response capacity.",
      },
    ],
    signatureBehaviors: [
      "Living off the Land (LOLBins) — using legitimate admin tools (PowerShell, WMI, netsh)",
      "Routing command traffic through compromised SOHO routers to evade IP intelligence",
      "Zero malware footprint — avoiding traditional antivirus detection completely",
      "Extremely quiet credentials harvesting via NTDS.dit extraction",
    ],
    psychologicalProfile: {
      patience:
        "Infinite. Willing to maintain inactive access for years without triggering alerts.",
      ego: "None. Zero interest in publicity, ransom, or short-term disruption.",
      riskTolerance: "Calculated. Stealth is prioritized above all else.",
      keyInsight:
        "Volt Typhoon is not a burglar stealing data. They are a sleeper cell taking duplicate keys to the building. Their presence is a threat in potential — waiting for the order to activate.",
    },
    mitreAttckIcs: [
      {
        techniqueId: "T0859",
        name: "Valid Accounts",
        description: "Living off the land with stolen domain administrator credentials.",
      },
      {
        techniqueId: "T0886",
        name: "Remote Services",
        description: "Tunneling through SOHO routers via legitimate WMI and SSH protocols.",
      },
    ],
    knownOperations: [
      {
        name: "US Critical Infrastructure Pre-Positioning",
        year: "2023-2024",
        impact:
          "CISA advisory confirming dormant access across US water, power, port, and telecom sectors.",
      },
    ],
    whatStopsThem: [
      "Behavioral baselining flagging normal accounts executing abnormal WMI queries at 2 AM",
      "Strict network micro-segmentation preventing IT-to-OT lateral movement",
      "Honeytokens and decoy credentials that alert on any interaction",
      "Regular credential rotation and zero-trust identity verification",
    ],
    greatestFailure:
      "In early 2024, the US DOJ and FBI executed a court-authorized operation to disrupt the KV Botnet of SOHO routers used by Volt Typhoon, stripping away their stealth proxy network.",
    scenarioId: "port",
    interviewContext: {
      characterName: "Operative 'Vanguard' (Cyber Strategy Specialist)",
      personality:
        "Polite, academic, strategic. Refuses to admit guilt, framing actions as regional defense balance.",
      suggestedQuestions: [
        "Why establish access to municipal water and ports if you had no intention to disrupt them immediately?",
        "How do you maintain access for 30+ months without leaving a single malware file?",
        "What happens to your pre-positioned access if a crisis erupts?",
        "How did you feel when the FBI disabled your router proxy botnet?",
      ],
    },
  },
];

export function getThreatActor(id: string): ThreatActorProfile | undefined {
  return THREAT_ACTORS.find((t) => t.id === id);
}
