// Web MIDI access: list output ports, follow hot-plug, expose a MidiSink for
// the selected port. Chrome/Edge only; callers handle the unsupported case.

import type { MidiSink } from './types';

export interface PortInfo {
  id: string;
  name: string;
}

export type MidiEvent =
  | { kind: 'ready'; ports: PortInfo[] }
  | { kind: 'denied' }
  | { kind: 'unsupported' }
  | { kind: 'ports-changed'; ports: PortInfo[] };

export class WebMidi {
  #access: MIDIAccess | null = null;
  #listeners = new Set<(ev: MidiEvent) => void>();

  on(fn: (ev: MidiEvent) => void): void {
    this.#listeners.add(fn);
  }

  #emit(ev: MidiEvent): void {
    for (const fn of this.#listeners) fn(ev);
  }

  ports(): PortInfo[] {
    if (!this.#access) return [];
    return [...this.#access.outputs.values()].map((o) => ({
      id: o.id,
      name: o.name ?? 'Port MIDI',
    }));
  }

  async init(): Promise<void> {
    if (!('requestMIDIAccess' in navigator)) {
      this.#emit({ kind: 'unsupported' });
      return;
    }
    try {
      // SysEx not needed yet (dump capture is Phase 4); plain access prompts less.
      this.#access = await navigator.requestMIDIAccess({ sysex: false });
    } catch {
      this.#emit({ kind: 'denied' });
      return;
    }
    this.#access.addEventListener('statechange', () => {
      this.#emit({ kind: 'ports-changed', ports: this.ports() });
    });
    this.#emit({ kind: 'ready', ports: this.ports() });
  }

  sinkFor(portId: string): MidiSink | null {
    const out = this.#access?.outputs.get(portId);
    if (!out) return null;
    return {
      send(message: Uint8Array) {
        out.send(message);
      },
    };
  }
}
