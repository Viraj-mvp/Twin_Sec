# TwinSec Cyber-Physical Cyber Range & Incident Rehearsal Guide

Welcome to the **TwinSec Cyber Range**. This platform is designed for OT Security Operations, Grid Engineers, and Critical Infrastructure Defenders to train on and rehearse grid-down scenarios before they happen in physical control rooms.

---

## 1. Tactical Simulation Engine (Red-vs-Blue Model)

The TwinSec simulation engine models an active adversary attempting to cause physical disruption (e.g., generator rotor frequency instability, transformer bearing temperature cascades) while an operator deploys network-level and physical controls.

The simulation executes in four sequential tactical phases:

### Phase 1: Reconnaissance (RECON)

- **Goal:** Discover asset ports, running services, and firmware vulnerabilities.
- **Operation:** Select assets on the grid topology map and trigger discovery scans.
- **Tactical Terminal:** Run `scan <node_id>` to enumerate vulnerabilities.

### Phase 2: Network Exploitation (EXPLOIT)

- **Goal:** Construct a network exploit chain from the initial gateway subnet down to critical OT physical relays.
- **Operation:** Compromise scanned assets to establish lateral movement paths.
- **Tactical Terminal:** Run `exploit <node_id>` to compromise a vulnerable, scanned host.

### Phase 3: Incident Containment (DEFEND)

- **Goal:** Contain cascading physical outages as the timeline plays in real-time.
- **Operation:** Select compromised nodes and apply defensive mitigations.
- **Mitigation Types:**
  1. `ISOLATE`: Airgap the asset's network link to block lateral propagation.
  2. `PATCH`: Apply emergency firmware integrity patches to remediate vulnerabilities.
  3. `TRIP`: Issue local physical breaker failsafe trips on high-energy circuits.
- **Tactical Terminal:** Run `patch <node_id>`, `isolate <node_id>`, or `trip <node_id>`.

### Phase 4: Incident Post-Mortem (REVIEW)

- **Goal:** Audit operator decisions and review performance.
- **Analytics:** Generates MTTD (Mean Time to Detection), MTTR (Mean Time to Response), MW load shed, and financial damage estimates.
- **Artifacts:**
  - **Debrief Dossier (PDF):** Cryptographically signed printout of topology propagation paths, timeline logs, and decisions.
  - **SIEM Telemetry Logs (CSV):** Exportable telemetry datasets for offline SIEM analyzer training.

---

## 2. Secure Local Database Integration

TwinSec uses a local-first SQLite architecture powered by **Drizzle ORM** for credentials security and training run persistence. In production, this can migrate directly to Cloudflare D1.

### Database Schema Definition

The database contains three main tables defined in `src/lib/db/schema.ts`:

1. **`operators`**:
   - Stores registered grid defenders.
   - Fields: `id`, `callsign` (unique), `passwordHash`, `role` (default: "operator"), `createdAt`.

2. **`sessions`**:
   - Tracks active HttpOnly session tokens.
   - Fields: `id`, `token` (cryptographic UUID), `operatorId` (foreign key), `expiresAt`.

3. **`training_runs`**:
   - Archives operator training history and scores.
   - Fields: `id`, `operatorId` (optional, for guests), `sector`, `adversary`, `branch` (containment outcome), `mwShed`, `mttd` (seconds), `mttr` (seconds), `cost` (dollars), `score` (0-100), `shareUrl` (replay link), `createdAt`.

---

## 3. Cryptographic Replay Links & State Sharing

TwinSec uses client-side base64 hashes to encode exact replay states.

- At the end of a simulation, a payload containing `t` (simulation clock), `speed`, `selected` asset, `choices` made, and `interactions` history is JSON-serialized, URL-encoded, and base64-encoded.
- The link format: `http://localhost:3000/simulation?sector=power#s=<base64_state>`
- Any user visiting the replay link will hydrate the simulation state machine directly from the URL hash, allowing incident managers to review exact operator timelines.

---

## 4. Security Controls & Authorization

1. **HttpOnly Cookie Store:** Session tokens are stored in secure `HttpOnly`, `SameSite=Strict` cookies. This mitigates cross-site scripting (XSS) credential theft.
2. **Password Cryptography:** Operator passwords are secure-hashed via `bcryptjs` with a work factor of 10.
3. **SSR Hydration Guard:** Storage-backed user stores utilize dynamic, client-side mount hooks (`useEffect`) to avoid React server-side rendering (SSR) hydration mismatches.
