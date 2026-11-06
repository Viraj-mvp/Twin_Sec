/**
 * WaterTreatmentProcess.ts
 *
 * Causal first-principles model of a municipal water treatment plant.
 * Calibrated against HAI v23.05 P3 (Water Treatment) statistical distributions.
 *
 * Process chain:
 *   Raw Intake → Intake Pump → Settling Tank → Chemical Dosing → Contact Tank → Distribution Pump → Network
 *
 * Each variable is CAUSALLY connected:
 *   pumpSpeed → flowRate → tankLevel → pressure
 *   dosingValvePosition → chlorineFlowRate → chlorineConcentration
 *   distributionPumpSpeed → outputFlowRate → distributionPressure
 *
 * Parameters are grounded in:
 *   - HAI P3 chlorine baseline: mean 2.95 ppm, σ 0.6 ppm
 *   - HAI P3_FIT01 flow: mean ~58.99 m³/h (shared test-bench scale)
 *   - WHO potable water chlorine residual: 0.2 – 5.0 mg/L
 *   - Typical small-city plant: 500 m³/h nominal throughput, 2000 m³ reservoir
 */

// ─── Process Variable Types ──────────────────────────────────────

export interface WaterTreatmentState {
  // Intake
  intakePumpSpeed: number; // 0-100 % (PLC setpoint)
  intakeFlowRate: number; // m³/h (causal output of pump speed)

  // Settling / Reservoir
  settlingTankLevel: number; // 0-100 % (of 2000 m³ capacity)
  settlingTankVolume: number; // m³ (actual volume)

  // Chemical Dosing
  dosingValvePosition: number; // 0-100 % (PLC setpoint → actuator)
  chlorineInjectionRate: number; // kg/h (causal output of valve position)
  chlorineConcentration: number; // mg/L (ppm) — THE CRITICAL SAFETY VARIABLE

  // Contact Tank
  contactTankResidual: number; // mg/L after contact time

  // Distribution
  distributionPumpSpeed: number; // 0-100 %
  distributionFlowRate: number; // m³/h
  distributionPressure: number; // bar

  // Process Health
  processTemperature: number; // °C (ambient, slow-changing)
  pH: number; // pH units (6.5 – 8.5 normal)
}

// ─── Process Parameters (HAI-calibrated) ─────────────────────────

export const WATER_PROCESS_PARAMS = {
  // Intake pump
  pumpMaxFlow: 500, // m³/h at 100% speed
  pumpMinFlow: 0, // m³/h at 0% speed
  pumpEfficiency: 0.92, // mechanical efficiency
  pumpRampRate: 15, // %/s (how fast pump speed changes)

  // Settling tank
  tankCapacity: 2000, // m³
  tankNominalLevel: 65, // % (nominal operating point)
  tankOverflowLevel: 95, // % (overflow alarm)
  tankLowLevel: 15, // % (low alarm)

  // Chemical dosing — calibrated to HAI P3 chlorine mean 2.95 ppm
  maxChlorineInjection: 4.0, // kg/h at 100% valve (4000 g/h / 300 m3/h = 13.33 mg/L max)
  nominalDosingValve: 22.1, // % valve position for ~2.95 ppm at nominal flow (0.885 kg/h)
  chlorineDecayRate: 0.02, // 1/min — first-order chlorine demand/decay
  contactTime: 30, // minutes (CT requirement)

  // Distribution pump
  distMaxFlow: 450, // m³/h at 100%
  distMaxPressure: 6.0, // bar at 100% speed (no load)
  distNominalPressure: 3.8, // bar at typical load

  // WHO / Safety limits
  chlorineMin: 0.2, // mg/L — minimum for disinfection
  chlorineNominal: 2.95, // mg/L — HAI P3 mean baseline
  chlorineTasteThreshold: 4.0, // mg/L — taste/odor complaints
  chlorineDangerHigh: 8.0, // mg/L — acute health risk
  chlorineSigma: 0.6, // mg/L — HAI P3 standard deviation

  // SIS trip thresholds
  sisChlorineTrip: 10.0, // mg/L — SIS forces valve shut
  sisPressureTrip: 7.0, // bar — SIS relieves pressure
  sisLevelTrip: 98, // % — SIS stops intake pump

  // Ambient
  ambientTemperature: 22.5, // °C
  temperatureSigma: 0.8, // °C variation

  nominalPH: 7.2,
  phSigma: 0.15,
} as const;

