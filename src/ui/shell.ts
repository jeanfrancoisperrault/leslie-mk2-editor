// Application shell: header (port picker, preset switch, send-all), honesty
// banner, connection-state banner, and the collapsible MIDI console.

import { STR } from '../content/i18n';
import type { AppState, Store } from '../state/store';
import { el } from './dom';
import type { PortInfo } from '../midi/webmidi';

export interface ConsoleEntry {
  hex: string;
  text: string;
}

export interface Shell {
  header: HTMLElement;
  honesty: HTMLElement;
  stateBanner: HTMLElement;
  console: HTMLElement;
  update(state: AppState): void;
  setPorts(ports: PortInfo[], selected: string | 'sim'): void;
  logMessage(entry: ConsoleEntry): void;
  onPortChange: ((id: string | 'sim') => void) | null;
}

const SIM_VALUE = 'sim';
const MAX_LOG = 200;

export function buildShell(store: Store): Shell {
  // --- Header ---
  const led = el('span', { class: 'led', 'data-state': 'off', 'aria-hidden': 'true' });
  const portSelect = el('select', { class: 'port-select', 'aria-label': STR.midiPortAria });
  const channelText = el('span', { class: 'port-channel' });
  const portGroup = el('div', { class: 'port-group' }, led, portSelect, channelText);

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
    brand, portGroup, el('div', { class: 'spacer' }), presetSwitch, sendAll);

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
  const toggle = el('button', { type: 'button', class: 'console-toggle', 'aria-expanded': 'false' });
  toggle.append(chevron, STR.console);
  const last = el('span', { class: 'console-last', text: STR.consoleEmpty });
  const log = el('div', { class: 'console-log', role: 'log', 'aria-label': STR.console });
  const consoleRoot = el('div', { class: 'console', 'data-open': 'false' },
    el('div', { class: 'console-bar' }, toggle, last), log);
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
    onPortChange: null,

    update(state: AppState) {
      p1.setAttribute('aria-pressed', String(state.editedPreset === 0));
      p2.setAttribute('aria-pressed', String(state.editedPreset === 1));
      const ch = store.getValue('controlChannel');
      channelText.textContent = ch === 16 ? `${STR.channel} ${STR.off}` : `${STR.channel} ${ch + 1}`;

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

    logMessage(entry) {
      last.textContent = entry.hex;
      const line = el('div');
      line.append(el('span', { class: 'hex', text: entry.hex }), '  ',
        el('span', { class: 'dec', text: entry.text }));
      log.append(line);
      while (log.childElementCount > MAX_LOG) log.firstElementChild?.remove();
      log.scrollTop = log.scrollHeight;
    },
  };

  portSelect.addEventListener('change', () => {
    shell.onPortChange?.(portSelect.value === SIM_VALUE ? 'sim' : portSelect.value);
  });

  return shell;
}
