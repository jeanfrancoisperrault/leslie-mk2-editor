// Parameter row controls: fader (native range input), enum key-row, or
// channel select — all built from the schema definition.

import { EXPLANATIONS, STR } from '../content/i18n';
import { formatValue } from '../params/schema';
import type { ParamDef } from '../params/schema';
import type { AppState, Store } from '../state/store';
import { el } from './dom';
import { voiceOf } from './layout';

export interface ParamRow {
  root: HTMLElement;
  update(state: AppState): void;
}

// When the pointer leaves a row, wait a beat then check whether any row is
// actually hovered or holds keyboard focus; if not, fall back to the neutral
// guide in the explainer. The delay avoids flicker when moving between rows.
const CLEAR_DELAY_MS = 300;
let clearTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFocusClear(store: Store): void {
  if (clearTimer !== null) clearTimeout(clearTimer);
  clearTimer = setTimeout(() => {
    clearTimer = null;
    const hovered = document.querySelector('[data-guide]:hover');
    const focused = document.activeElement?.closest('[data-guide]');
    if (!hovered && !focused) store.focusParam(null);
  }, CLEAR_DELAY_MS);
}

function cancelFocusClear(): void {
  if (clearTimer !== null) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }
}

/** Hovering or focusing the element shows the parameter in the guide. */
export function opensGuide(target: HTMLElement | SVGElement, id: string, store: Store): void {
  target.setAttribute('data-guide', id);
  const open = () => {
    cancelFocusClear();
    store.focusParam(id);
  };
  const leave = () => scheduleFocusClear(store);
  target.addEventListener('focusin', open);
  target.addEventListener('pointerenter', open);
  target.addEventListener('focusout', leave);
  target.addEventListener('pointerleave', leave);
}

function bigStep(def: ParamDef): number {
  const span = def.max - def.min;
  return span >= 50 ? 10 : span >= 20 ? 5 : 2;
}

export interface RowOptions {
  /** Visible label; omitted when a table row already names the setting. */
  label?: string;
}

/** One setting: optional label, its control, its value in real units. */
export function buildParamRow(def: ParamDef, store: Store, opts: RowOptions = {}): ParamRow {
  // The full name (with the rotor) identifies the control to assistive tech:
  // "Slow speed" alone exists twice on screen.
  const name = EXPLANATIONS[def.id]?.title ?? def.manualName;

  const valueMain = el('span', { class: 'value-now' });
  const valueWas = el('small', { class: 'value-was' });
  const valueBox = el('span', { class: 'param-value' }, valueMain, valueWas);

  const kind = def.mapping.type === 'enum' ? ' p-enum' : def.mapping.type === 'channel' ? ' p-select' : '';
  const mode = voiceOf(def.id);
  const voice = mode ? ` voice-${mode}` : '';
  const row = el('div', { class: `param${kind}${voice}`, 'data-param': def.id });
  if (opts.label) row.append(el('span', { class: 'param-label', text: opts.label }));

  let control: HTMLElement;
  let updateControl: (state: AppState) => void;

  const m = def.mapping;
  if (m.type === 'enum') {
    const group = el('div', { class: 'enum', role: 'group', 'aria-label': name });
    const buttons = m.options.map((opt) => {
      const b = el('button', { type: 'button', text: opt.label });
      b.addEventListener('click', () => store.setValue(def.id, opt.value));
      group.append(b);
      return { b, value: opt.value };
    });
    control = group;
    updateControl = () => {
      const v = store.getValue(def.id);
      for (const { b, value } of buttons) b.setAttribute('aria-pressed', String(value === v));
    };
  } else if (m.type === 'channel') {
    const select = el('select', { class: 'select', 'aria-label': name });
    for (let i = 0; i <= 16; i++) {
      select.append(el('option', { value: String(i), text: i === 16 ? STR.off : `${STR.channel} ${i + 1}` }));
    }
    select.addEventListener('change', () => store.setValue(def.id, Number(select.value)));
    control = el('div', {}, select);
    updateControl = () => {
      select.value = String(store.getValue(def.id));
    };
  } else {
    const input = el('input', {
      type: 'range',
      class: 'fader',
      min: String(def.min),
      max: String(def.max),
      step: '1',
      'aria-label': name,
    });
    input.addEventListener('input', () => store.setValue(def.id, Number(input.value)));
    input.addEventListener('keydown', (e) => {
      // Delete/Backspace resets the focused fader to its factory default.
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        store.resetToDefault(def.id);
        return;
      }
      if (!e.shiftKey) return;
      const delta = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? bigStep(def)
        : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -bigStep(def) : 0;
      if (delta === 0) return;
      e.preventDefault();
      store.setValue(def.id, store.getValue(def.id) + delta);
    });
    const scale = el('div', { class: 'fader-scale', 'aria-hidden': 'true' });
    // Tick spacing follows the parameter's detents: one tick per step on
    // short ranges, every 5 or 10 on longer ones.
    {
      const span = def.max - def.min;
      const every = span <= 10 ? 1 : span <= 40 ? 5 : 10;
      scale.style.backgroundSize = `${(every / span) * 100}% 100%`;
    }
    // Outlined cap: where the machine's own value sits, shown once edited.
    const was = el('span', { class: 'fader-was', 'aria-hidden': 'true' });
    control = el('div', { class: 'fader-box' }, scale, was, input);
    updateControl = () => {
      const v = store.getValue(def.id);
      input.value = String(v);
      const pct = ((v - def.min) / (def.max - def.min)) * 100;
      input.style.setProperty('--fill', `${pct}%`);
      input.setAttribute('aria-valuetext', formatValue(def, v));
      const loaded = store.loadedValue(def.id);
      was.hidden = !store.isEdited(def.id);
      if (loaded !== undefined) was.style.setProperty('--at', String((loaded - def.min) / (def.max - def.min)));
    };
  }

  row.append(control, valueBox);

  opensGuide(row, def.id, store);
  // Double-click (outside buttons) resets to the factory default.
  row.addEventListener('dblclick', (e) => {
    if ((e.target as HTMLElement).closest('button')) return;
    store.resetToDefault(def.id);
  });

  function update(state: AppState): void {
    const v = store.getValue(def.id);
    // Locked (no dump yet): show no value rather than factory defaults.
    valueMain.textContent = store.locked ? '—' : formatValue(def, v);
    const edited = store.isEdited(def.id);
    valueWas.hidden = !edited;
    valueWas.textContent = edited ? STR.was(formatValue(def, store.loadedValue(def.id)!)) : '';
    row.classList.toggle('is-edited', edited);
    row.classList.toggle('is-focused', state.focusedParam === def.id);
    updateControl(state);
  }

  return { root: row, update };
}
