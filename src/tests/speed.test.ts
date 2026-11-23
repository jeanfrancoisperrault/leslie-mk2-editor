import { describe, expect, it } from 'vitest';
import { EchoFilter } from '../midi/echo';
import { encodeSpeed } from '../midi/speed';

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).toUpperCase().padStart(2, '0')).join(' ');

describe('speed commands', () => {
  it('encodes Leslie Mode over NRPN', () => {
    expect(encodeSpeed('slow', 0).map(hex)).toEqual(['B0 63 18', 'B0 62 7F', 'B0 06 00', 'B0 65 7F', 'B0 64 7F']);
    expect(encodeSpeed('fast', 0)[2]).toEqual(Uint8Array.of(0xb0, 0x06, 0x01));
    expect(encodeSpeed('brake', 2).map(hex)).toEqual(['B2 63 18', 'B2 62 7F', 'B2 06 02', 'B2 65 7F', 'B2 64 7F']);
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