// ─── Process Model ───────────────────────────────────────────────

export class WaterTreatmentProcess {
  private state: WaterTreatmentState;

  constructor() {
    this.state = this.createNominalState();
  }

  /**
   * Create nominal (healthy) initial state matching HAI P3 baselines.
   */
  public createNominalState(): WaterTreatmentState {
    const P = WATER_PROCESS_PARAMS;
    const nominalFlow = (P.tankNominalLevel / 100) * P.pumpMaxFlow * P.pumpEfficiency;
    const nominalVolume = (P.tankNominalLevel / 100) * P.tankCapacity;

    return {
      intakePumpSpeed: P.tankNominalLevel, // ~65%
      intakeFlowRate: nominalFlow,
      settlingTankLevel: P.tankNominalLevel,
      settlingTankVolume: nominalVolume,
      dosingValvePosition: P.nominalDosingValve,
      chlorineInjectionRate: (P.nominalDosingValve / 100) * P.maxChlorineInjection,
      chlorineConcentration: P.chlorineNominal, // 2.95 ppm — HAI baseline
      contactTankResidual: P.chlorineNominal * 0.92, // ~2.71 ppm after contact time decay
      distributionPumpSpeed: 60,
      distributionFlowRate: 0.6 * P.distMaxFlow,
      distributionPressure: P.distNominalPressure,
      processTemperature: P.ambientTemperature,
      pH: P.nominalPH,
    };
  }

