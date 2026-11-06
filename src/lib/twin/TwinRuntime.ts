/**
 * TwinRuntime.ts
 *
 * Central cyber-physical simulation runtime for TwinSec.
 * Coordinates deterministic execution across physical process models,
 * PLC state machines, sensors, actuators, Purdue network topology,
 * state-modifying attack engines, live statistical detections, and defensive response.
 */

import { SeededRng } from "./SeededRng";
import { SimulationClock } from "./SimulationClock";
import { WaterTreatmentProcess } from "./process/WaterTreatmentProcess";
import { PowerGridProcess } from "./process/PowerGridProcess";
import { PlcDevice } from "./devices/PlcDevice";
import { SensorDevice } from "./devices/SensorDevice";
import { ActuatorDevice } from "./devices/ActuatorDevice";
import { NetworkEngine } from "./network/NetworkEngine";
import {
  AttackEngine,
  type AttackActionPayload,
  type AttackExecutionResult,
} from "./attacks/AttackEngine";
import { ResponseEngine, type ResponseActionResult } from "./response/ResponseEngine";
import { RecoveryEngine } from "./recovery/RecoveryEngine";
import { IncidentManager } from "./incident/IncidentManager";
import { classifyLiveProcessState } from "../engines/detection-engine";
import { globalEventStore } from "../simulation/event-store";
import { eventBus } from "../event-bus";
import {
  type TwinState,
  type AssetState,
  type DetectionAlert,
  type SimulationStatus,
  cloneTwinState,
} from "./TwinState";

export interface TwinRuntimeOptions {
  seed?: number;
  scenarioId?: string;
  dt?: number;
}

export class TwinRuntime {
  public readonly simulationId: string;
  public readonly scenarioId: string;
  public readonly experimentId: string;
  public readonly seed: number;

  private clock: SimulationClock;
  private rng: SeededRng;
  private status: SimulationStatus = "INITIALIZING";

  // Subsystems
  private process: WaterTreatmentProcess | PowerGridProcess;
  private plcs: Map<string, PlcDevice> = new Map();
  private sensors: Map<string, SensorDevice> = new Map();
  private actuators: Map<string, ActuatorDevice> = new Map();
  private assets: Map<string, AssetState> = new Map();
  private network: NetworkEngine;
  private attackEngine: AttackEngine;
  private responseEngine: ResponseEngine;
  private recoveryEngine: RecoveryEngine;
  private incidentManager: IncidentManager;

  private activeDetections: DetectionAlert[] = [];
  private totalAttacksAttempted: number = 0;
  private totalAttacksBlocked: number = 0;

  constructor(options: TwinRuntimeOptions = {}) {
    this.seed = options.seed ?? 1337;
    this.scenarioId = options.scenarioId ?? "water";
    this.simulationId = `sim_${Date.now()}_${this.seed}`;
    this.experimentId = `exp_${this.scenarioId}_${this.seed}`;

    this.rng = new SeededRng(this.seed);
    this.clock = new SimulationClock();
    this.process =
      this.scenarioId === "power" ? new PowerGridProcess() : new WaterTreatmentProcess();
    this.network = new NetworkEngine();
    this.attackEngine = new AttackEngine(this.rng);
    this.responseEngine = new ResponseEngine();
    this.recoveryEngine = new RecoveryEngine();
    this.incidentManager = new IncidentManager();

    this.initializeTopology();
    this.status = "RUNNING";
  }

