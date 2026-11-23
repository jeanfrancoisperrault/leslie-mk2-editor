// Startup overlay shown when no compatible MIDI device is detected. It explains
// how to hook the Leslie up over MIDI and closes itself as soon as a port
// appears (hot-plug), or on user dismissal.

import { STR } from '../content/i18n';
import { el, svgEl } from './dom';

export type OverlayKind = 'unsupported' | 'denied' | 'no-port' | 'no-leslie';

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
  #intro: HTMLElement | null = null;
  #kind: OverlayKind | null = null;

  get isOpen(): boolean {
    return this.#backdrop !== null;
  }

  show(kind: OverlayKind): void {
    if (this.#backdrop) {
      this.setKind(kind);
      return;
    }
    this.#kind = kind;

    const title = el('h2', { id: 'midi-overlay-title', class: 'overlay-title', text: STR.overlay.title });
    this.#intro = el('p', { class: 'overlay-intro', text: STR.overlay.intro[introKey(kind)] });

    const steps = el('ol', { class: 'overlay-steps' });
    for (const s of STR.overlay.howTo) steps.append(el('li', { text: s }));

    const dismiss = el('button', { type: 'button', class: 'btn btn-outline', text: STR.overlay.continueSim });
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
      this.#intro,
      el('h3', { class: 'overlay-subtitle', text: STR.overlay.howToTitle }),
      el('div', { class: 'overlay-diagram' }, chainDiagram()),
      steps,
      el('p', { class: 'overlay-note', text: STR.overlay.autoDetect }),
      el('p', { class: 'overlay-note', text: STR.overlay.simulatorNote }),
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

  /** Swap the intro paragraph when the detection state changes while open. */
  setKind(kind: OverlayKind): void {
    if (!this.#backdrop || this.#kind === kind) return;
    this.#kind = kind;
    if (this.#intro) this.#intro.textContent = STR.overlay.intro[introKey(kind)];
  }

  close(): void {
    this.#backdrop?.remove();
    this.#backdrop = null;
    this.#intro = null;
    this.#kind = null;
  }
}

function introKey(kind: OverlayKind): keyof typeof STR.overlay.intro {
  switch (kind) {
    case 'unsupported': return 'unsupported';
    case 'denied': return 'denied';
    case 'no-port': return 'noPort';
    case 'no-leslie': return 'noLeslie';
  }
}
