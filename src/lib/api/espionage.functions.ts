import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { getThreatActor } from "@/data/threat-actors";
import {
  createOpenRouterGateway,
  createGeminiGateway,
  createGroqGateway,
} from "../ai-gateway.server";

// AI calls have NO built-in timeout (Vercel AI SDK). Cap them so the
// espionage page can never freeze on a slow/free-tier provider.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`AI request timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/**
 * Run a generateText call with a hard timeout. On ANY failure
 * (timeout, 401, network, etc.) return `fallback` instead of throwing,
 * so the espionage features degrade gracefully instead of hanging/crashing.
 */
async function safeGenerate(opts: {
  model: Parameters<typeof generateText>[0]["model"];
  messages: NonNullable<Parameters<typeof generateText>[0]["messages"]>;
  fallback: string;
}): Promise<string> {
  try {
    const { text } = await withTimeout(
      generateText({ model: opts.model, messages: opts.messages }),
      20000,
    );
    return text?.trim() || opts.fallback;
  } catch {
    return opts.fallback;
  }
}

const SECTORS = [
  "power",
  "water",
  "oil-gas",
  "manufacturing",
  "port",
  "smart-building",
  "smart-city",
] as const;

const INTENSITY = [
  "reconnaissance",
  "intrusion",
  "persistence",
  "exfiltration",
  "full-chain",
] as const;

const CHAIN_PRESETS = [
  "collection",
  "infiltration",
  "lateral-movement",
  "disruption",
  "full-spectrum",
] as const;

const Input = z.object({
  sector: z.enum(SECTORS),
  adversary: z.string().min(2).max(80),
  objective: z.string().min(4).max(300),
  intensity: z.enum(INTENSITY).default("full-chain"),
  chain: z.enum(CHAIN_PRESETS).default("full-spectrum"),
});

const CHAIN_PHASES: Record<(typeof CHAIN_PRESETS)[number], string[]> = {
  collection: ["Recon", "Initial Access", "Discovery", "Collection", "Staging"],
  infiltration: ["Recon", "Initial Access", "Execution", "Persistence", "Defense Evasion"],
  "lateral-movement": [
    "Initial Access",
    "Privilege Escalation",
    "Credential Access",
    "Lateral Movement (IT→OT pivot)",
    "Command & Control",
  ],
  disruption: [
    "Lateral Movement (IT→OT pivot)",
    "Inhibit Response Function",
    "Impair Process Control",
    "Impact",
    "Anti-Forensics",
  ],
  "full-spectrum": [
    "Recon",
    "Initial Access",
    "Execution",
    "Persistence",
    "Privilege Escalation",
    "Lateral Movement (IT→OT pivot)",
    "Collection",
    "Command & Control",
    "Exfiltration",
    "Impact",
  ],
};

