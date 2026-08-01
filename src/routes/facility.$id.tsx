import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import facility from "@/assets/facility.jpg";
import schematic from "@/assets/schematic.jpg";
import breaker from "@/assets/breaker.jpg";
import { FACILITIES, FACILITY_IMAGES, type FacilityId } from "./twin-engine";
import { EXERCISES } from "@/data/scenarios";
import { useGsapReveal } from "@/hooks/use-gsap-reveal";

const EXERCISES_LABEL: Partial<Record<FacilityId, string>> = Object.fromEntries(
  Object.entries(EXERCISES).map(([k, v]: [string, { code: string }]) => [k, v.code]),
) as Partial<Record<FacilityId, string>>;

type Asset = {
  id: string;
  label: string;
  kind: string;
  x: number;
  y: number;
  state: "NOMINAL" | "DRIFT" | "COMPROMISED";
  affects: string[];
};

type World = {
  hero: string;
  byline: string;
  manifesto: string[];
  flowLabel: string;
  flowUnit: string;
  flowValue: number;
  assets: Asset[];
  edges: [string, string][];
  scenarios: { id: string; name: string; severity: string; desc: string; consequence: string }[];
  artifacts: { k: string; v: string }[];
};

const WORLDS: Partial<Record<FacilityId, World>> = {
  power: {
    hero: "POWER FLOWS.",
    byline: "Generation · Transformation · Distribution",
    manifesto: [
      "A 1.4 GW combined-cycle plant. Two generators. Four transformers. Eight feeders.",
      "Energy is not abstract here. It is rotation, voltage, current, and the slow burn of insulation.",
      "Watch a single misconfigured relay isolate a city block. Then a sector. Then a hospital wing.",
    ],
    flowLabel: "GRID DEMAND",
    flowUnit: "MW",
    flowValue: 1184,
    assets: [
      {
        id: "g1",
        label: "GEN-01",
        kind: "Steam Turbine 720MW",
        x: 8,
        y: 50,
        state: "NOMINAL",
        affects: ["Bus A", "Sector 9"],
      },
      {
        id: "g2",
        label: "GEN-02",
        kind: "Gas Turbine 480MW",
        x: 8,
        y: 20,
        state: "NOMINAL",
        affects: ["Bus A", "Sector 11"],
      },
      {
        id: "tx1",
        label: "TX-Δ",
        kind: "Step-Up Transformer 800MVA",
        x: 32,
        y: 35,
        state: "DRIFT",
        affects: ["Yard-A", "Feeders 1–4"],
      },
      {
        id: "sub1",
        label: "SUB-9",
        kind: "Substation 230kV",
        x: 55,
        y: 30,
        state: "NOMINAL",
        affects: ["Sector 9", "Hospital ring"],
      },
      {
        id: "sub2",
        label: "SUB-11",
        kind: "Substation 138kV",
        x: 55,
        y: 70,
        state: "NOMINAL",
        affects: ["Sector 11", "Light rail"],
      },
      {
        id: "r33",
        label: "RLY-33B",
        kind: "Protection Relay",
        x: 75,
        y: 30,
        state: "COMPROMISED",
        affects: ["Breaker 33-B", "14 MW load"],
      },
      {
        id: "load1",
        label: "LOAD-A",
        kind: "14MW Load Bank",
        x: 92,
        y: 30,
        state: "NOMINAL",
        affects: ["Sector-9 grid"],
      },
      {
        id: "load2",
        label: "LOAD-B",
        kind: "8MW Industrial",
        x: 92,
        y: 70,
        state: "NOMINAL",
        affects: ["Pump House 3"],
      },
    ],
    edges: [
      ["g1", "tx1"],
      ["g2", "tx1"],
      ["tx1", "sub1"],
      ["tx1", "sub2"],
      ["sub1", "r33"],
      ["r33", "load1"],
      ["sub2", "load2"],
    ],
    scenarios: [
      {
        id: "S-01",
        name: "Relay Misconfiguration",
        severity: "CRITICAL",
        desc: "Adversary alters Relay 33-B's overcurrent threshold by 4%.",
        consequence: "Sector 9 blackout within 12 minutes of next demand spike.",
      },
      {
        id: "S-02",
        name: "Transformer Manipulation",
        severity: "HIGH",
        desc: "Tap-changer setpoint walked while temperature alarms suppressed.",
        consequence: "TX-Δ enters thermal runaway. 800MVA derated to 320.",
      },
      {
        id: "S-03",
        name: "Substation Compromise",
        severity: "CRITICAL",
        desc: "SUB-9 HMI session hijacked. Breakers cycled.",
        consequence: "Cascading isolation. Hospital ring drops 90s before generators.",
      },
      {
        id: "S-04",
        name: "Black Start Failure",
        severity: "HIGH",
        desc: "Restoration playbook altered. Frequency targets shifted.",
        consequence: "Recovery time doubles. Operator confusion compounds.",
      },
    ],
    artifacts: [
      { k: "BUSES", v: "47" },
      { k: "RELAYS", v: "118" },
      { k: "FEEDERS", v: "32" },
      { k: "VOLTAGE", v: "230/138/13.8 kV" },
    ],
  },
  water: {
    hero: "WATER MOVES.",
    byline: "Intake · Treatment · Distribution",
    manifesto: [
      "Raw water enters at the basin. Chlorine doses to within ±0.02 mg/L. Tank Δ holds twelve hours of buffer.",
      "Every valve, every pump, every PLC is a control surface. So is every setpoint.",
      "An adversary doesn't need to break the plant. They only need to make the sensors lie.",
    ],
    flowLabel: "THROUGHPUT",
    flowUnit: "ML/D",
    flowValue: 412,
    assets: [
      {
        id: "intake",
        label: "INTK-1",
        kind: "Raw-Water Intake",
        x: 6,
        y: 50,
        state: "NOMINAL",
        affects: ["Pump P-01"],
      },
      {
        id: "p1",
        label: "P-01",
        kind: "Centrifugal Pump 4MW",
        x: 22,
        y: 30,
        state: "NOMINAL",
        affects: ["Filter F-A"],
      },
      {
        id: "p2",
        label: "P-02",
        kind: "Centrifugal Pump 4MW",
        x: 22,
        y: 70,
        state: "DRIFT",
        affects: ["Filter F-B"],
      },
      {
        id: "f1",
        label: "F-A",
        kind: "Sand Filtration",
        x: 42,
        y: 30,
        state: "NOMINAL",
        affects: ["Dosing D-1"],
      },
      {
        id: "f2",
        label: "F-B",
        kind: "Sand Filtration",
        x: 42,
        y: 70,
        state: "NOMINAL",
        affects: ["Dosing D-2"],
      },
      {
        id: "d1",
        label: "D-1",
        kind: "Chemical Dosing",
        x: 62,
        y: 30,
        state: "COMPROMISED",
        affects: ["Tank Δ", "Distribution"],
      },
      {
        id: "tank",
        label: "TANK-Δ",
        kind: "Storage Reservoir 60ML",
        x: 80,
        y: 50,
        state: "NOMINAL",
        affects: ["Districts 4–9"],
      },
      {
        id: "scada",
        label: "SCADA-W",
        kind: "Wonderware Console",
        x: 50,
        y: 8,
        state: "NOMINAL",
        affects: ["All PLCs"],
      },
    ],
    edges: [
      ["intake", "p1"],
      ["intake", "p2"],
      ["p1", "f1"],
      ["p2", "f2"],
      ["f1", "d1"],
      ["f2", "d1"],
      ["d1", "tank"],
      ["scada", "p1"],
      ["scada", "p2"],
      ["scada", "d1"],
    ],
    scenarios: [
      {
        id: "S-01",
        name: "Chemical Overdose",
        severity: "CRITICAL",
        desc: "Dosing setpoint silently raised 6x.",
        consequence: "Free chlorine spikes. 2.1M residents at risk.",
      },
      {
        id: "S-02",
        name: "Sensor Spoofing",
        severity: "HIGH",
        desc: "Turbidity readings clamped to nominal.",
        consequence: "Operators dose to a false ground truth.",
      },
      {
        id: "S-03",
        name: "Pump Manipulation",
        severity: "HIGH",
        desc: "P-02 commanded to cavitation regime.",
        consequence: "Bearing failure in 14 hours. Throughput halved.",
      },
      {
        id: "S-04",
        name: "PLC Logic Tampering",
        severity: "CRITICAL",
        desc: "Failsafe interlocks NOP'd in firmware.",
        consequence: "Tank overflows without alarm.",
      },
    ],
    artifacts: [
      { k: "PLCs", v: "62" },
      { k: "SENSORS", v: "1,108" },
      { k: "THROUGHPUT", v: "420 ML/D" },
      { k: "RESERVOIRS", v: "4" },
    ],
  },
  "oil-gas": {
    hero: "PRESSURE BREATHES.",
    byline: "Crude · Distillation · Distribution",
    manifesto: [
      "Twelve million barrels per day. Four atmospheric towers. One safety logic solver between order and fire.",
      "The refinery is a body. Pressure is breath. Temperature is pulse. Communication is reflex.",
      "An adversary who silences the reflex does not need to start a fire. The process does it for them.",
    ],
    flowLabel: "THROUGHPUT",
    flowUnit: "MBD",
    flowValue: 12.4,
    assets: [
      {
        id: "stor1",
        label: "TANK-7",
        kind: "Crude Storage 600kbbl",
        x: 6,
        y: 30,
        state: "NOMINAL",
        affects: ["Feed F-1"],
      },
      {
        id: "pipe1",
        label: "P-N12",
        kind: "32-inch Pipeline",
        x: 22,
        y: 30,
        state: "NOMINAL",
        affects: ["Compressor C-04"],
      },
      {
        id: "c1",
        label: "C-04",
        kind: "Reciprocating Compressor",
        x: 38,
        y: 30,
        state: "DRIFT",
        affects: ["Tower T-A"],
      },
      {
        id: "dist1",
        label: "T-A",
        kind: "Atmospheric Distillation",
        x: 55,
        y: 30,
        state: "NOMINAL",
        affects: ["Naphtha", "Diesel", "Bottoms"],
      },
      {
        id: "dist2",
        label: "T-B",
        kind: "Vacuum Distillation",
        x: 55,
        y: 70,
        state: "NOMINAL",
        affects: ["Gas oil", "Bottoms"],
      },
      {
        id: "sis",
        label: "SIS-Ω",
        kind: "Safety Logic Solver",
        x: 75,
        y: 50,
        state: "COMPROMISED",
        affects: ["All trip interlocks"],
      },
      {
        id: "psv1",
        label: "PSV-118",
        kind: "Pressure Safety Valve",
        x: 92,
        y: 30,
        state: "NOMINAL",
        affects: ["Tower T-A header"],
      },
      {
        id: "valve1",
        label: "V-44",
        kind: "Emergency Shutdown Valve",
        x: 92,
        y: 70,
        state: "NOMINAL",
        affects: ["Crude feed line"],
      },
    ],
    edges: [
      ["stor1", "pipe1"],
      ["pipe1", "c1"],
      ["c1", "dist1"],
      ["c1", "dist2"],
      ["dist1", "sis"],
      ["dist2", "sis"],
      ["sis", "psv1"],
      ["sis", "valve1"],
    ],
    scenarios: [
      {
        id: "S-01",
        name: "Pressure Manipulation",
        severity: "CRITICAL",
        desc: "C-04 discharge pressure walked +0.4 bar/min.",
        consequence: "Tower T-A exceeds design within 22 minutes.",
      },
      {
        id: "S-02",
        name: "Safety System Bypass",
        severity: "CRITICAL",
        desc: "SIS-Ω trip thresholds disarmed.",
        consequence: "No automated emergency stop.",
      },
      {
        id: "S-03",
        name: "Pipeline Disruption",
        severity: "HIGH",
        desc: "P-N12 valve cycled outside playbook.",
        consequence: "Hammer event. Pipeline integrity audit triggered.",
      },
      {
        id: "S-04",
        name: "Controller Override",
        severity: "HIGH",
        desc: "Distillation column setpoints shifted via engineering workstation.",
        consequence: "Product spec drift. Quality batch ruined.",
      },
    ],
    artifacts: [
      { k: "ASSETS", v: "8,720" },
      { k: "PSV", v: "1,940" },
      { k: "PIPE KM", v: "412" },
      { k: "OPERATORS", v: "240/shift" },
    ],
  },
  manufacturing: {
    hero: "THE LINE NEVER STOPS.",
    byline: "Robots · Conveyors · MES",
    manifesto: [
      "Thirty-four stations. Seventy-six robots. A vision system that rejects one defect every nine seconds.",
      "Adversaries do not need to break the factory. They only need to make defects ship.",
      "Or worse — make good parts get rejected. Yield collapses. Reputation collapses.",
    ],
    flowLabel: "THROUGHPUT",
    flowUnit: "UPH",
    flowValue: 1260,
    assets: [
      {
        id: "in",
        label: "IN-Q",
        kind: "Inbound Queue",
        x: 6,
        y: 50,
        state: "NOMINAL",
        affects: ["Conveyor C-A"],
      },
      {
        id: "ca",
        label: "C-A",
        kind: "Conveyor 12m",
        x: 22,
        y: 50,
        state: "NOMINAL",
        affects: ["Robot R-1"],
      },
      {
        id: "r1",
        label: "R-1",
        kind: "6-Axis Robot ABB IRB 6700",
        x: 38,
        y: 30,
        state: "NOMINAL",
        affects: ["Station S-1"],
      },
      {
        id: "r2",
        label: "R-2",
        kind: "6-Axis Robot KUKA KR 210",
        x: 38,
        y: 70,
        state: "DRIFT",
        affects: ["Station S-2"],
      },
      {
        id: "cnc",
        label: "CNC-7",
        kind: "5-Axis Mill",
        x: 55,
        y: 50,
        state: "NOMINAL",
        affects: ["Tolerance ±5µm"],
      },
      {
        id: "qc",
        label: "QC-V",
        kind: "Cognex Vision Cell",
        x: 72,
        y: 50,
        state: "COMPROMISED",
        affects: ["Reject gate"],
      },
      {
        id: "mes",
        label: "MES",
        kind: "Siemens Opcenter",
        x: 50,
        y: 8,
        state: "NOMINAL",
        affects: ["All stations", "Recipes"],
      },
      {
        id: "out",
        label: "OUT",
        kind: "Packing & Pallet",
        x: 92,
        y: 50,
        state: "NOMINAL",
        affects: ["Shipping"],
      },
    ],
    edges: [
      ["in", "ca"],
      ["ca", "r1"],
      ["ca", "r2"],
      ["r1", "cnc"],
      ["r2", "cnc"],
      ["cnc", "qc"],
      ["qc", "out"],
      ["mes", "r1"],
      ["mes", "r2"],
      ["mes", "cnc"],
      ["mes", "qc"],
    ],
    scenarios: [
      {
        id: "S-01",
        name: "Robot Misalignment",
        severity: "HIGH",
        desc: "R-2 TCP offset drifted 0.4 mm.",
        consequence: "Subtle assembly defects ship undetected.",
      },
      {
        id: "S-02",
        name: "Quality Manipulation",
        severity: "CRITICAL",
        desc: "QC-V vision model swapped with permissive variant.",
        consequence: "Defective parts pass. Recall scenario triggered.",
      },
      {
        id: "S-03",
        name: "Conveyor Disruption",
        severity: "MEDIUM",
        desc: "C-A speed varied outside spec.",
        consequence: "Cycle time chaos. UPH collapses.",
      },
      {
        id: "S-04",
        name: "PLC Compromise",
        severity: "CRITICAL",
        desc: "CNC-7 toolpath altered mid-batch.",
        consequence: "$1.8M of stock scrapped.",
      },
    ],
    artifacts: [
      { k: "STATIONS", v: "34" },
      { k: "ROBOTS", v: "76" },
      { k: "UPH", v: "1,260" },
      { k: "YIELD", v: "99.4%" },
    ],
  },
  "smart-city": {
    hero: "THE CITY IS A SYSTEM.",
    byline: "Traffic · Grid · Water · Transit",
    manifesto: [
      "Fourteen districts. 1,420 intersections. Forty-eight thousand traffic phases an hour.",
      "Every system shares fiber with the one next to it. Power blinks; signals freeze. Signals freeze; ambulances stop.",
      "An incident does not stay in one map layer for long.",
    ],
    flowLabel: "POPULATION",
    flowUnit: "M",
    flowValue: 2.1,
    assets: [
      {
        id: "grid",
        label: "GRID",
        kind: "Distribution Network",
        x: 14,
        y: 30,
        state: "NOMINAL",
        affects: ["All districts"],
      },
      {
        id: "water",
        label: "WATER",
        kind: "Distribution Mains",
        x: 14,
        y: 70,
        state: "NOMINAL",
        affects: ["All districts"],
      },
      {
        id: "traf1",
        label: "TRF-N",
        kind: "Northern Traffic Region",
        x: 38,
        y: 22,
        state: "DRIFT",
        affects: ["Districts 1–4"],
      },
      {
        id: "traf2",
        label: "TRF-S",
        kind: "Southern Traffic Region",
        x: 38,
        y: 78,
        state: "NOMINAL",
        affects: ["Districts 9–14"],
      },
      {
        id: "cctv",
        label: "CCTV-Ω",
        kind: "Surveillance Mesh",
        x: 58,
        y: 30,
        state: "NOMINAL",
        affects: ["Public safety"],
      },
      {
        id: "transit",
        label: "TRANSIT",
        kind: "Light Rail SCADA",
        x: 58,
        y: 70,
        state: "NOMINAL",
        affects: ["8 lines"],
      },
      {
        id: "ems",
        label: "EMS",
        kind: "Emergency Dispatch",
        x: 78,
        y: 50,
        state: "NOMINAL",
        affects: ["Fire", "Medical", "Police"],
      },
      {
        id: "noc",
        label: "NOC",
        kind: "City Network Ops",
        x: 92,
        y: 50,
        state: "COMPROMISED",
        affects: ["All city fiber"],
      },
    ],
    edges: [
      ["grid", "traf1"],
      ["grid", "traf2"],
      ["grid", "transit"],
      ["water", "ems"],
      ["traf1", "cctv"],
      ["traf2", "cctv"],
      ["cctv", "ems"],
      ["transit", "ems"],
      ["ems", "noc"],
    ],
    scenarios: [
      {
        id: "S-01",
        name: "Traffic Manipulation",
        severity: "HIGH",
        desc: "Intersection 1142 phase looped to green/green.",
        consequence: "Collision risk peaks during rush hour.",
      },
      {
        id: "S-02",
        name: "Grid Failure Cascade",
        severity: "CRITICAL",
        desc: "Substation 4 drops. Backup fails to start.",
        consequence: "Two districts dark for 47 minutes.",
      },
      {
        id: "S-03",
        name: "Water Disruption",
        severity: "MEDIUM",
        desc: "Pressure zone valves cycled.",
        consequence: "Hospital ring loses pressure for 9 minutes.",
      },
      {
        id: "S-04",
        name: "Communication Outage",
        severity: "CRITICAL",
        desc: "NOC routing tables poisoned.",
        consequence: "EMS dispatch goes silent across two boroughs.",
      },
    ],
    artifacts: [
      { k: "DISTRICTS", v: "14" },
      { k: "INTERSECTIONS", v: "1,420" },
      { k: "TRANSIT LINES", v: "8" },
      { k: "POPULATION", v: "2.1M" },
    ],
  },
  port: {
    hero: "THE PORT NEVER SLEEPS.",
    byline: "Cranes · Yard · Vessel Traffic",
    manifesto: [
      "Eight ship-to-shore cranes. A fully automated container yard. 240 TEU per hour, twenty-two hours a day.",
      "Every container is a database row before it is a box. The terminal operating system knows the box's next thirty moves.",
      "An adversary who edits the row edits the world. Boxes reroute themselves into the sea.",
    ],
    flowLabel: "THROUGHPUT",
    flowUnit: "TEU/HR",
    flowValue: 238,
    assets: [
      {
        id: "vessel",
        label: "MSC-COSTA",
        kind: "24k TEU Container Ship",
        x: 6,
        y: 25,
        state: "NOMINAL",
        affects: ["Berth 7", "Cranes 1–4"],
      },
      {
        id: "crn1",
        label: "STS-01",
        kind: "Ship-to-Shore Crane",
        x: 22,
        y: 22,
        state: "NOMINAL",
        affects: ["Vessel discharge"],
      },
      {
        id: "crn2",
        label: "STS-02",
        kind: "Ship-to-Shore Crane",
        x: 22,
        y: 40,
        state: "DRIFT",
        affects: ["Discharge lane 2"],
      },
      {
        id: "agv",
        label: "AGV-Ω",
        kind: "Automated Guided Fleet",
        x: 40,
        y: 30,
        state: "NOMINAL",
        affects: ["Quay to yard"],
      },
      {
        id: "yard",
        label: "YARD-B",
        kind: "Automated Yard Block",
        x: 60,
        y: 40,
        state: "NOMINAL",
        affects: ["8,200 slots"],
      },
      {
        id: "tos",
        label: "TOS-Ω",
        kind: "Terminal Operating System",
        x: 55,
        y: 8,
        state: "COMPROMISED",
        affects: ["All crane sequencing", "Gate manifests"],
      },
      {
        id: "gate",
        label: "GATE-16",
        kind: "Truck Gate Complex",
        x: 82,
        y: 55,
        state: "NOMINAL",
        affects: ["Landside egress"],
      },
      {
        id: "vts",
        label: "VTS",
        kind: "Vessel Traffic Service",
        x: 82,
        y: 25,
        state: "NOMINAL",
        affects: ["Approach channel"],
      },
    ],
    edges: [
      ["vessel", "crn1"],
      ["vessel", "crn2"],
      ["crn1", "agv"],
      ["crn2", "agv"],
      ["agv", "yard"],
      ["yard", "gate"],
      ["tos", "crn1"],
      ["tos", "crn2"],
      ["tos", "agv"],
      ["tos", "yard"],
      ["tos", "gate"],
      ["vts", "vessel"],
    ],
    scenarios: [
      {
        id: "S-01",
        name: "TOS Manifest Poisoning",
        severity: "CRITICAL",
        desc: "Container destinations rewritten in the terminal DB.",
        consequence: "Reefers routed to dry stacks. Hazmat lost in yard.",
      },
      {
        id: "S-02",
        name: "Crane Sequencing Attack",
        severity: "HIGH",
        desc: "STS-02 spreader commanded to drop mid-swing.",
        consequence: "Container-in-water. Berth closed 48h.",
      },
      {
        id: "S-03",
        name: "Gate Automation Bypass",
        severity: "HIGH",
        desc: "Gate OCR permits any plate.",
        consequence: "Undocumented cargo leaves the terminal.",
      },
      {
        id: "S-04",
        name: "AIS Spoofing",
        severity: "MEDIUM",
        desc: "Approach channel shows a phantom tanker.",
        consequence: "VTS diverts real vessels. Berth utilization collapses.",
      },
    ],
    artifacts: [
      { k: "CRANES", v: "8" },
      { k: "TEU/HR", v: "240" },
      { k: "YARD SLOTS", v: "42,000" },
      { k: "GATES", v: "16" },
    ],
  },
  "smart-building": {
    hero: "THE TOWER BREATHES.",
    byline: "HVAC · BMS · Access · Elevators",
    manifesto: [
      "62 stories. 418 HVAC zones. 3,206 devices sharing a single converged network with the door strikes and the elevator dispatch.",
      "Comfort is a control loop. So is safety. So is who gets past the turnstiles at 3 AM.",
      "An adversary who owns the BMS owns the temperature, the doors, and the record of who came and went.",
    ],
    flowLabel: "OCCUPANCY",
    flowUnit: "K",
    flowValue: 4.2,
    assets: [
      {
        id: "chiller",
        label: "CH-01",
        kind: "1200-ton Chiller Plant",
        x: 8,
        y: 25,
        state: "NOMINAL",
        affects: ["Floors 1–31"],
      },
      {
        id: "ahu1",
        label: "AHU-N",
        kind: "Air Handler North",
        x: 26,
        y: 20,
        state: "DRIFT",
        affects: ["Zones N1–N40"],
      },
      {
        id: "ahu2",
        label: "AHU-S",
        kind: "Air Handler South",
        x: 26,
        y: 60,
        state: "NOMINAL",
        affects: ["Zones S1–S40"],
      },
      {
        id: "bms",
        label: "BMS-Ω",
        kind: "Building Management System",
        x: 50,
        y: 8,
        state: "COMPROMISED",
        affects: ["All zones", "All doors", "All lifts"],
      },
      {
        id: "elev",
        label: "ELV-BANK-A",
        kind: "Elevator Bank (8 cars)",
        x: 50,
        y: 45,
        state: "NOMINAL",
        affects: ["Floors 1–62"],
      },
      {
        id: "acs",
        label: "ACS",
        kind: "Access Control · 240 doors",
        x: 72,
        y: 30,
        state: "NOMINAL",
        affects: ["Turnstiles", "Server-room strikes"],
      },
      {
        id: "gen",
        label: "GEN-STBY",
        kind: "2MW Standby Generator",
        x: 72,
        y: 70,
        state: "NOMINAL",
        affects: ["Life-safety loads"],
      },
      {
        id: "life",
        label: "LIFE-SAFETY",
        kind: "Fire & Smoke Panel",
        x: 92,
        y: 50,
        state: "NOMINAL",
        affects: ["All floors"],
      },
    ],
    edges: [
      ["chiller", "ahu1"],
      ["chiller", "ahu2"],
      ["bms", "ahu1"],
      ["bms", "ahu2"],
      ["bms", "elev"],
      ["bms", "acs"],
      ["acs", "life"],
      ["gen", "life"],
      ["gen", "elev"],
    ],
    scenarios: [
      {
        id: "S-01",
        name: "HVAC Setpoint Walk",
        severity: "HIGH",
        desc: "AHU-N supply-air temp drifted 6°C over 3 hours.",
        consequence: "Trading floor productivity collapses. IT room approaches thermal limit.",
      },
      {
        id: "S-02",
        name: "Access Control Override",
        severity: "CRITICAL",
        desc: "Server-room card readers set to always-unlock.",
        consequence: "Physical breach. Tape backups walked out.",
      },
      {
        id: "S-03",
        name: "Elevator Recall",
        severity: "MEDIUM",
        desc: "All cars recalled to lobby during peak hours.",
        consequence: "62 floors of stranded occupants. Emergency stairwell overload.",
      },
      {
        id: "S-04",
        name: "Life-Safety Silencing",
        severity: "CRITICAL",
        desc: "Fire panel alarms suppressed at supervisory layer.",
        consequence: "Detection without notification. Regulatory nightmare.",
      },
    ],
    artifacts: [
      { k: "FLOORS", v: "62" },
      { k: "ZONES", v: "418" },
      { k: "DEVICES", v: "3,206" },
      { k: "DOORS", v: "240" },
    ],
  },
};

