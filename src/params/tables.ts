// Conversion tables from the Leslie 2101 mk2 manual (MIDI section, pages 21-23).
// Verified against the PDF manual + official errata on 2026-11-20
// (see docs/manual-verification.md). Values marked UNVERIFIED are not present
// in the PDF and must be confirmed on the hardware (Phase 0).

/**
 * Table A — Horn Slow Speed: data value (0-99) -> rpm.
 * Data 0 means the rotor is stopped.
 */
export const HORN_SLOW_RPM: readonly number[] = [
  0, 24, 27, 31, 33, 36, 40, 42, 46, 48,
  50, 52, 57, 61, 63, 65, 68, 72, 76, 78,
  80, 84, 87, 91, 93, 97, 100, 102, 106, 108,
  112, 114, 117, 121, 123, 127, 130, 132, 136, 138,
  142, 145, 147, 151, 153, 157, 160, 162, 166, 168,
  172, 174, 178, 181, 183, 187, 189, 193, 195, 198,
  202, 204, 208, 210, 213, 217, 219, 223, 225, 229,
  231, 234, 238, 240, 243, 247, 249, 253, 255, 258,
  262, 264, 267, 271, 273, 276, 280, 282, 286, 288,
  291, 295, 297, 300, 302, 306, 309, 311, 315, 318,
];

/**
 * Table A2 — Horn Fast Speed: data value (1-27) -> rpm.
 * Index 0 is unused (data range starts at 1).
 */
export const HORN_FAST_RPM: readonly (number | undefined)[] = [
  undefined,
  376, 378, 382, 384, 387, 391, 393, 397, 400, 402,
  406, 408, 411, 414, 418, 421, 424, 427, 430, 431,
  435, 438, 442, 444, 447, 450, 452,
];

/**
 * Table B — Horn Rise/Fall/Brake Time: data value (0-39) -> seconds.
 * 0-24: 0.2 s steps (0.2 -> 5.0); 25-39: 0.5 s steps (5.5 -> 12.5).
 */
export const HORN_TIME_S: readonly number[] = Array.from({ length: 40 }, (_, i) =>
  i <= 24 ? Math.round((0.2 + i * 0.2) * 10) / 10 : Math.round((5.5 + (i - 25) * 0.5) * 10) / 10,
);

/**
 * Table C — Low Rotor Rise/Fall/Brake Time: data value (0-24) -> seconds.
 * Kept literal because the tail is irregular (21:11.0, 22:12.0, 23:13.0, 24:14.0).
 */
export const LOW_TIME_S: readonly number[] = [
  0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0,
  5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0,
  10.5, 11.0, 12.0, 13.0, 14.0,
];

/**
 * Low Rotor Slow Speed: data value (0-9) -> rpm.
 * The mk2 manual omits this table, but the first-generation 2101/2102/2103
 * manual (footnote *3) states it is the shared speed table restricted to
 * data 0-9 ("0, 24-48 rpm") - i.e. the first ten entries of Table A.
 */
export const LOW_SLOW_RPM: readonly number[] = HORN_SLOW_RPM.slice(0, 10);

/**
 * Low Rotor Fast Speed: data value (1-21) -> rpm.
 * Per the first-generation 2101/2102/2103 manual (footnote *4): the shared
 * fast-speed table restricted to data 1-21. Both manuals' range headers say
 * "372-431 rpm" while their own table reads 376-435; the table wins (the
 * headers are equally sloppy for the horn: "375-450" vs table 376-452).
 */
export const LOW_FAST_RPM: readonly (number | undefined)[] = HORN_FAST_RPM.slice(0, 22);

/** Table D — Horn Character (mk2): data value -> label and 2-char front-panel display. */
export const HORN_CHARACTER = [
  { value: 0, label: 'Flat', display: 'FL' },
  { value: 1, label: '1.0k', display: '1.0' },
  { value: 2, label: '1.6k', display: '1.6' },
  { value: 3, label: '2.0k', display: '2.0' },
] as const;

/** Table F — Cabinet Character (mk2): data value -> label and 2-char front-panel display. */
export const CABINET_CHARACTER = [
  { value: 0, label: '122', display: '12' },
  { value: 1, label: '21H', display: '21' },
  { value: 2, label: 'Bright', display: 'br' },
  { value: 3, label: 'Flat', display: 'FL' },
] as const;

/** Crossover frequency: data value -> label. */
export const CROSSOVER = [
  { value: 0, label: '0.7 kHz', display: '0.7' },
  { value: 1, label: '0.8 kHz', display: '0.8' },
  { value: 2, label: '1.0 kHz', display: '1.0' },
] as const;
