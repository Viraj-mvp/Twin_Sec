/**
 * otcad.functions.ts
 *
 * TanStack Start server functions for OTCAD (Operational Technology Cyber Attack Database).
 */

import { createServerFn } from "@tanstack/react-start";
import { otcadParser } from "../data/otcad/otcad-parser";
import type { OtcadAttackRecord, OtcadSummary } from "../data/otcad/types";

export const getOtcadSummaryFn = createServerFn({ method: "GET" }).handler(async () => {
  return otcadParser.getSummary();
});

export const searchOtcadIncidentsFn = createServerFn({ method: "GET" })
  .validator(
    (params: {
      query?: string;
      industry?: string;
      attackType?: string;
      yearMin?: number;
      yearMax?: number;
      limit?: number;
    }) => params,
  )
  .handler(async ({ data }) => {
    const incidents = otcadParser.search(data);
    return {
      total: incidents.length,
      incidents,
    };
  });

export const getOtcadIncidentDetailFn = createServerFn({ method: "GET" })
  .validator((guid: string) => guid)
  .handler(async ({ data }) => {
    const record = otcadParser.getByGuid(data);
    if (!record) {
      return { found: false, incident: null };
    }
    return { found: true, incident: record };
  });
