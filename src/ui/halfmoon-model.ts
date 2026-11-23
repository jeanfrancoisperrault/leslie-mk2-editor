// Geometry and drag rule of the half-moon switch. Position t runs from -1
// (slow) through 0 (brake) to 1 (fast).

import type { SpeedCommand } from '../midi/speed';

const POSITION: Record<SpeedCommand, number> = { slow: -1, brake: 0, fast: 1 };

/** Lever drawing, in units of its 135 x 32 view box. */
export const LEVER_W = 135;
export const LEVER_H = 32;
/** Travel of the cap on each side of the center. */
export const TRAVEL = 54.2;
const MIDDLE = LEVER_W / 2;
const POINTS = 64;

const clamp = (t: number): number => Math.min(1, Math.max(-1, t));

export function positionOf(cmd: SpeedCommand): number {
  return POSITION[cmd];
}

export function nearestMode(t: number): SpeedCommand {
  return t < -0.5 ? 'slow' : t > 0.5 ? 'fast' : 'brake';
}

/** Cap seen from above: a circle at center, narrower when the lever leans. */
export function capAt(t: number): { cx: number; rx: number } {
  return { cx: MIDDLE + TRAVEL * t, rx: 12 - 1.95 * Math.abs(t) };
}

/**
 * Outline of the lever: the hull of its top (an ellipse) and its foot, which
 * stays behind as the lever leans. Sampled with a fixed number of points so
 * that any two positions interpolate in CSS.
 */
export function leverPath(t: number): string {
  const lean = Math.abs(t);
  const top = { cx: MIDDLE + TRAVEL * t, rx: 16 - 2.65 * lean, ry: 16 };
  const foot = { cx: top.cx - 12.7 * t, rx: 10.8, ry: 12 };
  const points: string[] = [];
  for (let i = 0; i < POINTS; i++) {
    const a = (i / POINTS) * 2 * Math.PI;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    // Support point: the farthest point of either ellipse in this direction.
    const [best] = [top, foot].map((e) => {
      const n = Math.hypot(e.rx * dx, e.ry * dy);
      const x = e.cx + (e.rx * e.rx * dx) / n;
      const y = LEVER_H / 2 + (e.ry * e.ry * dy) / n;
      return { x, y, reach: x * dx + y * dy };
    }).sort((p, q) => q.reach - p.reach);
    points.push(`${i === 0 ? 'M' : 'L'}${best!.x.toFixed(2)} ${best!.y.toFixed(2)}`);
  }
  return points.join(' ') + ' Z';
}

/**
 * One press-drag-release on the lever. Only release() yields a command: going
 * from slow to fast crosses brake, which must never reach the Leslie.
 */
export class LeverDrag {
  position: number;
  readonly #from: SpeedCommand | null;

  constructor(from: SpeedCommand | null, t: number) {
    this.#from = from;
    this.position = clamp(t);
  }

  move(t: number): void {
    this.position = clamp(t);
  }

  /** Command to send, or null when the lever is back where it was. */
  release(): SpeedCommand | null {
    const cmd = nearestMode(this.position);
    // Unknown mode: the ghosted lever rests at center, so center is no choice.
    // Brake stays available on its own key.
    return cmd === (this.#from ?? 'brake') ? null : cmd;
  }
}
