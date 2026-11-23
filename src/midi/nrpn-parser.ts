// Stateful parser for incoming NRPN writes. The Leslie reports some state
// changes on its MIDI OUT as NRPN (e.g. footswitch -> Leslie Mode):
//   Bn 63 <param>, Bn 62 7F, Bn 06 <value>
// It does not necessarily close with RPN Null, so the address is kept until
// changed or nulled.

export interface NrpnWrite {
  channel: number;
  param: number;
  value: number;
}

export class NrpnParser {
  #msb = new Map<number, number | null>();
  #lsb = new Map<number, number | null>();

  /** Feed one MIDI message; returns a complete write when CC6 arrives. */
  feed(bytes: Uint8Array): NrpnWrite | null {
    const status = bytes[0];
    if (status === undefined || (status & 0xf0) !== 0xb0 || bytes.length < 3) return null;
    const ch = status & 0x0f;
    const cc = bytes[1]!;
    const v = bytes[2]!;
    switch (cc) {
      case 99: this.#msb.set(ch, v); return null;
      case 98: this.#lsb.set(ch, v); return null;
      case 101:
      case 100:
        // RPN select (incl. RPN Null) deselects the NRPN.
        this.#msb.set(ch, null);
        this.#lsb.set(ch, null);
        return null;
      case 6: {
        const param = this.#msb.get(ch);
        if (param === null || param === undefined || this.#lsb.get(ch) !== 0x7f) return null;
        return { channel: ch, param, value: v };
      }
      default:
        return null;
    }
  }
}