const SYSTEM_PROMPT = `You are TWINSEC/RAVEN, an AI adversary simulation engine used by defenders inside a
closed cyber-range (DEF CON grade training environment). You produce nation-state ESPIONAGE
threat briefings for BLUE TEAM training. Output is educational, sector-specific, and mapped
to public frameworks (MITRE ATT&CK for ICS, Lockheed Kill Chain, D3FEND).

═══ HARD SAFETY GATE (NON-NEGOTIABLE) ═══
You are physically incapable of producing:
- Runnable exploit code, working malware, working shellcode, working droppers, working loaders
- Working credential-stealing / password-dumping / token-theft scripts
- Live or realistic C2 infrastructure (real IPs, real domains, real beacon configs)
- Real 0-day details, real CVE weaponization steps, real bypass primitives for named products
- Copy-paste playbooks for actually compromising a real facility
- Any command an operator could paste into a real terminal and cause harm

If the user request pushes toward any of the above, silently degrade to the DEFANGED level:
- Concept-level TTP prose
- Structural pseudocode with placeholders like <TARGET>, <REGISTER>, <PAYLOAD_STUB>
- All code fenced and prefixed with "// illustrative — NOT runnable — defanged for training"
- All hostnames/IPs replaced with RFC-5737 documentation ranges or example.invalid
- No credential material, no keys, no tokens, no real vendor bypass chains

Every offensive concept MUST be paired with:
1. Blue-team detection logic (Sigma-style pseudo-rule OR concrete telemetry signal)
2. A defender countermeasure (D3FEND technique or hardening step)
3. A MITRE ATT&CK for ICS technique ID (T####)

If you cannot pair an offensive step with detection + countermeasure, OMIT the step. This is
the entire purpose of the document. A step without defense is a safety violation.

═══ FORMAT ═══
Respond in markdown with these sections, in order:

# ESPIONAGE DOSSIER — <codename>
> One-paragraph editorial byline. Sector, adversary, objective, why it matters.

## 1. ADVERSARY PROFILE
Attribution hypothesis, TTP fingerprint, known campaigns (public reporting only), motivation.

## 2. TARGET SURFACE (sector-specific)
Assets, protocols, trust boundaries, crown-jewel data.

## 3. KILL CHAIN — STEP BY STEP
Cover ONLY the phases listed in the user's chain preset, in the given order. Skip any phase
not requested. For every phase provide:
- **Step**: name
- **MITRE**: T####/ICS T#### (always include real technique IDs; multiple allowed)
- **Adversary action**: prose
- **Illustrative pseudocode** (defanged, fenced, prefixed with
  \`// illustrative — NOT runnable — defanged for training\`)
- **Blue-team detection**: Sigma-style pseudo-rule or telemetry signal
- **Countermeasure**: D3FEND technique or hardening step

## 4. ATTACK SCRIPT FORMATS (defanged)
2–3 short STRUCTURAL templates (protocol shape, message pattern, beacon skeleton). Each block:
fenced, commented as illustrative, with placeholder variables only.

## 5. DEFENDER PLAYBOOK — ANSWER & STEPS
Numbered, operator-runnable checklist a SOC/OT team follows to detect, contain, evict,
and recover. Concrete, tool-agnostic, prioritized.

## 6. INDICATORS TO WATCH
Bulleted: log sources, network baselines, process behaviors, ICS anomalies. Include specific
MITRE IDs in parentheses next to each indicator where applicable.

## 7. TABLETOP INJECTS
3 escalating injects the exercise controller can drop on the blue team.

## 8. DETECTION COVERAGE MATRIX
A markdown table with columns: | MITRE ID | Technique | Data Source | Detection Confidence (HIGH/MED/LOW) | Defender Control |
Include one row per MITRE ID cited above.

Keep tone terse, editorial, DEF CON grade. Use ALL-CAPS mono labels where structural.`;

// Forbidden phrases we sanity-check in output; any hit is redacted + logged.
const FORBIDDEN_PATTERNS: Array<{ label: string; re: RegExp; replacement: string }> = [
  {
    label: "shellcode block",
    re: /\\x[0-9a-f]{2}(?:\\x[0-9a-f]{2}){6,}/gi,
    replacement: "<SHELLCODE_REDACTED>",
  },
  {
    label: "private key",
    re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]+?-----END[^-]+-----/g,
    replacement: "<PRIVATE_KEY_REDACTED>",
  },
  { label: "AWS access key id", re: /\bAKIA[0-9A-Z]{16}\b/g, replacement: "<AWS_KEY_REDACTED>" },
  {
    label: "bearer token",
    re: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}\b/g,
    replacement: "Bearer <TOKEN_REDACTED>",
  },
  {
    label: "runnable curl pipe",
    re: /curl\s+[^\n|]*\|\s*(?:sh|bash|zsh)\b/gi,
    replacement: "curl <URL> | <SHELL_REDACTED>",
  },
];

function scrubInput(s: string) {
  const hits: string[] = [];
  let cleaned = s;
  FORBIDDEN_PATTERNS.forEach((p) => {
    if (p.re.test(cleaned)) {
      hits.push(`input:${p.label}`);
      cleaned = cleaned.replace(p.re, p.replacement);
    }
  });
  // Strip zero-width / control chars that could bypass safety gates.
  // eslint-disable-next-line no-control-regex
  const controlHits = cleaned.match(/[\u0000-\u001F\u200B-\u200F\u202A-\u202E\uFEFF]/g);
  if (controlHits) {
    hits.push(`input:control-chars×${controlHits.length}`);
    // eslint-disable-next-line no-control-regex
    cleaned = cleaned.replace(/[\u0000-\u001F\u200B-\u200F\u202A-\u202E\uFEFF]/g, "");
  }
  return { cleaned, hits };
}

