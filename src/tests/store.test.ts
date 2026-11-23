import { beforeEach, describe, expect, it } from 'vitest';
import { Store } from '../state/store';

function load(store: Store): void {
  store.loadFromDevice({
    selectedPreset: 0,
    system: { controlChannel: 0, presetNumber: 0, leslieMode: 0 },
    active: { hornRiseTime: 4 },
    stored: [{ hornRiseTime: 8 }, { hornRiseTime: 14 }],
    unsaved: [],
  });
}

describe('edits compared with the values read from the Leslie', () => {
  let store: Store;
  beforeEach(() => { store = new Store(); });

  it('has no loaded value before a dump', () => {
    expect(store.loadedValue('hornRiseTime')).toBeUndefined();
    expect(store.isEdited('hornRiseTime')).toBe(false);
  });

  it('marks a changed value and clears it when set back', () => {
    load(store);
    store.setValue('hornRiseTime', 6);
    expect(store.isEdited('hornRiseTime')).toBe(true);
    expect(store.loadedValue('hornRiseTime')).toBe(4);
    expect(store.editCount()).toBe(1);
    store.setValue('hornRiseTime', 4);
    expect(store.isEdited('hornRiseTime')).toBe(false);
    expect(store.editCount()).toBe(0);
  });

  it('keeps edits per preset', () => {
    load(store);
    store.setValue('hornRiseTime', 6);
    store.selectPreset(1);
    expect(store.isEdited('hornRiseTime')).toBe(false);
    expect(store.editCount()).toBe(1); // preset switch is not an edit
  });

  it('counts the edits of both presets and of the system', () => {
    load(store);
    store.setValue('hornRiseTime', 6);
    store.setValue('controlChannel', 3);
    store.selectPreset(1);
    store.setValue('hornRiseTime', 2);
    store.setValue('hornFallTime', 3);
    expect(store.editCount()).toBe(4);
  });

  it('does not count the rotor mode, a live state, as an edit', () => {
    load(store);
    store.setValue('leslieMode', 1, { send: false });
    expect(store.editCount()).toBe(0);
  });

  it('a write to memory becomes the new reference, for both presets and the system', () => {
    load(store);
    store.setValue('hornRiseTime', 6);
    store.setValue('controlChannel', 3);
    store.selectPreset(1);
    store.setValue('hornRiseTime', 2);
    store.markWritten();
    expect(store.editCount()).toBe(0);
    expect(store.loadedValue('hornRiseTime')).toBe(2);
    expect(store.state.loadedFromDevice).toMatchObject({ source: 'written', unsaved: [] });
    store.setValue('hornRiseTime', 3);
    expect(store.isEdited('hornRiseTime')).toBe(true);
    expect(store.loadedValue('hornRiseTime')).toBe(2);
  });

  it('a dump after a write is a reading again', () => {
    load(store);
    store.markWritten();
    load(store);
    expect(store.state.loadedFromDevice?.source).toBe('read');
  });

  it('a write cannot unlock the editor: without a dump it changes nothing', () => {
    store.markWritten();
    expect(store.locked).toBe(true);
  });

  it('a new dump resets the comparison', () => {
    load(store);
    store.setValue('hornRiseTime', 6);
    load(store);
    expect(store.editCount()).toBe(0);
  });
});
