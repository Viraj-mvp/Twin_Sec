/**
 * taxii.functions.ts
 *
 * Server functions to query external threat intelligence APIs and open-source datasets:
 * 1. MITRE ATT&CK for ICS TAXII 2.1 API (https://cti-taxii.mitre.org/taxii/)
 * 2. Operational Technology Cyber Attack Database (OTCAD) dataset
 * 3. HAI (HIL-Augmented ICS) Security Dataset metadata provider
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface TaxiiPattern {
  id: string;
  name: string;
  external_id: string;
  description: string;
  tactics: string[];
  platforms: string[];
}

export interface OtcadIncident {
  id: string;
  year: number;
  sector: string;
  incidentName: string;
  targetComponent: string;
  mitreTactic: string;
  consequence: string;
}

// Fallback catalog for offline / network isolated deployments
const LOCAL_MITRE_ICS_PATTERNS: TaxiiPattern[] = [
  {
    id: "attack-pattern--t0855",
    name: "Unauthorized Command Message",
    external_id: "T0855",
    description:
      "Adversaries send unauthorized control commands to SCADA/PLC equipment to alter physical operations.",
    tactics: ["Impair Process Control"],
    platforms: ["Control Server", "PLC", "Safety Instrumented System"],
  },
  {
    id: "attack-pattern--t0831",
    name: "Manipulation of Control",
    external_id: "T0831",
    description:
      "Adversaries manipulate physical control parameters or safety setpoints, causing pressure or frequency desynchronization.",
    tactics: ["Impair Process Control"],
    platforms: ["Human Machine Interface", "PLC"],
  },
  {
    id: "attack-pattern--t0807",
    name: "Command-Line Interface",
    external_id: "T0807",
    description:
      "Adversaries utilize embedded administrative CLI shells to execute commands on OT network gateways.",
    tactics: ["Execution"],
    platforms: ["Engineering Workstation", "SCADA Gateway"],
  },
  {
    id: "attack-pattern--t0889",
    name: "Denial of Service",
    external_id: "T0889",
    description:
      "Adversaries flood SCADA telemetry channels to cause blind operation for control room operators.",
    tactics: ["Denial of Control"],
    platforms: ["Fieldbus Gateway", "Modbus Router"],
  },
];

const LOCAL_OTCAD_INCIDENTS: OtcadIncident[] = [
  {
    id: "otcad-2010-01",
    year: 2010,
    sector: "Manufacturing",
    incidentName: "Stuxnet Centrifuge Sabotage",
    targetComponent: "Siemens S7-300 PLC Frequency Drives",
    mitreTactic: "Manipulation of Control (T0831)",
    consequence: "Rotor frequency desynchronization causing physical destruction of centrifuges.",
  },
  {
    id: "otcad-2016-01",
    year: 2016,
    sector: "Power Grid",
    incidentName: "Industroyer / CrashOverride Substation Blackout",
    targetComponent: "IEC 60870-5-104 Protective Relays",
    mitreTactic: "Unauthorized Command Message (T0855)",
    consequence: "Automated transmission breaker tripping causing regional power grid shed.",
  },
  {
    id: "otcad-2017-01",
    year: 2017,
    sector: "Oil & Gas",
    incidentName: "Triton / HatMan Petrochemical SIS Breach",
    targetComponent: "Triconex Safety Instrumented System (SIS)",
    mitreTactic: "Loss of Safety System (T0880)",
    consequence: "Disabling of hardware emergency shutdown interlocks.",
  },
  {
    id: "otcad-2021-01",
    year: 2021,
    sector: "Water Treatment",
    incidentName: "Oldsmar Water Facility Remote Access Incident",
    targetComponent: "L2 HMI TeamViewer Dosing Control",
    mitreTactic: "Manipulation of Control (T0831)",
    consequence:
      "Unauthorized alteration of sodium hydroxide setpoints from 100 ppm to 11,100 ppm.",
  },
];

interface StixObject {
  type: string;
  id: string;
  name: string;
  description?: string;
  external_references?: Array<{ external_id?: string }>;
  kill_chain_phases?: Array<{ phase_name: string }>;
  x_mitre_platforms?: string[];
}

/**
 * Server function: Query MITRE ATT&CK for ICS TAXII 2.1 STIX endpoint
 */
export const fetchMitreTaxiiTechniques = createServerFn({ method: "GET" }).handler(async () => {
  const taxiiEndpoint =
    process.env.MITRE_TAXII_API_URL ||
    "https://cti-taxii.mitre.org/stix/collections/9510164c-77b8-407e-873f-2c7ba67c36a7/objects/";
  try {
    const res = await fetch(taxiiEndpoint, {
      headers: { Accept: "application/stix+json;version=2.1" },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`TAXII server returned status ${res.status}`);

    const data = (await res.json()) as { objects?: StixObject[] };
    const attackPatterns = (data.objects || [])
      .filter((obj: StixObject) => obj.type === "attack-pattern")
      .slice(0, 10)
      .map((obj: StixObject) => ({
        id: obj.id,
        name: obj.name,
        external_id: obj.external_references?.[0]?.external_id || "T0800",
        description: obj.description || "Industrial control system attack vector.",
        tactics: (obj.kill_chain_phases || []).map((k: { phase_name: string }) => k.phase_name),
        platforms: obj.x_mitre_platforms || ["ICS"],
      }));
    return { success: true, source: "live-taxii-api", patterns: attackPatterns };
  } catch (err) {
    return {
      success: true,
      source: "offline-mitre-catalog",
      patterns: LOCAL_MITRE_ICS_PATTERNS,
    };
  }
});

/**
 * Server function: Fetch historical OT incidents from OTCAD dataset
 */
export const fetchOtcadIncidents = createServerFn({ method: "GET" }).handler(async () => {
  const otcadEndpoint =
    process.env.OTCAD_DATASET_URL ||
    "https://raw.githubusercontent.com/bvcyber/OTCAD/main/OTCAD.json";
  try {
    const res = await fetch(otcadEndpoint, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error("OTCAD raw catalog unreachable");
    const data = await res.json();
    return { success: true, source: "live-otcad-repo", incidents: data.slice(0, 10) };
  } catch (err) {
    return {
      success: true,
      source: "local-otcad-dossiers",
      incidents: LOCAL_OTCAD_INCIDENTS,
    };
  }
});

/**
 * Server function: Fetch HAI ICS Security Dataset summary
 */
export const fetchHaiDatasetSummary = createServerFn({ method: "GET" }).handler(async () => {
  const haiEndpoint = process.env.HAI_DATASET_URL || "https://github.com/icsdataset/hai";
  return {
    success: true,
    datasetName: "HAI (HIL-based Augmented ICS) Security Dataset",
    repositoryUrl: haiEndpoint,
    totalVariables: 59,
    testbedSectors: ["Boiler Loop", "Turbine Process", "Water Dosing Loop"],
    sampleFormat: "CSV normalized telemetry (1.0s sampling frequency)",
    attackCount: 38,
  };
});
