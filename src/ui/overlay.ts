// Startup overlay shown when no compatible MIDI device is detected
// (shadcn Dialog look). It explains how to hook the Leslie up over MIDI and
// closes itself as soon as a port appears (hot-plug), or on user dismissal.

import { STR } from '../content/i18n';
import { el, svgEl } from './dom';

export type OverlayKind = 'unsupported' | 'denied' | 'no-port' | 'no-leslie';

/** Small connection-chain diagram: computer -> USB-MIDI interface -> Leslie. */
function chainDiagram(): SVGElement {
  const d = STR.overlay.diagram;
  const box = (x: number, w: number, label: string) =>
    [
      svgEl('rect', {
        x: String(x), y: '14', width: String(w), height: '34', rx: '6',
        fill: 'none', stroke: 'var(--border)',
      }),
      svgEl('text', {
        x: String(x + w / 2), y: '35', 'text-anchor': 'middle',
        fill: 'var(--foreground)', 'font-size': '11', 'font-weight': '500',
      }, label),
    ];
  const link = (x1: number, x2: number, label: string) =>
    [
      svgEl('line', { x1: String(x1), y1: '31', x2: String(x2), y2: '31', stroke: 'var(--primary)', 'stroke-width': '2' }),
      svgEl('text', {
        x: String((x1 + x2) / 2), y: '24', 'text-anchor': 'middle',
        fill: 'var(--muted-foreground)', 'font-size': '9',
      }, label),
    ];
  return svgEl(
    'svg',
    { viewBox: '0 0 460 62', role: 'img', 'aria-label': `${d.computer} → ${d.interface} → ${d.leslie}` },
    ...box(4, 96, d.computer),
    ...link(100, 148, d.usb),
    ...box(148, 150, d.interface),
    ...link(298, 346, d.din),
    ...box(346, 110, d.leslie),
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
