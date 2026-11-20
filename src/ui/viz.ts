// Explainer visualizations, all vector geometry (no pictures):
// - curve: speed-time curve for rise/fall/brake times, redrawn live
// - rotor: top view spinning at the real rpm (prefers-reduced-motion aware)
// - crossover: two-way split diagram
// - character: qualitative filter schematic (labelled as schematic)

import { STR } from '../content/i18n';
import type { ParamDef } from '../params/schema';
import { el, svgEl } from './dom';

const INK_DIM = 'var(--muted-foreground)';
const GRID = 'color-mix(in oklab, var(--muted-foreground) 45%, transparent)';
const AMBER = 'var(--primary)';

export interface Viz {
  root: HTMLElement;
  /** Update for a new raw value of the same parameter. */
  update(value: number): void;
}

function figure(svg: SVGElement, caption: string): { fig: HTMLElement; cap: HTMLElement } {
  const cap = el('figcaption', { text: caption });
  const fig = el('figure', { class: 'viz' });
  fig.append(svg, cap);
  return { fig, cap };
}

/* ---------- Speed-time curve ---------- */

type CurveKind = 'rise' | 'fall' | 'brake';

function curveKind(def: ParamDef): CurveKind {
  if (def.id.includes('Rise')) return 'rise';
  if (def.id.includes('Fall')) return 'fall';
  return 'brake';
}

/** Max seconds on the x axis: horn tables go to 12.5 s, low to 14 s. */
function axisMax(def: ParamDef): number {
  return def.group === 'horn' ? 12.5 : 14;
}

export function curveViz(def: ParamDef, seconds: (v: number) => number, value: number): Viz {
  const kind = curveKind(def);
  const W = 360;
  const H = 150;
  const X0 = 36;
  const X1 = 350;
  const Y_FAST = 26;
  const Y_SLOW = 114;
  const Y_ZERO = 124;

  const topLabel = kind === 'brake' ? (def.group === 'horn' ? '400' : '376') : '400';
  const path = svgEl('path', { fill: 'none', stroke: AMBER, 'stroke-width': '2.5' });
  const marker = svgEl('line', {
    stroke: GRID,
    'stroke-width': '1',
    'stroke-dasharray': '2 3',
    y1: '14',
    y2: String(Y_ZERO),
  });
  const timeText = svgEl('text', { fill: AMBER, 'font-size': '10', y: '140' });

  const svg = svgEl(
    'svg',
    { viewBox: `0 0 ${W} ${H}`, role: 'img' },
    svgEl('line', { x1: String(X0), y1: '10', x2: String(X0), y2: String(Y_ZERO), stroke: GRID, 'stroke-width': '1' }),
    svgEl('line', { x1: String(X0), y1: String(Y_ZERO), x2: String(X1), y2: String(Y_ZERO), stroke: GRID, 'stroke-width': '1' }),
    svgEl('text', { x: '8', y: '16', fill: INK_DIM, 'font-size': '9' }, 'rpm'),
    svgEl('text', { x: '6', y: String(Y_FAST + 4), fill: INK_DIM, 'font-size': '9' }, kind === 'fall' || kind === 'rise' || kind === 'brake' ? topLabel : ''),
    svgEl('text', { x: '10', y: String((kind === 'rise' ? Y_SLOW : kind === 'fall' ? Y_SLOW : Y_ZERO) + 4) , fill: INK_DIM, 'font-size': '9' }, kind === 'brake' ? '0' : 'slow'),
    svgEl('text', { x: String(X1 - 8), y: '140', fill: INK_DIM, 'font-size': '9' }, 't'),
    marker,
    timeText,
    path,
  );

  function update(v: number): void {
    const t = seconds(v);
    const frac = Math.min(1, t / axisMax(def));
    const xEnd = X0 + Math.max(26, frac * (X1 - 60));
    const [yFrom, yTo] =
      kind === 'rise' ? [Y_SLOW, Y_FAST] : kind === 'fall' ? [Y_FAST, Y_SLOW] : [Y_FAST, Y_ZERO];
    const c1x = X0 + (xEnd - X0) * 0.45;
    const c2x = X0 + (xEnd - X0) * 0.6;
    path.setAttribute('d', `M${X0} ${yFrom} C ${c1x} ${yFrom}, ${c2x} ${yTo}, ${xEnd} ${yTo} L ${X1} ${yTo}`);
    marker.setAttribute('x1', String(xEnd));
    marker.setAttribute('x2', String(xEnd));
    const label = `${t.toLocaleString('en-US', { minimumFractionDigits: 1 })} s`;
    timeText.textContent = label;
    timeText.setAttribute('x', String(Math.max(X0 + 4, xEnd - 14)));
    svg.setAttribute(
      'aria-label',
      `Speed-time curve: ${kind === 'rise' ? 'acceleration' : kind === 'fall' ? 'slow-down' : 'stop'} over ${label}`,
    );
  }

  update(value);
  const { fig } = figure(svg, STR.vizCaptions.curve);
  return { root: fig, update };
}

