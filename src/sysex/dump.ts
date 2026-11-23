// Suzuki memory dump (manual section 4.5):
//   F0 55 10 10 1C 11 [TYPE=00] [PNH] [PNL] [DATA: 256 ASCII hex chars] [CHD] F7
// DATA carries 128 bytes, each as two ASCII hex characters ("7E" -> 37 45).
// CHD = low 7 bits of the XOR of the data. The manual does not say whether the
// XOR runs over the 128 decoded bytes or the 256 ASCII bytes, so both are
// checked and the matching one is reported.

const HEADER = [0xf0, 0x55, 0x10, 0x10, 0x1c, 0x11] as const;
export const PACKET_LENGTH = HEADER.length + 3 + 256 + 2;

export interface DumpPacket {
  type: number;
  /** Packet number (PNH << 7 | PNL). */
  number: number;
  /** 128 decoded bytes, or null if the ASCII payload was malformed. */
  data: Uint8Array | null;
  /** Which checksum variant matched, or null if none did. */
  checksum: 'decoded' | 'ascii' | null;
  raw: Uint8Array;
}

export function isDumpPacket(bytes: Uint8Array): boolean {
  return HEADER.every((b, i) => bytes[i] === b);
}

function hexNibble(c: number): number {
  if (c >= 0x30 && c <= 0x39) return c - 0x30;
  if (c >= 0x41 && c <= 0x46) return c - 0x41 + 10;
  if (c >= 0x61 && c <= 0x66) return c - 0x61 + 10;
  return -1;
}

export function decodeNibbles(ascii: Uint8Array): Uint8Array | null {
  if (ascii.length % 2 !== 0) return null;
  const out = new Uint8Array(ascii.length / 2);
  for (let i = 0; i < out.length; i++) {
    const hi = hexNibble(ascii[2 * i]!);
    const lo = hexNibble(ascii[2 * i + 1]!);
    if (hi < 0 || lo < 0) return null;
    out[i] = (hi << 4) | lo;
  }
  return out;
}

export function encodeNibbles(data: Uint8Array): Uint8Array {
  const hex = Array.from(data, (b) => b.toString(16).toUpperCase().padStart(2, '0')).join('');
  return Uint8Array.from(hex, (c) => c.charCodeAt(0));
}

const xor7 = (bytes: Uint8Array): number => bytes.reduce((a, b) => a ^ b, 0) & 0x7f;

export function parseDumpPacket(bytes: Uint8Array): DumpPacket | null {
  if (!isDumpPacket(bytes) || bytes[bytes.length - 1] !== 0xf7) return null;
  const type = bytes[6]!;
  const number = (bytes[7]! << 7) | bytes[8]!;
  const ascii = bytes.slice(9, bytes.length - 2);
  const chd = bytes[bytes.length - 2]!;
  const data = decodeNibbles(ascii);
  let checksum: DumpPacket['checksum'] = null;
  if (data && xor7(data) === chd) checksum = 'decoded';
  else if (xor7(ascii) === chd) checksum = 'ascii';
  return { type, number, data, checksum, raw: bytes.slice() };
}

/** Concatenate raw packets into a standard .syx file body. */
export function toSyx(packets: readonly DumpPacket[]): Uint8Array<ArrayBuffer> {
  const total = packets.reduce((n, p) => n + p.raw.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of packets) {
    out.set(p.raw, o);
    o += p.raw.length;
  }
  return out;
}

/**
 * Collects dump packets as they arrive and reports the dump complete once the
 * input has been quiet for `idleMs` (the manual gives no packet count).
 */
export class DumpCollector {
  packets: DumpPacket[] = [];
  onProgress: ((packets: readonly DumpPacket[]) => void) | null = null;
  onComplete: ((packets: readonly DumpPacket[]) => void) | null = null;
  #timer: ReturnType<typeof setTimeout> | null = null;
  #idle: number;

  constructor(idleMs = 1500) {
    this.#idle = idleMs;
  }

  /** Returns true if the message was a dump packet (and was consumed). */
  feed(bytes: Uint8Array): boolean {
    if (!isDumpPacket(bytes)) return false;
    const p = parseDumpPacket(bytes);
    if (!p) return false;
    if (this.#timer === null) this.packets = [];
    this.packets.push(p);
    this.onProgress?.(this.packets);
    if (this.#timer !== null) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.#timer = null;
      this.onComplete?.(this.packets);
    }, this.#idle);
    return true;
  }
}
