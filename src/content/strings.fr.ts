// UI strings, French. Same-shaped strings.en.ts can be swapped in later.

import type { RotorSettings } from '../ui/score-model';

export const STR = {
  appTitle: 'Leslie 2101 mk2',
  groups: {
    horn: 'Cornet',
    low: 'Rotor grave',
  } as Record<string, string>,
  rows: {
    slowSpeed: 'Vitesse lente',
    fastSpeed: 'Vitesse rapide',
    riseTime: 'Montée',
    fallTime: 'Descente',
    brakeTime: 'Freinage',
    level: 'Niveau',
  },
  toneGroups: { character: 'Caractère', bass: 'Réglages des basses' },
  toneRows: { horn: 'Cornet', cabinet: 'Cabine', level: 'Niveau', crossover: 'Coupure' },
  systemGroups: {
    channels: 'Canaux MIDI',
    reception: 'Réception MIDI',
    switches: 'Pédales et commutateurs',
  },
  views: { aria: 'Réglages', sound: 'Son', system: 'Système' },
  connection: {
    label: 'Connexion MIDI',
    channel: 'Canal écouté par la Leslie',
    states: {
      unsupported: 'Pas de Web MIDI',
      denied: 'MIDI refusé',
      'no-port': 'Aucun port MIDI',
      simulator: 'Simulateur',
    },
  },
  score: {
    aria: 'Vitesse des rotors dans le temps',
    rotors: { horn: 'Cornet', low: 'Rotor grave' },
    empty: 'Graphique vide : en attente des réglages de la Leslie.',
    summary: (h: RotorSettings, l: RotorSettings) =>
      `Vitesse des rotors dans le temps. Cornet : ${h.slow} à ${h.fast} rpm, montée ${h.rise} s, descente ${h.fall} s, freinage ${h.brake} s. ` +
      `Rotor grave : ${l.slow} à ${l.fast} rpm, montée ${l.rise} s, descente ${l.fall} s, freinage ${l.brake} s.`,
  },
  was: (value: string) => `lu : ${value}`,
  explainerEmpty: {
    title: 'Guide des réglages',
    body: [
      'Survolez ou sélectionnez un réglage : ce qu’il fait, ce qu’on entend et sa plage s’affichent ici.',
      'Le graphique montre les deux rotors sur la même horloge : ce qui se passe avec Slow et Brake quand les rotors tournent vite, puis avec Fast quand ils tournent lentement. Les cinq lignes sont la vitesse, de 0 à 400 rpm.',
      'Vert : Slow, rouge : Fast, blanc : Brake, sur le graphique, les curseurs et le half-moon.',
      'Il est calculé d’après les réglages. Les rampes sont tracées droites ; la courbe exacte de la machine n’est pas documentée.',
      'Un point plein est la valeur actuelle. Un point creux, ou un curseur ou une touche en contour, est la dernière valeur en mémoire dans la Leslie (lue ou enregistrée), visible dès que vous la changez.',
    ],
  },
  preset1: 'Preset 1',
  preset2: 'Preset 2',
  saveMemory: {
    label: 'Enregistrer en mémoire',
    hint: 'Écrit les deux presets et les réglages système dans la mémoire de la Leslie (par un dump SysEx).',
    needDump: 'Faites d’abord un DUMP OUT depuis la Leslie : l’écriture part d’un vrai dump.',
    needPort: 'Choisissez la sortie MIDI reliée à la Leslie.',
    needSysex: 'La permission SysEx est nécessaire.',
    confirm: 'Écrire les deux presets et les réglages système dans la mémoire de la Leslie ?\n\nCela remplace ce qui est enregistré sur la machine. Faites ensuite un DUMP OUT pour vérifier.',
    sent: 'Écrit dans la mémoire de la Leslie. Faites un DUMP OUT pour vérifier.',
  },
  loaded: {
    short: (time: string) => `Lu sur la Leslie à ${time}.`,
    written: (time: string) => `Écrit dans la Leslie à ${time}. Faites un DUMP OUT pour vérifier.`,
    checkWrite: 'La Leslie ne confirme pas une écriture. Un DUMP OUT depuis sa face avant montre ce qu’elle contient vraiment.',
    shortUnsaved: (n: number) => `${n} absent(s) de sa mémoire.`,
    edits: (n: number) => `${n} modifié(s) ici depuis.`,
    unsaved: (n: number) => `${n} réglage(s) du preset actif ne sont pas enregistrés : appuyez sur MEMORY sur la Leslie pour les garder. Les modifications faites ensuite ne sont pas relues.`,
    allSaved: 'Le preset actif correspond à sa mémoire. Les modifications faites ensuite ne sont pas relues ; refaites un dump pour actualiser.',
  },
  waiting: {
    title: 'En attente de la Leslie',
    body: 'L’éditeur n’affiche rien tant qu’il n’a pas lu les vrais réglages de la Leslie. Envoyez-les depuis la Leslie :',
    steps: [
      'Vérifiez que la connexion MIDI (barre du haut) utilise l’entrée MIDI reliée au MIDI OUT de la Leslie.',
      'Sur la Leslie, tournez FUNCTION sur DUMP OUT.',
      'Appuyez sur VALUE jusqu’à ce que « dP » clignote. Les réglages apparaissent ici quand le clignotement s’arrête.',
    ],
    note: 'Les boutons Slow, Fast et Brake fonctionnent déjà.',
  },
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
    crossover: 'Répartition du signal entre les deux voies.',
    character: 'Schéma qualitatif — pas une mesure.',
  },
  whatLabel: 'Ce que ça règle.',
  hearLabel: "Ce qu'on entend.",
  adviceLabel: 'Conseil.',
  off: 'Off',
  midiOut: 'Sortie MIDI (vers le MIDI IN de la Leslie)',
  midiIn: 'Entrée MIDI (depuis le MIDI OUT de la Leslie)',
  noInput: 'Aucune entrée',
  consoleClear: 'Effacer',
  credits: 'Crédits :',
  dir: { out: '→', in: '←', echo: '↩ écho' },
  sysexShort: 'SysEx refusé : l’éditeur ne peut pas lire la Leslie. Autorisez-le (icône à gauche de l’URL), puis rechargez.',
  sendFailed: 'Non envoyé : le port MIDI a refusé le message. Vérifiez le câble et la connexion.',
  sysexDenied: 'Permission SysEx refusée : l’éditeur ne peut ni recevoir ni envoyer de dump, il ne peut donc pas lire la Leslie. Autorisez le SysEx (icône à gauche de l’URL) puis rechargez.',
  speed: {
    label: 'Rotor',
    cmds: { slow: 'Slow', fast: 'Fast', brake: 'Brake' },
    note: 'Envoi immédiat vers la Leslie.',

  },
  dump: {
    receiving: (n: number) => `Réception du dump… ${n} paquet(s)`,
    done: (n: number, bad: number, mode: string) =>
      `Dump reçu : ${n} paquet(s), ` + (bad === 0 ? `checksum OK (${mode})` : `${bad} erreur(s) de checksum`),
    save: 'Enregistrer le dump (.syx)',
  },
};
