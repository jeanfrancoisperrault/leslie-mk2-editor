// Entry point: wire the store, Web MIDI, the NRPN queue and the UI shell.

import './ui/style.css';

import { decodeMessage } from './midi/mock';
import { NrpnQueue } from './midi/queue';
import type { MidiSink } from './midi/types';
import { WebMidi } from './midi/webmidi';
import type { PortInfo } from './midi/webmidi';
import { EchoFilter } from './midi/echo';
import { encodeSpeed } from './midi/speed';
import type { SpeedCommand } from './midi/speed';
import { NrpnParser } from './midi/nrpn-parser';
import { DumpCollector, toSyx } from './sysex/dump';
import { decodeDumpState } from './sysex/dump-state';
import { PARAMS, formatValue } from './params/schema';
import { STR } from './content/i18n';
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
// Every outgoing message goes through a tee: logged to the console, noted for
// echo detection, and forwarded to the selected hardware port (if any).
// Nothing is ever sent automatically: only explicit user actions write.

const midi = new WebMidi();
const overlay = new MidiOverlay();
const echo = new EchoFilter();
let hardwareSink: MidiSink | null = null;
let selectedPortId: string | 'sim' = 'sim';
let selectedInputId: string | null = null;

// Preferred ports: the MidiSport 2x2 port A (brief), then anything that looks
// like a Leslie.
const PREFERRED = [/midisport.*port\s*a\b/i, /leslie|2101|2103/i];
const isLesliePort = (name: string): boolean => PREFERRED.some((re) => re.test(name));
function pickPort(ports: PortInfo[]): PortInfo | undefined {
  for (const re of PREFERRED) {
    const hit = ports.find((p) => re.test(p.name));
    if (hit) return hit;
  }
  return ports[0];
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
}

const teeSink: MidiSink = {
  send(message) {
    if (hardwareSink) {
      try {
        hardwareSink.send(message);
        echo.noteSent(message, performance.now());
      } catch (err) {
        shell.logMessage({ dir: 'out', hex: toHex(message), text: `ERROR: ${(err as Error).message}` });
        return;
      }
    }
    shell.logMessage({ dir: 'out', hex: toHex(message), text: decodeMessage(message) });
  },
};

const queue = new NrpnQueue(teeSink, { channel: 0 });

store.onSend = (def, value) => {
  queue.push(def.nrpn, value);
};

shell.onSpeed = (cmd, method) => {
  // Close any NRPN session first so the speed command is not mis-addressed.
  queue.flush();
  const ch = store.getValue('controlChannel');
  for (const msg of encodeSpeed(method, cmd, ch <= 15 ? ch : 0)) teeSink.send(msg);
};

// --- Incoming: NRPN reports from the Leslie, dump capture ---------------------

const nrpnIn = new NrpnParser();
const dump = new DumpCollector();
const MODES: SpeedCommand[] = ['slow', 'fast', 'brake'];

function shortHex(bytes: Uint8Array): string {
  return bytes.length <= 16 ? toHex(bytes) : `${toHex(bytes.slice(0, 12))} … (${bytes.length} bytes)`;
}

