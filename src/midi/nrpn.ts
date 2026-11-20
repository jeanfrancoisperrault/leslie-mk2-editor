// NRPN encoding for the Leslie 2101 mk2 (manual pages 21-23).
//
// Full sequence for one parameter change on control channel n:
//   Bn 63 <param>  CC99 - NRPN MSB = parameter code
//   Bn 62 7F       CC98 - NRPN LSB = always 7F
//   Bn 06 <value>  CC6  - Data Entry MSB
//   Bn 65 7F       CC101 - RPN Null  (recommended by the manual after setting
//   Bn 64 7F       CC100 - RPN Null   the value, to avoid stray data entry)
//
// The Data Entry LSB (CC38) is not used: the manual's "DATA Range LSB" column
// is empty for every parameter.

const CC_NRPN_MSB = 99;
const CC_NRPN_LSB = 98;
const CC_DATA_ENTRY_MSB = 6;
const CC_RPN_MSB = 101;
const CC_RPN_LSB = 100;

const NRPN_LSB_VALUE = 0x7f;

function assert7bit(name: string, v: number): void {
  if (!Number.isInteger(v) || v < 0 || v > 0x7f) {
    throw new RangeError(`${name} must be an integer in 0-127, got ${v}`);
  }
}

function assertChannel(channel: number): void {
  if (!Number.isInteger(channel) || channel < 0 || channel > 15) {
    throw new RangeError(`channel must be an integer in 0-15, got ${channel}`);
  }
}

function cc(channel: number, controller: number, value: number): Uint8Array {
  return Uint8Array.of(0xb0 | channel, controller, value);
}

/** CC99 + CC98 pair that addresses a parameter. */
export function encodeNrpnAddress(channel: number, param: number): Uint8Array[] {
  assertChannel(channel);
  assert7bit('param', param);
  return [cc(channel, CC_NRPN_MSB, param), cc(channel, CC_NRPN_LSB, NRPN_LSB_VALUE)];
}

/** CC6 message carrying the value for the currently addressed parameter. */
export function encodeDataEntry(channel: number, value: number): Uint8Array {
  assertChannel(channel);
  assert7bit('value', value);
  return cc(channel, CC_DATA_ENTRY_MSB, value);
}

/** CC101/CC100 RPN Null pair, closing the NRPN "session". */
export function encodeRpnNull(channel: number): Uint8Array[] {
  assertChannel(channel);
  return [cc(channel, CC_RPN_MSB, 0x7f), cc(channel, CC_RPN_LSB, 0x7f)];
}

/** Complete, self-contained parameter change (address + value + RPN null). */
export function encodeNrpnChange(channel: number, param: number, value: number): Uint8Array[] {
  return [
    ...encodeNrpnAddress(channel, param),
    encodeDataEntry(channel, value),
    ...encodeRpnNull(channel),
  ];
}
