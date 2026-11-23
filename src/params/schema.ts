// Single source of truth for every editable parameter of the Leslie 2101 mk2.
// The UI, the NRPN encoder, the tests and the explanations all derive from this file.
//
// NRPN addressing (manual pages 21-22): CC99 (NRPN MSB) carries the parameter
// code below, CC98 (NRPN LSB) is always 0x7F, CC6 (Data Entry MSB) carries the
// value. The "DATA Range LSB(26)" column is empty for every parameter, so the
// Data Entry LSB is not needed.
//
// Defaults follow the official errata, which overrides the main table of the
// manual (see docs/manual-verification.md).

import {
  CABINET_CHARACTER,
  CROSSOVER,
  HORN_CHARACTER,
  HORN_FAST_RPM,
  HORN_SLOW_RPM,
  HORN_TIME_S,
  LOW_FAST_RPM,
  LOW_SLOW_RPM,
  LOW_TIME_S,
} from './tables';

export type ParamGroup = 'horn' | 'low' | 'common' | 'system';

/** How a raw data value maps to a human-readable value. */
export type ValueMapping =
  /** Lookup table indexed by raw data value; `undefined` entries are invalid. */
  | { type: 'table'; unit: 'rpm' | 's'; values: readonly (number | undefined)[]; verified: boolean }
  /** Unitless 0-99 level shown as-is. */
  | { type: 'level' }
  /** Fixed set of options. */
  | {
      type: 'enum';
      options: readonly { value: number; label: string; display?: string }[];
    }
  /** MIDI channel selector: 0-15 -> channel 1-16, 16 -> Off. */
  | { type: 'channel' }
  /** Raw number (e.g. a CC number). */
  | { type: 'number' };

export interface ParamDef {
  /** Stable identifier, used by the store, the content layer and tests. */
  id: string;
  /** Panel grouping. */
  group: ParamGroup;
  /** Per-preset parameter or global system parameter. */
  scope: 'preset' | 'system';
  /** English name as printed in the manual's parameter table. */
  manualName: string;
  /** Name shown on the unit's front-panel function dial, when it has one. */
  panelName?: string;
  /** NRPN parameter code, sent as the value of CC99 (NRPN MSB). */
  nrpn: number;
  /** Inclusive raw data range accepted by the unit. */
  min: number;
  max: number;
  /**
   * Raw factory defaults (errata values). For preset-scoped parameters the
   * tuple is [Preset 1, Preset 2]; system parameters use a single value.
   */
  defaults: readonly [number, number] | number;
  mapping: ValueMapping;
}

const hornTime: ValueMapping = { type: 'table', unit: 's', values: HORN_TIME_S, verified: true };
const lowTime: ValueMapping = { type: 'table', unit: 's', values: LOW_TIME_S, verified: true };

