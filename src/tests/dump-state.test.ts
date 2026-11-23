import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseDumpPacket } from '../sysex/dump';
import { decodeDumpState } from '../sysex/dump-state';

const load = (name: string) =>
  decodeDumpState(parseDumpPacket(new Uint8Array(readFileSync(new URL(`../../fixtures/${name}`, import.meta.url))))!.data!)!;

describe('decodeDumpState on real dumps', () => {
  it('reads system settings and the selected preset', () => {
    const s = load('2026-11-23-leslie-dump.syx');
    expect(s.selectedPreset).toBe(1);
    expect(s.system).toMatchObject({
      presetNumber: 1, controlChannel: 0, programChannel: 16, modulationReceive: 1,
      expressionReceive: 0, slowFastControlType: 1, slowFastControlCode: 82, presetFootSwitchType: 0,
    });
    expect(s.rejected).toEqual([]);
  });

  it('reads preset values matching the front panel', () => {
    const s = load('2026-11-23-leslie-dump.syx');
    expect(s.stored[0]).toMatchObject({ hornCharacter: 1, cabinetCharacter: 1, hornRotLevel: 50, lowRotLevel: 99 });
    expect(s.stored[1]).toMatchObject({ hornCharacter: 0, cabinetCharacter: 0, hornRotLevel: 85, lowRotLevel: 76 });
    expect(Object.keys(s.active)).toHaveLength(16);
  });

  it('flags unsaved NRPN edits, and clears them after MEMORY', () => {
    const before = load('2026-11-23-leslie-dump-preset1-nrpn-horn-speeds.syx');
    expect(before.active).toMatchObject({ hornSlowSpeed: 61, hornFastSpeed: 18 });
    expect(before.unsaved.sort()).toEqual(['hornFastSpeed', 'hornSlowSpeed']);
    expect(load('2026-11-23-leslie-dump-preset1-after-memory.syx').unsaved).toEqual([]);
  });
});