  /**
   * Set up default Water Treatment plant Purdue hierarchy topology and devices.
   */
  private initializeTopology(): void {
    if (this.scenarioId === "power") {
      this.initializePowerTopology();
      return;
    }

    // 1. Assets
    const initialAssets: AssetState[] = [
      {
        id: "EWS-04",
        name: "Engineering Workstation 04",
        role: "EWS",
        purdueLevel: 3,
        zone: "SCADA",
        ipAddress: "192.168.30.14",
        status: "ONLINE",
        compromised: false,
        isolated: false,
        patched: false,
        services: ["SSH", "RDP", "TIA-PORTAL"],
        vulnerabilities: ["CVE-2022-38465", "WEAK_CREDENTIALS"],
      },
      {
        id: "HMI-11",
        name: "Main SCADA Operator Console",
        role: "HMI",
        purdueLevel: 2,
        zone: "SCADA",
        ipAddress: "192.168.30.22",
        status: "ONLINE",
        compromised: false,
        isolated: false,
        patched: false,
        services: ["HTTP", "VNC", "OPC-UA"],
        vulnerabilities: ["CVE-2021-32955"],
      },
      {
        id: "PLC-INTAKE",
        name: "Raw Water Intake Controller",
        role: "PLC",
        purdueLevel: 1,
        zone: "CONTROL",
        ipAddress: "10.0.10.11",
        status: "ONLINE",
        compromised: false,
        isolated: false,
        patched: false,
        services: ["MODBUS-TCP", "S7COMM"],
        vulnerabilities: ["UNAUTHENTICATED_COMMAND"],
      },
      {
        id: "PLC-DOSE",
        name: "Chemical Disinfection & Dosing PLC",
        role: "PLC",
        purdueLevel: 1,
        zone: "CONTROL",
        ipAddress: "10.0.10.12",
        status: "ONLINE",
        compromised: false,
        isolated: false,
        patched: false,
        services: ["MODBUS-TCP", "ENIP"],
        vulnerabilities: ["UNAUTHENTICATED_COMMAND", "REPLAY_SUSCEPTIBLE"],
      },
      {
        id: "PLC-DIST",
        name: "Treated Water Distribution PLC",
        role: "PLC",
        purdueLevel: 1,
        zone: "CONTROL",
        ipAddress: "10.0.10.13",
        status: "ONLINE",
        compromised: false,
        isolated: false,
        patched: false,
        services: ["MODBUS-TCP", "DNP3"],
        vulnerabilities: [],
      },
    ];

    for (const a of initialAssets) {
      this.assets.set(a.id, a);
      this.network.addNode({ id: a.id, zone: a.zone, purdueLevel: a.purdueLevel });
    }

    // 2. Network Edges
    this.network.addEdge({ id: "e1", from: "EWS-04", to: "HMI-11", protocol: "OPC-UA" });
    this.network.addEdge({ id: "e2", from: "HMI-11", to: "PLC-INTAKE", protocol: "MODBUS-TCP" });
    this.network.addEdge({ id: "e3", from: "HMI-11", to: "PLC-DOSE", protocol: "MODBUS-TCP" });
    this.network.addEdge({ id: "e4", from: "HMI-11", to: "PLC-DIST", protocol: "MODBUS-TCP" });
    this.network.addEdge({ id: "e5", from: "EWS-04", to: "PLC-DOSE", protocol: "S7COMM" });

    // 3. PLCs
    const plcIntake = new PlcDevice({
      id: "PLC-INTAKE",
      label: "Intake Pump Controller",
      purdueLevel: 1,
      registers: [
        {
          name: "pump_speed",
          value: 90,
          unit: "%",
          min: 0,
          max: 100,
          baseline: 90,
          description: "Intake pump drive speed",
        },
        {
          name: "tank_high_limit",
          value: 85,
          unit: "%",
          min: 50,
          max: 95,
          baseline: 85,
          description: "High level cutoff alarm",
        },
      ],
    });
    this.plcs.set(plcIntake.id, plcIntake);

    const plcDose = new PlcDevice({
      id: "PLC-DOSE",
      label: "Chemical Dosing Controller",
      purdueLevel: 1,
      registers: [
        {
          name: "dosing_setpoint",
          value: 1.5,
          unit: "ppm",
          min: 0.2,
          max: 10.0,
          baseline: 1.5,
          description: "Target chlorine concentration",
        },
        {
          name: "valve_position",
          value: 45,
          unit: "%",
          min: 0,
          max: 100,
          baseline: 45,
          description: "Chemical dosing valve feed position",
        },
        {
          name: "safety_trip_limit",
          value: 8.0,
          unit: "ppm",
          min: 3.0,
          max: 12.0,
          baseline: 8.0,
          description: "SIS emergency trip threshold",
        },
      ],
    });
    this.plcs.set(plcDose.id, plcDose);

    const plcDist = new PlcDevice({
      id: "PLC-DIST",
      label: "Distribution Main Controller",
      purdueLevel: 1,
      registers: [
        {
          name: "dist_pump_speed",
          value: 75,
          unit: "%",
          min: 0,
          max: 100,
          baseline: 75,
          description: "Treated distribution pump speed",
        },
        {
          name: "target_pressure",
          value: 4.5,
          unit: "bar",
          min: 2.0,
          max: 7.0,
          baseline: 4.5,
          description: "Municipal grid pressure setpoint",
        },
      ],
    });
    this.plcs.set(plcDist.id, plcDist);

    // 4. Actuators
    this.actuators.set(
      "ACT-INTAKE-PUMP",
      new ActuatorDevice({
        id: "ACT-INTAKE-PUMP",
        label: "Intake Variable Frequency Drive",
        unit: "%",
        plcId: "PLC-INTAKE",
        commandRegister: "pump_speed",
        minPosition: 0,
        maxPosition: 100,
        rampRate: 15,
        safePosition: 0,
      }),
    );

    this.actuators.set(
      "ACT-DOSE-VALVE",
      new ActuatorDevice({
        id: "ACT-DOSE-VALVE",
        label: "Chlorine Dosing Solenoid Valve",
        unit: "%",
        plcId: "PLC-DOSE",
        commandRegister: "valve_position",
        minPosition: 0,
        maxPosition: 100,
        rampRate: 20,
        safePosition: 0,
      }),
    );

    this.actuators.set(
      "ACT-DIST-PUMP",
      new ActuatorDevice({
        id: "ACT-DIST-PUMP",
        label: "Distribution Main Pump VFD",
        unit: "%",
        plcId: "PLC-DIST",
        commandRegister: "dist_pump_speed",
        minPosition: 0,
        maxPosition: 100,
        rampRate: 10,
        safePosition: 30,
      }),
    );

    // 5. Sensors
    this.sensors.set(
      "FIT-101",
      new SensorDevice({
        id: "FIT-101",
        label: "Raw Intake Flow Meter",
        unit: "m³/h",
        processVariable: "intakeFlowRate",
        noiseSigma: 1.2,
        min: 0,
        max: 800,
      }),
    );

    this.sensors.set(
      "LIT-101",
      new SensorDevice({
        id: "LIT-101",
        label: "Settling Tank Level Transmitter",
        unit: "%",
        processVariable: "settlingTankLevel",
        noiseSigma: 0.4,
        min: 0,
        max: 100,
      }),
    );

    this.sensors.set(
      "AIT-301",
      new SensorDevice({
        id: "AIT-301",
        label: "Residual Chlorine Analyzer",
        unit: "mg/L",
        processVariable: "chlorineConcentration",
        noiseSigma: 0.05,
        min: 0,
        max: 20,
      }),
    );

    this.sensors.set(
      "PIT-501",
      new SensorDevice({
        id: "PIT-501",
        label: "Distribution Main Pressure",
        unit: "bar",
        processVariable: "distributionPressure",
        noiseSigma: 0.03,
        min: 0,
        max: 10,
      }),
    );

    // Initial event
    globalEventStore.append({
      timestamp: 0,
      type: "RECON_SCAN",
      sourceAssetId: "SYSTEM",
      severity: "INFO",
      title: "TwinSec Simulation Initialized",
      description: `Plant initialized with seed ${this.seed} under scenario '${this.scenarioId}'`,
      data: { seed: this.seed, scenarioId: this.scenarioId },
    });
  }