export const PARAMS: readonly ParamDef[] = [
  // --- Horn rotor (per preset) ---
  {
    id: 'hornSlowSpeed', group: 'horn', scope: 'preset',
    manualName: 'Slow Speed', panelName: 'SLOW SPEED',
    nrpn: 0x00, min: 0, max: 99, defaults: [8, 8],
    mapping: { type: 'table', unit: 'rpm', values: HORN_SLOW_RPM, verified: true },
  },
  {
    id: 'hornFastSpeed', group: 'horn', scope: 'preset',
    manualName: 'Fast Speed', panelName: 'FAST SPEED',
    nrpn: 0x02, min: 1, max: 27, defaults: [9, 9],
    mapping: { type: 'table', unit: 'rpm', values: HORN_FAST_RPM, verified: true },
  },
  {
    id: 'hornRiseTime', group: 'horn', scope: 'preset',
    manualName: 'Rise Time', panelName: 'RISE TIME',
    nrpn: 0x04, min: 0, max: 39, defaults: [8, 14], // 1.8 s / 3.0 s
    mapping: hornTime,
  },
  {
    id: 'hornFallTime', group: 'horn', scope: 'preset',
    manualName: 'Fall Time', panelName: 'FALL TIME',
    nrpn: 0x06, min: 0, max: 39, defaults: [11, 14], // 2.4 s / 3.0 s
    mapping: hornTime,
  },
  {
    id: 'hornBrakeTime', group: 'horn', scope: 'preset',
    manualName: 'Brake Time', panelName: 'BRAKE TIME',
    nrpn: 0x08, min: 0, max: 39, defaults: [14, 14], // 3.0 s / 3.0 s
    mapping: hornTime,
  },
  {
    id: 'hornCharacter', group: 'horn', scope: 'preset',
    manualName: 'Horn Character (mk2)', panelName: 'CHARACTER',
    nrpn: 0x1c, min: 0, max: 3, defaults: [0, 0],
    mapping: { type: 'enum', options: HORN_CHARACTER },
  },
  {
    id: 'hornRotLevel', group: 'horn', scope: 'preset',
    manualName: 'Rot Level', panelName: 'ROT. LEVEL',
    nrpn: 0x19, min: 0, max: 99, defaults: [50, 50],
    mapping: { type: 'level' },
  },

  // --- Low rotor (per preset) ---
  {
    id: 'lowSlowSpeed', group: 'low', scope: 'preset',
    manualName: 'Slow Speed', panelName: 'SLOW SPEED',
    nrpn: 0x01, min: 0, max: 9, defaults: [3, 3], // 31 rpm
    // Table confirmed by the first-generation 2101/2102/2103 manual (*3).
    mapping: { type: 'table', unit: 'rpm', values: LOW_SLOW_RPM, verified: true },
  },
  {
    id: 'lowFastSpeed', group: 'low', scope: 'preset',
    manualName: 'Fast Speed', panelName: 'FAST SPEED',
    nrpn: 0x03, min: 1, max: 21, defaults: [1, 1], // 376 rpm
    // Table confirmed by the first-generation 2101/2102/2103 manual (*4).
    mapping: { type: 'table', unit: 'rpm', values: LOW_FAST_RPM, verified: true },
  },
  {
    id: 'lowRiseTime', group: 'low', scope: 'preset',
    manualName: 'Rise Time', panelName: 'RISE TIME',
    nrpn: 0x05, min: 0, max: 24, defaults: [22, 23], // 12 s / 13 s
    mapping: lowTime,
  },
  {
    id: 'lowFallTime', group: 'low', scope: 'preset',
    manualName: 'Fall Time', panelName: 'FALL TIME',
    nrpn: 0x07, min: 0, max: 24, defaults: [10, 22], // 5.5 s / 12 s
    mapping: lowTime,
  },
  {
    id: 'lowBrakeTime', group: 'low', scope: 'preset',
    manualName: 'Brake Time', panelName: 'BRAKE TIME',
    nrpn: 0x09, min: 0, max: 24, defaults: [19, 24], // 10 s / 14 s
    mapping: lowTime,
  },
  {
    id: 'lowRotLevel', group: 'low', scope: 'preset',
    manualName: 'Rot Level', panelName: 'ROT. LEVEL',
    nrpn: 0x1a, min: 0, max: 99, defaults: [99, 99],
    mapping: { type: 'level' },
  },
  {
    id: 'bassLevel', group: 'low', scope: 'preset',
    manualName: 'Bass Level', panelName: 'BASS LEVEL',
    nrpn: 0x1b, min: 0, max: 99, defaults: [90, 90],
    mapping: { type: 'level' },
  },

  // --- Common to both rotors (per preset) ---
  {
    id: 'crossover', group: 'common', scope: 'preset',
    manualName: 'CrossOver Frequency', panelName: 'CROSSOVER',
    nrpn: 0x0e, min: 0, max: 2, defaults: [1, 1], // 0.8 kHz
    mapping: { type: 'enum', options: CROSSOVER },
  },
  {
    id: 'cabinetCharacter', group: 'common', scope: 'preset',
    manualName: 'Cabinet Character (mk2)', panelName: 'CABINET',
    nrpn: 0x1d, min: 0, max: 3, defaults: [0, 1], // 122 / 21H
    mapping: { type: 'enum', options: CABINET_CHARACTER },
  },

  // --- System (global) ---
  {
    id: 'presetNumber', group: 'system', scope: 'system',
    manualName: 'Preset Number',
    nrpn: 0x10, min: 0, max: 1, defaults: 0,
    mapping: {
      type: 'enum',
      options: [
        { value: 0, label: 'Preset 1' },
        { value: 1, label: 'Preset 2' },
      ],
    },
  },
  {
    id: 'controlChannel', group: 'system', scope: 'system',
    manualName: 'Control Channel', panelName: 'CONTROL CH',
    nrpn: 0x11, min: 0, max: 16, defaults: 0,
    mapping: { type: 'channel' },
  },
  {
    id: 'programChannel', group: 'system', scope: 'system',
    manualName: 'Program Channel', panelName: 'PROG. CH',
    nrpn: 0x12, min: 0, max: 16, defaults: 16,
    mapping: { type: 'channel' },
  },
  {
    id: 'modulationReceive', group: 'system', scope: 'system',
    manualName: 'Modulation Receive', panelName: 'MOD. RX',
    nrpn: 0x13, min: 0, max: 1, defaults: 1,
    mapping: {
      type: 'enum',
      options: [
        { value: 0, label: 'Off' },
        { value: 1, label: 'On' },
      ],
    },
  },
  {
    id: 'expressionReceive', group: 'system', scope: 'system',
    manualName: 'Exp Receive', panelName: 'EXP. RX',
    nrpn: 0x14, min: 0, max: 1, defaults: 0,
    mapping: {
      type: 'enum',
      options: [
        { value: 0, label: 'Off' },
        { value: 1, label: 'On' },
      ],
    },
  },
  {
    id: 'slowFastControlType', group: 'system', scope: 'system',
    manualName: 'Slow/Fast Control Type', panelName: 'S/F TYPE',
    nrpn: 0x15, min: 0, max: 1, defaults: 1,
    mapping: {
      type: 'enum',
      options: [
        { value: 0, label: 'Unlatch' },
        { value: 1, label: 'Latch' },
      ],
    },
  },
  {
    // Errata: default 82, range 0-97 (original manual said 64 and 0-99).
    id: 'slowFastControlCode', group: 'system', scope: 'system',
    manualName: 'Slow/Fast Control Code', panelName: 'S/F CONT. CODE',
    nrpn: 0x16, min: 0, max: 97, defaults: 82,
    mapping: { type: 'number' },
  },
  {
    id: 'presetFootSwitchType', group: 'system', scope: 'system',
    manualName: 'Preset Foot Switch Type', panelName: 'FOOT SW TYPE',
    nrpn: 0x17, min: 0, max: 1, defaults: 0,
    mapping: {
      type: 'enum',
      options: [
        { value: 0, label: 'Unlatch' },
        { value: 1, label: 'Latch' },
      ],
    },
  },
  {
    id: 'leslieMode', group: 'system', scope: 'system',
    manualName: 'Leslie Mode',
    nrpn: 0x18, min: 0, max: 2, defaults: 0,
    mapping: {
      type: 'enum',
      options: [
        { value: 0, label: 'Slow' },
        { value: 1, label: 'Fast' },
        { value: 2, label: 'Brake' },
      ],
    },
  },
];

