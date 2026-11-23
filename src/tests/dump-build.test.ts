import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseDumpPacket } from '../sysex/dump';
import { buildDumpPacket, encodeDumpData } from '../sysex/dump-build';
import { decodeDumpState } from '../sysex/dump-state';

const raw = (name: string) => new Uint8Array(readFileSync(new URL(`../../fixtures/${name}`, import.meta.url)));

describe('building a dump from editor values', () => {
  const files = [
    '2026-11-23-leslie-dump.syx',
    '2026-11-23-leslie-dump-preset1-after-memory.syx',
    '2026-11-23-leslie-dump-preset1-after-power-cycle.syx',
  ];

  it.each(files)('round-trips a saved dump byte for byte: %s', (name) => {
    const bytes = raw(name);
    const data = parseDumpPacket(bytes)!.data!;
    const s = decodeDumpState(data)!;
    const values = { selectedPreset: s.selectedPreset, system: s.system, presets: s.stored };
    expect(buildDumpPacket(encodeDumpData(data, values))).toEqual(bytes);
  });

  it('writes an edit into the stored preset, the edit buffer and nothing else', () => {
    const data = parseDumpPacket(raw('2026-11-23-leslie-dump-preset1-after-power-cycle.syx'))!.data!;
    const s = decodeDumpState(data)!;
    const presets: typeof s.stored = [{ ...s.stored[0], hornRotLevel: 70 }, s.stored[1]];
    const out = encodeDumpData(data, { selectedPreset: 0, system: s.system, presets });
    const diffs = [...out.keys()].filter((i) => out[i] !== data[i]);
    expect(diffs).toEqual([74, 94]); // edit buffer + stored Preset 1, offset 14
    expect(parseDumpPacket(buildDumpPacket(out))!.checksum).toBe('ascii');
  });
});
