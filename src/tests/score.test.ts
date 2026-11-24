import { describe, expect, it } from 'vitest';
import { PARAMS } from '../params/schema';
import { ROTOR_ROWS, SYSTEM_GROUPS, TONE_ROWS, voiceOf } from '../ui/layout';
import { rampPoints, rotorSettings, stepSpeed, SPAN_S } from '../ui/score-model';

const s = { slow: 46, fast: 400, rise: 1, fall: 2, brake: 4 };

describe('score model', () => {
  it('reads real units from the schema tables', () => {
    const raw: Record<string, number> = { hornSlowSpeed: 8, hornFastSpeed: 9, hornRiseTime: 4, hornFallTime: 4, hornBrakeTime: 14 };
    expect(rotorSettings((id) => raw[id]!, 'horn')).toEqual({ slow: 46, fast: 400, rise: 1, fall: 1, brake: 3 });
  });

  it('draws each measure from the command to the end of the span', () => {
    expect(rampPoints('fast', s)).toEqual([[0, 46], [1, 400], [SPAN_S, 400]]);
    expect(rampPoints('slow', s)).toEqual([[0, 400], [2, 46], [SPAN_S, 46]]);
    expect(rampPoints('brake', s)).toEqual([[0, 400], [4, 0], [SPAN_S, 0]]);
  });

  it('reaches the target exactly after the set time, without overshoot', () => {
    expect(stepSpeed(46, 'fast', s, 0.5)).toBeCloseTo(223);
    expect(stepSpeed(46, 'fast', s, 1)).toBeCloseTo(400);
    expect(stepSpeed(46, 'fast', s, 9)).toBe(400);
    expect(stepSpeed(400, 'slow', s, 1)).toBeCloseTo(223);
    expect(stepSpeed(400, 'brake', s, 2)).toBeCloseTo(200);
    expect(stepSpeed(0, 'slow', s, 9)).toBe(46);
  });

  it('brakes over the whole brake time from any speed, like the drawn ramp', () => {
    let v = 46;
    for (let i = 0; i < 20; i++) v = stepSpeed(v, 'brake', s, 0.1, 46); // 2 s of 4
    expect(v).toBeCloseTo(23);
    expect(stepSpeed(v, 'brake', s, 1.9, 46)).toBeGreaterThan(0);
    expect(stepSpeed(v, 'brake', s, 2.1, 46)).toBe(0);
    expect(stepSpeed(0, 'brake', s, 0.1, 0)).toBe(0);
  });

  it('follows a setting changed while the rotor holds its speed', () => {
    expect(stepSpeed(400, 'fast', { ...s, fast: 378 }, 9)).toBe(378);
  });
});

describe('color code: the rotor mode a setting belongs to', () => {
  it('colors speeds and ramps by the mode they lead to, for both rotors', () => {
    for (const rotor of ['horn', 'low']) {
      expect(voiceOf(`${rotor}SlowSpeed`)).toBe('slow');
      expect(voiceOf(`${rotor}FallTime`)).toBe('slow');
      expect(voiceOf(`${rotor}FastSpeed`)).toBe('fast');
      expect(voiceOf(`${rotor}RiseTime`)).toBe('fast');
      expect(voiceOf(`${rotor}BrakeTime`)).toBe('brake');
    }
  });

  it('leaves every other setting neutral', () => {
    const neutral = PARAMS.map((p) => p.id).filter((id) => !/(Speed|RiseTime|FallTime|BrakeTime)$/.test(id));
    for (const id of neutral) expect(voiceOf(id)).toBeNull();
    expect(voiceOf('slowFastControlType')).toBeNull();
  });
});

describe('screen layout', () => {
  it('groups the rotor settings by mode, in half-moon order', () => {
    expect(ROTOR_ROWS.map((r) => voiceOf(r.horn))).toEqual(['slow', 'slow', 'brake', 'fast', 'fast', null]);
    for (const r of ROTOR_ROWS) expect(voiceOf(r.low)).toBe(voiceOf(r.horn));
  });

  it('places every schema parameter exactly once (preset and mode live in the bar)', () => {
    const placed = [...ROTOR_ROWS.flatMap((r) => [r.horn, r.low]), ...TONE_ROWS,
      ...SYSTEM_GROUPS.flatMap((g) => g.params)].sort();
    expect(placed).toEqual(PARAMS.map((p) => p.id).filter((id) => id !== 'presetNumber' && id !== 'leslieMode').sort());
  });
});
