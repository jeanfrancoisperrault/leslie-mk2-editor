// The score: one graph per rotor, sharing one time axis. The five lines of
// each graph are the rpm scale (0-400 by 100); each measure starts at a
// Slow / Brake / Fast command and has its own clock and scale. Drawn from the real settings, and played when a command is
// sent or reported. Pointer shortcuts only: every setting has its own control.

import { EXPLANATIONS, STR } from '../content/i18n';
import type { SpeedCommand } from '../midi/speed';
import type { AppState, Store } from '../state/store';
import { opensGuide } from './controls';
import { el, svgEl } from './dom';
import { SEGMENT_PARAM, SPAN_S, rampPoints, rotorSettings, stepSpeed } from './score-model';
import type { Rotor } from './score-model';

const ROTORS: Rotor[] = ['horn', 'low'];
/** Same order as the half-moon. */
const MEASURES: SpeedCommand[] = ['slow', 'brake', 'fast'];

const GUTTER = 178;
const RIGHT = 8;
const TOP = 56;
/** Between the rotors: each graph has its own speed scale. */
const STAFF_GAP = 64;
/** Below the low staff: speed label, then the time axis. */
const FOOT = 50;
/** Height the rest of the work area needs; the staves take what is left. */
const REST_H = 506;
const STAFF_MIN = 64;
const STAFF_MAX = 124;
/** Between measures: each has its own clock, and repeats the speed scale. */
const GAP = 56;
/** Room for the longest duration label. */
const TIME_W = 58;

const secondsText = (t: number) => `${t.toLocaleString('en-US', { minimumFractionDigits: 1 })} s`;

export interface Score {
  root: HTMLElement;
  update(state: AppState): void;
  /** Last rotor command sent or reported; null = unknown. */
  play(cmd: SpeedCommand | null): void;
}

