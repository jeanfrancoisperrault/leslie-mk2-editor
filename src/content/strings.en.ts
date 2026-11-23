// UI strings, English (default language).

export const STR = {
  appTitle: 'Leslie 2101 / 2103 mk2',
  appSubtitle: 'Editor',
  groups: {
    horn: 'Horn rotor',
    low: 'Low rotor',
    common: 'Cabinet & crossover',
    system: 'System',
  } as Record<string, string>,
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
  honesty:
    'The editor cannot read the machine. The state shown is the editor’s — take a DUMP OUT from the Leslie to load its real values.',
  loaded: {
    lead: (time: string) => `Values read from the Leslie (dump at ${time}).`,
    unsaved: (n: number) => `${n} setting(s) of the active preset are not saved yet: press MEMORY on the Leslie to keep them. Later edits in the editor are not read back.`,
    allSaved: 'The active preset matches its memory. Later edits in the editor are not read back; take a new dump to refresh.',
  },
  waiting: {
    title: 'Waiting for the Leslie',
    body: 'The editor shows nothing until it has read the Leslie’s real settings. Send them from the Leslie:',
    steps: [
      'Check that “In” (top bar) is the MIDI input wired to the Leslie’s MIDI OUT.',
      'On the Leslie, turn FUNCTION to DUMP OUT.',
      'Press VALUE until “dP” blinks. The settings appear here when the blinking stops.',
    ],
    note: 'The Rotor buttons (Slow / Fast / Brake) already work.',
  },
  honestyLead: 'The editor cannot read the machine.',
  console: 'MIDI console',
  consoleEmpty: 'No messages sent yet.',
  machineMenu: 'Machine menu',
  currentValue: 'value',
  range: 'range',
  defaultShort: 'default',
  rawData: 'data',
  display: 'display',
  modified: 'Changed since launch',
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
    curve: 'The curve redraws as you adjust.',
    rotor: 'Spinning at the real speed.',
    rotorStopped: 'Rotor stopped (data 0).',
    rotorReduced: 'Animation disabled (prefers-reduced-motion).',
    crossover: 'Signal split between the two ways.',
    character: 'Qualitative schematic — not a measurement.',
  },
  vizLabels: {
    rpmLong: 'revolutions per minute',
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
        'MIDI ports were found, but none of them looks like a Leslie. If one of them is wired to the Leslie, pick it in the header — the editor cannot tell on its own.',
    },
    howToTitle: 'Hooking up the Leslie',
    howTo: [
      'Connect a USB-MIDI interface to this computer (or use the MIDI OUT of your organ or keyboard).',
      'Run a MIDI cable from the interface’s MIDI OUT to the MIDI IN of the Leslie (5-pin DIN, rear panel).',
      'Power the Leslie on. Out of the box it listens on channel 1 (CONTROL CH).',
    ],
    autoDetect: 'This window closes by itself as soon as a MIDI port appears.',
    simulatorNote:
      'Meanwhile, everything works in simulator mode: each change is encoded and logged in the MIDI console.',
    continueSim: 'Continue with the simulator',
    reload: 'Reload',
    diagram: { computer: 'Computer', interface: 'USB-MIDI interface', leslie: 'MIDI IN · Leslie', usb: 'USB', din: 'DIN' },
  },
  explainerAria: 'Parameter explanation',
  explainerEmpty: {
    title: 'Parameter guide',
    body: 'Hover or focus any parameter: what it sets, what you hear, its range and a live visualization appear here.',
  },
  midiPortAria: 'MIDI output port',
  midiOut: 'MIDI output (to the Leslie MIDI IN)',
  midiIn: 'MIDI input (from the Leslie MIDI OUT)',
  outLabel: 'Out',
  inLabel: 'In',
  noInput: 'No input',
  consoleClear: 'Clear',
  dir: { out: '→', in: '←', echo: '↩ echo' },
  sysexDenied: 'SysEx permission refused: the editor can neither receive nor send dumps, so it cannot read the Leslie. Allow SysEx (icon left of the URL) and reload.',
  speed: {
    label: 'Rotor',
    cmds: { slow: 'Slow', fast: 'Fast', brake: 'Brake' },
    note: 'Sends immediately to the Leslie.',

    reported: 'Leslie reports:',
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
