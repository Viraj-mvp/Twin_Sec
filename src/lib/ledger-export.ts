/**
 * ledger-export.ts
 *
 * Export utilities for TwinSec simulation run ledger data.
 * Supports downloading complete run ledger reports in JSON, CSV, and formatted HTML Dossier formats.
 */

import type { SectorId, ChoiceId, Decision } from "@/data/scenarios";
import type { EnrichedEvent } from "./simulation-graph";

export interface RunLedgerData {
  runId: string;
  timestamp: string;
  sector: SectorId;
  adversary: string;
  role: "RED" | "BLUE";
  choices: Record<string, ChoiceId>;
  decisions: readonly Decision[];
  terminalCommands: string[];
  isolatedNodes: string[];
  patchedNodes: string[];
  metrics: {
    mwShed: number;
    mttdFormatted: string;
    mttrFormatted: string;
    costFormatted: string;
    score: number;
    outcomeBranch: string;
    impactLabel: string;
    impactFormatted: string;
    physics: {
      speedHz: number;
      bearingC: number;
      pressure: number;
    };
  };
  activeEvents: EnrichedEvent[];
}

/**
 * Triggers a file download in the browser.
 */
function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports current run ledger data as raw structured JSON.
 */
export function exportRunLedgerJSON(data: RunLedgerData) {
  const jsonStr = JSON.stringify(data, null, 2);
  const filename = `twinsec_ledger_${data.sector}_${Date.now()}.json`;
  downloadFile(jsonStr, filename, "application/json");
}

/**
 * Exports current run ledger data as tabular CSV.
 */
export function exportRunLedgerCSV(data: RunLedgerData) {
  const rows: string[][] = [];

  // Header section
  rows.push(["TWINSEC INDUSTRIAL CYBER RANGE — RUN LEDGER AUDIT REPORT"]);
  rows.push(["Run ID", data.runId]);
  rows.push(["Timestamp", data.timestamp]);
  rows.push(["Sector", data.sector.toUpperCase()]);
  rows.push(["Adversary", data.adversary]);
  rows.push(["Exercise Role", data.role]);
  rows.push(["Containment Outcome", data.metrics.outcomeBranch]);
  rows.push(["Mitigation Score", `${data.metrics.score}%`]);
  rows.push(["MW Shed", `${data.metrics.mwShed} MW`]);
  rows.push(["Impact", data.metrics.impactFormatted]);
  rows.push(["MTTD / MTTR", `${data.metrics.mttdFormatted} / ${data.metrics.mttrFormatted}`]);
  rows.push(["Estimated Financial Damage", data.metrics.costFormatted]);
  rows.push([]);

  // Isolated & Patched Nodes
  rows.push(["ISOLATED NODES", data.isolatedNodes.join("; ") || "None"]);
  rows.push(["PATCHED NODES", data.patchedNodes.join("; ") || "None"]);
  rows.push([]);

  // Operator Decisions
  rows.push(["DECISION TIMELINE"]);
  rows.push(["Decision ID", "Trigger", "Choice Made"]);
  data.decisions.forEach((d) => {
    const choice = data.choices[d.id] || "NO_ACTION";
    rows.push([d.id, d.trigger, choice]);
  });
  rows.push([]);

  // Terminal Commands Executed
  rows.push(["KALI CLI COMMAND HISTORY"]);
  rows.push(["Index", "Command Line"]);
  data.terminalCommands.forEach((cmd, idx) => {
    rows.push([String(idx + 1), cmd]);
  });
  rows.push([]);

  // Incident Events
  rows.push(["SIMULATION SCENARIO EVENT TIMELINE"]);
  rows.push([
    "Timestamp (s)",
    "Target Node",
    "Severity",
    "Event Title",
    "Execution Status",
    "Detail",
  ]);
  data.activeEvents.forEach((ev) => {
    rows.push([
      String(ev.t),
      ev.node,
      ev.sev,
      `"${ev.title.replace(/"/g, '""')}"`,
      ev.status,
      `"${ev.statusDetail.replace(/"/g, '""')}"`,
    ]);
  });

  const csvStr = rows.map((r) => r.join(",")).join("\n");
  const filename = `twinsec_ledger_${data.sector}_${Date.now()}.csv`;
  downloadFile(csvStr, filename, "text/csv;charset=utf-8;");
}

/**
 * Exports current run ledger data as a styled, self-contained HTML Executive Debrief Dossier.
 */
