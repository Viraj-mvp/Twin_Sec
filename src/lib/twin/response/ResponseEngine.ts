/**
 * ResponseEngine.ts
 *
 * Defensive response engine for TwinSec.
 * Applies operator/automated containment and mitigation actions:
 * asset isolation, PLC reset, security patching, sensor recalibration, and emergency stops.
 */

import type { AssetState } from "../TwinState";
import type { PlcDevice } from "../devices/PlcDevice";
import type { SensorDevice } from "../devices/SensorDevice";
import type { ActuatorDevice } from "../devices/ActuatorDevice";
import type { NetworkEngine } from "../network/NetworkEngine";
import type { WaterTreatmentProcess } from "../process/WaterTreatmentProcess";
import type { PowerGridProcess } from "../process/PowerGridProcess";

export interface ResponseActionResult {
  actionId: string;
  type:
    | "ISOLATE"
    | "RECONNECT"
    | "RESET_PLC"
    | "PATCH"
    | "EMERGENCY_STOP"
    | "CALIBRATE_SENSOR"
    | "OVERRIDE";
  targetAssetId: string;
  success: boolean;
  message: string;
  timestamp: number;
}

export class ResponseEngine {
  private responseHistory: ResponseActionResult[] = [];

  /**
   * Isolate asset from network (Air-Gap Severance).
   */
  public isolateAsset(
    assetId: string,
    context: {
      timestamp: number;
      assets: Map<string, AssetState>;
      network: NetworkEngine;
    },
  ): ResponseActionResult {
    const asset = context.assets.get(assetId);
    if (!asset) {
      return this.recordResult(
        "ISOLATE",
        assetId,
        false,
        `Asset ${assetId} not found`,
        context.timestamp,
      );
    }

    context.network.isolateAsset(assetId);
    asset.isolated = true;

    return this.recordResult(
      "ISOLATE",
      assetId,
      true,
      `Asset ${assetId} successfully isolated from OT/IT network (Air-Gap Severed)`,
      context.timestamp,
    );
  }

  /**
   * Reconnect isolated asset to network.
   */
  public reconnectAsset(
    assetId: string,
    context: {
      timestamp: number;
      assets: Map<string, AssetState>;
      network: NetworkEngine;
    },
  ): ResponseActionResult {
    const asset = context.assets.get(assetId);
    if (!asset) {
      return this.recordResult(
        "RECONNECT",
        assetId,
        false,
        `Asset ${assetId} not found`,
        context.timestamp,
      );
    }

    context.network.reconnectAsset(assetId);
    asset.isolated = false;

    return this.recordResult(
      "RECONNECT",
      assetId,
      true,
      `Asset ${assetId} reconnected to OT/IT network`,
      context.timestamp,
    );
  }

  /**
   * Reset PLC registers back to safe engineering baselines and clear compromise flag.
   */
  public resetPlc(
    plcId: string,
    context: {
      timestamp: number;
      assets: Map<string, AssetState>;
      plcs: Map<string, PlcDevice>;
    },
  ): ResponseActionResult {
    const plc = context.plcs.get(plcId);
    const asset = context.assets.get(plcId);

    if (!plc || !asset) {
      return this.recordResult(
        "RESET_PLC",
        plcId,
        false,
        `PLC ${plcId} not found`,
        context.timestamp,
      );
    }

    plc.resetToBaseline(context.timestamp);
    asset.compromised = false;
    asset.status = "ONLINE";

    return this.recordResult(
      "RESET_PLC",
      plcId,
      true,
      `PLC ${plcId} registers restored to factory baselines; adversary control revoked`,
      context.timestamp,
    );
  }

  /**
   * Apply software/firmware patch to asset.
   */
  public patchAsset(
    assetId: string,
    context: {
      timestamp: number;
      assets: Map<string, AssetState>;
    },
  ): ResponseActionResult {
    const asset = context.assets.get(assetId);
    if (!asset) {
      return this.recordResult(
        "PATCH",
        assetId,
        false,
        `Asset ${assetId} not found`,
        context.timestamp,
      );
    }

    asset.patched = true;
    asset.compromised = false;
    asset.vulnerabilities = [];

    return this.recordResult(
      "PATCH",
      assetId,
      true,
      `Asset ${assetId} patched and secured against known exploits`,
      context.timestamp,
    );
  }

  /**
   * Clear sensor spoof offset and recalibrate.
   */
  public calibrateSensor(
    sensorId: string,
    context: {
      timestamp: number;
      sensors: Map<string, SensorDevice>;
    },
  ): ResponseActionResult {
    const sensor = context.sensors.get(sensorId);
    if (!sensor) {
      return this.recordResult(
        "CALIBRATE_SENSOR",
        sensorId,
        false,
        `Sensor ${sensorId} not found`,
        context.timestamp,
      );
    }

    sensor.setSpoofOffset(0);

    return this.recordResult(
      "CALIBRATE_SENSOR",
      sensorId,
      true,
      `Sensor ${sensorId} recalibrated; false data offset eliminated`,
      context.timestamp,
    );
  }

  /**
   * Trip Safety Instrumented System (SIS) safe positions.
   */
  public emergencyStop(context: {
    timestamp: number;
    actuators: Map<string, ActuatorDevice>;
    process: WaterTreatmentProcess | PowerGridProcess;
  }): ResponseActionResult {
    for (const actuator of context.actuators.values()) {
      actuator.tripToSafe();
    }
    context.process.emergencyTrip();

    return this.recordResult(
      "EMERGENCY_STOP",
      "SYSTEM_SIS",
      true,
      "Safety Instrumented System (SIS) trip engaged: actuators commanded to safe fail-closed positions",
      context.timestamp,
    );
  }

  private recordResult(
    type: ResponseActionResult["type"],
    targetAssetId: string,
    success: boolean,
    message: string,
    timestamp: number,
  ): ResponseActionResult {
    const result: ResponseActionResult = {
      actionId: `res-${timestamp.toFixed(0)}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      targetAssetId,
      success,
      message,
      timestamp,
    };
    this.responseHistory.push(result);
    return result;
  }

  public getHistory(): ResponseActionResult[] {
    return [...this.responseHistory];
  }
}
