/**
 * Debounce rapid Enter-keyed paste fragments into one committed prompt.
 *
 * TNF TUI is readline-based: a multiline paste often arrives as many `line`
 * events. Without coalesce, each line becomes its own agent turn. Mirrors the
 * Hermes busy-paste lesson in TS without any Hermes dependency.
 *
 * Latency model (adaptive):
 *   - Single Enter (one fragment) → commit on the next timer tick (0ms quiet),
 *     so typed commands are not delayed by paste heuristics.
 *   - Two or more fragments → use the longer paste quiet window so chunked
 *     pastes join into one message.
 *   - Optional `shouldHold` (e.g. readline still has uncommitted text) delays
 *     commit until the buffer is idle, so the last paste line is not dropped.
 */

import { sanitizeUtf8Prompt } from './prompt-input.js';

/** Quiet window after the last multi-fragment paste burst before committing (ms). */
export const PROMPT_PASTE_DEBOUNCE_MS = 180;

/**
 * Quiet window used while only one fragment is pending. 0 = commit ASAP after
 * the current turn of the event loop, so a normal typed Enter feels instant.
 * A second fragment before that tick upgrades to PROMPT_PASTE_DEBOUNCE_MS.
 */
export const PROMPT_PASTE_FIRST_FRAGMENT_MS = 0;

export interface PromptPasteCoalescerOptions {
  /** Override multi-fragment paste quiet window. Tests inject a tiny value. */
  debounceMs?: number;
  /**
   * Quiet window while exactly one fragment is pending.
   * Defaults to PROMPT_PASTE_FIRST_FRAGMENT_MS (immediate).
   */
  firstFragmentMs?: number;
  /**
   * When true at commit time, keep pending fragments and re-arm the timer.
   * Used so an incomplete last paste line still sitting in `rl.line` is not
   * cut off from the committed message.
   */
  shouldHold?: () => boolean;
  /** Injectable timer APIs for deterministic tests. */
  setTimer?: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (id: ReturnType<typeof setTimeout>) => void;
}

export interface PromptPasteCoalescer {
  /** Append a fragment. Blank lines inside a paste are preserved. */
  pushFragment(text: string): void;
  /**
   * Resolve with the joined commit after quiet debounce.
   * If fragments already pending, arms/resets the timer.
   * If empty, waits until at least one fragment arrives then debounce.
   * A lone empty Enter (no prior fragments) resolves to ''.
   */
  waitForCommit(): Promise<string>;
  /** Immediately join + clear pending fragments (no wait). Null if empty. */
  flushNow(): string | null;
  hasPending(): boolean;
  clear(): void;
  /** Cancel timers and reject outstanding waiters. */
  dispose(): void;
}

export function createPromptPasteCoalescer(
  opts: PromptPasteCoalescerOptions = {}
): PromptPasteCoalescer {
  const debounceMs = Math.max(0, opts.debounceMs ?? PROMPT_PASTE_DEBOUNCE_MS);
  const firstFragmentMs = Math.max(0, opts.firstFragmentMs ?? PROMPT_PASTE_FIRST_FRAGMENT_MS);
  const setTimer = opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = opts.clearTimer ?? ((id) => clearTimeout(id));
  const shouldHold = opts.shouldHold;

  let parts: string[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let waiters: Array<{
    resolve: (value: string) => void;
    reject: (err: Error) => void;
  }> = [];
  let disposed = false;

  const clearArmedTimer = () => {
    if (timer != null) {
      clearTimer(timer);
      timer = null;
    }
  };

  const joinParts = (): string | null => {
    if (parts.length === 0) return null;
    const combined = parts.join('\n');
    parts = [];
    return combined;
  };

  const settle = (text: string) => {
    clearArmedTimer();
    const pending = waiters;
    waiters = [];
    for (const w of pending) w.resolve(text);
  };

  const quietMsForPending = () => (parts.length <= 1 ? firstFragmentMs : debounceMs);

  const armWithMs = (ms: number) => {
    if (disposed) return;
    clearArmedTimer();
    if (parts.length === 0 || waiters.length === 0) return;
    timer = setTimer(() => {
      timer = null;
      tryCommit();
    }, ms);
  };

  const tryCommit = () => {
    if (disposed || waiters.length === 0) return;
    if (parts.length === 0) return;
    if (shouldHold?.()) {
      // Buffer still dirty (e.g. last paste line not yet Enter'd). Poll with the
      // paste quiet window — never firstFragmentMs (often 0), or we spin the CPU.
      armWithMs(Math.max(16, debounceMs || 16));
      return;
    }
    const combined = joinParts();
    if (combined != null) settle(combined);
  };

  const arm = () => {
    armWithMs(quietMsForPending());
  };

  return {
    pushFragment(text: string) {
      if (disposed) return;
      const cleaned = sanitizeUtf8Prompt(text ?? '');

      // Lone empty Enter with nothing queued: resolve the idle wait immediately
      // so ❯ does not hang when the operator presses Enter on a blank line.
      if (!cleaned.trim() && parts.length === 0) {
        if (waiters.length > 0) settle('');
        return;
      }

      // Preserve intentional blank lines inside a multiline paste.
      parts.push(cleaned);
      if (waiters.length > 0) arm();
    },

    waitForCommit() {
      if (disposed) {
        return Promise.reject(new Error('prompt paste coalescer disposed'));
      }
      return new Promise<string>((resolve, reject) => {
        waiters.push({ resolve, reject });
        if (parts.length > 0) arm();
      });
    },

    flushNow() {
      clearArmedTimer();
      const combined = joinParts();
      if (combined != null && waiters.length > 0) {
        settle(combined);
        return combined;
      }
      return combined;
    },

    hasPending() {
      return parts.length > 0;
    },

    clear() {
      clearArmedTimer();
      parts = [];
    },

    dispose() {
      disposed = true;
      clearArmedTimer();
      parts = [];
      const pending = waiters;
      waiters = [];
      const err = new Error('prompt paste coalescer disposed');
      for (const w of pending) w.reject(err);
    },
  };
}