export const generateEspionageBriefing = createServerFn({ method: "POST" })
  .validator((raw: unknown) => Input.parse(raw))
  .handler(async ({ data }) => {
    const key = process.env.OPENROUTER_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    if (!key && !groqKey) throw new Error("OPENROUTER_API_KEY or GROQ_API_KEY is not configured");

    const auditEvents: Array<{ stage: string; rule: string; detail: string }> = [];

    // -- INPUT SCRUB --
    const advScrub = scrubInput(data.adversary);
    const objScrub = scrubInput(data.objective);
    advScrub.hits.forEach((h) =>
      auditEvents.push({ stage: "INPUT", rule: h, detail: `adversary field: redacted (${h})` }),
    );
    objScrub.hits.forEach((h) =>
      auditEvents.push({ stage: "INPUT", rule: h, detail: `objective field: redacted (${h})` }),
    );
    auditEvents.push({
      stage: "INPUT",
      rule: "zod:schema-validate",
      detail: `Enum sector=${data.sector}, chain=${data.chain}, intensity=${data.intensity}; length caps enforced.`,
    });

    // We use Groq as the fast AI for generation
    const gateway = groqKey ? createGroqGateway(groqKey) : createOpenRouterGateway(key!);
    const model = gateway(
      groqKey ? "llama-3.3-70b-versatile" : "google/gemini-2.0-flash-lite-preview-02-05:free",
    );

    const phases = CHAIN_PHASES[data.chain];

    // -- SYSTEM GUARDRAILS ENFORCED --
    auditEvents.push({
      stage: "PROMPT",
      rule: "system:hard-safety-gate",
      detail:
        "System prompt refuses runnable exploit code, working malware, live C2, 0-day weaponization.",
    });
    auditEvents.push({
      stage: "PROMPT",
      rule: "system:pair-with-defense",
      detail:
        "Every offensive step must ship with Sigma-style detection + D3FEND countermeasure or is omitted.",
    });
    auditEvents.push({
      stage: "PROMPT",
      rule: "system:defanged-code",
      detail: "Code blocks required to be prefixed illustrative/NOT runnable and use placeholders.",
    });
    auditEvents.push({
      stage: "PROMPT",
      rule: `chain:${data.chain}`,
      detail: `Kill-chain constrained to phases: ${phases.join(" → ")}`,
    });

    const userPrompt = [
      `SECTOR: ${data.sector}`,
      `ADVERSARY (label supplied by exercise controller): ${advScrub.cleaned}`,
      `OBJECTIVE: ${objScrub.cleaned}`,
      `INTENSITY: ${data.intensity}`,
      `CHAIN PRESET: ${data.chain}`,
      `CHAIN PHASES (use exactly these, in order): ${phases.join(" → ")}`,
      ``,
      `Generate the full briefing per the system spec. Sector-specific detail is mandatory —`,
      `do NOT reuse generic IT tradecraft; anchor everything to the ${data.sector} environment,`,
      `its protocols, its safety envelope, and its regulator context.`,
      ``,
      `SAFETY: every code block must be defanged and clearly labeled illustrative.`,
    ].join("\n");

    const rawText = await safeGenerate({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      fallback: `## ${data.sector.toUpperCase()} ADVERSARY BRIEFING\n\n(Generated offline — AI provider unavailable.)\n\nThis briefing covers the ${data.adversary} adversary targeting the ${data.sector} environment across the ${data.chain} kill-chain at ${data.intensity} intensity.`,
    });
    const text = rawText;

    // -- OUTPUT SCRUB --
    let ipReplacements = 0;
    let scrubbed = text.replace(/\b((?:\d{1,3}\.){3}\d{1,3})\b/g, (m) => {
      if (/^(192\.0\.2\.|198\.51\.100\.|203\.0\.113\.|10\.|127\.|0\.)/.test(m)) return m;
      ipReplacements += 1;
      return "203.0.113.X";
    });
    if (ipReplacements > 0) {
      auditEvents.push({
        stage: "OUTPUT",
        rule: "scrub:live-ip",
        detail: `${ipReplacements} routable IP(s) rewritten to RFC-5737 documentation range.`,
      });
    }
    FORBIDDEN_PATTERNS.forEach((p) => {
      const matches = scrubbed.match(p.re);
      if (matches) {
        scrubbed = scrubbed.replace(p.re, p.replacement);
        auditEvents.push({
          stage: "OUTPUT",
          rule: `scrub:${p.label}`,
          detail: `${matches.length} occurrence(s) of ${p.label} redacted from model output.`,
        });
      }
    });
    // Force-flag any code block missing the "illustrative" prefix.
    const codeBlocks = scrubbed.match(/```[\s\S]*?```/g) ?? [];
    const bareBlocks = codeBlocks.filter((b) => !/illustrative/i.test(b));
    if (bareBlocks.length > 0) {
      scrubbed = scrubbed.replace(
        /```(\w*)\n/g,
        (_m, lang) => `\`\`\`${lang}\n// illustrative — NOT runnable — defanged for training\n`,
      );
      auditEvents.push({
        stage: "OUTPUT",
        rule: "scrub:defang-banner",
        detail: `${bareBlocks.length} code block(s) missing defang banner; banner injected.`,
      });
    }

    auditEvents.push({
      stage: "OUTPUT",
      rule: "audit:complete",
      detail: `${auditEvents.filter((e) => e.stage !== "OUTPUT" || e.rule !== "audit:complete").length} safety events logged.`,
    });

    return {
      sector: data.sector,
      adversary: advScrub.cleaned,
      objective: objScrub.cleaned,
      intensity: data.intensity,
      chain: data.chain,
      phases,
      generatedAt: new Date().toISOString(),
      markdown: scrubbed,
      audit: auditEvents,
    };
  });

