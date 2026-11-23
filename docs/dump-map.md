# Carte du dump SysEx (Leslie 2101 mk2)

Sources, capturées le 2026-11-23 (DUMP OUT, face avant) :
- `fixtures/2026-11-23-leslie-dump.syx` : Leslie en **preset 2** ;
- `fixtures/2026-11-23-leslie-dump-preset1.syx` : même machine passée en **preset 1**, aucun autre réglage modifié ;
- `fixtures/2026-11-23-leslie-dump-preset1-nrpn-horn-speeds.syx` : preset 1, après envoi par l'éditeur
  (NRPN) de Horn Slow = 204 rpm et Horn Fast = 427 rpm, **sans MEMORY**. Capturé et enregistré par l'éditeur ;
- `fixtures/2026-11-23-leslie-dump-preset1-after-memory.syx` : le même état, après appui sur **MEMORY** ;
- `fixtures/2026-11-23-leslie-dump-preset1-after-power-cycle.syx` : après extinction puis rallumage.
Test : `src/tests/dump-fixture.test.ts`.

## Paquet

- **Un seul paquet** de 267 octets : `F0 55 10 10 1C 11 00 00 00 [256 ASCII] 71 F7`.
- Type 00, numéro de paquet 0.
- **Checksum confirmé** : CHD = XOR des **256 octets ASCII** & 0x7F (ici 0x71).
  Le XOR des 128 octets décodés (0x2E) ne correspond pas.
- Le décodage puis le réencodage redonnent exactement le fichier.

## Les 128 octets décodés

```
  0: 48 5A 31 30 30 53 65 74 55 70 00 00 48 5A 2D 31   "HZ100SetUp" "HZ-1
 16: 30 30 20 56 31 2E 30 30 30 20 20 20 00 00 00 00   00 V1.000   "
 32: 01 00 10 01 00 01 52 00 | 00 08 00 03 00 09 00 01
 48: 04 17 04 16 0E 18 55 4C 5A 00 01 00 | 00 08 00 03
 64: 00 09 00 01 04 17 04 16 0E 18 55 4C 5A 00 01 00
 80: | 00 08 00 03 00 09 00 01 08 16 0B 0A 0E 13 32 63
 96: 5A 01 01 01 | 00 08 00 03 00 09 00 01 04 17 04 16
112: 0E 18 55 4C 5A 00 01 00 | FF FA 00 00 00 00 06 00
```

### 0–27 : identification (certain)
ASCII `HZ100SetUp` puis `HZ-100 V1.000` : nom interne HZ-100, firmware 1.000.

### 32–39 : paramètres système, dans l'ordre des NRPN 0x10 → 0x17 (forte confiance)

| Octet | NRPN | Paramètre | Valeur | Lecture |
|---|---|---|---|---|
| 32 | 0x10 | Preset Number | 1 | preset 2 ✓ (compte à partir de 0, **confirmé**) |
| 33 | 0x11 | Control Channel | 0 | canal 1 ✓ |
| 34 | 0x12 | Program Channel | 16 | Off ✓ |
| 35 | 0x13 | Modulation Rx | 1 | On ✓ |
| 36 | 0x14 | Expression Rx | 0 | Off ✓ |
| 37 | 0x15 | Slow/Fast Type | 1 | Latch ✓ |
| 38 | 0x16 | Slow/Fast Code | 82 | **CC#82** (valeur de l'erratum, pas 64) |
| 39 | 0x17 | Preset FS Type | 0 | Unlatch ✓ |

Leslie Mode (0x18) ne semble pas stocké : c'est un état d'exécution.

### 40–119 : 4 blocs de 20 octets (structure probable)

Les blocs commencent aux octets 40, 60, 80 et 100. Dans chaque bloc, les paramètres suivent
l'ordre des NRPN de preset :

