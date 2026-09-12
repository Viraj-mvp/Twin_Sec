import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { SectorId } from "@/lib/auth-store";
import {
  Zap,
  Radio,
  Boxes,
  Building,
  Anchor,
  Cpu,
  Flame,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Activity,
} from "lucide-react";

export interface SubnetNode {
  id: string;
  name: string;
  code: string;
  sector: string;
  protocol: string;
  telemetryMetric: string;
  telemetryValue: string;
  threatLevel: "NORMAL" | "WATCH" | "ELEVATED";
  activeAdversary: string;
  simSector: SectorId;
}

const SUBNETS: SubnetNode[] = [
  {
    id: "power",
    name: "Substation-07",
    code: "GRID-SUB-07",
    sector: "Power Grid",
    protocol: "IEC 61850 / DNP3",
    telemetryMetric: "GRID FREQUENCY",
    telemetryValue: "60.02 Hz",
    threatLevel: "NORMAL",
    activeAdversary: "Industroyer2 Emulation",
    simSector: "power",
  },
  {
    id: "water",
    name: "Basin Treatment-3",
    code: "H2O-PUMP-03",
    sector: "Water Treatment",
    protocol: "Modbus/TCP",
    telemetryMetric: "PUMP PRESSURE",
    telemetryValue: "4.8 bar",
    threatLevel: "WATCH",
    activeAdversary: "Maroochy Replay Injection",
    simSector: "water",
  },
  {
    id: "oil-gas",
    name: "Seventh Breath Depot",
    code: "GAS-DEPOT-07",
    sector: "Oil & Gas",
    protocol: "TriStation / Triconex",
    telemetryMetric: "VALVE PRESSURE",
    telemetryValue: "104 PSI",
    threatLevel: "NORMAL",
    activeAdversary: "TRITON / HatMan SIS Overload",
    simSector: "oil-gas",
  },
  {
    id: "manufacturing",
    name: "Depot-4 Assembly",
    code: "ROBOT-CELL-04",
    sector: "Manufacturing",
    protocol: "Siemens S7comm",
    telemetryMetric: "ARM TORQUE",
    telemetryValue: "98.4 Nm",
    threatLevel: "NORMAL",
    activeAdversary: "Stuxnet Firmware Tamper",
    simSector: "manufacturing",
  },
  {
    id: "port",
    name: "Crane Array-14",
    code: "PORT-CRANE-14",
    sector: "Maritime Port",
    protocol: "NMEA 0183 / CAN bus",
    telemetryMetric: "HOIST LOAD",
    telemetryValue: "42.1 Tons",
    threatLevel: "WATCH",
    activeAdversary: "GPS Spoofing & Actuator Drift",
    simSector: "port",
  },
  {
    id: "smart-building",
    name: "HVAC Core-B",
    code: "HVAC-BLDG-B",
    sector: "Smart Building",
    protocol: "BACnet / IP",
    telemetryMetric: "CHILLER TEMP",
    telemetryValue: "6.2 °C",
    threatLevel: "NORMAL",
    activeAdversary: "Target Corporate HVAC Pivot",
    simSector: "smart-building",
  },
  {
    id: "smart-city",
    name: "Feeder Loop-9",
    code: "CITY-FEED-09",
    sector: "Smart City",
    protocol: "LoRaWAN / DALI",
    telemetryMetric: "TRAFFIC LATENCY",
    telemetryValue: "18 ms",
    threatLevel: "NORMAL",
    activeAdversary: "Municipal Grid Hijack",
    simSector: "smart-city",
  },
];

export function SubnetThreatMatrixDeck() {
  const [selectedSubnet, setSelectedSubnet] = useState<SubnetNode>(SUBNETS[0]);

  return (
    <div className="rounded-none border-2 border-rule bg-[#18181B] text-foreground shadow-[6px_6px_0px_0px_#000000] p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-rule pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 bg-accent animate-pulse-dot" />
            <h2 className="font-mono text-base font-black uppercase tracking-wider text-foreground">
              OT SUBNET THREAT MATRIX & PHYSICAL TELEMETRY
            </h2>
          </div>
          <p className="font-serif italic text-sm text-foreground/80 mt-1">
            Real-time cyber-physical link across 7 industrial range facilities
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 border-2 border-accent bg-black text-accent font-bold uppercase shadow-[2px_2px_0px_#000000]">
            7/7 NODES SYNCED
          </span>
        </div>
      </div>

      {/* Subnet Matrix Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {SUBNETS.map((sub) => {
          const isSelected = selectedSubnet.id === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setSelectedSubnet(sub)}
              className={`p-4 border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                isSelected
                  ? "border-black bg-accent text-accent-foreground shadow-[4px_4px_0px_#000000] -translate-y-1"
                  : "border-rule bg-black text-foreground shadow-[3px_3px_0px_#000000] hover:border-accent/80 hover:-translate-y-0.5"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-[10px] font-black uppercase ${isSelected ? "text-black/80" : "text-foreground/60"}`}
                  >
                    {sub.code}
                  </span>
                  <span
                    className={`size-2 rounded-full ${
                      sub.threatLevel === "WATCH"
                        ? "bg-red-500 animate-ping"
                        : isSelected
                          ? "bg-black"
                          : "bg-accent"
                    }`}
                  />
                </div>
                <h3 className="display text-xl sm:text-2xl mt-1 tracking-tight truncate leading-none">
                  {sub.name}
                </h3>
              </div>

              <div className="mt-4 pt-2 border-t border-rule/50 flex items-end justify-between">
                <div>
                  <span
                    className={`font-mono text-[8px] font-bold uppercase block ${isSelected ? "text-black/70" : "text-foreground/50"}`}
                  >
                    {sub.telemetryMetric}
                  </span>
                  <span
                    className={`font-mono text-xs font-black tabular-nums ${isSelected ? "text-black" : "text-accent"}`}
                  >
                    {sub.telemetryValue}
                  </span>
                </div>
                <span
                  className={`font-mono text-[9px] font-black underline ${isSelected ? "text-black" : "text-foreground/80"}`}
                >
                  {isSelected ? "ACTIVE" : "VIEW"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Subnet Focus Deck */}
      <div className="border-2 border-rule bg-black p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[4px_4px_0px_#000000]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#18181B] text-foreground font-mono text-[10px] font-black uppercase border border-rule">
              SUBNET FOCUS: {selectedSubnet.name}
            </span>
            <span className="px-2.5 py-0.5 bg-accent text-accent-foreground font-mono text-[10px] font-black uppercase border border-black">
              {selectedSubnet.protocol}
            </span>
          </div>
          <p className="font-mono text-xs text-foreground/90 pt-1">
            Active Threat Vector:{" "}
            <strong className="text-foreground">{selectedSubnet.activeAdversary}</strong> ·
            Real-Time Telemetry:{" "}
            <strong className="text-accent font-black">{selectedSubnet.telemetryValue}</strong>
          </p>
        </div>

        <Link
          to="/simulation"
          search={{ sector: selectedSubnet.simSector }}
          className="h-11 px-6 bg-accent text-accent-foreground border-2 border-black font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000000] hover:bg-lime-300 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Activity className="size-4 stroke-[2.5]" />
          <span>LAUNCH {selectedSubnet.name.toUpperCase()} DRILL</span>
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
