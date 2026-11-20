# Brief UX — Leslie 2101 mk2 Editor (impeccable shape, Phase 1)

Statut : **en attente de validation** (direction visuelle à trancher — voir « Décision ouverte »).
Mode : **Operate** — l'utilisateur accomplit une tâche (régler sa Leslie) ; lisibilité, retour
immédiat et honnêteté de l'état priment sur l'expression. La personnalité vit dans les détails.

## 1. Job et audience

Un organiste seul, à son bureau, Chrome ouvert, la Leslie branchée à côté. Il vient régler sa
machine une fois de temps en temps, en écoutant le résultat en direct. Il n'est pas « utilisateur
expert de l'éditeur » : à chaque visite il a oublié ce que fait Rise Time — l'éditeur doit le lui
réexpliquer sans le lui reprocher. L'écran est regardé **en écoutant** : les yeux font des
allers-retours entre un contrôle et le panneau explicatif.

## 2. Résultat et preuve

Tâche primaire : ajuster un paramètre, l'entendre changer immédiatement, comprendre ce qu'on vient
de changer. Succès : l'utilisateur règle ses deux presets sans ouvrir le manuel, sait ce qui est
« modifié non sauvegardé », et peut exporter/archiver sa configuration.

Vérité produit spécifique (à assumer dans l'UI, pas à cacher) :
- L'éditeur **ne peut pas lire** l'état de la machine → bandeau honnête permanent + « Envoyer tout ».
- Deux tables de conversion Low rotor et la valeur « OFF » des brakes sont **non vérifiées** → les
  afficher comme telles (mention discrète « à confirmer sur la machine ») tant que la Phase 0
  n'est pas faite.

## 3. Direction retenue

Structure (indépendante de la direction visuelle, gabarit §4.1 du PLAN) :
- Header : port MIDI, canal, état de connexion, sélecteur Preset 1/2, A/B, menu.
- Zone d'édition ≈ 2/3 : blocs Horn / Low rotor / Cabinet & croisement / Système, dans cet ordre —
  l'ordre physique et l'ordre d'importance coïncident.
- Panneau explicatif ≈ 1/3, **fixe** (jamais un tooltip) : se met à jour au focus/survol ;
  contenu par paramètre : nom + nom machine, ce que ça fait, ce qu'on entend, plage/défaut/valeur
  convertie, visualisation dédiée, conseils.
- Console MIDI repliable en bas.

Thèse d'interaction : **le son est le feedback principal, l'écran est le second.** Chaque geste
(drag, flèche) doit produire un envoi MIDI < 50 ms ; l'écran confirme (valeur en unités réelles,
visualisation qui se redessine) mais ne rivalise jamais avec l'écoute (pas d'animations décoratives ;
`prefers-reduced-motion` respecté).

Moment focal : le couple contrôle ↔ explication. Le reste de l'interface recule.

## 4. Périmètre et limites

- Desktop 1440×900, utilisable à 1100 px ; écran « trop étroit » propre en dessous. Pas de mobile.
- Chrome/Edge ; Safari → message clair, pas de dégradation silencieuse.
- Français d'abord, i18n prête. Contraste AA minimum, focus visible, navigation clavier complète.
- Anti-objectifs : esthétique « template IA », densité dashboard, jargon non expliqué, skeuomorphisme
  décoratif qui n'informe pas.

## 5. États et plages

- États MIDI : pas de Web MIDI / aucun port / permission refusée / port perdu (hot-plug) /
  connecté / **mode simulateur** (développement et démo, visible comme tel).
- États données : défauts usine (erratum), valeurs modifiées non envoyées ?? (selon résultat
  Phase 0), dirty vs sauvegardé, undo/redo.
- Plages réelles : 25 paramètres (16 par preset ×2 + 9 système), valeurs brutes 0–99 max,
  toujours affichées en unités réelles (rpm, s, kHz), valeur brute en secondaire.

## 6. Interaction et layout

- Sliders/steppers au clavier : flèches = 1 pas, Maj = grand pas, double-clic = défaut.
- A/B : presets 1 et 2 côte à côte, différences mises en évidence.
- Visualisations par famille : courbe vitesse-temps (rise/fall/brake), rotor animé (vitesses),
  schéma deux voies (crossover), schéma qualitatif marqué comme tel (characters).
- Envois MIDI coalescés (dernier gagne, ~30 ms) ; adressage NRPN réémis seulement au changement
  de paramètre ; RPN Null en fin de rafale (implémenté et testé en Phase 1).

## 7. Contraintes et décisions ouvertes

- Stack figée : Vite + TypeScript vanilla, Vitest ; pas de framework lourd.
- **Décision ouverte (propriétaire : l'utilisateur, designer)** — direction visuelle §2.2 :
  1. **Panneau d'instrument** : blocs physiques, contrôles tactiles, typographie de façade d'ampli.
  2. **Éditorial / technique** : grille sobre, grande typographie, courbes et schémas en avant.
  Option recommandée : trancher sur **deux vraies maquettes comparées** (une par direction, même
  gabarit, mêmes données) avant tout code d'UI définitive.
- Après la décision : noter le monde visuel dans DESIGN.md (tokens couleurs/typo/espacement),
  puis Phase 2 (éditeur Horn + Low + panneau explicatif).
