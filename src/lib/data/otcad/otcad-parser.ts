import * as fs from "fs";
import * as path from "path";
import type { OtcadAttackRecord, OtcadSummary } from "./types";
import { resolveDatasetPath } from "../dataset-path";

export class OtcadParser {
  private records: OtcadAttackRecord[] = [];
  private recordsByGuid: Map<string, OtcadAttackRecord> = new Map();
  private loaded: boolean = false;
  private filePath: string;
  private cachedSummary: OtcadSummary | null = null;
  private searchCache: Map<string, OtcadAttackRecord[]> = new Map();

  constructor(customPath?: string) {
    this.filePath =
      customPath ||
      process.env.OTCAD_DATASET_PATH ||
      resolveDatasetPath("otcad", "cyberattacks.json");
  }

  public load(): boolean {
    if (this.loaded) return true;

    try {
      if (!fs.existsSync(this.filePath)) {
        console.warn(`[OTCAD Parser] Dataset file not found at: ${this.filePath}`);
        return false;
      }

      const raw = fs.readFileSync(this.filePath, "utf-8");
      const data: unknown[] = JSON.parse(raw);

      if (!Array.isArray(data)) {
        console.warn(`[OTCAD Parser] Expected array of records in ${this.filePath}`);
        return false;
      }

      this.records = data.map((item) => this.enrichRecord(item as Record<string, unknown>));
      this.recordsByGuid.clear();
      for (const rec of this.records) {
        this.recordsByGuid.set(rec.guid, rec);
      }

      this.loaded = true;
      return true;
    } catch (err) {
      console.error("[OTCAD Parser] Failed to parse OTCAD dataset:", err);
      return false;
    }
  }

  private enrichRecord(item: Record<string, unknown>): OtcadAttackRecord {
    const guid = typeof item.guid === "string" ? item.guid : crypto.randomUUID();
    const industry = typeof item.industry === "string" ? item.industry : "Unknown";
    const attackType = typeof item.attackType === "string" ? item.attackType : "Unknown";
    const name = typeof item.name === "string" ? item.name : "Unnamed Cyber Incident";
    const year = Number(item.year) || 2000;
    const sources = Array.isArray(item.sources) ? (item.sources as string[]) : [];

    // Derive realistic ICS cybersecurity context based on attack semantics
    let targetComponent = "SCADA / PLC Controller";
    let mitreTactic = "Impair Process Control";
    let mitreTechniques = ["T0831", "T0855"];
    let consequence = "Disruption of industrial process operations and physical telemetry drift.";
    let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "HIGH";

    const nameLower = name.toLowerCase();
    const indLower = industry.toLowerCase();

    if (
      nameLower.includes("stuxnet") ||
      indLower.includes("nuclear") ||
      nameLower.includes("centrifuge")
    ) {
      targetComponent = "Siemens S7-300 / Frequency Drives";
      mitreTactic = "Impair Process Control (T0831)";
      mitreTechniques = ["T0831", "T0814", "T0855", "T0887"];
      consequence =
        "Overdrive rotor resonance resulting in physical damage to separation centrifuges.";
      severity = "CRITICAL";
    } else if (
      nameLower.includes("substation") ||
      nameLower.includes("power") ||
      indLower.includes("power")
    ) {
      targetComponent = "IEC 60870-5-104 / RTU / Protection Relays";
      mitreTactic = "Denial of Control (T0889)";
      mitreTechniques = ["T0855", "T0889", "T0881"];
      consequence = "Remote breaker tripping leading to regional power grid shedding.";
      severity = "CRITICAL";
    } else if (indLower.includes("water")) {
      targetComponent = "Modbus Chemical Dosing PLC (P1_FCV / Chlorine Feed)";
      mitreTactic = "Impair Process Control (T0831)";
      mitreTechniques = ["T0831", "T0807", "T0887"];
      consequence =
        "Unauthorized override of chemical dosing setpoints beyond potable water limits.";
      severity = "HIGH";
    } else if (
      indLower.includes("petroleum") ||
      indLower.includes("oil") ||
      indLower.includes("chemical")
    ) {
      targetComponent = "Triconex SIL-3 Safety Instrumented System (SIS)";
      mitreTactic = "Loss of Safety Function (T0880)";
      mitreTechniques = ["T0880", "T0855", "T0836"];
      consequence = "Inhibition of safety emergency shutdown interlocks during pressure surges.";
      severity = "CRITICAL";
    } else if (attackType === "Disgruntled Employee") {
      targetComponent = "Engineering Workstation (EWS) / Master Terminal";
      mitreTactic = "Privilege Escalation / Evasion";
      mitreTechniques = ["T0807", "T0890", "T0859"];
      consequence = "Unauthorized modification of supervisory access control and logic files.";
      severity = "MEDIUM";
    }

    return {
      guid,
      name,
      year,
      industry,
      attackType,
      sources,
      targetComponent,
      mitreTactic,
      mitreTechniques,
      consequence,
      severity,
    };
  }

