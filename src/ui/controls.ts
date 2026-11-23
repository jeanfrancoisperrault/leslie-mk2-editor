// Parameter row controls: fader (native range input), enum key-row, or
// channel select — all built from the schema definition.

import { STR } from '../content/i18n';
import { formatValue } from '../params/schema';
import type { ParamDef } from '../params/schema';
import type { AppState, Store } from '../state/store';
import { el } from './dom';

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
    const hovered = document.querySelector('.param:hover');
    const focused = document.activeElement?.closest('.param');
    if (!hovered && !focused) store.focusParam(null);
  }, CLEAR_DELAY_MS);
}

function cancelFocusClear(): void {
  if (clearTimer !== null) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }
}

function bigStep(def: ParamDef): number {
  const span = def.max - def.min;
  return span >= 50 ? 10 : span >= 20 ? 5 : 2;
}

/** Secondary line under the value: raw data value or display code.
    Unverified conversion tables are not flagged here: the raw data sent over
    MIDI is always correct, and the explainer carries the caveat in prose. */
function secondaryText(def: ParamDef, value: number): string {
  const m = def.mapping;
  if (m.type === 'table') return `${STR.rawData} ${value}`;
  if (m.type === 'enum') {
    const opt = m.options.find((o) => o.value === value);
    return opt?.display ? `${STR.display} ${opt.display}` : `${STR.rawData} ${value}`;
  }
  if (m.type === 'channel') return `1–16 · ${STR.off}`;
  return `${def.min}–${def.max}`;
}

export function buildParamRow(def: ParamDef, store: Store): ParamRow {
  const label = el('span', { class: 'param-label', text: def.panelName ?? def.manualName });
  const dirtyDot = el('span', { class: 'dirty-dot', role: 'img', 'aria-label': STR.modified, title: STR.modified });
  dirtyDot.hidden = true;
  label.append(dirtyDot);

  const valueMain = el('span');
  const valueSub = el('small');
  const valueBox = el('span', { class: 'param-value' }, valueMain, valueSub);

  const row = el('div', { class: def.mapping.type === 'enum' ? 'param p-enum' : 'param', 'data-param': def.id });

  let control: HTMLElement;
  let updateControl: (state: AppState) => void;

  const m = def.mapping;
  if (m.type === 'enum') {
    const group = el('div', { class: 'enum', role: 'group', 'aria-label': def.panelName ?? def.manualName });
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
    const select = el('select', { class: 'port-select', 'aria-label': def.panelName ?? def.manualName });
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
      'aria-label': def.panelName ?? def.manualName,
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
    control = el('div', {}, input, scale);
    updateControl = () => {
      const v = store.getValue(def.id);
      input.value = String(v);
      const pct = ((v - def.min) / (def.max - def.min)) * 100;
      input.style.setProperty('--fill', `${pct}%`);
      input.setAttribute('aria-valuetext', formatValue(def, v));
    };
  }

  row.append(label, control, valueBox);

  // Focus or hover selects the parameter in the explainer panel; leaving
  // both clears it back to the neutral guide (checked after a short delay).
  row.addEventListener('focusin', () => {
    cancelFocusClear();
    store.focusParam(def.id);
  });
  row.addEventListener('pointerenter', () => {
    cancelFocusClear();
    store.focusParam(def.id);
  });
  row.addEventListener('pointerleave', () => scheduleFocusClear(store));
  row.addEventListener('focusout', () => scheduleFocusClear(store));
  // Double-click (outside buttons) resets to the factory default.
  row.addEventListener('dblclick', (e) => {
    if ((e.target as HTMLElement).closest('button')) return;
    store.resetToDefault(def.id);
  });

  function update(state: AppState): void {
    const v = store.getValue(def.id);
    // Locked (no dump yet): show no value rather than factory defaults.
    valueMain.textContent = store.locked ? '—' : formatValue(def, v);
    valueSub.textContent = store.locked ? '' : secondaryText(def, v);
    dirtyDot.hidden = !state.dirty.has(def.id);
    row.classList.toggle('is-focused', state.focusedParam === def.id);
    updateControl(state);
  }

  return { root: row, update };
}
