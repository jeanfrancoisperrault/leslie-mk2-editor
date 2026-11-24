// Fixed explainer panel (right column). At rest, two tabs: welcome (with the
// trademark notice and disclaimer), how to read the graph. On a parameter: title, machine menu name, plain
// explanation, meta row (current value / range / default), live visualization,
// advice. Rebuilt when the focused parameter changes; value-only changes
// update in place.

import { EXPLANATIONS, STR } from '../content/i18n';
import { formatValue, getParam } from '../params/schema';
import type { ParamDef } from '../params/schema';
import type { AppState, Store } from '../state/store';
import { el, svgEl } from './dom';
import { voiceOf } from './layout';
import { buildTabs } from './tabs';
import { buildViz } from './viz';
import type { Viz } from './viz';

type RestView = 'welcome' | 'graph';
const REST_VIEWS: RestView[] = ['welcome', 'graph'];

/** Same as --slide in style.css. */
const SLIDE_MS = 400;

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

/** What the machine itself shows or stores: display code or raw data value. */
function machineValue(def: ParamDef, value: number): string {
  const m = def.mapping;
  if (m.type === 'table') return `${STR.rawData} ${value}`;
  if (m.type === 'enum') {
    const opt = m.options.find((o) => o.value === value);
    return opt?.display ? `${STR.display} ${opt.display}` : `${STR.rawData} ${value}`;
  }
  return '';
}

export interface Explainer {
  root: HTMLElement;
  /** Shows and hides the panel; placed at the top of the work area, against it. */
  toggle: HTMLElement;
  update(state: AppState): void;
}

