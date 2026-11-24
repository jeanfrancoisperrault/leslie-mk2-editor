// Application state: raw values for both presets + system parameters,
// edit target, focused parameter, connection status. Tiny observable store,
// no framework (PLAN.md section 0).

import { PARAMS, PRESET_PARAMS, SYSTEM_PARAMS, clampValue, getParam } from '../params/schema';
import type { ParamDef } from '../params/schema';

export type PresetIndex = 0 | 1;

export type ConnectionKind =
  | { kind: 'unsupported' } // no Web MIDI (Safari…)
  | { kind: 'no-port' } // Web MIDI OK but no output available
  | { kind: 'denied' } // permission refused
  | { kind: 'simulator' }
  | { kind: 'port'; id: string; name: string };

/** Whether a message reaches a real MIDI output. */
export function canSend(connection: ConnectionKind): boolean {
  return connection.kind === 'port';
}

export interface AppState {
  /** Raw values: presetValues[presetIndex][paramId]. */
  presetValues: [Record<string, number>, Record<string, number>];
  systemValues: Record<string, number>;
  editedPreset: PresetIndex;
  /** Parameter shown in the explainer panel; null shows the neutral guide. */
  focusedParam: string | null;
  connection: ConnectionKind;
  /** Set once values were loaded from a Leslie dump (null = editor defaults).
      `source` tells whether the reference is a reading or our last write. */
  loadedFromDevice: { at: Date; unsaved: string[]; source: 'read' | 'written' } | null;
}

function defaultsForPreset(preset: PresetIndex): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of PRESET_PARAMS) {
    out[p.id] = (p.defaults as readonly [number, number])[preset];
  }
  return out;
}

function systemDefaults(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of SYSTEM_PARAMS) out[p.id] = p.defaults as number;
  return out;
}

/** Live states of the machine rather than settings: never counted as edits. */
const STATE_PARAMS = new Set(['presetNumber', 'leslieMode']);

export type Listener = (state: AppState) => void;

export class Store {
  #state: AppState = {
    presetValues: [defaultsForPreset(0), defaultsForPreset(1)],
    systemValues: systemDefaults(),
    editedPreset: 0,
    focusedParam: null,
    connection: { kind: 'unsupported' },
    loadedFromDevice: null,
  };
  /** Values at the last dump or write to memory, to show what was changed since. */
  #loaded: { presets: AppState['presetValues']; system: AppState['systemValues'] } | null = null;
  #listeners = new Set<Listener>();
  /** Called with (def, rawValue) whenever a value change must reach MIDI. */
  onSend: ((def: ParamDef, value: number) => void) | null = null;

  get state(): AppState {
    return this.#state;
  }

  /**
   * Settings stay locked until the machine's real values are known (a dump
   * was received): editing factory defaults would overwrite the Leslie's
   * live state with values it never had.
   */
  get locked(): boolean {
    return this.#state.loadedFromDevice === null;
  }

  subscribe(fn: Listener): () => void {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  #emit(): void {
    for (const fn of this.#listeners) fn(this.#state);
  }

  getValue(id: string): number {
    const def = getParam(id);
    return def.scope === 'system'
      ? this.#state.systemValues[id]!
      : this.#state.presetValues[this.#state.editedPreset][id]!;
  }

  /** Raw value last read from the Leslie, or written to it, for the edited preset;
      undefined before a dump. */
  loadedValue(id: string): number | undefined {
    return getParam(id).scope === 'system'
      ? this.#loaded?.system[id]
      : this.#loaded?.presets[this.#state.editedPreset][id];
  }

  /** Whether the value differs from the one the Leslie holds in memory. */
  isEdited(id: string): boolean {
    const loaded = this.loadedValue(id);
    return !STATE_PARAMS.has(id) && loaded !== undefined && loaded !== this.getValue(id);
  }

  /** Number of settings changed since the dump or write, both presets and system. */
  editCount(): number {
    const was = this.#loaded;
    if (!was) return 0;
    const diff = (a: Record<string, number>, b: Record<string, number>) =>
      Object.keys(a).filter((id) => !STATE_PARAMS.has(id) && a[id] !== b[id]).length;
    return diff(this.#state.presetValues[0], was.presets[0])
      + diff(this.#state.presetValues[1], was.presets[1])
      + diff(this.#state.systemValues, was.system);
  }

  /** Set a raw value (clamped) and send it over MIDI. */
  setValue(id: string, value: number, { send = true } = {}): void {
    if (send && this.locked) return;
    const def = getParam(id);
    const v = clampValue(def, value);
    if (this.getValue(id) === v) return;
    if (def.scope === 'system') {
      this.#state.systemValues[id] = v;
    } else {
      this.#state.presetValues[this.#state.editedPreset][id] = v;
    }
    if (send) this.onSend?.(def, v);
    this.#emit();
  }

  resetToDefault(id: string): void {
    const def = getParam(id);
    const value =
      def.scope === 'system'
        ? (def.defaults as number)
        : (def.defaults as readonly [number, number])[this.#state.editedPreset];
    this.setValue(id, value);
  }

  focusParam(id: string | null): void {
    if (this.#state.focusedParam === id) return;
    this.#state.focusedParam = id;
    this.#emit();
  }

  /** Switch the edited preset; also updates the Preset Number system value. */
  selectPreset(preset: PresetIndex): void {
    if (this.locked) return;
    if (this.#state.editedPreset === preset) return;
    this.#state.editedPreset = preset;
    this.#state.systemValues['presetNumber'] = preset;
    this.onSend?.(getParam('presetNumber'), preset);
    this.#emit();
  }

  /**
   * Replace the editor state with values read from the Leslie (dump).
   * Sends nothing: the machine already holds these values. The selected
   * preset gets its live values, the other preset its stored ones.
   */
  loadFromDevice(dev: {
    selectedPreset: PresetIndex;
    system: Record<string, number>;
    active: Record<string, number>;
    stored: [Record<string, number>, Record<string, number>];
    unsaved: string[];
  }): void {
    const other: PresetIndex = dev.selectedPreset === 0 ? 1 : 0;
    Object.assign(this.#state.systemValues, dev.system);
    Object.assign(this.#state.presetValues[dev.selectedPreset], dev.active);
    Object.assign(this.#state.presetValues[other], dev.stored[other]);
    this.#state.editedPreset = dev.selectedPreset;
    this.#takeReference('read', dev.unsaved);
  }

  /**
   * The editor's values were just written to the Leslie's memory: they become
   * the reference. A write leaves nothing unsaved (it also sets the active
   * preset). The Leslie does not acknowledge it; only a dump checks it.
   */
  markWritten(): void {
    if (this.locked) return;
    this.#takeReference('written', []);
  }

  #takeReference(source: 'read' | 'written', unsaved: string[]): void {
    this.#loaded = structuredClone({ presets: this.#state.presetValues, system: this.#state.systemValues });
    this.#state.loadedFromDevice = { at: new Date(), unsaved, source };
    this.#emit();
  }

  setConnection(connection: ConnectionKind): void {
    this.#state.connection = connection;
    this.#emit();
  }

}

export { PARAMS };