  /**
   * Set up Power Grid synchronous generation yard topology and devices.
   */
  private initializePowerTopology(): void {
    const initialAssets: AssetState[] = [
      {
        id: "EWS-04",
        name: "Engineering Workstation 04",
        role: "EWS",
        purdueLevel: 3,
        zone: "SCADA",
        ipAddress: "192.168.30.14",
        status: "ONLINE",
        compromised: false,
        isolated: false,
        patched: false,
        services: ["SSH", "RDP", "TIA-PORTAL"],
        vulnerabilities: ["CVE-2022-38465", "WEAK_CREDENTIALS"],
      },
      {
        id: "HMI-11",
        name: "Main SCADA Operator Console",
        role: "HMI",
        purdueLevel: 2,
        zone: "SCADA",
        ipAddress: "192.168.30.22",
        status: "ONLINE",
        compromised: false,
        isolated: false,
        patched: false,
        services: ["HTTP", "VNC", "OPC-UA"],
        vulnerabilities: ["CVE-2021-32955"],
      },
      {
        id: "PLC-3",
        name: "Turbine Governor / Exciter PLC",
        role: "PLC",
        purdueLevel: 1,
        zone: "CONTROL",
        ipAddress: "10.0.10.11",
        status: "ONLINE",
        compromised: false,
        isolated: false,
        patched: false,
        services: ["MODBUS-TCP", "S7COMM"],
        vulnerabilities: ["UNAUTHENTICATED_COMMAND"],
      },
      {
        id: "PLC-7",
        name: "Feeder & Load Shed Controller",
        role: "PLC",
        purdueLevel: 1,
        zone: "CONTROL",
        ipAddress: "10.0.10.12",
        status: "ONLINE",
        compromised: false,
        isolated: false,
        patched: false,
        services: ["MODBUS-TCP", "DNP3"],
        vulnerabilities: ["UNAUTHENTICATED_COMMAND", "REPLAY_SUSCEPTIBLE"],
      },
      {
        id: "SIS-LS",
        name: "Safety Instrumented System - Load Shed",
        role: "PLC",
        purdueLevel: 1,
        zone: "CONTROL",
        ipAddress: "10.0.10.13",
        status: "ONLINE",
        compromised: false,
        isolated: false,
        patched: false,
        services: ["SAFETY-NET"],
        vulnerabilities: [],
      },
    ];

    for (const a of initialAssets) {
      this.assets.set(a.id, a);
      this.network.addNode({ id: a.id, zone: a.zone, purdueLevel: a.purdueLevel });
    }

    this.network.addEdge({ id: "e1", from: "EWS-04", to: "HMI-11", protocol: "OPC-UA" });
    this.network.addEdge({ id: "e2", from: "HMI-11", to: "PLC-3", protocol: "MODBUS-TCP" });
    this.network.addEdge({ id: "e3", from: "HMI-11", to: "PLC-7", protocol: "MODBUS-TCP" });
    this.network.addEdge({ id: "e4", from: "EWS-04", to: "PLC-3", protocol: "S7COMM" });
    this.network.addEdge({ id: "e5", from: "PLC-7", to: "SIS-LS", protocol: "SAFETY-NET" });

    const plc3 = new PlcDevice({
      id: "PLC-3",
      label: "Turbine Governor Controller",
      purdueLevel: 1,
      registers: [
        {
          name: "frequency_setpoint",
          value: 50.0,
          unit: "Hz",
          min: 45.0,
          max: 55.0,
          baseline: 50.0,
          description: "Governor target frequency",
        },
        {
          name: "governor_valve",
          value: 45.0,
          unit: "%",
          min: 0,
          max: 100,
          baseline: 45.0,
          description: "Fuel/steam throttle position",
        },
        {
          name: "speed_hz",
          value: 50.0,
          unit: "Hz",
          min: 0,
          max: 70.0,
          baseline: 50.0,
          description: "Shaft rotation speed",
        },
      ],
    });
    this.plcs.set(plc3.id, plc3);

    const plc7 = new PlcDevice({
      id: "PLC-7",
      label: "Feeder & Load Shed Controller",
      purdueLevel: 1,
      registers: [
        {
          name: "breaker_state",
          value: 1,
          unit: "latch",
          min: 0,
          max: 1,
          baseline: 1,
          description: "Feeder breaker state (1: closed, 0: open)",
        },
        {
          name: "aux_load_shed",
          value: 0,
          unit: "MW",
          min: 0,
          max: 50.0,
          baseline: 0,
          description: "Auxiliary load shed demand",
        },
        {
          name: "bearing_temp_limit",
          value: 95.0,
          unit: "°C",
          min: 60.0,
          max: 120.0,
          baseline: 95.0,
          description: "Thermal safety limit",
        },
      ],
    });
    this.plcs.set(plc7.id, plc7);

    this.actuators.set(
      "ACT-GOVERNOR",
      new ActuatorDevice({
        id: "ACT-GOVERNOR",
        label: "Electro-Hydraulic Governor Actuator",
        unit: "Hz",
        plcId: "PLC-3",
        commandRegister: "frequency_setpoint",
        minPosition: 40.0,
        maxPosition: 65.0,
        rampRate: 5.0,
        safePosition: 50.0,
      }),
    );

    this.actuators.set(
      "ACT-BREAKER",
      new ActuatorDevice({
        id: "ACT-BREAKER",
        label: "HV Breaker Latch Actuator",
        unit: "latch",
        plcId: "PLC-7",
        commandRegister: "breaker_state",
        minPosition: 0,
        maxPosition: 1,
        rampRate: 1.0,
        safePosition: 0,
      }),
    );

    this.sensors.set(
      "FREQ-101",
      new SensorDevice({
        id: "FREQ-101",
        label: "Shaft Optical Tachometer / Grid Frequency",
        unit: "Hz",
        processVariable: "frequencyHz",
        noiseSigma: 0.02,
        min: 35.0,
        max: 65.0,
      }),
    );

    this.sensors.set(
      "TEMP-201",
      new SensorDevice({
        id: "TEMP-201",
        label: "Turbine Main Journal Bearing RTD",
        unit: "°C",
        processVariable: "bearingTemperatureC",
        noiseSigma: 0.15,
        min: 20.0,
        max: 150.0,
      }),
    );

    this.sensors.set(
      "PRES-301",
      new SensorDevice({
        id: "PRES-301",
        label: "Transformer Coolant / Feeder Hydraulic Pressure",
        unit: "bar",
        processVariable: "feederPressureBar",
        noiseSigma: 0.04,
        min: 0.0,
        max: 15.0,
      }),
    );

    globalEventStore.append({
      timestamp: 0,
      type: "RECON_SCAN",
      sourceAssetId: "SYSTEM",
      severity: "INFO",
      title: "TwinSec Power Grid Simulation Initialized",
      description: `Power generation yard initialized with seed ${this.seed} under scenario '${this.scenarioId}'`,
      data: { seed: this.seed, scenarioId: this.scenarioId },
    });
  }

