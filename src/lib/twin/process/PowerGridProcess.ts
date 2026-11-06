/**
 * PowerGridProcess.ts
 *
 * Causal first-principles dynamic model of a synchronous generation & distribution yard.
 * Governed by the classical generator swing equation and electromechanical thermodynamics:
 *
 *   2H * (df/dt) = (P_mech - P_elec) / S_rated * f_0 - D * (f - f_0)
 *   dT_bearing/dt = (Q_friction * (f/f_0)^2 - (T_bearing - T_ambient)) / tau_thermal
 *   dP_oil/dt = (P_nominal * (f/f_0) - P_oil) / tau_hydraulic
 *
 * Parameters calibrated to a combined-cycle 720 MVA turbine unit with 14 MW auxiliary load bank:
 *   - Nominal Frequency: 50.0 Hz
 *   - Inertia Constant H: 4.2 s
 *   - Damping Coefficient D: 1.5
 *   - Bearing Temperature: Nominal 62.0 °C; Alarm > 95.0 °C
 *   - Feeder Hydraulic Head / Oil Pressure: Nominal 8.2 bar; Alarm < 7.0 bar
 */

export interface PowerGridState {
  frequencyHz: number; // Rotor / Grid Frequency (Nominal 50.0 Hz)
  mechanicalPowerMw: number; // Turbine mechanical power input
  electricalLoadMw: number; // Grid demand + auxiliary load bank
  bearingTemperatureC: number; // Turbine shaft bearing temperature (°C)
  feederPressureBar: number; // Transformer coolant & feeder head pressure (bar)
  governorSetpointHz: number; // PLC governor target setpoint
  breakerClosed: boolean; // Breaker BRK-33B physical latch state
  isResonanceBand: boolean; // Frequency entered destructive mechanical vibration band (>52.5 Hz)
  isBreakerTripped: boolean; // Overcurrent / differential protection trip flag
}

export const POWER_PROCESS_PARAMS = {
  f0: 50.0, // Grid nominal frequency (Hz)
  sRatedMw: 720.0, // Rated generator apparent capacity (MW)
  inertiaH: 4.2, // Inertia constant (seconds)
  dampingD: 1.5, // Damping coefficient (MW/Hz)
  ambientTemp: 28.0, // Ambient baseline (°C)
  nominalBearingTemp: 62.0, // Steady-state thermal equilibrium (°C)
  thermalTauSec: 85.0, // Thermal time constant (seconds)
  nominalOilPressure: 8.2, // Hydraulic coolant pressure (bar)
  hydraulicTauSec: 12.0, // Hydraulic response time constant (seconds)
  alarmFreqHigh: 52.5, // High frequency trip threshold (Hz)
  alarmFreqLow: 47.5, // Low frequency under-speed threshold (Hz)
  alarmTempHigh: 95.0, // Bearing catastrophic resonance thermal limit (°C)
  alarmPressureLow: 7.0, // Oil cavitation pressure threshold (bar)
  auxLoadBankMw: 14.0, // Critical Sector-9 breaker load (MW)
} as const;

export class PowerGridProcess {
  private state: PowerGridState;

  constructor() {
    this.state = this.createNominalState();
  }

  public createNominalState(): PowerGridState {
    const P = POWER_PROCESS_PARAMS;
    return {
      frequencyHz: P.f0,
      mechanicalPowerMw: P.auxLoadBankMw,
      electricalLoadMw: P.auxLoadBankMw,
      bearingTemperatureC: P.nominalBearingTemp,
      feederPressureBar: P.nominalOilPressure,
      governorSetpointHz: P.f0,
      breakerClosed: true,
      isResonanceBand: false,
      isBreakerTripped: false,
    };
  }

  public getState(): Readonly<PowerGridState> {
    return { ...this.state };
  }