  /**
   * Advance the process model by dt seconds.
   *
   * This is the CAUSAL CORE — every variable depends on its upstream variable.
   * No value is decorative. Change pump speed → flow changes → level changes → pressure changes.
   */
  public tick(
    dt: number,
    inputs?: {
      intakePumpSpeed?: number;
      dosingValvePosition?: number;
      distributionPumpSpeed?: number;
    },
  ): WaterTreatmentState {
    const P = WATER_PROCESS_PARAMS;
    const s = this.state;

    if (inputs?.intakePumpSpeed !== undefined) {
      s.intakePumpSpeed = Math.max(0, Math.min(100, inputs.intakePumpSpeed));
    }
    if (inputs?.dosingValvePosition !== undefined) {
      s.dosingValvePosition = Math.max(0, Math.min(100, inputs.dosingValvePosition));
    }
    if (inputs?.distributionPumpSpeed !== undefined) {
      s.distributionPumpSpeed = Math.max(0, Math.min(100, inputs.distributionPumpSpeed));
    }

    const dtMin = dt / 60; // Convert seconds to minutes for flow calculations
    const dtHour = dt / 3600; // Convert to hours for m³/h rates

    // ─── 1. INTAKE PUMP → FLOW RATE ──────────────────────────
    // Flow is proportional to pump speed (simplified pump curve)
    s.intakeFlowRate = (s.intakePumpSpeed / 100) * P.pumpMaxFlow * P.pumpEfficiency;

    // ─── 2. SETTLING TANK MASS BALANCE ───────────────────────
    // dV/dt = inflow - outflow
    const inflow = s.intakeFlowRate * dtHour; // m³ added this tick
    const outflow = s.distributionFlowRate * dtHour; // m³ removed this tick
    const dV = inflow - outflow;

    s.settlingTankVolume = Math.max(0, Math.min(P.tankCapacity, s.settlingTankVolume + dV));
    s.settlingTankLevel = (s.settlingTankVolume / P.tankCapacity) * 100;

    // ─── 3. CHEMICAL DOSING → CHLORINE INJECTION ─────────────
    // Injection rate is proportional to valve position
    s.chlorineInjectionRate = (s.dosingValvePosition / 100) * P.maxChlorineInjection;

    // ─── 4. CHLORINE CONCENTRATION (mass balance in mixing zone) ─
    // C_new = (C_old * V + injection * dt - decay * C_old * V * dt) / V
    // Simplified: dC/dt = (injection_rate / flow_rate) - (decay * C)
    //
    // At steady state with nominal values:
    //   injection_rate = 5.9 kg/h
    //   flow_rate = 300 m³/h
    //   C_ss = injection / flow = 5.9 / (300 * decay_factor) ≈ 2.95 ppm
    const decay = P.chlorineDecayRate * s.chlorineConcentration * dtMin;
    let concentrationDelta: number;

    if (s.intakeFlowRate < 1.0) {
      // Stagnant condition: no dilution flow, slow decay or local accumulation
      const stagnantVolume = Math.max(10, (s.settlingTankVolume || 200) * 0.1);
      const accumulation = ((s.chlorineInjectionRate * 1000) / stagnantVolume) * (dt / 3600);
      concentrationDelta = accumulation - decay;
    } else {
      const injectedConcentration = (s.chlorineInjectionRate * 1000) / s.intakeFlowRate; // mg/L
      const mixingRate = 0.05; // 1/s — how fast concentration equilibrates
      concentrationDelta =
        (injectedConcentration - s.chlorineConcentration) * mixingRate * dt - decay;
    }
    s.chlorineConcentration = Math.max(0, s.chlorineConcentration + concentrationDelta);

    // ─── 5. CONTACT TANK RESIDUAL ────────────────────────────
    // After contact time, chlorine decays further
    const contactDecay = 1 - P.chlorineDecayRate * P.contactTime * 0.1;
    s.contactTankResidual = s.chlorineConcentration * Math.max(0.5, contactDecay);

    // ─── 6. DISTRIBUTION PUMP → FLOW & PRESSURE ─────────────
    s.distributionFlowRate = (s.distributionPumpSpeed / 100) * P.distMaxFlow;

    // Pressure depends on pump speed and flow (simplified pump curve)
    // Higher flow → lower pressure (resistance)
    const flowFraction = s.distributionFlowRate / P.distMaxFlow;
    const speedFraction = s.distributionPumpSpeed / 100;
    s.distributionPressure = P.distMaxPressure * speedFraction * (1 - 0.3 * flowFraction);
    s.distributionPressure = Math.max(0, s.distributionPressure);

    // ─── 7. TEMPERATURE (slow ambient drift) ─────────────────
    // Temperature is nearly constant — drifts very slowly
    // Kept for sensor completeness, not a control variable
    // No causal driver — it's environmental

    // ─── 8. pH (affected by chlorine dosing) ─────────────────
    // Chlorination slightly lowers pH
    const chlorineEffect = (s.chlorineConcentration - P.chlorineNominal) * -0.02;
    s.pH = P.nominalPH + chlorineEffect;
    s.pH = Math.max(5.0, Math.min(9.5, s.pH));

    return { ...s };
  }

  /**
   * Get current process state (immutable copy).
   */
  public getState(): WaterTreatmentState {
    return { ...this.state };
  }

  /**
   * Directly set a process variable (for PLC → actuator → process chain).
   */
  public setVariable<K extends keyof WaterTreatmentState>(
    key: K,
    value: WaterTreatmentState[K],
  ): void {
    this.state[key] = value;
  }

  /**
   * Get a single variable's current value.
   */
  public getVariable<K extends keyof WaterTreatmentState>(key: K): WaterTreatmentState[K] {
    return this.state[key];
  }

