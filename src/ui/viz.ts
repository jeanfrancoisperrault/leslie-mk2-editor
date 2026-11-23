// Explainer visualizations, all vector geometry (no pictures). Speeds and times
// are shown by the score; these cover the tone settings:
// - crossover: two-way split diagram
// - character: qualitative filter schematic (labelled as schematic)

import { STR } from '../content/i18n';
import type { ParamDef } from '../params/schema';
import { el, svgEl } from './dom';

const INK_DIM = 'var(--ink-soft)';
const GRID = 'var(--rule-strong)';
const VOICE = 'var(--voice)';

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

/* ---------- Crossover ---------- */

const CROSSOVER_LABELS = ['0.7 kHz', '0.8 kHz', '1.0 kHz'];

export function crossoverViz(value: number): Viz {
  const splitX = [150, 180, 220];
  const divider = svgEl('line', { y1: '18', y2: '106', stroke: VOICE, 'stroke-width': '2' });
  const freqText = svgEl('text', { y: '14', fill: VOICE, 'font-size': '13', 'text-anchor': 'middle' });
  const svg = svgEl(
    'svg',
    { viewBox: '0 0 360 124', role: 'img' },
    // Low way (left) and horn way (right).
    svgEl('rect', { x: '20', y: '24', width: '320', height: '34', fill: 'none', stroke: GRID }),
    svgEl('text', { x: '28', y: '45', fill: INK_DIM, 'font-size': '13' }, STR.vizLabels.lowWay),
    svgEl('rect', { x: '20', y: '66', width: '320', height: '34', fill: 'none', stroke: GRID }),
    svgEl('text', { x: '28', y: '87', fill: INK_DIM, 'font-size': '13' }, STR.vizLabels.hornWay),
    svgEl('text', { x: '20', y: '118', fill: INK_DIM, 'font-size': '12' }, STR.vizLabels.lows),
    svgEl('text', { x: '318', y: '118', fill: INK_DIM, 'font-size': '12' }, STR.vizLabels.highs),
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
  const curve = svgEl('path', { fill: 'none', stroke: VOICE, 'stroke-width': '2.5' });
  const label = svgEl('text', { x: '330', y: '30', fill: INK_DIM, 'font-size': '13', 'text-anchor': 'end' });
  const svg = svgEl(
    'svg',
    { viewBox: '0 0 360 110', role: 'img' },
    svgEl('line', { x1: '20', y1: '55', x2: '340', y2: '55', stroke: GRID, 'stroke-width': '1', 'stroke-dasharray': '2 3' }),
    svgEl('text', { x: '20', y: '100', fill: INK_DIM, 'font-size': '12' }, STR.vizLabels.lows),
    svgEl('text', { x: '318', y: '100', fill: INK_DIM, 'font-size': '12' }, STR.vizLabels.highs),
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
  if (def.id === 'crossover') return crossoverViz(value);
  if (def.id === 'hornCharacter' || def.id === 'cabinetCharacter') {
    return characterViz(def, value);
  }
  return null;
}
