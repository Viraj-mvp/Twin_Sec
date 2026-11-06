export interface OtcadAttackRecord {
  guid: string;
  name: string;
  year: number;
  industry: string;
  attackType: string;
  sources: string[];
  // Enriched ICS cybersecurity fields
  targetComponent?: string;
  mitreTactic?: string;
  mitreTechniques?: string[];
  consequence?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface OtcadSummary {
  totalIncidents: number;
  yearRange: { min: number; max: number };
  industries: { name: string; count: number }[];
  attackTypes: { name: string; count: number }[];
}
