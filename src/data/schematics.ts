import schematicPower from "@/assets/schematic-power.jpg";
import schematicWater from "@/assets/schematic-water.jpg";
import schematicRefinery from "@/assets/schematic-refinery.jpg";
import schematicManufacturing from "@/assets/schematic-manufacturing.jpg";
import schematicPort from "@/assets/schematic-port.jpg";
import schematicBuilding from "@/assets/schematic-building.jpg";
import schematicSmartCity from "@/assets/schematic-smartcity.jpg";

export const SECTOR_SCHEMATICS: Record<string, string> = {
  power: schematicPower,
  water: schematicWater,
  "oil-gas": schematicRefinery,
  manufacturing: schematicManufacturing,
  port: schematicPort,
  "smart-building": schematicBuilding,
  "smart-city": schematicSmartCity,
};

/**
 * Returns the high-resolution engineering schematic corresponding to an industrial sector.
 * Defaults to the power sector schematic if sector is undefined or unmapped.
 */
export function getSectorSchematic(sector?: string): string {
  if (!sector) return schematicPower;
  return SECTOR_SCHEMATICS[sector.toLowerCase()] ?? schematicPower;
}

export {
  schematicPower,
  schematicWater,
  schematicRefinery,
  schematicManufacturing,
  schematicPort,
  schematicBuilding,
  schematicSmartCity,
};
