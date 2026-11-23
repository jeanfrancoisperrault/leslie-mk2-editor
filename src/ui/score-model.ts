// Pure model behind the score: rotor speed over time, in real units.
// Ramps are drawn and played as straight lines: the tables give the start, the
// end and the duration; the machine's exact curve in between is not documented.

import type { SpeedCommand } from '../midi/speed';
import { getParam } from '../params/schema';

export type Rotor = 'horn' | 'low';

/** Speeds in rpm, times in seconds. */
export interface RotorSettings {
  slow: number;
  fast: number;
  rise: number;
  fall: number;
  brake: number;
}

/** Seconds covered by one measure (the longest time on the machine is 14 s). */
export const SPAN_S = 17;

export const SEGMENT_PARAM: Record<SpeedCommand, 'RiseTime' | 'FallTime' | 'BrakeTime'> = {
  fast: 'RiseTime', slow: 'FallTime', brake: 'BrakeTime',
};

/** Real-unit value of a table parameter for a raw data value. */
function realValue(id: string, raw: number): number {
  const m = getParam(id).mapping;
  return (m.type === 'table' ? m.values[raw] : undefined) ?? 0;
}

export function rotorSettings(raw: (id: string) => number, rotor: Rotor): RotorSettings {
  const v = (name: string) => realValue(rotor + name, raw(rotor + name));
  return { slow: v('SlowSpeed'), fast: v('FastSpeed'), rise: v('RiseTime'), fall: v('FallTime'), brake: v('BrakeTime') };
}

/** Polyline [seconds, rpm] of one measure, starting at the command. */
export function rampPoints(cmd: SpeedCommand, s: RotorSettings): [number, number][] {
  switch (cmd) {
    case 'fast': return [[0, s.slow], [s.rise, s.fast], [SPAN_S, s.fast]];
    case 'slow': return [[0, s.fast], [s.fall, s.slow], [SPAN_S, s.slow]];
    case 'brake': return [[0, s.fast], [s.brake, 0], [SPAN_S, 0]];
  }
}

/** Speed after dt seconds of following a command, from any current speed. */
export function stepSpeed(current: number, cmd: SpeedCommand, s: RotorSettings, dt: number): number {
  const target = cmd === 'fast' ? s.fast : cmd === 'slow' ? s.slow : 0;
  const span = Math.abs(s.fast - s.slow);
  const rate = current < target ? span / s.rise
    : cmd === 'brake' ? s.fast / s.brake : span / s.fall;
  const max = rate * dt;
  // A zero or missing time means an immediate change.
  if (!Number.isFinite(max) || Math.abs(target - current) <= max) return target;
  return current + Math.sign(target - current) * max;
}
