# ADR 0003: Color codes the rotor mode

- Status: accepted for the redesign branch, 2026-11-23
- Replaces: amber for the horn, teal for the low rotor (ADR 0001)

## Context

The half-moon lights green for Slow and red for Fast. With amber and teal for the rotors, the screen had
two color codes at once, and horn and low rotor are already told apart by place and name.

## Decision

1. Green is Slow, red is Fast; Brake and every other setting use ink.
2. A setting takes the mode its speed is held in, or its ramp leads to: slow speed and fall time are
   green, fast speed and rise time red, brake time ink (`voiceOf` in `src/ui/layout.ts`, tested).
3. On the graph a measure takes the color of its command; its first point keeps the color of the speed it
   starts from. The rotors take the color of the mode they follow.
4. The preset lights are ink, although the front panel uses green and red: two meanings for the same
   colors, side by side, were confusing (owner decision). Thin figures use a lighter red for
   legibility. The connection warning keeps its own amber, with a square shape.

5. The graph measures and the setting rows follow the half-moon order: Slow, Brake, Fast, then the level.
   The machine menu orders them differently; the guide gives the machine name of each setting.

## Consequences

- Same setting, same color in both columns: horn and low rotor read side by side.
- Red no longer means an error anywhere; errors stay an ink strip.