  /**
   * Advance synchronous generator dynamics by dt seconds.
   */
  public tick(
    dt: number,
    inputs?: {
      governorSetpointHz?: number;
      breakerTrip?: boolean;
      manualLoadShedMw?: number;
    },
  ): PowerGridState {
    const P = POWER_PROCESS_PARAMS;
    const s = this.state;

    // 1. Process Operator / Adversary Controller Inputs
    if (inputs?.governorSetpointHz !== undefined) {
      s.governorSetpointHz = Math.max(40.0, Math.min(65.0, inputs.governorSetpointHz));
    }

    if (inputs?.breakerTrip) {
      s.breakerClosed = false;
      s.isBreakerTripped = true;
    }

    // 2. Turbine Governor Power Dynamic Response
    // Turbine valve responds with time constant to drive frequency toward governor setpoint
    const governorError = s.governorSetpointHz - s.frequencyHz;
    const valveGain = 2.8; // MW per Hz delta
    s.mechanicalPowerMw = Math.max(0, s.mechanicalPowerMw + governorError * valveGain * (dt / 2.0));

    // 3. Electrical Load Calculation
    let effectiveLoad = s.breakerClosed ? P.auxLoadBankMw : 0;
    if (inputs?.manualLoadShedMw !== undefined) {
      effectiveLoad = Math.max(0, effectiveLoad - inputs.manualLoadShedMw);
    }
    s.electricalLoadMw = effectiveLoad;

    // 4. Classical Swing Equation Integration (Euler Step)
    // 2H * df/dt = (P_mech - P_elec) / S_rated * f0 - D * (f - f0)
    const powerMismatch = (s.mechanicalPowerMw - s.electricalLoadMw) / P.sRatedMw;
    const dampingRetardation = P.dampingD * (s.frequencyHz - P.f0);
    const dfDt = (powerMismatch * P.f0 - dampingRetardation) / (2 * P.inertiaH);

    s.frequencyHz += dfDt * dt;
    s.frequencyHz = Math.max(35.0, Math.min(65.0, s.frequencyHz));

    // 5. Bearing Thermodynamic Temperature Model
    // Losses scale with (f / f0)^2; heat dissipation follows Newton's cooling law
    const speedRatio = s.frequencyHz / P.f0;
    const frictionHeatRise = (P.nominalBearingTemp - P.ambientTemp) * speedRatio ** 2;
    const targetTemp = P.ambientTemp + frictionHeatRise;
    const dTempDt = (targetTemp - s.bearingTemperatureC) / P.thermalTauSec;

    s.bearingTemperatureC += dTempDt * dt;
    s.bearingTemperatureC = Math.max(P.ambientTemp, s.bearingTemperatureC);

    // 6. Feeder Hydraulic / Oil Pressure Model
    // Dynamic head pressure is proportional to pump shaft rotation; drops sharply if breaker latches
    const targetPressure = s.breakerClosed
      ? P.nominalOilPressure * speedRatio
      : P.alarmPressureLow - 0.4;
    const dPressDt = (targetPressure - s.feederPressureBar) / P.hydraulicTauSec;

    s.feederPressureBar += dPressDt * dt;
    s.feederPressureBar = Math.max(0.5, s.feederPressureBar);

    // 7. Physical Safety Envelopes & Protection Trips
    s.isResonanceBand =
      s.frequencyHz >= P.alarmFreqHigh || s.bearingTemperatureC >= P.alarmTempHigh;

    // Automatic hardware protection trip if resonance exceeded for sustained duration
    if (s.frequencyHz >= 53.2 && s.breakerClosed) {
      s.breakerClosed = false;
      s.isBreakerTripped = true;
    }

    return { ...s };
  }

  public isTripped(): boolean {
    return this.state.isBreakerTripped;
  }

  public emergencyTrip(): void {
    this.state.breakerClosed = false;
    this.state.isBreakerTripped = true;
    this.state.mechanicalPowerMw = 0;
  }

  public resetTrip(): void {
    this.state.isBreakerTripped = false;
    this.state.breakerClosed = true;
    this.state.governorSetpointHz = POWER_PROCESS_PARAMS.f0;
  }

  public snapshot(): PowerGridState {
    return { ...this.state };
  }

  public restore(snap: PowerGridState): void {
    this.state = { ...snap };
  }
}
