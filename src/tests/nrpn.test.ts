import { describe, expect, it } from 'vitest';
import {
  encodeDataEntry,
  encodeNrpnAddress,
  encodeNrpnChange,
  encodeRpnNull,
} from '../midi/nrpn';

function bytes(msgs: Uint8Array[]): number[][] {
  return msgs.map((m) => Array.from(m));
}

describe('encodeNrpnChange', () => {
  it('emits the exact manual sequence on channel 1', () => {
    // Horn Rise Time (0x04) = 8 (1.8 s) on channel 1 (index 0).
    expect(bytes(encodeNrpnChange(0, 0x04, 8))).toEqual([
      [0xb0, 99, 0x04], // CC99 NRPN MSB = param
      [0xb0, 98, 0x7f], // CC98 NRPN LSB = 7F
      [0xb0, 6, 8], // CC6 Data Entry MSB = value
      [0xb0, 101, 0x7f], // CC101 RPN MSB null
      [0xb0, 100, 0x7f], // CC100 RPN LSB null
    ]);
  });

  it('encodes the channel in the status byte', () => {
    const msgs = encodeNrpnChange(9, 0x1d, 2); // channel 10
    for (const m of msgs) expect(m[0]).toBe(0xb9);
  });

  it('rejects out-of-range channel, param and value', () => {
    expect(() => encodeNrpnChange(16, 0, 0)).toThrow(RangeError);
    expect(() => encodeNrpnChange(-1, 0, 0)).toThrow(RangeError);
    expect(() => encodeNrpnChange(0, 128, 0)).toThrow(RangeError);
    expect(() => encodeNrpnChange(0, 0, 128)).toThrow(RangeError);
    expect(() => encodeNrpnChange(0, 0, 1.5)).toThrow(RangeError);
  });
});

describe('piecewise encoders', () => {
  it('address pair is CC99 then CC98=7F', () => {
    expect(bytes(encodeNrpnAddress(0, 0x19))).toEqual([
      [0xb0, 99, 0x19],
      [0xb0, 98, 0x7f],
    ]);
  });

  it('data entry is a single CC6', () => {
    expect(Array.from(encodeDataEntry(0, 50))).toEqual([0xb0, 6, 50]);
  });

  it('RPN null is CC101=7F then CC100=7F', () => {
    expect(bytes(encodeRpnNull(0))).toEqual([
      [0xb0, 101, 0x7f],
      [0xb0, 100, 0x7f],
    ]);
  });
});
