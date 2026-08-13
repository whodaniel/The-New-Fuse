/**
 * packages/tnf-cli/src/utils/prompt-input.ts
 *
 * Canonical prompt-input resolver for `tnf` subcommands.
 *
 * Solves the bug class previously living inline in `agents-run` (and a near
 * twin inside `cli.ts` `chat`) where commands only accepted the prompt as a
 * single string or a variadic positional, never from stdin, never from a file,
 * and always `join(' ')`'d positional args — silently collapsing newlines.
 *
 * Resolution precedence (single source of truth, called identically from
 * every prompt-consuming command):
 *
 *   1. `--task <text>`           explicit single-string override (flag wins)
 *   2. `--task-file <path|->`    file contents; "-" means inline stdin
 *   3. positional args           joined with "\n" so $'a\nb' round-trips
 *                                (checked BEFORE implicit stdin so an open
 *                                non-TTY stdin from agent runners cannot hang
 *                                when the operator already supplied a prompt)
 *   4. implicit stdin            when piped (stdin.isTTY === false), with a
 *                                first-byte idle timeout + post-data stall so
 *                                hung FDs fail soft without waiting forever
 *   5. `undefined`               caller renders its own usage error
 *
 * NOTES for callers:
 *   - This helper does NOT mutate argv; the caller decides what to do with
 *     the resolved string (push into another CLI's --prompt, etc.).
 *   - Stdin reads are bounded (8 MiB) and drain-on-overflow so producers don't
 *     EPIPE. The runner is told about truncation via a terminal marker, never
 *     silently dropped.
 *   - Decoded text is UTF-8 with surrogate pairs replaced (history / CLI
 *     transports that reject lone surrogates stay safe).
 */

import * as fs from 'fs';
import * as path from 'path';

/** Hard cap on how much stdin a single prompt command will consume. */
export const STDIN_PROMPT_MAX_BYTES = 8 * 1024 * 1024; // 8 MiB

/**
 * Max time to wait for the first byte (or EOF) on an open non-TTY stdin.
 * Agent runners often leave stdin open without data; blocking forever would
 * starve positional prompts and hang the CLI.
 *
 * Bumped from 100ms → 500ms so slow pipe producers (shell redirects, large
 * paste proxies) still beat the empty-idle path without feeling hung.
 */
export const STDIN_PROMPT_IDLE_MS = 500;

/**
 * After at least one byte has arrived, if the stream stalls (no further data
 * and no `end`) for this long, finish with the partial buffer instead of
 * waiting forever on an abandoned open FD.
 */
export const STDIN_PROMPT_STALL_MS = 2000;

/** Marker spliced onto the prompt if stdin was truncated by the byte cap. */
export const STDIN_TRUNCATION_MARKER = '\n[tnf: stdin truncated to 8 MiB cap]';

export type PromptSource = 'flag' | 'file' | 'stdin' | 'positional';

export interface PromptResolution {
  text: string;
  source: PromptSource;
  /** Path that was read when source === 'file' (else undefined). */
  filePath?: string;
}

export interface ResolvePromptOptions {
  /** Explicit override. Wins over everything else. Trimmed. */
  task?: string;
  /** File system path (UTF-8). The literal "-" (or empty string) means stdin. */
  taskFile?: string;
  /**
   * Raw positional argv array, as commander hands the `task` argument for
   * `[task...]`. Joined with newlines; non-empty after join wins over
   * implicit stdin.
   */
  positional?: string[];
  /**
   * Override the first-byte idle timeout for stdin reads (ms). Tests inject a
   * tiny value; production keeps STDIN_PROMPT_IDLE_MS.
   */
  stdinIdleMs?: number;
  /**
   * Override the post-data stall timeout (ms). After bytes have been seen,
   * silence lasting this long finishes the read with the partial buffer.
   */
  stdinStallMs?: number;
  /** Injectable readable for tests. Defaults to process.stdin. */
  stdin?: NodeJS.ReadableStream;
}

type StdinLike = NodeJS.ReadableStream & {
  isTTY?: boolean;
  readableEnded?: boolean;
  readableLength?: number;
  resume?: () => void;
  destroy?: (err?: Error) => void;
};

function getStdin(opts?: ResolvePromptOptions): StdinLike {
  return (opts?.stdin as StdinLike) || (process.stdin as StdinLike);
}

function positionalText(positional?: string[]): string {
  if (!positional || positional.length === 0) return '';
  return positional.join('\n');
}

/**
 * Replace lone UTF-16 surrogates so downstream CLIs and history stores never
 * hit `surrogates not allowed` encode failures (prompt_toolkit, JSON, etc.).
 */
export function sanitizeUtf8Prompt(text: string): string {
  if (!text) return text;
  return text.replace(
    /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,
    '\uFFFD'
  );
}

function decodePromptBuffer(buf: Buffer): string {
  // Node's utf8 decoder replaces invalid byte sequences with U+FFFD.
  return sanitizeUtf8Prompt(buf.toString('utf8'));
}

/**
 * Read stdin up to maxBytes. Returns '' on TTY, already-ended streams, idle
 * timeout with no bytes, or empty EOF. Never hangs forever on an open FD.
 *
 * Two timers:
 *   - first-byte idle: empty open FD → ''
 *   - post-data stall: partial content without `end` → finish with what we have
 */
