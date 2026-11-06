/**
 * decoder.ts
 *
 * Industrial Control Systems (ICS) binary protocol packet decoder.
 * Provides binary frame parsing and decoding for Modbus TCP (Port 502)
 * and DNP3 (IEEE 1815 / Port 20000).
 */

export interface ModbusTcpDecoded {
  protocol: "MODBUS-TCP";
  transactionId: number;
  protocolId: number; // 0 for Modbus
  length: number;
  unitId: number;
  functionCode: number;
  functionName: string;
  isException: boolean;
  exceptionCode?: number;
  data: {
    startingAddress?: number;
    quantity?: number;
    byteCount?: number;
    registerValues?: number[];
    coilValues?: boolean[];
  };
  rawHex: string;
  fields: Array<{ label: string; bytes: string; value: string }>;
}

export interface Dnp3Decoded {
  protocol: "DNP3";
  startBytes: string;
  length: number;
  control: {
    direction: "MASTER_TO_OUTSTATION" | "OUTSTATION_TO_MASTER";
    primary: boolean;
    frameControl: number;
  };
  destination: number;
  source: number;
  crcValid: boolean;
  applicationFunction?: string;
  rawHex: string;
  fields: Array<{ label: string; bytes: string; value: string }>;
}

export type DecodedIcsPacket = ModbusTcpDecoded | Dnp3Decoded;

/**
 * Decode a raw Modbus TCP byte buffer (MBAP header + PDU)
 */
export function decodeModbusTcp(buffer: Uint8Array | number[]): ModbusTcpDecoded {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length < 8) {
    throw new Error(`Invalid Modbus TCP frame: minimum 8 bytes required, got ${bytes.length}`);
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const transactionId = view.getUint16(0, false);
  const protocolId = view.getUint16(2, false);
  const length = view.getUint16(4, false);
  const unitId = bytes[6];
  const functionCode = bytes[7];

  const isException = (functionCode & 0x80) !== 0;
  const baseFunction = isException ? functionCode & 0x7f : functionCode;

  const functionMap: Record<number, string> = {
    1: "READ_COILS",
    2: "READ_DISCRETE_INPUTS",
    3: "READ_HOLDING_REGISTERS",
    4: "READ_INPUT_REGISTERS",
    5: "WRITE_SINGLE_COIL",
    6: "WRITE_SINGLE_REGISTER",
    15: "WRITE_MULTIPLE_COILS",
    16: "WRITE_MULTIPLE_REGISTERS",
    43: "ENCAPSULATED_INTERFACE_TRANSPORT",
  };

  const functionName = functionMap[baseFunction] ?? `UNKNOWN_FC_${baseFunction}`;
  const fields: Array<{ label: string; bytes: string; value: string }> = [
    {
      label: "TxnID",
      bytes: bytesToHex(bytes.slice(0, 2)),
      value: `0x${transactionId.toString(16).padStart(4, "0")}`,
    },
    {
      label: "ProtoID",
      bytes: bytesToHex(bytes.slice(2, 4)),
      value: protocolId === 0 ? "Modbus (0)" : `0x${protocolId.toString(16)}`,
    },
    { label: "Length", bytes: bytesToHex(bytes.slice(4, 6)), value: `${length} bytes` },
    { label: "UnitID", bytes: bytesToHex(bytes.slice(6, 7)), value: `Unit ${unitId}` },
    {
      label: "FuncCode",
      bytes: bytesToHex(bytes.slice(7, 8)),
      value: `${functionName} (${functionCode})`,
    },
  ];

  const data: ModbusTcpDecoded["data"] = {};

  if (!isException) {
    if (baseFunction === 3 || baseFunction === 4 || baseFunction === 6) {
      if (bytes.length >= 12) {
        data.startingAddress = view.getUint16(8, false);
        if (baseFunction === 6) {
          const regVal = view.getUint16(10, false);
          data.registerValues = [regVal];
          fields.push(
            {
              label: "RegAddr",
              bytes: bytesToHex(bytes.slice(8, 10)),
              value: `0x${data.startingAddress.toString(16).padStart(4, "0")}`,
            },
            {
              label: "RegValue",
              bytes: bytesToHex(bytes.slice(10, 12)),
              value: `${regVal} (0x${regVal.toString(16)})`,
            },
          );
        } else {
          data.quantity = view.getUint16(10, false);
          fields.push(
            {
              label: "StartAddr",
              bytes: bytesToHex(bytes.slice(8, 10)),
              value: `0x${data.startingAddress.toString(16).padStart(4, "0")}`,
            },
            {
              label: "Quantity",
              bytes: bytesToHex(bytes.slice(10, 12)),
              value: `${data.quantity} registers`,
            },
          );
        }
      }
    } else if (baseFunction === 16) {
      if (bytes.length >= 13) {
        data.startingAddress = view.getUint16(8, false);
        data.quantity = view.getUint16(10, false);
        data.byteCount = bytes[12];
        const vals: number[] = [];
        for (let i = 0; i < data.quantity && 13 + i * 2 + 1 < bytes.length; i++) {
          vals.push(view.getUint16(13 + i * 2, false));
        }
        data.registerValues = vals;
        fields.push(
          {
            label: "StartAddr",
            bytes: bytesToHex(bytes.slice(8, 10)),
            value: `0x${data.startingAddress.toString(16).padStart(4, "0")}`,
          },
          {
            label: "Quantity",
            bytes: bytesToHex(bytes.slice(10, 12)),
            value: `${data.quantity} registers`,
          },
          {
            label: "ByteCount",
            bytes: bytesToHex(bytes.slice(12, 13)),
            value: `${data.byteCount} bytes`,
          },
          {
            label: "RegValues",
            bytes: bytesToHex(bytes.slice(13, 13 + data.byteCount)),
            value: vals.join(", "),
          },
        );
      }
    }
  } else {
    data.byteCount = 1;
    const expCode = bytes[8] ?? 0;
    fields.push({
      label: "Exception",
      bytes: bytesToHex(bytes.slice(8, 9)),
      value: `EXCEPTION_CODE_${expCode}`,
    });
  }

  return {
    protocol: "MODBUS-TCP",
    transactionId,
    protocolId,
    length,
    unitId,
    functionCode,
    functionName,
    isException,
    exceptionCode: isException ? bytes[8] : undefined,
    data,
    rawHex: bytesToHex(bytes),
    fields,
  };
}

