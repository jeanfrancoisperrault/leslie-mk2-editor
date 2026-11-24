# ADR 0004: Guide panel with notices, closable

- Status: accepted, 2026-11-24

## Context

The panel at rest explained the graph. The owner wanted a short welcome there, plus a trademark notice and a
disclaimer (personal, non-profit project), and wanted to be able to close the panel.

## Decision

1. At rest, two tabs: Welcome (with the two notices) and How to read the graph.
2. A "Guide" button on the line of the tabs, against the panel, shows and hides it: side panel icon, arrow,
   name. A lone arrow in the panel, then a button at its foot, were not understood by the owner. In the top
   bar it truncated the name of the MIDI port, down to nothing at 1270 px and below.
3. The panel is open at every start and its state is not stored, so that the notices are seen.
4. It slides (400 ms, ease-in-out), only on its button; instant under reduced motion.
5. While the keyboard focus is in the tabs, crossing a setting with the pointer does not replace them.

## Consequences

- One more motion than the playhead, the rotors and the lever.
- The notices are usual wording, not legal advice. The README repeats them; the code is under the MIT license.