/* ---------- Rotor ---------- */

export function rotorViz(rpm: (v: number) => number | undefined, value: number): Viz {
  const spin = svgEl('g', { class: 'rotor-spin' },
    // Rotor seen from above: drum circle + throat line + counterweight dot.
    svgEl('line', { x1: '70', y1: '62', x2: '116', y2: '62', stroke: AMBER, 'stroke-width': '3' }),
    svgEl('circle', { cx: '116', cy: '62', r: '5', fill: AMBER }),
    svgEl('circle', { cx: '70', cy: '62', r: '4', fill: INK_DIM }),
  );
  const rpmText = svgEl('text', { x: '210', y: '58', fill: 'var(--foreground)', 'font-size': '20', 'font-weight': '600' });
  const rpmUnit = svgEl('text', { x: '210', y: '76', fill: INK_DIM, 'font-size': '10' }, STR.vizLabels.rpmLong);
  const svg = svgEl(
    'svg',
    { viewBox: '0 0 360 124', role: 'img' },
    svgEl('circle', { cx: '70', cy: '62', r: '50', fill: 'none', stroke: GRID, 'stroke-width': '1.5' }),
    spin,
    rpmText,
    rpmUnit,
  );

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { fig, cap } = figure(svg, STR.vizCaptions.rotor);

  function update(v: number): void {
    const r = rpm(v) ?? 0;
    rpmText.textContent = String(r);
    svg.setAttribute('aria-label', `Rotor spinning at ${r} ${STR.vizLabels.rpmLong}`);
    if (r === 0) {
      spin.style.removeProperty('animation');
      spin.style.animation = 'none';
      cap.textContent = STR.vizCaptions.rotorStopped;
    } else {
      spin.style.removeProperty('animation');
      // Full precision: 60/rpm seconds per revolution, no rounding.
      spin.style.setProperty('--period', `${60 / r}s`);
      cap.textContent = reduced ? STR.vizCaptions.rotorReduced : STR.vizCaptions.rotor;
    }
  }

  update(value);
  return { root: fig, update };
}

/* ---------- Crossover ---------- */

const CROSSOVER_LABELS = ['0.7 kHz', '0.8 kHz', '1.0 kHz'];

