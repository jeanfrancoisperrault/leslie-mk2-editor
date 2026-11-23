---
name: leslie-midi-safety
description: Safety rules for any code or action that sends MIDI to the Leslie 2101/2103 mk2 (NRPN, CC, SysEx, dumps). Use before adding or changing anything in src/midi, src/sysex, the store's send path, Save to memory, or when preparing a .syx file or a MIDI message for the user to send to the machine.
---

# Leslie MIDI safety

The editor talks to a real, expensive instrument. These rules come from hardware tests
recorded in `docs/dump-map.md`; follow them before writing or reviewing MIDI code.

## Never send

- **A SysEx whose meaning is not confirmed** on this machine. Known and safe: the Suzuki memory
  dump packet (`F0 55 10 10 1C 11 …`) built from a real dump. Tried with no effect: dump requests
  `F0 55 10 10 1C 12/13 00 F7`, Universal identity request. Anything else: ask the user first
  and explain the risk.
- **Values outside the schema range** (`src/params/schema.ts`). The Leslie ignores them, but never
  rely on that.
- **Anything before a dump has been received.** The store is locked (`Store.locked`) until
  `loadFromDevice`; keep every send path behind that lock. Factory defaults are not the machine's
  values.
- **Anything automatically** on connection, page load or port change. Only explicit user actions write.

## Writing memory

- NRPN only changes the active state (edit buffer, block 60). MEMORY or a received dump writes the
  stored presets.
- A dump sent to the Leslie overwrites both stored presets and the system settings **permanently**.
  Always build it with `encodeDumpData` from the last real dump, overwrite only confirmed bytes,
  keep unknown bytes (0–31, block 40, 120–127), and ask for confirmation in the UI.
- The system block includes the control channel: writing a wrong channel can cut the editor off.

## Echo

The Leslie's MIDI OUT merges its MIDI IN: everything sent comes back on the input. Every outgoing
message must go through the tee sink so `EchoFilter.noteSent` records it; incoming handling must
skip echoes (never parse our own dump as a reading of the machine). A dump sent by another app
also comes back and looks like a reading: only a front-panel DUMP OUT reflects the real state.

## Speed control

Slow / Fast / Brake use NRPN Leslie Mode (0x18) only. Do not reintroduce CC 82 (may toggle in
Latch mode) or the Roland SysEx (no Brake).

## Checklist before committing MIDI changes

- [ ] Unit test with exact bytes for every new message.
- [ ] Round-trip test against the real dumps in `fixtures/` when dump code changes.
- [ ] No send path bypasses the lock or the tee sink.
- [ ] New hardware behavior is tested on the Leslie (see the `leslie-hardware-test` skill) and
      recorded in `docs/dump-map.md` before relying on it.
