// Entry point: wire the store, Web MIDI, the NRPN queue and the UI shell.

import '@fontsource/geist-mono/latin-200.css';
import '@fontsource/geist-mono/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-500.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';
import './ui/style.css';
import './ui/halfmoon.css';

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
import { buildDumpPacket, encodeDumpData } from './sysex/dump-build';
import { PARAMS, formatValue } from './params/schema';
import { STR } from './content/i18n';
import { Store } from './state/store';
import { buildExplainer } from './ui/explainer';
import { MidiOverlay } from './ui/overlay';
import { buildPanels } from './ui/panels';
import { buildShell } from './ui/shell';

/** Leslie Mode data values, in order. */
const MODES: SpeedCommand[] = ['slow', 'fast', 'brake'];

const store = new Store();
const shell = buildShell(store);
const panels = buildPanels(store, shell.status);
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

function shortHex(bytes: Uint8Array): string {
  return bytes.length <= 16 ? toHex(bytes) : `${toHex(bytes.slice(0, 12))} … (${bytes.length} bytes)`;
}

/** Show the rotor mode last sent or reported, and play it on the score; null
    when it is not known (another machine may be at the other end). */
function showMode(cmd: SpeedCommand | null): void {
  shell.setMode(cmd);
  panels.play(cmd);
}

/** Send one message; false when the port refused it. */
function sendOut(message: Uint8Array): boolean {
  if (hardwareSink) {
    try {
      hardwareSink.send(message);
      echo.noteSent(message, performance.now());
    } catch (err) {
      shell.logMessage({ dir: 'out', hex: shortHex(message), text: `ERROR: ${(err as Error).message}` });
      shell.setAlert('send', STR.sendFailed);
      return false;
    }
  }
  shell.setAlert('send', null);
  shell.logMessage({ dir: 'out', hex: shortHex(message), text: decodeMessage(message) });
  return true;
}

const teeSink: MidiSink = {
  send(message) {
    sendOut(message);
  },
};

const queue = new NrpnQueue(teeSink, { channel: 0 });

store.onSend = (def, value) => {
  queue.push(def.nrpn, value);
};

shell.onSpeed = (cmd) => {
  // Close any NRPN session first so the speed command is not mis-addressed.
  queue.flush();
  const ch = store.getValue('controlChannel');
  const sent = encodeSpeed(cmd, ch <= 15 ? ch : 0).map(sendOut);
  // Never show a mode the Leslie was not told.
  if (sent.every(Boolean)) showMode(cmd);
};

// --- Incoming: NRPN reports from the Leslie, dump capture ---------------------

const nrpnIn = new NrpnParser();
const dump = new DumpCollector();

// --- Save to memory: send a dump built from a real one + editor values ----

/** Data (128 bytes) of the last valid dump received from the machine. */
let lastDumpData: Uint8Array | null = null;

function saveBlockedReason(): string | null {
  if (!hardwareSink) return STR.saveMemory.needPort;
  if (!midi.sysex) return STR.saveMemory.needSysex;
  if (!lastDumpData) return STR.saveMemory.needDump;
  return null;
}

function refreshSave(): void {
  shell.setSaveBlocked(saveBlockedReason());
}

shell.onSaveMemory = () => {
  if (saveBlockedReason() !== null || !lastDumpData) return;
  if (!window.confirm(STR.saveMemory.confirm)) return;
  queue.flush();
  const s = store.state;
  const data = encodeDumpData(lastDumpData, {
    selectedPreset: s.editedPreset,
    system: s.systemValues,
    presets: [s.presetValues[0], s.presetValues[1]],
  });
  if (sendOut(buildDumpPacket(data))) shell.logMessage({ dir: 'out', hex: '  ⤷', text: STR.saveMemory.sent });
};


dump.onProgress = (packets) => shell.setDump(STR.dump.receiving(packets.length), null);
dump.onComplete = (packets) => {
  const bad = packets.filter((p) => p.checksum === null).length;
  const mode = packets.find((p) => p.checksum)?.checksum ?? '-';
  const snapshot = packets.slice();
  // Load the machine's values into the editor (sends nothing).
  const first = snapshot[0];
  const decoded = first?.checksum && first.data ? decodeDumpState(first.data) : null;
  if (decoded) {
    lastDumpData = first!.data;
    refreshSave();
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
  }, bad > 0);
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
      const mode = MODES[write.value];
      if (mode) showMode(mode);
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
  shell.setAlert('send', null);
  showMode(null);
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

shell.onPortChange = (id) => {
  selectPort(id);
  refreshSave();
};
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
      overlay.show('unsupported');
      break;
    case 'denied':
      store.setConnection({ kind: 'denied' });
      shell.setPorts([], 'sim');
      shell.setInputs([], null);
      overlay.show('denied');
      break;
    case 'ready': {
      if (!ev.sysex) shell.logMessage({ dir: 'in', hex: '--', text: STR.sysexDenied });
      shell.setAlert('sysex', ev.sysex ? null : STR.sysexShort);
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
        showMode(null);
        store.setConnection(ports.length === 0 ? { kind: 'no-port' } : { kind: 'simulator' });
      }
      break;
    }
  }
});

midi.on(() => refreshSave());

// Follow the control channel setting (16 = Off keeps the last valid channel;
// the explainer for that parameter says why nothing reaches the machine then).
store.subscribe(() => {
  const ch = store.getValue('controlChannel');
  if (ch >= 0 && ch <= 15 && queue.channel !== ch) queue.channel = ch;
});

// --- Mount -------------------------------------------------------------------

const app = document.querySelector('#app');
if (!app) throw new Error('#app mount point missing');

const main = document.createElement('main');
main.className = 'main';
main.append(panels.root, explainer.root);
app.append(shell.header, main, shell.console);

store.subscribe((state) => {
  shell.update(state);
  panels.update(state);
  explainer.update(state);
});

// Initial paint, then ask for MIDI access.
shell.setPorts([], 'sim');
shell.setInputs([], null);
refreshSave();
store.setConnection({ kind: 'simulator' });
void midi.init();
