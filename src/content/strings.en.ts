// UI strings, English (default language).

import type { RotorSettings } from '../ui/score-model';

export const STR = {
  appTitle: 'Leslie 2101 / 2103 mk2',
  groups: {
    horn: 'Horn rotor',
    low: 'Low rotor',
  } as Record<string, string>,
  rows: {
    slowSpeed: 'Slow speed',
    fastSpeed: 'Fast speed',
    riseTime: 'Rise time',
    fallTime: 'Fall time',
    brakeTime: 'Brake time',
    level: 'Level',
  },
  toneGroups: { character: 'Character', bass: 'Bass settings' },
  toneRows: { horn: 'Horn', cabinet: 'Cabinet', level: 'Level', crossover: 'Crossover' },
  systemGroups: {
    channels: 'MIDI channels',
    reception: 'MIDI reception',
    switches: 'Pedals and switches',
  },
  views: { aria: 'Settings', sound: 'Sound', system: 'System' },
  connection: {
    label: 'MIDI connection',
    channel: 'Channel the Leslie listens on',
    states: {
      unsupported: 'No Web MIDI',
      denied: 'MIDI denied',
      'no-port': 'No MIDI port',
      simulator: 'Simulator',
    },
  },
  score: {
    aria: 'Rotor speeds over time',
    rotors: { horn: 'Horn', low: 'Low rotor' },
    empty: 'Empty graph: waiting for the Leslie’s settings.',
    summary: (h: RotorSettings, l: RotorSettings) =>
      `Rotor speeds over time. Horn: ${h.slow} to ${h.fast} rpm, rise ${h.rise} s, fall ${h.fall} s, brake ${h.brake} s. ` +
      `Low rotor: ${l.slow} to ${l.fast} rpm, rise ${l.rise} s, fall ${l.fall} s, brake ${l.brake} s.`,
  },
  was: (value: string) => `was ${value}`,
  preset1: 'Preset 1',
  preset2: 'Preset 2',
  saveMemory: {
    label: 'Save to memory',
    hint: 'Writes both presets and the system settings into the Leslie’s memory (as a SysEx dump).',
    needDump: 'Take a DUMP OUT from the Leslie first: the write starts from a real dump.',
    needPort: 'Select the MIDI output wired to the Leslie.',
    needSysex: 'SysEx permission is required.',
    confirm: 'Write both presets and the system settings into the Leslie’s memory?\n\nThis replaces what is stored on the machine. Take a DUMP OUT afterwards to check.',
    sent: 'Written to the Leslie’s memory. Take a DUMP OUT to check.',
  },
  loaded: {
    short: (time: string) => `Read from the Leslie at ${time}.`,
    written: (time: string) => `Written to the Leslie at ${time}. Take a DUMP OUT to check.`,
    checkWrite: 'The Leslie does not confirm a write. A DUMP OUT from its front panel shows what it really holds.',
    shortUnsaved: (n: number) => `${n} not in its memory.`,
    edits: (n: number) => `${n} changed here since.`,
    unsaved: (n: number) => `${n} setting(s) of the active preset are not saved yet: press MEMORY on the Leslie to keep them. Later edits in the editor are not read back.`,
    allSaved: 'The active preset matches its memory. Later edits in the editor are not read back; take a new dump to refresh.',
  },
  waiting: {
    title: 'Waiting for the Leslie',
    body: 'The editor shows nothing until it has read the Leslie’s real settings. Send them from the Leslie:',
    steps: [
      'Check that the MIDI connection (top bar) uses the MIDI input wired to the Leslie’s MIDI OUT.',
      'On the Leslie, turn FUNCTION to DUMP OUT.',
      'Press VALUE until “dP” blinks. The settings appear here when the blinking stops.',
    ],
    note: 'The Slow, Fast and Brake buttons already work.',
  },
  console: 'MIDI console',
  consoleEmpty: 'No messages sent yet.',
  machineMenu: 'Machine menu',
  currentValue: 'value',
  range: 'range',
  defaultShort: 'default',
  rawData: 'data',
  display: 'display',
  simulator: 'Simulator',
  simulatorNote: 'Simulator mode — messages are logged to the MIDI console, nothing is sent.',
  channel: 'Channel',
  states: {
    unsupported:
      'Web MIDI is not available in this browser. Use Chrome or Edge; simulator mode still works.',
    denied:
      'MIDI access denied. Allow MIDI in the browser (icon left of the URL), then reload.',
    noPort: 'No MIDI port detected. Connect the Leslie (or a MIDI interface) and it will appear here.',
    portLost: 'MIDI port lost — check the cable. Falling back to the simulator.',
  },
  vizCaptions: {
    crossover: 'Signal split between the two ways.',
    character: 'Qualitative schematic — not a measurement.',
  },
  vizLabels: {
    lowWay: 'Low rotor — below',
    hornWay: 'Horn — above',
    lows: 'lows',
    highs: 'highs',
  },
  whatLabel: 'What it sets.',
  hearLabel: 'What you hear.',
  adviceLabel: 'Tip.',
  off: 'Off',
  hints: {
    step: 'step',
    bigStep: 'big step',
    reset: 'or double-click: default',
    shiftKey: 'Shift',
    deleteKey: 'Del',
    arrows: '↑ ↓',
  },
  overlay: {
    title: 'No Leslie detected',
    intro: {
      unsupported:
        'This browser has no Web MIDI support, so the editor cannot reach a Leslie from here. Use Chrome or Edge on desktop.',
      denied:
        'MIDI access was denied, so the editor cannot see any port. Allow MIDI in the browser (icon left of the URL), then reload.',
      noPort: 'No MIDI output port was found on this computer.',
      noLeslie:
        'MIDI ports were found, but none of them looks like a Leslie. If one of them is wired to the Leslie, pick it under the MIDI connection button — the editor cannot tell on its own.',
    },
    howToTitle: 'Hooking up the Leslie',
    howTo: [
      'Connect a USB-MIDI interface with one input and one output to this computer.',
      'Run a MIDI cable from the interface’s MIDI OUT to the Leslie’s MIDI IN (5-pin DIN, rear panel): it carries your changes.',
      'Run a second cable from the Leslie’s MIDI OUT back to the interface’s MIDI IN: the editor reads the Leslie’s settings through it and stays locked without it.',
      'Power the Leslie on. Out of the box it listens on channel 1 (CONTROL CH).',
    ],
    autoDetect: 'This window closes by itself as soon as a MIDI port appears.',
    simulatorNote:
      'Meanwhile, everything works in simulator mode: each change is encoded and logged in the MIDI console.',
    continueSim: 'Continue with the simulator',
    reload: 'Reload',
    diagram: {
      computer: 'Computer', interface: 'USB-MIDI interface', leslie: 'Leslie',
      in: 'MIDI IN', out: 'MIDI OUT', usb: 'USB',
      aria: 'The computer and the USB-MIDI interface are linked by USB. Interface MIDI OUT goes to Leslie MIDI IN. Leslie MIDI OUT goes back to interface MIDI IN.',
    },
  },
  explainerAria: 'Guide',
  guideToggle: { label: 'Guide', hide: 'Hide the guide', show: 'Show the guide' },
  explainerEmpty: {
    aria: 'About this editor',
    tabs: { welcome: 'Welcome', graph: 'How to read the graph' },
    intro: 'Set up your Leslie 2101 or 2103 mk2 on one screen, and hear each change as you make it. Hover or focus a setting to see here what it does.',
    notices: [
      {
        title: 'Unofficial project',
        text: 'A personal, non-profit project. It is not affiliated with, endorsed by or supported by the makers of Leslie speakers or Hammond organs. Leslie, Hammond and all other names and trademarks belong to their respective owners; they are used here only to say which machines this editor works with.',
      },
      {
        title: 'Use at your own risk',
        text: 'This editor is provided as is, without warranty of any kind. It sends MIDI data to your speaker, and Save to memory overwrites the settings stored in it: keep a copy first (Save dump, in the MIDI connection at the top; a SysEx tool can send it back). To the extent permitted by law, the author is not liable for any malfunction, damage or loss of settings that may follow from its use.',
      },
    ],
    graph: [
      'The graph shows both rotors on the same clock: what happens on Slow and Brake when the rotors turn fast, then on Fast when they turn slow. The five lines are the speed, from 0 to 400 rpm.',
      'Green is Slow, red is Fast, white is Brake: in the graph, on the faders and on the half-moon.',
      'It is calculated from the settings. Ramps are drawn straight; the machine’s exact curve is not documented.',
      'A filled point is the value now. An open point, or an outlined cap or key, is what the Leslie last had in memory (read from it, or saved to it), shown once you change it.',
    ],
  },
  midiOut: 'MIDI output (to the Leslie MIDI IN)',
  midiIn: 'MIDI input (from the Leslie MIDI OUT)',
  noInput: 'No input',
  consoleClear: 'Clear',
  credits: 'Credits:',
  dir: { out: '→', in: '←', echo: '↩ echo' },
  sysexShort: 'SysEx refused: the editor cannot read the Leslie. Allow it (icon left of the URL), then reload.',
  sendFailed: 'Not sent: the MIDI port did not accept the message. Check the cable and the connection.',
  sysexDenied: 'SysEx permission refused: the editor can neither receive nor send dumps, so it cannot read the Leslie. Allow SysEx (icon left of the URL) and reload.',
  speed: {
    label: 'Rotor',
    cmds: { slow: 'Slow', fast: 'Fast', brake: 'Brake' },
    note: 'Sends immediately to the Leslie.',
  },
  dump: {
    receiving: (n: number) => `Receiving dump… ${n} packet(s)`,
    done: (n: number, bad: number, mode: string) =>
      `Dump received: ${n} packet(s), ` + (bad === 0 ? `checksum OK (${mode})` : `${bad} checksum error(s)`),
    save: 'Save dump (.syx)',
  },
  presetAria: 'Preset',
  fallbackPortName: 'MIDI port',
};
