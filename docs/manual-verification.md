# Vérification du manuel (PDF Thomann, 2026-11-20)

> Modèles : le manuel officiel est commun aux **2101 mk2 et 2103 mk2** (Suzuki/Hammond le
> publient sous « 2101mk2/2103mk2 Manual » ; hammond.eu liste un seul PDF pour les deux).
> Même implémentation MIDI, mêmes tables, même SysEx — tout ce qui suit vaut pour les deux.

Source : https://im.static-thomann.de/pics/atg/atgdata/document/manual/leslie_2101mk2.pdf
Extraction complète : docs/manual-extraction.md (local, non versionné — texte du manuel sous copyright ; tables MIDI ≈ lignes 1493–2155).

## Confirmé par le PDF

- **Séquence NRPN** : CC99 (63h) = code paramètre (colonne « NRPN Adr. MSB »), CC98 (62h) = `7F`
  (colonne « NRPN Adr. LSB »), CC6 = valeur. Le manuel recommande RPN Null (CC101=7F, CC100=7F)
  après chaque réglage. Data Entry LSB (CC38) existe dans la spec mais la colonne « DATA Range
  LSB(26) » est vide (« - ») pour tous les paramètres → MSB seul suffit.
- **Codes paramètres (hex)** : identiques au plan §1.2/§1.3 (Horn 00/02/04/06/08/1C/19 ;
  Low 01/03/05/07/09/1A/1B ; commun 0E/1D ; système 10–18).
- **Erratum officiel** (pages finales du PDF, versions japonaise et anglaise) — il corrige la table
  principale p. 21-22, c'est lui qui fait foi :
  - S/F Control Code : défaut **82**, plage **0–97** (manuel original : 64, 0–99).
  - Défauts preset corrigés : Horn Rise 1,8 s (P1) / 3,0 s (P2) ; Horn Fall 2,4 / 3,0 ;
    Horn Brake 3,0 / 3,0 ; Low Slow 3 (31 rpm) ; Low Fast 1 (376 rpm) ; Low Rise 12 / 13 s ;
    Low Fall 5,5 / 12 s ; Low Brake 10 / 14 s ; Bass Level 90.
  - La table p. 21 (sans erratum) disait : Horn Rise/Fall/Brake 4,2/3,4/3,6 s, Low Slow 8,
    Low Fast 9, Low Rise/Fall/Brake 12/12/12-14 s, Bass 99 → **ne pas utiliser**.
  - L'erratum ajoute aussi « ,OFF » à la plage des deux Brake Time, et la note : pas de freinage
    quand Brake Time = OFF.
- **Table A** (Horn Slow, 0–99 → 0, 24–318 rpm) : identique au plan, 100 entrées vérifiées.
- **Table A2** (Horn Fast, 1–27 → 376–452 rpm) : identique au plan.
- **Table B** (Horn times, 0–39) : 0–24 = 0,2 s/pas (0,2→5,0), 25–39 = 0,5 s/pas (5,5→12,5). Confirmé.
- **Table C** (Low times, 0–24) : confirmée, y compris la fin irrégulière (21:11,0 / 22:12,0 /
  23:13,0 / 24:14,0).
- **Table D** (Horn Character) : 0 Flat/FL, 1 1.0k, 2 1.6k, 3 2.0k. Confirmé.
- **Table F** (Cabinet Character) : 0 122/« 12 », 1 21H/« 21 », 2 brite/« br », 3 flat/« FL ». Confirmé.
- **SysEx dump** : `F0 55 10 10 1C 11 [TYPE=00] [PNH] [PNL] [DATA×256 nibblisés ASCII] [CHD] F7`,
  CHD = 7 bits bas du XOR des octets DATA. Confirmé. Dump In non documenté ; aucune commande de
  lecture à distance.
- Autres messages reconnus : Modulation (CC1), Expression (CC11), Hold1 (CC64), Korg Rotary
  Fast/Brake (CC82/CC83), Program Change 0–1 (preset 1/2 sur le Program Channel).

## Non présent dans le PDF → à vérifier sur la machine (Phase 0)

- **Table \*3** (Low Slow Speed, 0–9 → rpm) : la plage annoncée « 0, 24–48 rpm » coïncide avec les
  10 premières entrées de la Table A (0, 24, 27, 31, 33, 36, 40, 42, 46, 48) et le défaut
  « 3 (31 rpm) » colle avec A[3]=31 → hypothèse raisonnable, mais la table n'est pas dans le PDF.
- **Table \*4** (Low Fast Speed, 1–21 → rpm) : plage annoncée « 372–431 rpm » mais A2[1]=376 et
  A2[20]=431 → la table exacte diffère peut-être de A2. Défaut « 1 (376 rpm) » colle avec A2[1].
  Marquée non vérifiée dans le schéma.
- **Valeur numérique de « OFF »** pour Horn/Low Brake Time (au-delà de 39 / 24 ? valeur dédiée ?).
- Les NRPN modifient-ils le preset sélectionné ou le preset courant ? Survivent-ils à l'extinction ?


## Sources croisées (2026-11-20, recherche hors manuel mk2)

1. **Manuel 1re génération 2101/2102/2103** (hammondorganco.com, extraction :
   docs/manual-mk1-extraction.md, local non versionné) — contient les notes *3/*4 absentes
   du mk2 : le rotor grave utilise la **même table de vitesses que le cornet**, restreinte à
   0–9 (« 0, 24–48 rpm ») et 1–21. Tables A/A2 identiques octet pour octet au mk2.
   → `LOW_SLOW_RPM` / `LOW_FAST_RPM` passés `verified: true` dans le schéma.
2. **Service manual 2101/2102** (extraction : docs/service-manual-extraction.md, local non versionné) —
   calibration usine du servo de la trompe : **6,60 V → 400 ±7 rpm** (fast défaut) et
   **0,57 V → 36 ±1 rpm** (slow défaut mk1, donnée 5). Moteur « Brushless DC Servo FY815-SD3 ».
   Architecture confirmée : trompe = rotor physique à servo DC ; rotor grave = **simulateur
   DSP stéréo** (son « rpm » est un paramètre de firmware, pas un moteur).
3. **Mesures indépendantes de Leslie mécaniques** (Organ Forum, Hammond-Leslie FAQ) :
   147/122 mesurées trompe ~388–409 rpm fast / 44–48 slow, tambour ~337–404 fast / 40–49 slow
   → les plages du 2101 sont réalistes et du bon ordre.

### Point resté ambigu (mineur, affichage seulement)

Les en-têtes des deux manuels disent « Low Fast 1–21 (372–431 rpm) » alors que leur propre
table donne 376 (donnée 1) … 431 (donnée 20), 435 (donnée 21). Même négligence côté cornet
(« 375–450 » vs table 376–452). L'éditeur suit la table ; l'écart maximal possible est de
4 rpm sur le seul dernier cran. Un contrôle au strobe (app téléphone, méthode décrite sur
Organ Forum) le trancherait définitivement.

### Reste pour la Phase 0 matériel

- Valeur « OFF » des brake times.
- Les NRPN modifient-ils le preset sélectionné ou courant ? Survivent-ils à l'extinction ?
