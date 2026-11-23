// Application shell: one top bar (preset, rotor, connection, save), the status
// sentence shown above the score, and the collapsible MIDI console.

import { STR } from '../content/i18n';
import type { AppState, Store } from '../state/store';
import { opensGuide } from './controls';
import { el } from './dom';
import { buildHalfMoon } from './halfmoon';
import type { PortInfo } from '../midi/webmidi';
import type { SpeedCommand } from '../midi/speed';

export type Direction = 'out' | 'in' | 'echo';

export interface ConsoleEntry {
  dir: Direction;
  hex: string;
  text: string;
}

export interface Shell {
  header: HTMLElement;
  /** One-sentence state of the values on screen. */
  status: HTMLElement;
  console: HTMLElement;
  update(state: AppState): void;
  setPorts(ports: PortInfo[], selected: string | 'sim'): void;
  setInputs(ports: PortInfo[], selected: string | null): void;
  /** Rotor mode last sent or reported by the Leslie (null = unknown). */
  setMode(cmd: SpeedCommand | null): void;
  /** Dump capture status; onSave enables the save button. */
  setDump(text: string | null, onSave: (() => void) | null, error?: boolean): void;
  /** null = Save to memory available; otherwise the reason it is not. */
  setSaveBlocked(reason: string | null): void;
  onSaveMemory: (() => void) | null;
  /** Problem shown in the status sentence; null clears it. */
  setAlert(kind: 'sysex' | 'send', text: string | null): void;
  logMessage(entry: ConsoleEntry): void;
  onPortChange: ((id: string | 'sim') => void) | null;
  onInputChange: ((id: string | null) => void) | null;
  onSpeed: ((cmd: SpeedCommand) => void) | null;
}

const SIM_VALUE = 'sim';
const NO_INPUT = 'none';
const MAX_LOG = 200;