export function buildScore(store: Store): Score {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const svg = svgEl('svg', { class: 'score-svg', role: 'img' });
  const root = el('section', { class: 'score', 'aria-label': STR.score.aria }, svg);

  let width = 0;
  let staffH = STAFF_MIN;
  let mode: SpeedCommand | null = null;
  /** Seconds since the last command; null = no playhead. */
  let playTime: number | null = null;
  /** Calculated speeds; null until a command is sent or reported (a dump does
      not hold the rotor mode). */
  const speed: Record<Rotor, number | null> = { horn: null, low: null };
  const angle: Record<Rotor, number> = { horn: 0, low: 0 };
  const arms: Partial<Record<Rotor, SVGElement>> = {};
  const readouts: Partial<Record<Rotor, SVGElement>> = {};
  let playhead: SVGElement | null = null;
  let frame = 0;
  let lastFrame = 0;
  let drawnKey = '';

  const settings = (rotor: Rotor) => rotorSettings((id) => store.getValue(id), rotor);
  const loadedSettings = (rotor: Rotor) =>
    rotorSettings((id) => store.loadedValue(id) ?? store.getValue(id), rotor);

  const measureW = () => (width - GUTTER - RIGHT - 2 * GAP) / 3;
  const measureX = (i: number) => GUTTER + i * (measureW() + GAP);
  const x = (i: number, t: number) => measureX(i) + (t / SPAN_S) * measureW();
  const staffY = (rotor: Rotor) => (rotor === 'horn' ? TOP : TOP + staffH + STAFF_GAP);
  const y = (rotor: Rotor, rpm: number) => staffY(rotor) + staffH * (1 - rpm / 400);

  const line = (x1: number, y1: number, x2: number, y2: number, cls: string) =>
    svgEl('line', { x1: String(x1), y1: String(y1), x2: String(x2), y2: String(y2), class: cls });
  const text = (tx: number, ty: number, cls: string, content: string, anchor = 'start') =>
    svgEl('text', { x: String(tx), y: String(ty), class: cls, 'text-anchor': anchor }, content);
  const head = (cx: number, cy: number, cls: string) =>
    svgEl('circle', { cx: String(cx), cy: String(cy), r: '5.5', class: cls });

  /** A stretch of the curve tied to one parameter: line, plus a wide hit area. */
  function segment(id: string, pts: [number, number][]): SVGElement {
    const points = pts.map(([px, py]) => `${px},${py}`).join(' ');
    const g = svgEl('g', { class: 'score-seg', 'data-seg': id },
      svgEl('polyline', { points, class: 'score-line' }),
      svgEl('polyline', { points, class: 'score-hit' }));
    g.append(svgEl('title', {}, EXPLANATIONS[id]?.title ?? id));
    opensGuide(g, id, store);
    g.addEventListener('click', () => {
      document.querySelector<HTMLElement>(`.param[data-param="${id}"] input`)?.focus();
    });
    return g;
  }

  function drawStaff(rotor: Rotor): SVGElement {
    const g = svgEl('g');
    MEASURES.forEach((_, i) => {
      const mx = measureX(i);
      for (let rpm = 0; rpm <= 400; rpm += 100) g.append(line(mx, y(rotor, rpm), mx + measureW(), y(rotor, rpm), 'score-staff'));
      g.append(line(mx, y(rotor, 400), mx, y(rotor, 0), 'score-bar'),
        text(mx - 10, y(rotor, 400) + 4, 'score-scale', '400', 'end'),
        text(mx - 10, y(rotor, 0) + 4, 'score-scale', '0', 'end'));
    });

    // Rotor seen from above, with the calculated current speed.
    const cy = staffY(rotor) + staffH / 2;
    const arm = svgEl('g', {}, line(0, 0, 18, 0, 'score-arm'),
      svgEl('circle', { cx: '18', cy: '0', r: '4.5', class: 'score-arm-tip' }));
    const rotorG = svgEl('g', { class: 'score-rotor' });
    rotorG.append(svgEl('g', { transform: `translate(26 ${cy})` },
      svgEl('circle', { r: '25', class: 'score-disc' }), arm,
      svgEl('circle', { r: '3', class: 'score-hub' })));
    const readout = text(62, cy + 18, 'score-rpm', '— rpm');
    rotorG.append(text(62, cy - 6, 'score-name', STR.score.rotors[rotor]), readout);
    g.append(rotorG);
    arms[rotor] = arm;
    readouts[rotor] = readout;

    if (store.locked) return g;
    const s = settings(rotor);
    const was = loadedSettings(rotor);
        MEASURES.forEach((cmd, i) => {
      // Colored by the mode the measure leads to; each point by the speed it holds.
      const m = svgEl('g', { class: `voice-${cmd}` });
      g.append(m);
      const toPx = ([t, rpm]: [number, number]): [number, number] => [x(i, t), y(rotor, rpm)];
      const pts = rampPoints(cmd, s);
      const wasPts = rampPoints(cmd, was);
      if (JSON.stringify(pts) !== JSON.stringify(wasPts)) {
        // What the machine held at the dump: dashed line, open point.
        const [wx, wy] = toPx(wasPts[1]!);
        m.append(svgEl('polyline', { points: wasPts.map((p) => toPx(p).join(',')).join(' '), class: 'score-was' }),
          head(wx, wy, 'score-head-was'));
      }
      const [a, b, c] = pts.map(toPx) as [[number, number], [number, number], [number, number]];
      m.append(segment(`${rotor}${SEGMENT_PARAM[cmd]}`, [a, b]));
      if (cmd === 'brake') m.append(svgEl('polyline', { points: `${b.join(',')} ${c.join(',')}`, class: 'score-line' }));
      else m.append(segment(`${rotor}${cmd === 'fast' ? 'FastSpeed' : 'SlowSpeed'}`, [b, c]));
      m.append(head(a[0], a[1], `score-head voice-${cmd === 'fast' ? 'slow' : 'fast'}`), head(b[0], b[1], 'score-head'));
      // Duration next to the end of the ramp, on the side the line leaves free.
      // Near the end of the measure it backs up against it, further from the ramp.
      const tight = b[0] + 11 + TIME_W > c[0] + GAP / 4;
      const timeY = cmd === 'fast' ? b[1] + (tight ? 34 : 18) : b[1] - (tight ? 26 : 9);
      m.append(text(tight ? c[0] - 8 : b[0] + 11, timeY, 'score-time',
        secondsText(cmd === 'fast' ? s.rise : cmd === 'slow' ? s.fall : s.brake), tight ? 'end' : 'start'));
      if (cmd === 'fast') m.append(text(c[0] - 8, c[1] - 7, 'score-held', `${s.fast} rpm`, 'end'));
      if (cmd === 'slow') m.append(text(c[0] - 8, c[1] + 16, 'score-held', `${s.slow} rpm`, 'end'));
    });
    return g;
  }

  function draw(): void {
    if (width < 300) return;
    const top = TOP;
    const bottom = staffY('low') + staffH;
    svg.setAttribute('viewBox', `0 0 ${width} ${bottom + FOOT}`);
    svg.setAttribute('height', String(bottom + FOOT));
    const frameG = svgEl('g', {});
    MEASURES.forEach((cmd, i) => {
      const mx = measureX(i);
      frameG.append(text(mx, 24, `score-command voice-${cmd}`, STR.speed.cmds[cmd]));
      for (const t of [0, 5, 10, 15]) {
        frameG.append(line(x(i, t), bottom + 24, x(i, t), bottom + 29, 'score-tick'),
          text(x(i, t), bottom + 44, 'score-scale', t === 0 ? '0 s' : String(t), t === 0 ? 'start' : 'middle'));
      }
    });

    playhead = line(0, top - 10, 0, bottom + 6, 'score-playhead');
    svg.replaceChildren(frameG, ...ROTORS.map(drawStaff), playhead);
    svg.setAttribute('aria-label', store.locked ? STR.score.empty : STR.score.summary(settings('horn'), settings('low')));
    paintMotion();
    paintFocus(store.state.focusedParam);
  }

  function paintFocus(id: string | null): void {
    let any = false;
    for (const g of svg.querySelectorAll<SVGElement>('[data-seg]')) {
      const on = g.dataset['seg'] === id;
      any ||= on;
      g.classList.toggle('is-on', on);
    }
    svg.classList.toggle('has-focus', any);
  }

  function paintMotion(): void {
    // The rotors take the color of the mode they are following.
    for (const g of svg.querySelectorAll('.score-rotor')) g.setAttribute('class', `score-rotor voice-${mode && !store.locked ? mode : 'none'}`);
    for (const rotor of ROTORS) {
      arms[rotor]?.setAttribute('transform', `rotate(${angle[rotor]})`);
      const r = readouts[rotor];
      if (r) r.textContent = speed[rotor] === null || store.locked ? '— rpm' : `${Math.round(speed[rotor]!)} rpm`;
    }
    if (!playhead) return;
    const shown = mode !== null && playTime !== null && playTime <= SPAN_S && !store.locked;
    playhead.style.opacity = shown ? '1' : '0';
    if (shown) {
      const px = String(x(MEASURES.indexOf(mode!), playTime!));
      playhead.setAttribute('x1', px);
      playhead.setAttribute('x2', px);
    }
  }

  function tick(time: number): void {
    // A long gap (hidden tab) is caught up in one step.
    const dt = Math.max(0, (time - lastFrame) / 1000);
    lastFrame = time;
    let moving = false;
    for (const rotor of ROTORS) {
      const s = settings(rotor);
      // First command from an unknown state: assume the speed the measure starts at.
      const now = stepSpeed(speed[rotor] ?? rampPoints(mode!, s)[0]![1], mode!, s, dt);
      speed[rotor] = now;
      if (!reduced.matches) angle[rotor] = (angle[rotor] + now * 6 * dt) % 360;
      if (now > 0) moving = true;
    }
    if (playTime !== null) {
      playTime += dt;
      if (playTime > SPAN_S) playTime = null;
      else moving = true;
    }
    paintMotion();
    frame = moving ? requestAnimationFrame(tick) : 0;
  }

  function wake(): void {
    if (frame || mode === null || store.locked) return;
    lastFrame = performance.now();
    frame = requestAnimationFrame(tick);
  }

  const observer = new ResizeObserver(() => {
    const w = Math.floor(root.clientWidth);
    const available = root.parentElement?.clientHeight ?? 0;
    const h = Math.round(Math.min(STAFF_MAX, Math.max(STAFF_MIN, (available - REST_H - TOP - STAFF_GAP - FOOT) / 2)));
    if (w === 0 || (w === width && h === staffH)) return;
    width = w;
    staffH = h;
    draw();
  });
  observer.observe(root);
  // The work area decides the height left for the staves.
  queueMicrotask(() => root.parentElement && observer.observe(root.parentElement));

  let wasLocked = true;
  return {
    root,
    update(state) {
      if (wasLocked && !store.locked && mode !== null) {
        // Command sent before the first dump: the rotors have settled since.
        for (const rotor of ROTORS) speed[rotor] = stepSpeed(0, mode, settings(rotor), Infinity);
        playTime = null;
      }
      wasLocked = store.locked;
      const key = JSON.stringify([store.locked, ...ROTORS.map(settings), ...ROTORS.map(loadedSettings)]);
      if (key !== drawnKey) {
        drawnKey = key;
        draw();
      }
      paintFocus(state.focusedParam);
      wake();
    },
    play(cmd) {
      mode = cmd;
      playTime = cmd === null ? null : 0;
      paintMotion();
      wake();
    },
  };
}
