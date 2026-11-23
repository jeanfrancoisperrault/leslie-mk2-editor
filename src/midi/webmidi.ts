// Web MIDI access: list input and output ports, follow hot-plug, expose a
// MidiSink for the selected output and a listener on the selected input.
// Chrome/Edge only; callers handle the unsupported case.

import type { MidiSink } from './types';

export interface PortInfo {
  id: string;
  name: string;
}

export interface PortLists {
  outputs: PortInfo[];
  inputs: PortInfo[];
}

export type MidiEvent =
  | ({ kind: 'ready'; sysex: boolean } & PortLists)
  | { kind: 'denied' }
  | { kind: 'unsupported' }
  | ({ kind: 'ports-changed' } & PortLists);

export type InputHandler = (bytes: Uint8Array, timeStamp: number) => void;

export class WebMidi {
  #access: MIDIAccess | null = null;
  #sysex = false;
  #listeners = new Set<(ev: MidiEvent) => void>();
  #input: MIDIInput | null = null;
  #inputHandler: ((ev: MIDIMessageEvent) => void) | null = null;

  /** Whether SysEx permission was granted (needed to send or receive SysEx). */
  get sysex(): boolean {
    return this.#sysex;
  }

  on(fn: (ev: MidiEvent) => void): void {
    this.#listeners.add(fn);
  }

  #emit(ev: MidiEvent): void {
    for (const fn of this.#listeners) fn(ev);
  }

  #list(map: MIDIOutputMap | MIDIInputMap | undefined): PortInfo[] {
    if (!map) return [];
    return [...map.values()]
      .filter((p) => p.state !== 'disconnected')
      .map((p) => ({ id: p.id, name: p.name ?? 'MIDI port' }));
  }

  ports(): PortLists {
    return { outputs: this.#list(this.#access?.outputs), inputs: this.#list(this.#access?.inputs) };
  }

  async init(): Promise<void> {
    if (!('requestMIDIAccess' in navigator)) {
      this.#emit({ kind: 'unsupported' });
      return;
    }
    try {
      // SysEx is needed for the Roland speed messages and for dumps.
      this.#access = await navigator.requestMIDIAccess({ sysex: true });
      this.#sysex = true;
    } catch {
      // SysEx refused: plain MIDI (CC / NRPN) still works.
      try {
        this.#access = await navigator.requestMIDIAccess({ sysex: false });
      } catch {
        this.#emit({ kind: 'denied' });
        return;
      }
    }
    this.#access.addEventListener('statechange', () => {
      this.#emit({ kind: 'ports-changed', ...this.ports() });
    });
    this.#emit({ kind: 'ready', sysex: this.#sysex, ...this.ports() });
  }

  sinkFor(portId: string): MidiSink | null {
    const out = this.#access?.outputs.get(portId);
    if (!out) return null;
    const sysex = this.#sysex;
    return {
      send(message: Uint8Array) {
        // Without SysEx permission the browser throws on F0 messages.
        if (message[0] === 0xf0 && !sysex) throw new Error('SysEx permission not granted');
        out.send(message);
      },
    };
  }

  /** Listen on one input port (null = stop listening). */
  listen(portId: string | null, handler: InputHandler): boolean {
    if (this.#input && this.#inputHandler) {
      this.#input.removeEventListener('midimessage', this.#inputHandler as EventListener);
    }
    this.#input = null;
    this.#inputHandler = null;
    if (portId === null) return true;
    const input = this.#access?.inputs.get(portId);
    if (!input) return false;
    this.#inputHandler = (ev: MIDIMessageEvent) => {
      if (ev.data) handler(ev.data, ev.timeStamp);
    };
    input.addEventListener('midimessage', this.#inputHandler as EventListener);
    this.#input = input;
    return true;
  }
}
