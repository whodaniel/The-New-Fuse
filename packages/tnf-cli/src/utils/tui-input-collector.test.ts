import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { describe, it } from 'node:test';
import type readline from 'readline';
import { createTuiInputCollector } from './tui-input-collector.js';

type FakeRl = EventEmitter & readline.Interface & { line: string };

function makeFakeRl(): FakeRl {
  const rl = new EventEmitter() as FakeRl;
  rl.line = '';
  return rl;
}

describe('tui-input-collector', () => {
  it('coalesces idle lines into one waitForIdleCommit', async () => {
    const rl = makeFakeRl();
    const collector = createTuiInputCollector({ rl, debounceMs: 30 });
    const pending = collector.waitForIdleCommit('');
    queueMicrotask(() => {
      rl.emit('line', 'one');
      rl.emit('line', 'two');
      rl.emit('line', 'three');
    });
    const text = await pending;
    assert.equal(text, 'one\ntwo\nthree');
    collector.dispose();
  });

  it('queues busy paste and returns it via takeBusyQueue', async () => {
    const rl = makeFakeRl();
    const collector = createTuiInputCollector({ rl, debounceMs: 30 });
    collector.setMode('busy');
    rl.emit('line', 'busy-a');
    rl.emit('line', 'busy-b');
    const queued = collector.takeBusyQueue();
    assert.equal(queued, 'busy-a\nbusy-b');
    assert.equal(collector.takeBusyQueue(), null);
    collector.dispose();
  });

  it('preserves blank lines in busy queue', async () => {
    const rl = makeFakeRl();
    const collector = createTuiInputCollector({ rl, debounceMs: 30 });
    collector.setMode('busy');
    rl.emit('line', 'code');
    rl.emit('line', '');
    rl.emit('line', 'more');
    assert.equal(collector.takeBusyQueue(), 'code\n\nmore');
    collector.dispose();
  });

  it('does not resolve idle wait from busy-mode lines', async () => {
    const rl = makeFakeRl();
    const collector = createTuiInputCollector({ rl, debounceMs: 20 });
    const pending = collector.waitForIdleCommit('');
    collector.setMode('busy');
    rl.emit('line', 'during-turn');
    await new Promise((r) => setTimeout(r, 40));
    collector.setMode('idle');
    rl.emit('line', 'after');
    assert.equal(await pending, 'after');
    assert.equal(collector.takeBusyQueue(), 'during-turn');
    collector.dispose();
  });

  it('resolves empty Enter without hanging', async () => {
    const rl = makeFakeRl();
    const collector = createTuiInputCollector({ rl, debounceMs: 30 });
    const pending = collector.waitForIdleCommit('');
    queueMicrotask(() => rl.emit('line', ''));
    assert.equal(await pending, '');
    collector.dispose();
  });

  it('holds idle commit while readline buffer still has text', async () => {
    const rl = makeFakeRl();
    const collector = createTuiInputCollector({ rl, debounceMs: 20 });
    const pending = collector.waitForIdleCommit('');
    rl.line = 'still-typing';
    rl.emit('line', 'first');
    await new Promise((r) => setTimeout(r, 40));
    assert.equal(collector.hasIdlePending(), true);
    rl.line = '';
    // Re-arm by waiting for the next quiet window after hold clears.
    // Pushing nothing: the hold re-arms itself; wait for that timer.
    await new Promise((r) => setTimeout(r, 40));
    assert.equal(await pending, 'first');
    collector.dispose();
  });

  it('acknowledges busy-parked lines once (debounced) with the total count', async () => {
    const rl = makeFakeRl();
    const acks: number[] = [];
    const collector = createTuiInputCollector({
      rl,
      debounceMs: 30,
      busyAckDebounceMs: 40,
      onBusyQueued: (lines) => acks.push(lines),
    });
    collector.setMode('busy');
    rl.emit('line', 'one');
    rl.emit('line', 'two');
    rl.emit('line', 'three');
    await new Promise((r) => setTimeout(r, 90));
    // Multiline burst acknowledges ONCE with the total, not once per line.
    assert.deepEqual(acks, [3]);
    collector.dispose();
  });

  it('acks again for a second burst and resets count after takeBusyQueue', async () => {
    const rl = makeFakeRl();
    const acks: number[] = [];
    const collector = createTuiInputCollector({
      rl,
      debounceMs: 30,
      busyAckDebounceMs: 30,
      onBusyQueued: (lines) => acks.push(lines),
    });
    collector.setMode('busy');
    rl.emit('line', 'a');
    await new Promise((r) => setTimeout(r, 60));
    assert.equal(collector.takeBusyQueue(), 'a'); // drain resets the counter
    rl.emit('line', 'b');
    rl.emit('line', 'c');
    await new Promise((r) => setTimeout(r, 60));
    assert.deepEqual(acks, [1, 2]);
    assert.equal(collector.takeBusyQueue(), 'b\nc');
    collector.dispose();
  });

  it('does not acknowledge when no onBusyQueued callback is supplied', async () => {
    const rl = makeFakeRl();
    const collector = createTuiInputCollector({ rl, debounceMs: 30 });
    collector.setMode('busy');
    rl.emit('line', 'quiet');
    await new Promise((r) => setTimeout(r, 60));
    assert.equal(collector.takeBusyQueue(), 'quiet');
    collector.dispose();
  });

  it('drops pending ack when mode leaves busy before the debounce fires', async () => {
    const rl = makeFakeRl();
    const acks: number[] = [];
    const collector = createTuiInputCollector({
      rl,
      debounceMs: 30,
      busyAckDebounceMs: 30,
      onBusyQueued: (lines) => acks.push(lines),
    });
    collector.setMode('busy');
    rl.emit('line', 'almost');
    collector.setMode('idle'); // turn ended before the ack timer fired
    await new Promise((r) => setTimeout(r, 60));
    assert.deepEqual(acks, []);
    collector.dispose();
  });
});
