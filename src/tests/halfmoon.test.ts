import { describe, expect, it } from 'vitest';
import { LeverDrag, leverPath, nearestMode, positionOf } from '../ui/halfmoon-model';

describe('half-moon lever', () => {
  it('places slow left, brake center, fast right', () => {
    expect([positionOf('slow'), positionOf('brake'), positionOf('fast')]).toEqual([-1, 0, 1]);
  });

  it('snaps to the nearest of the three positions', () => {
    expect([-1.4, -0.6, -0.4, 0, 0.4, 0.6, 3].map(nearestMode))
      .toEqual(['slow', 'slow', 'brake', 'brake', 'brake', 'fast', 'fast']);
  });

  it('draws every position with the same path structure, so CSS can animate it', () => {
    const shape = (t: number) => leverPath(t).replace(/-?\d+(\.\d+)?/g, '#');
    expect(shape(-1)).toBe(shape(0));
    expect(shape(1)).toBe(shape(0));
  });

  it('matches the drawing: a 32 px circle at center, leaning outwards at the ends', () => {
    const xs = (t: number) => [...leverPath(t).matchAll(/[ML](-?[\d.]+) /g)].map((m) => Number(m[1]));
    expect(Math.min(...xs(0))).toBeCloseTo(51.5, 0);
    expect(Math.max(...xs(0))).toBeCloseTo(83.5, 0);
    expect(Math.min(...xs(-1))).toBeCloseTo(0, 0);
    expect(Math.max(...xs(-1))).toBeCloseTo(36.8, 0);
    expect(Math.max(...xs(1))).toBeCloseTo(135, 0);
  });
});

describe('half-moon drag: nothing is sent before the release', () => {
  it('crossing brake on the way from slow to fast yields fast only', () => {
    const d = new LeverDrag('slow', -1);
    d.move(-0.3);
    d.move(0);
    d.move(0.9);
    expect(d.release()).toBe('fast');
  });

  it('sends nothing when released where it started', () => {
    const d = new LeverDrag('slow', -1);
    d.move(0.8);
    d.move(-0.9);
    expect(d.release()).toBeNull();
  });

  it('a press on the track away from the lever chooses that position', () => {
    expect(new LeverDrag('slow', 0.95).release()).toBe('fast');
  });

  it('a plain press on the lever sends nothing', () => {
    expect(new LeverDrag('brake', 0.1).release()).toBeNull();
  });

  it('with an unknown mode, the ghosted lever rests at center: pressing it sends nothing', () => {
    expect(new LeverDrag(null, 0).release()).toBeNull();
    expect(new LeverDrag(null, 0.3).release()).toBeNull();
  });

  it('with an unknown mode, moving to an end sends that mode', () => {
    expect(new LeverDrag(null, -0.9).release()).toBe('slow');
    expect(new LeverDrag(null, 0.9).release()).toBe('fast');
  });

  it('keeps the lever within its track', () => {
    const d = new LeverDrag('brake', 0);
    d.move(5);
    expect(d.position).toBe(1);
  });
});
