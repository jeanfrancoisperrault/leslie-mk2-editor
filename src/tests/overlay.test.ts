import { describe, expect, it } from 'vitest';
import { dialogFor } from '../ui/overlay-model';

const port = (name: string) => ({ id: name, name });

describe('startup dialog', () => {
  it('opens when the browser cannot reach any MIDI port', () => {
    expect(dialogFor({ kind: 'unsupported' })).toBe('unsupported');
    expect(dialogFor({ kind: 'denied' })).toBe('denied');
    expect(dialogFor({ kind: 'ready', sysex: true, outputs: [], inputs: [] })).toBe('no-port');
  });

  it('stays closed as soon as there is a port, whatever its name', () => {
    for (const name of ['USB MIDI Interface', 'MidiSport 2x2 Port A', 'IAC Driver Bus 1']) {
      expect(dialogFor({ kind: 'ready', sysex: true, outputs: [port(name)], inputs: [] })).toBeNull();
    }
  });

  it('does not open when ports come and go later', () => {
    expect(dialogFor({ kind: 'ports-changed', outputs: [], inputs: [] })).toBeNull();
  });
});
