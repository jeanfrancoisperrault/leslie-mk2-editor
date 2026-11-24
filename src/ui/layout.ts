// Where each schema parameter appears on screen. Every parameter is placed
// exactly once, except presetNumber and leslieMode: those are the switches of
// the top bar.

import type { SpeedCommand } from '../midi/speed';

/** Rotor mode a setting belongs to: the one its speed is held in, or its ramp
    leads to. Drives the color code; null = neutral. */
export function voiceOf(id: string): SpeedCommand | null {
  const m = /^(?:horn|low)(SlowSpeed|FallTime|FastSpeed|RiseTime|BrakeTime)$/.exec(id);
  switch (m?.[1]) {
    case 'SlowSpeed': case 'FallTime': return 'slow';
    case 'FastSpeed': case 'RiseTime': return 'fast';
    case 'BrakeTime': return 'brake';
    default: return null;
  }
}

export interface RotorRow {
  /** Key into STR.rows. */
  key: 'slowSpeed' | 'fastSpeed' | 'riseTime' | 'fallTime' | 'brakeTime' | 'level';
  horn: string;
  low: string;
}

/** Grouped by mode, in half-moon order (Slow, Brake, Fast), then the level. */
export const ROTOR_ROWS: readonly RotorRow[] = [
  { key: 'slowSpeed', horn: 'hornSlowSpeed', low: 'lowSlowSpeed' },
  { key: 'fallTime', horn: 'hornFallTime', low: 'lowFallTime' },
  { key: 'brakeTime', horn: 'hornBrakeTime', low: 'lowBrakeTime' },
  { key: 'fastSpeed', horn: 'hornFastSpeed', low: 'lowFastSpeed' },
  { key: 'riseTime', horn: 'hornRiseTime', low: 'lowRiseTime' },
  { key: 'level', horn: 'hornRotLevel', low: 'lowRotLevel' },
];

export interface ToneGroup {
  /** Key into STR.toneGroups. */
  key: 'character' | 'bass';
  /** Each row: key into STR.toneRows, parameter. */
  rows: readonly { key: 'horn' | 'cabinet' | 'level' | 'crossover'; param: string }[];
}

export const TONE_GROUPS: readonly ToneGroup[] = [
  { key: 'character', rows: [{ key: 'horn', param: 'hornCharacter' }, { key: 'cabinet', param: 'cabinetCharacter' }] },
  { key: 'bass', rows: [{ key: 'level', param: 'bassLevel' }, { key: 'crossover', param: 'crossover' }] },
];

export interface SystemGroup {
  /** Key into STR.systemGroups. */
  key: 'channels' | 'reception' | 'switches';
  params: readonly string[];
}

export const SYSTEM_GROUPS: readonly SystemGroup[] = [
  { key: 'channels', params: ['controlChannel', 'programChannel'] },
  { key: 'reception', params: ['modulationReceive', 'expressionReceive'] },
  { key: 'switches', params: ['slowFastControlType', 'slowFastControlCode', 'presetFootSwitchType'] },
];
