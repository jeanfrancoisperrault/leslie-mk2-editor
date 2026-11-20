// French explanation content, one entry per parameter id in schema.ts.
// Structure i18n-ready: an explanations.en.ts with the same shape can be
// swapped in later. Keep claims descriptive — nothing audible is asserted
// beyond what the manual or the user confirmed (PLAN.md section 4.3).

import type { Explanation } from './types';

export const EXPLANATIONS_FR: Record<string, Explanation> = {
  // --- Horn rotor ---
  hornSlowSpeed: {
    title: 'Vitesse lente du cornet',
    what: 'La vitesse de rotation du cornet (aigus) en mode slow, aussi appelé chorale. C’est la rotation de repos, celle qu’on entend la plupart du temps.',
    hear: 'Une ondulation lente et régulière du timbre et du volume dans les aigus. Plus la valeur monte, plus l’ondulation se rapproche d’un trémolo.',
    advice: 'Le réglage d’usine (46 rpm) est proche des cabines classiques. La valeur 0 arrête le cornet en mode slow.',
    viz: 'rotor',
  },
  hornFastSpeed: {
    title: 'Vitesse rapide du cornet',
    what: 'La vitesse de rotation du cornet en mode fast, le trémolo. C’est la vitesse atteinte quand vous basculez slow → fast.',
    hear: 'La profondeur et le caractère du trémolo dans les aigus. La plage utile est étroite (376–452 rpm) : les écarts sont subtils.',
    advice: 'Le service manual calibre le moteur de la trompe à 400 ± 7 rpm sur le défaut d\u2019usine — la vitesse de trémolo classique.',
    viz: 'rotor',
  },
  hornRiseTime: {
    title: 'Temps de montée du cornet',
    what: 'La durée que met le cornet pour accélérer de sa vitesse lente à sa vitesse rapide quand vous passez en fast.',
    hear: 'Un temps court donne un décollage presque immédiat du trémolo ; un temps long laisse le chorale s’épaissir progressivement.',
    advice: 'Le cornet est léger : des montées de 0,8 à 2,5 s restent naturelles. C’est l’écart avec le temps de montée du rotor grave qui fait l’effet Leslie.',
    viz: 'curve',
  },
  hornFallTime: {
    title: 'Temps de descente du cornet',
    what: 'La durée que met le cornet pour ralentir de sa vitesse rapide à sa vitesse lente quand vous repassez en slow.',
    hear: 'Le trémolo se calme plus ou moins vite. Un temps long donne une retombée planante, un temps court coupe net l’effet.',
    viz: 'curve',
  },
  hornBrakeTime: {
    title: 'Temps de frein du cornet',
    what: 'La durée que met le cornet pour s’arrêter complètement quand vous passez en mode brake (stop).',
    hear: 'L’ondulation ralentit jusqu’à l’arrêt. La valeur « OFF » (si réglée sur la machine) désactive le freinage.',
    advice: 'La valeur exacte de « OFF » n’est pas documentée dans le manuel — à confirmer sur la machine.',
    viz: 'curve',
  },
  hornCharacter: {
    title: 'Caractère du cornet',
    what: 'Un filtre qui colore la voie du cornet (nouveauté mk2). Flat laisse la voie telle quelle ; 1.0k, 1.6k et 2.0k accentuent une zone des aigus.',
    hear: 'Un changement de brillance de la voie aiguë. Schéma qualitatif : le manuel ne publie pas de courbe de réponse mesurée.',
    viz: 'character',
  },
  hornRotLevel: {
    title: 'Niveau du cornet',
    what: 'Le volume de la voie rotative aiguë (cornet) dans le mélange, de 0 à 99.',
    hear: 'La présence des aigus tournants par rapport au rotor grave. À 0, le cornet disparaît du mélange.',
    advice: 'Se règle avec le niveau du rotor grave et le niveau basse pour équilibrer la cabine.',
    viz: 'none',
  },

  // --- Low rotor ---
  lowSlowSpeed: {
    title: 'Vitesse lente du rotor grave',
    what: 'La vitesse de rotation du tambour grave en mode slow. La valeur 0 l’arrête.',
    hear: 'Une houle lente dans les basses. Le rotor grave est plus lourd que le cornet : sa rotation s’entend comme un balancement plutôt qu’un trémolo.',
    advice: 'Les Leslie mécaniques classiques tournent leur tambour vers 40–48 rpm en chorale ; les 31 rpm d\u2019usine sont un peu plus posés.',
    viz: 'rotor',
  },
  lowFastSpeed: {
    title: 'Vitesse rapide du rotor grave',
    what: 'La vitesse du tambour grave en mode fast.',
    hear: 'La profondeur du battement dans les basses en mode trémolo.',
    advice: 'Les Leslie mécaniques mesurées tournent leur tambour vers 340–400 rpm en trémolo — les 376 rpm d\u2019usine sont en plein dedans.',
    viz: 'rotor',
  },
  lowRiseTime: {
    title: 'Temps de montée du rotor grave',
    what: 'La durée que met le tambour grave pour atteindre sa vitesse rapide. Il est bien plus lourd que le cornet, d’où des temps plus longs.',
    hear: 'Les basses se mettent à battre progressivement, après le cornet : ce décalage entre les deux rotors est la signature de l’effet Leslie.',
    viz: 'curve',
  },
  lowFallTime: {
    title: 'Temps de descente du rotor grave',
    what: 'La durée que met le tambour grave pour revenir à sa vitesse lente.',
    hear: 'La houle grave se calme après le cornet, en prolongeant la retombée de l’effet.',
    viz: 'curve',
  },
  lowBrakeTime: {
    title: 'Temps de frein du rotor grave',
    what: 'La durée que met le tambour grave pour s’arrêter complètement en mode brake.',
    hear: 'Le balancement grave ralentit jusqu’à l’arrêt. « OFF » désactive le freinage.',
    advice: 'La valeur exacte de « OFF » n’est pas documentée dans le manuel — à confirmer sur la machine.',
    viz: 'curve',
  },
  lowRotLevel: {
    title: 'Niveau du rotor grave',
    what: 'Le volume de la voie rotative grave dans le mélange, de 0 à 99.',
    hear: 'La présence du balancement grave. À 0, seule la voie aiguë tourne encore.',
    viz: 'none',
  },
  bassLevel: {
    title: 'Niveau basse',
    what: 'Le volume du haut-parleur de basse stationnaire (non rotatif), de 0 à 99.',
    hear: 'L’assise grave fixe sous l’effet rotatif : plus de corps sans plus de mouvement.',
    viz: 'none',
  },

  // --- Common ---
  crossover: {
    title: 'Fréquence de croisement',
    what: 'Le point de partage du signal entre le rotor grave (en dessous) et le cornet (au-dessus) : 0,7, 0,8 ou 1,0 kHz.',
    hear: 'Déplace la frontière entre la houle grave et le trémolo aigu ; le médium bascule d’une voie à l’autre.',
    viz: 'crossover',
  },
  cabinetCharacter: {
    title: 'Caractère de cabine',
    what: 'Une coloration globale qui évoque d’autres cabines Leslie : 122, 21H, Bright ou Flat (nouveauté mk2).',
    hear: 'Un changement de timbre d’ensemble. Schéma qualitatif : le manuel ne publie pas de courbe de réponse mesurée.',
    advice: 'Le preset 1 d’usine est en 122 (la cabine orgue classique), le preset 2 en 21H.',
    viz: 'character',
  },

  // --- System ---
  presetNumber: {
    title: 'Preset actif',
    what: 'Le preset actuellement chargé par la machine (1 ou 2). L’éditeur l’envoie aussi quand vous changez de preset ici.',
    hear: 'Tous les paramètres de preset basculent d’un coup.',
    viz: 'none',
  },
  controlChannel: {
    title: 'Canal de contrôle',
    what: 'Le canal MIDI sur lequel la Leslie reçoit les messages de contrôle (NRPN, modulation…). 1 à 16, ou Off.',
    hear: 'Rien en soi — mais si ce canal ne correspond pas à celui de l’éditeur, plus aucun réglage n’atteint la machine.',
    advice: 'L’éditeur émet sur ce canal. Défaut usine : canal 1.',
    viz: 'none',
  },
  programChannel: {
    title: 'Canal de programme',
    what: 'Le canal MIDI sur lequel la Leslie accepte les Program Change (changement de preset). Off par défaut.',
    hear: 'Permet à un orgue ou un pédalier de changer de preset à distance.',
    viz: 'none',
  },
  modulationReceive: {
    title: 'Réception modulation',
    what: 'Active la commande slow/fast par la molette de modulation (CC1) de l’instrument connecté.',
    hear: 'La molette bascule la vitesse de la cabine.',
    viz: 'none',
  },
  expressionReceive: {
    title: 'Réception expression',
    what: 'Active la commande de vitesse par pédale d’expression (CC11).',
    hear: 'La pédale pilote la vitesse de la cabine.',
    viz: 'none',
  },
  slowFastControlType: {
    title: 'Type de commande slow/fast',
    what: 'Le comportement du contact slow/fast : Unlatch (momentané, actif tant qu’on appuie) ou Latch (bascule à chaque appui).',
    hear: 'Change la façon de jouer les transitions, pas le son lui-même.',
    viz: 'none',
  },
  slowFastControlCode: {
    title: 'Code de commande slow/fast',
    what: 'Le numéro de Control Change qui déclenche slow/fast (0–97). Défaut usine : CC 82 (erratum du manuel).',
    hear: 'Rien en soi — c’est l’adresse MIDI du commutateur de vitesse.',
    viz: 'none',
  },
  presetFootSwitchType: {
    title: 'Type de pédale de preset',
    what: 'Le comportement de la pédale qui bascule vers l’autre preset : Unlatch ou Latch.',
    hear: 'Change la façon de basculer entre presets au pied.',
    viz: 'none',
  },
  leslieMode: {
    title: 'Mode Leslie',
    what: 'L’état courant des rotors : Slow (chorale), Fast (trémolo) ou Brake (arrêt).',
    hear: 'La bascule qu’on entend le plus : l’accélération ou le ralentissement des deux rotors, chacun à son inertie.',
    advice: 'Pratique depuis l’éditeur pour entendre l’effet des temps de montée et descente qu’on vient de régler.',
    viz: 'none',
  },
};
