// Decode the 128 data bytes of a Leslie memory dump into parameter values.
// Byte map established from real dumps (docs/dump-map.md):
//   32-39    system parameters, NRPN 0x10-0x17 in order
//   60-79    edit buffer = live state of the selected preset
//   80-99    stored Preset 1
//   100-119  stored Preset 2

import { PARAMS } from '../params/schema';
import type { ParamDef } from '../params/schema';

/** Offset inside a 20-byte preset block -> NRPN code of the parameter. */
export const PRESET_LAYOUT: readonly [offset: number, nrpn: number][] = [
  [1, 0x00], [3, 0x01], [5, 0x02], [7, 0x03], // speeds: low byte of 2-byte fields
  [8, 0x04], [9, 0x05], [10, 0x06], [11, 0x07], [12, 0x08], [13, 0x09],
  [14, 0x19], [15, 0x1a], [16, 0x1b],
  [17, 0x1c], [18, 0x0e], [19, 0x1d],
];

export const SYSTEM_START = 32;
export const SYSTEM_FIRST_NRPN = 0x10;
export const SYSTEM_COUNT = 8; // 0x10-0x17; Leslie Mode (0x18) is not stored
export const EDIT_BUFFER = 60;
export const STORED = [80, 100] as const;

export interface DumpState {
  /** 0 = Preset 1, 1 = Preset 2. */
  selectedPreset: 0 | 1;
  system: Record<string, number>;
  /** Live values of the selected preset (edit buffer). */
  active: Record<string, number>;
  /** Values stored in memory for Preset 1 and Preset 2. */
  stored: [Record<string, number>, Record<string, number>];
  /** Parameter ids whose live value differs from the stored one (unsaved). */
  unsaved: string[];
  /** Values outside the schema range (ignored), for diagnostics. */
  rejected: { id: string; value: number }[];
}

export const byNrpn = (scope: ParamDef['scope'], nrpn: number) =>
  PARAMS.find((p) => p.scope === scope && p.nrpn === nrpn);

export function decodeDumpState(data: Uint8Array): DumpState | null {
  if (data.length !== 128) return null;
  const rejected: DumpState['rejected'] = [];
  const take = (def: ParamDef | undefined, value: number, out: Record<string, number>) => {
    if (!def) return;
    if (value < def.min || value > def.max) rejected.push({ id: def.id, value });
    else out[def.id] = value;
  };

  const block = (start: number) => {
    const out: Record<string, number> = {};
    for (const [offset, nrpn] of PRESET_LAYOUT) take(byNrpn('preset', nrpn), data[start + offset]!, out);
    return out;
  };

  const system: Record<string, number> = {};
  for (let i = 0; i < SYSTEM_COUNT; i++) {
    take(byNrpn('system', SYSTEM_FIRST_NRPN + i), data[SYSTEM_START + i]!, system);
  }
  const selectedPreset = system['presetNumber'] === 1 ? 1 : 0;
  const active = block(EDIT_BUFFER);
  const stored: DumpState['stored'] = [block(STORED[0]), block(STORED[1])];
  const unsaved = Object.keys(active).filter((id) => active[id] !== stored[selectedPreset][id]);
  return { selectedPreset, system, active, stored, unsaved, rejected };
}
