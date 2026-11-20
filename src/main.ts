// Entry point: wire the store, Web MIDI, the NRPN queue and the UI shell.

import './ui/style.css';

import { decodeMessage } from './midi/mock';
import { NrpnQueue } from './midi/queue';
import type { MidiSink } from './midi/types';
import { WebMidi } from './midi/webmidi';
import { Store } from './state/store';
import { buildExplainer } from './ui/explainer';
import { MidiOverlay } from './ui/overlay';
import { buildPanels } from './ui/panels';
import { buildShell } from './ui/shell';

const store = new Store();
const shell = buildShell(store);
const panels = buildPanels(store);
const explainer = buildExplainer(store);

// --- MIDI plumbing -----------------------------------------------------------
// The queue writes into a tee: every message is logged to the console panel,
// and forwarded to the selected hardware port when one is selected.

const midi = new WebMidi();
const overlay = new MidiOverlay();
let hardwareSink: MidiSink | null = null;
let selectedPortId: string | 'sim' = 'sim';

const isLesliePort = (name: string): boolean => /leslie|2101|2103/i.test(name);

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
}

const teeSink: MidiSink = {
  send(message) {
    shell.logMessage({ hex: toHex(message), text: decodeMessage(message) });
    hardwareSink?.send(message);
  },
};

const queue = new NrpnQueue(teeSink, { channel: 0 });

store.onSend = (def, value) => {
  queue.push(def.nrpn, value);
};

function selectPort(id: string | 'sim'): void {
  selectedPortId = id;
  queue.flush();
  if (id === 'sim') {
    hardwareSink = null;
    store.setConnection({ kind: 'simulator' });
    return;
  }
  const sink = midi.sinkFor(id);
  if (!sink) {
    hardwareSink = null;
    selectedPortId = 'sim';
    store.setConnection(midi.ports().length === 0 ? { kind: 'no-port' } : { kind: 'simulator' });
    return;
  }
  hardwareSink = sink;
  const name = midi.ports().find((p) => p.id === id)?.name ?? 'MIDI port';
  store.setConnection({ kind: 'port', id, name });
}

shell.onPortChange = selectPort;

midi.on((ev) => {
  switch (ev.kind) {
    case 'unsupported':
      store.setConnection({ kind: 'unsupported' });
      shell.setPorts([], 'sim');
      overlay.show('unsupported');
      break;
    case 'denied':
      store.setConnection({ kind: 'denied' });
      shell.setPorts([], 'sim');
      overlay.show('denied');
      break;
    case 'ready': {
      // Auto-select the first port that looks like a Leslie, else the first
      // port, else stay on the simulator.
      const leslie = ev.ports.find((p) => isLesliePort(p.name)) ?? ev.ports[0];
      shell.setPorts(ev.ports, leslie ? leslie.id : 'sim');
      if (leslie) selectPort(leslie.id);
      else store.setConnection({ kind: 'no-port' });
      // Startup overlay when nothing that looks like a Leslie is reachable.
      if (ev.ports.length === 0) overlay.show('no-port');
      else if (!ev.ports.some((p) => isLesliePort(p.name))) overlay.show('no-leslie');
      break;
    }
    case 'ports-changed': {
      const ports = ev.ports;
      // Hot-plug while the startup overlay is open: grab the new port and
      // close the overlay (a Leslie-named port wins over any other).
      if (overlay.isOpen && ports.length > 0) {
        const leslie = ports.find((p) => isLesliePort(p.name));
        const pick = leslie ?? ports[0]!;
        shell.setPorts(ports, pick.id);
        selectPort(pick.id);
        if (leslie || ports.length > 0) overlay.close();
        break;
      }
      if (overlay.isOpen && ports.length === 0) overlay.setKind('no-port');
      const stillThere = selectedPortId !== 'sim' && ports.some((p) => p.id === selectedPortId);
      shell.setPorts(ports, stillThere ? selectedPortId : 'sim');
      if (!stillThere && selectedPortId !== 'sim') {
        // Selected port vanished: fall back to the simulator.
        hardwareSink = null;
        selectedPortId = 'sim';
        store.setConnection(ports.length === 0 ? { kind: 'no-port' } : { kind: 'simulator' });
      }
      break;
    }
  }
});

// Follow the control channel setting (16 = Off keeps the last valid channel;
// the explainer for that parameter says why nothing reaches the machine then).
store.subscribe(() => {
  const ch = store.getValue('controlChannel');
  if (ch >= 0 && ch <= 15 && queue.channel !== ch) queue.channel = ch;
});

// --- Mount -------------------------------------------------------------------

const app = document.querySelector('#app');
if (!app) throw new Error('#app mount point missing');

const main = document.createElement('div');
main.className = 'main';
main.append(panels.root, explainer.root);
app.append(shell.header, shell.honesty, shell.stateBanner, main, shell.console);

store.subscribe((state) => {
  shell.update(state);
  panels.update(state);
  explainer.update(state);
});

// Initial paint, then ask for MIDI access.
shell.setPorts([], 'sim');
store.setConnection({ kind: 'simulator' });
void midi.init();
