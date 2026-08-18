/**
 * packages/tnf-cli/src/utils/palette-readline.ts
 *
 * The glue between Node's readline and the command palette.
 *
 * WHY THIS IS ITS OWN MODULE
 *   This is the part of the palette most likely to break, and it cannot be
 *   tested from `cli.ts` — importing that module executes `main()`. Everything
 *   here is therefore parameterised (index provider, theme, streams) so a test
 *   can drive it over a fake TTY.
 *
 * THE THREE ORDERING HAZARDS THIS CODE EXISTS TO HANDLE
 *
 *   1. readline runs first. `readline.emitKeypressEvents` wires readline's own
 *      handler before ours, so by the time we see a keypress the buffer has
 *      already been updated. We read `rl.line` AFTER the fact, never before.
 *
 *   2. Enter clears the buffer. readline's return handler emits `line` and
 *      then sets `rl.line = ''`, and only after both listeners run does the
 *      awaiting promise resume. Reading `rl.line` on Enter therefore yields
 *      an empty string, so the query is mirrored into `lastLine` and the
 *      chosen entry is stashed in `state.pending` for the resolver.
 *
 *   3. Arrow keys belong to history. readline binds up/down to history recall
 *      and overwrites the buffer with a previous command. While the palette is
 *      open it owns those keys, so after moving the selection we rewrite the
 *      buffer back to the operator's query.
 */

import type * as readline from 'readline';
import {
  PaletteController,
  PaletteRenderer,
  isNavKey,
  type PaletteEntry,
  type PaletteKey,
  type PaletteTheme,
  type RecentsLike,
} from './command-palette.js';

/** Live palette session bound to one readline interface. */
export interface SlashDropdownState {
  controller: PaletteController | null;
  /** Entry chosen with Enter, awaiting pickup by resolveSlashDropdownInput. */
  pending: PaletteEntry | null;
  /** True once the operator moved the selection or Tab-completed. */
  navigated: boolean;
  projectRoot: string;
  /** Detach keypress handling. Called on readline close; safe to call twice. */
  dispose: () => void;
}

/** The text that runs an entry when submitted as a line. */
export function paletteEntryToLine(entry: PaletteEntry): string {
  if (entry.action.type === 'slash') return entry.tokens[0];
  if (entry.action.type === 'cli') return `/${entry.tokens.join(' ')}`;
  return `/${entry.action.entry.name}`;
}

/**
 * Decide what the operator meant when they pressed Enter.
 *
 * A navigated selection always wins — moving the cursor is an unambiguous
 * choice. Otherwise a line the operator typed with arguments of their own wins
 * over the highlighted row, because the palette knows nothing about those
 * arguments and substituting would silently drop them.
 */
export function resolveSlashDropdownInput(input: string, state: SlashDropdownState): string {
  const pending = state.pending;
  const navigated = state.navigated;
  state.pending = null;
  state.navigated = false;
  state.controller?.close();

  if (!pending) return input;
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return input;
  if (!navigated && trimmed.slice(1).includes(' ')) return input;
  return paletteEntryToLine(pending);
}

export function setReadlineLine(rl: readline.Interface, line: string): void {
  (rl as any).line = line;
  (rl as any).cursor = line.length;
  (rl as any)._refreshLine?.();
}

/**
 * Ctrl chords the palette owns while it is open.
 *
 * Terminals that swallow PageUp/Home (tmux without extended keys, some SSH
 * clients, most mobile terminal apps) leave the operator with no way to move
 * more than one row at a time. The readline/emacs chords work everywhere and
 * are what anyone who lives in a terminal reaches for anyway.
 *
 * The set is kept deliberately small. ^A/^E/^F/^B/^K/^W stay with readline's
 * line editing — the operator is still editing a query while the palette is
 * open, and silently repurposing those would be worse than the problem being
 * solved. ^C and ^Z stay with the shell.
 */
