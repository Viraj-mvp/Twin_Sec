/**
 * decoder.test.ts
 *
 * Verifies binary Modbus TCP and DNP3 protocol decoders.
 */

import { describe, it } from "vitest";
import assert from "node:assert/strict";
import { decodeModbusTcp, decodeDnp3, hexToBytes } from "../decoder";

describe("ICS Protocol Decoders", () => {
  it("decodes Modbus TCP FC03 Read Holding Registers frame accurately", () => {
    // Txn: 0x0001, Proto: 0x0000, Len: 6, Unit: 1, FC: 3, Start: 0x0000, Qty: 10
    const raw = hexToBytes("00 01 00 00 00 06 01 03 00 00 00 0A");
    const decoded = decodeModbusTcp(raw);

    assert.equal(decoded.protocol, "MODBUS-TCP");
    assert.equal(decoded.transactionId, 1);
    assert.equal(decoded.protocolId, 0);
    assert.equal(decoded.length, 6);
    assert.equal(decoded.unitId, 1);
    assert.equal(decoded.functionCode, 3);
    assert.equal(decoded.functionName, "READ_HOLDING_REGISTERS");
    assert.equal(decoded.data.startingAddress, 0);
    assert.equal(decoded.data.quantity, 10);
    assert.equal(decoded.isException, false);
  });

  it("decodes Modbus TCP FC06 Write Single Register frame accurately", () => {
    // Txn: 0x0002, Proto: 0x0000, Len: 6, Unit: 3, FC: 6, Reg: 0x0010, Val: 60 (0x003C)
    const raw = hexToBytes("00 02 00 00 00 06 03 06 00 10 00 3C");
    const decoded = decodeModbusTcp(raw);

    assert.equal(decoded.unitId, 3);
    assert.equal(decoded.functionCode, 6);
    assert.equal(decoded.functionName, "WRITE_SINGLE_REGISTER");
    assert.equal(decoded.data.startingAddress, 16);
    assert.deepEqual(decoded.data.registerValues, [60]);
  });

  it("decodes DNP3 Data Link and Application Layer frame accurately", () => {
    // Sync: 05 64, Len: 10, Control: C4 (DIR=1, PRM=1), Dest: 0x0001, Src: 0x0004, CRC: 32 C6, Transport: C0, AppFunc: 01 (READ)
    const raw = hexToBytes("05 64 0A C4 01 00 04 00 32 C6 C0 01");
    const decoded = decodeDnp3(raw);

    assert.equal(decoded.protocol, "DNP3");
    assert.equal(decoded.startBytes, "0x0564");
    assert.equal(decoded.destination, 1);
    assert.equal(decoded.source, 4);
    assert.equal(decoded.control.direction, "MASTER_TO_OUTSTATION");
    assert.equal(decoded.control.primary, true);
    assert.equal(decoded.applicationFunction, "READ");
  });
});
