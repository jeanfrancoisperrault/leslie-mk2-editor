import { describe, expect, it } from 'vitest';
import { EchoFilter } from '../midi/echo';
import { encodeSpeed, methodSupports, rolandChecksum } from '../midi/speed';

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).toUpperCase().padStart(2, '0')).join(' ');

describe('speed commands', () => {
  it('reproduces the SysEx validated on the Leslie', () => {
    expect(hex(encodeSpeed('sysex', 'slow', 0)[0]!)).toBe('F0 41 10 00 08 12 02 00 10 3D 00 31 F7');
    expect(hex(encodeSpeed('sysex', 'fast', 0)[0]!)).toBe('F0 41 10 00 08 12 02 00 10 3D 01 30 F7');
  });

  it('computes the Roland checksum', () => {
    expect(rolandChecksum([0x02, 0x00, 0x10, 0x3d, 0x00])).toBe(0x31);
    expect(rolandChecksum([0x00])).toBe(0);
  });

  it('has no SysEx brake', () => {
    expect(methodSupports('sysex', 'brake')).toBe(false);
    expect(() => encodeSpeed('sysex', 'brake', 0)).toThrow();
  });

  it('encodes CC#82/83 on the given channel', () => {
    expect(encodeSpeed('cc', 'fast', 0).map(hex)).toEqual(['B0 53 00', 'B0 52 7F']);
    expect(encodeSpeed('cc', 'slow', 2).map(hex)).toEqual(['B2 53 00', 'B2 52 00']);
    expect(encodeSpeed('cc', 'brake', 0).map(hex)).toEqual(['B0 53 7F']);
  });

  it('encodes Leslie Mode over NRPN', () => {
    expect(encodeSpeed('nrpn', 'brake', 0).map(hex)).toEqual([
      'B0 63 18', 'B0 62 7F', 'B0 06 02', 'B0 65 7F', 'B0 64 7F',
    ]);
  });
});

describe('EchoFilter', () => {
  const msg = Uint8Array.of(0xb0, 0x52, 0x7f);

  it('flags an identical message received shortly after sending, once', () => {
    const f = new EchoFilter(1000);
    f.noteSent(msg, 0);
    expect(f.isEcho(msg, 20)).toBe(true);
    expect(f.isEcho(msg, 30)).toBe(false);
  });

  it('ignores messages outside the window or with different bytes', () => {
    const f = new EchoFilter(1000);
    f.noteSent(msg, 0);
    expect(f.isEcho(Uint8Array.of(0xb0, 0x52, 0x00), 10)).toBe(false);
    expect(f.isEcho(msg, 2000)).toBe(false);
  });
});
