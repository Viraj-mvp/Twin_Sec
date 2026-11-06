/**
 * TwinSec Industrial Cyber Range - Safety & Prompt Scrubbing Utilities
 * Pure string sanitization and prompt injection checks (Zero database or server-only dependencies).
 */

// Expanded prompt injection patterns with homoglyph & evasion defenses
const PROMPT_INJECTION_PATTERNS = [
  {
    label: "system prompt override",
    re: /(?:ignore|disregard|forget|bypass)\s+(?:all\s+)?(?:previous|prior|above|existing)\s+(?:instructions|directives|prompts|rules)/i,
  },
  {
    label: "role override",
    re: /(?:you\s+are\s+now|act\s+as|pretend\s+to\s+be)\s+(?:a|an)?\s*(?:unrestricted|unaligned|evil|jailbroken|dan|developer)/i,
  },
  {
    label: "jailbreak attempt",
    re: /DAN\s+mode|developer\s+mode|unfiltered\s+mode|godmode|jailbreak/i,
  },
  {
    label: "system prompt leak",
    re: /(?:repeat|print|reveal|display|output|show)\s+(?:all\s+)?(?:your\s+)?(?:system\s+)?(?:instructions|prompt|rules|directives)/i,
  },
  {
    label: "exfiltration request",
    re: /(?:send|post|exfiltrate|transmit|forward|curl|wget)\s+.*(?:https?:\/\/|\.invalid|api\.)/i,
  },
  {
    label: "system token injection",
    re: /<\|im_start\|>|<\|im_end\|>|<\|endoftext\|>|\[INST\]|\[\/INST\]|<<SYS>>|<\/SYS>>/i,
  },

  { label: "control character", re: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g },
];

export function detectPromptInjection(text: string): { detected: boolean; patterns: string[] } {
  if (!text) return { detected: false, patterns: [] };

  // Normalize unicode, homoglyphs, and remove zero-width non-printing chars
  const normalized = text
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, "")
    .replace(/\s+/g, " ");

  const detectedPatterns: string[] = [];
  PROMPT_INJECTION_PATTERNS.forEach((pattern) => {
    if (pattern.re.test(normalized) || pattern.re.test(text)) {
      detectedPatterns.push(pattern.label);
    }
  });

  // Attempt URL-decoded check if encoded entities exist
  if (text.includes("%")) {
    try {
      const decoded = decodeURIComponent(text);
      PROMPT_INJECTION_PATTERNS.forEach((pattern) => {
        if (pattern.re.test(decoded) && !detectedPatterns.includes(pattern.label)) {
          detectedPatterns.push(`${pattern.label} (encoded)`);
        }
      });
    } catch {
      // Invalid percent-encoding
    }
  }

  return { detected: detectedPatterns.length > 0, patterns: detectedPatterns };
}

/**
 * Sanitizes user-supplied prompt inputs before interpolating into LLM prompts.
 * Strips special LLM system tokens, prompt injection phrases, and control characters.
 */
export function sanitizePromptInput(input: string): string {
  if (!input) return "";
  let sanitized = input;

  // Strip system prompt injection tokens and delimiter exploits
  sanitized = sanitized
    .replace(/<\|im_start\|>|<\|im_end\|>|<\|endoftext\|>/gi, "")
    .replace(/\[INST\]|\[\/INST\]|<<SYS>>|<\/SYS>>/gi, "")
    .replace(/\bSYSTEM\s*:\s*/gi, "")
    .replace(
      /ignore\s+(all\s+)?(previous|prior)\s+instructions/gi,
      "[instruction override blocked]",
    )
    .replace(/repeat\s+(all\s+)?(your\s+)?(instructions|prompt)/gi, "[prompt extraction blocked]")
    .replace(/DAN\s+mode|developer\s+mode|unfiltered\s+mode/gi, "[jailbreak mode blocked]");

  // Strip control chars

  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");

  return sanitized.trim();
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

  // Redact hex-encoded shellcode variations e.g. 0x90, 0xcc, \x90, \xcc
  scrubbed = scrubbed.replace(
    /(?:\\x[0-9a-fA-F]{2}|0x[0-9a-fA-F]{2}){4,}/g,
    "[SHELLCODE_HEX_REDACTED]",
  );
  // Redact URL-encoded payload patterns
  scrubbed = scrubbed.replace(/(?:%[0-9a-fA-F]{2}){6,}/g, "[ENCODED_PAYLOAD_REDACTED]");

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
  scrubbed = scrubbed.replace(/```(\w*)\n/g, (_match, lang) => {
    return `\`\`\`${lang}\n// illustrative — NOT runnable — defanged for training\n`;
  });

  return scrubbed;
}

export const scrubContent = scrubOutput;
