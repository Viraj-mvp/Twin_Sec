import * as fs from "fs";
import * as readline from "readline";

async function extract() {
  const summaryTxt = fs.readFileSync("dataset/hai/hai-23.05/summary_label1.txt", "utf-8");
  const regex =
    /\[\s*(\d+)\]\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/g;
  let m;
  const attackWindows = [];
  while ((m = regex.exec(summaryTxt)) !== null) {
    const idx = Number(m[1]);
    const start = m[2];
    const end = m[3];
    const startSec = Math.floor(new Date(start.replace(" ", "T") + "Z").getTime() / 1000) - 30;
    const endSec = Math.floor(new Date(end.replace(" ", "T") + "Z").getTime() / 1000) + 30;
    const padStart = new Date(startSec * 1000).toISOString().replace("T", " ").slice(0, 19);
    const padEnd = new Date(endSec * 1000).toISOString().replace("T", " ").slice(0, 19);
    attackWindows.push({ idx, start, end, padStart, padEnd });
  }

  const labelTxt = fs.readFileSync("dataset/hai/hai-23.05/label-test1.csv", "utf-8");
  const labelLines = labelTxt.split(/\r?\n/);
  const labels = new Map();
  for (let i = 1; i < labelLines.length; i++) {
    const line = labelLines[i].trim();
    if (!line) continue;
    const comma = line.indexOf(",");
    if (comma > 0) {
      labels.set(line.slice(0, comma).trim(), Number(line.slice(comma + 1).trim()) || 0);
    }
  }

  const dataFile = "dataset/hai/hai-23.05/hai-test1.csv";
  const stream = fs.createReadStream(dataFile, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let header = true;
  const windowsData = {};
  attackWindows.forEach((w) => {
    windowsData[w.idx] = [];
  });

  let idxP1_PIT01 = 20,
    idxP1_TIT01 = 35,
    idxP1_FT01 = 7,
    idxP1_LIT01 = 15;
  let idxP2_SIT01 = 51,
    idxP2_VIB = 53,
    idxP3_FIT01 = 62,
    idxP3_LIT01 = 66;
  let idxP4_PT01 = 78,
    idxP4_TT01 = 79;

  for await (const line of rl) {
    if (header) {
      header = false;
      const headers = line.split(",").map((c) => c.trim());
      idxP1_PIT01 = headers.indexOf("P1_PIT01");
      idxP1_TIT01 = headers.indexOf("P1_TIT01");
      idxP1_FT01 = headers.indexOf("P1_FT01");
      idxP1_LIT01 = headers.indexOf("P1_LIT01");
      idxP2_SIT01 = headers.indexOf("P2_SIT01");
      idxP2_VIB = headers.indexOf("P2_VIBTR01");
      idxP3_FIT01 = headers.indexOf("P3_FIT01");
      idxP3_LIT01 = headers.indexOf("P3_LIT01");
      idxP4_PT01 = headers.indexOf("P4_ST_PT01");
      idxP4_TT01 = headers.indexOf("P4_ST_TT01");
      continue;
    }

    const ts = line.slice(0, 19);
    for (const w of attackWindows) {
      if (ts >= w.padStart && ts <= w.padEnd) {
        if (windowsData[w.idx].length < 150) {
          const parts = line.split(",");
          windowsData[w.idx].push({
            timestamp: ts,
            label: labels.get(ts) || 0,
            p1_pressure: parseFloat(parseFloat(parts[idxP1_PIT01] || "0").toFixed(2)),
            p1_temperature: parseFloat(parseFloat(parts[idxP1_TIT01] || "0").toFixed(1)),
            p1_flow: parseFloat(parseFloat(parts[idxP1_FT01] || "0").toFixed(1)),
            p1_level: parseFloat(parseFloat(parts[idxP1_LIT01] || "0").toFixed(1)),
            p2_speed: parseFloat(parseFloat(parts[idxP2_SIT01] || "0").toFixed(1)),
            p2_vibration: parseFloat(parseFloat(parts[idxP2_VIB] || "0").toFixed(2)),
            p3_flow: parseFloat(parseFloat(parts[idxP3_FIT01] || "0").toFixed(1)),
            p3_level: parseFloat(parseFloat(parts[idxP3_LIT01] || "0").toFixed(1)),
            p4_steam_pressure: parseFloat(parseFloat(parts[idxP4_PT01] || "0").toFixed(1)),
            p4_steam_temperature: parseFloat(parseFloat(parts[idxP4_TT01] || "0").toFixed(1)),
          });
        }
      }
    }
  }

  const outPath = "src/lib/data/hai/hai-real-attack-windows.json";
  fs.writeFileSync(outPath, JSON.stringify(windowsData, null, 2), "utf-8");
  const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`Extraction complete! Written to ${outPath} (Size: ${sizeKb} KB)`);
  for (let i = 1; i <= 14; i++) {
    const list = windowsData[i] || [];
    const attacksCount = list.filter((r) => r.label === 1).length;
    console.log(`Attack #${i}: ${list.length} real samples, ${attacksCount} attack labels`);
  }
}

extract();
