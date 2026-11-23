# Leslie 2101/2103 mk2 Editor

Pour qui : un seul organiste, à son bureau, qui règle sa Leslie une fois de temps en temps puis l'oublie.

Pourquoi : le menu de la face avant (boutons, afficheur 2 caractères) est opaque ; on veut comprendre
ce qu'on règle et l'entendre changer en direct.

Ton : calme, précis, un peu instrument de musique ; pas un dashboard SaaS.

À éviter : esthétique « template IA » (dégradés violets, cartes génériques), densité de tableau de bord,
jargon non expliqué.

Contexte d'usage : desktop, Chrome, souvent avec la Leslie à côté ; l'écran est regardé en écoutant.

Modèles visés : Leslie 2101 mk2 et 2103 mk2 — même électronique et même implémentation MIDI
(manuel officiel commun « 2101mk2/2103mk2 », les modèles ne diffèrent que par la finition).

Langue de l'interface : anglais (décision utilisateur du 2026-11-20, remplace le français
par défaut du plan initial) ; structure i18n conservée, pack français disponible dans le code.

## Contraintes produit

- Application web statique, sans backend. Chrome / Edge uniquement (Web MIDI) ; message clair sur Safari.
- Desktop first : conçu pour 1440×900, utilisable jusqu'à 1100 px. Pas de layout mobile en v1.
- Langue : projet international, interface en anglais ; i18n prête pour d'autres langues (pack français existant, traductions plus tard). Commentaires de code en anglais.
- Édition en direct par NRPN ; SysEx réservé au dump mémoire (sauvegarde/archivage).
- L'éditeur ne peut pas lire l'état de la machine (pas de dump request documenté) : l'UI doit être
  honnête là-dessus et offrir « Envoyer tout ».
- La section explicative par paramètre (ce que ça fait, ce qu'on entend, visualisation) est une
  fonctionnalité centrale, pas un tooltip.