| Pos. | Paramètre (NRPN) | Preset 2 (bloc 100) | Preset 1 (bloc 80) |
|---|---|---|---|
| 0–1 | Horn Slow (00), 2 octets | 00 08 → 46 rpm | 00 08 → 46 rpm |
| 2–3 | Low Slow (01), 2 octets | 00 03 → 31 rpm | 00 03 → 31 rpm |
| 4–5 | Horn Fast (02), 2 octets | 00 09 → 400 rpm | 00 09 → 400 rpm |
| 6–7 | Low Fast (03), 2 octets | 00 01 → 376 rpm | 00 01 → 376 rpm |
| 8 | Horn Rise (04) | 4 → 1,0 s | 8 → 1,8 s |
| 9 | Low Rise (05) | 23 → 13 s | 22 → 12 s |
| 10 | Horn Fall (06) | 4 → 1,0 s | 11 → 2,4 s |
| 11 | Low Fall (07) | 22 → 12 s | 10 → 5,5 s |
| 12 | Horn Brake (08) | 14 → 3,0 s | 14 → 3,0 s |
| 13 | Low Brake (09) | 24 → 14 s | 19 → 10 s |
| 14 | Horn Rot Level (19) | 85 | 50 |
| 15 | Low Rot Level (1A) | 76 | 99 |
| 16 | Bass Level (1B) | 90 | 90 |
| 17 | Horn Character (1C) ✓ | 0 → Flat (afficheur « FL ») | 1 → 1.0k (afficheur « 1.0 ») |
| 18 | Crossover (0E) ✓ | 1 → 0,8 kHz | 1 → 0,8 kHz |
| 19 | Cabinet Character (1D) ✓ | 0 → 122 (afficheur « 12 ») | 1 → 21H (afficheur « 21 ») |

Octets 17 et 19 confirmés le 2026-11-23 par lecture de la face avant : preset 1 = HORN CHAR 1.0,
CABINET 21 ; preset 2 = HORN CHAR FL, CABINET 12. Les tables D et F du manuel s'appliquent
telles quelles. Sur cette machine, les cabinets sont **inversés par rapport à l'usine**
(P1 = 21H, P2 = 122) : quelqu'un a reconfiguré les presets.

Rotor grave confirmé le 2026-11-23 (preset 1) : la face avant affiche slow 3, fast 1, rise 12,
fall 5.5, brake 10, rot level 99, bass level 90, ce qui correspond exactement aux valeurs chargées
par l'éditeur. Les vitesses s'affichent en **index** sur la face avant (3, 1), pas en rpm : la
conversion en rpm du rotor grave (tables *3 / *4) ne peut pas être vérifiée de cette façon. Le
rotor grave étant numérique, on ne peut pas non plus le chronométrer. Elle reste « selon le manuel ».

Brake « OFF » : l'erratum ajoute une valeur OFF aux deux Brake Time, mais elle **n'existe pas**
sur la face avant de cette Leslie (constaté le 2026-11-23). L'éditeur ne la propose donc pas.

Octet 18 confirmé le 2026-11-23 : CROSS OVER changé sur la face avant, puis dump ; le curseur
Crossover de l'éditeur a suivi.

### Rôle des blocs (confirmé par la comparaison preset 2 → preset 1)

En passant du preset 2 au preset 1, seuls l'octet 32 (1 → 0) et le **bloc 60** changent.

| Bloc | Rôle |
|---|---|
| 40 | **probablement une copie du preset chargé à l'allumage**. Il ne bouge pas quand on change de preset, mais il est réécrit au démarrage (rôle exact inconnu) |
| 60 | **tampon d'édition** : copie du preset sélectionné, c'est l'état « en cours » |
| 80 | **Preset 1 enregistré** : valeurs d'usine de l'erratum pour tous les temps et niveaux |
| 100 | **Preset 2 enregistré** |

Pour lire l'état courant d'un dump, il suffit donc de lire l'octet 32 et le bloc 60.

