---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["src/main.ts"]
---

# Surface : éditeur Leslie 2101 mk2 (application entière, desktop)

Mode : Operate. Audience : un organiste seul, à son bureau, la Leslie branchée à côté,
qui règle sa machine en écoutant. Tâche : ajuster un paramètre, l'entendre, le comprendre.
Contenu réel : 25 paramètres du manuel (défauts erratum), unités réelles (rpm, s, kHz).
Contraintes : Chrome/Edge (Web MIDI), 1440×900 → 1100 px, AA, clavier complet, UI en anglais.
Plainte à l'origine de la refonte (2026-11-23) : trop générique, trop chargé. Choix de la direction délégué par l'utilisateur.

## Direction contract

THESIS: One graph shows what Slow, Fast and Brake will do to both rotors, drawn from the real
settings. Refuses four stacked toolbars, equal cards and a per-parameter widget.

OWN-WORLD: Strictly neutral black and white (zero chroma, user decision), Plus Jakarta Sans
words, Geist Mono 200 figures and keys, fine-line faders
with an upright stroke in the mode color. Green is Slow, red is Fast, Brake and the rest
are ink; nothing else is colored. Filled point = value now, open point or outlined cap = value read from the machine.

STORY: Press Fast, watch horn and low rotor climb at their own rate while hearing it; change a
time, the ramp redraws in the same place; see at a glance what differs from the machine.

FIRST VIEWPORT: One grey bar (name, Preset 1/2, half-moon rotor switch, connection, Save). Below,
left: Sound/System tabs with a one-line status, the score (about 270 px), then a Horn | Low
pair of columns, each with its own row labels, then Character and Bass
settings in the same two columns. Right: the guide on dark grey.
Console closed as a 36 px foot bar. No scrolling at 1440x900.

FORM: Structure from the engraved score direction (candidate 3, seed key 745285e8); its light skin
was rejected by the user, who chose the walnut skin with neutral grounds. Controls stay standard.

Signature interaction: Slow/Fast/Brake runs a calculated playhead through the score; hovering a
ramp opens its guide, clicking it focuses its fader. Motion exists nowhere else.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review,
the verdict, DESIGN.md, and every shipping raster carrying its provenance
