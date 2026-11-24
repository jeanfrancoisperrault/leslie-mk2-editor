// When the startup dialog opens. A port's name does not tell what is wired to
// it, so any output port is enough: the waiting screen takes over from there.

import type { MidiEvent } from '../midi/webmidi';

/** 'wiring' is the same dialog, opened on request from the waiting screen. */
export type OverlayKind = 'unsupported' | 'denied' | 'no-port' | 'wiring';

export function dialogFor(ev: MidiEvent): OverlayKind | null {
  switch (ev.kind) {
    case 'unsupported': case 'denied': return ev.kind;
    case 'ready': return ev.outputs.length === 0 ? 'no-port' : null;
    case 'ports-changed': return null;
  }
}
