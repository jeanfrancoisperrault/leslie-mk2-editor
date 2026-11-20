// Minimal MIDI output abstraction so the NRPN queue can target either a real
// Web MIDI output port or the in-memory simulator (mock.ts).

export interface MidiSink {
  /** Send one complete MIDI message (status byte + data bytes). */
  send(message: Uint8Array): void;
}
