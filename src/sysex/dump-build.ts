// Build a memory dump from editor values, to write the Leslie's memory over
// MIDI. Confirmed on hardware: receiving a dump overwrites the stored presets
// permanently, without pressing MEMORY (docs/dump-map.md).
//
// Safety: always start from a real dump received from the machine and only
// overwrite the bytes whose meaning is confirmed (system block, edit buffer,
// stored presets). Unknown bytes (identification, block 40, tail) are kept.

import { encodeNibbles } from './dump';
import {
  EDIT_BUFFER, PRESET_LAYOUT, STORED, SYSTEM_COUNT, SYSTEM_FIRST_NRPN, SYSTEM_START, byNrpn,
} from './dump-state';

export interface EditorValues {
  /** Preset that should be selected after the write (0 or 1). */
  selectedPreset: 0 | 1;
  system: Record<string, number>;
  presets: [Record<string, number>, Record<string, number>];
}

/** Copy of `base` (128 bytes) with the editor values written in. */
export function encodeDumpData(base: Uint8Array, values: EditorValues): Uint8Array {
  if (base.length !== 128) throw new Error('base dump must hold 128 bytes');
  const out = base.slice();
  for (let i = 0; i < SYSTEM_COUNT; i++) {
    const def = byNrpn('system', SYSTEM_FIRST_NRPN + i);
    const v = def ? values.system[def.id] : undefined;
    if (v !== undefined) out[SYSTEM_START + i] = v;
  }
  out[SYSTEM_START] = values.selectedPreset; // Preset Number
  const writeBlock = (start: number, preset: Record<string, number>) => {
    for (const [offset, nrpn] of PRESET_LAYOUT) {
      const def = byNrpn('preset', nrpn);
      const v = def ? preset[def.id] : undefined;
      if (v !== undefined) out[start + offset] = v;
    }
  };
  writeBlock(STORED[0], values.presets[0]);
  writeBlock(STORED[1], values.presets[1]);
  // After a write the active state equals the stored selected preset (as after MEMORY).
  writeBlock(EDIT_BUFFER, values.presets[values.selectedPreset]);
  return out;
}

/** Complete SysEx packet (checksum = XOR of the ASCII payload, low 7 bits). */
export function buildDumpPacket(data: Uint8Array, packetNumber = 0, type = 0): Uint8Array<ArrayBuffer> {
  const ascii = encodeNibbles(data);
  const chd = ascii.reduce((a, b) => a ^ b, 0) & 0x7f;
  return Uint8Array.of(0xf0, 0x55, 0x10, 0x10, 0x1c, 0x11, type, packetNumber >> 7, packetNumber & 0x7f,
    ...ascii, chd, 0xf7);
}
