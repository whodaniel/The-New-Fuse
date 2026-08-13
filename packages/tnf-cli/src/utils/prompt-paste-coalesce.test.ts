import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createPromptPasteCoalescer, PROMPT_PASTE_DEBOUNCE_MS } from './prompt-paste-coalesce.js';

describe('prompt-paste-coalesce', () => {
  it('exports a sensible default debounce', () => {
    assert.equal(PROMPT_PASTE_DEBOUNCE_MS, 180);
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

  it('skips whitespace-only fragments', async () => {
    const coalescer = createPromptPasteCoalescer({ debounceMs: 20 });
    const pending = coalescer.waitForCommit();
    coalescer.pushFragment('   ');
    coalescer.pushFragment('\t');
    coalescer.pushFragment('keep');
    const committed = await pending;
    assert.equal(committed, 'keep');
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
});
