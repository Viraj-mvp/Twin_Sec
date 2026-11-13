import * as fs from "fs";
import * as path from "path";
import type { MitreTechnique, MitreTactic, MitreMitigation, MitreCatalogSummary } from "./types";
import { resolveDatasetPath } from "../dataset-path";
import embeddedMitreBundle from "./ics-attack.json";

interface StixRelationship {
  type: "relationship";
  relationship_type: string;
  source_ref: string;
  target_ref: string;
  description?: string;
}

interface StixExternalReference {
  source_name?: string;
  external_id?: string;
  url?: string;
  description?: string;
}

interface StixKillChainPhase {
  kill_chain_name?: string;
  phase_name?: string;
}

export class MitreStixParser {
  private techniques: Map<string, MitreTechnique> = new Map();
  private techniquesByExternalId: Map<string, MitreTechnique> = new Map();
  private tactics: Map<string, MitreTactic> = new Map();
  private mitigations: Map<string, MitreMitigation> = new Map();
  private loaded: boolean = false;
  private bundlePath: string;
  private cachedSummary: MitreCatalogSummary | null = null;
  private searchCache: Map<string, MitreTechnique[]> = new Map();

  constructor(customPath?: string) {
    this.bundlePath =
      customPath ||
      process.env.MITRE_ICS_PATH ||
      resolveDatasetPath("mitre", "ics-attack.json");
  }

  public load(): boolean {
    if (this.loaded) return true;

    try {
      let bundle: any = null;

      if (this.bundlePath && fs.existsSync(this.bundlePath)) {
        try {
          const raw = fs.readFileSync(this.bundlePath, "utf-8");
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.objects)) {
            bundle = parsed;
          }
        } catch {
          bundle = null;
        }
      }

      // Fallback to embedded bundled STIX bundle if filesystem read fails (e.g. Vercel Serverless)
      if (!bundle) {
        bundle = embeddedMitreBundle;
      }

      if (!bundle || !bundle.objects || !Array.isArray(bundle.objects)) {
        console.warn(`[MITRE Parser] Invalid STIX bundle structure`);
        return false;
      }

      const rawRelationships: StixRelationship[] = [];

      // Pass 1: Index Tactics, Mitigations and collect Relationships
      for (const obj of bundle.objects) {
        if (obj.type === "x-mitre-tactic") {
          const extId =
            (obj.external_references as StixExternalReference[] | undefined)?.find(
              (r) => r.source_name === "mitre-attack",
            )?.external_id || "";
          this.tactics.set(obj.x_mitre_shortname || obj.id, {
            id: obj.id,
            shortName: obj.x_mitre_shortname || "",
            name: obj.name || "",
            description: obj.description || "",
            externalId: extId,
          });
        } else if (obj.type === "course-of-action") {
          const extId =
            (obj.external_references as StixExternalReference[] | undefined)?.find(
              (r) => r.source_name === "mitre-attack",
            )?.external_id || "";
          this.mitigations.set(obj.id, {
            id: obj.id,
            externalId: extId,
            name: obj.name || "",
            description: obj.description || "",
          });
        } else if (obj.type === "relationship") {
          rawRelationships.push(obj as StixRelationship);
        }
      }

      // Pass 2: Index Attack Patterns (Both Active and Revoked/Superseded)
      for (const obj of bundle.objects) {
        if (obj.type !== "attack-pattern") continue;

        const extRef = (obj.external_references as StixExternalReference[] | undefined)?.find(
          (r) =>
            (r.source_name === "mitre-attack" || r.source_name === "mitre-ics-attack") &&
            r.external_id,
        );
        const externalId = extRef?.external_id || "";
        const url =
          extRef?.url ||
          (externalId
            ? `https://attack.mitre.org/techniques/${externalId.replace(".", "/")}`
            : undefined);

        // Map kill_chain_phases to tactic names
        const tacticNames: string[] = (
          (obj.kill_chain_phases as StixKillChainPhase[] | undefined) || []
        )
          .filter(
            (k) => k.kill_chain_name === "mitre-ics-attack" || k.kill_chain_name === "mitre-attack",
          )
          .map((k) => {
            const short = k.phase_name || "";
            const tactic = this.tactics.get(short);
            return tactic
              ? tactic.name
              : short.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
          });

        const technique: MitreTechnique = {
          id: obj.id,
          externalId,
          name: obj.name || "Unknown Technique",
          description: obj.description || "",
          tactics: tacticNames.length > 0 ? tacticNames : ["Uncategorized"],
          platforms: obj.x_mitre_platforms || ["ICS"],
          permissionsRequired: obj.x_mitre_permissions_required || [],
          dataSources: obj.x_mitre_data_sources || [],
          isSubtechnique: !!obj.x_mitre_is_subtechnique,
          isRevoked: !!obj.revoked,
          mitigations: [],
          url,
        };

        this.techniques.set(obj.id, technique);
        if (externalId) {
          // If already set by an active technique, don't let revoked overwrite it unless needed
          if (!this.techniquesByExternalId.has(externalId.toUpperCase()) || !technique.isRevoked) {
            this.techniquesByExternalId.set(externalId.toUpperCase(), technique);
          }
        }
      }

