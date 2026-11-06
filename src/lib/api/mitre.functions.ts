/**
 * mitre.functions.ts
 *
 * TanStack Start server functions for MITRE ATT&CK for ICS STIX 2.1 dataset.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { mitreParser } from "../data/mitre/mitre-stix-parser";
import type { MitreTechnique, MitreCatalogSummary } from "../data/mitre/types";

export const getMitreSummaryFn = createServerFn({ method: "GET" }).handler(async () => {
  return mitreParser.getSummary();
});

export const searchMitreTechniquesFn = createServerFn({ method: "GET" })
  .validator((params: { query?: string; tactic?: string; includeRevoked?: boolean }) => params)
  .handler(async ({ data }) => {
    const results = mitreParser.searchTechniques(
      data.query,
      data.tactic,
      data.includeRevoked ?? false,
    );
    return {
      total: results.length,
      techniques: results,
    };
  });

export const getMitreTechniqueDetailFn = createServerFn({ method: "GET" })
  .validator((idOrExternalId: string) => idOrExternalId)
  .handler(async ({ data }) => {
    const technique = mitreParser.getTechnique(data);
    if (!technique) {
      return { found: false, technique: null };
    }
    return { found: true, technique };
  });

export const getMitreTacticsFn = createServerFn({ method: "GET" }).handler(async () => {
  return mitreParser.getAllTactics();
});
