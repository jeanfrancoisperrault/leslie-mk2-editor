// Fixed explainer panel (right column): title, machine menu name, plain
// explanation, meta row (current value / range / default), live visualization,
// advice. Rebuilt when the focused parameter changes; value-only changes
// update in place so animations keep running.

import { EXPLANATIONS, STR } from '../content/i18n';
import { formatValue, getParam } from '../params/schema';
import type { ParamDef } from '../params/schema';
import type { AppState, Store } from '../state/store';
import { el } from './dom';
import { buildViz } from './viz';
import type { Viz } from './viz';

function rangeText(def: ParamDef): string {
  const m = def.mapping;
  if (m.type === 'table') {
    const first = m.values[def.min];
    const last = m.values[def.max];
    const unit = m.unit === 's' ? 's' : 'rpm';
    return `${fmt(first)}–${fmt(last)} ${unit}`;
  }
  if (m.type === 'enum') return `${m.options.length} options`;
  if (m.type === 'channel') return `1–16 · ${STR.off}`;
  return `${def.min}–${def.max}`;
}

function fmt(v: number | undefined): string {
  if (v === undefined) return '–';
  return v.toLocaleString('en-US');
}

export function buildExplainer(store: Store): { root: HTMLElement; update(state: AppState): void } {
  // No live region on the whole panel: hovering across rows would flood
  // screen readers with full rebuild announcements. Only the current value
  // is announced (set per rebuild below).
  const root = el('aside', { class: 'explainer', 'aria-label': STR.explainerAria });

  /** 'empty' marks the neutral guide; null means nothing rendered yet. */
  let currentId: string | null = null;
  let viz: Viz | null = null;
  let valueEl: HTMLElement | null = null;

  function renderEmpty(): void {
    currentId = 'empty';
    viz = null;
    valueEl = null;
    root.replaceChildren(
      el('h3', { text: STR.explainerEmpty.title }),
      el('p', { text: STR.explainerEmpty.body }),
    );
    appendHints();
  }

  function appendHints(): void {
    const hint = el('p', { class: 'hint' });
    hint.append(
      el('kbd', { text: STR.hints.arrows }), ' ' + STR.hints.step + '  ·  ',
      el('kbd', { text: STR.hints.shiftKey }), ' + ', el('kbd', { text: STR.hints.arrows }), ' ' + STR.hints.bigStep + '  ·  ',
      el('kbd', { text: STR.hints.deleteKey }), ' ' + STR.hints.reset,
    );
    root.append(hint);
  }

  function rebuild(state: AppState): void {
    if (state.focusedParam === null) {
      renderEmpty();
      return;
    }
    const def = getParam(state.focusedParam);
    const x = EXPLANATIONS[def.id];
    currentId = def.id;
    root.replaceChildren();
    if (!x) return;

    const value = store.getValue(def.id);
    const machineName = def.panelName ?? def.manualName;
    const defaultValue =
      def.scope === 'system'
        ? (def.defaults as number)
        : (def.defaults as readonly [number, number])[state.editedPreset];

    root.append(el('h3', { text: x.title }));
    const machine = el('p', { class: 'machine' }, `${STR.machineMenu}: `);
    machine.append(el('b', { text: machineName }));
    root.append(machine);

    const what = el('p');
    what.append(el('b', { text: STR.whatLabel + ' ' }), x.what);
    const hear = el('p');
    hear.append(el('b', { text: STR.hearLabel + ' ' }), x.hear);
    root.append(what, hear);

    valueEl = el('b', { text: formatValue(def, value) });
    const meta = el('div', { class: 'meta' });
    const cell1 = el('div', { 'aria-live': 'polite' }, valueEl, el('span', { text: STR.currentValue }));
    const cell2 = el('div', {}, el('b', { text: rangeText(def) }), el('span', { text: STR.range }));
    const cell3 = el('div', {}, el('b', { text: formatValue(def, defaultValue) }),
      el('span', { text: `${STR.defaultShort}${def.scope === 'preset' ? ` P${state.editedPreset + 1}` : ''}` }));
    meta.append(cell1, cell2, cell3);
    root.append(meta);

    viz = buildViz(def, value);
    if (viz) root.append(viz.root);

    if (x.advice) {
      const advice = el('p', { class: 'advice' });
      advice.append(el('b', { text: STR.adviceLabel + ' ' }), x.advice);
      root.append(advice);
    }

    // Persistent keyboard affordances (brief: full keyboard navigation).
    appendHints();
  }

  return {
    root,
    update(state) {
      if ((state.focusedParam ?? 'empty') !== currentId) {
        rebuild(state);
        return;
      }
      if (state.focusedParam === null) return;
      const def = getParam(state.focusedParam);
      const value = store.getValue(def.id);
      if (valueEl) valueEl.textContent = formatValue(def, value);
      viz?.update(value);
    },
  };
}
