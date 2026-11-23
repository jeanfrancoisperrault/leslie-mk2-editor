import { describe, expect, it } from 'vitest';
import { NrpnParser } from '../midi/nrpn-parser';
import { decodeNibbles, encodeNibbles, parseDumpPacket, toSyx } from '../sysex/dump';

describe('NrpnParser', () => {
  it('decodes the footswitch message captured from the Leslie', () => {
    const p = new NrpnParser();
    expect(p.feed(Uint8Array.of(0xb0, 0x63, 0x18))).toBeNull();
    expect(p.feed(Uint8Array.of(0xb0, 0x62, 0x7f))).toBeNull();
    expect(p.feed(Uint8Array.of(0xb0, 0x06, 0x01))).toEqual({ channel: 0, param: 0x18, value: 1 });
  });

  it('ignores data entry after RPN null', () => {
    const p = new NrpnParser();
    p.feed(Uint8Array.of(0xb0, 0x63, 0x18));
    p.feed(Uint8Array.of(0xb0, 0x62, 0x7f));
    p.feed(Uint8Array.of(0xb0, 0x65, 0x7f));
    expect(p.feed(Uint8Array.of(0xb0, 0x06, 0x01))).toBeNull();
  });
});

function packet(data: Uint8Array, number: number, chd: number): Uint8Array {
  return Uint8Array.of(0xf0, 0x55, 0x10, 0x10, 0x1c, 0x11, 0x00, number >> 7, number & 0x7f,
    ...encodeNibbles(data), chd, 0xf7);
}

describe('dump packets', () => {
  const data = Uint8Array.from({ length: 128 }, (_, i) => (i * 7) & 0x7f);
  const xor = data.reduce((a, b) => a ^ b, 0) & 0x7f;

  it('round-trips nibblized ASCII', () => {
    expect(encodeNibbles(Uint8Array.of(0x7e))).toEqual(Uint8Array.of(0x37, 0x45));
    expect(decodeNibbles(encodeNibbles(data))).toEqual(data);
  });

  it('parses a packet and checks the decoded-XOR checksum', () => {
    const p = parseDumpPacket(packet(data, 3, xor))!;
    expect(p.number).toBe(3);
    expect(p.data).toEqual(data);
    expect(p.checksum).toBe('decoded');
    expect(p.raw.length).toBe(267);
  });

  it('flags a bad checksum', () => {
    expect(parseDumpPacket(packet(data, 0, (xor + 1) & 0x7f))!.checksum).not.toBe('decoded');
  });

  it('concatenates raw packets for .syx export', () => {
    const a = parseDumpPacket(packet(data, 0, xor))!;
    const b = parseDumpPacket(packet(data, 1, xor))!;
    expect(toSyx([a, b]).length).toBe(534);
  });
});
