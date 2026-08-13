import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { describe, it } from 'node:test';
import {
  STDIN_TRUNCATION_MARKER,
  readStdinTask,
  resolvePrompt,
  sanitizeUtf8Prompt,
} from './prompt-input.js';

/**
 * Builds a paused, non-TTY Readable that exposes `.emit('data', ...)` so the
 * production code path through ReadableStream is exercised the same way the
 * real `process.stdin` is. We deliberately use Readable rather than a raw
 * EventEmitter because `prompt-input.ts`'s StdinLike extends
 * `NodeJS.ReadableStream` and Readable already implements the EventEmitter
 * surface the helper uses (data/end/error listeners).
 */
type FakeStdin = Readable & {
  isTTY: boolean;
};

function makeFakeStdin(overrides: Partial<FakeStdin> = {}): FakeStdin {
  const r = new Readable({
    read() {
      /* pull-mode stub */
    },
  }) as FakeStdin;
  r.isTTY = false;
  Object.assign(r, overrides);
  return r;
}

describe('prompt-input', () => {
  it('prefers --task over everything else', async () => {
    const result = await resolvePrompt({
      task: ' from-flag ',
      positional: ['from-positional'],
      stdin: makeFakeStdin(),
    });
    assert.deepEqual(result, { text: 'from-flag', source: 'flag' });
  });

  it('prefers positional over open non-TTY stdin (no hang)', async () => {
    const started = Date.now();
    const result = await resolvePrompt({
      positional: ['hello', 'world'],
      stdin: makeFakeStdin(),
      stdinIdleMs: 5_000,
    });
    const elapsed = Date.now() - started;
    assert.ok(elapsed < 500, `positional should not wait on stdin (took ${elapsed}ms)`);
    assert.deepEqual(result, { text: 'hello\nworld', source: 'positional' });
  });

  it('reads piped stdin when no flag/positional', async () => {
    const stdin = makeFakeStdin();
    const pending = resolvePrompt({ stdin, stdinIdleMs: 500 });
    queueMicrotask(() => {
      stdin.emit('data', Buffer.from('piped prompt'));
      stdin.emit('end');
    });
    const result = await pending;
    assert.equal(result?.source, 'stdin');
    assert.equal(result?.text, 'piped prompt');
  });

  it('returns null quickly on open empty stdin (idle timeout)', async () => {
    const started = Date.now();
    const result = await resolvePrompt({
      stdin: makeFakeStdin(),
      stdinIdleMs: 40,
    });
    const elapsed = Date.now() - started;
    assert.equal(result, null);
    assert.ok(elapsed < 500, `idle stdin should time out (took ${elapsed}ms)`);
  });

  it('returns empty string immediately when readableEnded', async () => {
    // readableEnded is a getter on Readable; force it via push(null).
    const stdin = makeFakeStdin();
    stdin.push(null);
    const text = await readStdinTask(1024, 200, stdin);
    assert.equal(text, '');
  });

  it('reads --task-file from disk', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-prompt-'));
    try {
      const file = path.join(dir, 'prompt.md');
      fs.writeFileSync(file, 'file body\n', 'utf8');
      const result = await resolvePrompt({ taskFile: file });
      assert.equal(result?.source, 'file');
      assert.equal(result?.text, 'file body\n');
      assert.equal(result?.filePath, path.resolve(file));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('marks truncated stdin', async () => {
    const stdin = makeFakeStdin();
    const pending = readStdinTask(20, 200, stdin);
    queueMicrotask(() => {
      stdin.emit('data', Buffer.from('x'.repeat(100)));
    });
    const text = await pending;
    assert.ok(text.endsWith(STDIN_TRUNCATION_MARKER));
    assert.equal(text.length, 20 + STDIN_TRUNCATION_MARKER.length);
  });

  it('reads finite Readable streams', async () => {
    const stdin = Readable.from(['hello from stream']) as Readable & {
      isTTY?: boolean;
    };
    stdin.isTTY = false;
    const result = await resolvePrompt({ stdin, stdinIdleMs: 200 });
    assert.equal(result?.text, 'hello from stream');
    assert.equal(result?.source, 'stdin');
  });

  it('finishes partial buffer on post-data stall (no forever hang)', async () => {
    const stdin = makeFakeStdin();
    const started = Date.now();
    const pending = readStdinTask(1024, 5_000, stdin, 40);
    queueMicrotask(() => {
      stdin.emit('data', Buffer.from('partial'));
      // deliberately no 'end' — abandoned open FD
    });
    const text = await pending;
    const elapsed = Date.now() - started;
    assert.equal(text, 'partial');
    assert.ok(elapsed < 500, `post-data stall should finish quickly (took ${elapsed}ms)`);
  });

  it('sanitizes lone UTF-16 surrogates without breaking valid surrogate pairs (emojis)', async () => {
    assert.equal(sanitizeUtf8Prompt('ok\uD800bad'), 'ok\uFFFDbad');
    assert.equal(sanitizeUtf8Prompt('valid 🤖 emoji'), 'valid 🤖 emoji');

    const fromFlag = await resolvePrompt({ task: 'hello\uD800world' });
    assert.equal(fromFlag?.text, 'hello\uFFFDworld');

    const fromPos = await resolvePrompt({ positional: ['a\uDC00b', '🚀'] });
    assert.equal(fromPos?.text, 'a\uFFFDb\n🚀');
  });
});
