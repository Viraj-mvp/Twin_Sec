/**
 * water/index.ts
 *
 * Water Sector (BASIN) Cyber-Physical Attack Scenario.
 * Deeply modeled causal water treatment process with Purdue L4->L0 topology,
 * dynamic chlorine dosing physics, and verifiable MITRE ICS attack sequences.
 */

import type { AttackScenario } from "../types";
import { WATER_SCENARIO } from "../water";

export { WATER_SCENARIO };

/**
 * Sequential attack execution plan for TwinRuntime.
 * Models the complete kill-chain:
 * EWS-04 (Initial Access) -> HMI-11 (Lateral Movement) -> PLC-DOSE (Setpoint Manipulation) -> AIT-301 (Sensor Spoofing)
 */
export const WATER_TWIN_ATTACK_SEQUENCE = [
  {
    phase: "INITIAL_ACCESS",
    techniqueId: "T0886",
    techniqueName: "Remote System Discovery / Credential Access",
    sourceAssetId: "EWS-04",
    targetAssetId: "EWS-04",
    parameters: { method: "credential_replay" },
  },
  {
    phase: "LATERAL_MOVEMENT",
    techniqueId: "T0886",
    techniqueName: "Lateral Movement across SCADA LAN",
    sourceAssetId: "EWS-04",
    targetAssetId: "HMI-11",
    parameters: { protocol: "OPC-UA" },
  },
  {
    phase: "COMMAND_INJECTION",
    techniqueId: "T0855",
    techniqueName: "Unauthorized Command Message to Dosing Controller",
    sourceAssetId: "HMI-11",
    targetAssetId: "PLC-DOSE",
    parameters: { register: "dosing_setpoint", value: 7.2 },
  },
  {
    phase: "TAMPERING",
    techniqueId: "T0814",
    techniqueName: "False Data Injection / Sensor Spoof",
    sourceAssetId: "PLC-DOSE",
    targetAssetId: "AIT-301",
    parameters: { action: "spoof_sensor", offset: -4.0 },
  },
] as const;