function readStdinTask(
  maxBytes: number = STDIN_PROMPT_MAX_BYTES,
  idleMs: number = STDIN_PROMPT_IDLE_MS,
  stdin: StdinLike = process.stdin as StdinLike,
  stallMs: number = STDIN_PROMPT_STALL_MS
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (stdin.isTTY) {
      resolve('');
      return;
    }
    if (stdin.readableEnded) {
      resolve('');
      return;
    }

    const chunks: Buffer[] = [];
    let total = 0;
    let truncated = false;
    let settled = false;
    let sawData = false;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let stallTimer: ReturnType<typeof setTimeout> | null = null;

    const finish = (text: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(text);
    };

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    const cleanup = () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
      if (stallTimer) {
        clearTimeout(stallTimer);
        stallTimer = null;
      }
      stdin.removeListener('data', onData);
      stdin.removeListener('end', onEnd);
      stdin.removeListener('error', onError);
    };

    const armStall = () => {
      if (stallTimer) {
        clearTimeout(stallTimer);
        stallTimer = null;
      }
      const wait = Math.max(0, stallMs);
      if (wait === 0) return;
      stallTimer = setTimeout(() => {
        if (settled || !sawData) return;
        finish(decodePromptBuffer(Buffer.concat(chunks)));
      }, wait);
    };

    const onData = (chunk: Buffer | string) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      sawData = true;
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
      if (truncated) return;
      total += buf.length;
      if (total > maxBytes) {
        truncated = true;
        const remaining = buf.subarray(0, Math.max(0, maxBytes - (total - buf.length)));
        if (remaining.length) chunks.push(remaining);
        // Drain the rest so the pipe closes cleanly instead of EPIPE-ing the producer.
        stdin.removeListener('data', onData);
        if (typeof stdin.resume === 'function') stdin.resume();
        stdin.on('data', () => {});
        finish(decodePromptBuffer(Buffer.concat(chunks)) + STDIN_TRUNCATION_MARKER);
        return;
      }
      chunks.push(buf);
      armStall();
    };

    const onEnd = () => {
      finish(decodePromptBuffer(Buffer.concat(chunks)));
    };

    const onError = (err: Error) => fail(err);

    stdin.on('data', onData);
    stdin.on('end', onEnd);
    stdin.on('error', onError);

    // Already-buffered bytes (e.g. Readable.from) still need flowing mode.
    if (typeof stdin.resume === 'function') {
      stdin.resume();
    }

    // If nothing arrives within idleMs and we have no buffered length, treat
    // as empty so callers can fall through (or return null). Explicit
    // `--task-file -` still gets '' rather than hanging.
    const buffered = typeof stdin.readableLength === 'number' ? stdin.readableLength : 0;
    if (buffered === 0) {
      idleTimer = setTimeout(
        () => {
          if (settled || sawData || total > 0) return;
          finish('');
        },
        Math.max(0, idleMs)
      );
    }
  });
}

/**
 * Resolve the user's prompt text from the available input channels.
 *
 * Returns `null` when no channel supplied a value — the caller is
 * responsible for rendering the usage error in its own voice (different
 * commands want different lists of valid channels).
 */
export async function resolvePrompt(opts: ResolvePromptOptions): Promise<PromptResolution | null> {
  const flagText = sanitizeUtf8Prompt((opts.task ?? '').trim());
  if (flagText) {
    return { text: flagText, source: 'flag' };
  }

  const filePath = opts.taskFile;
  const wantsStdinFile = filePath !== undefined && (filePath === '' || filePath === '-');
  const idleMs = opts.stdinIdleMs ?? STDIN_PROMPT_IDLE_MS;
  const stallMs = opts.stdinStallMs ?? STDIN_PROMPT_STALL_MS;
  const stdin = getStdin(opts);

  if (wantsStdinFile) {
    const text = await readStdinTask(STDIN_PROMPT_MAX_BYTES, idleMs, stdin, stallMs);
    return text ? { text, source: 'stdin', filePath: '<stdin>' } : null;
  }
  if (filePath !== undefined) {
    try {
      const abs = path.resolve(filePath);
      const text = sanitizeUtf8Prompt(fs.readFileSync(abs, 'utf8'));
      return { text, source: 'file', filePath: abs };
    } catch (err: any) {
      throw new Error(`--task-file "${filePath}" could not be read: ${err?.message ?? err}`);
    }
  }

  // Prefer positional over implicit stdin so open non-TTY FDs cannot hang
  // when the operator already supplied a prompt on the argv.
  const fromPositional = sanitizeUtf8Prompt(positionalText(opts.positional));
  if (fromPositional) {
    return { text: fromPositional, source: 'positional' };
  }

  if (!stdin.isTTY) {
    const text = await readStdinTask(STDIN_PROMPT_MAX_BYTES, idleMs, stdin, stallMs);
    if (text) return { text, source: 'stdin' };
  }

  return null;
}

/** Re-export for any helper that wants to read stdin without going through resolve. */
export { readStdinTask };
