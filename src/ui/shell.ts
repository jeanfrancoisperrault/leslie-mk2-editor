// Application shell: header (port picker, preset switch, send-all), honesty
// banner, connection-state banner, and the collapsible MIDI console.

import { STR } from '../content/i18n';
import type { AppState, Store } from '../state/store';
import { el } from './dom';
import type { PortInfo } from '../midi/webmidi';
import { methodSupports } from '../midi/speed';
import type { SpeedCommand, SpeedMethod } from '../midi/speed';

export type Direction = 'out' | 'in' | 'echo';

export interface ConsoleEntry {
  dir: Direction;
  hex: string;
  text: string;
}

export interface Shell {
  header: HTMLElement;
  honesty: HTMLElement;
  stateBanner: HTMLElement;
  console: HTMLElement;
  update(state: AppState): void;
  transport: HTMLElement;
  setPorts(ports: PortInfo[], selected: string | 'sim'): void;
  setInputs(ports: PortInfo[], selected: string | null): void;
  setSysexAvailable(ok: boolean): void;
  /** Rotor mode last reported by the Leslie (null = unknown). */
  setReportedMode(cmd: SpeedCommand | null): void;
  /** Dump capture status; onSave enables the save button. */
  setDump(text: string | null, onSave: (() => void) | null): void;
  logMessage(entry: ConsoleEntry): void;
  onPortChange: ((id: string | 'sim') => void) | null;
  onInputChange: ((id: string | null) => void) | null;
  onSpeed: ((cmd: SpeedCommand, method: SpeedMethod) => void) | null;
}

const SIM_VALUE = 'sim';
const NO_INPUT = 'none';
const MAX_LOG = 200;

