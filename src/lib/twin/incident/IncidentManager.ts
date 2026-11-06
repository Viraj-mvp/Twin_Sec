/**
 * IncidentManager.ts
 *
 * Cyber-physical security incident lifecycle manager for TwinSec.
 * Coordinates incident state progression, binds detection evidence with physical
 * telemetry anomalies, maps MITRE ATT&CK for ICS TTPs, and computes MTTD.
 */

import type {
  IncidentRecord,
  DetectionAlert,
  IncidentStatus,
  DetectionSeverity,
} from "../TwinState";

export class IncidentManager {
  private incidents: Map<string, IncidentRecord> = new Map();
  private firstAttackTimestamp: number | null = null;
  private firstDetectionTimestamp: number | null = null;

  public notifyAttackInitiated(timestamp: number): void {
    if (this.firstAttackTimestamp === null) {
      this.firstAttackTimestamp = timestamp;
    }
  }

  /**
   * Ingest a detection alert, associating it with an existing active incident or spawning a new one.
   */
  public ingestDetection(alert: DetectionAlert): IncidentRecord {
    if (this.firstDetectionTimestamp === null) {
      this.firstDetectionTimestamp = alert.timestamp;
    }

    // Look for existing open incident for this asset or related domain
    let matched: IncidentRecord | undefined;
    for (const incident of this.incidents.values()) {
      if (incident.status !== "RESOLVED") {
        matched = incident;
        break;
      }
    }

    if (matched) {
      if (!matched.triggerDetections.includes(alert.id)) {
        matched.triggerDetections.push(alert.id);
      }
      if (!matched.affectedAssets.includes(alert.targetAssetId)) {
        matched.affectedAssets.push(alert.targetAssetId);
      }
      if (alert.mitreTechniqueId && !matched.mitreTechniques.includes(alert.mitreTechniqueId)) {
        matched.mitreTechniques.push(alert.mitreTechniqueId);
      }

      // Escalate severity if critical
      if (alert.severity === "CRITICAL") {
        matched.severity = "CRITICAL";
      }

      matched.timeline.push({
        timestamp: alert.timestamp,
        action: `Correlated Alert: ${alert.description} (z=${alert.zScore.toFixed(2)})`,
        actor: "system",
      });

      return matched;
    }

    // Create new incident
    const incidentId = `inc-${alert.timestamp.toFixed(0)}-${Math.random().toString(36).substring(2, 6)}`;
    const newIncident: IncidentRecord = {
      id: incidentId,
      title: `OT Process Anomaly: ${alert.variableName} deviation on ${alert.targetAssetId}`,
      severity: alert.severity,
      status: "OPEN",
      createdTime: alert.timestamp,
      affectedAssets: [alert.targetAssetId],
      triggerDetections: [alert.id],
      mitreTechniques: alert.mitreTechniqueId ? [alert.mitreTechniqueId] : [],
      timeline: [
        {
          timestamp: alert.timestamp,
          action: `Incident spawned: ${alert.description}`,
          actor: "system",
        },
      ],
    };

    this.incidents.set(incidentId, newIncident);
    return newIncident;
  }

  /**
   * Update incident lifecycle status.
   */
  public updateStatus(
    incidentId: string,
    status: IncidentStatus,
    timestamp: number,
    actor: "system" | "operator" | "attacker" | "automated_defense" = "operator",
    note?: string,
  ): boolean {
    const inc = this.incidents.get(incidentId);
    if (!inc) return false;

    inc.status = status;
    if (status === "CONTAINED" && !inc.containedTime) {
      inc.containedTime = timestamp;
    }
    if (status === "RESOLVED" && !inc.resolvedTime) {
      inc.resolvedTime = timestamp;
    }

    inc.timeline.push({
      timestamp,
      action: note || `Status transitioned to ${status}`,
      actor,
    });

    return true;
  }

  /**
   * Mark all open incidents as contained (e.g. after network isolation).
   */
  public markAllContained(timestamp: number, note: string = "All affected assets isolated"): void {
    for (const inc of this.incidents.values()) {
      if (inc.status === "OPEN" || inc.status === "INVESTIGATING") {
        this.updateStatus(inc.id, "CONTAINED", timestamp, "operator", note);
      }
    }
  }

  /**
   * Mark incidents resolved once process stabilizes.
   */
  public markAllResolved(
    timestamp: number,
    note: string = "Physical telemetry normalized to baseline",
  ): void {
    for (const inc of this.incidents.values()) {
      if (inc.status !== "RESOLVED") {
        this.updateStatus(inc.id, "RESOLVED", timestamp, "system", note);
      }
    }
  }

  /**
   * Compute MTTD in seconds.
   */
  public getMttd(): number | null {
    if (this.firstAttackTimestamp !== null && this.firstDetectionTimestamp !== null) {
      return Math.max(0, this.firstDetectionTimestamp - this.firstAttackTimestamp);
    }
    return null;
  }

  public getIncidents(): IncidentRecord[] {
    return Array.from(this.incidents.values());
  }

  public reset(): void {
    this.incidents.clear();
    this.firstAttackTimestamp = null;
    this.firstDetectionTimestamp = null;
  }
}