export function crossoverViz(value: number): Viz {
  const splitX = [150, 180, 220];
  const divider = svgEl('line', { y1: '18', y2: '106', stroke: AMBER, 'stroke-width': '2' });
  const freqText = svgEl('text', { y: '14', fill: AMBER, 'font-size': '10', 'text-anchor': 'middle' });
  const svg = svgEl(
    'svg',
    { viewBox: '0 0 360 124', role: 'img' },
    // Low way (left) and horn way (right).
    svgEl('rect', { x: '20', y: '24', width: '320', height: '34', fill: 'none', stroke: GRID }),
    svgEl('text', { x: '28', y: '45', fill: INK_DIM, 'font-size': '10' }, STR.vizLabels.lowWay),
    svgEl('rect', { x: '20', y: '66', width: '320', height: '34', fill: 'none', stroke: GRID }),
    svgEl('text', { x: '28', y: '87', fill: INK_DIM, 'font-size': '10' }, STR.vizLabels.hornWay),
    svgEl('text', { x: '20', y: '118', fill: INK_DIM, 'font-size': '9' }, STR.vizLabels.lows),
    svgEl('text', { x: '318', y: '118', fill: INK_DIM, 'font-size': '9' }, STR.vizLabels.highs),
    divider,
    freqText,
  );

  function update(v: number): void {
    const x = splitX[v] ?? 180;
    divider.setAttribute('x1', String(x));
    divider.setAttribute('x2', String(x));
    freqText.setAttribute('x', String(x));
    freqText.textContent = CROSSOVER_LABELS[v] ?? '';
    svg.setAttribute('aria-label', `Crossover at ${CROSSOVER_LABELS[v] ?? ''} between low rotor and horn`);
  }

  update(value);
  const { fig } = figure(svg, STR.vizCaptions.crossover);
  return { root: fig, update };
}

/* ---------- Character (qualitative) ---------- */

export function characterViz(def: ParamDef, value: number): Viz {
  const curve = svgEl('path', { fill: 'none', stroke: AMBER, 'stroke-width': '2.5' });
  const label = svgEl('text', { x: '330', y: '30', fill: INK_DIM, 'font-size': '10', 'text-anchor': 'end' });
  const svg = svgEl(
    'svg',
    { viewBox: '0 0 360 110', role: 'img' },
    svgEl('line', { x1: '20', y1: '55', x2: '340', y2: '55', stroke: GRID, 'stroke-width': '1', 'stroke-dasharray': '2 3' }),
    svgEl('text', { x: '20', y: '100', fill: INK_DIM, 'font-size': '9' }, STR.vizLabels.lows),
    svgEl('text', { x: '318', y: '100', fill: INK_DIM, 'font-size': '9' }, STR.vizLabels.highs),
    curve,
    label,
  );

  function update(v: number): void {
    const opt = def.mapping.type === 'enum' ? def.mapping.options.find((o) => o.value === v) : undefined;
    label.textContent = opt ? opt.label : '';
    // Qualitative only: flat line, or a soft bump placed further right as the
    // nominal frequency rises. Not a measured response.
    if (v === 0 && def.id === 'hornCharacter') {
      curve.setAttribute('d', 'M20 55 L340 55');
    } else if (def.id === 'hornCharacter') {
      const cx = 140 + v * 55;
      curve.setAttribute('d', `M20 55 C ${cx - 70} 55, ${cx - 46} 28, ${cx} 28 S ${cx + 70} 55, 340 52`);
    } else {
      // Cabinet character: distinct qualitative silhouettes per option.
      const shapes = [
        'M20 60 C 100 48, 200 58, 340 50', // 122: gentle classic tilt
        'M20 52 C 120 62, 220 46, 340 44', // 21H: leaner low end
        'M20 62 C 160 60, 240 34, 340 30', // Bright: rising top
        'M20 55 L340 55', // Flat
      ];
      curve.setAttribute('d', shapes[v] ?? shapes[3]!);
    }
    svg.setAttribute('aria-label', `Qualitative schematic of the ${label.textContent} character`);
  }

  update(value);
  const { fig } = figure(svg, STR.vizCaptions.character);
  return { root: fig, update };
}

/* ---------- Dispatcher ---------- */

export function buildViz(def: ParamDef, value: number): Viz | null {
  const m = def.mapping;
  if (m.type === 'table' && m.unit === 's') {
    return curveViz(def, (v) => m.values[v] ?? 0, value);
  }
  if (m.type === 'table' && m.unit === 'rpm') {
    return rotorViz((v) => m.values[v], value);
  }
  if (def.id === 'crossover') return crossoverViz(value);
  if (def.id === 'hornCharacter' || def.id === 'cabinetCharacter') {
    return characterViz(def, value);
  }
  return null;
}
