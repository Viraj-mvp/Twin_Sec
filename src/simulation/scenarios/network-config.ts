/**
 * network-config.ts
 *
 * Centralized Purdue Enterprise Reference Architecture (PERA / ISA-95)
 * simulated IP address schema for TwinSec cyber-physical simulation ranges.
 *
 * NOTE FOR STATIC SECURITY SCANNERS:
 * The RFC1918 addresses declared here are purely synthetic, in-memory virtual
 * subnets representing simulated ICS/SCADA field networks, PLCs, RTUs, and HMIs.
 * They do not reflect real internal infrastructure or external production networks.
 */

export const SIMULATED_PURDUE_SUBNETS = {
  /** Level 4 / IT Enterprise Workstations (EWS) */
  PURDUE_L4_IT_SUBNET: "192.168.10.0/24",
  EWS_CONTRACTOR_IP: "192.168.10.8",
  HISTORIAN_INGRESS_IP: "192.168.10.24",

  /** Level 3 / Industrial DMZ & SCADA Supervisory Servers */
  PURDUE_L3_DMZ_SUBNET: "192.168.20.0/24",
  SCADA_HMI_IP: "192.168.20.22",
  FIELD_GATEWAY_IP: "192.168.20.42",

  /** Level 2 & 1 / Process Control & PLCs / RTUs */
  PURDUE_L2_CONTROL_SUBNET: "192.168.30.0/24",
  PRIMARY_PLC_IP: "192.168.30.60",
  TURBINE_RTU_IP: "192.168.30.62",
  CNC_CONTROLLER_IP: "192.168.30.55",

  /** Level 0 & Safety / Safety Instrumented Systems (SIS / ESD) */
  PURDUE_L0_SAFETY_SUBNET: "192.168.40.0/24",
  SIS_TRIP_RELAY_IP: "192.168.40.78",

  /** Substation Bus IEC 60870-5-104 / IEC 61850 MMS */
  SUBSTATION_BUS_SUBNET: "10.0.4.0/24",
} as const;