  /**
   * Advance simulation by dt seconds.
   */
  public tick(dt: number = 1.0): TwinState {
    this.clock.step(dt);
    const currentTime = this.clock.getTime();

    // 1. Synchronize PLC registers to actuators
    for (const actuator of this.actuators.values()) {
      const plc = this.plcs.get(actuator.plcId);
      if (plc) {
        let setpoint = plc.getRegisterValue(actuator.commandRegister);

        // Closed-loop industrial control loop:
        if (actuator.id === "ACT-DOSE-VALVE") {
          const doseSetpoint = plc.getRegisterValue("dosing_setpoint");
          if (doseSetpoint > 0) {
            setpoint = Math.min(100, Math.max(0, (doseSetpoint / 13.33) * 100));
          }
        }

        actuator.setTargetPosition(setpoint);
      }
      actuator.tick(dt);
    }

    // 2. Feed actuator positions into physical process engine
    if (this.process instanceof PowerGridProcess) {
      const govActuator = this.actuators.get("ACT-GOVERNOR");
      const brkActuator = this.actuators.get("ACT-BREAKER");
      const govSetpoint = govActuator?.getCurrentPosition() ?? 50.0;
      const breakerClosed = (brkActuator?.getCurrentPosition() ?? 1) > 0.5;

      this.process.tick(dt, {
        governorSetpointHz: govSetpoint,
        breakerTrip: !breakerClosed,
      });
    } else {
      const intakePumpActuator = this.actuators.get("ACT-INTAKE-PUMP");
      const doseValveActuator = this.actuators.get("ACT-DOSE-VALVE");
      const distPumpActuator = this.actuators.get("ACT-DIST-PUMP");

      this.process.tick(dt, {
        intakePumpSpeed: intakePumpActuator?.getCurrentPosition(),
        dosingValvePosition: doseValveActuator?.getCurrentPosition(),
        distributionPumpSpeed: distPumpActuator?.getCurrentPosition(),
      });
    }

    const pState = this.process.getState();

    // 3. Update sensors with physical ground truth + noise
    for (const sensor of this.sensors.values()) {
      const groundTruthVal =
        (pState as unknown as Record<string, number>)[sensor.processVariable] ?? 0;
      sensor.update(groundTruthVal, currentTime, this.rng);
    }

    // 4. Run real-time detection on observable telemetry
    const liveTelemetryMap: Record<string, number> = {};
    for (const sensor of this.sensors.values()) {
      liveTelemetryMap[sensor.processVariable] = sensor.getMeasuredValue();
    }
    const detectedAlerts = classifyLiveProcessState(liveTelemetryMap, currentTime, 2.5);

    for (const alert of detectedAlerts) {
      this.activeDetections.push(alert);
      this.incidentManager.ingestDetection(alert);

      globalEventStore.append({
        timestamp: currentTime,
        type: "DETECTION_TRIGGERED",
        sourceAssetId: alert.targetAssetId,
        severity: alert.severity === "CRITICAL" ? "CRITICAL" : "WARN",
        title: `Anomaly Detected: ${alert.variableName}`,
        description: alert.description,
        data: { alert },
      });

      eventBus.publish({
        id: alert.id,
        time: currentTime,
        type: "twin.detection",
        payload: alert,
      });
    }

    // 5. Evaluate recovery status
    const recoveryStatus = this.recoveryEngine.evaluateStabilization(pState, currentTime);
    if (recoveryStatus.isFullyRecovered) {
      this.incidentManager.markAllResolved(currentTime);
    }

    // 6. Build authoritative state
    const state = this.buildState(dt);

    eventBus.publish({
      id: `state-${currentTime}`,
      time: currentTime,
      type: "twin.state",
      payload: state,
    });

    return state;
  }

