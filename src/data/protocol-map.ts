/**
 * protocol-map.ts
 *
 * Protocol dissection data for the Packet Inspector panel.
 * Each entry maps an attack-phase tag to its associated protocol frame,
 * hex dump rows, and decoded field breakdown.
 */

export interface ProtocolDissection {
  proto: string;
  hex: string[];
  fields: { label: string; bytes: string; value: string }[];
}

export const PROTOCOL_MAP: Record<string, ProtocolDissection> = {
  "INITIAL ACCESS": {
    proto: "SMB2 / Spear-Phish Macro",
    hex: [
      "FC 00 00 00 00 00 00 00",
      "53 4D 42 32 00 00 00 00",
      "00 00 00 00 00 00 00 00",
      "41 63 74 69 6F 6E 3A 20",
      "72 75 6E 20 56 42 41 20",
    ],
    fields: [
      { label: "Proto", bytes: "53 4D 42 32", value: "SMB2" },
      { label: "Cmd", bytes: "00 05", value: "SESSION_SETUP" },
      { label: "Flags", bytes: "41 00 00 00", value: "SIGNED|ASYNC" },
    ],
  },
  "CREDENTIAL ACCESS": {
    proto: "Kerberos AS-REQ (Pass-the-Hash)",
    hex: [
      "6A 81 C7 30 81 C4 A1 03",
      "02 01 05 A2 03 02 01 0A",
      "A4 81 B7 30 81 B4 A0 07",
      "30 05 A0 03 02 01 17 A2",
    ],
    fields: [
      { label: "MsgType", bytes: "02 01 0A", value: "AS-REQ" },
      { label: "EType", bytes: "02 01 17", value: "RC4-HMAC" },
      { label: "NTLM Hash", bytes: "A4 81 B7", value: "aad3b435…" },
    ],
  },
  "LATERAL MOVEMENT": {
    proto: "Modbus TCP FC03 Read Holding",
    hex: ["00 01 00 00 00 06 01 03", "00 00 00 0A 00 00 00 00"],
    fields: [
      { label: "TxnID", bytes: "00 01", value: "0x0001" },
      { label: "UnitID", bytes: "01", value: "PLC-3" },
      { label: "Func", bytes: "03", value: "READ_HOLDING_REG" },
      { label: "StartAddr", bytes: "00 00", value: "0x0000" },
      { label: "Qty", bytes: "00 0A", value: "10 regs" },
    ],
  },
  COLLECTION: {
    proto: "S7comm Read SZL (Siemens)",
    hex: [
      "03 00 00 1F 02 F0 80 32",
      "01 00 00 01 00 00 0E 00",
      "00 04 01 12 0A 10 02 00",
      "01 00 01 84 00 00 00 00",
    ],
    fields: [
      { label: "TPKT", bytes: "03 00 00 1F", value: "len=31" },
      { label: "PDU", bytes: "32 01", value: "JOB" },
      { label: "ParamLen", bytes: "00 0E", value: "14 bytes" },
      { label: "Func", bytes: "04 01", value: "Read Var" },
    ],
  },
  IMPACT: {
    proto: "DNP3 Direct Operate (CROB)",
    hex: [
      "05 64 18 44 03 00 01 00",
      "5A C0 C1 03 0C 01 28 01",
      "00 00 00 41 01 00 00 00",
      "00 00 00 00 00 00 CC EE",
    ],
    fields: [
      { label: "Start", bytes: "05 64", value: "DNP3 sync" },
      { label: "Func", bytes: "03", value: "DIRECT_OP" },
      { label: "ObjHdr", bytes: "0C 01", value: "CROB" },
      { label: "CtrlCode", bytes: "41", value: "LATCH_ON" },
    ],
  },
  CONSEQUENCE: {
    proto: "IEC 60870-5-104 ASDU C_SC_NA_1",
    hex: ["68 0E 00 00 00 00 2D 01", "03 00 01 00 01 00 00 00"],
    fields: [
      { label: "Startbyte", bytes: "68", value: "0x68" },
      { label: "Length", bytes: "0E", value: "14" },
      { label: "TypeID", bytes: "2D", value: "C_SC_NA_1 (Single Cmd)" },
      { label: "IOA", bytes: "01 00 00", value: "Addr 1 (Breaker)" },
    ],
  },
};

/**
 * Look up a protocol dissection by attack-phase tag.
 * Falls back to LATERAL MOVEMENT if the tag isn't mapped.
 */
export function getProtocolForTag(tag: string): ProtocolDissection | null {
  return PROTOCOL_MAP[tag] ?? PROTOCOL_MAP["LATERAL MOVEMENT"] ?? null;
}
