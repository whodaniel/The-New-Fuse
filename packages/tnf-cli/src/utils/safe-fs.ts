/**
 * packages/tnf-cli/src/utils/safe-fs.ts
 *
 * Shared helpers introduced during the 2026-07-26 audit pass:
 *
 *   - `safeJsonParse(text, fallback)`       — never throws on bad JSON.
 *   - `safeReadJson(path, fallback)`        — wraps fs.readFileSync + parse.
 *   - `writeFileAtomic(path, body)`         — tmp-write + rename so partial
 *                                            writes never leave torn state.
 *
 * All three are zero-dep and synchronous; the CLI exits via `main()` so
 * the synchronous behavior is intentional.
 */

import * as fs from 'fs';
import * as path from 'path';

export type JsonFallback<T> = T | null;

/**
 * Parse JSON bytes without throwing. Returns `fallback` on SyntaxError or
 * non-object input. Useful for state, config, and IPC envelopes where we
 * would rather treat corruption as "missing" than crash the CLI.
 */
export function safeJsonParse<T = unknown>(
  text: string,
  fallback: JsonFallback<T> = null
): JsonFallback<T> {
  if (typeof text !== 'string' || text.length === 0) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

/**
 * Read + parse a UTF-8 JSON file. Returns `fallback` on any failure
 * (missing, ENOENT, EACCES, SyntaxError). JSON.parse errors are the common
 * failure mode after a torn-write; this keeps the CLI bootable.
 */
export function safeReadJson<T = unknown>(
  filePath: string,
  fallback: JsonFallback<T> = null
): JsonFallback<T> {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    return safeJsonParse<T>(text, fallback);
  } catch {
    return fallback;
  }
}

/**
 * Atomic write: stage to `<path>.tmp-<pid>-<rand>` then `rename(2)` over
 * the destination. POSIX guarantees `rename` is atomic on the same
 * filesystem, so readers always see either the old version or the new one,
 * never a partial write (which is what produces the torn-state crash that
 * brought us here on voice session + full-auto + handoff state).
 *
 * `encoding` defaults to `'utf8'`; pass `'binary'` for raw Buffer input.
 */
export function writeFileAtomic(
  filePath: string,
  body: string | Buffer,
  encoding: BufferEncoding = 'utf8'
): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const staging = path.join(
    dir,
    `.${path.basename(filePath)}.tmp-${process.pid}-${Math.random().toString(36).slice(2, 8)}`
  );
  try {
    fs.writeFileSync(staging, body, encoding);
    fs.renameSync(staging, filePath);
  } catch (err) {
    // Best-effort: don't leave a staged file behind on failure.
    try {
      fs.rmSync(staging, { force: true });
    } catch {
      /* noop */
    }
    throw err;
  }
}