  /**
   * Execute an attack against simulation devices or assets.
   */
  public applyAttack(payload: AttackActionPayload): AttackExecutionResult {
    this.totalAttacksAttempted++;
    const currentTime = this.clock.getTime();
    this.incidentManager.notifyAttackInitiated(currentTime);

    const result = this.attackEngine.executeAttack(payload, {
      timestamp: currentTime,
      assets: this.assets,
      plcs: this.plcs,
      sensors: this.sensors,
      network: this.network,
    });

    if (!result.success) {
      this.totalAttacksBlocked++;
    }

    globalEventStore.append({
      timestamp: currentTime,
      type: result.success ? "ATTACK_ACTION" : "DEFENSE_INTERVENTION",
      sourceAssetId: payload.sourceAssetId,
      targetAssetId: payload.targetAssetId,
      severity: result.success ? "HIGH" : "INFO",
      title: result.success
        ? `Attack Executed: ${payload.techniqueName}`
        : `Attack Blocked: ${payload.techniqueName}`,
      description: result.success
        ? `Adversary executed ${payload.techniqueId} on ${payload.targetAssetId}`
        : `Adversary attack blocked: ${result.blockedReason}`,
      data: { payload, result },
      beforeState: result.beforeState,
      afterState: result.afterState,
    });

    return result;
  }

