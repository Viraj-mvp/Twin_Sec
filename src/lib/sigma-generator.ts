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

  return `title: TwinSec SCADA Detection - ${params.sector.toUpperCase()} ${params.mitreId}
id: ${ruleId}
status: experimental
description: Auto-generated Sigma detection rule from TwinSec Cyber-Physical Simulation run. Detects unmitigated ${params.eventType} activity targeting ${params.nodeLabel} (${params.vendor}).
references:
  - https://attack.mitre.org/techniques/${params.mitreId}/
  - https://twinsec.systems/rules/${params.mitreId}
author: TwinSec Threat Intelligence Engine
date: ${dateStr}
tags:
  - attack.${params.mitreId.toLowerCase().replace(".", "_")}
  - attack.${params.mitreTactic.toLowerCase().replace(/\s+/g, "_")}
  - sector.${params.sector}
logsource:
  category: network
  product: ics
  service: ${params.sector === "power" ? "dnp3" : params.sector === "water" ? "modbus" : "opcua"}
detection:
  selection_target:
    DestinationNode: "${params.nodeLabel}"
    VendorClass: "${params.vendor}"
  selection_behavior:
    EventClass: "${params.eventType}"
    Severity: "CRITICAL"
  condition: selection_target and selection_behavior
falsepositives:
  - Legitimate scheduled engineering maintenance on ${params.nodeLabel}
  - Firmware update routines authorized by plant manager
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
