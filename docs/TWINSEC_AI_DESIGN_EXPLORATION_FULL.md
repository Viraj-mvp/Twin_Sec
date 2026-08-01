# TwinSec AI-Driven Features and Platform Security Design Exploration

## Introduction

This document addresses the design decisions for implementing AI-driven attack script generation, simulation dynamics, practice effectiveness feedback, and comprehensive platform security for TwinSec, while maintaining pedagogical value and strict safety constraints. All decisions are grounded in the existing codebase and requirements.

---

## 1. Attack Script and Terminal Command Generation

### Key Requirements

- **Realistic but defanged**: Show actual vulnerability syntax, but make commands non-executable
- **Progressive hint system (0-3 levels)**
- **Sector/protocol adaptation** (Modbus TCP, DNP3, BACnet, etc.)

### Implementation Details

#### Scrubbing Logic

Current implementation in `src/lib/api/enhanced-simulation.functions.ts`:

1. **DEFANGED prefix**: Marks every terminal output as training-only
2. **Code block annotation**: Prepends "// illustrative — NOT runnable — defanged for training" to all code blocks
3. **IP address replacement**: Replaces public IPs with RFC 5737 test ranges (e.g., 203.0.113.x)
4. **Pattern filtering**: Removes shellcode, private keys, AWS credentials, and curl-pipe-to-shell commands

#### Zod Validation

- Strict enums for sectors, attack types, adversary profiles, phases, and decisions
- Safe string type that rejects prompt injection patterns (detects "ignore previous instructions", "system prompt", "execute code", etc.)

#### Prompt Injection Detection

Patterns detected:

- "ignore previous instructions"
- "system prompt" access attempts
- requests to "act as developer"
- code execution requests
- control characters

---

## 2. Simulation Exercise Dynamics

### Key Requirements

- **Adversary-aware branching**: Decisions should feel organic
- **Real-time adaptation vs. pre-generated trees**: Tradeoffs
- **Auditability**: Every adaptation must be logged

### Tradeoffs

| Approach             | Pros                                                            | Cons                                                          |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------------------- |
| Pre-generated trees  | Fully reproducible, easy to audit, predictable performance      | Less adaptive, may feel formulaic                             |
| Real-time adaptation | More realistic, better training, responsive to operator choices | Harder to audit, potential performance issues, harder to test |

### Current Implementation

Uses sector-specific templates in `sectorCommandTemplates` (in `enhanced-simulation.functions.ts`) with predefined branches. This balances predictability with realism and ensures full auditability.

---

## 3. Practice Effectiveness and Feedback

### Key Requirements

- Analyze operator decisions, logs, and metrics
- Generate actionable post-exercise scorecards
- Integrate with SIEM telemetry via CEF exports

### Implementation Details

- **SIEM Export**: Already implemented in `src/lib/siem-export.ts` as CSV export with telemetry mapped to MITRE ATT&CK tactics
- **Scorecard Metrics**:
  - MTTD (Mean Time to Detect)
  - MTTR (Mean Time to Respond)
  - MW shed (Megawatts shed in power sector)
  - Financial impact
  - Operator score
  - Decision history
  - Hint level progression

---

## 4. Platform Security Integration

### Key Requirements

- **Fully automated** (no human review in deployment path)
- **Input validation**: Zod schemas with prompt injection detection
- **Output encoding**: HTML sanitization (DOMPurify) + CSP headers
- **CSRF protection**: Middleware in `src/start.ts`
- **Rate limiting**: Per-endpoint thresholds
- **Session management**: HttpOnly, Secure, SameSite=strict cookies
- **Audit logging**: Track every action, scrubbing decision, and validation result

### Security Hardening Measures Implemented

1. **CSP Headers** (Content Security Policy) in `src/server.ts`
   - `default-src: 'self'`
   - `script-src: 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net`
   - `style-src: 'self' 'unsafe-inline' https://cdn.jsdelivr.net`
   - `frame-src: 'none'`
   - `object-src: 'none'`

2. **Rate Limiting** in `src/server.ts`
   - Default: 100 requests per minute per client
   - AI generation endpoints (generateTerminalCommand, generateEspionageBriefing): 10-30 requests per minute
   - In-memory store for dev (use Redis for production)

3. **DOMPurify Sanitization** in UI files (`espionage.tsx`, `simulation.tsx`)
   - Sanitizes all ReactMarkdown content before rendering to prevent XSS

4. **Session Management** in `src/lib/auth.server.ts`
   - HttpOnly, Secure, SameSite=strict cookies
   - 7-day expiration

5. **Audit Logs** in `auditLogs` database table
   - Tracks: decision, terminal command generation, hint delivery, scrubbing decisions, prompt injection blocks
   - Includes operator ID, timestamp, event type, and details

---

## Open Questions for Future Work

- Real-time adaptation vs. pre-generated trees: Need user research with SOC teams
- XSS in rendered LLM content: Even with DOMPurify, consider additional measures like strict Content-Security-Policy
- Multi-tenancy isolation: Need implementation if platform supports multiple organizations
- Fairness in adaptive scenarios: Ensure that different users with similar skill levels see similar difficulty
- Rate limiting thresholds: Need to tune based on real usage patterns
- Production rate limiting store: Replace in-memory store with Redis for distributed deployments

---

## Conclusion

This design balances realism, safety, pedagogical value, and platform security, with all constraints addressed in the current implementation. The key is defense-in-depth: strict input validation, output scrubbing, XSS protection, CSRF protection, rate limiting, audit logging, and CSP headers—all fully automated as required.
