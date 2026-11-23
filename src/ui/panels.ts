// Edit zone: one block per parameter group, rows generated from the schema.

import { STR } from '../content/i18n';
import { PARAMS } from '../params/schema';
import type { ParamGroup } from '../params/schema';
import type { AppState, Store } from '../state/store';
import { buildParamRow } from './controls';
import type { ParamRow } from './controls';
import { el } from './dom';

const GROUP_ORDER: ParamGroup[] = ['horn', 'low', 'common', 'system'];

export function buildPanels(store: Store): { root: HTMLElement; update(state: AppState): void } {
  const root = el('div', { class: 'edit' });
  const rows: ParamRow[] = [];

  // Waiting card, shown until the first dump from the Leslie is received.
  const steps = el('ol', { class: 'waiting-steps' });
  for (const s of STR.waiting.steps) steps.append(el('li', { text: s }));
  const waiting = el('section', { class: 'waiting', role: 'status' },
    el('h2', { text: STR.waiting.title }),
    el('p', { text: STR.waiting.body }),
    steps,
    el('p', { class: 'waiting-note', text: STR.waiting.note }));
  const blocks = el('div', { class: 'edit-blocks' });

  for (const group of GROUP_ORDER) {
    const title = STR.groups[group] ?? group;
    const block = el('section', { class: 'block', 'aria-label': title });
    block.append(el('h2', { text: title }));
    for (const def of PARAMS) {
      if (def.group !== group) continue;
      if (def.id === 'presetNumber') continue; // lives in the header switch
      const row = buildParamRow(def, store);
      rows.push(row);
      block.append(row.root);
    }
    blocks.append(block);
  }
  root.append(waiting, blocks);

  return {
    root,
    update(state) {
      const locked = store.locked;
      waiting.hidden = !locked;
      blocks.classList.toggle('is-locked', locked);
      blocks.toggleAttribute('inert', locked);
      for (const row of rows) row.update(state);
    },
  };
}