export function buildExplainer(store: Store): Explainer {
  // No live region on the whole panel: hovering across rows would flood
  // screen readers with full rebuild announcements. Only the current value
  // is announced (set per rebuild below).
  const body = el('div', { class: 'guide-body' });
  const root = el('aside', { class: 'explainer', id: 'guide', 'aria-label': STR.explainerAria }, body);

  // The usual side panel switch, for the top right of the work area.
  const toggle = el('button', { type: 'button', class: 'guide-toggle', 'aria-controls': 'guide' });
  const arrow = svgEl('path');
  toggle.append(svgEl('svg', { width: '18', height: '16', viewBox: '0 0 18 16', 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
    svgEl('rect', { x: '0.75', y: '0.75', width: '16.5', height: '14.5', rx: '2' }),
    svgEl('path', { d: 'M11.75 1v14' }), arrow),
  el('span', { text: STR.guideToggle.label }));

  // Open at every start: the notices must be seen. Closed for the session only.
  function setOpen(open: boolean): void {
    root.classList.toggle('is-closed', !open);
    toggle.setAttribute('aria-expanded', String(open));
    // The arrow shows where the panel's edge will go.
    arrow.setAttribute('d', open ? 'M5 5.25 7.75 8 5 10.75' : 'M7.75 5.25 5 8l2.75 2.75');
    toggle.title = open ? STR.guideToggle.hide : STR.guideToggle.show;
  }
  // The slide is on for the click only: resizing the window must not animate.
  let sliding: ReturnType<typeof setTimeout> | undefined;
  toggle.addEventListener('click', () => {
    const main = root.parentElement;
    main?.classList.add('is-sliding');
    clearTimeout(sliding);
    sliding = setTimeout(() => main?.classList.remove('is-sliding'), SLIDE_MS + 50);
    setOpen(root.classList.contains('is-closed'));
  });
  setOpen(true);

  /** 'empty' marks the panel at rest; null means nothing rendered yet. */
  let currentId: string | null = null;
  let viz: Viz | null = null;
  let valueEl: HTMLElement | null = null;
  let rawEl: HTMLElement | null = null;

  // The default shown depends on the edited preset: rebuild when it changes.
  const keyOf = (state: AppState): string =>
    state.focusedParam === null ? 'empty' : `${state.focusedParam}/${state.editedPreset}`;

  // At rest: two tabs, built once so that the chosen one survives the guide.
  const rest = STR.explainerEmpty;
  const panel = (id: RestView, ...children: Node[]) =>
    el('div', { class: 'rest', id: `view-${id}`, role: 'tabpanel', 'aria-labelledby': `tab-${id}` }, ...children);
  const restPanels: Record<RestView, HTMLElement> = {
    welcome: panel('welcome', el('p', { text: rest.intro }),
      ...rest.notices.flatMap((n) => [el('h2', { text: n.title }), el('p', { text: n.text })])),
    graph: panel('graph', ...rest.graph.map((text) => el('p', { text }))),
  };
  const restTabs = buildTabs(REST_VIEWS, rest.tabs, rest.aria, (id) => {
    for (const v of REST_VIEWS) restPanels[v].hidden = v !== id;
  });
  restTabs.select('welcome');

  function renderEmpty(): void {
    currentId = 'empty';
    body.className = 'guide-body';
    viz = null;
    valueEl = null;
    rawEl = null;
    body.replaceChildren(restTabs.root, ...REST_VIEWS.map((v) => restPanels[v]));
    appendHints();
  }

  function appendHints(): void {
    const hint = el('p', { class: 'hint' });
    hint.append(
      el('kbd', { text: STR.hints.arrows }), ' ' + STR.hints.step + '  ·  ',
      el('kbd', { text: STR.hints.shiftKey }), ' + ', el('kbd', { text: STR.hints.arrows }), ' ' + STR.hints.bigStep + '  ·  ',
      el('kbd', { text: STR.hints.deleteKey }), ' ' + STR.hints.reset,
    );
    body.append(hint);
  }

  function rebuild(state: AppState): void {
    if (state.focusedParam === null) {
      renderEmpty();
      return;
    }
    const def = getParam(state.focusedParam);
    const x = EXPLANATIONS[def.id];
    currentId = keyOf(state);
    body.className = `guide-body voice-${voiceOf(def.id) ?? 'none'}`;
    body.replaceChildren();
    if (!x) return;

    const value = store.getValue(def.id);
    const machineName = def.panelName ?? def.manualName;
    const defaultValue =
      def.scope === 'system'
        ? (def.defaults as number)
        : (def.defaults as readonly [number, number])[state.editedPreset];

    body.append(el('h2', { text: x.title }));
    const machine = el('p', { class: 'machine' }, `${STR.machineMenu}: `);
    machine.append(el('b', { text: machineName }));
    body.append(machine);

    const what = el('p');
    what.append(el('b', { text: STR.whatLabel + ' ' }), x.what);
    const hear = el('p');
    hear.append(el('b', { text: STR.hearLabel + ' ' }), x.hear);
    body.append(what, hear);

    valueEl = el('b', { text: formatValue(def, value) });
    rawEl = el('span', { class: 'raw', text: machineValue(def, value) });
    const meta = el('div', { class: 'meta' });
    const cell1 = el('div', { 'aria-live': 'polite' }, valueEl, el('span', { text: STR.currentValue }), rawEl);
    const cell2 = el('div', {}, el('b', { text: rangeText(def) }), el('span', { text: STR.range }));
    const cell3 = el('div', {}, el('b', { text: formatValue(def, defaultValue) }),
      el('span', { text: `${STR.defaultShort}${def.scope === 'preset' ? ` P${state.editedPreset + 1}` : ''}` }));
    meta.append(cell1, cell2, cell3);
    // The rotor mode is a live state the dump does not hold: no value to show.
    if (def.id !== 'leslieMode') body.append(meta);

    viz = buildViz(def, value);
    if (viz) body.append(viz.root);

    if (x.advice) {
      const advice = el('p', { class: 'advice' });
      advice.append(el('b', { text: STR.adviceLabel + ' ' }), x.advice);
      body.append(advice);
    }

    // Persistent keyboard affordances (brief: full keyboard navigation).
    appendHints();
  }

  return {
    root,
    toggle,
    update(state) {
      if (keyOf(state) !== currentId) {
        rebuild(state);
        return;
      }
      if (state.focusedParam === null) return;
      const def = getParam(state.focusedParam);
      const value = store.getValue(def.id);
      if (valueEl) valueEl.textContent = formatValue(def, value);
      if (rawEl) rawEl.textContent = machineValue(def, value);
      viz?.update(value);
    },
  };
}