  /**
   * Execute operator command (terminal / automated response).
   */
  public applyCommand(commandLine: string): ResponseActionResult {
    const currentTime = this.clock.getTime();
    const parts = commandLine.trim().split(/\s+/);
    const cmd = parts[0]?.toLowerCase();
    const arg1 = parts[1];
    const arg2 = parts[2];
    const arg3 = parts[3];

    let result: ResponseActionResult;

    switch (cmd) {
      case "isolate":
      case "airgap":
      case "lock":
      case "lockdown":
      case "purge":
      case "vent":
      case "drop-uplink":
      case "sever-gateway":
      case "valve-isolate":
      case "esd-trip":
      case "compressor-trip":
      case "crane-lock":
      case "signal-allred":
        result = this.responseEngine.isolateAsset(arg1, {
          timestamp: currentTime,
          assets: this.assets,
          network: this.network,
        });
        if (result.success) {
          this.recoveryEngine.initiateRecovery(currentTime);
          this.incidentManager.markAllContained(currentTime, `Asset ${arg1} air-gapped`);
        }
        break;

      case "reconnect":
        result = this.responseEngine.reconnectAsset(arg1, {
          timestamp: currentTime,
          assets: this.assets,
          network: this.network,
        });
        break;

      case "reset":
        result = this.responseEngine.resetPlc(arg1, {
          timestamp: currentTime,
          assets: this.assets,
          plcs: this.plcs,
        });
        if (result.success) {
          this.recoveryEngine.initiateRecovery(currentTime);
        }
        break;

      case "patch":
        result = this.responseEngine.patchAsset(arg1, {
          timestamp: currentTime,
          assets: this.assets,
        });
        break;

      case "calibrate":
        result = this.responseEngine.calibrateSensor(arg1, {
          timestamp: currentTime,
          sensors: this.sensors,
        });
        break;

      case "estop":
      case "trip":
        result = this.responseEngine.emergencyStop({
          timestamp: currentTime,
          actuators: this.actuators,
          process: this.process,
        });
        break;

      case "override": {
        const plcId = arg1?.toUpperCase();
        const plc = this.plcs.get(plcId) || this.plcs.get(arg1);
        const param = arg2?.toLowerCase();
        const val = parseFloat(arg3);
        if (plc && param && !isNaN(val)) {
          const reg = plc
            .getRegisters()
            .find((r) => r.name.toLowerCase() === param || r.name.toLowerCase().includes(param));
          if (reg) {
            plc.setRegisterValue(reg.name, val);
            result = {
              actionId: `cmd-override-${currentTime.toFixed(0)}`,
              type: "OVERRIDE",
              targetAssetId: plc.id,
              success: true,
              message: `PLC ${plc.id} register '${reg.name}' setpoint overridden to ${val} ${reg.unit}`,
              timestamp: currentTime,
            };
          } else {
            result = {
              actionId: `cmd-override-err-${currentTime.toFixed(0)}`,
              type: "OVERRIDE",
              targetAssetId: plc.id,
              success: false,
              message: `Register '${arg2}' not found on PLC ${plc.id}`,
              timestamp: currentTime,
            };
          }
        } else {
          result = {
            actionId: `cmd-override-err-${currentTime.toFixed(0)}`,
            type: "OVERRIDE",
            targetAssetId: arg1 || "NONE",
            success: false,
            message: `Usage: override <plc-id> <register-name> <value>`,
            timestamp: currentTime,
          };
        }
        break;
      }

      default:
        result = {
          actionId: `cmd-err-${currentTime.toFixed(0)}`,
          type: "ISOLATE",
          targetAssetId: arg1 || "NONE",
          success: false,
          message: `Unknown command: ${cmd}. Available: isolate, reconnect, reset, patch, calibrate, estop, override`,
          timestamp: currentTime,
        };
    }

    globalEventStore.append({
      timestamp: currentTime,
      type: "DEFENSE_INTERVENTION",
      sourceAssetId: "OPERATOR",
      targetAssetId: arg1,
      severity: result.success ? "INFO" : "WARN",
      title: `Operator Response: ${cmd.toUpperCase()}`,
      description: result.message,
      data: { commandLine, result },
    });

    return result;
  }

