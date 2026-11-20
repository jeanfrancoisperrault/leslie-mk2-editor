# Leslie 2101 mk2 Editor — plan d'attaque (pour Claude Code)

> Éditeur web (desktop first) pour configurer une Leslie 2101 mk2 via Web MIDI (NRPN + SysEx),
> en remplacement de la navigation par boutons de la face avant.
> Langue de l'UI : français par défaut, structure i18n prête pour l'anglais.
> **Les commentaires de code sont écrits en anglais.**

---

## 0. Décisions déjà prises

- **Plateforme** : application web statique, sans backend. Chrome / Edge uniquement (Web MIDI). Safari non supporté → message clair à l'ouverture.
- **Desktop first** : conçu pour 1440×900, utilisable jusqu'à 1100 px de large. Pas de layout mobile dans la v1 (un écran « trop étroit » propre suffit).
- **Stack** : Vite + TypeScript, pas de framework lourd (vanilla + petit store ; Svelte ou Preact acceptables si ça simplifie nettement). Tests : Vitest. Vérification visuelle : Playwright.
- **Priorité visuelle** : le rendu compte autant que la fonction (voir §2).
- **Section explicative** : chaque paramètre a une explication contextuelle (voir §4.3). C'est une fonctionnalité centrale, pas un tooltip.
- **Principe MIDI** : édition en direct par **NRPN** (documenté, complet). **SysEx** réservé au dump mémoire (sauvegarde / archivage).

---

## 1. Ce que dit le manuel (source : manuel 2101mk2, section MIDI)

