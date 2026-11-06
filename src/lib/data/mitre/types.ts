export interface MitreTechnique {
  id: string; // STIX ID e.g. "attack-pattern--..."
  externalId: string; // e.g. "T0855"
  name: string;
  description: string;
  tactics: string[]; // e.g. ["Impair Process Control"]
  platforms: string[]; // e.g. ["Control Server", "PLC"]
  permissionsRequired?: string[];
  dataSources?: string[];
  isSubtechnique: boolean;
  isRevoked?: boolean;
  revokedBy?: string;
  mitigations?: { id: string; name: string; description: string }[];
  url?: string;
}

export interface MitreTactic {
  id: string;
  shortName: string;
  name: string;
  description: string;
  externalId: string;
}

export interface MitreMitigation {
  id: string;
  externalId: string;
  name: string;
  description: string;
}

export interface MitreCatalogSummary {
  totalTechniques: number;
  totalTactics: number;
  totalMitigations: number;
  tacticsList: { name: string; count: number }[];
  platformsList: { name: string; count: number }[];
  specVersion: string;
}
