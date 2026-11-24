// Tab list (WAI-ARIA tabs): one tab stop, arrow keys move and select.

import { el } from './dom';

export interface Tabs<T extends string> {
  root: HTMLElement;
  select(id: T): void;
}

/** Index of the tab a key leads to; null when the key is not for the tabs. */
export function tabAfterKey(key: string, current: number, count: number): number | null {
  const step = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0;
  return step === 0 ? null : (current + step + count) % count;
}

/** Tab `tab-<id>` controls panel `view-<id>`; the caller shows the panel. */
export function buildTabs<T extends string>(
  ids: readonly T[], labels: Record<T, string>, aria: string, onSelect: (id: T) => void,
): Tabs<T> {
  const root = el('div', { class: 'tabs', role: 'tablist', 'aria-label': aria });
  let current = 0;
  const tabs = ids.map((id) => {
    const b = el('button', { type: 'button', role: 'tab', id: `tab-${id}`, 'aria-controls': `view-${id}`, text: labels[id] });
    b.addEventListener('click', () => select(id));
    root.append(b);
    return b;
  });
  root.addEventListener('keydown', (e) => {
    const next = tabAfterKey(e.key, current, ids.length);
    if (next === null) return;
    e.preventDefault();
    select(ids[next]!);
    tabs[current]!.focus();
  });

  function select(id: T): void {
    current = ids.indexOf(id);
    tabs.forEach((b, i) => {
      b.setAttribute('aria-selected', String(i === current));
      b.tabIndex = i === current ? 0 : -1;
    });
    onSelect(id);
  }

  return { root, select };
}
