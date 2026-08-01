import { SectorId } from "./auth-store";

interface SimEvent {
  t: number;
  tag: string;
  node: string;
  title: string;
  desc: string;
  sev: string;
}

// Helper to format simulation time to ISO-like relative timestamp
function formatSimTimestamp(offsetSec: number) {
  const date = new Date();
  date.setSeconds(date.getSeconds() - 3600 + offsetSec);
  return date.toISOString().replace("T", " ").replace("Z", " UTC");
}

// Determinstic hashing for IP addresses
function getIPForNode(nodeId: string): string {
  let hash = 0;
  for (let i = 0; i < nodeId.length; i++) {
    hash = nodeId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lastOctet = Math.abs(hash % 250) + 2; // 2-251
  return `192.168.88.${lastOctet}`;
}

export function generateTelemetryCSV(
  events: SimEvent[],
  activeIdx: number,
  sector: SectorId,
): string {
  const headers = [
    "Timestamp",
    "Source_IP",
    "Dest_IP",
    "Protocol",
    "Function_Code",
    "Register_Address",
    "Value",
    "MITRE_Tactic",
    "Severity",
    "Alert_Tag",
  ];

  const rows: string[][] = [headers];

  const targetIP = "192.168.88.10"; // SCADA Master/Historian
  const externalAttackerIP = "185.220.101.42";

  events.forEach((ev, i) => {
    if (i > activeIdx) return;

    const ts = formatSimTimestamp(ev.t);
    const nodeIP = getIPForNode(ev.node);

    // Map security lifecycle tag to network behaviors
    let src = nodeIP;
    let dst = targetIP;
    let proto = "TCP";
    let fc = "—";
    let reg = "—";
    let val = "—";
    let tactic = "—";

    switch (ev.tag) {
      case "INITIAL ACCESS":
        src = externalAttackerIP;
        dst = nodeIP;
        proto = "SMB2";
        fc = "SESSION_SETUP (0x05)";
        tactic = "Initial Access (TA0001)";
        break;
      case "CREDENTIAL ACCESS":
        src = nodeIP;
        dst = "192.168.88.2"; // Domain Controller
        proto = "Kerberos";
        fc = "AS-REQ (0x0A)";
        tactic = "Credential Access (TA0006)";
        break;
      case "LATERAL MOVEMENT":
        src = targetIP;
        dst = nodeIP;
        proto = "Modbus TCP";
        fc = "READ_HOLDING_REG (0x03)";
        reg = "0x0000";
        val = "10 regs";
        tactic = "Lateral Movement (TA0008)";
        break;
      case "COLLECTION":
        src = targetIP;
        dst = nodeIP;
        proto = "S7comm";
        fc = "READ_VAR (0x04)";
        reg = "DB1.DBX0.0";
        val = "8 bytes";
        tactic = "Collection (TA0009)";
        break;
      case "IMPACT":
        src = targetIP;
        dst = nodeIP;
        proto = "DNP3";
        fc = "DIRECT_OP (0x03)";
        reg = "CROB 12";
        val = "LATCH_ON";
        tactic = "Impact (TA0040)";
        break;
      case "CONSEQUENCE":
        src = nodeIP;
        dst = "192.168.88.15"; // RTU / Substation Loop
        proto = "IEC-104";
        fc = "SINGLE_CMD (0x2D)";
        reg = "IOA 1";
        val = "TRIP";
        tactic = "Inhibit Response Function (TA0039)";
        break;
      default:
        proto = "TCP/IP";
        tactic = "Execution (TA0002)";
        break;
    }

    rows.push([
      ts,
      src,
      dst,
      proto,
      fc,
      reg,
      val,
      tactic,
      ev.sev,
      `twinsec:${sector}:${ev.node}:${ev.tag.toLowerCase().replace(/ /g, "_")}`,
    ]);
  });

  return rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
}
