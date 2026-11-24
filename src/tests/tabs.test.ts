import { describe, expect, it } from 'vitest';
import { tabAfterKey } from '../ui/tabs';

describe('tab keys', () => {
  it('moves with the arrows and wraps around', () => {
    expect(tabAfterKey('ArrowRight', 0, 2)).toBe(1);
    expect(tabAfterKey('ArrowRight', 1, 2)).toBe(0);
    expect(tabAfterKey('ArrowLeft', 0, 3)).toBe(2);
  });

  it('leaves every other key alone', () => {
    for (const key of ['ArrowUp', 'ArrowDown', 'Enter', 'Tab']) expect(tabAfterKey(key, 0, 2)).toBeNull();
  });
});
