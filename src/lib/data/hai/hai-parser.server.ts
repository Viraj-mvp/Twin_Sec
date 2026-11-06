import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import type { HaiAttackPeriod, HaiDatasetStats, HaiTelemetryRow, HaiWindowQuery } from "./types";

const ATTACK_DESCRIPTIONS: Record<
  number,
  { process: HaiAttackPeriod["affectedProcess"]; desc: string }
> = {
  1: {
    process: "Boiler (P1)",
    desc: "Boiler Feed Water Flow Control valve (P1_FCV01) override causing water level fluctuations.",
  },
  2: {
    process: "Turbine (P2)",
    desc: "Turbine Governor Valve & Rotor Speed (P2_SIT01) setpoint manipulation.",
  },
  3: {
    process: "Water Treatment (P3)",
    desc: "Chemical dosing rate and flow meter (P3_FIT01) spoofing.",
  },
  4: {
    process: "Boiler (P1)",
    desc: "Boiler steam drum pressure transmitter (P1_PIT01) offset injection.",
  },
  5: {
    process: "Turbine (P2)",
    desc: "Turbine bearing vibration (P2_VIBTR01) anomaly and frequency wobble.",
  },
  6: {
    process: "Boiler (P1)",
    desc: "Boiler liquid level (P1_LIT01) sensor spoofing causing heater dry-run risk.",
  },
  7: {
    process: "Multi-Stage",
    desc: "Multi-loop cascade attack spanning Boiler feed and Steam Turbine governor.",
  },
  8: {
    process: "Thermal Power (P4)",
    desc: "Steam turbine output temperature (P4_ST_TT01) overheat excursion.",
  },
  9: {
    process: "Water Treatment (P3)",
    desc: "Water treatment dosing valve throttling inducing disinfectant deficiency.",
  },
  10: {
    process: "Boiler (P1)",
    desc: "High-pressure safety relief valve (P1_PCV02) trip override.",
  },
  11: {
    process: "Turbine (P2)",
    desc: "Rotor speed desynchronization (P2_SIT01) attempting mechanical resonance.",
  },
  12: {
    process: "Boiler (P1)",
    desc: "Feed water pump discharge pressure drop triggering cavitation.",
  },
  13: {
    process: "Water Treatment (P3)",
    desc: "Storage reservoir liquid level sensor freeze with continuous pump feed.",
  },
  14: {
    process: "Multi-Stage",
    desc: "Full-scale cyber-physical attack cascading across all 4 industrial loops.",
  },
};

export class HaiDataParser {
  private baseDir: string;
  private attackPeriods: HaiAttackPeriod[] = [];
  private labelsByTimestamp: Map<string, number> = new Map();
  private isLoaded: boolean = false;
  private headerColumns: string[] = [];
  private columnIndices: Record<string, number> = {};
  private attackWindowCache: Map<
    number,
    {
      rows: HaiTelemetryRow[];
      attackPeriod?: HaiAttackPeriod;
      queryStartTime: string;
      queryEndTime: string;
      totalAvailable: number;
    }
  > = new Map();
  private queryCache: Map<
    string,
    {
      rows: HaiTelemetryRow[];
      attackPeriod?: HaiAttackPeriod;
      queryStartTime: string;
      queryEndTime: string;
      totalAvailable: number;
    }
  > = new Map();

  constructor(customDir?: string) {
    this.baseDir =
      customDir ||
      process.env.HAI_DATASET_DIR ||
      path.resolve(process.cwd(), "dataset", "hai", "hai-23.05");
  }

