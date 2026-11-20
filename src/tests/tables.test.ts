import { describe, expect, it } from 'vitest';
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
} from '../params/tables';

describe('Table A (horn slow speed)', () => {
  it('has 100 entries, 0-99', () => {
    expect(HORN_SLOW_RPM).toHaveLength(100);
  });

  it('matches manual spot values', () => {
    expect(HORN_SLOW_RPM[0]).toBe(0);
    expect(HORN_SLOW_RPM[1]).toBe(24);
    expect(HORN_SLOW_RPM[8]).toBe(46); // factory default
    expect(HORN_SLOW_RPM[50]).toBe(172);
    expect(HORN_SLOW_RPM[99]).toBe(318);
  });

  it('is strictly increasing', () => {
    for (let i = 1; i < HORN_SLOW_RPM.length; i++) {
      expect(HORN_SLOW_RPM[i]!).toBeGreaterThan(HORN_SLOW_RPM[i - 1]!);
    }
  });
});

describe('Table A2 (horn fast speed)', () => {
  it('covers data 1-27 with no entry at 0', () => {
    expect(HORN_FAST_RPM).toHaveLength(28);
    expect(HORN_FAST_RPM[0]).toBeUndefined();
  });

  it('matches manual spot values', () => {
    expect(HORN_FAST_RPM[1]).toBe(376);
    expect(HORN_FAST_RPM[9]).toBe(400); // factory default
    expect(HORN_FAST_RPM[20]).toBe(431);
    expect(HORN_FAST_RPM[27]).toBe(452);
  });
});

describe('Table B (horn times)', () => {
  it('has 40 entries', () => {
    expect(HORN_TIME_S).toHaveLength(40);
  });

  it('steps by 0.2 s up to 5.0 s then 0.5 s up to 12.5 s', () => {
    expect(HORN_TIME_S[0]).toBe(0.2);
    expect(HORN_TIME_S[8]).toBe(1.8); // errata default, horn rise P1
    expect(HORN_TIME_S[11]).toBe(2.4); // errata default, horn fall P1
    expect(HORN_TIME_S[14]).toBe(3.0);
    expect(HORN_TIME_S[24]).toBe(5.0);
    expect(HORN_TIME_S[25]).toBe(5.5);
    expect(HORN_TIME_S[39]).toBe(12.5);
  });
});

describe('Table C (low rotor times)', () => {
  it('has 25 entries with the documented irregular tail', () => {
    expect(LOW_TIME_S).toHaveLength(25);
    expect(LOW_TIME_S[0]).toBe(0.5);
    expect(LOW_TIME_S[10]).toBe(5.5);
    expect(LOW_TIME_S[19]).toBe(10.0);
    expect(LOW_TIME_S[20]).toBe(10.5);
    expect(LOW_TIME_S[21]).toBe(11.0);
    expect(LOW_TIME_S[22]).toBe(12.0);
    expect(LOW_TIME_S[23]).toBe(13.0);
    expect(LOW_TIME_S[24]).toBe(14.0);
  });
});

describe('Low rotor speed tables (unverified hypotheses)', () => {
  it('low slow mirrors the first ten entries of Table A', () => {
    expect(LOW_SLOW_RPM).toHaveLength(10);
    expect(LOW_SLOW_RPM[0]).toBe(0);
    expect(LOW_SLOW_RPM[3]).toBe(31); // errata default
    expect(LOW_SLOW_RPM[9]).toBe(48);
  });

  it('low fast mirrors Table A2 up to data 21', () => {
    expect(LOW_FAST_RPM).toHaveLength(22);
    expect(LOW_FAST_RPM[0]).toBeUndefined();
    expect(LOW_FAST_RPM[1]).toBe(376); // errata default
    expect(LOW_FAST_RPM[21]).toBe(435);
  });
});

describe('Enum tables', () => {
  it('horn character matches Table D', () => {
    expect(HORN_CHARACTER.map((o) => o.label)).toEqual(['Flat', '1.0k', '1.6k', '2.0k']);
  });

  it('cabinet character matches Table F', () => {
    expect(CABINET_CHARACTER.map((o) => o.label)).toEqual(['122', '21H', 'Bright', 'Flat']);
    expect(CABINET_CHARACTER.map((o) => o.display)).toEqual(['12', '21', 'br', 'FL']);
  });

  it('crossover has the three documented frequencies', () => {
    expect(CROSSOVER.map((o) => o.label)).toEqual(['0.7 kHz', '0.8 kHz', '1.0 kHz']);
  });
});
