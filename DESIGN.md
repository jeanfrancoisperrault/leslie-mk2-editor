---
name: Leslie 2101/2103 mk2 Editor
description: Neutral black and white editor; green and red code the rotor mode, slow and fast
colors:
  ground: "oklch(0.17 0 0)"
  surface: "oklch(0.265 0 0)"
  surface-soft: "oklch(0.225 0 0)"
  surface-press: "oklch(0.38 0 0)"
  ink: "oklch(0.97 0 0)"
  ink-soft: "oklch(0.755 0 0)"
  ink-dim: "oklch(0.66 0 0)"
  rule-strong: "oklch(0.37 0 0)"
  control: "oklch(0.56 0 0)"
  backdrop: "oklch(0 0 0 / 0.65)"
  slow: "oklch(0.8 0.21 147)"
  fast: "oklch(0.65 0.235 27)"
  fast-text: "oklch(0.735 0.165 25)"
  warn: "oklch(0.8 0.145 72)"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.2
  brand:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  readout:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "20px"
    fontWeight: 200
  value:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "18px"
    fontWeight: 200
  key:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "15px"
    fontWeight: 200
  scale:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 200
rounded:
  mark: "1px"
  cap: "3px"
  key: "4px"
  control: "6px"
  dialog: "12px"
spacing:
  row: "2px 10px"
  bar: "0 24px"
  work: "30px 28px 16px"
  guide: "24px 28px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.control}"
    height: "38px"
    padding: "0 18px"
  button-outline:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "38px"
    padding: "0 18px"
  lamp-key:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    height: "38px"
    padding: "0 12px"
  lamp-key-on:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.control}"
    textColor: "{colors.ink}"
  enum-key:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink-soft}"
    height: "36px"
    padding: "0 12px"
  enum-key-on:
    backgroundColor: "{colors.surface-press}"
    textColor: "{colors.ink}"
---

# Design System: Leslie 2101/2103 mk2 Editor

## Overview

**Creative North Star: "The half-moon in the dark"**

A dark, strictly neutral panel where color means only one thing: slow or fast. Black, white and grey
for everything else, engraved faders for the hand, one graph that shows both rotors on the same
clock. Layout and controls stay standard. History in `docs/adr/0001-score-design.md`.

## Colors

- **Neutral rule**: every ground, surface, text and outline has zero chroma. No warm or cool tint
  (user decision, 2026-11-23).
- **Mode rule**: green is Slow, red is Fast, Brake and everything else are `ink`, through `--voice`
  (`docs/adr/0003-color-by-mode.md`). Slow speed and fall time are green, fast speed and rise time red.
  Horn and low rotor are told apart by place and name, never by color.
- **LED rule**: `slow` and `fast` also light the half-moon LEDs. Unlit, the lens keeps a dark tint.
  Position and names always say it too, so the hue is never alone. Preset lights are `ink`: the front
  panel uses green and red for them, but here those colors mean slow and fast (user decision).
- Thin Geist Mono figures in red use `fast-text`, lighter. `warn` amber is for the square marker of the
  connection only.
- `ground` for the work area, `surface` for the bar, `surface-soft` for the guide and the focused
  row, `surface-press` for the chosen option. Only the primary action is solid `ink`.
- Errors are `ground` text on an `ink` strip. `control` (4:1) outlines controls; `rule-strong` is for
  graph lines only.

## Typography

Two faces, one job each (user decision, 2026-11-23), all bundled through `@fontsource`, no CDN.

- **Plus Jakarta Sans** (400, 500, 600, 700): all words. Titles and tabs in 600 and 700, labels and buttons in
  500, prose in 400.
- **Geist Mono 200**: figures and the contents of keys. Values, past values, score times and scales,
  guide figures, enum keys, selects, MIDI bytes (received bytes in 400). At this weight text under
  18px uses full `ink` or the mode color; only unchosen enum keys go down to `ink-soft`.

Single-line interface text is centered on its capitals (`text-box: trim-both cap alphabetic`), so
both faces share one axis; boxes keep whole-pixel heights (bar controls 38px, keys and selects 36px).

Scale: 13, 15, 18, 20, 24. Sentence case everywhere; capitals appear only on the preset and half-moon keys and where the machine's own
menu prints them.

