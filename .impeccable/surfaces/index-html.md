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
Contraintes : Chrome/Edge (Web MIDI), 1440×900 → 1100 px, AA, clavier complet, fr d'abord.
Non-résolu : table Low Slow/Fast exacte et valeur « OFF » des brakes (Phase 0 matériel).

## Direction contract

THESIS: Une façade d'instrument qui explique ce qu'elle règle : le panneau sombre d'ampli
(blocs Horn / Low rotor) accouplé à une colonne d'explication permanente. Refuse le
dashboard SaaS clair à cartes et le tooltip : l'explication est une surface fixe, pas un survol.

OWN-WORLD: Charbon chaud façon tolex (#171412/#1f1b18), encre crème sérigraphiée (#ece3d3),
ambre lampe (#e8a33d) pour valeurs et états actifs, rouge LED discret pour « modifié » et
alertes. Archivo (labels capitales espacées, chiffres tabulaires), faders à glissière avec
échelle graduée, boutons-touches à bord fin. Reconnaissable vide : un panneau d'ampli nocturne.

STORY: Le visiteur branche, voit le port connecté, touche un fader, entend la Leslie changer
et lit à droite ce qu'il vient de changer (ce que ça fait, ce qu'on entend, courbe). Il repart
en ayant compris sa machine.

FIRST VIEWPORT: Header instrument (marque, port+canal+LED, Preset 1/2, Envoyer tout),
bandeau d'honnêteté, zone d'édition 2/3 en deux colonnes de blocs (Cornet, Rotor grave,
Cabinet & croisement, Système), colonne explicative 1/3 à droite avec titre, prose, méta
(valeur/plage/défaut), visualisation ; console MIDI repliée en pied. Action primaire : les
faders eux-mêmes.

FORM: Panneau d'instrument (option A de PLAN.md §2.2, choisie par l'utilisateur sur
maquettes comparées — mockups/a-panneau.html fait foi pour la composition ; pas de
concept-seed : direction épinglée par le brief). Signature : le couple fader ↔ explication
qui se redessine en direct.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review,
the verdict, DESIGN.md, and every shipping raster carrying its provenance