  public getAll(): OtcadAttackRecord[] {
    this.ensureLoaded();
    return this.records;
  }

  public getByGuid(guid: string): OtcadAttackRecord | undefined {
    this.ensureLoaded();
    return this.recordsByGuid.get(guid);
  }

  public search(params: {
    query?: string;
    industry?: string;
    attackType?: string;
    yearMin?: number;
    yearMax?: number;
    limit?: number;
  }): OtcadAttackRecord[] {
    this.ensureLoaded();
    const cacheKey = `${params.query || ""}_${params.industry || ""}_${params.attackType || ""}_${params.yearMin || 0}_${params.yearMax || 0}_${params.limit || 0}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached) return cached;

    let res = [...this.records];

    if (params.industry && params.industry !== "ALL") {
      const ind = params.industry.toLowerCase();
      res = res.filter((r) => r.industry.toLowerCase().includes(ind));
    }

    if (params.attackType && params.attackType !== "ALL") {
      const att = params.attackType.toLowerCase();
      res = res.filter((r) => r.attackType.toLowerCase().includes(att));
    }

    if (params.yearMin !== undefined) {
      res = res.filter((r) => r.year >= params.yearMin!);
    }

    if (params.yearMax !== undefined) {
      res = res.filter((r) => r.year <= params.yearMax!);
    }

    if (params.query && params.query.trim()) {
      const q = params.query.toLowerCase().trim();
      res = res.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.industry.toLowerCase().includes(q) ||
          r.attackType.toLowerCase().includes(q) ||
          (r.targetComponent && r.targetComponent.toLowerCase().includes(q)) ||
          (r.consequence && r.consequence.toLowerCase().includes(q)),
      );
    }

    // Sort by year descending by default
    res.sort((a, b) => b.year - a.year);

    if (params.limit && params.limit > 0) {
      res = res.slice(0, params.limit);
    }

    if (this.searchCache.size >= 100) {
      const first = this.searchCache.keys().next().value;
      if (first) this.searchCache.delete(first);
    }
    this.searchCache.set(cacheKey, res);

    return res;
  }

  public getSummary(): OtcadSummary {
    this.ensureLoaded();
    if (this.cachedSummary) {
      return this.cachedSummary;
    }

    const indCounts: Record<string, number> = {};
    const attCounts: Record<string, number> = {};
    let minYear = 3000;
    let maxYear = 0;

    for (const r of this.records) {
      indCounts[r.industry] = (indCounts[r.industry] || 0) + 1;
      attCounts[r.attackType] = (attCounts[r.attackType] || 0) + 1;
      if (r.year < minYear) minYear = r.year;
      if (r.year > maxYear) maxYear = r.year;
    }

    this.cachedSummary = {
      totalIncidents: this.records.length,
      yearRange: { min: minYear === 3000 ? 1988 : minYear, max: maxYear },
      industries: Object.entries(indCounts).map(([name, count]) => ({ name, count })),
      attackTypes: Object.entries(attCounts).map(([name, count]) => ({ name, count })),
    };
    return this.cachedSummary;
  }

  private ensureLoaded(): void {
    if (!this.loaded) {
      this.load();
    }
  }
}

export const otcadParser = new OtcadParser();
