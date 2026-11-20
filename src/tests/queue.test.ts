import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MockMidiOut } from '../midi/mock';
import { NrpnQueue } from '../midi/queue';

function decoded(sink: MockMidiOut): string[] {
  return sink.log.map((m) => m.decoded);
}

describe('NrpnQueue', () => {
  let sink: MockMidiOut;
  let queue: NrpnQueue;

  beforeEach(() => {
    vi.useFakeTimers();
    sink = new MockMidiOut(() => Date.now());
    queue = new NrpnQueue(sink, { channel: 0, sendIntervalMs: 30, idleNullMs: 300 });
  });

  afterEach(() => {
    queue.dispose();
    vi.useRealTimers();
  });

  it('sends the first value immediately with full addressing', () => {
    queue.push(0x04, 8);
    expect(decoded(sink)).toEqual([
      'ch1 CC99 (NRPN MSB) = 4',
      'ch1 CC98 (NRPN LSB) = 127',
      'ch1 CC6 (DataEntryMSB) = 8',
    ]);
  });

  it('coalesces a drag: only the latest value goes out per interval', () => {
    queue.push(0x04, 1); // sent immediately
    queue.push(0x04, 2);
    queue.push(0x04, 3);
    queue.push(0x04, 4); // only this one should survive the throttle window
    vi.advanceTimersByTime(30);
    const dataEntries = sink.log.filter((m) => m.bytes[1] === 6).map((m) => m.bytes[2]);
    expect(dataEntries).toEqual([1, 4]);
  });

  it('does not re-address while the same parameter stays addressed', () => {
    queue.push(0x04, 1);
    vi.advanceTimersByTime(30);
    queue.push(0x04, 2);
    vi.advanceTimersByTime(30);
    const addresses = sink.log.filter((m) => m.bytes[1] === 99);
    expect(addresses).toHaveLength(1);
  });

  it('re-addresses when the parameter changes', () => {
    queue.push(0x04, 1);
    vi.advanceTimersByTime(30);
    queue.push(0x06, 2);
    vi.advanceTimersByTime(30);
    const addresses = sink.log.filter((m) => m.bytes[1] === 99).map((m) => m.bytes[2]);
    expect(addresses).toEqual([0x04, 0x06]);
  });

  it('closes the NRPN session with RPN null after idle', () => {
    queue.push(0x04, 8);
    vi.advanceTimersByTime(330);
    const tail = decoded(sink).slice(-2);
    expect(tail).toEqual(['ch1 CC101 (RPN MSB) = 127', 'ch1 CC100 (RPN LSB) = 127']);
  });

  it('sends RPN null only once per session', () => {
    queue.push(0x04, 8);
    vi.advanceTimersByTime(1000);
    const nulls = sink.log.filter((m) => m.bytes[1] === 101);
    expect(nulls).toHaveLength(1);
  });

  it('re-addresses after the session was closed', () => {
    queue.push(0x04, 8);
    vi.advanceTimersByTime(1000); // RPN null sent
    queue.push(0x04, 9);
    const addresses = sink.log.filter((m) => m.bytes[1] === 99);
    expect(addresses).toHaveLength(2);
  });

  it('changing channel closes the old session and uses the new channel', () => {
    queue.push(0x04, 8);
    queue.channel = 3; // channel 4
    queue.push(0x04, 9);
    const nullOnOld = sink.log.find((m) => m.bytes[1] === 101);
    expect(nullOnOld && nullOnOld.bytes[0]).toBe(0xb0);
    const last = sink.log[sink.log.length - 1]!;
    expect(last.bytes[0]).toBe(0xb3);
  });
});