  /**
   * Return an immutable snapshot of current TwinState.
   */
  public getState(): TwinState {
    return cloneTwinState(this.buildState(1.0));
  }

  private buildState(dt: number): TwinState {
    const assetsRecord: Record<string, AssetState> = {};
    for (const [id, a] of this.assets.entries()) {
      assetsRecord[id] = { ...a };
    }

    const plcsRecord: Record<string, any> = {};
    for (const [id, p] of this.plcs.entries()) {
      plcsRecord[id] = p.snapshot();
    }

    const sensorsRecord: Record<string, any> = {};
    for (const [id, s] of this.sensors.entries()) {
      sensorsRecord[id] = s.getState();
    }

    const actuatorsRecord: Record<string, any> = {};
    for (const [id, act] of this.actuators.entries()) {
      actuatorsRecord[id] = act.getState();
    }

    const pState = this.process.getState();
    const recoveryEval = this.recoveryEngine.evaluateStabilization(pState, this.clock.getTime());

    // Calculate system integrity %
    let integrity = 100;
    for (const a of this.assets.values()) {
      if (a.compromised) integrity -= 15;
    }
    if (recoveryEval.deviantVariables.length > 0) {
      integrity -= recoveryEval.deviantVariables.length * 20;
    }
    integrity = Math.max(0, Math.min(100, integrity));

    return {
      simulationId: this.simulationId,
      scenarioId: this.scenarioId,
      experimentId: this.experimentId,
      seed: this.seed,
      time: this.clock.getTime(),
      dt,
      status: this.status,
      assets: assetsRecord,
      plcs: plcsRecord,
      sensors: sensorsRecord,
      actuators: actuatorsRecord,
      process: pState,
      network: this.network.getState(),
      activeAttacks: this.attackEngine.getActiveAttacks(),
      activeDetections: this.activeDetections.slice(-20),
      incidents: this.incidentManager.getIncidents(),
      metrics: {
        mttdSeconds: this.incidentManager.getMttd(),
        mttrSeconds: recoveryEval.mttrSeconds ?? null,
        totalEvents: globalEventStore.getEvents().length,
        totalAttacksAttempted: this.totalAttacksAttempted,
        totalAttacksBlocked: this.totalAttacksBlocked,
        systemIntegrity: integrity,
        safetyTripActive: this.process.isTripped(),
        consequenceSeverity:
          integrity < 30
            ? "CRITICAL"
            : integrity < 60
              ? "HIGH"
              : integrity < 85
                ? "MEDIUM"
                : "NOMINAL",
      },
    };
  }
}
