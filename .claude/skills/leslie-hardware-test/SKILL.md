---
name: leslie-hardware-test
description: Protocol for verifying editor behavior on the real Leslie 2101/2103 mk2 with front-panel dumps, byte-level diffs and fixtures. Use when a feature depends on how the machine reacts (a new parameter, a new message type, memory writes), when a byte of the dump is still unknown, or when the user reports what the Leslie or the editor showed during a test.
---

# Testing on the real Leslie

Claude cannot reach the Leslie: the user runs the test, Claude prepares it and analyzes the result.
The in-app browser has no Web MIDI; the user tests in Chrome on the same dev server.

## 1. Prepare

- State one hypothesis and what result would confirm or refute it.
- Change **one thing at a time** between two dumps; say which bytes should change.
- Say what the test changes on the machine (active state, stored memory, selected preset) and
  how to undo it (which fixture `.syx` restores the previous state).
- Give steps the user can follow without context: where to click, what to read on the display.
  The dump is started **on the Leslie** (FUNCTION → DUMP OUT, VALUE until "dP" blinks) and saved
  **in the editor** (Save dump .syx → Downloads).

## 2. Analyze

- Decode both packets and diff the 128 data bytes (`parseDumpPacket`, then compare). Check the
  checksum (XOR of the 256 ASCII bytes).
- Report the changed bytes with block and offset (blocks start at 40, 60, 80, 100; 20 bytes each;
  system bytes 32–39), and the meaning in real units.
- Watch for echoes: a dump that arrives right after another app sent one reflects what was sent,
  not the machine.

## 3. Record

- Copy the dump into `fixtures/` with a descriptive name
  (`YYYY-MM-DD-leslie-dump-<what-changed>.syx`).
- Add a test in `src/tests/dump-fixture.test.ts` asserting exactly which bytes changed.
- Update `docs/dump-map.md`: mark confirmed items, move resolved items out of "Encore inconnu".
- Keep claims honest: "confirmed" only for what the machine showed; otherwise "consistent" or
  "per the manual".

## Known facts (2026-11-23)

Byte 32 = selected preset (0-based); block 60 = active state; 80 / 100 = stored Preset 1 / 2;
block 40 likely the preset loaded at power-on. NRPN → active state only; MEMORY → stored preset;
a received dump → stored presets, permanent. Low-rotor speeds show as an index on the panel.
Brake OFF does not exist on this unit. The footswitch trouble of 2026-11-23 was a bad
cable (found 2026-11-24); which button gives which mode has to be read again.