Source : https://im.static-thomann.de/pics/atg/atgdata/document/manual/leslie_2101mk2.pdf
✅ Vérifié le 2026-11-20 contre le PDF (voir docs/manual-verification.md) : tables et erratum
confirmés ; restent inconnus la table exacte Low Slow/Fast (*3/*4) et la valeur « OFF » des brake times.

### 1.1 Séquence NRPN

Pour chaque changement de paramètre, sur le canal de contrôle de la Leslie (défaut : canal 1) :

```
Bn 63 <MSB>     ; CC99  — NRPN MSB = code du paramètre (colonne « CC99 » ci-dessous)
Bn 62 7F        ; CC98  — NRPN LSB = toujours 7F
Bn 06 <value>   ; CC6   — Data Entry MSB (la valeur)
(Bn 26 <lsb>)   ; CC38  — Data Entry LSB, probablement inutile ici
Bn 65 7F        ; CC101 — RPN Null (recommandé par le manuel)
Bn 64 7F        ; CC100 — RPN Null
```

### 1.2 Paramètres système (communs aux deux presets)

| Paramètre | CC99 (hex) | Plage | Défaut |
|---|---|---|---|
| Preset Number | 10 | 0–1 (Preset 1, 2) | 0 |
| System Control Channel | 11 | 0–16 (canal 1–16, 16 = Off) | 0 |
| Program Channel | 12 | 0–16 | 16 (Off) |
| Modulation Receive | 13 | 0–1 | 1 (On) |
| Expression Receive | 14 | 0–1 | 0 (Off) |
| Slow/Fast Control Type | 15 | 0–1 (Unlatch / Latch) | 1 |
| Slow/Fast Control Code | 16 | 0–99 (erratum : 0–97) | 82 (erratum ; manuel original : 64) |
| Other Preset Foot Switch Type | 17 | 0–1 (Unlatch / Latch) | 0 |
| Leslie Mode | 18 | 0–2 (Slow, Fast, Brake) | 0 |

### 1.3 Paramètres de preset (Preset 1 et Preset 2 ont chacun les leurs)

| Paramètre | CC99 (hex) | Plage | Défaut P1 | Défaut P2 |
|---|---|---|---|---|
| **Horn** Slow Speed | 00 | 0–99 → Table A | 8 (46 rpm) | 8 |
| Horn Fast Speed | 02 | 1–27 → Table A2 | 9 (400 rpm) | 9 |
| Horn Rise Time | 04 | 0–39 → Table B | 1,8 s | 3,0 s |
| Horn Fall Time | 06 | 0–39 → Table B | 2,4 s | 3,0 s |
| Horn Brake Time | 08 | 0–39 → Table B, ou OFF | 3,0 s | 3,0 s |
| Horn Character (mk2) | 1C | 0–3 → Table D | FL | FL |
| Horn Rot Level | 19 | 0–99 | 50 | 50 |
| **Low rotor** Slow Speed | 01 | 0–9 (0 = stop, 24–48 rpm) | 3 (31 rpm) | 3 |
| Low Fast Speed | 03 | 1–21 (372–431 rpm) | 1 (376 rpm) | 1 |
| Low Rise Time | 05 | 0–24 → Table C | 12 s | 13 s |
| Low Fall Time | 07 | 0–24 → Table C | 5,5 s | 12 s |
| Low Brake Time | 09 | 0–24 → Table C, ou OFF | 10 s | 14 s |
| Low Rot Level | 1A | 0–99 | 99 | 99 |
| Bass Level | 1B | 0–99 | 90 | 90 |
| **Commun** Crossover | 0E | 0–2 → 0,7 k / 0,8 k / 1,0 kHz | 0,8 k | 0,8 k |
| Cabinet Character (mk2) | 1D | 0–3 → Table F | 12 (122) | 21 (21H) |

Zones d'incertitude à traiter comme des **points à vérifier sur la machine**, pas comme des faits :
- la valeur numérique de « OFF » pour les temps de frein ;
- la table exacte de Low Slow Speed (probablement la même que Horn Slow pour 0–9) ;
- la table exacte de Low Fast Speed (la plage annoncée 372–431 ne colle pas exactement avec A2).

### 1.4 Tables de valeurs

```
Table A  — Horn Slow Speed (donnée → rpm)
0:0 1:24 2:27 3:31 4:33 5:36 6:40 7:42 8:46 9:48
10:50 11:52 12:57 13:61 14:63 15:65 16:68 17:72 18:76 19:78
20:80 21:84 22:87 23:91 24:93 25:97 26:100 27:102 28:106 29:108
30:112 31:114 32:117 33:121 34:123 35:127 36:130 37:132 38:136 39:138
40:142 41:145 42:147 43:151 44:153 45:157 46:160 47:162 48:166 49:168
50:172 51:174 52:178 53:181 54:183 55:187 56:189 57:193 58:195 59:198
60:202 61:204 62:208 63:210 64:213 65:217 66:219 67:223 68:225 69:229
70:231 71:234 72:238 73:240 74:243 75:247 76:249 77:253 78:255 79:258
80:262 81:264 82:267 83:271 84:273 85:276 86:280 87:282 88:286 89:288
90:291 91:295 92:297 93:300 94:302 95:306 96:309 97:311 98:315 99:318

Table A2 — Horn Fast Speed (donnée → rpm)
1:376 2:378 3:382 4:384 5:387 6:391 7:393 8:397 9:400 10:402
11:406 12:408 13:411 14:414 15:418 16:421 17:424 18:427 19:430 20:431
21:435 22:438 23:442 24:444 25:447 26:450 27:452

Table B  — Horn Rise/Fall/Brake (donnée → secondes)
0..24 : 0.2 s par pas (0.2 → 5.0)      25..39 : 0.5 s par pas (5.5 → 12.5)

Table C  — Low Rise/Fall/Brake (donnée → secondes)
0:0.5 1:1.0 2:1.5 3:2.0 4:2.5 5:3.0 6:3.5 7:4.0 8:4.5 9:5.0
10:5.5 11:6.0 12:6.5 13:7.0 14:7.5 15:8.0 16:8.5 17:9.0 18:9.5 19:10.0
20:10.5 21:11.0 22:12.0 23:13.0 24:14.0

Table D  — Horn Character : 0 Flat, 1 « 1.0k », 2 « 1.6k », 3 « 2.0k »
Table F  — Cabinet Character : 0 « 122 » (12), 1 « 21H » (21), 2 Bright (br), 3 Flat (FL)
```

### 1.5 SysEx — dump mémoire

```
F0 55 10 10 1C 11 00 [PNH] [PNL] [DATA …] [CHD] F7
```
- `55` = ID constructeur Suzuki, `10` = device, `10 1C` = model ID, `11` = data packet, `00` = type memory dump.
- `PNH/PNL` = numéro de paquet.
- `DATA` = 128 octets, envoyés en **256 octets ASCII « nibblisés »** (ex. `7E` → `37 45`).
- `CHD` = 7 bits de poids faible du XOR de tous les octets DATA.
- Le dump **se déclenche depuis la face avant** (menu DUMP OUT, l'afficheur clignote « dp » puis s'arrête). Le manuel **ne documente pas le Dump In**.
- Aucune commande de lecture à distance n'est documentée → l'éditeur ne peut pas « demander » l'état courant.

---

## 2. Skills et méthode de travail design

Skills disponibles dans la session Claude Code : **impeccable** (shape / critique / audit / document /
extract — lit PRODUCT.md et DESIGN.md), **ui-ux-pro-max** (catalogue styles/palettes/typo, à utiliser
une fois en exploration), **web-design-guidelines** (audit final). Vérification visuelle : navigateur
intégré de Claude Code (ou Playwright MCP).

### Workflow design

1. `PRODUCT.md` (fait) puis `/impeccable shape` pour un plan UX **avant tout code**.
2. Optionnel, une seule fois : interroger ui-ux-pro-max pour des pistes de palette / typo ; trancher, puis noter le résultat dans `DESIGN.md`.
3. Construire ; `/impeccable critique` à la fin de chaque phase UI ; `/impeccable audit` avant livraison ; passe finale web-design-guidelines.
4. `/impeccable document` pour générer `DESIGN.md`, `/impeccable extract` pour factoriser composants et tokens.

### 2.2 Pistes de direction visuelle (à trancher à l'étape `shape`)

Pas d'imposition : l'utilisateur est designer et décidera. Deux axes à comparer sur de vraies maquettes :
- **Panneau d'instrument** : regroupement par « blocs » physiques (Horn, Low rotor, Cabinet), contrôles tactiles, typographie de façade d'ampli.
- **Éditorial / technique** : grille sobre, grande typographie, courbes et schémas mis en avant.
Quelle que soit la direction : contraste AA minimum, états focus visibles, navigation clavier complète.

---

## 3. Architecture

```
src/
  midi/         webmidi.ts (accès ports, hot-plug), nrpn.ts (encodage), queue.ts (coalescing/throttle), mock.ts
  params/       schema.ts (source de vérité : id, nrpn, plage, défaut, table de valeurs), tables.ts
  sysex/        dump.ts (capture, vérif checksum, décodage nibbles), syx-file.ts (import/export .syx)
  state/        store.ts (preset 1/2 courant, dirty flags, undo/redo), presets.ts (presets nommés, JSON)
  content/      explanations.fr.ts (une entrée par paramètre, voir §4.3), explanations.en.ts
  ui/           shell, panels, controls, explainer, rotor-viz, curve-viz, midi-console
  tests/
```

Règles :
- `schema.ts` est la **seule** source de vérité : l'UI, l'encodeur NRPN, les tests et les explications en dérivent.
- **Mode simulateur** (`mock.ts`) : un port MIDI factice qui journalise les messages. Indispensable pour développer et tester l'UI sans la Leslie (Playwright, CI).
- Envoi : coalescer par paramètre (n'envoyer que la dernière valeur), cadence ~30 ms pendant un drag de slider ; n'émettre CC99/CC98 que si le paramètre change.
- Tests unitaires obligatoires : séquence d'octets NRPN, tables de conversion, checksum et décodage nibbles (avec un dump réel fourni par l'utilisateur dans `fixtures/`).

---

## 4. UX — écrans et comportements (desktop first)

### 4.1 Gabarit (1440×900)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Header : [Port MIDI ▾] [Canal ▾] ● connecté   Preset [1|2]  [A/B]  ⋯     │
├───────────────────────────────────────────────┬──────────────────────────┤
│ Zone d'édition (≈ 2/3)                        │ Panneau explicatif (≈1/3)│
│  ┌ Horn ─────────┐ ┌ Low rotor ────────┐      │  Titre du paramètre      │
│  │ vitesses      │ │ vitesses          │      │  Ce que ça fait          │
│  │ rise/fall/brk │ │ rise/fall/brake   │      │  Ce qu'on entend         │
│  │ char · level  │ │ level · bass      │      │  Plage · défaut · unité  │
│  └───────────────┘ └───────────────────┘      │  Visualisation dédiée    │
│  ┌ Cabinet & croisement ┐ ┌ Système ────┐      │  Conseils de réglage     │
│  └──────────────────────┘ └─────────────┘      │                          │
├───────────────────────────────────────────────┴──────────────────────────┤
│ Console MIDI repliable (messages envoyés/reçus, copiables)               │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Comportements clés
- Valeurs toujours affichées **en unités réelles** (« 46 rpm », « 1,8 s »), la valeur brute en secondaire.
- Clavier : flèches = pas, Maj = grand pas, double-clic = retour au défaut ; focus visible partout.
- A/B : comparer Preset 1 et Preset 2 côte à côte.
- Undo / redo, indicateur « modifié non sauvegardé », presets nommés (JSON import/export).
- États soignés : pas de Web MIDI (Safari), aucun port, port perdu, permission refusée, mode simulateur.
- Bouton **« Envoyer tout »** (pousse l'état complet vers la Leslie) — utile si les NRPN ne sont pas mémorisés (à vérifier en phase 0).
- Bandeau honnête : « L'éditeur ne peut pas lire la machine ; l'état affiché est celui de l'éditeur » tant que la lecture de dump n'est pas implémentée.

### 4.3 Section explicative (fonctionnalité centrale)

Se met à jour au **focus ou au survol** d'un paramètre. Chaque entrée de `content/` contient :
1. **Nom court + nom du menu de la machine** (pour faire le lien avec l'afficheur).
2. **Ce que ça fait** (2–3 phrases, langage clair).
3. **Ce qu'on entend** (effet audible, pas du jargon).
4. **Plage / défaut / unité**, et la valeur courante convertie.
5. **Visualisation dédiée** (voir ci-dessous).
6. **Conseils** (ex. réglages habituels, interactions avec d'autres paramètres).

Visualisations :
- Rise / Fall / Brake : courbe vitesse-temps (slow → fast → stop) qui se redessine en direct.
- Slow / Fast Speed : rotor animé tournant à la vitesse réelle (respecter `prefers-reduced-motion`).
- Crossover : schéma des deux voies (cornet / rotor grave) et du point de coupure.
- Horn / Cabinet Character : schéma **qualitatif** — ne pas inventer de courbe de réponse mesurée ; l'indiquer comme schématique.

Contenu seed (à reformuler, à faire relire par l'utilisateur) :
- *Rise time* : durée de l'accélération de slow vers fast. *Fall time* : durée du ralentissement de fast vers slow. *Brake time* : durée pour s'arrêter.
- Le cornet (aigus) et le rotor grave (basses) ont des inerties différentes : c'est ce qui donne l'effet Leslie authentique, d'où des temps distincts.
- Le croisement répartit le signal entre cornet et rotor grave.
Ne rien affirmer d'audible que le manuel ou l'utilisateur ne confirme pas ; en cas de doute, rester descriptif.

---

## 5. Phases et critères d'acceptation

**Phase 0 — Spikes matériel (fait par l'utilisateur, 1 soirée)** — à terminer ou à simuler avant de coder :
- NRPN modifie-t-il le preset *sélectionné* ou le preset *courant* ?
- Les changements survivent-ils à l'extinction ?
- Canal de contrôle OK (défaut canal 1) ? Slow/Fast Control Code réel ?
- Capturer un dump complet et le déposer dans `fixtures/`.
Le code doit rester **correct dans les deux cas** (mémorisé ou non) grâce à « Envoyer tout ».

**Phase 1 — Fondations + `/impeccable shape`**
- PRODUCT.md, plan UX validé, tokens de base (couleurs, typo, espacement).
- `schema.ts` complet + tests ; encodeur NRPN testé ; mode simulateur.
- ✅ Les tests passent ; un slider envoie la bonne séquence d'octets dans le simulateur.

**Phase 2 — Éditeur Horn + Low rotor + panneau explicatif**
- Panneaux, contrôles, conversions, explications et visualisations de ces sections.
- ✅ Réglage réel d'un paramètre audible sur la Leslie ; captures 1440×900 et 1280×800 ; `/impeccable critique` traité.

**Phase 3 — Cabinet, croisement, système, presets A/B, undo, presets nommés**
- ✅ Toute la table §1 est éditable ; export/import JSON ; navigation clavier complète.

**Phase 4 — SysEx : sauvegarde / archivage**
- Capture d'un dump en direct, vérification checksum, export `.syx`, import de `.syx`.
- ✅ Round-trip décodage → réencodage identique sur le fixture ; checksum validé.

**Phase 5 (optionnelle, risquée) — Lecture de l'état depuis un dump**
- Cartographier les 128 octets (changer un seul paramètre à la fois, diff des dumps) pour initialiser l'éditeur.
- Dump In non documenté : à n'implémenter qu'après test prudent sur le matériel.

**Phase 6 — Finitions**
- `/impeccable audit`, passe web-design-guidelines, PWA hors-ligne, `/impeccable document` + `extract`.