export function buildShell(store: Store): Shell {
  // --- Connection panel (ports, channel, dump) ---
  const portSelect = el('select', { class: 'select', id: 'midi-out', title: STR.midiOut });
  const inputSelect = el('select', { class: 'select', id: 'midi-in', title: STR.midiIn });
  const channelSelect = el('select', { class: 'select', id: 'midi-channel' });
  for (let ch = 0; ch < 16; ch++) channelSelect.append(el('option', { value: String(ch), text: `${STR.channel} ${ch + 1}` }));
  channelSelect.append(el('option', { value: '16', text: `${STR.channel} ${STR.off}` }));
  // Tells the editor which channel the Leslie listens on; sends nothing.
  channelSelect.addEventListener('change', () => {
    store.setValue('controlChannel', Number(channelSelect.value), { send: false });
  });
  const connectionNote = el('p', { class: 'connection-note' });
  const dumpStatus = el('p', { class: 'connection-note' });
  const dumpSave = el('button', { type: 'button', class: 'btn btn-outline', text: STR.dump.save });
  dumpSave.hidden = true;
  let dumpSaveHandler: (() => void) | null = null;
  dumpSave.addEventListener('click', () => dumpSaveHandler?.());
  const field = (id: string, label: string, control: HTMLElement) =>
    el('div', { class: 'field' }, el('label', { for: id, text: label }), control);
  const panel = el('div', { class: 'connection-panel', id: 'connection-panel', popover: 'auto', role: 'group', 'aria-label': STR.connection.label },
    connectionNote,
    field('midi-out', STR.midiOut, portSelect),
    field('midi-in', STR.midiIn, inputSelect),
    field('midi-channel', STR.connection.channel, channelSelect),
    dumpStatus, dumpSave);

  const led = el('span', { class: 'led', 'data-state': 'off', 'aria-hidden': 'true' });
  const connectionText = el('span', { class: 'connection-text' });
  const connection = el('button', { type: 'button', class: 'btn btn-outline connection', popovertarget: 'connection-panel', title: STR.connection.label },
    led, connectionText);
  // The popover lives in the top layer: line its right edge up with the button.
  panel.addEventListener('beforetoggle', () => {
    const r = connection.getBoundingClientRect();
    panel.style.top = `${r.bottom + 8}px`;
    panel.style.right = `${document.documentElement.clientWidth - r.right}px`;
  });

  window.addEventListener('resize', () => {
    if (panel.matches(':popover-open')) panel.hidePopover();
  });

  // --- Top bar ---
  // Lamp keys: a point that lights up, and a name. No outline, no fill.
  const lampKey = (label: string) =>
    el('button', { type: 'button' },
      el('span', { class: 'lamp', 'aria-hidden': 'true' }), el('span', { class: 'lamp-name', text: label }));
  const lampGroup = (label: string, ...keys: HTMLElement[]) =>
    el('div', { class: 'lamps', role: 'group', 'aria-label': label }, ...keys);

  // Neutral lights: green and red are kept for slow and fast.
  const p1 = lampKey(STR.preset1);
  const p2 = lampKey(STR.preset2);
  p1.addEventListener('click', () => store.selectPreset(0));
  p2.addEventListener('click', () => store.selectPreset(1));

  const halfMoon = buildHalfMoon();
  halfMoon.onSelect = (cmd) => shell.onSpeed?.(cmd);
  opensGuide(halfMoon.root, 'leslieMode', store);

  const saveMemory = el('button', { type: 'button', class: 'btn', text: STR.saveMemory.label });
  saveMemory.addEventListener('click', () => shell.onSaveMemory?.());

  const header = el('header', { class: 'bar' },
    el('h1', { class: 'brand', text: STR.appTitle }),
    lampGroup(STR.presetAria, p1, p2),
    el('span', { class: 'bar-rule', 'aria-hidden': 'true' }),
    halfMoon.root,
    el('div', { class: 'spacer' }), connection, saveMemory, panel);

  // --- Status sentence ---
  const status = el('p', { class: 'status', role: 'status' });
  let receiving: string | null = null;
  let dumpError: string | null = null;
  const alerts = new Map<string, string>();
  const paintStatus = (state: AppState) => {
    const dev = state.loadedFromDevice;
    const problem = dumpError ?? alerts.get('send') ?? alerts.get('sysex');
    let text = '';
    if (receiving) text = receiving;
    else if (problem) text = problem;
    else if (dev) {
      const time = dev.at.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      const edits = store.editCount();
      const written = dev.source === 'written';
      text = [written ? STR.loaded.written(time) : STR.loaded.short(time),
        dev.unsaved.length ? STR.loaded.shortUnsaved(dev.unsaved.length) : '',
        edits ? STR.loaded.edits(edits) : ''].filter(Boolean).join(' ');
      status.title = written ? STR.loaded.checkWrite
        : dev.unsaved.length ? STR.loaded.unsaved(dev.unsaved.length) : STR.loaded.allSaved;
    }
    // Only touch the live region when the sentence changes.
    if (status.textContent !== text) status.textContent = text;
    status.classList.toggle('is-error', !receiving && problem !== undefined);
  };

  // --- Console ---
  const chevron = document.createRange().createContextualFragment(
    `<svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 5l4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
  );
  const toggle = el('button', { type: 'button', class: 'console-toggle', 'aria-expanded': 'false' });
  toggle.append(chevron, el('span', { text: STR.console }));
  const last = el('span', { class: 'console-last', text: STR.consoleEmpty });
  const log = el('div', { class: 'console-log', role: 'log', 'aria-label': STR.console });
  const clear = el('button', { type: 'button', class: 'console-toggle console-clear' });
  clear.append(el('span', { text: STR.consoleClear }));
  clear.addEventListener('click', () => {
    log.replaceChildren();
    last.textContent = STR.consoleEmpty;
  });
  const credits = el('p', { class: 'credits' }, `${STR.credits} `,
    el('a', { href: 'https://jf.cool', target: '_blank', rel: 'noopener', text: 'jf.cool' }));
  const consoleRoot = el('div', { class: 'console', 'data-open': 'false' },
    el('div', { class: 'console-bar' }, toggle, last, el('div', { class: 'spacer' }), clear, credits), log);
  toggle.addEventListener('click', () => {
    const open = consoleRoot.dataset['open'] !== 'true';
    consoleRoot.dataset['open'] = String(open);
    toggle.setAttribute('aria-expanded', String(open));
  });

  const shell: Shell = {
    header,
    status,
    console: consoleRoot,
    onPortChange: null,
    onInputChange: null,
    onSpeed: null,
    onSaveMemory: null,

    update(state: AppState) {
      paintStatus(state);
      p1.disabled = p2.disabled = store.locked;
      p1.setAttribute('aria-pressed', String(!store.locked && state.editedPreset === 0));
      p2.setAttribute('aria-pressed', String(!store.locked && state.editedPreset === 1));
      const ch = store.getValue('controlChannel');
      channelSelect.value = String(ch);

      const c = state.connection;
      led.dataset['state'] = c.kind === 'port' ? 'on' : c.kind === 'simulator' ? 'off' : 'warn';
      const label = c.kind === 'port' ? c.name : STR.connection.states[c.kind];
      connectionText.textContent = c.kind === 'port'
        ? `${label}, ${STR.channel.toLowerCase()} ${ch <= 15 ? ch + 1 : STR.off}` : label;
      switch (c.kind) {
        case 'unsupported': connectionNote.textContent = STR.states.unsupported; break;
        case 'denied': connectionNote.textContent = STR.states.denied; break;
        case 'no-port': connectionNote.textContent = STR.states.noPort; break;
        case 'simulator': connectionNote.textContent = STR.simulatorNote; break;
        case 'port': connectionNote.textContent = ''; break;
      }
      connectionNote.hidden = c.kind === 'port';
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

    setMode(cmd) {
      halfMoon.setMode(cmd);
    },

    setSaveBlocked(reason) {
      saveMemory.disabled = reason !== null;
      saveMemory.title = reason ?? STR.saveMemory.hint;
    },

    setDump(text, onSave, error = false) {
      dumpStatus.textContent = text ?? '';
      dumpStatus.hidden = !text;
      dumpSaveHandler = onSave;
      dumpSave.hidden = onSave === null;
      receiving = onSave === null ? text : null;
      dumpError = error ? text : null;
      paintStatus(store.state);
    },

    setAlert(kind, text) {
      if ((alerts.get(kind) ?? null) === text) return;
      if (text === null) alerts.delete(kind);
      else alerts.set(kind, text);
      paintStatus(store.state);
    },

    logMessage(entry) {
      const time = new Date().toLocaleTimeString(undefined, { hour12: false }) +
        '.' + String(Date.now() % 1000).padStart(3, '0');
      // Notes (no bytes) read better as their text.
      last.textContent = `${STR.dir[entry.dir]} ${/^[0-9A-F]{2} /.test(entry.hex) ? `${entry.hex}  ${entry.text}` : entry.text}`;
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