**Écritures NRPN (confirmé)** : après l'envoi de Horn Slow = 61 (204 rpm) et Horn Fast = 18
(427 rpm) depuis l'éditeur, seuls les octets 61 et 65 changent, c'est-à-dire le bloc 60, positions
1 et 5. Le preset 1 enregistré (bloc 80) reste intact. Les NRPN modifient donc l'état en cours ;
il faut appuyer sur MEMORY pour enregistrer. Les valeurs stockées sont les index des tables A et A2,
qui sont donc confirmés pour ces deux points. Les octets de poids fort (positions 0 et 4) restent à 00.

**MEMORY (confirmé)** : après l'appui sur MEMORY, seuls les octets 81 et 85 changent (8 → 61, 9 → 18).
Le bloc 80 (preset 1 enregistré) devient identique au bloc 60 (état en cours). MEMORY recopie
donc l'état en cours dans le preset sélectionné.

**Extinction (confirmé)** : après extinction et rallumage, les presets enregistrés, les réglages
système et le preset sélectionné (octet 32) sont conservés. Le preset 1 contient toujours
204 et 427 rpm. **Le bloc 40 change** : il devient une copie du preset 1, chargé au démarrage.
Jusque-là, il contenait le preset 2, sans doute celui chargé au démarrage précédent.

### Encore inconnu

- Le rôle exact du bloc 40 (copie du preset chargé à l'allumage ?).
- Pourquoi les vitesses sont stockées sur 2 octets.
- Le sens des octets 28–31 et 120–127 (`FF FA 00 00 00 00 06 00`).

## Méthode pour lever les doutes

Il faut changer **un seul** paramètre sur la face avant, refaire un DUMP OUT, puis comparer
les deux dumps. Tests prioritaires :
1. Changer Horn Character seul, puis Cabinet Character seul : ça fixe les octets 17 à 19.
2. Noter ce qu'affiche la face avant pour HORN CHAR et CABINET sur chaque preset.
3. Modifier un paramètre sans appuyer sur MEMORY, puis l'enregistrer avec MEMORY : on verra
   si seul le bloc 60 change, puis le bloc 80 ou 100.

## Problème connu : footswitch avec les câbles MIDI branchés

Constaté le 2026-11-23, non résolu. Avec les câbles MIDI branchés (MidiSport 2x2 en USB Merge) :
- le bouton Brake du footswitch fait passer en **Fast** et émet `B0 63 18 / B0 62 7F / B0 06 01`
  (Leslie Mode = Fast), et le même message revient à chaque appui ;
- le bouton Slow/Fast n'émet rien.

Le problème ne se produit pas quand les câbles MIDI sont débranchés.

Piste à vérifier : une **boucle MIDI**. Le MIDI OUT de la Leslie recopie son MIDI IN. Si le mode
Merge de la MidiSport renvoie aussi son entrée MIDI IN 1 vers la sortie A, chaque message du
footswitch revient dans la Leslie et peut être réinterprété. Test possible : refaire la manip avec
seulement le câble « MidiSport OUT → Leslie IN » branché.

## Dump In : renvoyer un dump écrit la mémoire (confirmé)

Test du 2026-11-23. La mémoire contenait Preset 1 Horn Slow / Fast = 204 / 427 rpm. Le dump de ce
matin (`fixtures/2026-11-23-leslie-dump.syx`, Preset 1 = 46 / 400 rpm, preset 2 sélectionné) a été
envoyé à la Leslie avec SysEx Librarian. Ensuite, la Leslie a été éteinte puis rallumée, et un
DUMP OUT a été lancé depuis la face avant : l'éditeur affiche de nouveau 46 / 400 rpm.

- **Recevoir un dump écrit les presets enregistrés de façon permanente**, sans appui sur MEMORY.
  C'est le seul moyen connu d'écrire la mémoire par MIDI.
- **Piège de l'écho** : quand un autre logiciel envoie un dump à la Leslie, son MIDI OUT le
  renvoie tel quel. L'éditeur le reçoit alors comme s'il venait de la machine, et le charge. Ce
  dump-là reflète ce qui a été **envoyé**, pas l'état réel de la Leslie : il faut un DUMP OUT pour
  le confirmer.
