// Half-moon rotor switch: three keys (Slow, Brake, Fast) around a lever. The
// keys are the accessible controls; the lever is their pointer shortcut and
// shows the last mode sent or reported. Hangs below the top bar.

import { STR } from '../content/i18n';
import type { SpeedCommand } from '../midi/speed';
import { el, svgEl } from './dom';
import { LEVER_H, LEVER_W, LeverDrag, TRAVEL, capAt, leverPath, positionOf } from './halfmoon-model';

/** Outline of the panel, from the drawing: flat top, shallow curved bottom. */
const PANEL = 'M305 0V59.3C266.9 78 212.7 89.7 152.5 89.7C92.3 89.7 38.1 78 0 59.3V0Z';

export interface HalfMoon {
  root: HTMLElement;
  /** Last mode sent or reported; null = unknown (lever dimmed, no light). */
  setMode(cmd: SpeedCommand | null): void;
  onSelect: ((cmd: SpeedCommand) => void) | null;
}

export function buildHalfMoon(): HalfMoon {
  let mode: SpeedCommand | null = null;

  const key = (cmd: SpeedCommand): HTMLButtonElement => {
    const b = el('button', { type: 'button', class: `hm-key hm-${cmd}`, 'data-cmd': cmd, title: STR.speed.note },
      el('span', { class: 'hm-name', text: STR.speed.cmds[cmd] }));
    if (cmd !== 'brake') b.append(el('span', { class: 'lamp', 'aria-hidden': 'true' }));
    b.addEventListener('click', () => halfMoon.onSelect?.(cmd));
    return b;
  };
  const keys = [key('slow'), key('brake'), key('fast')];

  const body = svgEl('path', { class: 'hm-lever-body' });
  const cap = svgEl('ellipse', { class: 'hm-lever-cap', cy: String(LEVER_H / 2), ry: '12' });
  const lever = svgEl('svg', { class: 'hm-lever', viewBox: `0 0 ${LEVER_W} ${LEVER_H}`, 'aria-hidden': 'true' },
    svgEl('rect', { class: 'hm-slot-rim', x: '23.6', y: '11.65', width: '87.7', height: '8.7', rx: '4.35' }),
    svgEl('rect', { class: 'hm-slot', x: '26.5', y: '14.5', width: '82', height: '3', rx: '1.5' }),
    body, cap);
  const panel = svgEl('svg', { class: 'hm-panel', viewBox: '0 0 305 90', preserveAspectRatio: 'none', 'aria-hidden': 'true' },
    svgEl('path', { d: PANEL }));

  const root = el('div', { class: 'halfmoon', role: 'group', 'aria-label': STR.speed.label }, panel, keys[0]!, lever, keys[1]!, keys[2]!);

  function drawLever(t: number): void {
    body.style.setProperty('d', `path("${leverPath(t)}")`);
    const { cx, rx } = capAt(t);
    cap.style.setProperty('cx', `${cx}px`);
    cap.style.setProperty('rx', `${rx}px`);
  }

  function rest(): void {
    drawLever(mode === null ? 0 : positionOf(mode));
  }

  // --- Drag: the command goes out on release only (halfmoon-model). ---
  let drag: LeverDrag | null = null;
  const pointerT = (e: PointerEvent): number => {
    const r = lever.getBoundingClientRect();
    return ((e.clientX - r.left - r.width / 2) / r.width) * (LEVER_W / TRAVEL);
  };
  lever.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    lever.setPointerCapture(e.pointerId);
    drag = new LeverDrag(mode, pointerT(e));
    drawLever(drag.position);
  });
  lever.addEventListener('pointermove', (e) => {
    if (!drag) return;
    lever.classList.add('is-dragging');
    drag.move(pointerT(e));
    drawLever(drag.position);
  });
  lever.addEventListener('pointerup', () => {
    const cmd = drag?.release() ?? null;
    endDrag();
    if (cmd) halfMoon.onSelect?.(cmd);
  });
  // Interrupted gesture (lost capture, system dialog): back to rest, send nothing.
  lever.addEventListener('pointercancel', endDrag);
  lever.addEventListener('lostpointercapture', endDrag);

  function endDrag(): void {
    if (!drag) return;
    drag = null;
    lever.classList.remove('is-dragging');
    rest();
  }

  const halfMoon: HalfMoon = {
    root,
    onSelect: null,
    setMode(cmd) {
      mode = cmd;
      root.toggleAttribute('data-unknown', cmd === null);
      for (const b of keys) b.setAttribute('aria-pressed', String(b.dataset['cmd'] === cmd));
      if (!drag) rest();
    },
  };
  halfMoon.setMode(null);
  return halfMoon;
}
