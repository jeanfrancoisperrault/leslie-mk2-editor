// Work area: the score, then the settings. Two views (Sound / System) so that
// the rarely used system settings stay out of the way.

import { EXPLANATIONS, STR } from '../content/i18n';
import type { SpeedCommand } from '../midi/speed';
import { getParam } from '../params/schema';
import type { AppState, Store } from '../state/store';
import { buildParamRow } from './controls';
import type { ParamRow } from './controls';
import { el } from './dom';
import { ROTOR_ROWS, SYSTEM_GROUPS, TONE_GROUPS } from './layout';
import { buildScore } from './score';

export interface Panels {
  root: HTMLElement;
  update(state: AppState): void;
  play(cmd: SpeedCommand | null): void;
}

type View = 'sound' | 'system';
const VIEWS: View[] = ['sound', 'system'];

export function buildPanels(store: Store, status: HTMLElement): Panels {
  const rows: ParamRow[] = [];
  const add = (id: string, label: string): HTMLElement => {
    const row = buildParamRow(getParam(id), store, label);
    rows.push(row);
    return row.root;
  };

  const score = buildScore(store);

  // Waiting instructions, shown until the first dump from the Leslie.
  const steps = el('ol', { class: 'waiting-steps' });
  for (const s of STR.waiting.steps) steps.append(el('li', { text: s }));
  const waiting = el('section', { class: 'waiting', role: 'status' },
    el('h2', { text: STR.waiting.title }),
    el('p', { text: STR.waiting.body }),
    steps,
    el('p', { class: 'waiting-note', text: STR.waiting.note }));

  // Rotor settings: one column per rotor, the same rows in both, each with its name.
  const rotors = el('div', { class: 'pair' });
  for (const rotor of ['horn', 'low'] as const) {
    const title = STR.groups[rotor]!;
    const block = el('section', { class: 'column', 'aria-label': title }, el('h2', { text: title }));
    for (const r of ROTOR_ROWS) block.append(add(r[rotor], STR.rows[r.key]));
    rotors.append(block);
  }
  const tone = el('div', { class: 'pair tone' });
  for (const g of TONE_GROUPS) {
    const title = STR.toneGroups[g.key];
    const block = el('section', { class: 'column', 'aria-label': title }, el('h2', { text: title }));
    for (const r of g.rows) block.append(add(r.param, STR.toneRows[r.key]));
    tone.append(block);
  }
  const sound = el('div', { class: 'view sound', id: 'view-sound', role: 'tabpanel', 'aria-labelledby': 'tab-sound' },
    rotors, tone);

  const system = el('div', { class: 'view system', id: 'view-system', role: 'tabpanel', 'aria-labelledby': 'tab-system' });
  for (const g of SYSTEM_GROUPS) {
    const title = STR.systemGroups[g.key];
    const block = el('section', { class: 'system-group', 'aria-label': title }, el('h2', { text: title }));
    for (const id of g.params) block.append(add(id, EXPLANATIONS[id]?.title ?? id));
    system.append(block);
  }
  const views: Record<View, HTMLElement> = { sound, system };

  let view: View = 'sound';
  const tablist = el('div', { class: 'tabs', role: 'tablist', 'aria-label': STR.views.aria });
  const tabs = VIEWS.map((v) => {
    const b = el('button', { type: 'button', role: 'tab', id: `tab-${v}`, 'aria-controls': `view-${v}`, text: STR.views[v] });
    b.addEventListener('click', () => select(v));
    tablist.append(b);
    return b;
  });
  tablist.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    select(view === 'sound' ? 'system' : 'sound');
    tabs[VIEWS.indexOf(view)]!.focus();
  });

  function select(next: View): void {
    view = next;
    VIEWS.forEach((v, i) => {
      tabs[i]!.setAttribute('aria-selected', String(v === view));
      tabs[i]!.tabIndex = v === view ? 0 : -1;
    });
    paint();
    score.update(store.state); // the graph pauses while hidden
  }

  function paint(): void {
    const locked = store.locked;
    waiting.hidden = !locked;
    tablist.hidden = locked;
    score.root.hidden = !locked && view !== 'sound';
    for (const v of VIEWS) views[v].hidden = locked || v !== view;
  }

  const root = el('div', { class: 'work' },
    el('div', { class: 'work-head' }, tablist, status), score.root, waiting, sound, system);
  select('sound');

  return {
    root,
    update(state) {
      paint();
      score.update(state);
      for (const row of rows) row.update(state);
    },
    play: (cmd) => score.play(cmd),
  };
}