  public init(): boolean {
    if (this.isLoaded) return true;

    try {
      const summaryFile = path.resolve(this.baseDir, "summary_label1.txt");
      const labelFile = path.resolve(this.baseDir, "label-test1.csv");
      const dataFile = path.resolve(this.baseDir, "hai-test1.csv");

      if (!fs.existsSync(summaryFile) || !fs.existsSync(labelFile) || !fs.existsSync(dataFile)) {
        console.warn(`[HAI Parser] Required dataset files missing in: ${this.baseDir}`);
        return false;
      }

      // 1. Parse summary_label1.txt
      const summaryTxt = fs.readFileSync(summaryFile, "utf-8");
      const regex =
        /\[\s*(\d+)\]\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(\d{2}:\d{2}:\d{2})/g;
      let match;
      this.attackPeriods = [];

      while ((match = regex.exec(summaryTxt)) !== null) {
        const idx = Number(match[1]);
        const start = match[2];
        const end = match[3];
        const durFormatted = match[4];
        const [h, m, s] = durFormatted.split(":").map(Number);
        const durationSec = h * 3600 + m * 60 + s;

        const info = ATTACK_DESCRIPTIONS[idx] || {
          process: "Multi-Stage" as const,
          desc: `Industrial cyber attack period #${idx}`,
        };

        this.attackPeriods.push({
          index: idx,
          startTime: start,
          endTime: end,
          durationSeconds: durationSec,
          durationFormatted: durFormatted,
          affectedProcess: info.process,
          description: info.desc,
        });
      }

      // 2. Load ground truth labels from label-test1.csv
      const labelTxt = fs.readFileSync(labelFile, "utf-8");
      const labelLines = labelTxt.split(/\r?\n/);
      this.labelsByTimestamp.clear();

      for (let i = 1; i < labelLines.length; i++) {
        const line = labelLines[i].trim();
        if (!line) continue;
        const commaIdx = line.indexOf(",");
        if (commaIdx > 0) {
          const ts = line.slice(0, commaIdx).trim();
          const lbl = Number(line.slice(commaIdx + 1).trim()) || 0;
          this.labelsByTimestamp.set(ts, lbl);
        }
      }

      // 3. Inspect header of hai-test1.csv
      const fd = fs.openSync(dataFile, "r");
      const buffer = Buffer.alloc(4096);
      fs.readSync(fd, buffer, 0, 4096, 0);
      fs.closeSync(fd);

      const headerLine = buffer.toString("utf-8").split(/\r?\n/)[0];
      this.headerColumns = headerLine.split(",").map((c) => c.trim());
      this.columnIndices = {};
      this.headerColumns.forEach((col, idx) => {
        this.columnIndices[col] = idx;
      });

      this.isLoaded = true;
      return true;
    } catch (err) {
      console.error("[HAI Parser] Initialization error:", err);
      return false;
    }
  }

  public getStats(): HaiDatasetStats {
    this.ensureInit();
    const totalAttackSec = this.attackPeriods.reduce((acc, a) => acc + a.durationSeconds, 0);
    const totalSec = 54000; // 15 hours * 3600

    return {
      datasetName: "HAI (HIL-based Augmented ICS Security Dataset) v23.05",
      fileName: "hai-test1.csv",
      startTime: "2022-08-12 16:00:01",
      endTime: "2022-08-13 07:00:00",
      durationHours: 15.0,
      totalRows: 54000,
      totalColumns: this.headerColumns.length || 87,
      attackCount: this.attackPeriods.length,
      totalAttackSeconds: totalAttackSec,
      attackPercentage: parseFloat(((totalAttackSec / totalSec) * 100).toFixed(2)),
      attackPeriods: this.attackPeriods,
    };
  }

  public getAttackPeriods(): HaiAttackPeriod[] {
    this.ensureInit();
    return this.attackPeriods;
  }

