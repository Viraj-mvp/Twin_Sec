/**
 * AttackEngine.ts
 *
 * State-modifying attack engine for TwinSec.
 * Executes genuine cyber-physical attack techniques against assets, networks,
 * and PLCs, validating preconditions (Purdue reachability, credential access)
 * and causally propagating physical consequences.
 */

import type { ActiveAttackState, AttackPhase } from "../TwinState";
import type { PlcDevice } from "../devices/PlcDevice";
import type { SensorDevice } from "../devices/SensorDevice";
import type { NetworkEngine } from "../network/NetworkEngine";
import type { SeededRng } from "../SeededRng";

export interface AttackActionPayload {
  techniqueId: string; // MITRE ATT&CK for ICS (e.g., T0831, T0855, T0886, T0814)
  techniqueName: string;
  sourceAssetId: string;
  targetAssetId: string;
  phase: AttackPhase;
  parameters: Record<string, unknown>;
}

export interface AttackExecutionResult {
  attackId: string;
  success: boolean;
  blockedReason?: string;
  techniqueId: string;
  phase: AttackPhase;
  sourceAssetId: string;
  targetAssetId: string;
  beforeState: Record<string, unknown>;
  afterState: Record<string, unknown>;
  timestamp: number;
}

export class AttackEngine {
  private activeAttacks: Map<string, ActiveAttackState> = new Map();
  private attackHistory: AttackExecutionResult[] = [];
  private rng: SeededRng;

  constructor(rng: SeededRng) {
    this.rng = rng;
  }

  /**
   * Execute an attack action against devices, network, or asset states.
   */
  public executeAttack(
    payload: AttackActionPayload,
    context: {
      timestamp: number;
      assets: Map<string, { id: string; compromised: boolean; isolated: boolean }>;
      plcs: Map<string, PlcDevice>;
      sensors: Map<string, SensorDevice>;
      network: NetworkEngine;
    },
  ): AttackExecutionResult {
    const attackId = `atk-${context.timestamp.toFixed(0)}-${this.rng.nextHex(4)}`;
    const { sourceAssetId, targetAssetId, techniqueId, phase, parameters } = payload;

    const source = context.assets.get(sourceAssetId);
    const target = context.assets.get(targetAssetId);

    // Baseline validation: Target must exist
    if (!target) {
      return this.recordFailure(
        attackId,
        payload,
        `Target asset ${targetAssetId} does not exist in topology`,
        context.timestamp,
      );
    }

    // 1. Initial Compromise (EWS/Phishing/Credential Replay)
    if (phase === "INITIAL_ACCESS") {
      const beforeState = { targetCompromised: target.compromised };
      target.compromised = true;
      const afterState = { targetCompromised: true };

      return this.recordSuccess(attackId, payload, beforeState, afterState, context.timestamp);
    }

    // 2. Precondition for downstream attacks: Source asset must be compromised
    if (source && !source.compromised) {
      return this.recordFailure(
        attackId,
        payload,
        `Source asset ${sourceAssetId} is not compromised by adversary`,
        context.timestamp,
      );
    }

    // 3. Precondition: Network reachability from source to target
    if (source && sourceAssetId !== targetAssetId) {
      if (context.network.isAssetIsolated(targetAssetId)) {
        return this.recordFailure(
          attackId,
          payload,
          `Target asset ${targetAssetId} is physically air-gapped / isolated from network`,
          context.timestamp,
        );
      }
      if (!context.network.canCommunicate(sourceAssetId, targetAssetId)) {
        return this.recordFailure(
          attackId,
          payload,
          `Network path between ${sourceAssetId} and ${targetAssetId} is blocked by firewall policy or severed links`,
          context.timestamp,
        );
      }
    }

    // 4. Lateral Movement
    if (phase === "LATERAL_MOVEMENT") {
      const beforeState = { targetCompromised: target.compromised };
      target.compromised = true;
      const afterState = { targetCompromised: true };

      return this.recordSuccess(attackId, payload, beforeState, afterState, context.timestamp);
    }

    // 5. PLC Register Manipulation (T0855 / T0831)
    if (
      techniqueId === "T0855" ||
      techniqueId === "T0831" ||
      phase === "COMMAND_INJECTION" ||
      phase === "TAMPERING"
    ) {
      const plc = context.plcs.get(targetAssetId);
      if (!plc) {
        return this.recordFailure(
          attackId,
          payload,
          `Target ${targetAssetId} is not a registered PLC controller`,
          context.timestamp,
        );
      }

      const register = (parameters.register as string) || "dosing_setpoint";
      const value = typeof parameters.value === "number" ? parameters.value : 7.0;

      const beforeVal = plc.getRegisterValue(register);
      const writeResult = plc.writeRegister(register, value, "attacker", context.timestamp);

      if (!writeResult.success) {
        return this.recordFailure(
          attackId,
          payload,
          `PLC command rejected: ${writeResult.reason}`,
          context.timestamp,
        );
      }

      target.compromised = true;
      return this.recordSuccess(
        attackId,
        payload,
        { [register]: beforeVal },
        { [register]: value },
        context.timestamp,
      );
    }

    // 6. Sensor Spoofing / False Data Injection (T0814)
    if (techniqueId === "T0814" || parameters.action === "spoof_sensor") {
      const sensor = context.sensors.get(targetAssetId);
      if (!sensor) {
        return this.recordFailure(
          attackId,
          payload,
          `Target ${targetAssetId} is not an instrument sensor`,
          context.timestamp,
        );
      }

      const offset = typeof parameters.offset === "number" ? parameters.offset : 0;
      const beforeOffset = sensor.getState().spoofOffset;
      sensor.setSpoofOffset(offset);

      return this.recordSuccess(
        attackId,
        payload,
        { spoofOffset: beforeOffset },
        { spoofOffset: offset },
        context.timestamp,
      );
    }

    // Default fallback execution
    target.compromised = true;
    return this.recordSuccess(attackId, payload, {}, { executed: true }, context.timestamp);
  }

  private recordSuccess(
    attackId: string,
    payload: AttackActionPayload,
    beforeState: Record<string, unknown>,
    afterState: Record<string, unknown>,
    timestamp: number,
  ): AttackExecutionResult {
    const result: AttackExecutionResult = {
      attackId,
      success: true,
      techniqueId: payload.techniqueId,
      phase: payload.phase,
      sourceAssetId: payload.sourceAssetId,
      targetAssetId: payload.targetAssetId,
      beforeState,
      afterState,
      timestamp,
    };
    this.attackHistory.push(result);
    return result;
  }

  private recordFailure(
    attackId: string,
    payload: AttackActionPayload,
    reason: string,
    timestamp: number,
  ): AttackExecutionResult {
    const result: AttackExecutionResult = {
      attackId,
      success: false,
      blockedReason: reason,
      techniqueId: payload.techniqueId,
      phase: payload.phase,
      sourceAssetId: payload.sourceAssetId,
      targetAssetId: payload.targetAssetId,
      beforeState: {},
      afterState: {},
      timestamp,
    };
    this.attackHistory.push(result);
    return result;
  }

  public getHistory(): AttackExecutionResult[] {
    return [...this.attackHistory];
  }

  public getActiveAttacks(): ActiveAttackState[] {
    return Array.from(this.activeAttacks.values());
  }
}