export function buildShell(store: Store): Shell {
  // --- Header ---
  const led = el('span', { class: 'led', 'data-state': 'off', 'aria-hidden': 'true' });
  const portSelect = el('select', { class: 'port-select', 'aria-label': STR.midiPortAria, title: STR.midiOut });
  const inputSelect = el('select', { class: 'port-select', 'aria-label': STR.midiIn, title: STR.midiIn });
  const channelSelect = el('select', { class: 'port-select port-channel', 'aria-label': STR.channel });
  for (let ch = 0; ch < 16; ch++) channelSelect.append(el('option', { value: String(ch), text: `${STR.channel} ${ch + 1}` }));
  channelSelect.append(el('option', { value: '16', text: `${STR.channel} ${STR.off}` }));
  // Tells the editor which channel the Leslie listens on; sends nothing.
  channelSelect.addEventListener('change', () => {
    store.setValue('controlChannel', Number(channelSelect.value), { send: false });
  });
  const portGroup = el('div', { class: 'port-group' },
    led, el('span', { class: 'port-label', text: STR.outLabel }), portSelect);
  const inputGroup = el('div', { class: 'port-group' },
    el('span', { class: 'port-label', text: STR.inLabel }), inputSelect);
  const channelGroup = el('div', { class: 'port-group' }, channelSelect);

  const p1 = el('button', { type: 'button', text: STR.preset1 });
  const p2 = el('button', { type: 'button', text: STR.preset2 });
  p1.addEventListener('click', () => store.selectPreset(0));
  p2.addEventListener('click', () => store.selectPreset(1));
  const presetSwitch = el('div', { class: 'preset-switch', role: 'group', 'aria-label': STR.presetAria }, p1, p2);

  const sendAll = el('button', { type: 'button', class: 'btn', text: STR.sendAll });
  sendAll.addEventListener('click', () => store.sendAll());

  const brand = el('div', { class: 'brand', text: STR.appTitle });
  brand.append(el('small', { text: STR.appSubtitle }));

  const header = el('header', { class: 'header' },
    brand, portGroup, inputGroup, channelGroup, el('div', { class: 'spacer' }), presetSwitch, sendAll);

  // --- Rotor transport (Slow / Fast / Brake, method picker) ---
  const methodSelect = el('select', { class: 'port-select', 'aria-label': STR.speed.method });
  for (const m of ['sysex', 'cc', 'nrpn'] as const) {
    methodSelect.append(el('option', { value: m, text: STR.speed.methods[m] }));
  }
  const speedButtons = (['slow', 'fast', 'brake'] as const).map((cmd) => {
    const b = el('button', { type: 'button', 'data-cmd': cmd, text: STR.speed.cmds[cmd] });
    b.addEventListener('click', () => shell.onSpeed?.(cmd, methodSelect.value as SpeedMethod));
    return b;
  });
  let sysexOk = true;
  const refreshSpeed = () => {
    const m = methodSelect.value as SpeedMethod;
    if (m === 'sysex' && !sysexOk) methodSelect.value = 'cc';
    for (const b of speedButtons) {
      const supported = methodSupports(methodSelect.value as SpeedMethod, b.dataset['cmd'] as SpeedCommand);
      b.disabled = !supported;
      b.title = supported ? '' : STR.speed.noSysexBrake;
    }
  };
  methodSelect.addEventListener('change', refreshSpeed);
  refreshSpeed();
  const reported = el('span', { class: 'transport-note reported' });
  const dumpStatus = el('span', { class: 'transport-note dump-status' });
  const dumpSave = el('button', { type: 'button', class: 'btn btn-outline btn-sm', text: STR.dump.save });
  dumpSave.hidden = true;
  let dumpSaveHandler: (() => void) | null = null;
  dumpSave.addEventListener('click', () => dumpSaveHandler?.());
  const transport = el('div', { class: 'transport' },
    el('span', { class: 'transport-label', text: STR.speed.label }),
    el('div', { class: 'preset-switch speed-switch', role: 'group', 'aria-label': STR.speed.label }, ...speedButtons),
    el('div', { class: 'port-group' }, el('span', { class: 'port-label', text: STR.speed.via }), methodSelect),
    el('span', { class: 'transport-note', text: STR.speed.note }),
    reported,
    el('div', { class: 'spacer' }),
    dumpStatus, dumpSave);

  // --- Banners ---
  const honesty = el('p', { class: 'notice' });
  honesty.append(el('b', { text: STR.honestyLead + ' ' }),
    STR.honesty.slice(STR.honestyLead.length + 1));
  const stateBanner = el('p', { class: 'notice alert' });
  stateBanner.hidden = true;

  // --- Console ---
  const chevron = document.createRange().createContextualFragment(
    `<svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 5l4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
  );
  const toggle = el('button', { type: 'button', class: 'console-toggle', 'aria-expanded': 'true' });
  toggle.append(chevron, STR.console);
  const last = el('span', { class: 'console-last', text: STR.consoleEmpty });
  const log = el('div', { class: 'console-log', role: 'log', 'aria-label': STR.console });
  const clear = el('button', { type: 'button', class: 'console-toggle console-clear', text: STR.consoleClear });
  clear.addEventListener('click', () => {
    log.replaceChildren();
    last.textContent = STR.consoleEmpty;
  });
  const consoleRoot = el('div', { class: 'console', 'data-open': 'true' },
    el('div', { class: 'console-bar' }, toggle, last, el('div', { class: 'spacer' }), clear), log);
  toggle.addEventListener('click', () => {
    const open = consoleRoot.dataset['open'] !== 'true';
    consoleRoot.dataset['open'] = String(open);
    toggle.setAttribute('aria-expanded', String(open));
  });

  const shell: Shell = {
    header,
    honesty,
    stateBanner,
    console: consoleRoot,
    transport,
    onPortChange: null,
    onInputChange: null,
    onSpeed: null,

    update(state: AppState) {
      p1.setAttribute('aria-pressed', String(state.editedPreset === 0));
      p2.setAttribute('aria-pressed', String(state.editedPreset === 1));
      channelSelect.value = String(store.getValue('controlChannel'));

      const c = state.connection;
      led.dataset['state'] = c.kind === 'port' ? 'on' : c.kind === 'simulator' ? 'off' : 'warn';
      stateBanner.hidden = false;
      switch (c.kind) {
        case 'unsupported': stateBanner.textContent = STR.states.unsupported; break;
        case 'denied': stateBanner.textContent = STR.states.denied; break;
        case 'no-port': stateBanner.textContent = STR.states.noPort; break;
        case 'simulator': stateBanner.textContent = STR.simulatorNote; break;
        case 'port': stateBanner.hidden = true; break;
      }
    },

    setPorts(ports, selected) {
      portSelect.replaceChildren();
      portSelect.append(el('option', { value: SIM_VALUE, text: STR.simulator }));
      for (const p of ports) portSelect.append(el('option', { value: p.id, text: p.name }));
      portSelect.value = selected;
    },

    setInputs(ports, selected) {
      inputSelect.replaceChildren();
      inputSelect.append(el('option', { value: NO_INPUT, text: STR.noInput }));
      for (const p of ports) inputSelect.append(el('option', { value: p.id, text: p.name }));
      inputSelect.value = selected ?? NO_INPUT;
    },

    setSysexAvailable(ok) {
      sysexOk = ok;
      const opt = methodSelect.querySelector<HTMLOptionElement>('option[value="sysex"]');
      if (opt) opt.disabled = !ok;
      refreshSpeed();
    },

    setReportedMode(cmd) {
      for (const b of speedButtons) b.setAttribute('aria-pressed', String(b.dataset['cmd'] === cmd));
      reported.textContent = cmd ? `${STR.speed.reported} ${STR.speed.cmds[cmd]}` : '';
    },

    setDump(text, onSave) {
      dumpStatus.textContent = text ?? '';
      dumpSaveHandler = onSave;
      dumpSave.hidden = onSave === null;
    },

    logMessage(entry) {
      const time = new Date().toLocaleTimeString(undefined, { hour12: false }) +
        '.' + String(Date.now() % 1000).padStart(3, '0');
      last.textContent = `${STR.dir[entry.dir]} ${entry.hex}`;
      const line = el('div', { class: `log-${entry.dir}` });
      line.append(el('span', { class: 'time', text: time }), ' ',
        el('span', { class: 'dir', text: STR.dir[entry.dir] }), ' ',
        el('span', { class: 'hex', text: entry.hex }), '  ',
        el('span', { class: 'dec', text: entry.text }));
      log.append(line);
      while (log.childElementCount > MAX_LOG) log.firstElementChild?.remove();
      log.scrollTop = log.scrollHeight;
    },
  };

  inputSelect.addEventListener('change', () => {
    shell.onInputChange?.(inputSelect.value === NO_INPUT ? null : inputSelect.value);
  });

  portSelect.addEventListener('change', () => {
    shell.onPortChange?.(portSelect.value === SIM_VALUE ? 'sim' : portSelect.value);
  });

  return shell;
}