  /**
   * Fast window reader: fetches telemetry lines from hai-test1.csv within time range or around attack
   */
  public async getTelemetryWindow(query: HaiWindowQuery): Promise<{
    rows: HaiTelemetryRow[];
    attackPeriod?: HaiAttackPeriod;
    queryStartTime: string;
    queryEndTime: string;
    totalAvailable: number;
  }> {
    this.ensureInit();

    // Fast cache check for standard attack index replay queries (<0.1ms return)
    if (
      query.attackIndex &&
      query.attackIndex > 0 &&
      (!query.step || query.step === 1) &&
      (!query.limit || query.limit >= 1000)
    ) {
      const cached = this.attackWindowCache.get(query.attackIndex);
      if (cached) {
        return cached;
      }
    }

    const cacheKey = `${query.attackIndex || 0}_${query.startTime || ""}_${query.durationSeconds || 0}_${query.step || 1}_${query.limit || 1000}`;
    const cachedQuery = this.queryCache.get(cacheKey);
    if (cachedQuery) {
      return cachedQuery;
    }

    const dataFile = path.resolve(this.baseDir, "hai-test1.csv");
    let targetStart = query.startTime;
    let targetDuration = query.durationSeconds || 300; // Default 5 minutes
    let attackPeriod: HaiAttackPeriod | undefined;

    if (query.attackIndex && query.attackIndex > 0) {
      attackPeriod = this.attackPeriods.find((a) => a.index === query.attackIndex);
      if (attackPeriod) {
        // Center around attack with 60s baseline padding before and after
        const startSec = this.timestampToSeconds(attackPeriod.startTime) - 60;
        targetStart = this.secondsToTimestamp(startSec);
        targetDuration = attackPeriod.durationSeconds + 120;
      }
    }

    if (!targetStart) {
      // Default to first attack window
      const a1 = this.attackPeriods[0];
      if (a1) {
        const startSec = this.timestampToSeconds(a1.startTime) - 45;
        targetStart = this.secondsToTimestamp(startSec);
        targetDuration = a1.durationSeconds + 90;
        attackPeriod = a1;
      } else {
        targetStart = "2022-08-12 16:24:00";
      }
    }

    const startSec = this.timestampToSeconds(targetStart);
    const endSec = startSec + targetDuration;
    const targetEnd = this.secondsToTimestamp(endSec);
    const step = Math.max(1, query.step || 1);
    const limit = query.limit || 1000;

    const rows: HaiTelemetryRow[] = [];
    const stream = fs.createReadStream(dataFile, { encoding: "utf-8" });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    let isHeader = true;
    let matchedCount = 0;

    // Fast column index lookups
    const idxP1_PIT01 = this.columnIndices["P1_PIT01"] ?? 20;
    const idxP1_TIT01 = this.columnIndices["P1_TIT01"] ?? 35;
    const idxP1_FT01 = this.columnIndices["P1_FT01"] ?? 7;
    const idxP1_LIT01 = this.columnIndices["P1_LIT01"] ?? 15;
    const idxP2_SIT01 = this.columnIndices["P2_SIT01"] ?? 51;
    const idxP2_VIB = this.columnIndices["P2_VIBTR01"] ?? 53;
    const idxP3_FIT01 = this.columnIndices["P3_FIT01"] ?? 62;
    const idxP3_LIT01 = this.columnIndices["P3_LIT01"] ?? 66;
    const idxP4_PT01 = this.columnIndices["P4_ST_PT01"] ?? 78;
    const idxP4_TT01 = this.columnIndices["P4_ST_TT01"] ?? 79;

    for await (const line of rl) {
      if (isHeader) {
        isHeader = false;
        continue;
      }

      // Fast timestamp extraction: first 19 chars
      const ts = line.slice(0, 19);
      if (ts < targetStart) {
        continue;
      }
      if (ts > targetEnd) {
        break; // Passed window, terminate stream early
      }

      matchedCount++;
      if (matchedCount % step !== 0) {
        continue;
      }

      const cols = line.split(",");
      const label = (this.labelsByTimestamp.get(ts) as 0 | 1) ?? 0;

      rows.push({
        timestamp: ts,
        label,
        p1_pressure: parseFloat(cols[idxP1_PIT01]) || 0,
        p1_temperature: parseFloat(cols[idxP1_TIT01]) || 0,
        p1_flow: parseFloat(cols[idxP1_FT01]) || 0,
        p1_level: parseFloat(cols[idxP1_LIT01]) || 0,
        p2_speed: parseFloat(cols[idxP2_SIT01]) || 0,
        p2_vibration: parseFloat(cols[idxP2_VIB]) || 0,
        p3_flow: parseFloat(cols[idxP3_FIT01]) || 0,
        p3_level: parseFloat(cols[idxP3_LIT01]) || 0,
        p4_steam_pressure: parseFloat(cols[idxP4_PT01]) || 0,
        p4_steam_temperature: parseFloat(cols[idxP4_TT01]) || 0,
      });

      if (rows.length >= limit) {
        break;
      }
    }

    rl.close();
    stream.destroy();

    const result = {
      rows,
      attackPeriod,
      queryStartTime: targetStart,
      queryEndTime: targetEnd,
      totalAvailable: matchedCount,
    };

    if (
      query.attackIndex &&
      query.attackIndex > 0 &&
      (!query.step || query.step === 1) &&
      (!query.limit || query.limit >= 1000)
    ) {
      this.attackWindowCache.set(query.attackIndex, result);
    }
    if (this.queryCache.size >= 60) {
      const firstKey = this.queryCache.keys().next().value;
      if (firstKey) this.queryCache.delete(firstKey);
    }
    this.queryCache.set(cacheKey, result);

    return result;
  }

  private timestampToSeconds(ts: string): number {
    const d = new Date(ts.replace(" ", "T") + "Z");
    return Math.floor(d.getTime() / 1000);
  }

  private secondsToTimestamp(sec: number): string {
    const d = new Date(sec * 1000);
    return d.toISOString().replace("T", " ").slice(0, 19);
  }

  private ensureInit(): void {
    if (!this.isLoaded) {
      this.init();
    }
  }
}

export const haiDataParser = new HaiDataParser();