  /**
   * Check safety conditions. Returns list of active alarms.
   */
  public checkAlarms(): ProcessAlarm[] {
    const P = WATER_PROCESS_PARAMS;
    const s = this.state;
    const alarms: ProcessAlarm[] = [];

    if (s.chlorineConcentration > P.chlorineDangerHigh) {
      alarms.push({
        id: "CHLORINE_HIGH_DANGER",
        severity: "CRITICAL",
        message: `Chlorine concentration ${s.chlorineConcentration.toFixed(1)} mg/L exceeds danger threshold (${P.chlorineDangerHigh} mg/L)`,
        variable: "chlorineConcentration",
        value: s.chlorineConcentration,
        threshold: P.chlorineDangerHigh,
      });
    } else if (s.chlorineConcentration > P.chlorineTasteThreshold) {
      alarms.push({
        id: "CHLORINE_HIGH_WARN",
        severity: "WARNING",
        message: `Chlorine concentration ${s.chlorineConcentration.toFixed(1)} mg/L exceeds taste threshold (${P.chlorineTasteThreshold} mg/L)`,
        variable: "chlorineConcentration",
        value: s.chlorineConcentration,
        threshold: P.chlorineTasteThreshold,
      });
    } else if (s.chlorineConcentration < P.chlorineMin) {
      alarms.push({
        id: "CHLORINE_LOW",
        severity: "WARNING",
        message: `Chlorine concentration ${s.chlorineConcentration.toFixed(2)} mg/L below minimum (${P.chlorineMin} mg/L) — disinfection failure`,
        variable: "chlorineConcentration",
        value: s.chlorineConcentration,
        threshold: P.chlorineMin,
      });
    }

    if (s.chlorineConcentration >= P.sisChlorineTrip) {
      alarms.push({
        id: "SIS_CHLORINE_TRIP",
        severity: "SIS_TRIP",
        message: `SIS TRIP: Chlorine ${s.chlorineConcentration.toFixed(1)} mg/L hit SIS trip point (${P.sisChlorineTrip} mg/L)`,
        variable: "chlorineConcentration",
        value: s.chlorineConcentration,
        threshold: P.sisChlorineTrip,
      });
    }

    if (s.settlingTankLevel > P.sisLevelTrip) {
      alarms.push({
        id: "SIS_LEVEL_TRIP",
        severity: "SIS_TRIP",
        message: `SIS TRIP: Tank level ${s.settlingTankLevel.toFixed(1)}% hit SIS trip point (${P.sisLevelTrip}%)`,
        variable: "settlingTankLevel",
        value: s.settlingTankLevel,
        threshold: P.sisLevelTrip,
      });
    }

    if (s.settlingTankLevel > P.tankOverflowLevel) {
      alarms.push({
        id: "TANK_OVERFLOW",
        severity: "WARNING",
        message: `Tank level ${s.settlingTankLevel.toFixed(1)}% approaching overflow (${P.tankOverflowLevel}%)`,
        variable: "settlingTankLevel",
        value: s.settlingTankLevel,
        threshold: P.tankOverflowLevel,
      });
    }

    if (s.settlingTankLevel < P.tankLowLevel) {
      alarms.push({
        id: "TANK_LOW",
        severity: "WARNING",
        message: `Tank level ${s.settlingTankLevel.toFixed(1)}% below low alarm (${P.tankLowLevel}%)`,
        variable: "settlingTankLevel",
        value: s.settlingTankLevel,
        threshold: P.tankLowLevel,
      });
    }

    if (s.distributionPressure > P.sisPressureTrip) {
      alarms.push({
        id: "SIS_PRESSURE_TRIP",
        severity: "SIS_TRIP",
        message: `SIS TRIP: Distribution pressure ${s.distributionPressure.toFixed(1)} bar hit SIS trip (${P.sisPressureTrip} bar)`,
        variable: "distributionPressure",
        value: s.distributionPressure,
        threshold: P.sisPressureTrip,
      });
    }

    return alarms;
  }

  private tripped: boolean = false;

  public emergencyTrip(): void {
    this.tripped = true;
    this.state.dosingValvePosition = 0;
    this.state.chlorineInjectionRate = 0;
    this.state.intakePumpSpeed = 0;
  }

  public isTripped(): boolean {
    return this.tripped;
  }

  public resetTrip(): void {
    this.tripped = false;
  }

  /**
   * Snapshot / restore for reproducibility.
   */
  public snapshot(): WaterTreatmentState {
    return { ...this.state };
  }

  public restore(snap: WaterTreatmentState): void {
    this.state = { ...snap };
  }
}

// ─── Alarm Types ─────────────────────────────────────────────────

export interface ProcessAlarm {
  id: string;
  severity: "WARNING" | "CRITICAL" | "SIS_TRIP";
  message: string;
  variable: string;
  value: number;
  threshold: number;
}
