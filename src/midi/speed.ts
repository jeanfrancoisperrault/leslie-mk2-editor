// Rotor speed commands (Slow / Fast / Brake), three transport methods to
// compare on the real machine (brief, step 1):
//
// - 'sysex': Roland-format DT1 write to address 02 00 10 3D, data 00 = Slow,
//   01 = Fast. Validated on the Leslie with SysEx Librarian. No Brake value is
//   known for this address, so Brake is not offered over SysEx (never send a
//   SysEx whose meaning is unknown).
// - 'cc': Korg-style CC#82 (rotary fast) and CC#83 (rotary brake),
//   0-63 = off, 64-127 = on.
// - 'nrpn': system parameter Leslie Mode (NRPN 0x18): 0 Slow, 1 Fast, 2 Brake.

import { encodeNrpnChange } from './nrpn';

export type SpeedCommand = 'slow' | 'fast' | 'brake';
export type SpeedMethod = 'sysex' | 'cc' | 'nrpn';

const ROLAND_HEADER = [0xf0, 0x41, 0x10, 0x00, 0x08, 0x12] as const;
const SPEED_ADDRESS = [0x02, 0x00, 0x10, 0x3d] as const;

/** Roland checksum: 128 - (sum of address + data) mod 128, kept in 0-127. */
export function rolandChecksum(bytes: readonly number[]): number {
  const sum = bytes.reduce((a, b) => a + b, 0);
  return (128 - (sum % 128)) % 128;
}

/** Roland DT1 (command 12) write for this device/model. */
export function encodeRolandWrite(address: readonly number[], data: readonly number[]): Uint8Array {
  const body = [...address, ...data];
  return Uint8Array.of(...ROLAND_HEADER, ...body, rolandChecksum(body), 0xf7);
}

const CC_ROTARY_FAST = 82;
const CC_ROTARY_BRAKE = 83;
const NRPN_LESLIE_MODE = 0x18;

export function methodSupports(method: SpeedMethod, cmd: SpeedCommand): boolean {
  return !(method === 'sysex' && cmd === 'brake');
}

/** Messages to send for one speed command; channel is 0-15. */
export function encodeSpeed(method: SpeedMethod, cmd: SpeedCommand, channel: number): Uint8Array[] {
  switch (method) {
    case 'sysex':
      if (cmd === 'brake') throw new Error('Brake has no known SysEx value');
      return [encodeRolandWrite(SPEED_ADDRESS, [cmd === 'fast' ? 0x01 : 0x00])];
    case 'cc': {
      const status = 0xb0 | channel;
      // Release the brake first so Slow/Fast always take effect after a Brake.
      if (cmd === 'brake') return [Uint8Array.of(status, CC_ROTARY_BRAKE, 127)];
      return [
        Uint8Array.of(status, CC_ROTARY_BRAKE, 0),
        Uint8Array.of(status, CC_ROTARY_FAST, cmd === 'fast' ? 127 : 0),
      ];
    }
    case 'nrpn':
      return encodeNrpnChange(channel, NRPN_LESLIE_MODE, cmd === 'slow' ? 0 : cmd === 'fast' ? 1 : 2);
  }
}
