# ADR 0001: Rotor score layout, neutral dark skin

- Status: accepted for the redesign branch, 2026-11-23
- Replaces: shadcn/ui preset `b1GdzAEwU` (stone + amber, dark)

## Context

The owner found the interface too generic and too crowded: four strips before the first setting,
about 25 parameters at the same level, cards and toggles that could belong to any dashboard. The
owner asked for a new visual world and left the choice of direction open.

## Decision

1. Strictly neutral dark interface, engraved faders (since 2026-11-24 fine lines, see `DESIGN.md`). Amber for the horn and teal for the
   low rotor, since replaced by ADR 0003. A first skin (light engraved score, celadon shell, Alegreya Sans) was built and
   rejected by the owner, who kept its structure. Three skins were then compared on the running app
   (dark walnut, light bench, midnight enamel); the owner chose walnut without any brown tint.
2. One score shows both rotors on the same clock and replaces the per-parameter curve and rotor
   figures. It is a pure function of the settings (`src/ui/score-model.ts`).
3. Horn and low rotor settings share one matrix (since 2026-11-24: two columns that each repeat the row
   names, with fine-line faders, drawn by the owner in Figma); system settings move to a second view; ports,
   channel and dump status move to a popover; the console starts closed.
4. "Changed" now means "differs from the last dump, or from the last successful Save to memory", per
   preset, instead of "touched since launch". The status says "Written" and not "Read" after a save: the
   Leslie does not acknowledge it, only a DUMP OUT checks it.
5. Plus Jakarta Sans (words) and Geist Mono 200 (figures and keys), chosen by the owner, are bundled
   through `@fontsource` (OFL), no CDN.

## Consequences

- Rotor speeds on screen are calculated. Ramps are straight lines because the machine's curve is not
  documented; the guide says so.
- The dump does not hold the rotor mode (`docs/dump-map.md`), so speeds stay unknown until a command
  is sent or reported. "Leslie mode" is no longer listed in System: the top bar sends the same NRPN.
- The pressed Slow / Fast / Brake key is the last command sent or reported, no longer only reported.
- No MIDI message changed. No light theme for now.
