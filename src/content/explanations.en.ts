// English explanation content (default language), one entry per parameter id
// in schema.ts. Keep claims descriptive — nothing audible is asserted beyond
// what the manual or the user confirmed (PLAN.md section 4.3).

import type { Explanation } from './types';

export const EXPLANATIONS_EN: Record<string, Explanation> = {
  // --- Horn rotor ---
  hornSlowSpeed: {
    title: 'Horn slow speed',
    what: 'The rotation speed of the horn (treble) in slow mode, also called chorale. This is the resting rotation, the one you hear most of the time.',
    hear: 'A slow, even undulation of timbre and volume in the highs. As the value rises, the undulation gets closer to a tremolo.',
    advice: 'The factory setting (46 rpm) is close to the classic cabinets. Value 0 stops the horn in slow mode.',
    viz: 'rotor',
  },
  hornFastSpeed: {
    title: 'Horn fast speed',
    what: 'The rotation speed of the horn in fast mode — the tremolo. This is the speed reached when you switch slow → fast.',
    hear: 'The depth and character of the treble tremolo. The useful range is narrow (376–452 rpm): differences are subtle.',
    advice: 'The service manual calibrates the horn motor at 400 ± 7 rpm on the factory default — the classic tremolo speed.',
    viz: 'rotor',
  },
  hornRiseTime: {
    title: 'Horn rise time',
    what: 'How long the horn takes to accelerate from its slow speed to its fast speed when you switch to fast.',
    hear: 'A short time gives an almost immediate tremolo take-off; a long time lets the chorale thicken gradually.',
    advice: 'The horn is light: rises of 0.8 to 2.5 s stay natural. The gap with the low rotor’s rise time is what makes the Leslie effect.',
    viz: 'curve',
  },
  hornFallTime: {
    title: 'Horn fall time',
    what: 'How long the horn takes to slow down from its fast speed back to its slow speed when you return to slow.',
    hear: 'The tremolo settles faster or slower. A long time gives a floating comedown; a short one cuts the effect off.',
    viz: 'curve',
  },
  hornBrakeTime: {
    title: 'Horn brake time',
    what: 'How long the horn takes to come to a complete stop when you switch to brake (stop) mode.',
    hear: 'The undulation slows down to a standstill. The “OFF” setting (if set on the machine) disables braking.',
    advice: 'The exact data value of “OFF” is not documented in the manual — to confirm on the hardware.',
    viz: 'curve',
  },
  hornCharacter: {
    title: 'Horn character',
    what: 'A filter that colors the horn way (new on the mk2). Flat leaves the way untouched; 1.0k, 1.6k and 2.0k emphasize a treble region.',
    hear: 'A change of brightness in the treble way. Qualitative schematic: the manual publishes no measured response curve.',
    viz: 'character',
  },
  hornRotLevel: {
    title: 'Horn level',
    what: 'The volume of the rotating treble way (horn) in the mix, 0 to 99.',
    hear: 'The presence of the spinning highs against the low rotor. At 0 the horn disappears from the mix.',
    advice: 'Set it together with the low rotor level and the bass level to balance the cabinet.',
    viz: 'none',
  },

  // --- Low rotor ---
  lowSlowSpeed: {
    title: 'Low rotor slow speed',
    what: 'The rotation speed of the bass drum in slow mode. Value 0 stops it.',
    hear: 'A slow swell in the lows. The low rotor is much heavier than the horn: its rotation reads as a sway rather than a tremolo.',
    advice: 'Classic mechanical Leslies idle their drum around 40–48 rpm; the factory 31 rpm here is slightly statelier.',
    viz: 'rotor',
  },
  lowFastSpeed: {
    title: 'Low rotor fast speed',
    what: 'The speed of the bass drum in fast mode.',
    hear: 'The depth of the low-end beating in tremolo mode.',
    advice: 'Measured mechanical Leslies run their drum around 340–400 rpm in tremolo — the factory 376 rpm sits right in that range.',
    viz: 'rotor',
  },
  lowRiseTime: {
    title: 'Low rotor rise time',
    what: 'How long the bass drum takes to reach its fast speed. It is far heavier than the horn, hence the longer times.',
    hear: 'The lows start beating gradually, after the horn: that offset between the two rotors is the signature of the Leslie effect.',
    viz: 'curve',
  },
  lowFallTime: {
    title: 'Low rotor fall time',
    what: 'How long the bass drum takes to return to its slow speed.',
    hear: 'The low swell settles after the horn, stretching out the comedown of the effect.',
    viz: 'curve',
  },
  lowBrakeTime: {
    title: 'Low rotor brake time',
    what: 'How long the bass drum takes to come to a complete stop in brake mode.',
    hear: 'The low sway slows to a standstill. “OFF” disables braking.',
    advice: 'The exact data value of “OFF” is not documented in the manual — to confirm on the hardware.',
    viz: 'curve',
  },
  lowRotLevel: {
    title: 'Low rotor level',
    what: 'The volume of the rotating bass way in the mix, 0 to 99.',
    hear: 'The presence of the low-end sway. At 0, only the treble way still rotates.',
    viz: 'none',
  },
  bassLevel: {
    title: 'Bass level',
    what: 'The volume of the stationary (non-rotating) bass speaker, 0 to 99.',
    hear: 'The fixed low-end foundation under the rotary effect: more body without more motion.',
    viz: 'none',
  },

  // --- Common ---
  crossover: {
    title: 'Crossover frequency',
    what: 'The split point between the low rotor (below) and the horn (above): 0.7, 0.8 or 1.0 kHz.',
    hear: 'Moves the border between the low swell and the treble tremolo; the midrange tips from one way to the other.',
    viz: 'crossover',
  },
  cabinetCharacter: {
    title: 'Cabinet character',
    what: 'An overall coloration evoking other Leslie cabinets: 122, 21H, Bright or Flat (new on the mk2).',
    hear: 'A change of overall timbre. Qualitative schematic: the manual publishes no measured response curve.',
    advice: 'Factory preset 1 is 122 (the classic organ cabinet), preset 2 is 21H.',
    viz: 'character',
  },

  // --- System ---
  presetNumber: {
    title: 'Active preset',
    what: 'The preset currently loaded by the machine (1 or 2). The editor also sends it when you switch presets here.',
    hear: 'All preset parameters change at once.',
    viz: 'none',
  },
  controlChannel: {
    title: 'Control channel',
    what: 'The MIDI channel on which the Leslie receives control messages (NRPN, modulation…). 1 to 16, or Off.',
    hear: 'Nothing by itself — but if this channel does not match the editor’s, no setting reaches the machine anymore.',
    advice: 'The editor transmits on this channel. Factory default: channel 1.',
    viz: 'none',
  },
  programChannel: {
    title: 'Program channel',
    what: 'The MIDI channel on which the Leslie accepts Program Change messages (preset switching). Off by default.',
    hear: 'Lets an organ or a pedal switch presets remotely.',
    viz: 'none',
  },
  modulationReceive: {
    title: 'Modulation receive',
    what: 'Enables slow/fast control from the modulation wheel (CC1) of the connected instrument.',
    hear: 'The wheel toggles the cabinet speed.',
    viz: 'none',
  },
  expressionReceive: {
    title: 'Expression receive',
    what: 'Enables speed control from an expression pedal (CC11).',
    hear: 'The pedal drives the cabinet speed.',
    viz: 'none',
  },
  slowFastControlType: {
    title: 'Slow/fast control type',
    what: 'The behavior of the slow/fast contact: Unlatch (momentary, active while held) or Latch (toggles on each press).',
    hear: 'Changes how you play the transitions, not the sound itself.',
    viz: 'none',
  },
  slowFastControlCode: {
    title: 'Slow/fast control code',
    what: 'The Control Change number that triggers slow/fast (0–97). Factory default: CC 82 (manual errata).',
    hear: 'Nothing by itself — it is the MIDI address of the speed switch.',
    viz: 'none',
  },
  presetFootSwitchType: {
    title: 'Preset foot switch type',
    what: 'The behavior of the pedal that switches to the other preset: Unlatch or Latch.',
    hear: 'Changes how you switch presets with your foot.',
    viz: 'none',
  },
  leslieMode: {
    title: 'Leslie mode',
    what: 'The current state of the rotors: Slow (chorale), Fast (tremolo) or Brake (stop).',
    hear: 'The switch you hear the most: both rotors accelerating or slowing down, each with its own inertia.',
    advice: 'Handy from the editor to hear the effect of the rise and fall times you just set.',
    viz: 'none',
  },
};
