// Simulator: an in-memory MIDI output that records and decodes every message.
// Used by tests and by the app's simulator mode (develop without the Leslie).

import type { MidiSink } from './types';

export interface LoggedMessage {
  /** Milliseconds since the sink was created (or test-provided clock). */
  time: number;
  bytes: Uint8Array;
  /** Human-readable decoding, e.g. "ch1 CC99=4". */
  decoded: string;
}

const CC_NAMES: Record<number, string> = {
  1: 'Modulation',
  82: 'Rotary Fast',
  83: 'Rotary Brake',
  6: 'DataEntryMSB',
  11: 'Expression',
  38: 'DataEntryLSB',
  64: 'Hold1',
  98: 'NRPN LSB',
  99: 'NRPN MSB',
  100: 'RPN LSB',
  101: 'RPN MSB',
};

export function decodeMessage(bytes: Uint8Array): string {
  const status = bytes[0];
  if (status === undefined) return '(empty)';
  const kind = status & 0xf0;
  const ch = (status & 0x0f) + 1;
  if (kind === 0xb0 && bytes.length >= 3) {
    const cc = bytes[1]!;
    const value = bytes[2]!;
    const name = CC_NAMES[cc];
    return `ch${ch} CC${cc}${name ? ` (${name})` : ''} = ${value}`;
  }
  if (kind === 0xc0 && bytes.length >= 2) {
    return `ch${ch} ProgramChange ${bytes[1]}`;
  }
  if (status === 0xf0) {
    if (bytes[1] === 0x41 && bytes[5] === 0x12) {
      const addr = Array.from(bytes.slice(6, 10), (b) => b.toString(16).padStart(2, '0')).join(' ');
      const data = bytes[10];
      const label = addr === '02 00 10 3d' ? (data === 0 ? ' Slow' : data === 1 ? ' Fast' : '') : '';
      return `SysEx Roland write @${addr} = ${data}${label}`;
    }
    if (bytes[1] === 0x55 && bytes[5] === 0x11) {
      return `SysEx Suzuki dump packet ${bytes[7]}/${bytes[8]} (${bytes.length} bytes)`;
    }
    return `SysEx (${bytes.length} bytes)`;
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(' ');
}

export class MockMidiOut implements MidiSink {
  readonly log: LoggedMessage[] = [];
  onMessage: ((msg: LoggedMessage) => void) | null = null;
  #now: () => number;
  #start: number;

  constructor(now: () => number = () => performance.now()) {
    this.#now = now;
    this.#start = now();
  }

  send(message: Uint8Array): void {
    const entry: LoggedMessage = {
      time: this.#now() - this.#start,
      bytes: message.slice(),
      decoded: decodeMessage(message),
    };
    this.log.push(entry);
    this.onMessage?.(entry);
  }

  /** Raw bytes of every logged message, concatenated (handy for assertions). */
  allBytes(): number[] {
    return this.log.flatMap((m) => Array.from(m.bytes));
  }

  clear(): void {
    this.log.length = 0;
  }
}