export type ParamId = (typeof PARAMS)[number]['id'];

const byId = new Map(PARAMS.map((p) => [p.id, p]));

/** Look up a parameter definition; throws on unknown id. */
export function getParam(id: string): ParamDef {
  const def = byId.get(id);
  if (!def) throw new Error(`Unknown parameter id: ${id}`);
  return def;
}

export const PRESET_PARAMS = PARAMS.filter((p) => p.scope === 'preset');
export const SYSTEM_PARAMS = PARAMS.filter((p) => p.scope === 'system');

/** Clamp a raw value into the parameter's documented range. */
export function clampValue(def: ParamDef, value: number): number {
  return Math.min(def.max, Math.max(def.min, Math.round(value)));
}

/**
 * Human-readable value for a raw data value, e.g. "46 rpm", "1.8 s", "0.8 kHz".
 * Returns the raw number as a string when the mapping has no unit.
 */
export function formatValue(def: ParamDef, value: number): string {
  const m = def.mapping;
  switch (m.type) {
    case 'table': {
      const v = m.values[value];
      if (v === undefined) return String(value);
      return m.unit === 'rpm' ? `${v} rpm` : `${formatSeconds(v)} s`;
    }
    case 'enum': {
      const opt = m.options.find((o) => o.value === value);
      return opt ? opt.label : String(value);
    }
    case 'channel':
      return value === 16 ? 'Off' : String(value + 1);
    case 'level':
    case 'number':
      return String(value);
  }
}

function formatSeconds(v: number): string {
  return Number.isInteger(v) ? v.toFixed(1) : String(v);
}
