/**
 * Always-on TTY line collector for `tnf tui`.
 *
 * Keeps consuming readline `line` events while an LLM turn is in flight so
 * busy pastes coalesce into one queued next message instead of being lost or
 * shredding across later prompts. Idle waits use the same coalescer so a
 * multiline paste at ❯ becomes one user message.
 */

import type readline from 'readline';
import {
  createPromptPasteCoalescer,
  PROMPT_PASTE_DEBOUNCE_MS,
  type PromptPasteCoalescer,
} from './prompt-paste-coalesce.js';

export type TuiInputCollectorMode = 'idle' | 'busy' | 'paused';

export interface TuiInputCollectorOptions {
  rl: readline.Interface;
  debounceMs?: number;
  /** Optional wall-clock stall defense (ms). 0 / undefined = off. */
  stallTimeoutMs?: number;
  stallFallbackPrompt?: string;
}

export interface TuiInputCollector {
  setMode(mode: TuiInputCollectorMode): void;
  getMode(): TuiInputCollectorMode;
  /** True when idle coalescer has parked fragments (paste before ask). */
  hasIdlePending(): boolean;
  /** Write prompt and wait for one coalesced idle commit. */
  waitForIdleCommit(prompt: string): Promise<string>;
  /** Drain busy coalesce buffer (flush pending debounce). Null if empty. */
  takeBusyQueue(): string | null;
  dispose(): void;
}

export function createTuiInputCollector(opts: TuiInputCollectorOptions): TuiInputCollector {
  const debounceMs = opts.debounceMs ?? PROMPT_PASTE_DEBOUNCE_MS;
  const idleCoalescer: PromptPasteCoalescer = createPromptPasteCoalescer({ debounceMs });
  const busyCoalescer: PromptPasteCoalescer = createPromptPasteCoalescer({ debounceMs });

  let mode: TuiInputCollectorMode = 'idle';
  let idleWaiter: {
    resolve: (value: string) => void;
    reject: (err: Error) => void;
  } | null = null;
  let idleCommitListening = false;
  let stallTimer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;
  let busyCommitted: string | null = null;

  const clearStall = () => {
    if (stallTimer) {
      clearTimeout(stallTimer);
      stallTimer = null;
    }
  };

  const appendBusyCommit = (text: string) => {
    if (!text.trim()) return;
    busyCommitted = busyCommitted ? `${busyCommitted}\n${text}` : text;
  };

  const resolveIdle = (text: string) => {
    clearStall();
    idleCommitListening = false;
    const waiter = idleWaiter;
    idleWaiter = null;
    if (waiter) waiter.resolve(text);
  };

  const listenForIdleCommit = () => {
    if (idleCommitListening || !idleWaiter || disposed) return;
    idleCommitListening = true;
    void idleCoalescer.waitForCommit().then(
      (committed) => {
        idleCommitListening = false;
        if (idleWaiter) resolveIdle(committed);
      },
      () => {
        idleCommitListening = false;
      }
    );
  };

  const onLine = (line: string) => {
    if (disposed) return;
    if (mode === 'paused') return;

    if (mode === 'busy') {
      // Park fragments until takeBusyQueue() at end of turn (debounce not needed
      // while turn is in flight — flush joins everything once).
      busyCoalescer.pushFragment(line);
      return;
    }

    idleCoalescer.pushFragment(line);
    if (idleWaiter) listenForIdleCommit();
  };

  opts.rl.on('line', onLine);

  return {
    setMode(next) {
      mode = next;
    },

    getMode() {
      return mode;
    },

    hasIdlePending() {
      return idleCoalescer.hasPending();
    },

    waitForIdleCommit(prompt: string) {
      if (disposed) {
        return Promise.reject(new Error('tui input collector disposed'));
      }
      mode = 'idle';
      if (prompt) process.stdout.write(prompt);

      return new Promise<string>((resolve, reject) => {
        idleWaiter = { resolve, reject };
        clearStall();
        if (idleCoalescer.hasPending()) listenForIdleCommit();
        const stallMs = Math.max(0, opts.stallTimeoutMs ?? 0);
        if (stallMs > 0) {
          stallTimer = setTimeout(() => {
            stallTimer = null;
            const fallback =
              opts.stallFallbackPrompt ||
              'Continue autonomous execution. Follow your overarching directive.';
            idleCoalescer.clear();
            resolveIdle(fallback);
          }, stallMs);
        }
      });
    },

    takeBusyQueue() {
      const flushed = busyCoalescer.flushNow();
      if (flushed) appendBusyCommit(flushed);
      const out = busyCommitted;
      busyCommitted = null;
      return out && out.trim() ? out : null;
    },

    dispose() {
      disposed = true;
      clearStall();
      opts.rl.off('line', onLine);
      idleCoalescer.dispose();
      busyCoalescer.dispose();
      if (idleWaiter) {
        const w = idleWaiter;
        idleWaiter = null;
        w.reject(new Error('tui input collector disposed'));
      }
    },
  };
}
