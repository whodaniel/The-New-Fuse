import * as readline from 'node:readline';
import type { ReadStream, WriteStream } from 'node:tty';

export interface SelectItem<T> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SelectState {
  selected: number;
  query: string;
}

export type SelectKey =
  | 'up'
  | 'down'
  | 'pageup'
  | 'pagedown'
  | 'home'
  | 'end'
  | 'backspace'
  | 'enter'
  | 'escape'
  | { text: string };

export interface SelectTransition<T> {
  state: SelectState;
  selected?: SelectItem<T>;
  cancelled?: boolean;
}

export interface InteractiveSelectOptions {
  title: string;
  hint?: string;
  pageSize?: number;
  input?: ReadStream;
  output?: WriteStream;
}

export function matchingSelectIndices<T>(items: SelectItem<T>[], query: string): number[] {
  const needle = query.trim().toLocaleLowerCase();
  return items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      if (!needle) return true;
      return `${item.label} ${item.description ?? ''}`.toLocaleLowerCase().includes(needle);
    })
    .map(({ index }) => index);
}

function selectableIndices<T>(items: SelectItem<T>[], query: string): number[] {
  return matchingSelectIndices(items, query).filter((index) => !items[index].disabled);
}

function nearestSelected<T>(items: SelectItem<T>[], query: string, preferred: number): number {
  const selectable = selectableIndices(items, query);
  if (!selectable.length) return -1;
  if (selectable.includes(preferred)) return preferred;
  return selectable[0];
}

/** Pure keyboard state machine used by the real TTY menu and its tests. */
export function reduceSelectState<T>(
  items: SelectItem<T>[],
  state: SelectState,
  key: SelectKey,
  pageSize = 12
): SelectTransition<T> {
  if (key === 'escape') return { state, cancelled: true };
  if (key === 'enter') {
    const item = items[state.selected];
    return item && !item.disabled ? { state, selected: item } : { state };
  }

  if (key === 'backspace' || typeof key === 'object') {
    const query =
      key === 'backspace' ? [...state.query].slice(0, -1).join('') : state.query + key.text;
    return { state: { query, selected: nearestSelected(items, query, state.selected) } };
  }

  const selectable = selectableIndices(items, state.query);
  if (!selectable.length) return { state: { ...state, selected: -1 } };
  const currentPosition = Math.max(0, selectable.indexOf(state.selected));
  let nextPosition = currentPosition;
  if (key === 'up') nextPosition = (currentPosition - 1 + selectable.length) % selectable.length;
  if (key === 'down') nextPosition = (currentPosition + 1) % selectable.length;
  if (key === 'pageup') nextPosition = Math.max(0, currentPosition - pageSize);
  if (key === 'pagedown')
    nextPosition = Math.min(selectable.length - 1, currentPosition + pageSize);
  if (key === 'home') nextPosition = 0;
  if (key === 'end') nextPosition = selectable.length - 1;
  return { state: { ...state, selected: selectable[nextPosition] } };
}

function visibleWindow<T>(items: SelectItem<T>[], state: SelectState, pageSize: number): number[] {
  const matches = matchingSelectIndices(items, state.query);
  if (matches.length <= pageSize) return matches;
  const selectedPosition = Math.max(0, matches.indexOf(state.selected));
  const start = Math.max(
    0,
    Math.min(selectedPosition - Math.floor(pageSize / 2), matches.length - pageSize)
  );
  return matches.slice(start, start + pageSize);
}

function keyFromReadline(text: string, key: readline.Key): SelectKey | null {
  if (key.ctrl && key.name === 'c') return 'escape';
  if (key.name === 'up' || key.name === 'down') return key.name;
  if (key.name === 'pageup' || key.name === 'pagedown') return key.name;
  if (key.name === 'home' || key.name === 'end') return key.name;
  if (key.name === 'return' || key.name === 'enter') return 'enter';
  if (key.name === 'escape') return 'escape';
  if (key.name === 'backspace' || key.name === 'delete') return 'backspace';
  if (!key.ctrl && !key.meta && text && [...text].every((character) => character >= ' ')) {
    return { text };
  }
  return null;
}