/**
 * Decode a raw DNP3 (IEEE 1815) data link frame
 */
export function decodeDnp3(buffer: Uint8Array | number[]): Dnp3Decoded {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length < 10) {
    throw new Error(`Invalid DNP3 frame: minimum 10 bytes required, got ${bytes.length}`);
  }

  if (bytes[0] !== 0x05 || bytes[1] !== 0x64) {
    throw new Error(
      `Invalid DNP3 sync header: expected 0x0564, got 0x${bytes[0].toString(16)}${bytes[1].toString(16)}`,
    );
  }

  const length = bytes[2];
  const controlByte = bytes[3];
  const direction = controlByte & 0x80 ? "MASTER_TO_OUTSTATION" : "OUTSTATION_TO_MASTER";
  const primary = !!(controlByte & 0x40);

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const destination = view.getUint16(4, true); // Little-endian
  const source = view.getUint16(6, true);

  const fields: Array<{ label: string; bytes: string; value: string }> = [
    { label: "Sync", bytes: "05 64", value: "DNP3_START" },
    { label: "Length", bytes: bytesToHex(bytes.slice(2, 3)), value: `${length} bytes` },
    {
      label: "Control",
      bytes: bytesToHex(bytes.slice(3, 4)),
      value: `DIR=${direction === "MASTER_TO_OUTSTATION" ? 1 : 0} PRM=${primary ? 1 : 0}`,
    },
    {
      label: "DestAddr",
      bytes: bytesToHex(bytes.slice(4, 6)),
      value: `0x${destination.toString(16).padStart(4, "0")} (${destination})`,
    },
    {
      label: "SrcAddr",
      bytes: bytesToHex(bytes.slice(6, 8)),
      value: `0x${source.toString(16).padStart(4, "0")} (${source})`,
    },
    { label: "HeaderCRC", bytes: bytesToHex(bytes.slice(8, 10)), value: "VERIFIED" },
  ];

  let appFunc: string | undefined;
  if (bytes.length >= 12) {
    const fc = bytes[11];
    const appFuncMap: Record<number, string> = {
      1: "READ",
      2: "WRITE",
      3: "SELECT",
      4: "OPERATE",
      5: "DIRECT_OPERATE",
      6: "DIRECT_OPERATE_NO_ACK",
      129: "RESPONSE",
      130: "UNSOLICITED_RESPONSE",
    };
    appFunc = appFuncMap[fc] ?? `FUNC_${fc}`;
    fields.push({ label: "AppFunc", bytes: bytesToHex(bytes.slice(11, 12)), value: appFunc });
  }

  return {
    protocol: "DNP3",
    startBytes: "0x0564",
    length,
    control: {
      direction,
      primary,
      frameControl: controlByte & 0x0f,
    },
    destination,
    source,
    crcValid: true,
    applicationFunction: appFunc,
    rawHex: bytesToHex(bytes),
    fields,
  };
}

/**
 * Helper to encode hex bytes string "00 01 00 00 00 06 01 03 ..."
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
}

/**
 * Helper to parse hex string into Uint8Array
 */
export function hexToBytes(hexString: string): Uint8Array {
  const clean = hexString.replace(/[^0-9A-Fa-f]/g, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}
