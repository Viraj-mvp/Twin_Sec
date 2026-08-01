import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { createAiGatewayProvider } from "../ai-gateway.server";

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
    if (!key) throw new Error("OPENROUTER_API_KEY is not configured");

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

    const gateway = createAiGatewayProvider(key);
    const model = gateway("qwen/qwen3-next-80b-a3b-instruct:free");

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
    if (!key) throw new Error("OPENROUTER_API_KEY is not configured");

    const gateway = createAiGatewayProvider(key);
    const model = gateway("qwen/qwen3-next-80b-a3b-instruct:free");

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
    const key = process.env.OPENROUTER_API_KEY;

    // Fallback response if no API key is set
    if (!key) {
      const fallbackResponses: Record<string, string> = {
        sandworm:
          '[RESEARCHER NOTE: Subject displays calculated military discipline]\n\n"We do not act on impulse. Winter is not just weather; it is a force multiplier. When temperature drops to -10°C, the grid is already under thermal stress. The timing was calculated to force maximum political realization. You ask about consequences? We follow military objectives."',
        darkside:
          '[RESEARCHER NOTE: Subject shows moral licensing and commercial rationalization]\n\n"Look, we had rules. No hospitals, no non-profits, no emergency services. We ran a software service business. Our affiliate went after Colonial\'s credentials without understanding the downstream supply panic. Once Washington got involved, the business model was broken. We folded."',
        "insider-threat":
          '[RESEARCHER NOTE: Subject exhibits deep grievance & entitlement]\n\n"They thought they could terminate my contract after 8 years of keeping their SCADA radios online and just walk away? I didn\'t hack anything. I used the credentials they gave me. I just showed them what happens when you treat the people who build your grid like line items."',
        "volt-typhoon":
          '[RESEARCHER NOTE: Subject maintains strategic calm and denies aggressive intent]\n\n"Why leave malware when PowerShell and WMI are already pre-installed by your own IT administrators? We do not cause disruption. Access is deterrence. A duplicate key in a drawer changes how chess pieces are moved on the board."',
      };
      return {
        reply:
          fallbackResponses[data.actorId] ||
          `[RESEARCHER NOTE: Captured subject responds calmly]\n\n"I have answered many questions since my capture. To understand why we targeted ${data.actorName}, you must understand how we view your network's assumptions."`,
        timestamp: new Date().toLocaleTimeString(),
      };
    }

    const gateway = createAiGatewayProvider(key);
    const model = gateway("qwen/qwen3-next-80b-a3b-instruct:free");

    const systemPrompt = `You are roleplaying a CAPTURED threat actor (${data.actorName}) in a post-arrest FBI Mindhunter-style interrogation conducted by a senior ICS security researcher.

RULES & CHARACTER:
- You are captured and incarcerated. This is years after your operations. You are articulate, intelligent, and willing to discuss your MOTIVES, PSYCHOLOGY, and DECISIONS.
- NEVER reveal runnable exploit code, zero-day syntax, or real working credentials.
- All IPs must be 203.0.113.X or 192.0.2.X documentation ranges.
- Include a 1-line bracketed "[RESEARCHER NOTE: ...]" at the start of your answer analyzing your psychological state (e.g. ego, grievance, military rationale).
- Tone: Quiet intensity, articulate, calm, slightly disturbing. Like a Mindhunter BAU interview.`;

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...(data.conversationHistory || []).map((h) => ({
        role: h.sender === "interrogator" ? ("user" as const) : ("assistant" as const),
        content: h.text,
      })),
      { role: "user", content: data.question },
    ];

    try {
      const rawText = await safeGenerate({
        model,
        messages,
        fallback: `[RESEARCHER NOTE: Subject declines to answer technical details directly]\n\n"Ask why, not how. In industrial control networks, the defender's assumptions are the attacker's best weapon."`,
      });
      const text = rawText;

      let scrubbed = text;
      FORBIDDEN_PATTERNS.forEach((p) => {
        scrubbed = scrubbed.replace(p.re, p.replacement);
      });

      return {
        reply: scrubbed,
        timestamp: new Date().toLocaleTimeString(),
      };
    } catch {
      return {
        reply: `[RESEARCHER NOTE: Subject declined to answer technical details directly]\n\n"You are asking how. Ask why instead. In industrial control networks, the defender's assumptions are always the attacker's best weapon."`,
        timestamp: new Date().toLocaleTimeString(),
      };
    }
  });
