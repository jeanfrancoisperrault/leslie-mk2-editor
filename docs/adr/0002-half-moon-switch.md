# ADR 0002: Half-moon rotor switch

- Status: accepted for the redesign branch, 2026-11-23

## Context

Organists switch a Leslie with a half-moon lever. The owner drew one in Figma to replace the three
Slow / Fast / Brake keys of the top bar. On a half-moon, Brake sits between Slow and Fast.

## Decision

1. Three real buttons (Slow, Brake, Fast) stay the accessible controls; the lever is a pointer shortcut.
2. A drag sends its command **on release only**, and nothing when released where it started. Going from
   Slow to Fast crosses Brake, and a Brake sent on the way would stop the rotors (`LeverDrag` in
   `src/ui/halfmoon-model.ts`, covered by tests). An interrupted gesture sends nothing.
3. The keyboard never moves the lever step by step, for the same reason.
4. Mode unknown (a dump does not hold it): the lever is ghosted and no LED is lit. A plain center lever
   would read as Brake.
5. LEDs are green for Slow and red for Fast, as drawn by the owner. Position and names carry the
   meaning as well.
6. The lever outline is sampled with a fixed number of points, so CSS animates `d` without a library.

## Consequences

- MIDI messages are unchanged: NRPN Leslie Mode through `shell.onSpeed`.
- The panel hangs 30px over the work area, whose content starts 14px lower.
- Below 1260px the switch is 256px wide instead of 305px, and the connection label is shorter.
