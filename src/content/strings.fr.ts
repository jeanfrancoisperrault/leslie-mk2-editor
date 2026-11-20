// UI strings, French. Same-shaped strings.en.ts can be swapped in later.

export const STR = {
  appTitle: 'Leslie 2101 mk2',
  appSubtitle: 'Éditeur',
  groups: {
    horn: 'Cornet — Horn rotor',
    low: 'Rotor grave — Low rotor',
    common: 'Cabinet & croisement',
    system: 'Système',
  } as Record<string, string>,
  preset1: 'Preset 1',
  preset2: 'Preset 2',
  sendAll: 'Envoyer tout',
  honesty:
    "L'éditeur ne peut pas lire la machine. L'état affiché est celui de l'éditeur — « Envoyer tout » pousse la configuration complète vers la Leslie.",
  honestyLead: "L'éditeur ne peut pas lire la machine.",
  console: 'Console MIDI',
  consoleEmpty: 'Aucun message envoyé pour l’instant.',
  machineMenu: 'Menu machine',
  currentValue: 'valeur',
  hints: {
    step: 'pas',
    bigStep: 'grand pas',
    reset: 'ou double-clic : défaut',
  },
  range: 'plage',
  defaultShort: 'défaut',
  rawData: 'donnée',
  display: 'afficheur',
  modified: 'Modifié depuis l’ouverture',
  unverified: 'table à confirmer',
  simulator: 'Simulateur',
  simulatorNote: 'Mode simulateur — les messages sont journalisés dans la console MIDI, rien n’est envoyé.',
  channel: 'Canal',
  states: {
    unsupported:
      'Web MIDI n’est pas disponible dans ce navigateur. Utilisez Chrome ou Edge ; le mode simulateur reste utilisable.',
    denied:
      'Accès MIDI refusé. Autorisez le MIDI dans le navigateur (icône à gauche de l’URL), puis rechargez.',
    noPort: 'Aucun port MIDI détecté. Branchez la Leslie (ou une interface MIDI), elle apparaîtra ici.',
    portLost: 'Port MIDI perdu — vérifiez le câble. Repli sur le simulateur.',
  },
  vizCaptions: {
    curve: 'La courbe se redessine pendant le réglage.',
    rotor: 'Rotation à la vitesse réelle.',
    rotorStopped: 'Rotor arrêté (donnée 0).',
    rotorReduced: 'Animation désactivée (prefers-reduced-motion).',
    crossover: 'Répartition du signal entre les deux voies.',
    character: 'Schéma qualitatif — pas une mesure.',
  },
  whatLabel: 'Ce que ça règle.',
  hearLabel: "Ce qu'on entend.",
  adviceLabel: 'Conseil.',
  off: 'Off',
};
