// Startup dialog, shown when no MIDI port can be reached (overlay-model.ts). It
// explains how to hook the Leslie up and closes as soon as a port appears, a
// dump arrives, or the user dismisses it. Also opened on request, for the wiring.

import { STR } from '../content/i18n';
import { el, svgEl } from './dom';
import type { OverlayKind } from './overlay-model';

/** Connection diagram: computer <-> USB-MIDI interface, then one MIDI cable each
    way (the editor needs the return cable to read the Leslie). */
function chainDiagram(): SVGElement {
  const d = STR.overlay.diagram;
  const TOP = 46; // cable to the Leslie
  const BOTTOM = 78; // cable back from the Leslie
  const text = (x: number, y: number, label: string, size: number, anchor = 'middle', fill = 'var(--ink)') =>
    svgEl('text', { x: String(x), y: String(y), 'text-anchor': anchor, fill, 'font-size': String(size),
      'font-weight': size > 12 ? '500' : '400' }, label);
  const box = (x: number, w: number, label: string, titleY: number) => [
    svgEl('rect', { x: String(x), y: '4', width: String(w), height: '92', rx: '4', fill: 'var(--ground)', stroke: 'var(--rule-strong)' }),
    text(x + w / 2, titleY, label, 13),
  ];
  const arrow = (from: number, to: number, y: number) => {
    const back = to > from ? -6 : 6;
    return [
      svgEl('line', { x1: String(from), y1: String(y), x2: String(to), y2: String(y), stroke: 'var(--ink)', 'stroke-width': '2' }),
      svgEl('path', { d: `M${to + back} ${y - 4}L${to} ${y}L${to + back} ${y + 4}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': '2' }),
    ];
  };
  return svgEl(
    'svg',
    { viewBox: '0 0 520 100', role: 'img', 'aria-label': d.aria },
    ...box(2, 92, d.computer, 55),
    ...arrow(118, 96, 50), ...arrow(118, 150, 50), text(123, 42, d.usb, 12, 'middle', 'var(--ink-soft)'),
    ...box(152, 152, d.interface, 24),
    text(296, TOP + 4, d.out, 12, 'end'), text(296, BOTTOM + 4, d.in, 12, 'end'),
    ...arrow(306, 408, TOP), ...arrow(408, 306, BOTTOM),
    ...box(410, 108, d.leslie, 24),
    text(418, TOP + 4, d.in, 12, 'start'), text(418, BOTTOM + 4, d.out, 12, 'start'),
  );
}

export class MidiOverlay {
  #backdrop: HTMLElement | null = null;
  #opener: Element | null = null;
  #kind: OverlayKind | null = null;

  /** What the open dialog is about; null when it is closed. */
  get kind(): OverlayKind | null {
    return this.#kind;
  }

  show(kind: OverlayKind): void {
    if (this.#backdrop) return;
    this.#kind = kind;
    this.#opener = document.activeElement;

    const wiring = kind === 'wiring';
    const title = el('h2', { id: 'midi-overlay-title', class: 'overlay-title', text: wiring ? STR.overlay.howToTitle : STR.overlay.title });

    const steps = el('ol', { class: 'overlay-steps' });
    for (const s of STR.overlay.howTo) steps.append(el('li', { text: s }));

    const dismiss = el('button', { type: 'button', class: 'btn btn-outline', text: wiring ? STR.overlay.close : STR.overlay.continueWithout });
    dismiss.addEventListener('click', () => this.close());
    const footer = el('div', { class: 'overlay-footer' });
    if (kind === 'denied' || kind === 'unsupported') {
      const reload = el('button', { type: 'button', class: 'btn', text: STR.overlay.reload });
      reload.addEventListener('click', () => window.location.reload());
      footer.append(reload);
    }
    footer.append(dismiss);

    const dialog = el('div', { class: 'overlay-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'midi-overlay-title' },
      title,
      ...(wiring ? [] : [el('p', { class: 'overlay-intro', text: STR.overlay.intro[kind] }),
        el('h3', { class: 'overlay-subtitle', text: STR.overlay.howToTitle })]),
      el('div', { class: 'overlay-diagram' }, chainDiagram()),
      steps,
      ...(kind === 'no-port' ? [el('p', { class: 'overlay-note', text: STR.overlay.autoDetect })] : []),
      ...(wiring ? [] : [el('p', { class: 'overlay-note', text: STR.overlay.lockedNote })]),
      footer,
    );

    this.#backdrop = el('div', { class: 'overlay-backdrop' }, dialog);
    this.#backdrop.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
      // Minimal focus trap across the dialog's focusable controls.
      if (e.key === 'Tab') {
        const focusables = [...dialog.querySelectorAll<HTMLElement>('button')];
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    document.body.append(this.#backdrop);
    dismiss.focus();
  }

  close(): void {
    if (!this.#backdrop) return;
    this.#backdrop.remove();
    this.#backdrop = null;
    this.#kind = null;
    if (this.#opener instanceof HTMLElement) this.#opener.focus();
    this.#opener = null;
  }
}
