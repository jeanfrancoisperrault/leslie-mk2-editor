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

export interface AppState {
  /** Raw values: presetValues[presetIndex][paramId]. */
  presetValues: [Record<string, number>, Record<string, number>];
  systemValues: Record<string, number>;
  editedPreset: PresetIndex;
  /** Parameter shown in the explainer panel; null shows the neutral guide. */
  focusedParam: string | null;
  connection: ConnectionKind;
  /** Parameter ids changed since app start (shown with the "changed" dot). */
  dirty: Set<string>;
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

export type Listener = (state: AppState) => void;

export class Store {
  #state: AppState = {
    presetValues: [defaultsForPreset(0), defaultsForPreset(1)],
    systemValues: systemDefaults(),
    editedPreset: 0,
    focusedParam: null,
    connection: { kind: 'unsupported' },
    dirty: new Set(),
  };
  #listeners = new Set<Listener>();
  /** Called with (def, rawValue) whenever a value change must reach MIDI. */
  onSend: ((def: ParamDef, value: number) => void) | null = null;

  get state(): AppState {
    return this.#state;
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

  /** Set a raw value (clamped), mark dirty, and send it over MIDI. */
  setValue(id: string, value: number, { send = true } = {}): void {
    const def = getParam(id);
    const v = clampValue(def, value);
    if (this.getValue(id) === v) return;
    if (def.scope === 'system') {
      this.#state.systemValues[id] = v;
    } else {
      this.#state.presetValues[this.#state.editedPreset][id] = v;
    }
    this.#state.dirty.add(id);
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
    if (this.#state.editedPreset === preset) return;
    this.#state.editedPreset = preset;
    this.#state.systemValues['presetNumber'] = preset;
    this.onSend?.(getParam('presetNumber'), preset);
    this.#emit();
  }

  setConnection(connection: ConnectionKind): void {
    this.#state.connection = connection;
    this.#emit();
  }

  /** Push the whole editor state to the device ("Envoyer tout"). */
  sendAll(): void {
    if (!this.onSend) return;
    // Address the machine's edit target first so preset values land in the
    // right preset (behavior to confirm in Phase 0; harmless either way).
    this.onSend(getParam('presetNumber'), this.#state.editedPreset);
    for (const p of SYSTEM_PARAMS) {
      if (p.id === 'presetNumber') continue;
      this.onSend(p, this.#state.systemValues[p.id]!);
    }
    for (const p of PRESET_PARAMS) {
      this.onSend(p, this.#state.presetValues[this.#state.editedPreset][p.id]!);
    }
    this.#emit();
  }
}

export { PARAMS };
