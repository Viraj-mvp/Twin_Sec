# TwinSec Asset Generation Directives — Chalk Schematics

This document specifies the prompt schemas and asset mappings for generating the sector-specific chalk blueprint background schematics. This ensures consistent styling across all ranges.

---

## 🎨 Creative & Style Guidelines

- **Core Medium:** White chalk/pencil sketch on a dark slate chalkboard background.
- **Aesthetic Vibe:** Isometric architectural technical drawing, clean blueprint detailing, fine lines.
- **Theme Accent:** Glowing lime-green (`#bada55` or neon green/lime) cubes representing data node interfaces, connected with thin wireframes, similar to the reference blueprint images.
- **Composition:** Industrial infrastructure occupying the central frame, with technical annotations, labels, and vector arrows in white pencil font.

---

## 📋 Prompt Manifest

### 1. Oil & Gas Sector (`oil-gas.jpg`)

- **Prompt:**
  ```text
  A detailed white chalk pencil sketch on a dark slate chalkboard background of a petrochemical refinery with tall distillation columns, piping manifolds, and spherical storage tanks. Isometric view, architectural blueprint style, with some glowing lime-green highlighted nodes showing telemetry paths.
  ```
- **Output Target:** `src/assets/oil-gas.jpg`

### 2. Manufacturing Sector (`manufacturing.jpg`)

- **Prompt:**
  ```text
  A detailed white chalk pencil sketch on a dark slate chalkboard background of an industrial smart factory assembly line with robotic arms, conveyor belts, and manufacturing machines. Isometric view, architectural blueprint style, with glowing lime-green highlighted nodes on control systems.
  ```
- **Output Target:** `src/assets/manufacturing.jpg`

### 3. Port Sector (`port.jpg`)

- **Prompt:**
  ```text
  A detailed white chalk pencil sketch on a dark slate chalkboard background of a container shipping port terminal with gantry cranes, container stacks, and cargo berths. Isometric view, architectural blueprint style, with glowing lime-green highlighted nodes on cranes and stacks.
  ```
- **Output Target:** `src/assets/port.jpg`

### 4. Smart Building Sector (`smart-building.jpg`)

- **Prompt:**
  ```text
  A detailed white chalk pencil sketch on a dark slate chalkboard background of a modern skyscraper's building management system (BMS), showing cross-section ventilation ducts, elevators, and access control doors. Isometric view, architectural blueprint style, with glowing lime-green nodes on doors and HVAC vents.
  ```
- **Output Target:** `src/assets/smart-building.jpg`

### 5. Smart City Sector (`smart-city.jpg`)

- **Prompt:**
  ```text
  A detailed white chalk pencil sketch on a dark slate chalkboard background of a city traffic intersection layout with traffic lights, transit trains, and utility poles. Isometric view, architectural blueprint style, with glowing lime-green nodes on traffic lights and routing cabinets.
  ```
- **Output Target:** `src/assets/smart-city.jpg`

---

## 🛠️ Execution Pipeline

1. Overwrite the existing real-world image files in `src/assets/` using the generated assets.
2. In `src/routes/simulation.tsx`, map the `schematic` variable dynamically based on the active `sector` parameter.
3. Set the `water` sector to load `Muncipal.png`.