/**
 * Real terminal selector: arrows move, Enter chooses, Escape cancels, typing
 * filters, and PageUp/PageDown/Home/End handle large provider catalogs.
 */
export async function interactiveSelect<T>(
  items: SelectItem<T>[],
  options: InteractiveSelectOptions
): Promise<SelectItem<T> | null> {
  const input = options.input ?? (process.stdin as ReadStream);
  const output = options.output ?? (process.stdout as WriteStream);
  if (!input.isTTY || !output.isTTY || typeof input.setRawMode !== 'function') {
    throw new Error('Interactive selection requires a TTY');
  }
  if (!items.some((item) => !item.disabled)) return null;

  const pageSize = Math.max(4, options.pageSize ?? Math.min(14, (output.rows ?? 24) - 7));
  let state: SelectState = {
    selected: nearestSelected(items, '', 0),
    query: '',
  };
  let renderedLines = 0;
  const wasRaw = input.isRaw;
  // A dormant stdin reports readableFlowing as null/false. Resume it only for
  // the menu, then return it to a paused state so a completed selection does
  // not keep an otherwise-finished CLI process alive. Preserve an input stream
  // that was already flowing for callers embedding the selector.
  const shouldPauseOnFinish = input.readableFlowing !== true;

  readline.emitKeypressEvents(input);
  input.setRawMode(true);
  input.resume();
  output.write('\x1b[?25l');

  const render = (): void => {
    if (renderedLines > 0) output.write(`\x1b[${renderedLines}A\r\x1b[0J`);
    const matches = matchingSelectIndices(items, state.query);
    const visible = visibleWindow(items, state, pageSize);
    const lines = [
      `\x1b[1m${options.title}\x1b[0m`,
      `\x1b[2m${options.hint ?? '↑/↓ move · Enter select · type to filter · Esc cancel'}\x1b[0m`,
      state.query ? `Filter: \x1b[36m${state.query}\x1b[0m` : 'Filter: \x1b[2m(all)\x1b[0m',
    ];
    if (!visible.length) lines.push('  \x1b[33mNo matching entries\x1b[0m');
    for (const index of visible) {
      const item = items[index];
      const active = index === state.selected;
      const marker = active ? '\x1b[36m❯\x1b[0m' : ' ';
      const label = item.disabled
        ? `\x1b[2m${item.label} (unavailable)\x1b[0m`
        : active
          ? `\x1b[36m${item.label}\x1b[0m`
          : item.label;
      lines.push(
        `${marker} ${label}${item.description ? `  \x1b[2m${item.description}\x1b[0m` : ''}`
      );
    }
    if (matches.length > visible.length) {
      lines.push(
        `\x1b[2m  ${visible.length} of ${matches.length} shown · PageUp/PageDown to jump\x1b[0m`
      );
    }
    output.write(`${lines.join('\n')}\n`);
    renderedLines = lines.length;
  };

  render();
  return new Promise((resolve) => {
    const finish = (selection: SelectItem<T> | null): void => {
      input.off('keypress', onKeypress);
      input.setRawMode(Boolean(wasRaw));
      if (shouldPauseOnFinish) input.pause();
      output.write(`\x1b[${renderedLines}A\r\x1b[0J\x1b[?25h`);
      resolve(selection);
    };
    const onKeypress = (text: string, key: readline.Key): void => {
      const normalized = keyFromReadline(text, key);
      if (!normalized) return;
      const transition = reduceSelectState(items, state, normalized, pageSize);
      state = transition.state;
      if (transition.cancelled) return finish(null);
      if (transition.selected) return finish(transition.selected);
      render();
    };
    input.on('keypress', onKeypress);
  });
}
