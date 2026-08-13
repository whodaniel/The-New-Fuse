import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { describe, it } from 'node:test';
import type readline from 'readline';
import { createTuiInputCollector } from './tui-input-collector.js';

type FakeRl = EventEmitter & readline.Interface;

function makeFakeRl(): FakeRl {
  return new EventEmitter() as FakeRl;
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
});