const CTRL_NAV: Record<string, PaletteKey> = {
  n: 'down',
  p: 'up',
  d: 'halfdown',
  u: 'halfup',
  g: 'escape',
};

/** Ctrl chord → palette key, or null when the palette should not claim it. */
export function ctrlToPaletteKey(keyName: string | undefined): PaletteKey | null {
  if (!keyName) return null;
  return CTRL_NAV[keyName.toLowerCase()] ?? null;
}

export function toPaletteKey(keyName: string | undefined, shift: boolean): PaletteKey {
  switch (keyName) {
    case 'up':
      return 'up';
    case 'down':
      return 'down';
    case 'pageup':
      return 'pageup';
    case 'pagedown':
      return 'pagedown';
    case 'home':
      return 'home';
    case 'end':
      return 'end';
    case 'return':
    case 'enter':
      return 'enter';
    case 'tab':
      // Shift-Tab walks the list backwards, matching every other palette.
      return shift ? 'up' : 'tab';
    case 'escape':
      return 'escape';
    default:
      return 'other';
  }
}

export interface AttachDeps {
  rl: readline.Interface;
  projectRoot: string;
  /** Built lazily so a non-TTY session never pays for the 1300-entry walk. */
  getIndex: (projectRoot: string) => PaletteEntry[];
  theme: PaletteTheme;
  stdin: NodeJS.ReadableStream & { isTTY?: boolean; setRawMode?: (m: boolean) => void };
  stdout: NodeJS.WritableStream & { columns?: number; rows?: number };
  /** Injected for tests; defaults to node:readline's emitKeypressEvents. */
  emitKeypressEvents: (stream: NodeJS.ReadableStream, rl?: readline.Interface) => void;
  /**
   * How long to wait after a lone ESC byte before treating it as Escape.
   *
   * The classic terminal ambiguity: ESC is both its own key and the prefix of
   * every arrow/function sequence, so it can only be resolved by waiting.
   * Long enough that a real escape sequence arrives first, short enough that
   * a human never perceives the delay.
   */
  escapeDelayMs?: number;
  /** Frecency store consulted while ranking. Omit to rank purely fuzzily. */
  recents?: RecentsLike | null;
}

const DEFAULT_ESCAPE_DELAY_MS = 60;

/**
 * Attach the palette to a readline interface.
 *
 * Returns a state object whose `pending` field the caller reads through
 * `resolveSlashDropdownInput` once the submitted line arrives.
 */