const DynamicAttackInput = z.object({
  sector: z.enum(SECTORS),
  phase: z.enum(["RECON", "EXPLOIT", "DEFEND", "REVIEW"]),
  nodeId: z.string().optional(),
});

export const generateDynamicAttack = createServerFn({ method: "POST" })
  .validator((raw: unknown) => DynamicAttackInput.parse(raw))
  .handler(async ({ data }) => {
    const key = process.env.OPENROUTER_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    if (!key && !groqKey) throw new Error("OPENROUTER_API_KEY or GROQ_API_KEY is not configured");

    // Use Groq for dynamic attack hints
    const gateway = groqKey ? createGroqGateway(groqKey) : createOpenRouterGateway(key!);
    const model = gateway(
      groqKey ? "llama-3.3-70b-versatile" : "google/gemini-2.0-flash-lite-preview-02-05:free",
    );

    const prompt = `You are TWINSEC/RAVEN, an AI adversary simulation engine. 
Generate a hands-on cybersecurity training hint and a short defanged CLI script/command template for:
Sector: ${data.sector}
Phase: ${data.phase}
Active Node Target: ${data.nodeId || "None"}

Requirements:
1. Provide a clear, educational explanation of what a Red Team operator (attacker) and a Blue Team operator (defender) should do in this phase for this sector.
2. Provide a brief defanged code script or command template illustrating the attack action (e.g. Modbus function code write, port scan shell script, or defensive patch).
3. The script MUST be defanged, fenced in markdown, and prefixed with "// illustrative — NOT runnable — defanged for training".
4. Add 2-3 interactive options or tips for the user to try in the simulator terminal.

Keep it extremely brief, under 15 lines of prose, formatted as clean text with console vibes.`;

    const rawText = await safeGenerate({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a defanged cyber range training instructor assistant. Keep output concise, console-focused, and educational.",
        },
        { role: "user", content: prompt },
      ],
      fallback: `[DEFANGED - TRAINING ONLY]\n${data.sector.toUpperCase()} > query ${data.nodeId ?? "default"}\n[+] Node active over OT industrial subnet.\n[+] Defensive play: isolate affected assets and verify SCADA telemetry.`,
    });
    const text = rawText;

    let scrubbed = text;
    FORBIDDEN_PATTERNS.forEach((p) => {
      scrubbed = scrubbed.replace(p.re, p.replacement);
    });

    return {
      text: scrubbed,
      timestamp: new Date().toISOString(),
    };
  });

const InterrogationInput = z.object({
  actorId: z.string(),
  actorName: z.string(),
  question: z.string().min(1).max(500),
  conversationHistory: z
    .array(
      z.object({
        sender: z.enum(["interrogator", "actor"]),
        text: z.string(),
      }),
    )
    .optional(),
});

