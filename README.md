# Leslie 2101/2103 mk2 Editor

A desktop-first web editor for the Leslie 2101 mk2 and 2103 mk2 rotary speakers.
It replaces the front-panel button-and-dial menu with a full-screen editor: every
parameter of the machine on faders and key rows, real-world units first (rpm,
seconds, kHz), and a permanent explainer panel that tells you what each setting
does, what you hear, and shows a live visualization (rotor spinning at the real
speed, speed-time curves, crossover diagram).

Changes are sent live over **Web MIDI** as NRPN messages (the machine's documented
protocol); a simulator mode logs every byte in a collapsible MIDI console when no
hardware is connected. The editor cannot read the machine's state (the protocol is
one-way) — the UI says so honestly and offers a "Send all" push.

## Status

- Phases 1–2 complete: parameter schema (verified against the official manuals and
  errata), NRPN encoder with coalescing send queue, simulator, full editing UI,
  explainer with live visualizations, startup MIDI hookup overlay.
- UI built on the [shadcn/ui](https://ui.shadcn.com/) token system (vanilla
  TypeScript, no framework), dark theme from a shadcn/create preset.
- Planned: A/B preset compare, undo, named presets (JSON), SysEx memory-dump
  capture and `.syx` export.

## Stack

Vite + TypeScript (vanilla, no framework), Vitest. Chrome/Edge only (Web MIDI);
desktop only (1100 px floor).

```bash
npm install
npm run dev     # editor on http://localhost:5173
npm test        # unit tests (NRPN encoding, conversion tables, send queue)
```

## Sources

Parameter tables and defaults are cross-checked against the Leslie 2101mk2/2103mk2
owner's manual (and its errata), the first-generation 2101/2102/2103 manual, and
the 2101/2102 service manual — see
[docs/manual-verification.md](docs/manual-verification.md). Remaining hardware
checks (Phase 0) are listed there.