dump.onProgress = (packets) => shell.setDump(STR.dump.receiving(packets.length), null);
dump.onComplete = (packets) => {
  const bad = packets.filter((p) => p.checksum === null).length;
  const mode = packets.find((p) => p.checksum)?.checksum ?? '-';
  const snapshot = packets.slice();
  // Load the machine's values into the editor (sends nothing).
  const first = snapshot[0];
  const decoded = first?.checksum && first.data ? decodeDumpState(first.data) : null;
  if (decoded) {
    store.loadFromDevice(decoded);
    const names = decoded.unsaved.map((id) => PARAMS.find((d) => d.id === id)?.manualName ?? id);
    shell.logMessage({ dir: 'in', hex: '  ⤷', text: `Editor loaded from dump · preset ${decoded.selectedPreset + 1}` +
      (names.length ? ` · not saved with MEMORY: ${names.join(', ')}` : '') +
      (decoded.rejected.length ? ` · ignored out-of-range: ${decoded.rejected.map((r) => r.id).join(', ')}` : '') });
  }
  shell.setDump(STR.dump.done(snapshot.length, bad, mode), () => {
    const blob = new Blob([toSyx(snapshot)], { type: 'application/octet-stream' });
    const stamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leslie-dump-${stamp}.syx`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
};

function onIncoming(bytes: Uint8Array): void {
  const status = bytes[0];
  // Skip realtime noise (clock, active sensing).
  if (status === 0xf8 || status === 0xfe) return;
  const isEcho = echo.isEcho(bytes, performance.now());
  // Our own echoes still go through the parser so its NRPN address tracking
  // stays in sync with what is on the wire, but they are not reports.
  const write = nrpnIn.feed(bytes);
  if (!isEcho && dump.feed(bytes)) {
    const p = dump.packets[dump.packets.length - 1]!;
    shell.logMessage({ dir: 'in', hex: shortHex(bytes),
      text: `Dump packet #${p.number} · checksum ${p.checksum ?? 'ERROR'}` });
    return;
  }
  shell.logMessage({ dir: isEcho ? 'echo' : 'in', hex: shortHex(bytes), text: decodeMessage(bytes) });
  if (write && !isEcho) {
    const def = PARAMS.find((d) => d.nrpn === write.param);
    const label = def ? `${def.manualName} = ${formatValue(def, write.value)}` : `NRPN 0x${write.param.toString(16)} = ${write.value}`;
    shell.logMessage({ dir: 'in', hex: '  ⤷', text: `Leslie → ${label}` });
    if (def?.id === 'leslieMode') {
      store.setValue('leslieMode', write.value, { send: false });
      shell.setReportedMode(MODES[write.value] ?? null);
    }
  }
}

// Dev-only hook to inject incoming bytes from the console (no hardware needed).
if (import.meta.env.DEV) {
  (window as unknown as { __midiIn: (b: number[]) => void }).__midiIn = (b) => onIncoming(Uint8Array.from(b));
}

function selectInput(id: string | null): void {
  selectedInputId = midi.listen(id, onIncoming) ? id : null;
}

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
    store.setConnection(midi.ports().outputs.length === 0 ? { kind: 'no-port' } : { kind: 'simulator' });
    return;
  }
  hardwareSink = sink;
  const name = midi.ports().outputs.find((p) => p.id === id)?.name ?? 'MIDI port';
  store.setConnection({ kind: 'port', id, name });
}

shell.onPortChange = selectPort;
shell.onInputChange = selectInput;

function syncInputs(inputs: PortInfo[]): void {
  const stillThere = selectedInputId !== null && inputs.some((p) => p.id === selectedInputId);
  if (!stillThere) selectInput(pickPort(inputs)?.id ?? null);
  shell.setInputs(inputs, selectedInputId);
}

midi.on((ev) => {
  switch (ev.kind) {
    case 'unsupported':
      store.setConnection({ kind: 'unsupported' });
      shell.setPorts([], 'sim');
      shell.setInputs([], null);
      shell.setSysexAvailable(false);
      overlay.show('unsupported');
      break;
    case 'denied':
      store.setConnection({ kind: 'denied' });
      shell.setPorts([], 'sim');
      shell.setInputs([], null);
      shell.setSysexAvailable(false);
      overlay.show('denied');
      break;
    case 'ready': {
      shell.setSysexAvailable(ev.sysex);
      if (!ev.sysex) shell.logMessage({ dir: 'in', hex: '--', text: STR.sysexDenied });
      const pick = pickPort(ev.outputs);
      shell.setPorts(ev.outputs, pick ? pick.id : 'sim');
      if (pick) selectPort(pick.id);
      else store.setConnection({ kind: 'no-port' });
      syncInputs(ev.inputs);
      if (ev.outputs.length === 0) overlay.show('no-port');
      else if (!ev.outputs.some((p) => isLesliePort(p.name))) overlay.show('no-leslie');
      break;
    }
    case 'ports-changed': {
      const ports = ev.outputs;
      syncInputs(ev.inputs);
      if (overlay.isOpen && ports.length > 0) {
        const pick = pickPort(ports)!;
        shell.setPorts(ports, pick.id);
        selectPort(pick.id);
        overlay.close();
        break;
      }
      if (overlay.isOpen && ports.length === 0) overlay.setKind('no-port');
      const stillThere = selectedPortId !== 'sim' && ports.some((p) => p.id === selectedPortId);
      shell.setPorts(ports, stillThere ? selectedPortId : 'sim');
      if (!stillThere && selectedPortId !== 'sim') {
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
app.append(shell.header, shell.transport, shell.honesty, shell.stateBanner, main, shell.console);

store.subscribe((state) => {
  shell.update(state);
  panels.update(state);
  explainer.update(state);
});

// Initial paint, then ask for MIDI access.
shell.setPorts([], 'sim');
shell.setInputs([], null);
store.setConnection({ kind: 'simulator' });
void midi.init();