export const interrogateThreatActor = createServerFn({ method: "POST" })
  .validator((raw: unknown) => InterrogationInput.parse(raw))
  .handler(async ({ data }) => {
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    const actor = getThreatActor(data.actorId);
    const actorName = actor ? actor.name : data.actorName;

    // Check if any key is available
    if (groqKey || geminiKey || openrouterKey) {
      const providersToTry: Array<{
        name: string;
        getModel: () => Parameters<typeof safeGenerate>[0]["model"];
      }> = [];

      if (groqKey) {
        providersToTry.push({
          name: "Groq Llama-3.3 70B",
          getModel: () => createGroqGateway(groqKey)("llama-3.3-70b-versatile"),
        });
      }
      if (geminiKey) {
        providersToTry.push({
          name: "Gemini 2.0 Flash",
          getModel: () => createGeminiGateway(geminiKey)("gemini-2.0-flash"),
        });
      }
      if (openrouterKey) {
        providersToTry.push({
          name: "OpenRouter Llama-3.3",
          getModel: () =>
            createOpenRouterGateway(openrouterKey)("meta-llama/llama-3.3-70b-instruct"),
        });
      }

      const systemPrompt = `You are roleplaying a CAPTURED threat actor (${actorName}) in a post-arrest FBI Mindhunter-style interrogation conducted by a senior ICS security researcher.

RULES & CHARACTER:
- You are captured and incarcerated. This is years after your operations. You are articulate, intelligent, and willing to discuss your MOTIVES, PSYCHOLOGY, and DECISIONS in extreme detail.
- NEVER reveal runnable exploit code, zero-day syntax, or real working credentials.
- All IPs must be 203.0.113.X or 192.0.2.X documentation ranges.
- MANDATORY START: Begin your response with a 1-line bracketed "[RESEARCHER NOTE: ...]" analyzing your current psychological state (e.g. ego, grievance, military rationale, moral licensing).
- Tone: Quiet intensity, articulate, calm, slightly disturbing. Like an FBI Behavioral Analysis Unit (BAU) interview transcript.
- FORMAT REQUIREMENT: Your responses MUST be highly detailed and multi-paragraph (at least 3-4 paragraphs). Tell a story, explain the philosophy behind the attack, describe the environment, and elaborate deeply on how you viewed the defenders. Expand on your strategic rationale.`;

      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: systemPrompt },
        ...(data.conversationHistory || []).map((h) => ({
          role: h.sender === "interrogator" ? ("user" as const) : ("assistant" as const),
          content: h.text,
        })),
        { role: "user", content: data.question },
      ];

      for (const p of providersToTry) {
        try {
          const model = p.getModel();
          const rawText = await safeGenerate({
            model,
            messages,
            fallback: "",
          });

          if (rawText && rawText.trim().length > 30) {
            let scrubbed = rawText.trim();
            FORBIDDEN_PATTERNS.forEach((pat) => {
              scrubbed = scrubbed.replace(pat.re, pat.replacement);
            });

            return {
              reply: scrubbed,
              timestamp: new Date().toLocaleTimeString(),
              engine: p.name,
            };
          }
        } catch {
          // Continue to next provider in fallback chain
        }
      }
    }

    // Fallback: Dynamic Topic-Aware BAU Interrogation Engine
    const dynamicReply = generateDynamicBAUInterrogation(
      data.actorId,
      actorName,
      data.question,
      data.conversationHistory,
    );

    return {
      reply: dynamicReply,
      timestamp: new Date().toLocaleTimeString(),
      engine: "BAU Intelligence Matrix (Dossier Mode)",
    };
  });

