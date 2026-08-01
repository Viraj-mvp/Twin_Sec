import { SectorId } from "./scenarios";

export type SimPhase = "RECON" | "EXPLOIT" | "DEFEND" | "REVIEW";

export const TERMINAL_TEMPLATES: Record<
  SimPhase,
  Partial<Record<SectorId, Record<string, string>>>
> = {
  RECON: {
    power: {
      default: `[DEFANGED - TRAINING ONLY]
POWER > nmap -p502,20000,102 --script modbus-discover 203.0.113.0/24
Starting Nmap scan...
Nmap scan report for 203.0.113.10 (NODE-EWS-04)
PORT      STATE SERVICE
502/tcp   open  modbus
20000/tcp open  dnp3
[DEFENDER NOTE] T0846: Detect via unusual Modbus polling frequency and scans from non-engineering subnets`,
      "ews-04": `[DEFANGED - TRAINING ONLY]
POWER > dnp3-enum --target NODE-EWS-04 --interface eth0
// illustrative — NOT runnable — defanged for training
[+] DNP3 Master detected: NODE-EWS-04 (203.0.113.10:20000)
[+] 14 outstation endpoints discovered
[+] T0842: Network Connection Enumeration
[DEFENDER NOTE] Deploy industrial IDS signature for DNP3 enumeration requests`,
    },
    water: {
      default: `[DEFANGED - TRAINING ONLY]
WATER > modbus-scan --range 203.0.113.0/24 --ports 502
// illustrative — NOT runnable — defanged for training
[+] NODE-PLC-007 (203.0.113.15:502) — Siemens S7-400 — Holding Registers: 64
[+] NODE-SCADA-001 (203.0.113.10:502) — Modbus Master — 32 coils
[MITRE] T0846: Remote System Discovery
[DEFENDER NOTE] Alert on Modbus function code 43 (read device identification) from unknown source`,
      "plc-3": `[DEFANGED - TRAINING ONLY]
WATER > plc-probe --target 203.0.113.12 --protocol s7
[+] S7-1500 Controller detected at Basin-3 Dosing station
[+] Firmware: v2.8.3 (known rung checksum variance vulnerability)
[DEFENDER NOTE] Check PLC hardware key switch position (RUN vs REM)`,
    },
    "oil-gas": {
      default: `[DEFANGED - TRAINING ONLY]
OIL-GAS > opc-browse --endpoint opc.tcp://203.0.113.40:4840
[+] Connected to OPC UA Server (Refinery DCS)
[+] Unencrypted security policy: None / None enabled
[+] Identified 1,420 tags including Compressor_Discharge_Psi`,
    },
    manufacturing: {
      default: `[DEFANGED - TRAINING ONLY]
MANUFACTURING > ethernetip-scan --target 203.0.113.80
[+] CIP ENET device identified: Rockwell Automation 1756-L83E
[+] Assembly line 4 conveyor velocity tag mapped`,
    },
    port: {
      default: `[DEFANGED - TRAINING ONLY]
PORT > tos-enum --terminal-ip 203.0.113.90
[+] NAVIS N4 TOS API endpoint exposed over HTTP (Port 8080)
[+] Container routing tables & STS crane dispatch queue visible`,
    },
    "smart-building": {
      default: `[DEFANGED - TRAINING ONLY]
BUILDING > bacnet-discover --subnet 203.0.113.0/24
[+] BACnet/IP devices found: Chiller Plant Controller, VAV Box 14-B
[+] Device ID 4102 reporting nominal temperature 21.5°C`,
    },
    "smart-city": {
      default: `[DEFANGED - TRAINING ONLY]
CITY > mqtt-sub --host 203.0.113.110 --topic "city/traffic/#"
[+] Traffic Signal Controller array broadcasting unauthenticated state updates
[+] Intersections 14 through 28 listening on port 1883`,
    },
  },
  EXPLOIT: {
    power: {
      default: `[DEFANGED - TRAINING ONLY]
POWER > modbus-write --target 203.0.113.10 --register 40001 --value 0x00FF
// illustrative — NOT runnable — defanged for training
[+] Write holding register command sent to 203.0.113.10
[+] Trip threshold override requested
[DEFENDER NOTE] Mitigate via hardware safety interlock bypass monitoring`,
    },
    water: {
      default: `[DEFANGED - TRAINING ONLY]
WATER > dose-walk --target 203.0.113.12 --setpoint 7.1
// illustrative — NOT runnable — defanged for training
[+] Chlorine injector walked to 7.1 ppm in +0.2 ppm increments
[+] SCADA trend replay active — UI showing 1.2 ppm nominal`,
    },
  },
  DEFEND: {
    power: {
      default: `[DEFANGED - TRAINING ONLY]
POWER > isolate-subnet --vlan 100 --target NODE-PLC-3
[+] AIRGAP COMMAND ISSUED: VLAN 100 isolated at SW-A switch port 14
[+] Breaker 33-B control loop preserved`,
    },
  },
  REVIEW: {
    power: {
      default: `[DEFANGED - TRAINING ONLY]
POWER > audit-log --session-id latest
[+] Incident post-mortem summary generated. 0 physical cascades reached feeder level.`,
    },
  },
};
