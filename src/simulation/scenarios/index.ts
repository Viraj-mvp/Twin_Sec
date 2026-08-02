/**
 * index.ts
 *
 * Attack Scenario Registry for TwinSec event-driven attack engine.
 * Provides instant access to structured scenario definitions by sector ID or scenario code.
 */

import type { SectorId } from "@/data/scenarios";
import type { AttackScenario } from "./types";
import { POWER_SCENARIO } from "./power";
import { WATER_SCENARIO } from "./water";
import { RANSOMWARE_SCENARIO } from "./ransomware";
import { PHISHING_SCENARIO } from "./phishing";
import { DDOS_SCENARIO } from "./ddos";
import { INSIDER_SCENARIO } from "./insider";

export * from "./types";
export {
  POWER_SCENARIO,
  WATER_SCENARIO,
  RANSOMWARE_SCENARIO,
  PHISHING_SCENARIO,
  DDOS_SCENARIO,
  INSIDER_SCENARIO,
};

const SCENARIO_MAP: Record<string, AttackScenario> = {
  power: POWER_SCENARIO,
  water: WATER_SCENARIO,
  "oil-gas": PHISHING_SCENARIO,
  manufacturing: RANSOMWARE_SCENARIO,
  port: POWER_SCENARIO, // Mapped to primary power template with customized metadata
  "smart-building": INSIDER_SCENARIO,
  "smart-city": DDOS_SCENARIO,
  ransomware: RANSOMWARE_SCENARIO,
  phishing: PHISHING_SCENARIO,
  ddos: DDOS_SCENARIO,
  insider: INSIDER_SCENARIO,
};

/**
 * Retrieve AttackScenario by sector or scenario ID.
 */
export function getAttackScenario(sectorOrId: string = "power"): AttackScenario {
  const matched = SCENARIO_MAP[sectorOrId.toLowerCase()];
  if (matched) return matched;
  return POWER_SCENARIO;
}

/**
 * List all available attack scenarios.
 */
export function listAttackScenarios(): AttackScenario[] {
  return [
    POWER_SCENARIO,
    WATER_SCENARIO,
    PHISHING_SCENARIO,
    RANSOMWARE_SCENARIO,
    INSIDER_SCENARIO,
    DDOS_SCENARIO,
  ];
}
