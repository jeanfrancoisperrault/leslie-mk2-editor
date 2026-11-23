// Rotor speed commands (Slow / Fast / Brake).
//
// Sent as the system parameter Leslie Mode (NRPN 0x18): 0 Slow, 1 Fast,
// 2 Brake. Roland SysEx (02 00 10 3D) and CC#82/83 were also validated on the
// Leslie (2026-11-23), but NRPN was kept as the only method: it sets an
// absolute state (CC#82 may toggle when the Slow/Fast control type is Latch),
// supports Brake (the Roland SysEx does not), needs no SysEx permission, and
// is what the Leslie itself emits when the footswitch is used.

import { encodeNrpnChange } from './nrpn';

export type SpeedCommand = 'slow' | 'fast' | 'brake';

const NRPN_LESLIE_MODE = 0x18;
const MODE_VALUE: Record<SpeedCommand, number> = { slow: 0, fast: 1, brake: 2 };

/** Messages to send for one speed command; channel is 0-15. */
export function encodeSpeed(cmd: SpeedCommand, channel: number): Uint8Array[] {
  return encodeNrpnChange(channel, NRPN_LESLIE_MODE, MODE_VALUE[cmd]);
}
