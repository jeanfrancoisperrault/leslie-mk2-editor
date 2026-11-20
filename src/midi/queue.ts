// Send queue with per-parameter coalescing and throttling.
//
// Behavior (PLAN.md section 3):
// - While a control is being dragged, only the latest value per parameter is
//   kept, and sends are throttled to one flush per SEND_INTERVAL_MS.
// - The NRPN address (CC99/CC98) is re-sent only when the addressed parameter
//   changes; consecutive values for the same parameter go out as bare CC6.
// - RPN Null is emitted once the queue has been idle for IDLE_NULL_MS, closing
//   the NRPN session (the manual recommends it, but sending it inside a drag
//   would force re-addressing on every step).

import { encodeDataEntry, encodeNrpnAddress, encodeRpnNull } from './nrpn';
import type { MidiSink } from './types';

export const SEND_INTERVAL_MS = 30;
export const IDLE_NULL_MS = 300;

export interface NrpnQueueOptions {
  channel: number;
  sendIntervalMs?: number;
  idleNullMs?: number;
}

export class NrpnQueue {
  #sink: MidiSink;
  #channel: number;
  #interval: number;
  #idleNull: number;

  /** Latest pending value per NRPN parameter code. */
  #pending = new Map<number, number>();
  /** Parameter currently addressed on the wire, or null after an RPN null. */
  #addressed: number | null = null;
  #flushTimer: ReturnType<typeof setTimeout> | null = null;
  #idleTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(sink: MidiSink, opts: NrpnQueueOptions) {
    this.#sink = sink;
    this.#channel = opts.channel;
    this.#interval = opts.sendIntervalMs ?? SEND_INTERVAL_MS;
    this.#idleNull = opts.idleNullMs ?? IDLE_NULL_MS;
  }

  get channel(): number {
    return this.#channel;
  }

  set channel(ch: number) {
    // Close any open NRPN session on the old channel before switching.
    this.flush();
    this.#closeSession();
    this.#channel = ch;
  }

  /** Queue a parameter change; the latest value per parameter wins. */
  push(param: number, value: number): void {
    this.#pending.set(param, value);
    if (this.#flushTimer === null) {
      // Leading-edge send: first value goes out immediately, then throttle.
      this.#flushPending();
      this.#flushTimer = setTimeout(() => {
        this.#flushTimer = null;
        if (this.#pending.size > 0) this.#flushPending();
      }, this.#interval);
    }
  }

  /** Send everything pending right now (e.g. before closing the port). */
  flush(): void {
    if (this.#flushTimer !== null) {
      clearTimeout(this.#flushTimer);
      this.#flushTimer = null;
    }
    this.#flushPending();
  }

  /** Cancel timers without sending; pending values are dropped. */
  dispose(): void {
    if (this.#flushTimer !== null) clearTimeout(this.#flushTimer);
    if (this.#idleTimer !== null) clearTimeout(this.#idleTimer);
    this.#flushTimer = null;
    this.#idleTimer = null;
    this.#pending.clear();
  }

  #flushPending(): void {
    for (const [param, value] of this.#pending) {
      if (this.#addressed !== param) {
        for (const msg of encodeNrpnAddress(this.#channel, param)) this.#sink.send(msg);
        this.#addressed = param;
      }
      this.#sink.send(encodeDataEntry(this.#channel, value));
    }
    this.#pending.clear();
    this.#armIdleNull();
  }

  #armIdleNull(): void {
    if (this.#idleTimer !== null) clearTimeout(this.#idleTimer);
    this.#idleTimer = setTimeout(() => {
      this.#idleTimer = null;
      this.#closeSession();
    }, this.#idleNull);
  }

  #closeSession(): void {
    if (this.#addressed === null) return;
    for (const msg of encodeRpnNull(this.#channel)) this.#sink.send(msg);
    this.#addressed = null;
  }
}