export const Route = createFileRoute("/facility/$id")({
  head: ({ params }) => {
    const f = FACILITIES.find((x) => x.id === (params.id as FacilityId));
    const name = f?.name ?? "Facility";
    return {
      meta: [
        { title: `${name} — TwinSec Twin Engine` },
        { name: "description", content: f?.brief ?? "TwinSec facility simulation." },
        { property: "og:title", content: `${name} · TwinSec` },
        { property: "og:description", content: f?.brief ?? "Industrial digital twin." },
      ],
    };
  },
  loader: ({ params }) => {
    const f = FACILITIES.find((x) => x.id === (params.id as FacilityId));
    if (!f || !WORLDS[params.id as FacilityId]) throw notFound();
    return null;
  },
  component: FacilityPage,
  notFoundComponent: () => (
    <main className="min-h-screen bg-background text-foreground p-10">
      <p className="mono-label">404 · FACILITY NOT FOUND</p>
      <h1 className="display text-7xl mt-4">WORLD BUILD QUEUED.</h1>
      <Link to="/twin-engine" className="mono-label text-accent mt-6 inline-block">
        ← BACK TO TWIN ENGINE
      </Link>
    </main>
  ),
});

function FacilityPage() {
  const { id } = Route.useParams();
  const meta = FACILITIES.find((x) => x.id === (id as FacilityId))!;
  const w = WORLDS[id as FacilityId]!;
  const [selected, setSelected] = useState<string | null>(null);
  const sel = selected ? (w.assets.find((a) => a.id === selected) ?? null) : null;
  const rootRef = useGsapReveal<HTMLElement>();
  const heroImage = FACILITY_IMAGES[id] ?? facility;

  return (
    <main ref={rootRef} className="min-h-screen bg-background text-foreground">
      {/* HEADER */}
      <section className="relative border-b border-rule overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <img
          src={heroImage}
          alt=""
          aria-hidden
          width={1600}
          height={1024}
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        <div className="absolute inset-0 scanline pointer-events-none" />
        <div className="relative mx-auto max-w-[1600px] px-6 lg:px-10 pt-10 pb-16 lg:pt-14 lg:pb-24">
          <div className="flex flex-wrap items-baseline justify-between gap-4 mono-label">
            <Link to="/twin-engine" className="hover:text-accent">
              ← TWIN ENGINE
            </Link>
            <span>
              FACILITY {meta.no} · {meta.sector}
            </span>
            <span className="text-accent flex items-center gap-2">
              <span className="size-1.5 bg-accent animate-pulse-dot" /> {meta.status}
            </span>
          </div>
          <p className="mono-label mt-10">{meta.name}</p>
          <h1 className="display text-[14vw] md:text-[10vw] lg:text-[140px] leading-[0.84] mt-3">
            {w.hero.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="text-accent">{w.hero.split(" ").slice(-1)}</span>
          </h1>
          <p className="font-serif italic text-xl md:text-2xl mt-6 text-foreground/80 leading-snug max-w-3xl">
            {w.byline}.
          </p>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-rule pt-8">
            {w.artifacts.map((a) => (
              <div key={a.k}>
                <p className="mono-label">{a.k}</p>
                <p className="display text-4xl mt-2 leading-none">{a.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-20 grid grid-cols-12 gap-8">
          <p className="col-span-12 md:col-span-3 mono-label">SECTION 01 — THE WORLD</p>
          <div className="col-span-12 md:col-span-9 grid md:grid-cols-3 gap-8">
            {w.manifesto.map((p, i) => (
              <p
                key={i}
                className={`font-serif text-xl leading-snug ${i === 0 ? "" : "text-foreground/70"}`}
              >
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* LIVING WORLD VIEW */}
      <section className="border-b border-rule">
        <div className="grid grid-cols-12">
          <aside className="col-span-12 lg:col-span-3 border-b lg:border-b-0 lg:border-r border-rule p-8 lg:p-10 flex flex-col gap-8">
            <div>
              <p className="mono-label">SECTION 02 — LIVING WORLD</p>
              <p className="display text-4xl mt-3 leading-none">
                {w.flowValue}
                <span className="text-foreground/40 text-2xl"> {w.flowUnit}</span>
              </p>
              <p className="mono-label mt-2 text-accent">{w.flowLabel}</p>
            </div>
            <div className="hairline" />
            <div className="flex-1">
              <p className="mono-label">SELECTED ASSET</p>
              {sel ? (
                <div className="mt-3">
                  <p className="display text-3xl leading-none">{sel.label}</p>
                  <p className="font-mono text-xs text-foreground/60 uppercase mt-2">{sel.kind}</p>
                  <p
                    className={`mono-label mt-4 ${sel.state === "COMPROMISED" ? "text-danger" : sel.state === "DRIFT" ? "text-warn" : "text-accent"}`}
                  >
                    STATE · {sel.state}
                  </p>
                  <div className="mt-4">
                    <p className="mono-label">AFFECTS</p>
                    <ul className="mt-2 space-y-1 font-serif text-base">
                      {sel.affects.map((a) => (
                        <li key={a} className="flex items-baseline gap-2">
                          <span className="size-1.5 bg-accent translate-y-1" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="font-serif italic text-foreground/60 mt-3">
                  Tap an asset to inspect dependencies, state, and the consequence of its failure.
                </p>
              )}
            </div>
            <Link
              to="/simulation"
              search={{ sector: id as FacilityId }}
              className="bg-accent text-accent-foreground mono-label py-3 text-center hover:bg-foreground hover:text-background transition-colors"
            >
              LAUNCH EXERCISE →
            </Link>
          </aside>

          {/* TOPOLOGY */}
          <div className="col-span-12 lg:col-span-9 relative min-h-[520px] lg:min-h-[680px] bg-background">
            <div className="absolute inset-0 grid-bg opacity-30" />
            <img
              src={schematic}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-10"
            />
            <div className="absolute inset-0 scanline pointer-events-none opacity-50" />
            <div className="absolute top-5 left-6 right-6 flex justify-between mono-label z-10">
              <span>FIG. 01 — {meta.sector} TOPOLOGY</span>
              <span className="text-accent flex items-center gap-2">
                <span className="size-1.5 bg-accent animate-pulse-dot" /> LIVE
              </span>
            </div>
            <WorldTopology world={w} selected={selected} onSelect={setSelected} />
            <div className="absolute bottom-5 left-6 right-6 flex justify-between mono-label z-10">
              <span>
                {w.assets.length} ASSETS · {w.edges.length} LINKS
              </span>
              <span className="text-foreground/60">PRESS ENTER ON ANY NODE</span>
            </div>
          </div>
        </div>
      </section>

      {/* ATTACK SCENARIOS */}
      <section className="border-b border-rule bg-paper text-ink">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-20 lg:py-28">
          <div className="grid grid-cols-12 gap-8 border-b-2 border-ink pb-8">
            <p className="col-span-12 md:col-span-3 mono-label !text-ink/60">
              SECTION 03 — ATTACK SCENARIOS
            </p>
            <h2 className="col-span-12 md:col-span-9 display text-5xl md:text-7xl lg:text-[100px] leading-[0.85]">
              The next
              <br />
              incident is
              <br />
              <span className="italic font-serif normal-case tracking-tight">already written.</span>
            </h2>
          </div>
          <ol className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-x-12">
            {w.scenarios.map((s) => (
              <li
                key={s.id}
                className="grid grid-cols-[4rem_minmax(0,1fr)] items-baseline gap-4 py-7 border-b border-ink/15"
              >
                <span className="mono-label !text-ink/60">{s.id}</span>
                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="display text-3xl leading-none">{s.name}</p>
                    <span
                      className={`mono-label ${s.severity === "CRITICAL" ? "!text-danger" : s.severity === "HIGH" ? "!text-warn" : "!text-ink"}`}
                    >
                      {s.severity}
                    </span>
                  </div>
                  <p className="font-serif text-lg italic mt-3 text-ink/80">{s.desc}</p>
                  <p className="font-mono text-xs text-ink/60 mt-3 leading-relaxed">
                    → {s.consequence}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CLOSING */}
      <section className="relative border-b border-rule overflow-hidden">
        <img
          src={heroImage}
          alt=""
          aria-hidden
          width={1600}
          height={1024}
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div className="relative mx-auto max-w-[1600px] px-6 lg:px-10 py-24 lg:py-36">
          <p className="mono-label">SECTION 04 — REHEARSAL</p>
          <h2 className="display text-[14vw] md:text-[10vw] lg:text-[140px] leading-[0.84] mt-4">
            REHEARSE
            <br />
            THIS <span className="text-accent">FACILITY.</span>
          </h2>
          <div className="mt-12 flex flex-wrap gap-4">
            <Link
              to="/simulation"
              search={{ sector: id as FacilityId }}
              className="bg-accent text-accent-foreground mono-label px-6 py-4 hover:bg-foreground hover:text-background transition-colors"
            >
              LAUNCH EXERCISE {EXERCISES_LABEL[id as FacilityId] ?? ""} →
            </Link>

            <Link
              to="/twin-engine"
              className="border border-rule mono-label px-6 py-4 hover:border-accent hover:text-accent transition-colors"
            >
              ← CHOOSE ANOTHER WORLD
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-rule">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-8 flex flex-wrap justify-between mono-label gap-3">
          <span>
            FACILITY {meta.no} · {meta.sector} · TWINSEC SYSTEMS
          </span>
          <Link to="/" className="hover:text-accent">
            ← BRIEFING
          </Link>
        </div>
      </footer>
    </main>
  );
}

function WorldTopology({
  world,
  selected,
  onSelect,
}: {
  world: World;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const byId = (id: string) => world.assets.find((a) => a.id === id)!;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
    >
      {world.edges.map(([a, b], i) => {
        const pa = byId(a);
        const pb = byId(b);
        const live = pa.state !== "NOMINAL" || pb.state !== "NOMINAL";
        return (
          <g key={i}>
            <line
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke={live ? "oklch(0.86 0.24 125)" : "oklch(0.35 0.01 240)"}
              strokeWidth={live ? 0.3 : 0.15}
              vectorEffect="non-scaling-stroke"
            />
            {live && (
              <line
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke="oklch(0.97 0.005 90)"
                strokeWidth={0.5}
                strokeDasharray="0.8 3"
                vectorEffect="non-scaling-stroke"
                opacity={0.6}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="-30"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
              </line>
            )}
          </g>
        );
      })}
      {world.assets.map((a) => {
        const isS = selected === a.id;
        const isC = a.state === "COMPROMISED";
        const isD = a.state === "DRIFT";
        const fill = isC
          ? "oklch(0.86 0.24 125)"
          : isD
            ? "oklch(0.78 0.18 80)"
            : "oklch(0.14 0.005 240)";
        return (
          <g
            key={a.id}
            className="cursor-pointer select-none focus:outline-none [&:focus-visible>rect.focus-ring]:opacity-100"
            role="button"
            tabIndex={0}
            aria-label={`${a.label} — ${a.kind}. State ${a.state}. Press Enter to inspect.`}
            aria-pressed={isS}
            onClick={() => onSelect(a.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(a.id);
              }
            }}
          >
            <rect x={a.x - 5} y={a.y - 5} width={10} height={10} fill="transparent" />
            <rect
              className="focus-ring"
              x={a.x - 3}
              y={a.y - 3}
              width={6}
              height={6}
              fill="none"
              stroke="oklch(0.97 0.005 90)"
              strokeWidth={0.45}
              strokeDasharray="0.8 0.6"
              vectorEffect="non-scaling-stroke"
              opacity={0}
            />
            {isC && (
              <circle
                cx={a.x}
                cy={a.y}
                r={3}
                fill="none"
                stroke="oklch(0.86 0.24 125)"
                strokeWidth={0.2}
                opacity={0.5}
                vectorEffect="non-scaling-stroke"
              >
                <animate attributeName="r" from="2" to="6" dur="1.4s" repeatCount="indefinite" />
                <animate
                  attributeName="opacity"
                  from="0.9"
                  to="0"
                  dur="1.4s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
            <rect
              x={a.x - 1.6}
              y={a.y - 1.6}
              width={3.2}
              height={3.2}
              fill={fill}
              stroke={isS ? "oklch(0.97 0.005 90)" : "oklch(0.97 0.005 90)"}
              strokeWidth={isS ? 0.5 : 0.2}
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={a.x + 2.4}
              y={a.y - 1.6}
              fill="oklch(0.97 0.005 90)"
              fontSize="1.6"
              fontFamily="JetBrains Mono, monospace"
              opacity={isS || isC || isD ? 1 : 0.6}
            >
              {a.label}
            </text>
            <text
              x={a.x + 2.4}
              y={a.y + 0.4}
              fill="oklch(0.65 0.02 240)"
              fontSize="1.1"
              fontFamily="JetBrains Mono, monospace"
            >
              {a.kind.split(" ")[0].toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
