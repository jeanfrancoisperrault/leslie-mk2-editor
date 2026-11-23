// Real dump captured from the user's Leslie 2101 mk2 on 2026-11-23.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { encodeNibbles, parseDumpPacket, toSyx } from '../sysex/dump';

const raw = new Uint8Array(readFileSync(new URL('../../fixtures/2026-11-23-leslie-dump.syx', import.meta.url)));

describe('real dump fixture', () => {
  const p = parseDumpPacket(raw)!;

  it('is a single 267-byte packet #0 of type 00', () => {
    expect(raw.length).toBe(267);
    expect(p.type).toBe(0);
    expect(p.number).toBe(0);
    expect(p.data?.length).toBe(128);
  });

  it('checksum is the XOR of the 256 ASCII bytes, not of the decoded data', () => {
    expect(p.checksum).toBe('ascii');
  });

  it('starts with the HZ-100 identification strings', () => {
    const text = new TextDecoder().decode(p.data!.slice(0, 28));
    expect(text.startsWith('HZ100SetUp')).toBe(true);
    expect(text).toContain('HZ-100 V1.000');
  });

  it('round-trips: re-encoding gives the same bytes', () => {
    expect(encodeNibbles(p.data!)).toEqual(raw.slice(9, 265));
    expect(toSyx([p])).toEqual(raw);
  });
});

describe('preset 2 vs preset 1 dumps (only the preset was changed)', () => {
  const p2 = parseDumpPacket(raw)!.data!;
  const p1raw = new Uint8Array(readFileSync(new URL('../../fixtures/2026-11-23-leslie-dump-preset1.syx', import.meta.url)));
  const p1 = parseDumpPacket(p1raw)!.data!;
  const block = (d: Uint8Array, start: number) => Array.from(d.slice(start, start + 20));

  it('byte 32 is the 0-based current preset', () => {
    expect(p2[32]).toBe(1);
    expect(p1[32]).toBe(0);
  });

  it('block 60 is the edit buffer: it mirrors the selected preset', () => {
    expect(block(p2, 60)).toEqual(block(p2, 100)); // preset 2 selected -> copy of preset 2
    expect(block(p1, 60)).toEqual(block(p1, 80)); // preset 1 selected -> copy of preset 1
  });

  it('stored presets (blocks 80 and 100) do not change when switching', () => {
    expect(block(p1, 80)).toEqual(block(p2, 80));
    expect(block(p1, 100)).toEqual(block(p2, 100));
    expect(block(p1, 40)).toEqual(block(p2, 40));
  });
});

describe('character bytes, confirmed against the front panel display', () => {
  const d = parseDumpPacket(raw)!.data!;
  // Preset 1 (block 80): HORN CHAR "1.0", CABINET "21". Preset 2 (block 100): "FL", "12".
  it('byte 17 of a preset block is Horn Character (Table D index)', () => {
    expect(d[80 + 17]).toBe(1); // 1.0k
    expect(d[100 + 17]).toBe(0); // Flat
  });
  it('byte 19 of a preset block is Cabinet Character (Table F index)', () => {
    expect(d[80 + 19]).toBe(1); // 21H
    expect(d[100 + 19]).toBe(0); // 122
  });
});

describe('NRPN edits from the editor land in the edit buffer only', () => {
  // Preset 1 selected; editor sent Horn Slow = 61 (204 rpm), Horn Fast = 18 (427 rpm); no MEMORY.
  const load = (name: string) =>
    parseDumpPacket(new Uint8Array(readFileSync(new URL(`../../fixtures/${name}`, import.meta.url))))!;
  const before = load('2026-11-23-leslie-dump-preset1.syx').data!;
  const after = load('2026-11-23-leslie-dump-preset1-nrpn-horn-speeds.syx');

  it('was captured and saved by the editor with a valid checksum', () => {
    expect(after.checksum).toBe('ascii');
  });

  it('changes exactly the two horn speed bytes of block 60', () => {
    const diffs = [...after.data!.keys()].filter((i) => after.data![i] !== before[i]);
    expect(diffs).toEqual([61, 65]);
    expect(after.data![61]).toBe(61);
    expect(after.data![65]).toBe(18);
  });
});

describe('MEMORY copies the edit buffer into the stored preset', () => {
  const load = (name: string) =>
    parseDumpPacket(new Uint8Array(readFileSync(new URL(`../../fixtures/${name}`, import.meta.url))))!.data!;
  const before = load('2026-11-23-leslie-dump-preset1-nrpn-horn-speeds.syx');
  const after = load('2026-11-23-leslie-dump-preset1-after-memory.syx');

  it('changes exactly bytes 81 and 85 (stored preset 1 horn speeds)', () => {
    const diffs = [...after.keys()].filter((i) => after[i] !== before[i]);
    expect(diffs).toEqual([81, 85]);
    expect(Array.from(after.slice(80, 100))).toEqual(Array.from(after.slice(60, 80)));
  });
});

describe('power cycle', () => {
  const load = (name: string) =>
    parseDumpPacket(new Uint8Array(readFileSync(new URL(`../../fixtures/${name}`, import.meta.url))))!.data!;
  const before = load('2026-11-23-leslie-dump-preset1-after-memory.syx');
  const after = load('2026-11-23-leslie-dump-preset1-after-power-cycle.syx');
  const block = (d: Uint8Array, s: number) => Array.from(d.slice(s, s + 20));

  it('keeps the stored presets, system settings and selected preset', () => {
    expect(Array.from(after.slice(32, 40))).toEqual(Array.from(before.slice(32, 40)));
    expect(block(after, 80)).toEqual(block(before, 80));
    expect(block(after, 100)).toEqual(block(before, 100));
    expect(after[81]).toBe(61);
    expect(after[85]).toBe(18);
  });

  it('refreshes block 40 with the preset loaded at power-on', () => {
    expect(block(after, 40)).toEqual(block(after, 80));
    expect(block(after, 60)).toEqual(block(after, 80));
  });
});
