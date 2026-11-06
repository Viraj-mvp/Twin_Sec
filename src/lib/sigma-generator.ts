export interface SigmaRuleParams {
  sector: string;
  mitreId: string;
  mitreTactic: string;
  nodeId: string;
  nodeLabel: string;
  vendor: string;
  eventType: string;
}

export function generateSigmaRule(params: SigmaRuleParams): string {
  const dateStr = new Date().toISOString().split("T")[0];
  const ruleId = crypto.randomUUID();

  // Determine standard ICS port and protocol fields
  const sectorLower = (params.sector || "power").toLowerCase();
  let service = "modbus";
  let dstPort = 502;
  let payloadFilters = `modbus.function_code:
      - 5   # Write Single Coil
      - 6   # Write Single Register
      - 15  # Write Multiple Coils
      - 16  # Write Multiple Registers
    modbus.unit_id: 1`;

  if (sectorLower === "power" || sectorLower === "smart-city") {
    service = "dnp3";
    dstPort = 20000;
    payloadFilters = `dnp3.function:
      - 'DIRECT_OPERATE'
      - 'DIRECT_OPERATE_NO_ACK'
      - 'WRITE'
    dnp3.objects:
      - 'Analog Output'
      - 'Binary Output'`;
  } else if (params.vendor.toLowerCase().includes("siemens")) {
    service = "s7comm";
    dstPort = 102;
    payloadFilters = `s7comm.function:
      - 'Write Var'
      - 'Request Download'
      - 'Download Block'
    s7comm.pdu_type: 'Job'`;
  } else if (sectorLower === "smart-building") {
    service = "bacnet";
    dstPort = 47808;
    payloadFilters = `bacnet.service_choice:
      - 'writeProperty'
      - 'writePropertyMultiple'
      - 'reinitializeDevice'`;
  }

  const cleanMitre = params.mitreId.toUpperCase();
  const mitreTag = cleanMitre.toLowerCase().replace(".", "_");
  const tacticTag = (params.mitreTactic || "impact").toLowerCase().replace(/\s+/g, "_");

  return `title: Unauthorized ICS Control Command - ${params.sector.toUpperCase()} ${cleanMitre}
id: ${ruleId}
status: test
description: Detects unauthorized ICS protocol commands, setpoint drift injection, or ladder logic overwrites targeting ${params.nodeLabel} (${params.vendor}).
references:
  - https://attack.mitre.org/techniques/${cleanMitre}/
  - https://twinsec.systems/rules/${cleanMitre}
author: TwinSec OT Threat Intelligence
date: ${dateStr}
modified: ${dateStr}
tags:
  - attack.${mitreTag}
  - attack.${tacticTag}
  - attack.t1692.001
  - attack.t0831
  - attack.t0855
logsource:
  category: network_traffic
  product: zeek
  service: ${service}
detection:
  selection_port:
    dst_port: ${dstPort}
  selection_payload:
    ${payloadFilters}
  filter_known_eng:
    src_ip:
      - '192.168.30.14' # Authorized Engineering Workstation (EWS-04)
  condition: selection_port and selection_payload and not filter_known_eng
falsepositives:
  - Authorized scheduled ladder logic maintenance from approved engineering workstation
  - Factory Acceptance Test (FAT) / Commissioning routines by certified OEM engineer
level: high
`;
}

export function downloadSigmaRuleYml(filename: string, content: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "text/yaml;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