## Layout

One bar (name, preset, rotor, connection, save), then work area and guide
(`clamp(320px, 26vw, 400px)`), then the closed MIDI console. Two views: Sound and System.
Rotor settings are one matrix, grouped by mode in half-moon order (slow speed, fall time; brake time;
fast speed, rise time; level), not in the order of the machine menu: one row per setting, one column per rotor, with a spacer wide
enough (64px or more) that the horn's figures never read as labels of the low rotor's faders. The graphs grow with
the window height (64 to 124 px); at 1440x900 Sound fits without scrolling. Below 1260 px the tone
and system groups take one column. Minimum width 1100 px.

## Elevation

Flat surfaces, told apart by grey steps and 1px lines. Besides the LED glow, the fader is the only exception: an inset
shadow in its groove, a drop shadow under its cap.

## Components

### Score (signature)
- Two graphs, one per rotor, 64px apart. The five lines of each are the speed, 0 to 400 rpm by 100.
- Three measures, 56px apart, in half-moon order: Slow and Brake (both from fast), Fast (from slow). Each starts at its command, lasts 17 s and
  carries its own speed and time scale, so no scale is read against a neighbour's curve.
- Ramps are straight and the guide says so: the machine's exact curve is not documented.
- A measure takes its command's color, its first point the color of the speed it starts from; the
  rotors take the color of the mode they follow.
- Filled point: value now. Open point and dashed line: value last read from the
  Leslie or saved to its memory.
- Hovering a stretch opens its guide, clicking it focuses its fader. Never the only way in.
- Slow / Fast / Brake runs a playhead and turns the rotors at the calculated speed. Before a
  command is sent or reported the speed reads "— rpm": a dump does not hold the rotor mode.

### Fader
- Native range input: 5px engraved groove filled in the mode color, upright white cap with an index
  line, ticks at real detents, outlined cap at the value last read from the
  machine or saved to it, once edited. Arrows, Shift+arrows, Delete or double-click.

### Keys, selects, buttons
- Lamp keys (presets): no outline, no fill. A point that lights `ink` plus a name; inactive name
  in `ink-dim`, `ink` on hover. The active key sits on `ground`, with the control radius, darker than
  the bar. A faint 1px rule separates them from the half-moon.
- Enum keys: one `control` outline around the options. Others in `ink-soft`; the chosen one is `ink` on
  `surface-press`. No solid white fill outside the primary button.
- Primary button: ink. Disabled: outline and `ink-soft`, no opacity tricks.
- Connection: one button with the state in words, opening a popover with ports, channel and dump.

### Half-moon (rotor switch)
- A panel in the bar's color that hangs 30px below it, with a three-position lever: Slow left, Brake
  center, Fast right (`docs/adr/0002-half-moon-switch.md`). Drawn by the owner in Figma.
- Slow, Brake and Fast are real keys in capitals; the lit LED has a 4px glow, the only one in the app.
- Lever: `ground` body, `ink-soft` top, leaning outwards at both ends. Drag, or press the slot. The
  command leaves on release, never while crossing Brake. Unknown mode: dashed, ghosted, no LED.

### Credits
- One 13px `ink-dim` line at the right end of the console bar; the link turns `ink` on hover.

### Guide
- Fixed right column, never a tooltip. Title in the mode color, machine menu name, what it sets,
  what you hear, value (with raw data or display code) / range / default, figure for tone settings.

## Motion

The playhead, the rotors and the half-moon lever are the only motion, and they carry state. Transitions 150 to 200 ms.
With reduced motion the rotors do not turn; the figures still update.

## Do's and Don'ts

### Do:
- **Do** keep green for Slow and red for Fast everywhere, and nothing else in color.
- **Do** show real units first; raw data lives in the guide.
- **Do** say what is calculated and what was read from the machine.
- **Do** keep every setting reachable through a standard control.

### Don't:
- **Don't** tint the neutrals, or add wood, tolex or metal texture; every mark on the score is data.
- **Don't** add a toolbar strip; a state is one sentence above the score or a line in the popover.
- **Don't** use raw colors in components; tokens only.
- **Don't** load fonts or assets from a CDN.