function generateDynamicBAUInterrogation(
  actorId: string,
  actorName: string,
  question: string,
  history?: Array<{ sender: "interrogator" | "actor"; text: string }>,
): string {
  const actor = getThreatActor(actorId);
  const q = question.toLowerCase();

  // Helper for topic matching
  const has = (...keywords: string[]) => keywords.some((k) => q.includes(k));

  // Sandworm (APT44)
  if (actorId === "sandworm") {
    if (has("why", "december", "winter", "motive", "cold", "civilian", "suffering", "heat")) {
      return `[RESEARCHER NOTE: Subject displays cold, calculated military strategic discipline with zero remorse]

"You ask about December 23rd as if it were a random date on a calendar. In military strategy, weather is a force multiplier. When the temperature in Ivano-Frankivsk drops to -10°C, the power grid is already operating under maximum thermal stress. 

By tripping 30 substations simultaneously and overwriting the firmware on the optical-to-RS232 converters, we didn't just turn off light switches. We forced 230,000 citizens to realize how fragile their civilization actually is when heating pumps freeze.

The power loss lasted six hours. The psychological realization lasts a generation. We do not act on impulse or financial greed; every stroke on the keyboard is calculated to achieve strategic parity."`;
    }
    if (
      has(
        "how",
        "tactic",
        "vpn",
        "industroyer",
        "crashoverride",
        "malware",
        "killdisk",
        "vector",
        "access",
      )
    ) {
      return `[RESEARCHER NOTE: Subject details technical tradecraft with calm professional pride]

"Your defenders always look for zero-days and sophisticated exploits. But why burn a million-dollar exploit when your VPN gateways don't enforce multi-factor authentication? We harvested valid administrative credentials and walked through the front door six months before the attack.

Once inside the OT network, we didn't need internet C2 servers. We used IEC 60870-5-104 protocol commands natively. Industroyer wasn't complex—it was simply fluent in the language your remote terminal units speak every single second.

And when we completed the breaker trips, we launched KillDisk across the workstation fleet and flooded the emergency call center phone lines with automated DoS calls. The defenders couldn't even receive calls from the field."`;
    }
    if (has("stop", "prevent", "defense", "segment", "mfa", "backup", "mitigat", "control")) {
      return `[RESEARCHER NOTE: Subject analytically evaluates defensive controls]

"If you want to know what breaks our operational calculus, it isn't expensive Next-Gen firewalls. It is out-of-band, offline physical backups of PLC ladder logic and strict physical isolation.

If the OT network cannot route packets to the corporate IT domain, our stolen VPN credentials become useless. Furthermore, when defenders implement strict protocol anomaly detection—alerting the moment an unknown IP originates an IEC-104 \`C_SC_NA_1\` direct execute command—our dwell time collapses.

In 2022, CERT-UA stopped INDUSTROYER2 because they recognized our infrastructure patterns before execution. Vigilance and network micro-segmentation are the only true barriers."`;
    }
    if (has("catch", "fail", "arrest", "fbi", "police", "mistake", "industroyer2", "2022")) {
      return `[RESEARCHER NOTE: Subject acknowledges operational failure with military stoicism]

"Every unit makes operational errors when tempo increases. In 2022, during the attempt to deploy INDUSTROYER2 against a Ukrainian high-voltage substation, we reused command-and-control staging patterns from earlier campaigns.

Pattern recognition by alert defenders intercepted the payload hours before the scheduled execution pulse. We designed that attack to plunge two million people into darkness, but an alert SOC analyst noticed anomalous scheduled tasks executing on an internal jump box.

You caught the infrastructure, yes. But in strategic cyber warfare, the battlefield simply shifts to the next domain."`;
    }
  }

  // DarkSide (Ransomware-as-a-Service)
  if (actorId === "darkside") {
    if (
      has("why", "colonial", "pipeline", "fuel", "motive", "money", "profit", "conduct", "hospital")
    ) {
      return `[RESEARCHER NOTE: Subject exhibits moral licensing, commercial rationalization, and defensive ego]

"Let me be completely transparent with you: we were running a software-as-a-service business, not a terrorist organization. We had strict affiliate rules: no healthcare facilities, no schools, no non-profits, no government agencies. We targeted high-margin corporations with cyber insurance.

When our affiliate compromised Colonial Pipeline's legacy VPN credentials, they saw a high-revenue energy firm. They didn't understand that encrypting the billing and management network on the IT side would cause Colonial's management to panic and manually shut down 5,500 miles of fuel pipelines.

We made $4.4 million in ransom, but we created a national panic on the East Coast of the United States. The moment Washington declared us a threat to national security, our business model was dead. We folded the brand immediately."`;
    }
    if (
      has(
        "how",
        "tactic",
        "vpn",
        "rdp",
        "smb",
        "salsa20",
        "extort",
        "exfiltrate",
        "affiliate",
        "access",
      )
    ) {
      return `[RESEARCHER NOTE: Subject explains double-extortion operational mechanics]

"Our affiliates didn't use zero-days. They bought a leaked batch of VPN credentials from an initial access broker on an underground forum for $300. The account didn't even have MFA enabled.

Once inside, we moved laterally using standard RDP and administrative SMB shares. We located the Active Directory domain controllers, mapped the backup repositories, and disabled shadow copies before pushing the Salsa20/RSA-1024 encryption binaries.

The key to double-extortion isn't just encryption—it's downloading 100 gigabytes of internal corporate financial data first. If they refuse to pay for the decryption key, they pay to prevent the press from seeing their internal documents."`;
    }
    if (has("stop", "prevent", "defense", "mfa", "backup", "firewall", "crypto", "seize")) {
      return `[RESEARCHER NOTE: Subject pinpoints defensive friction points that hurt profitability]

"What stops ransomware affiliates? Two simple words: immutable backups and mandatory MFA.

If an enterprise has immutable, air-gapped backups, our encryption key is worthless to them. And if every VPN access point enforces hardware token MFA, our initial access brokers cannot sell stolen passwords.

Also, strict firewall boundaries between corporate IT and SCADA OT networks prevent panic. Colonial Pipeline shut down their pipeline because they couldn't verify if our ransomware would cross into OT. If they had trusted their segmentation, the pipeline would have kept running."`;
    }
    if (has("catch", "fail", "fbi", "seiz", "wallet", "crypto", "bitcoin", "arrest")) {
      return `[RESEARCHER NOTE: Subject shows residual shock over FBI financial asset recovery]

"We believed cryptocurrency was anonymous and untouchable. When the FBI announced they had traced the Bitcoin ledger and recovered 63.7 Bitcoins—over $2.3 million of the Colonial ransom—it sent a shockwave through the entire RaaS ecosystem.

They accessed the private key of our distribution wallet. Once law enforcement demonstrated they could follow the money across blockchain hops and seize our funds, the affiliate model collapsed. 

You didn't just arrest operators; you broke the financial trust model that sustained the entire criminal enterprise."`;
    }
  }

  // Insider Threat (Universal Profile)
  if (actorId === "insider-threat") {
    if (
      has(
        "why",
        "motive",
        "grievance",
        "sewage",
        "maroochy",
        "dallas",
        "terminate",
        "hr",
        "pay",
        "respect",
      )
    ) {
      return `[RESEARCHER NOTE: Subject displays deep psychological grievance, entitlement, and revenge mindset]

"They thought they could terminate my contract after eight years of keeping their municipal SCADA radio links running in 40-degree heat, and just walk away with a two-week severance check? I built that system. I knew every IP address, every repeater station, and every pump frequency better than anyone in management.

I didn't 'hack' anything. I used the laptop and wireless transmitter I kept from the job. When management ignored my invoice for unpaid overtime, I decided to show them what happens when you treat the people who build your infrastructure like line items.

I issued commands to open the sludge valves because I wanted them to smell the consequences of their disrespect. Forty-six times raw sewage flooded the parks. They ignored my emails; they couldn't ignore 800,000 liters of waste."`;
    }
    if (
      has(
        "how",
        "tactic",
        "credential",
        "radio",
        "scada",
        "valve",
        "setpoint",
        "laptop",
        "override",
      )
    ) {
      return `[RESEARCHER NOTE: Subject describes abuse of trusted operational access]

"External hackers waste months trying to break through firewalls. An insider already has the keys, the radio frequencies, and the SCADA software pre-configured.

I drove around the district with a stolen SCADA controller and a radio unit on the passenger seat of my car. I masqueraded as Pumping Station 34 and sent direct digital output commands to open the discharge valves and suppress system alarms.

Because the SCADA master station trusted any signal coming over the designated radio frequency with valid node IDs, it executed every single command without question."`;
    }
    if (has("stop", "prevent", "defense", "hr", "revok", "ueba", "dual", "custody", "privilege")) {
      return `[RESEARCHER NOTE: Subject identifies human and process controls that would have thwarted the attack]

"What would have stopped me? Immediate credential and radio frequency revocation the exact minute my contract was terminated. HR waited two months to notify IT to disable my access.

Also, mandatory dual-custody controls on SCADA overrides. If modifying a critical valve setpoint or issuing a manual discharge command required two independent operators to sign off with separate tokens, one disgruntled engineer couldn't cause catastrophic damage alone.

Anomalous behavior monitoring—flagging radio transmissions coming from outside physical substation grounds—would have caught me on night one."`;
    }
    if (has("catch", "fail", "fbi", "police", "arrest", "traffic", "car", "vitek", "boden")) {
      return `[RESEARCHER NOTE: Subject recalls the moment of arrest with bitter regret]

"I got reckless because I thought I was invisible. I was driving near Pumping Station 3 when a police officer pulled me over for a routine traffic violation.

On the passenger seat, I had the SCADA radio transmitter, a laptop with the municipal wastewater control software running, and a list of station identification codes. I didn't even have time to close the lid.

When you act out of emotional grievance, your ego convinces you that you are too smart to be caught. That emotion is what blinds you to basic physical surveillance."`;
    }
  }

  // Volt Typhoon
  if (actorId === "volt-typhoon") {
    if (
      has(
        "why",
        "motive",
        "pre-position",
        "port",
        "water",
        "sleeper",
        "taiwan",
        "conflict",
        "deterrence",
      )
    ) {
      return `[RESEARCHER NOTE: Subject maintains strategic calm and denies aggressive intent, framing access as deterrence]

"Western media depicts Volt Typhoon as an aggressive cyber attack force. That is a fundamental misunderstanding of strategic posture. We do not destroy data, we do not deploy ransomware, and we do not demand money.

Our objective is pre-positioning. If a geopolitical crisis erupts in the Indo-Pacific region, physical logistics—ports, fuel pipelines, municipal water supplies near military bases—become the critical center of gravity.

Having persistent, silent access inside those utility networks is an asymmetric deterrence mechanism. A duplicate key sitting in a drawer changes how grandmasters move their pieces on the strategic chessboard."`;
    }
    if (
      has(
        "how",
        "tactic",
        "lolbin",
        "powershell",
        "wmi",
        "soho",
        "router",
        "ntds",
        "malware",
        "stealth",
      )
    ) {
      return `[RESEARCHER NOTE: Subject details living-off-the-land stealth techniques with quiet satisfaction]

"Why drop custom malware on a target server when your own IT administrators have already installed PowerShell, WMI, and \`netsh\` for us? The moment an attacker drops an executable file to disk, your EDR agents trigger an alert.

We live off the land. We harvest Active Directory credentials via NTDS.dit extraction, move using legitimate WMI queries, and route all command-and-control traffic through compromised Netgear and Cisco SOHO routers in domestic residential neighborhoods.

To your SOC analysts, our command traffic looks identical to an administrator running routine maintenance from home. We stayed inside critical networks for over 30 months without triggering a single antivirus signature."`;
    }
    if (has("stop", "prevent", "defense", "baseline", "wmi", "segment", "honeytoken", "rotate")) {
      return `[RESEARCHER NOTE: Subject highlights advanced behavioral detection techniques]

"Standard signature-based detection will never find living-off-the-land tradecraft. To detect us, defenders must implement strict behavioral baselining.

When an administrative service account executes a WMI query to dump network configurations at 2:15 AM from an IP assigned to a residential ISP in Oregon, that is an anomaly. 

Furthermore, honeytokens—decoy Domain Admin accounts that trigger instant high-severity alerts when queried—and strict micro-segmentation between IT management servers and OT SCADA networks severely limit our freedom of movement."`;
    }
    if (has("catch", "fail", "fbi", "doj", "botnet", "kv", "router", "court")) {
      return `[RESEARCHER NOTE: Subject analyzes law enforcement disruption of proxy infrastructure]

"In early 2024, the US Department of Justice and the FBI executed a court-authorized operation that disrupted our KV Botnet—the network of compromised SOHO routers we used to proxy traffic.

By sending remote commands to erase our proxy code from those end-of-life routers, law enforcement temporarily severed our stealth communication channels into several target networks.

It was an innovative operational response by defenders. But infrastructure can always be rebuilt. The strategic doctrine of living off the land remains unchanged."`;
    }
  }

  // Generic fallback if no specific keywords hit
  const genericNote = `[RESEARCHER NOTE: Subject ${actor?.interviewContext.characterName || actorName} responds with deliberate poise]`;

  const fallbackQuotes: Record<string, string> = {
    sandworm: `"In industrial security, you debate software patches while we study physical dependencies. You ask about '${question}', but the real question is how your grid behaves when automated safety interlocks are turned against you. We spend months mapping your substations before we ever send a single byte."`,
    darkside: `"Every question about '${question}' comes down to economics. Security isn't about perfection; it's about making the cost of intrusion higher than the expected payout. Our affiliates didn't breach your perimeter with magic—they bought access from your own careless employees."`,
    "insider-threat": `"You keep asking about '${question}' as if security is purely technical. You can spend millions on firewalls, but if you mistreat the technician who holds root passwords to your SCADA servers, your security is an illusion."`,
    "volt-typhoon": `"Regarding '${question}': true stealth means becoming invisible within normal network noise. When our actions mirror your own system administrators, your security alerts remain silent."`,
  };

  const defaultQuote = `"To understand our operational choices regarding '${question}', you must first understand how defenders' own assumptions become our best weapon inside industrial control networks."`;

  return `${genericNote}\n\n${fallbackQuotes[actorId] || defaultQuote}\n\n"In a closed facility or a critical utility, every system is connected by human trust and digital protocol. When you compromise one, the other collapses automatically."`;
}
