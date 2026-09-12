import { generateText } from "ai";
import { callAI } from "./ai-providers.server";

export interface IntelligenceInput {
  title: string;
  incidentSummary: string;
  sector: string;
  threatActor?: string;
  caseFileId?: string;
  rawText?: string;
}

export interface GeneratedIntelligenceScenario {
  id: string;
  sector: string;
  name: string;
  description: string;
  attackType: string;
  adversaryProfile: string;
  caseFileId?: string;
  redTactics: string[];
  blueMitigations: string[];
}

export async function convertIntelToScenario(
  input: IntelligenceInput,
): Promise<GeneratedIntelligenceScenario> {
  const prompt = `You are a Senior OT Cyber Security Engineer for TwinSec.
Analyze the following cyber-physical research paper / attack incident intelligence and generate a structured attack scenario for an interactive cyber range.

TITLE: ${input.title}
SECTOR: ${input.sector}
THREAT ACTOR: ${input.threatActor || "Unknown APT"}
SUMMARY: ${input.incidentSummary}
RAW CONTENT: ${input.rawText || "N/A"}

Respond in pure valid JSON format matching this schema:
{
  "name": "Exercise Name",
  "description": "Brief 2-sentence description of the attack killchain and kinetic impact.",
  "attackType": "sabotage | disruption | espionage",
  "adversaryProfile": "Threat Actor Name",
  "redTactics": [
    "CLI command 1 with parameter explanation",
    "CLI command 2 with parameter explanation",
    "CLI command 3 with parameter explanation"
  ],
  "blueMitigations": [
    "Containment CLI command 1 with explanation",
    "Containment CLI command 2 with explanation",
    "Containment CLI command 3 with explanation"
  ]
}`;

  try {
    const text = await callAI("attack_generator", async ({ provider, model }) => {
      const res = await generateText({
        model: provider(model),
        prompt,
      });
      return res.text;
    });

    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    const scenarioId = `intel-${input.caseFileId || Date.now()}`;

    return {
      id: scenarioId,
      sector: input.sector.toLowerCase(),
      name: parsed.name || input.title,
      description: parsed.description || input.incidentSummary,
      attackType: parsed.attackType || "disruption",
      adversaryProfile: parsed.adversaryProfile || input.threatActor || "APT Group",
      caseFileId: input.caseFileId,
      redTactics: parsed.redTactics || [
        "nmap -sS -p 502 10.0.0.0/24 (Recon OT Network)",
        "modbus-cli write --target plc-01 --val 1 (Execute Setpoint Override)",
      ],
      blueMitigations: parsed.blueMitigations || [
        "isolate-node plc-01 (Isolate Compromised Controller)",
        "block-ip 10.0.0.45 (Block Adversary C2 IP)",
        "restore-logic plc-01 (Restore PLC Golden Image)",
      ],
    };
  } catch (err) {
    console.warn("AI intelligence scenario generation fallback:", err);
    return {
      id: `intel-${input.caseFileId || Date.now()}`,
      sector: input.sector.toLowerCase(),
      name: `REENACTMENT: ${input.title}`,
      description: input.incidentSummary,
      attackType: "disruption",
      adversaryProfile: input.threatActor || "APT Threat Actor",
      caseFileId: input.caseFileId,
      redTactics: [
        "nmap -sS -p 104,502 10.0.0.0/24 (Recon Substation & SCADA Bus)",
        "exploit-plc --target plc-primary --payload OVERRIDE (Inject Rogue Setpoint)",
        "replay-telemetry --target historian --mask NORMAL (Spoof SCADA Telemetry)",
      ],
      blueMitigations: [
        "isolate-node plc-primary (Sever Network Bridge to Compromised PLC)",
        "block-ip 192.168.1.100 (Blackhole Stolen VPN Gateway Credentials)",
        "restore-logic plc-primary (Reload Authenticated Firmware Baseline)",
      ],
    };
  }
}
