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
  type PaletteEntry,
  type PaletteKey,
  type PaletteTheme,
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
}

/**
 * Attach the palette to a readline interface.
 *
 * Returns a state object whose `pending` field the caller reads through
 * `resolveSlashDropdownInput` once the submitted line arrives.
 */
export function attachPalette(deps: AttachDeps): SlashDropdownState {
  const { rl, projectRoot, getIndex, theme, stdin, stdout, emitKeypressEvents } = deps;

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
  const controller = new PaletteController(renderer, theme);
  controller.setIndex(getIndex(projectRoot));
  state.controller = controller;

  /** Mirror of the query line. See hazards 2 and 3 in the module docblock. */
  let lastLine = '';

  const onKeypress = (_value: string, key: any) => {
    const paletteKey = toPaletteKey(key?.name, Boolean(key?.shift));

    // Ctrl-/Meta- chords belong to readline (Ctrl-C, Ctrl-U, word motion).
    if (key?.ctrl || key?.meta) {
      lastLine = String((rl as any).line || '');
      if (controller.isOpen) controller.close();
      return;
    }

    const isNav =
      paletteKey === 'up' ||
      paletteKey === 'down' ||
      paletteKey === 'pageup' ||
      paletteKey === 'pagedown';

    if (paletteKey === 'enter') {
      const outcome = controller.handle(lastLine, 'enter');
      if (outcome.type === 'run') state.pending = outcome.entry;
      lastLine = '';
      return;
    }

    if (isNav) {
      if (!controller.isOpen) {
        // Palette closed: leave the arrow keys to readline's history.
        lastLine = String((rl as any).line || '');
        return;
      }
      state.navigated = true;
      controller.handle(lastLine, paletteKey);
      // Undo readline's history recall so the typed query stays on screen.
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

  stdin.on('keypress', onKeypress);

  let disposed = false;
  state.dispose = () => {
    if (disposed) return;
    disposed = true;
    controller.close();
    stdin.off?.('keypress', onKeypress);
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
