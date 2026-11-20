import { describe, expect, it } from 'vitest';
import { PARAMS, PRESET_PARAMS, SYSTEM_PARAMS, formatValue, getParam } from '../params/schema';

describe('schema integrity', () => {
  it('has 16 preset parameters and 9 system parameters', () => {
    expect(PRESET_PARAMS).toHaveLength(16);
    expect(SYSTEM_PARAMS).toHaveLength(9);
  });

  it('has unique ids and unique NRPN codes', () => {
    const ids = PARAMS.map((p) => p.id);
    const codes = PARAMS.map((p) => p.nrpn);
    expect(new Set(ids).size).toBe(PARAMS.length);
    expect(new Set(codes).size).toBe(PARAMS.length);
  });

  it('uses the NRPN codes from the manual', () => {
    const expected: Record<string, number> = {
      hornSlowSpeed: 0x00, lowSlowSpeed: 0x01, hornFastSpeed: 0x02, lowFastSpeed: 0x03,
      hornRiseTime: 0x04, lowRiseTime: 0x05, hornFallTime: 0x06, lowFallTime: 0x07,
      hornBrakeTime: 0x08, lowBrakeTime: 0x09, crossover: 0x0e,
      presetNumber: 0x10, controlChannel: 0x11, programChannel: 0x12,
      modulationReceive: 0x13, expressionReceive: 0x14, slowFastControlType: 0x15,
      slowFastControlCode: 0x16, presetFootSwitchType: 0x17, leslieMode: 0x18,
      hornRotLevel: 0x19, lowRotLevel: 0x1a, bassLevel: 0x1b,
      hornCharacter: 0x1c, cabinetCharacter: 0x1d,
    };
    for (const [id, code] of Object.entries(expected)) {
      expect(getParam(id).nrpn, id).toBe(code);
    }
  });

  it('keeps every default inside the documented range', () => {
    for (const p of PARAMS) {
      const defaults = typeof p.defaults === 'number' ? [p.defaults] : p.defaults;
      for (const d of defaults) {
        expect(d, p.id).toBeGreaterThanOrEqual(p.min);
        expect(d, p.id).toBeLessThanOrEqual(p.max);
      }
    }
  });
});

describe('errata defaults convert to the documented real-world values', () => {
  const cases: Array<[string, string, string]> = [
    // [param id, formatted default P1, formatted default P2]
    ['hornSlowSpeed', '46 rpm', '46 rpm'],
    ['hornFastSpeed', '400 rpm', '400 rpm'],
    ['hornRiseTime', '1.8 s', '3.0 s'],
    ['hornFallTime', '2.4 s', '3.0 s'],
    ['hornBrakeTime', '3.0 s', '3.0 s'],
    ['lowSlowSpeed', '31 rpm', '31 rpm'],
    ['lowFastSpeed', '376 rpm', '376 rpm'],
    ['lowRiseTime', '12.0 s', '13.0 s'],
    ['lowFallTime', '5.5 s', '12.0 s'],
    ['lowBrakeTime', '10.0 s', '14.0 s'],
    ['crossover', '0.8 kHz', '0.8 kHz'],
    ['cabinetCharacter', '122', '21H'],
  ];

  it.each(cases)('%s -> %s / %s', (id, p1, p2) => {
    const def = getParam(id);
    const [d1, d2] = def.defaults as readonly [number, number];
    expect(formatValue(def, d1)).toBe(p1);
    expect(formatValue(def, d2)).toBe(p2);
  });

  it('system defaults match the errata', () => {
    expect(getParam('slowFastControlCode').defaults).toBe(82);
    expect(getParam('slowFastControlCode').max).toBe(97);
    expect(formatValue(getParam('controlChannel'), 0)).toBe('1');
    expect(formatValue(getParam('programChannel'), 16)).toBe('Off');
  });
});