export function exportRunLedgerReport(data: RunLedgerData) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TwinSec Incident Debrief Dossier — ${data.sector.toUpperCase()}</title>
  <style>
    body {
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      background-color: #080a0d;
      color: #e2e8f0;
      margin: 0;
      padding: 40px;
      line-height: 1.6;
    }
    .header {
      border-bottom: 2px solid #bfff2e;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .title {
      font-size: 28px;
      font-weight: 900;
      color: #bfff2e;
      margin: 0 0 8px 0;
      letter-spacing: 1px;
    }
    .subtitle {
      font-size: 13px;
      color: #94a3b8;
      text-transform: uppercase;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    .card {
      background: #11151c;
      border: 1px solid #1e293b;
      padding: 16px;
    }
    .card-label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .card-val {
      font-size: 24px;
      font-weight: 800;
      color: #bfff2e;
    }
    h2 {
      font-size: 16px;
      color: #bfff2e;
      border-bottom: 1px solid #334155;
      padding-bottom: 8px;
      margin-top: 30px;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #1e293b;
      padding: 10px 12px;
      text-align: left;
    }
    th {
      background: #0f172a;
      color: #94a3b8;
      font-size: 11px;
      text-transform: uppercase;
    }
    tr:nth-child(even) {
      background: #0d1117;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 10px;
      font-weight: bold;
      border-radius: 2px;
    }
    .badge-executed { background: #7f1d1d; color: #fca5a5; }
    .badge-blocked { background: #064e3b; color: #6ee7b7; }
    .badge-patched { background: #1e3a8a; color: #93c5fd; }
    .badge-pending { background: #334155; color: #cbd5e1; }
    .footer {
      margin-top: 50px;
      border-top: 1px solid #1e293b;
      padding-top: 15px;
      font-size: 11px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">TWINSEC // EXERCISE INCIDENT DEBRIEF DOSSIER</div>
    <div class="subtitle">CONFIDENTIAL · OPERATIONAL TECHNOLOGY INCIDENT AUDIT LEDGER · SECTOR: ${data.sector.toUpperCase()}</div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-label">CONTAINMENT BRANCH</div>
      <div class="card-val">${data.metrics.outcomeBranch}</div>
    </div>
    <div class="card">
      <div class="card-label">MITIGATION SCORE</div>
      <div class="card-val">${data.metrics.score}%</div>
    </div>
    <div class="card">
      <div class="card-label">MTTD / MTTR</div>
      <div class="card-val" style="font-size: 18px;">${data.metrics.mttdFormatted} / ${data.metrics.mttrFormatted}</div>
    </div>
    <div class="card">
      <div class="card-label">ESTIMATED COST</div>
      <div class="card-val">${data.metrics.costFormatted}</div>
    </div>
  </div>

  <h2>Run Parameters</h2>
  <table>
    <tr><th>Parameter</th><th>Value</th></tr>
    <tr><td>Run Identifier</td><td>${data.runId}</td></tr>
    <tr><td>Execution Timestamp</td><td>${data.timestamp}</td></tr>
    <tr><td>Target Sector</td><td>${data.sector.toUpperCase()}</td></tr>
    <tr><td>Adversary Group</td><td>${data.adversary}</td></tr>
    <tr><td>Exercise Role</td><td>${data.role}</td></tr>
    <tr><td>Air-Gapped Isolated Assets</td><td>${data.isolatedNodes.join(", ") || "None"}</td></tr>
    <tr><td>Firmware Patched Assets</td><td>${data.patchedNodes.join(", ") || "None"}</td></tr>
  </table>

  <h2>Executed Kali Terminal Commands (${data.terminalCommands.length})</h2>
  <table>
    <thead><tr><th>#</th><th>Command String</th></tr></thead>
    <tbody>
      ${
        data.terminalCommands.length === 0
          ? '<tr><td colspan="2" style="color: #64748b; text-align: center;">No terminal commands executed during run</td></tr>'
          : data.terminalCommands
              .map((cmd, i) => `<tr><td>${i + 1}</td><td><code>${cmd}</code></td></tr>`)
              .join("")
      }
    </tbody>
  </table>

  <h2>Scenario Event Execution Log (${data.activeEvents.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Time</th>
        <th>Target Asset</th>
        <th>Severity</th>
        <th>Event Title</th>
        <th>Status</th>
        <th>Status Detail</th>
      </tr>
    </thead>
    <tbody>
      ${data.activeEvents
        .map((ev) => {
          let badgeClass = "badge-pending";
          if (ev.status === "EXECUTED") badgeClass = "badge-executed";
          else if (ev.status === "BLOCKED_AIRGAP" || ev.status === "PREVENTED_UPSTREAM")
            badgeClass = "badge-blocked";
          else if (ev.status === "PATCHED") badgeClass = "badge-patched";

          return `<tr>
            <td>t=${ev.t}s</td>
            <td><strong>${ev.node.toUpperCase()}</strong></td>
            <td>${ev.sev}</td>
            <td>${ev.title}</td>
            <td><span class="badge ${badgeClass}">${ev.status}</span></td>
            <td>${ev.statusDetail}</td>
          </tr>`;
        })
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    <span>TWINSEC CYBER-PHYSICAL SIMULATION ENGINE v1.0</span>
    <span>AUTHENTICATED INCIDENT REPORT</span>
  </div>
</body>
</html>`;

  const filename = `twinsec_debrief_dossier_${data.sector}_${Date.now()}.html`;
  downloadFile(html, filename, "text/html;charset=utf-8;");
}
