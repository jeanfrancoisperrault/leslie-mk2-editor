// Tab list (WAI-ARIA tabs): one tab stop, arrow keys move and select.

import { el } from './dom';

export interface Tabs<T extends string> {
  root: HTMLElement;
  select(id: T): void;
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
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    e.preventDefault();
    select(ids[(current + step + ids.length) % ids.length]!);
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
