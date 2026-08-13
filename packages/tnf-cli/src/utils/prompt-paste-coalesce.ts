/**
 * Debounce rapid Enter-keyed paste fragments into one committed prompt.
 *
 * TNF TUI is readline-based: a multiline paste often arrives as many `line`
 * events. Without coalesce, each line becomes its own agent turn. Mirrors the
 * Hermes busy-paste lesson in TS without any Hermes dependency.
 */

import { sanitizeUtf8Prompt } from './prompt-input.js';

/** Quiet window after the last fragment before committing (ms). */
export const PROMPT_PASTE_DEBOUNCE_MS = 180;

export interface PromptPasteCoalescerOptions {
  /** Override debounce quiet window. Tests inject a tiny value. */
  debounceMs?: number;
  /** Injectable timer APIs for deterministic tests. */
  setTimer?: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (id: ReturnType<typeof setTimeout>) => void;
}

export interface PromptPasteCoalescer {
  /** Append a fragment; whitespace-only after sanitize is ignored. */
  pushFragment(text: string): void;
  /**
   * Resolve with the joined commit after quiet debounce.
   * If fragments already pending, arms/resets the timer.
   * If empty, waits until at least one fragment arrives then debounce.
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
  const setTimer = opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = opts.clearTimer ?? ((id) => clearTimeout(id));

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

  const arm = () => {
    if (disposed) return;
    clearArmedTimer();
    if (parts.length === 0 || waiters.length === 0) return;
    if (debounceMs === 0) {
      const combined = joinParts();
      if (combined != null) settle(combined);
      return;
    }
    timer = setTimer(() => {
      timer = null;
      if (waiters.length === 0) return;
      const combined = joinParts();
      if (combined != null) settle(combined);
    }, debounceMs);
  };

  return {
    pushFragment(text: string) {
      if (disposed) return;
      const cleaned = sanitizeUtf8Prompt(text ?? '');
      if (!cleaned.trim()) return;
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
