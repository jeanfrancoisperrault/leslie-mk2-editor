// Echo detection. The Leslie's MIDI OUT merges its MIDI IN, so every message
// the editor sends comes straight back on the input. Each sent message is
// remembered for a short window; an incoming message with identical bytes
// inside that window is an echo (consumed once, so a genuine repeat by the
// footswitch is not swallowed twice).

export const ECHO_WINDOW_MS = 1000;

export class EchoFilter {
  #recent: { key: string; time: number }[] = [];
  #window: number;

  constructor(windowMs = ECHO_WINDOW_MS) {
    this.#window = windowMs;
  }

  noteSent(bytes: Uint8Array, now: number): void {
    this.#prune(now);
    this.#recent.push({ key: keyOf(bytes), time: now });
  }

  /** True if the incoming message matches a recent send (and consumes it). */
  isEcho(bytes: Uint8Array, now: number): boolean {
    this.#prune(now);
    const key = keyOf(bytes);
    const i = this.#recent.findIndex((r) => r.key === key);
    if (i < 0) return false;
    this.#recent.splice(i, 1);
    return true;
  }

  #prune(now: number): void {
    while (this.#recent.length > 0 && now - this.#recent[0]!.time > this.#window) this.#recent.shift();
  }
}

function keyOf(bytes: Uint8Array): string {
  return Array.from(bytes).join(',');
}