      // Pass 3: Map Relationships (Mitigations -> Techniques, Revoked-By)
      for (const rel of rawRelationships) {
        if (rel.relationship_type === "mitigates") {
          const tech = this.techniques.get(rel.target_ref);
          const mit = this.mitigations.get(rel.source_ref);
          if (tech && mit) {
            tech.mitigations = tech.mitigations || [];
            tech.mitigations.push({
              id: mit.id,
              name: mit.name,
              description: rel.description || mit.description,
            });
          }
        } else if (rel.relationship_type === "revoked-by") {
          const sourceTech = this.techniques.get(rel.source_ref);
          const targetTech = this.techniques.get(rel.target_ref);
          if (sourceTech && targetTech) {
            sourceTech.revokedBy = targetTech.externalId || targetTech.name;
          }
        }
      }

      this.loaded = true;
      return true;
    } catch (err) {
      console.error("[MITRE Parser] Error parsing STIX bundle:", err);
      return false;
    }
  }

  public getAllTechniques(includeRevoked: boolean = true): MitreTechnique[] {
    this.ensureLoaded();
    const all = Array.from(this.techniques.values());
    return includeRevoked ? all : all.filter((t) => !t.isRevoked);
  }

  public getTechnique(idOrExternalId: string): MitreTechnique | undefined {
    this.ensureLoaded();
    const upper = idOrExternalId.toUpperCase().trim();
    return this.techniquesByExternalId.get(upper) || this.techniques.get(idOrExternalId);
  }

  public searchTechniques(
    query?: string,
    tacticFilter?: string,
    includeRevoked: boolean = false,
  ): MitreTechnique[] {
    this.ensureLoaded();
    const cacheKey = `${query || ""}_${tacticFilter || ""}_${includeRevoked ? "1" : "0"}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached) return cached;

    let results = this.getAllTechniques(includeRevoked);

    if (tacticFilter && tacticFilter.trim() && tacticFilter !== "ALL") {
      const tf = tacticFilter.toLowerCase().trim();
      results = results.filter((t) => t.tactics.some((tac) => tac.toLowerCase().includes(tf)));
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(
        (t) =>
          t.externalId.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.platforms.some((p) => p.toLowerCase().includes(q)),
      );
    }

    if (this.searchCache.size >= 100) {
      const first = this.searchCache.keys().next().value;
      if (first) this.searchCache.delete(first);
    }
    this.searchCache.set(cacheKey, results);

    return results;
  }

  public getAllTactics(): MitreTactic[] {
    this.ensureLoaded();
    return Array.from(this.tactics.values());
  }

  public getSummary(): MitreCatalogSummary {
    this.ensureLoaded();
    if (this.cachedSummary) {
      return this.cachedSummary;
    }

    const tacticsCount: Record<string, number> = {};
    const platformsCount: Record<string, number> = {};

    for (const tech of this.techniques.values()) {
      if (tech.isRevoked) continue; // Count active for stats
      for (const tac of tech.tactics) {
        tacticsCount[tac] = (tacticsCount[tac] || 0) + 1;
      }
      for (const plat of tech.platforms) {
        platformsCount[plat] = (platformsCount[plat] || 0) + 1;
      }
    }

    this.cachedSummary = {
      totalTechniques: Array.from(this.techniques.values()).filter((t) => !t.isRevoked).length,
      totalTactics: this.tactics.size,
      totalMitigations: this.mitigations.size,
      tacticsList: Object.entries(tacticsCount).map(([name, count]) => ({ name, count })),
      platformsList: Object.entries(platformsCount).map(([name, count]) => ({ name, count })),
      specVersion: "2.1 (STIX) / ICS v19.2",
    };
    return this.cachedSummary;
  }

  private ensureLoaded(): void {
    if (!this.loaded) {
      this.load();
    }
  }
}

// Singleton instance
export const mitreParser = new MitreStixParser();