export function attachPalette(deps: AttachDeps): SlashDropdownState {
  const { rl, projectRoot, getIndex, theme, stdin, stdout, emitKeypressEvents } = deps;
  const escapeDelayMs = deps.escapeDelayMs ?? DEFAULT_ESCAPE_DELAY_MS;

  const state: SlashDropdownState = {
    controller: null,
    pending: null,
    navigated: false,
    projectRoot,
    dispose: () => {},
  };
  // Without a TTY there are no per-character keypresses to react to; the
  // readline completer handles Tab and the palette stays out of the way.
  if (!stdin.isTTY) return state;

  emitKeypressEvents(stdin, rl);

  // TTY line discipline in cooked mode buffers a whole line and only delivers
  // keypress events on Enter — too late for a palette that filters per
  // character. Raw mode restores per-keystroke delivery; undone on close.
  if (typeof stdin.setRawMode === 'function') {
    try {
      stdin.setRawMode(true);
    } catch {
      /* tty may be wrapped */
    }
  }

  const renderer = new PaletteRenderer({
    write: (chunk) => stdout.write(chunk),
    columns: () => stdout.columns ?? 80,
    rows: () => stdout.rows ?? 24,
  });
  const controller = new PaletteController(renderer, theme, deps.recents ?? null);
  controller.setIndex(getIndex(projectRoot));
  state.controller = controller;

  /** Mirror of the query line. See hazards 2 and 3 in the module docblock. */
  let lastLine = '';

  /**
   * Pending lone-ESC resolution.
   *
   * A bare ESC produces no keypress event at all — Node's parser holds the
   * byte in case a sequence follows — so without this the palette could not
   * be dismissed until the operator pressed something else. Watching the raw
   * stream lets a solitary ESC resolve on its own after a short delay, while
   * any real sequence (arrow keys, meta chords) cancels it.
   */
  let escapeTimer: NodeJS.Timeout | null = null;
  const cancelEscapeTimer = () => {
    if (escapeTimer) {
      clearTimeout(escapeTimer);
      escapeTimer = null;
    }
  };

  const onData = (chunk: Buffer | string) => {
    const bytes = typeof chunk === 'string' ? chunk : chunk.toString('binary');
    if (bytes !== '\x1b') return;
    cancelEscapeTimer();
    escapeTimer = setTimeout(() => {
      escapeTimer = null;
      if (controller.isOpen) controller.handle(lastLine, 'escape');
    }, escapeDelayMs);
    // Never hold the process open for a dismissal timer.
    escapeTimer.unref?.();
  };

  const onKeypress = (_value: string, key: any) => {
    cancelEscapeTimer();

    let paletteKey = toPaletteKey(key?.name, Boolean(key?.shift));

    if (key?.meta && !key?.ctrl) {
      paletteKey = 'escape';
    } else if (key?.ctrl) {
      const chord = controller.isOpen ? ctrlToPaletteKey(key?.name) : null;
      if (!chord) {
        lastLine = String((rl as any).line || '');
        if (controller.isOpen) controller.close();
        return;
      }
      // readline has already applied its own meaning for this chord to the
      // buffer (^D deletes a character, for one), so the query is restored
      // from the mirror after the palette consumes the keystroke.
      if (chord === 'escape') {
        controller.handle(lastLine, 'escape');
        setReadlineLine(rl, lastLine);
        return;
      }
      state.navigated = true;
      controller.handle(lastLine, chord);
      setReadlineLine(rl, lastLine);
      return;
    }

    if (paletteKey === 'escape') {
      controller.handle(lastLine, 'escape');
      return;
    }

    const isNav = isNavKey(paletteKey);

    if (paletteKey === 'enter') {
      const outcome = controller.handle(lastLine, 'enter');
      if (outcome.type === 'run') {
        state.pending = outcome.entry;
        // Choosing from the palette is the only unambiguous "I meant this
        // one" signal there is, so it is what feeds frecency. Typing a line
        // by hand does not, because the operator never consulted the list.
        try {
          deps.recents?.record?.(outcome.entry.id);
        } catch {
          /* history is a nicety; never let it break submission */
        }
      }
      lastLine = '';
      return;
    }

    if (isNav && !controller.isOpen) {
      lastLine = String((rl as any).line || '');
      return;
    }

    if (isNav) {
      state.navigated = true;
      controller.handle(lastLine, paletteKey);
      setReadlineLine(rl, lastLine);
      return;
    }

    lastLine = String((rl as any).line || '');
    const outcome = controller.handle(lastLine, paletteKey);

    if (outcome.type === 'complete') {
      state.navigated = true;
      lastLine = outcome.line;
      setReadlineLine(rl, outcome.line);
    }
  };

  const onResize = () => {
    if (controller.isOpen) {
      controller.render();
    }
  };

  stdin.on('keypress', onKeypress);
  stdin.on('data', onData);
  stdout.on('resize', onResize);

  let disposed = false;
  state.dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelEscapeTimer();
    controller.close();
    stdin.off?.('keypress', onKeypress);
    stdin.off?.('data', onData);
    stdout.off?.('resize', onResize);
    if (typeof stdin.setRawMode === 'function') {
      try {
        stdin.setRawMode(false);
      } catch {
        /* already gone */
      }
    }
  };
  rl.once('close', state.dispose);

  return state;
}
