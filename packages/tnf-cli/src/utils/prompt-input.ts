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
 *   3. implicit stdin            when piped (stdin.isTTY === false)
 *   4. positional args           joined with "\n" so $'a\nb' round-trips
 *   5. `undefined`               caller renders its own usage error
 *
 * NOTES for callers:
 *   - This helper does NOT mutate argv; the caller decides what to do with
 *     the resolved string (push into another CLI's --prompt, etc.).
 *   - Stdin reads are bounded (8 MiB) and drain-on-overflow so producers don't
 *     EPIPE. The runner is told about truncation via a terminal marker, never
 *     silently dropped.
 *   - UTF-8 is hard-coded. Real TNF prompts are always UTF-8; if a future
 *     command needs something else it should opt in explicitly here.
 */

import * as fs from 'fs';
import * as path from 'path';

/** Hard cap on how much stdin a single prompt command will consume. */
export const STDIN_PROMPT_MAX_BYTES = 8 * 1024 * 1024; // 8 MiB

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
   * `[task...]`. Joined with newlines; non-empty after join wins.
   */
  positional?: string[];
}

function readStdinTask(maxBytes: number = STDIN_PROMPT_MAX_BYTES): Promise<string> {
  return new Promise((resolve, reject) => {
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }
    const chunks: Buffer[] = [];
    let total = 0;
    let truncated = false;
    process.stdin.on('data', (chunk: Buffer) => {
      if (truncated) return;
      total += chunk.length;
      if (total > maxBytes) {
        truncated = true;
        const remaining = chunk.subarray(0, Math.max(0, maxBytes - (total - chunk.length)));
        if (remaining.length) chunks.push(remaining);
        process.stdin.removeAllListeners('data');
        // Drain the rest so the pipe closes cleanly instead of EPIPE-ing the producer.
        process.stdin.resume();
        process.stdin.on('data', () => {});
        resolve(Buffer.concat(chunks).toString('utf8') + STDIN_TRUNCATION_MARKER);
        return;
      }
      chunks.push(chunk);
    });
    process.stdin.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    process.stdin.on('error', (err) => reject(err));
  });
}

/**
 * Resolve the user's prompt text from the available input channels.
 *
 * Returns `null` for `text` when no channel supplied a value — the caller is
 * responsible for rendering the usage error in its own voice (different
 * commands want different lists of valid channels).
 */
export async function resolvePrompt(opts: ResolvePromptOptions): Promise<PromptResolution | null> {
  const flagText = (opts.task ?? '').trim();
  if (flagText) {
    return { text: flagText, source: 'flag' };
  }
  let filePath = opts.taskFile;
  // Treat undefined / empty / "-" as inline stdin so callers don't need to
  // special-case them.
  const wantsStdinFile = filePath !== undefined && (filePath === '' || filePath === '-');
  if (wantsStdinFile) {
    const text = await readStdinTask();
    return text ? { text, source: 'stdin', filePath: '<stdin>' } : null;
  }
  if (filePath !== undefined) {
    try {
      const abs = path.resolve(filePath);
      const text = fs.readFileSync(abs, 'utf8');
      return { text, source: 'file', filePath: abs };
    } catch (err: any) {
      // Surface the read failure through the resolved envelope; the caller
      // turns it into a CLI-shaped error. Returning `text === ''` and a
      // custom marker would erase information.
      throw new Error(`--task-file "${filePath}" could not be read: ${err?.message ?? err}`);
    }
  }
  if (!process.stdin.isTTY) {
    const text = await readStdinTask();
    if (text) return { text, source: 'stdin' };
  }
  if (opts.positional && opts.positional.length) {
    return { text: opts.positional.join('\n'), source: 'positional' };
  }
  return null;
}

/** Re-export for any helper that wants to read stdin without going through resolve. */
export { readStdinTask };
