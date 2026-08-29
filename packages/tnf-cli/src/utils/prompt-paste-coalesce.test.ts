import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createPromptPasteCoalescer,
  PROMPT_PASTE_DEBOUNCE_MS,
  PROMPT_PASTE_FIRST_FRAGMENT_MS,
} from './prompt-paste-coalesce.js';

describe('prompt-paste-coalesce', () => {
  it('exports sensible default debounce constants', () => {
    assert.equal(PROMPT_PASTE_DEBOUNCE_MS, 180);
    assert.equal(PROMPT_PASTE_FIRST_FRAGMENT_MS, 0);
  });

  it('coalesces 12 rapid fragments into one commit', async () => {
    const coalescer = createPromptPasteCoalescer({ debounceMs: 40 });
    const pending = coalescer.waitForCommit();
    for (let i = 1; i <= 12; i++) {
      coalescer.pushFragment(`line ${i}`);
    }
    const committed = await pending;
    assert.equal(committed.split('\n').length, 12);
    assert.match(committed, /^line 1\n/);
    assert.match(committed, /\nline 12$/);
    coalescer.dispose();
  });

  it('sanitizes lone UTF-16 surrogates', async () => {
    const coalescer = createPromptPasteCoalescer({ debounceMs: 20 });
    const pending = coalescer.waitForCommit();
    coalescer.pushFragment('ok\uD800bad');
    const committed = await pending;
    assert.equal(committed, 'ok\uFFFDbad');
    coalescer.dispose();
  });

  it('preserves blank lines inside a multiline paste', async () => {
    const coalescer = createPromptPasteCoalescer({ debounceMs: 20 });
    const pending = coalescer.waitForCommit();
    coalescer.pushFragment('a');
    coalescer.pushFragment('');
    coalescer.pushFragment('b');
    const committed = await pending;
    assert.equal(committed, 'a\n\nb');
    coalescer.dispose();
  });

  it('resolves lone empty Enter to empty string', async () => {
    const coalescer = createPromptPasteCoalescer({ debounceMs: 20 });
    const pending = coalescer.waitForCommit();
    coalescer.pushFragment('');
    assert.equal(await pending, '');
    coalescer.dispose();
  });

  it('treats whitespace-only Enter like empty when nothing is pending', async () => {
    const coalescer = createPromptPasteCoalescer({ debounceMs: 20 });
    const pending = coalescer.waitForCommit();
    coalescer.pushFragment('   ');
    assert.equal(await pending, '');
    coalescer.dispose();
  });

  it('preserves whitespace-only lines once a paste has started', async () => {
    const coalescer = createPromptPasteCoalescer({ debounceMs: 20 });
    const pending = coalescer.waitForCommit();
    coalescer.pushFragment('keep');
    coalescer.pushFragment('   ');
    coalescer.pushFragment('going');
    assert.equal(await pending, 'keep\n   \ngoing');
    coalescer.dispose();
  });

  it('second wave after quiet yields a second commit', async () => {
    const coalescer = createPromptPasteCoalescer({ debounceMs: 30 });
    const firstP = coalescer.waitForCommit();
    coalescer.pushFragment('a');
    coalescer.pushFragment('b');
    assert.equal(await firstP, 'a\nb');

    const secondP = coalescer.waitForCommit();
    coalescer.pushFragment('c');
    coalescer.pushFragment('d');
    assert.equal(await secondP, 'c\nd');
    coalescer.dispose();
  });

  it('flushNow joins without waiting', () => {
    const coalescer = createPromptPasteCoalescer({ debounceMs: 60_000 });
    coalescer.pushFragment('x');
    coalescer.pushFragment('y');
    assert.equal(coalescer.flushNow(), 'x\ny');
    assert.equal(coalescer.flushNow(), null);
    coalescer.dispose();
  });

  it('holds commit while shouldHold is true, then commits', async () => {
    let hold = true;
    const coalescer = createPromptPasteCoalescer({
      debounceMs: 15,
      firstFragmentMs: 15,
      shouldHold: () => hold,
    });
    const pending = coalescer.waitForCommit();
    coalescer.pushFragment('partial');
    await new Promise((r) => setTimeout(r, 40));
    assert.equal(coalescer.hasPending(), true);
    hold = false;
    assert.equal(await pending, 'partial');
    coalescer.dispose();
  });

  it('commits a single fragment without waiting the paste debounce', async () => {
    let now = 0;
    const timers: Array<{ id: number; at: number; fn: () => void }> = [];
    let nextId = 1;
    const coalescer = createPromptPasteCoalescer({
      debounceMs: 500,
      firstFragmentMs: 0,
      setTimer: (fn, ms) => {
        const id = nextId++;
        timers.push({ id, at: now + ms, fn });
        return id as unknown as ReturnType<typeof setTimeout>;
      },
      clearTimer: (id) => {
        const idx = timers.findIndex((t) => t.id === (id as unknown as number));
        if (idx >= 0) timers.splice(idx, 1);
      },
    });
    const pending = coalescer.waitForCommit();
    coalescer.pushFragment('solo');
    assert.equal(timers.length, 1);
    assert.equal(timers[0].at, 0);
    // Fire the immediate timer.
    const due = timers.splice(0, 1);
    due[0].fn();
    assert.equal(await pending, 'solo');
    coalescer.dispose();
  });

  it('upgrades to paste debounce once a second fragment arrives', async () => {
    let now = 0;
    const timers: Array<{ id: number; at: number; fn: () => void }> = [];
    let nextId = 1;
    const coalescer = createPromptPasteCoalescer({
      debounceMs: 100,
      firstFragmentMs: 0,
      setTimer: (fn, ms) => {
        const id = nextId++;
        timers.push({ id, at: now + ms, fn });
        return id as unknown as ReturnType<typeof setTimeout>;
      },
      clearTimer: (id) => {
        const idx = timers.findIndex((t) => t.id === (id as unknown as number));
        if (idx >= 0) timers.splice(idx, 1);
      },
    });
    const pending = coalescer.waitForCommit();
    coalescer.pushFragment('one');
    assert.equal(timers[0]?.at, 0);
    coalescer.pushFragment('two');
    assert.equal(timers.length, 1);
    assert.equal(timers[0].at, 100);
    timers[0].fn();
    timers.length = 0;
    assert.equal(await pending, 'one\ntwo');
    coalescer.dispose();
  });
});
